from fastapi import APIRouter
from app.agents.product_intelligence_agent import product_intelligence_agent
from app.ml.datasets import PRODUCTS_DATABASE

router = APIRouter()

@router.get("/catalog")
def get_full_catalog():
    return PRODUCTS_DATABASE

@router.get("/analyze/{product_id}")
def analyze_product(product_id: str):
    return product_intelligence_agent.analyze_product(product_id)
