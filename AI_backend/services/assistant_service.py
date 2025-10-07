"""
assistant_service.py
SAT-YUG Conversational AI Backend (RAG + SQL Agent)
----------------------------------------------------
Purpose:
Convert natural-language user queries into safe, schema-grounded
SQL queries executed against the SAT-YUG PostgreSQL database.
"""

import re
import json
import time
import logging
from difflib import get_close_matches
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from services.pgvector_retriever import PgVectorRetriever
from services.gemini_client import generate_chat_reply 
from services.keyword_retriever import KeywordRetriever
import models
  # <-- NEW simple BM25 or LIKE retriever

# ------------------------------------------------------------
# Logging setup
# ------------------------------------------------------------
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# ------------------------------------------------------------
# Canonical SAT-YUG Schema
# ------------------------------------------------------------
SCHEMA = {
    "students": ["id", "name", "roll_number", "email", "year", "branch"],
    "faculty": [
        "id", "name", "email", "expertise",
        "workload_cap", "current_workload", "available"
    ],
    "timeslots": ["id", "day", "start_time", "end_time"],
    "classrooms": ["id", "room_number", "capacity", "building", "resources"],
    "courses": [
        "id", "code", "name", "credits", "semester",
        "mandatory", "faculty_id", "timeslot_id",
        "classroom_id", "max_seats"
    ],
    "enrollments": ["id", "student_id", "course_id", "timestamp"],
    "disruptions": [
        "id", "course_id", "faculty_unavailable", "reason",
        "timestamp", "status", "resolved_by"
    ],
    "optimization_results": [
        "id", "disruption_id", "candidate_faculty_id",
        "score", "rank", "approved"
    ],
}

ALIASES = {
    "course_name": "courses.name",
    "course_code": "courses.code",
    "faculty_name": "faculty.name",
    "teacher": "faculty.name",
    "professor": "faculty.name",
    "room": "classrooms.room_number",
    "start": "timeslots.start_time",
    "end": "timeslots.end_time",
}

# ------------------------------------------------------------
# Alias map + fuzzy mapping
# ------------------------------------------------------------
def build_alias_map() -> Dict[str, List[str]]:
    alias_map = {}
    for t, cols in SCHEMA.items():
        for c in cols:
            canonical = f"{t}.{c}"
            alias_map.setdefault(c.lower(), []).append(canonical)
    for k, v in ALIASES.items():
        alias_map.setdefault(k.lower(), []).append(v)
    return alias_map

def fuzzy_map_field(term: str, alias_map: Dict[str, List[str]]) -> Optional[str]:
    tkey = term.lower().strip()
    if tkey in alias_map:
        return alias_map[tkey][0]
    matches = get_close_matches(tkey, alias_map.keys(), n=1, cutoff=0.75)
    if matches:
        return alias_map[matches[0]][0]
    return None

ALIAS_MAP = build_alias_map()

# ------------------------------------------------------------
# LLM Prompt Template
# ------------------------------------------------------------
QUERY_SPEC_PROMPT = """
You are a database assistant for the SAT-YUG system.
Your task is to convert the user's request into a JSON-only, safe, read-only query plan.

Rules:
1. Use ONLY the tables and columns listed in SCHEMA_SNIPPETS.
2. Do NOT invent or guess any field or table names.
3. Output valid JSON following this schema:
   {
     "model": "<table_name>",
     "fields": ["table.column", ...],  // You may include aggregate functions like COUNT(table.column), SUM(table.column), AVG(table.column), etc. if the user request requires them.
     "filters": {"table.column": "value"},
     "joins": [{"model": "<table>", "on": {"local.col": "foreign.col"}}],
     "limit": 50
   }
4. Restrict to SELECT queries only. Ignore create/update/delete requests.
5. Prefer fully qualified names (table.column).
6. Include "mapped_entities" to record user_term -> canonical mapping.
7. If a field cannot be found, add it to "unmapped_terms" instead of inventing.
8. Return only JSON (no prose).
"""

