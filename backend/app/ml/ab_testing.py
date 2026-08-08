"""
A/B Testing Framework with statistical significance testing.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
import math


@dataclass
class ExperimentVariant:
    variant_id: str
    name: str
    description: str
    metrics: List[str]
    sample_size: int = 0
    conversions: int = 0
    revenue: float = 0.0
    metadata: Dict = field(default_factory=dict)


@dataclass
class Experiment:
    experiment_id: str
    name: str
    description: str
    control: ExperimentVariant
    treatment: ExperimentVariant
    min_sample_size: int = 1000
    confidence_level: float = 0.95
    status: str = "running"
    created_at: datetime = field(default_factory=datetime.utcnow)

    def record_event(self, variant_id: str, converted: bool, revenue: float = 0.0):
        if variant_id == self.control.variant_id:
            v = self.control
        elif variant_id == self.treatment.variant_id:
            v = self.treatment
        else:
            return
        v.sample_size += 1
        v.revenue += revenue
        if converted:
            v.conversions += 1

    def conversion_rate(self, v: ExperimentVariant) -> float:
        return v.conversions / v.sample_size if v.sample_size > 0 else 0.0

    def average_order_value(self, v: ExperimentVariant) -> float:
        return v.revenue / v.sample_size if v.sample_size > 0 else 0.0

    def revenue_per_user(self, v: ExperimentVariant) -> float:
        return v.revenue / v.sample_size if v.sample_size > 0 else 0.0

    def lift(self) -> Dict:
        cr_c = self.conversion_rate(self.control)
        cr_t = self.conversion_rate(self.treatment)
        aov_c = self.average_order_value(self.control)
        aov_t = self.average_order_value(self.treatment)
        rpu_c = self.revenue_per_user(self.control)
        rpu_t = self.revenue_per_user(self.treatment)
        cr_lift = ((cr_t - cr_c) / cr_c * 100) if cr_c > 0 else 0.0
        aov_lift = ((aov_t - aov_c) / aov_c * 100) if aov_c > 0 else 0.0
        rpu_lift = ((rpu_t - rpu_c) / rpu_c * 100) if rpu_c > 0 else 0.0
        z_score = self._z_score(cr_c, cr_t, self.control.sample_size, self.treatment.sample_size)
        p_value = self._p_value(z_score)
        significant = p_value < (1.0 - self.confidence_level) and self.control.sample_size >= self.min_sample_size
        return {
            "conversion_rate_lift_pct": round(cr_lift, 2),
            "aov_lift_pct": round(aov_lift, 2),
            "rpu_lift_pct": round(rpu_lift, 2),
            "z_score": round(z_score, 4),
            "p_value": round(p_value, 6),
            "is_significant": significant,
            "recommended_action": "promote_treatment" if significant and cr_t > cr_c else "keep_control",
            "sample_size_met": self.control.sample_size >= self.min_sample_size and self.treatment.sample_size >= self.min_sample_size,
        }

    def _z_score(self, p1, p2, n1, n2) -> float:
        if n1 == 0 or n2 == 0:
            return 0.0
        p_pool = (p1 * n1 + p2 * n2) / (n1 + n2)
        if p_pool == 0 or p_pool == 1:
            return 0.0
        se = math.sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2))
        return (p2 - p1) / se if se > 0 else 0.0

    def _p_value(self, z: float) -> float:
        return 2 * (1 - self._std_normal_cdf(abs(z)))

    def _std_normal_cdf(self, x: float) -> float:
        return 0.5 * (1 + math.erf(x / math.sqrt(2)))


class ABTestManager:
    def __init__(self):
        self.experiments: Dict[str, Experiment] = {}
        self._init_default_experiments()

    def _init_default_experiments(self):
        self.experiments["realtime_vs_static"] = Experiment(
            experiment_id="realtime_vs_static",
            name="Real-Time Re-Ranker vs Static Feed",
            description="Compare real-time session-aware ranking against static Two-Tower feed for CTR lift",
            control=ExperimentVariant(variant_id="control_static", name="Static Feed", description="Two-Tower + Cross-Encoder without session context", metrics=["ctr", "conversion", "aov"]),
            treatment=ExperimentVariant(variant_id="treatment_realtime", name="Real-Time Session Feed", description="Multimodal user embedding + intent boost + real-time reranker", metrics=["ctr", "conversion", "aov"]),
            min_sample_size=500,
            confidence_level=0.95,
        )
        self.experiments["bundle_vs_single"] = Experiment(
            experiment_id="bundle_vs_single",
            name="Complete The Look Bundle vs Single Product",
            description="Measure AOV uplift from outfit bundle recommendations vs individual product cards",
            control=ExperimentVariant(variant_id="control_single", name="Individual Products", description="Single product recommendation cards", metrics=["ctr", "aov", "bundle_purchase_rate"]),
            treatment=ExperimentVariant(variant_id="treatment_bundle", name="Complete The Look Bundle", description="Outfit bundle recommendation with discount", metrics=["ctr", "aov", "bundle_purchase_rate"]),
            min_sample_size=500,
            confidence_level=0.95,
        )
        self.experiments["cold_start_3click"] = Experiment(
            experiment_id="cold_start_3click",
            name="3-Click Cold Start Optimization",
            description="Show intent-predicted banners after 3 clicks for new users vs generic homepage",
            control=ExperimentVariant(variant_id="control_generic", name="Generic Homepage", description="No intent adaptation for new users", metrics=["cold_start_ctr", "search_abandonment", "session_duration"]),
            treatment=ExperimentVariant(variant_id="treatment_3click", name="3-Click Intent Adaptation", description="Intent prediction triggered after 3 interactions", metrics=["cold_start_ctr", "search_abandonment", "session_duration"]),
            min_sample_size=300,
            confidence_level=0.95,
        )

    def get_experiment(self, experiment_id: str) -> Optional[Experiment]:
        return self.experiments.get(experiment_id)

    def record(self, experiment_id: str, variant_id: str, converted: bool = False, revenue: float = 0.0):
        exp = self.experiments.get(experiment_id)
        if exp:
            exp.record_event(variant_id, converted, revenue)

    def get_all_results(self) -> List[Dict]:
        results = []
        for exp in self.experiments.values():
            lift = exp.lift()
            results.append({
                "experiment_id": exp.experiment_id,
                "name": exp.name,
                "description": exp.description,
                "status": exp.status,
                "control": {
                    "variant_id": exp.control.variant_id,
                    "name": exp.control.name,
                    "sample_size": exp.control.sample_size,
                    "conversion_rate": round(self.conversion_rate(exp.control), 4),
                    "aov": round(self.average_order_value(exp.control), 2),
                    "rpu": round(self.revenue_per_user(exp.control), 2),
                },
                "treatment": {
                    "variant_id": exp.treatment.variant_id,
                    "name": exp.treatment.name,
                    "sample_size": exp.treatment.sample_size,
                    "conversion_rate": round(self.conversion_rate(exp.treatment), 4),
                    "aov": round(self.average_order_value(exp.treatment), 2),
                    "rpu": round(self.revenue_per_user(exp.treatment), 2),
                },
                "statistics": lift,
            })
        return results

    def summary(self) -> Dict:
        all_results = self.get_all_results()
        total_experiments = len(all_results)
        significant = sum(1 for r in all_results if r["statistics"]["is_significant"])
        avg_rpu_lift = sum(r["statistics"]["rpu_lift_pct"] for r in all_results) / total_experiments if total_experiments > 0 else 0.0
        return {
            "total_experiments": total_experiments,
            "significant_results": significant,
            "avg_revenue_per_user_lift_pct": round(avg_rpu_lift, 2),
            "experiments": all_results,
        }

    def conversion_rate(self, v: ExperimentVariant) -> float:
        return v.conversions / v.sample_size if v.sample_size > 0 else 0.0

    def average_order_value(self, v: ExperimentVariant) -> float:
        return v.revenue / v.sample_size if v.sample_size > 0 else 0.0

    def revenue_per_user(self, v: ExperimentVariant) -> float:
        return v.revenue / v.sample_size if v.sample_size > 0 else 0.0


ab_test_manager = ABTestManager()
