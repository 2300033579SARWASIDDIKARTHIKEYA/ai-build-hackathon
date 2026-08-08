"""
ROI Calculator and Business Impact Metrics.
"""
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime


@dataclass
class BusinessMetrics:
    baseline_ctr: float = 0.042
    baseline_conversion_rate: float = 0.033
    baseline_aov_inr: float = 12750.0
    monthly_active_users: int = 100000
    recommendations_per_session: int = 12
    current_ctr: float = 0.0525
    current_conversion_rate: float = 0.03795
    current_aov_inr: float = 14280.0
    infra_cost_monthly_inr: float = 15000.0
    ml_compute_cost_monthly_inr: float = 25000.0
    engineering_cost_monthly_inr: float = 50000.0

    def compute_kpis(self) -> Dict:
        monthly_sessions = self.monthly_active_users * 3.5
        impressions = monthly_sessions * self.recommendations_per_session
        baseline_clicks = impressions * self.baseline_ctr
        current_clicks = impressions * self.current_ctr
        additional_clicks = current_clicks - baseline_clicks
        baseline_conversions = baseline_clicks * self.baseline_conversion_rate
        current_conversions = current_clicks * self.current_conversion_rate
        additional_conversions = current_conversions - baseline_conversions
        baseline_revenue = baseline_conversions * self.baseline_aov_inr
        current_revenue = current_conversions * self.current_aov_inr
        additional_revenue = current_revenue - baseline_revenue
        total_cost = self.infra_cost_monthly_inr + self.ml_compute_cost_monthly_inr + self.engineering_cost_monthly_inr
        roi = ((additional_revenue - total_cost) / total_cost * 100) if total_cost > 0 else 0.0
        return {
            "monthly_sessions_est": round(monthly_sessions, 0),
            "monthly_impressions": round(impressions, 0),
            "ctr": round(self.current_ctr * 100, 2),
            "ctr_lift_pct": round((self.current_ctr - self.baseline_ctr) / self.baseline_ctr * 100, 1),
            "conversion_rate": round(self.current_conversion_rate * 100, 2),
            "conversion_rate_lift_pct": round((self.current_conversion_rate - self.baseline_conversion_rate) / self.baseline_conversion_rate * 100, 1),
            "aov_inr": round(self.current_aov_inr, 0),
            "aov_lift_pct": round((self.current_aov_inr - self.baseline_aov_inr) / self.baseline_aov_inr * 100, 1),
            "baseline_monthly_revenue_inr": round(baseline_revenue, 0),
            "current_monthly_revenue_inr": round(current_revenue, 0),
            "additional_monthly_revenue_inr": round(additional_revenue, 0),
            "total_monthly_cost_inr": round(total_cost, 0),
            "roi_pct": round(roi, 1),
            "payback_period_months": round(total_cost / (additional_revenue / 30), 1) if additional_revenue > 0 else None,
            "cost_per_transaction_inr": round(total_cost / current_conversions, 2) if current_conversions > 0 else 0.0,
            "cost_per_click_inr": round(total_cost / current_clicks, 2) if current_clicks > 0 else 0.0,
            "cost_per_impression_inr": round(total_cost / impressions, 4) if impressions > 0 else 0.0,
        }

    def compute_funnel(self, total_visitors: int = 100000) -> Dict:
        impressions = total_visitors * self.recommendations_per_session
        clicks = impressions * self.current_ctr
        add_to_carts = clicks * 0.18
        purchases = clicks * self.current_conversion_rate
        return {
            "funnel_stages": [
                {"stage": "Recommendations Served", "count": round(impressions, 0), "pct_of_previous": 100.0},
                {"stage": "Clicks", "count": round(clicks, 0), "pct_of_previous": round(self.current_ctr * 100, 2)},
                {"stage": "Add to Cart", "count": round(add_to_carts, 0), "pct_of_previous": round(18.0, 2)},
                {"stage": "Purchases", "count": round(purchases, 0), "pct_of_previous": round(self.current_conversion_rate / self.current_ctr * 100, 2)},
            ],
            "overall_conversion_pct": round(purchases / impressions * 100, 4),
            "click_to_cart_pct": round(add_to_carts / clicks * 100, 2),
            "cart_to_purchase_pct": round(purchases / add_to_carts * 100, 2),
        }

    def forecast_revenue(self, months: int = 6, monthly_growth_pct: float = 5.0) -> List[Dict]:
        forecast = []
        cumulative_revenue = 0.0
        monthly_sessions = self.monthly_active_users * 3.5
        current_revenue_monthly = monthly_sessions * self.recommendations_per_session * self.current_ctr * self.current_conversion_rate * self.current_aov_inr
        for m in range(1, months + 1):
            growth_factor = (1 + monthly_growth_pct / 100) ** m
            month_revenue = current_revenue_monthly * growth_factor
            cumulative_revenue += month_revenue
            forecast.append({
                "month": m,
                "projected_revenue_inr": round(month_revenue, 0),
                "cumulative_revenue_inr": round(cumulative_revenue, 0),
                "additional_vs_baseline_inr": round(month_revenue - monthly_sessions * self.recommendations_per_session * self.baseline_ctr * self.baseline_conversion_rate * self.baseline_aov_inr, 0),
            })
        return forecast


roi_calculator = BusinessMetrics()
