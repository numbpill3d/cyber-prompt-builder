import React from 'react';
import { Card } from './ui/card';

interface AutomationPanelProps {
  prompt: string;
  apiKey?: string;
}

const AutomationPanel: React.FC<AutomationPanelProps> = () => {
  return (
    <Card className="p-4 bg-black/30 border-purple-500/10">
      <p className="text-sm text-gray-400">Automation features are not implemented.</p>
    </Card>
  );
};

export default AutomationPanel;