# ------------------------------------------------------------
# LLM Query-Spec Generator
# ------------------------------------------------------------
def ask_llm_for_query_spec(user_text: str, schema_snippets: List[str]) -> Dict[str, Any]:
    schema_context = "\nSCHEMA_SNIPPETS:\n" + "\n".join(schema_snippets)
    messages = [
        {"role": "system", "content": QUERY_SPEC_PROMPT + schema_context},
        {"role": "user", "content": user_text},
    ]
    resp = generate_chat_reply(messages, max_output_tokens=2048)
    try:
        return json.loads(resp)
    except Exception:
        match = re.search(r"\{.*\}", resp, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError(f"Invalid JSON from LLM: {resp}")

# ------------------------------------------------------------
# Spec Normalization + Validation (with aggregates)
# ------------------------------------------------------------
def normalize_and_validate_spec(spec: Dict[str, Any]) -> Dict[str, Any]:
    audit = {"mapped": {}, "unmapped": []}
    normalized = spec.copy()
    allowed_funcs = {"count", "sum", "avg", "min", "max"}

    # Validate model
    model = normalized.get("model")
    if model not in SCHEMA:
        matches = get_close_matches(model, list(SCHEMA.keys()), n=1, cutoff=0.7)
        if matches:
            normalized["model"] = matches[0]
            audit["mapped"][model] = matches[0]
        else:
            raise ValueError(f"Unknown table: {model}")

    # Helpers for field/function parsing with table-aware constraints
    def _canonicalize_col(col: str, allowed_tables: Optional[List[str]] = None) -> Optional[str]:
        base_model = normalized['model']
        if "." in col:
            t, _, c = col.partition(".")
            t = t.strip()
            c = c.strip()
            # Only allow columns from declared tables
            if allowed_tables and t not in allowed_tables:
                return None
            # Fuzzy map the column name but keep the same table
            if t not in SCHEMA:
                return None
            # Strict within-table mapping
            if c in SCHEMA[t]:
                return f"{t}.{c}"
            # try alias only when it maps to same table
            alias = ALIASES.get(f"{t}.{c}".lower())
            if alias and alias.startswith(f"{t}."):
                return alias
            # fuzzy within table
            match = get_close_matches(c.lower(), [colname.lower() for colname in SCHEMA[t]], n=1, cutoff=0.8)
            if match:
                # recover original case by lookup
                for real in SCHEMA[t]:
                    if real.lower() == match[0]:
                        return f"{t}.{real}"
            return None
        # No table provided → assume base model
        c = col.strip()
        if c in SCHEMA[base_model]:
            return f"{base_model}.{c}"
        alias = ALIASES.get(f"{base_model}.{c}".lower())
        if alias and alias.startswith(f"{base_model}."):
            return alias
        match = get_close_matches(c.lower(), [colname.lower() for colname in SCHEMA[base_model]], n=1, cutoff=0.85)
        if match:
            for real in SCHEMA[base_model]:
                if real.lower() == match[0]:
                    return f"{base_model}.{real}"
        return None

    def _is_func(expr: str) -> bool:
        return bool(re.match(r"^[A-Za-z]+\s*\(.*\)$", expr))

    def _normalize_func(expr: str) -> Optional[str]:
        m = re.match(r"^([A-Za-z]+)\s*\((.*)\)$", expr)
        if not m:
            return None
        func = m.group(1).lower()
        arg = m.group(2).strip()
        if func not in allowed_funcs:
            return None
        if arg == "*":
            return f"{func.upper()}(*)"
        can = _canonicalize_col(arg)
        if not can:
            return None
        # Validate existence
        t, _, c = can.partition(".")
        if t not in SCHEMA or c not in SCHEMA[t]:
            return None
        return f"{func.upper()}({can})"

    # Determine allowed tables (base + any explicitly joined)
    declared_joins = normalized.get("joins") or []
    allowed_tables = [normalized['model']] + [j.get('model') for j in declared_joins if isinstance(j, dict) and j.get('model') in SCHEMA]

    # Normalize fields (allow aggregates); prune fields from non-joined tables
    new_fields: List[str] = []
    for f in normalized.get("fields", []):
        f_str = f.strip()
        if _is_func(f_str):
            normf = _normalize_func(f_str)
            if not normf:
                audit["unmapped"].append(f_str)
            else:
                new_fields.append(normf)
        else:
            can = _canonicalize_col(f_str, allowed_tables=allowed_tables)
            if not can:
                audit["unmapped"].append(f_str)
            else:
                # Validate existence
                t, _, c = can.partition(".")
                if t not in SCHEMA or c not in SCHEMA[t]:
                    audit["unmapped"].append(f_str)
                else:
                    new_fields.append(can)
                    if can != f_str:
                        audit["mapped"][f_str] = can
    # Fallback: safe default fields for base model
    if not new_fields:
        fallback = SCHEMA[normalized['model']]
        default_subset = [col for col in fallback if col in ("id", "code", "name")]
        if not default_subset:
            default_subset = fallback[:3]
        new_fields = [f"{normalized['model']}.{c}" for c in default_subset]
    normalized["fields"] = new_fields

    # Normalize filters
    new_filters = {}
    for k, v in normalized.get("filters", {}).items():
        if "." not in k:
            k = f"{normalized['model']}.{k}"
        canonical = ALIASES.get(k.lower()) or fuzzy_map_field(k, ALIAS_MAP)
        if not canonical:
            audit["unmapped"].append(k)
        else:
            new_filters[canonical] = v
            if canonical != k:
                audit["mapped"][k] = canonical
    normalized["filters"] = new_filters

    # Validate existence
    for f in [x for x in new_fields if "." in x and not _is_func(x)] + list(new_filters.keys()):
        t, _, c = f.partition(".")
        if t not in SCHEMA or c not in SCHEMA[t]:
            raise ValueError(f"Invalid field: {f}")

    # Normalize optional group_by
    group_by: List[str] = []
    for g in normalized.get("group_by", []) or []:
        can = _canonicalize_col(g)
        if can:
            t, _, c = can.partition(".")
            if t in SCHEMA and c in SCHEMA[t]:
                group_by.append(can)
            else:
                audit["unmapped"].append(g)
        else:
            audit["unmapped"].append(g)
    if group_by:
        normalized["group_by"] = group_by

    # Normalize optional order_by (list of strings, allow function or column)
    order_by: List[str] = []
    for ob in normalized.get("order_by", []) or []:
        ob_s = ob.strip()
        if _is_func(ob_s):
            nob = _normalize_func(ob_s)
            if nob:
                order_by.append(nob)
            else:
                audit["unmapped"].append(ob_s)
        else:
            can = _canonicalize_col(ob_s)
            if can:
                order_by.append(can)
            else:
                audit["unmapped"].append(ob_s)
    if order_by:
        normalized["order_by"] = order_by

    normalized["audit"] = audit
    return normalized

# ------------------------------------------------------------
# Safe SQL Execution
# ------------------------------------------------------------
def execute_spec(db: Session, spec: Dict[str, Any]) -> Dict[str, Any]:
    base_table = spec["model"]
    fields_list = list(spec["fields"])
    # Auto GROUP BY when aggregates are mixed with plain columns
    def _is_agg(expr: str) -> bool:
        return bool(re.match(r"^[A-Za-z]+\s*\(.*\)$", expr.strip()))
    has_agg = any(_is_agg(f) for f in fields_list)
    non_agg_cols = [f for f in fields_list if not _is_agg(f) and "." in f]
    if has_agg and non_agg_cols and not spec.get("group_by"):
        spec["group_by"] = non_agg_cols
    fields = ", ".join(fields_list)
    sql = f"SELECT {fields} FROM {base_table}"

    # Joins
    for j in spec.get("joins", []):
        jt = j["model"]
        on = " AND ".join([f"{lk} = {rk}" for lk, rk in j["on"].items()])
        sql += f" JOIN {jt} ON {on}"

    # Filters
    params = {}
    where_clauses = []
    for i, (k, v) in enumerate(spec["filters"].items()):
        pname = f"p{i}"
        where_clauses.append(f"{k} = :{pname}")
        params[pname] = v
    if where_clauses:
        sql += " WHERE " + " AND ".join(where_clauses)

    # GROUP BY
    if spec.get("group_by"):
        sql += " GROUP BY " + ", ".join(spec["group_by"])

    # ORDER BY
    if spec.get("order_by"):
        sql += " ORDER BY " + ", ".join(spec["order_by"])

    sql += f" LIMIT {spec.get('limit', 50)}"
    result = db.execute(text(sql), params).fetchall()
    rows = [dict(r._mapping) for r in result]
    return {"sql": sql, "rows": rows, "count": len(rows)}

# ------------------------------------------------------------
# Hybrid Retrieval (Dense + Keyword)
# ------------------------------------------------------------
def hybrid_schema_retrieval(db: Session, user_text: str, top_k: int = 8) -> List[str]:
    """
    Combine dense (vector) retrieval and keyword retrieval
    to collect schema snippets for grounding the LLM.
    """
    vector_retriever = PgVectorRetriever(db)
    keyword_retriever = KeywordRetriever(db)

    dense_hits = vector_retriever.search(user_text, filter={"type": "schema"}, k=top_k)
    keyword_hits = keyword_retriever.search(user_text, filter={"type": "schema"}, k=top_k)

    # Deduplicate by table name or chunk_id
    def extract_text(hit):
        if isinstance(hit, dict):
            return hit.get("chunk_text") or hit.get("text", "")
        return str(hit)

    dense_texts = [extract_text(h) for h in dense_hits]
    keyword_texts = [extract_text(h) for h in keyword_hits]

    # Merge with preference to dense but include unique keyword ones
    combined = dense_texts[:]
    for t in keyword_texts:
        if not any(t[:50] in x for x in combined):
            combined.append(t)
    return combined[:top_k]

# ------------------------------------------------------------
# Main Endpoint Function
# ------------------------------------------------------------
def handle_user_query(db: Session, user: Dict[str, Any], text: str) -> Dict[str, Any]:
    """
    Conversational AI endpoint core handler.
    """

    # 1️⃣ Retrieve schema context via hybrid retrieval
    schema_snippets = hybrid_schema_retrieval(db, text)
    if not schema_snippets:
        schema_snippets = [f"{t}: {', '.join(cols)}" for t, cols in SCHEMA.items()]

    # 2️⃣ Ask LLM for structured query spec
    try:
        spec = ask_llm_for_query_spec(text, schema_snippets)
    except Exception as e:
        logger.error(f"LLM query spec error: {e}")
        return {"status": "error", "message": f"Failed to parse LLM output: {e}"}

    # 3️⃣ Normalize + Validate
    try:
        normalized_spec = normalize_and_validate_spec(spec)
    except Exception as e:
        logger.error(f"Spec validation error: {e}")
        return {"status": "error", "message": f"Invalid spec: {e}", "raw_spec": spec}

    # 4️⃣ Execute SQL safely
    try:
        results = execute_spec(db, normalized_spec)
    except Exception as e:
        logger.error(f"SQL execution error: {e}")
        return {"status": "error", "message": f"Execution failed: {e}", "sql": normalized_spec}

    # 5️⃣ Natural-language summary
    summary_prompt = f"""
    You are a summarizer. Describe the following SQL result in two or three concise sentences:
    {results['rows']}
    """
    nl_summary = generate_chat_reply([{"role": "system", "content": summary_prompt}], max_output_tokens=1024)

    return {
        "status": "success",
        "final_answer": nl_summary,
        "sql": results["sql"],
        "rows": results["rows"],
        "audit": normalized_spec.get("audit", {}),
    }

def _schema_slices_from_models(tables: List[str]) -> List[str]:
    """Produce small textual summaries of selected tables/columns from SQLAlchemy models for RAG context."""
    registry: Dict[str, Any] = {
        "students": models.Student,
        "faculty": models.Faculty,
        "courses": models.Course,
        "enrollments": models.Enrollment,
        "timeslots": models.TimeSlot,
        "classrooms": models.Classroom,
        "disruptions": models.DisruptionLog,
        "optimization_results": models.OptimizationResult,
    }
    out: List[str] = []
    for t in tables:
        M = registry.get(t)
        if not M:
            continue
        fields = []
        for attr in dir(M):
            if attr.startswith("_"):
                continue
            try:
                col = getattr(M, attr)
                # crude check: SQLAlchemy Instrumented attributes have 'property' attr
                if hasattr(col, "property"):
                    fields.append(attr)
            except Exception:
                continue
        out.append(f"Table {t}: columns={', '.join(sorted(set(fields)))}")
    return out