# app/keyword_retriever.py
from typing import List, Dict
from sqlalchemy import text
from sqlalchemy.orm import Session

class KeywordRetriever:
    def __init__(self, db: Session):
        self.db = db

    def search(self, query: str, filter: Dict[str, any], k: int = 8) -> List[Dict]:
        """
        Simple LIKE-based fallback retrieval.
        """
        q = f"%{query.lower()}%"
        sql = text("""
            SELECT chunk_text
            FROM knowledge_chunks
            WHERE LOWER(chunk_text) LIKE :q
              AND (metadata->>'type') = :type
            LIMIT :k
        """)
        rows = self.db.execute(sql, {"q": q, "type": filter.get("type", "schema"), "k": k}).fetchall()
        return [{"chunk_text": r[0]} for r in rows]
