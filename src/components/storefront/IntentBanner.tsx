import React from 'react';

export const IntentBanner: React.FC<{
  intentPayload: any;
  confidence: number;
  reasoning: string;
  latencyMs: number;
}> = ({ intentPayload, confidence, reasoning }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {Math.round(confidence * 100)}% Match
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {intentPayload?.intent_type?.replace(/_/g, ' ') || 'Personalized Discovery'}
          </span>
        </div>
      </div>
    </div>
  );
};
