import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart3, Award } from 'lucide-react';

interface Props {
  benchmarks: any[];
}

export const RecommendationHeatmap: React.FC<Props> = ({ benchmarks }) => {
  const chartData = benchmarks.map(b => ({
    name: b.model_name.replace(" (NCF)", "").replace(" Dense Retrieval", ""),
    NDCG: (b.ndcg_at_10 * 100).toFixed(1),
    MAP: (b.map_at_10 * 100).toFixed(1),
    MRR: (b.mrr * 100).toFixed(1),
    LatencyMs: b.avg_latency_ms
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Chart */}
      <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">AI Recommendation Algorithm Benchmarks</h3>
              <p className="text-xs text-slate-400">Comparing NDCG@10, MAP@10, MRR & Latency across production models</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[70, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="NDCG" fill="#3b82f6" radius={[4, 4, 0, 0]} name="NDCG@10 (%)" />
              <Bar dataKey="MAP" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="MAP@10 (%)" />
              <Bar dataKey="MRR" fill="#10b981" radius={[4, 4, 0, 0]} name="MRR (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Benchmark Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Algorithm Selection Rationale</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-blue-400">1. Two-Tower Candidate Retrieval</span>
              <p className="text-slate-300 text-[11px] mt-0.5">Scales sub-millisecond nearest neighbor search over millions of catalog items.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-purple-400">2. Cross-Encoder Re-Ranker</span>
              <p className="text-slate-300 text-[11px] mt-0.5">Captures complex multi-intent interactions with business margin & stock constraints.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-emerald-400">3. Multimodal CLIP/DINOv2 Vector Search</span>
              <p className="text-slate-300 text-[11px] mt-0.5">Enables instant visual product matching directly from photo uploads.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
