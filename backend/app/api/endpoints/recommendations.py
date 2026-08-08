from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.agents.recommendation_agent import recommendation_agent
from app.ml.datasets import PRODUCTS_DATABASE, FREQUENTLY_BOUGHT_TOGETHER

router = APIRouter()

class FeedRequest(BaseModel):
    intent_type: str = "CASUAL_DISCOVERY"
    intent_score: float = 0.85
    clickstream_history: List[str] = []

@router.post("/feed")
def get_personalized_feed(payload: FeedRequest):
    intent_payload = {
        "intent_type": payload.intent_type,
        "intent_score": payload.intent_score
    }
    return recommendation_agent.generate_personalized_feed(
        intent_payload=intent_payload,
        user_clickstream_history=payload.clickstream_history,
        products_db=PRODUCTS_DATABASE,
        frequently_bought_together=FREQUENTLY_BOUGHT_TOGETHER
    )

@router.get("/complete-the-look/{product_id}")
def get_complete_the_look(product_id: str):
    return recommendation_agent.get_complete_the_look(product_id)

@router.get("/frequently-bought-together/{product_id}")
def get_frequently_bought_together(product_id: str):
    return recommendation_agent.get_frequently_bought_together(product_id)
