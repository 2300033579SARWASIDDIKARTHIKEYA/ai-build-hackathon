import React, { useState, useEffect } from 'react';
import { fetchAnalyticsMetrics } from '../services/api';
import { ExecutiveKPIs } from '../components/dashboard/ExecutiveKPIs';
import { LiveAgentTelemetry } from '../components/dashboard/LiveAgentTelemetry';
import { RecommendationHeatmap } from '../components/dashboard/RecommendationHeatmap';
import { VectorSpaceVisualizer } from '../components/dashboard/VectorSpaceVisualizer';
import BusinessROI from '../components/dashboard/BusinessROI';
import { LayoutDashboard, Sparkles, Activity, ShieldCheck, Layers, FlaskConical } from 'lucide-react';

export const StudioDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetchAnalyticsMetrics();
      setMetrics(res.recommendation);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-indigo-400">
        <Sparkles className="w-8 h-8 animate-spin" />
        <p className="text-xs font-mono">Aggregating telemetry & AI model benchmarks...</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 font-sans">
      
      {/* Studio Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/80 border border-indigo-500/20 mb-8 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>ALGUD AI Enterprise Studio</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Discovery Control Center</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time telemetry, 5 autonomous AI agent status monitors, 512-d FAISS vector space visualizer, and A/B test attribution benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Recommendations Served</span>
            <p className="text-lg font-extrabold text-emerald-400">1,482,900</p>
          </div>
        </div>
      </div>

      {/* 1. Business ROI & Impact */}
      <BusinessROI />

      {/* 2. Executive KPIs */}
      <ExecutiveKPIs 
        kpis={metrics.executive_kpis} 
        sessionMetrics={metrics.realtime_session_metrics} 
      />

      {/* 2. Live 5-Agent Telemetry Grid */}
      <LiveAgentTelemetry agents={metrics.agent_telemetry} />

      {/* 3. Recommendation Heatmaps & Model Benchmarks */}
      <RecommendationHeatmap benchmarks={metrics.model_benchmarks} />

      {/* 4. FAISS Vector Space Visualizer */}
      <VectorSpaceVisualizer />

      {/* 5. Active A/B Testing Lab */}
      <div className="mt-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Active A/B Test Experiments</h3>
        </div>

        {metrics.ab_test_experiments.map((exp: any, idx: number) => (
          <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-purple-400 font-bold">{exp.experiment_id}</span>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                <span><strong>Control (Variant A):</strong> {exp.variant_a}</span>
                <span>vs</span>
                <span><strong>Treatment (Variant B):</strong> {exp.variant_b}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/40">
                {exp.statistical_significance}
              </span>
            </div>
          </div>
        ))}
      </div>

    </main>
  );
};
