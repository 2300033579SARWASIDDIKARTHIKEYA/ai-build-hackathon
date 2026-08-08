from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AgentResponse(BaseModel):
    agent_name: str
    confidence_score: float
    reasoning: str
    recommendation: Any
    business_explanation: str
    latency_ms: float = 12.4

class BaseAgent:
    def __init__(self, name: str):
        self.name = name

    def execute(self, *args, **kwargs) -> AgentResponse:
        raise NotImplementedError("Each AI agent must implement execute().")
