from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.agents.search_agent import search_agent

router = APIRouter()

class TextSearchRequest(BaseModel):
    query: str
    category_filter: Optional[str] = None

class VisualSearchRequest(BaseModel):
    image_url_or_base64: str

@router.post("/text")
def search_text(payload: TextSearchRequest):
    return search_agent.execute_text_search(
        query=payload.query,
        category_filter=payload.category_filter
    )

@router.post("/visual")
def search_visual(payload: VisualSearchRequest):
    return search_agent.execute_visual_search(
        image_input=payload.image_url_or_base64
    )
