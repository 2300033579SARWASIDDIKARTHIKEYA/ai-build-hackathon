import { useState, useEffect } from 'react';
import { fetchBusinessKPIs, fetchFunnel, fetchRevenueForecast } from '../../services/api';

interface KPI {
  monthly_sessions_est: number;
  monthly_impressions: number;
  ctr: number;
  ctr_lift_pct: number;
  conversion_rate: number;
  conversion_rate_lift_pct: number;
  aov_inr: number;
  aov_lift_pct: number;
  baseline_monthly_revenue_inr: number;
  current_monthly_revenue_inr: number;
  additional_monthly_revenue_inr: number;
  total_monthly_cost_inr: number;
  roi_pct: number;
  payback_period_months: number | null;
  cost_per_transaction_inr: number;
  cost_per_click_inr: number;
  cost_per_impression_inr: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  pct_of_previous: number;
}

interface ForecastMonth {
  month: number;
  projected_revenue_inr: number;
  cumulative_revenue_inr: number;
  additional_vs_baseline_inr: number;
}

export default function BusinessROI() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [forecast, setForecast] = useState<ForecastMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchBusinessKPIs().catch(() => null),
      fetchFunnel().catch(() => null),
      fetchRevenueForecast(6).catch(() => null),
    ]).then(([k, f, fc]) => {
      if (k) setKpis(k);
      if (f?.funnel_stages) setFunnel(f.funnel_stages);
      if (fc) setForecast(fc);
      setLoading(false);
    });
  }, []);

  const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  if (loading) return <div className="animate-pulse bg-slate-800 rounded-2xl h-96" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis && [
          { label: 'CTR', value: `${kpis.ctr}%`, lift: `+${kpis.ctr_lift_pct}%`, color: 'emerald' },
          { label: 'Conversion Rate', value: `${kpis.conversion_rate}%`, lift: `+${kpis.conversion_rate_lift_pct}%`, color: 'blue' },
          { label: 'AOV', value: formatINR(kpis.aov_inr), lift: `+${kpis.aov_lift_pct}%`, color: 'purple' },
          { label: 'ROI', value: `${kpis.roi_pct}%`, lift: `${kpis.payback_period_months ? `${kpis.payback_period_months}mo payback` : 'positive'}`, color: 'amber' },
        ].map(k => (
          <div key={k.label} className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{k.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{k.value}</p>
            <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
              k.color === 'emerald' ? 'bg-emerald-900 text-emerald-300' :
              k.color === 'blue' ? 'bg-blue-900 text-blue-300' :
              k.color === 'purple' ? 'bg-purple-900 text-purple-300' :
              'bg-amber-900 text-amber-300'
            }`}>{k.lift}</span>
          </div>
        ))}
      </div>

      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Monthly Revenue Lift</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{formatINR(kpis.additional_monthly_revenue_inr)}</p>
            <p className="text-xs text-slate-400 mt-1">vs baseline {formatINR(kpis.baseline_monthly_revenue_inr)}</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cost Per Transaction</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{formatINR(kpis.cost_per_transaction_inr)}</p>
            <p className="text-xs text-slate-400 mt-1">Total monthly cost: {formatINR(kpis.total_monthly_cost_inr)}</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Est. Monthly Impressions</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{(kpis.monthly_impressions / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-slate-400 mt-1">Across {Math.round(kpis.monthly_sessions_est / 1000)}K sessions</p>
          </div>
        </div>
      )}

      {funnel.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold text-lg mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {funnel.map((stage, i) => (
              <div key={stage.stage}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{stage.stage}</span>
                  <span className="text-slate-400">{stage.count.toLocaleString()} ({stage.pct_of_previous}%)</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      i === 0 ? 'bg-blue-500' :
                      i === 1 ? 'bg-emerald-500' :
                      i === 2 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${stage.pct_of_previous}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {forecast.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold text-lg mb-4">6-Month Revenue Forecast</h3>
          <div className="grid grid-cols-6 gap-3">
            {forecast.map(m => (
              <div key={m.month} className="text-center">
                <p className="text-slate-400 text-xs">Month {m.month}</p>
                <p className="text-emerald-400 font-bold text-sm mt-1">{(m.projected_revenue_inr / 100000).toFixed(1)}L</p>
                <p className="text-slate-500 text-xs">+{(m.additional_vs_baseline_inr / 100000).toFixed(1)}L lift</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
