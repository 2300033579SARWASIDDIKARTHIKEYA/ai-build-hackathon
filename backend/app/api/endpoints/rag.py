"""
RAG Chat endpoints for ALGUD AI Shopping Assistant.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from app.ml.rag import rag_pipeline


class ChatResponse(BaseModel):
    query: str
    answer: str
    retrieved_products: List[Dict[str, Any]]
    model: str


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    top_k: int = Field(4, ge=1, le=10)
    category_filter: Optional[str] = None
    chat_history: Optional[List[Dict[str, str]]] = None


router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def rag_chat(request: ChatRequest):
    try:
        result = rag_pipeline.chat(
            query=request.query,
            top_k=request.top_k,
            category_filter=request.category_filter,
            chat_history=request.chat_history,
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG chat failed: {str(e)}")
