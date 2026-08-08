"""
ROI and Business Impact endpoints.
"""
from fastapi import APIRouter
from app.ml.roi_calculator import roi_calculator
from app.ml.ab_testing import ab_test_manager

router = APIRouter()


@router.get("/kpis")
def get_business_kpis():
    return roi_calculator.compute_kpis()


@router.get("/funnel")
def get_funnel(total_visitors: int = 100000):
    return roi_calculator.compute_funnel(total_visitors)


@router.get("/forecast")
def get_forecast(months: int = 6, monthly_growth_pct: float = 5.0):
    return roi_calculator.forecast_revenue(months, monthly_growth_pct)


@router.get("/ab-tests")
def get_ab_tests():
    return ab_test_manager.summary()


@router.post("/ab-tests/{experiment_id}/record")
def record_ab_event(experiment_id: str, variant_id: str, converted: bool = False, revenue: float = 0.0):
    ab_test_manager.record(experiment_id, variant_id, converted, revenue)
    return {"status": "recorded", "experiment_id": experiment_id, "variant_id": variant_id}
