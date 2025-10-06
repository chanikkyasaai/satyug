from fastapi import APIRouter, HTTPException, Depends, Body, Header
from typing import List, Dict, Optional, Any
from services.assistant_service import handle_user_query
from database import get_db
from sqlalchemy.orm import Session

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
