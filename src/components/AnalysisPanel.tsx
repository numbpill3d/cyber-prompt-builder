import React from 'react';
import { Card } from './ui/card';

interface TokenEstimation {
  count: number;
  model: string;
  costEstimate?: number;
}

export interface AnalysisData {
  tokenEstimation: TokenEstimation;
  confidenceScore: number;
  complexity: string;
  suggestedImprovements: string[];
  promptType: string[];
}

interface AnalysisPanelProps {
  analysis: AnalysisData | null;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  if (!analysis) {
    return <div className="text-gray-400">No analysis available</div>;
  }

  return (
    <div className="space-y-2">
      <Card className="p-2 bg-black/30 border-purple-500/10">
        <p className="text-sm text-gray-300">
          Tokens: {analysis.tokenEstimation.count}
        </p>
      </Card>
    </div>
  );
};

export default AnalysisPanel;
