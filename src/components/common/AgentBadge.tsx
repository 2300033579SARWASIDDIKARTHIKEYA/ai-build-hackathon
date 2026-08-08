import React from 'react';

interface Props {
  agentName: string;
  confidence: number;
  latencyMs?: number;
  size?: 'sm' | 'md';
}

export const AgentBadge: React.FC<Props> = ({ agentName, confidence, latencyMs, size = 'md' }) => {
  const confidencePercent = Math.round(confidence * 100);
  
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-[11px] font-medium">
      <span className="font-semibold text-gray-700">{agentName}</span>
      <span className="h-2.5 w-px bg-gray-300" />
      <span>{confidencePercent}%</span>
      {latencyMs && (
        <>
          <span className="h-2.5 w-px bg-gray-300" />
          <span>{latencyMs}ms</span>
        </>
      )}
    </div>
  );
};
