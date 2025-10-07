from fastapi import APIRouter, HTTPException, Depends, Body, Header
from typing import List, Dict, Optional, Any
from services.assistant_service import handle_user_query, _schema_slices_from_models
from database import get_db
from sqlalchemy.orm import Session
from services.pgvector_retriever import PgVectorRetriever
from services.retriever import _chunk_text
from schemas import IngestBody

router = APIRouter(prefix="/assistant", tags=["Assistant"])


def get_current_user(x_user_id: Optional[str] = Header(None), x_user_role: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Simple header-based user identification for demo. In production use OAuth/JWT.
    Expects headers: X-User-Id and X-User-Role (student|admin)
    """
    if not x_user_id or not x_user_role:
        raise HTTPException(status_code=401, detail="Missing X-User-Id or X-User-Role headers")
    return {"id": int(x_user_id), "role": x_user_role}


@router.post("/chat")
def chat(
    text: str = Body(..., embed=True, example="Find me a 3-credit humanities course on Friday afternoon that doesn't clash with my major."),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Accepts a single `text` string from the user and returns structured result including LLM reply.
    Uses simple header auth to determine user role.
    """
    try:
        res = handle_user_query(db, user, text)
        return res
    except RuntimeError as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Assistant error: " + str(e))


@router.post("/knowledge/ensure_schema")
def ensure_knowledge_schema(
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user),
):
    if (user.get("role") or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    try:
        PgVectorRetriever(db).ensure_schema()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge/seed_schema")
def seed_schema_docs(
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user),
):
    if (user.get("role") or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    try:
        PgVectorRetriever(db).ensure_schema()
        tables = [
            "students",
            "faculty",
            "courses",
            "enrollments",
            "timeslots",
            "classrooms",
            "disruptions",
            "optimization_results",
        ]
        schema_sections = _schema_slices_from_models(tables)
        schema_text = "\n\n".join(schema_sections)
        pr = PgVectorRetriever(db)
        doc_id_schema = pr.ingest(
            title="SAT-YUG Schema Overview",
            source="schema:auto",
            chunks=[schema_text],
            role_visibility=None,
        )
        sample_queries = (
            "Natural language to data examples:\n"
            "- List 5 courses with 3 credits in semester 5.\n"
            "- Show timetable for student id=1 on Monday.\n"
            "- Find classrooms with capacity > 60.\n\n"
            "Natural language to doc examples:\n"
            "- What is the workload cap policy for visiting faculty?\n"
            "- How do electives selection rules work?\n"
        )
        doc_id_samples = pr.ingest(
            title="Sample Queries",
            source="samples:auto",
            chunks=[sample_queries],
            role_visibility=None,
        )
        return {"ok": True, "schema_document_id": doc_id_schema, "samples_document_id": doc_id_samples}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge/ingest_file")
def ingest_file(
    path: str = Body(..., embed=True),
    title: str = Body(None, embed=True),
    role_visibility: Optional[str] = Body(None, embed=True),
    chunk_size: int = Body(500, embed=True),
    overlap: int = Body(100, embed=True),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user),
):
    if (user.get("role") or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        chunks = _chunk_text(text, chunk_size=chunk_size, overlap=overlap)
        pr = PgVectorRetriever(db)
        doc_id = pr.ingest(
            title=title or path,
            source=path,
            chunks=chunks,
            role_visibility=role_visibility,
        )
        return {"ok": True, "document_id": doc_id, "chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge/ingest_dir")
def ingest_directory(
    directory: str = Body(..., embed=True),
    role_visibility: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user),
):
    if (user.get("role") or "").lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    import os
    ingested = []
    for root, _, files in os.walk(directory):
        for fn in files:
            if not fn.lower().endswith((".md", ".txt")):
                continue
            path = os.path.join(root, fn)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
                chunks = _chunk_text(text)
                pr = PgVectorRetriever(db)
                doc_id = pr.ingest(title=fn, source=path, chunks=chunks, role_visibility=role_visibility)
                ingested.append({"path": path, "document_id": doc_id, "chunks": len(chunks)})
            except Exception as e:
                ingested.append({"path": path, "error": str(e)})
    return {"ok": True, "ingested": ingested}
