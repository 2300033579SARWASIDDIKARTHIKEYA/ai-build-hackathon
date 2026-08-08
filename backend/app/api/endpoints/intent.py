from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.agents.user_intent_agent import user_intent_agent

router = APIRouter()

class IntentRequest(BaseModel):
    clickstream: List[Dict[str, Any]] = []
    session_duration_sec: int = 120
    cart_count: int = 0

@router.post("/predict")
def predict_intent(payload: IntentRequest):
    agent_res = user_intent_agent.execute(
        clickstream=payload.clickstream,
        session_duration_sec=payload.session_duration_sec,
        cart_count=payload.cart_count
    )
    return agent_res
