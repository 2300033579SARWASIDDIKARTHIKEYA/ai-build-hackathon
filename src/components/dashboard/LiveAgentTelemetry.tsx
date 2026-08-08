import React from 'react';
import { Bot, Cpu, ShieldCheck, Zap, Activity } from 'lucide-react';

interface AgentInfo {
  agent: string;
  status: string;
  avg_confidence: number;
  queries_sec: number;
  avg_latency_ms: number;
}

interface Props {
  agents: AgentInfo[];
}

export const LiveAgentTelemetry: React.FC<Props> = ({ agents }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Autonomous Multi-Agent Telemetry Grid</h3>
            <p className="text-xs text-slate-400">Real-time status, decision confidence, and latency across 5 specialized AI Agents</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>All 5 Agents Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {agents.map((ag, idx) => (
          <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 line-clamp-1">{ag.agent}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Confidence:</span>
                <span className="font-bold text-emerald-400">{Math.round(ag.avg_confidence * 100)}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Latency:</span>
                <span className="font-bold text-amber-400">{ag.avg_latency_ms}ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Throughput:</span>
                <span className="font-bold text-blue-400">{ag.queries_sec} q/s</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
