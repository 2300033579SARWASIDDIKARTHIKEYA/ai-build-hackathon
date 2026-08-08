from fastapi import APIRouter
from app.agents.business_intelligence_agent import business_intelligence_agent

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics():
    return business_intelligence_agent.generate_dashboard_analytics()
