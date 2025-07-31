import React from 'react';
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
        <p className="text-sm text-gray-300">
          Model: {analysis.tokenEstimation.model}
        </p>
        {analysis.tokenEstimation.costEstimate !== undefined && (
          <p className="text-sm text-gray-300">
            Estimated Cost: ${analysis.tokenEstimation.costEstimate.toFixed(4)}
          </p>
        )}
        <p className="text-sm text-gray-300">Confidence: {analysis.confidenceScore}</p>
        <p className="text-sm text-gray-300">Complexity: {analysis.complexity}</p>
        <p className="text-sm text-gray-300">Prompt Types: {analysis.promptType.join(', ')}</p>
        <ul className="text-sm text-gray-300 list-disc ml-4">
          {analysis.suggestedImprovements.map((improvement, idx) => (
            <li key={idx}>{improvement}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default AnalysisPanel;

};

export default AnalysisPanel;
