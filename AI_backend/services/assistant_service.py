from typing import Dict, Any, List, Optional
import json
import re
from sqlalchemy.orm import Session
import models
from services.gemini_client import generate_chat_reply


QUERY_SPEC_INSTRUCTIONS = (
    "You are given a user request and must output a JSON object (only) describing a safe database query spec. "
    "The spec keys: 'model' (one of students, faculty, courses, enrollments, timeslots, classrooms, disruptions, optimization_results), "
    "optional 'filters' (dict field->value), optional 'fields' (list of fields to return), optional 'limit' (int). "
    "Do NOT include raw SQL, JOINs, or any instructions to leak sensitive fields like emails. Keep filters simple and only use fields that exist on the model. "
    "If the user asks for an action (create/update/delete), instead return {\"action\": \"none\"} because this assistant is read-only for now."
)

# JSON schema to constrain the LLM output for the query spec
QUERY_SPEC_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "model": {
            "type": "string",
            "enum": [
                "students",
                "faculty",
                "courses",
                "enrollments",
                "timeslots",
                "classrooms",
                "disruptions",
                "optimization_results",
            ],
        },
        "filters": {"type": "object", "additionalProperties": True},
        "fields": {"type": "array", "items": {"type": "string"}},
        "limit": {"type": "integer", "minimum": 1, "maximum": 200},
        "action": {"type": "string", "enum": ["none"]},
    },
    "required": ["model"],
    "additionalProperties": True,
}


def ask_llm_for_query_spec(user_role: str, text: str) -> Dict[str, Any]:
    # Ask the LLM to produce a JSON query spec using structured output when available
    sys_msg = "You are a tool that maps natural language requests to a JSON query specification for the SAT-YUG database."
    messages = [
        {"role": "system", "content": sys_msg},
        {"role": "system", "content": QUERY_SPEC_INSTRUCTIONS},
        {"role": "system", "content": (
            "Output JSON only. Do not include prose. The JSON must conform to this JSON Schema: "
            + json.dumps(QUERY_SPEC_JSON_SCHEMA)
        )},
        {"role": "user", "content": text},
    ]
    # Call LLM with higher output tokens budget to reduce truncation
    resp = generate_chat_reply(messages, max_output_tokens=1024)
    try:
        return json.loads(resp)
    except Exception:
        # Fallback: try to extract first JSON object
        try:
            m = re.search(r"\{.*\}", resp, flags=re.DOTALL)
            if m:
                return json.loads(m.group(0))
        except Exception:
            pass
        raise RuntimeError(f"LLM did not return a valid JSON query spec. Raw response: {resp}")


def validate_and_execute_spec(db: Session, spec: Dict[str, Any]) -> List[Dict[str, Any]]:
    # Basic validation
    allowed_models = {
        "students": models.Student,
        "faculty": models.Faculty,
        "courses": models.Course,
        "enrollments": models.Enrollment,
        "timeslots": models.TimeSlot,
        "classrooms": models.Classroom,
        "disruptions": models.DisruptionLog,
        "optimization_results": models.OptimizationResult,
    }
    model_name = spec.get("model")
    if not model_name or model_name not in allowed_models:
        raise ValueError("Invalid or missing model in spec")

    Model = allowed_models[model_name]
    q = db.query(Model)

    # Apply simple filters (equality only)
    filters = spec.get("filters") or {}
    for k, v in filters.items():
        if not hasattr(Model, k):
            raise ValueError(f"Invalid filter field: {k} for model {model_name}")
        q = q.filter(getattr(Model, k) == v)

    limit = int(spec.get("limit") or 50)
    rows = q.limit(limit).all()

    # Select fields
    fields = spec.get("fields")
    out = []
    for r in rows:
        row = {}
        if fields:
            for f in fields:
                if hasattr(r, f):
                    val = getattr(r, f)
                    # Avoid returning relationship objects; return their id or simple repr
                    if hasattr(val, "__class__") and not isinstance(val, (str, int, float, bool, type(None))):
                        # common pattern: timeslot/classroom/faculty are relationships
                        if hasattr(val, "id"):
                            row[f] = getattr(val, "id")
                        else:
                            row[f] = str(val)
                    else:
                        row[f] = val
        else:
            # Return a safe subset of fields: id, name/code, credits, semester, day/time when available
            for candidate in ("id","name","code","credits","semester","mandatory","faculty_id","timeslot_id","classroom_id"):
                if hasattr(r, candidate):
                    row[candidate] = getattr(r, candidate)
        out.append(row)
    return out


def build_final_prompt(user: Dict[str, Any], user_text: str, query_spec: Dict[str, Any], query_results: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    system_msg = (
        f"You are SAT-YUG assistant with access to query results. The user role is {user.get('role')} and id={user.get('id')}. "
        "Answer concisely, do not reveal private data such as emails or raw DB connection strings. When suggesting actions, be explicit about next API calls the user can make."
    )
    context = f"Query spec: {json.dumps(query_spec)}\n\nQuery results (first 50 rows):\n{json.dumps(query_results[:50], default=str, indent=2)}"
    messages = [
        {"role": "system", "content": system_msg},
        {"role": "system", "content": context},
        {"role": "user", "content": user_text},
    ]
    return messages


def handle_user_query(db: Session, user: Dict[str, Any], text: str) -> Dict[str, Any]:
    # Step 1: Ask LLM to produce a query spec
    spec = ask_llm_for_query_spec(user.get("role","unknown"), text)
    if spec.get("action") and spec.get("action") != "none":
        return {"error": "Action requests are not allowed via assistant (read-only)", "spec": spec}

    # Step 2: Validate and run spec
    results = validate_and_execute_spec(db, spec)

    # Step 3: Ask LLM to generate natural language answer using results
    messages = build_final_prompt(user, text, spec, results)
    answer = generate_chat_reply(messages)

    return {"spec": spec, "results": results, "answer": answer}

