from typing import List, Tuple, Optional, Dict, Any
import json
from sqlalchemy.orm import Session
from sqlalchemy import text, bindparam
from services.embeddings import embed_texts


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id bigserial primary key,
  title text,
  source text,
  role_visibility text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id bigserial primary key,
  document_id bigint references knowledge_documents(id) on delete cascade,
  chunk_text text not null,
  metadata jsonb,
  embedding vector(768)
);
"""


class PgVectorRetriever:
    def __init__(self, db: Session) -> None:
        self.db = db

    def ensure_schema(self) -> None:
        # Requires pgvector extension enabled in Supabase: CREATE EXTENSION IF NOT EXISTS vector;
        self.db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        for stmt in SCHEMA_SQL.strip().split(";\n\n"):
            s = stmt.strip()
            if s:
                self.db.execute(text(s))
        self.db.commit()

    def ingest(self, title: str, source: str, chunks: List[str], role_visibility: Optional[str] = None, metadata_list: Optional[List[dict]] = None) -> int:
        if metadata_list is None:
            metadata_list = [{} for _ in chunks]
        vecs = embed_texts(chunks)
        doc_id = self.db.execute(
            text("INSERT INTO knowledge_documents(title, source, role_visibility) VALUES (:t,:s,:r) RETURNING id"),
            {"t": title, "s": source, "r": role_visibility},
        ).scalar_one()

        for chunk, meta, vec in zip(chunks, metadata_list, vecs):
            m_json = json.dumps(meta or {})
            e_str = "[" + ",".join(str(x) for x in vec) + "]"
            stmt = text(
                "INSERT INTO knowledge_chunks(document_id, chunk_text, metadata, embedding) "
                "VALUES (:d, :c, CAST(:m AS jsonb), CAST(:e AS vector))"
            ).bindparams(
                bindparam("d"),
                bindparam("c"),
                bindparam("m"),
                bindparam("e"),
            )
            self.db.execute(stmt, {"d": doc_id, "c": chunk, "m": m_json, "e": e_str})
        self.db.commit()
        return int(doc_id)

    def search(self, query: str, k: int = 6, role_visibility: Optional[str] = None, filter: Optional[Dict[str, Any]] = None) -> List[Tuple[str, str, float]]:
        qvec = embed_texts([query])[0]
        q_str = "[" + ",".join(str(x) for x in qvec) + "]"
        params = {"q": q_str, "k": k}
        ftype = None
        if isinstance(filter, dict):
            ftype = filter.get("type")
        sql = """
        SELECT d.source, c.chunk_text, 1 - (c.embedding <=> CAST(:q AS vector)) AS score
        FROM knowledge_chunks c
        JOIN knowledge_documents d ON d.id = c.document_id
        WHERE (:role IS NULL OR d.role_visibility IS NULL OR d.role_visibility = :role)
          AND (:ftype IS NULL OR c.metadata->>'type' = :ftype)
        ORDER BY c.embedding <=> CAST(:q AS vector)
        LIMIT :k
        """
        if role_visibility is None:
            params["role"] = None
        else:
            params["role"] = role_visibility
        params["ftype"] = ftype
        rows = self.db.execute(text(sql), params).fetchall()
        return [(r[0], r[1], float(r[2])) for r in rows]


