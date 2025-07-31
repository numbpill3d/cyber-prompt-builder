import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { 
  Cpu, 
  Zap, 
  Activity, 
  Terminal, 
  Clock, 
  BarChart3, 
  Layers
} from 'lucide-react';

interface TokenMetricsProps {
  tokenCount?: number;
  confidenceScore?: number;
  modelName?: string;
  isProcessing?: boolean;
  logs?: string[];
}

const TokenMetrics: React.FC<TokenMetricsProps> = ({
  tokenCount = 0,
  confidenceScore = 0,
  modelName = 'GPT-4',
  isProcessing = false,
  logs = []
}) => {
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );

  useEffect(() => {
const interval = setInterval(
  () => setCurrentTime(new Date().toLocaleTimeString()),
  1000
);

    return () => clearInterval(interval);
isProcessing = false,
  logs = []
}) => {
  // Import useCurrentTime hook
  // import { useCurrentTime } from './hooks/useCurrentTime';
  
// Use the custom hook instead of useState and useEffect

  const currentTime = useCurrentTime();

  return (
    <div className="space-y-4">
      <Card className="bg-black/30 border-purple-500/10 p-3">
  return (
    <div className="space-y-4">
      <Card className="bg-black/30 border-purple-500/10 p-3">
        <h3 className="text-sm font-medium mb-3 flex items-center">
          <Cpu className="h-4 w-4 text-purple-400 mr-2" />
          System Status
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-3 w-3 text-purple-400 mr-2" />
              <span className="text-xs text-gray-400">Model</span>
            </div>
            <span className="text-xs font-medium">{modelName}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Layers className="h-3 w-3 text-purple-400 mr-2" />
              <span className="text-xs text-gray-400">Tokens</span>
            </div>
            <span className="text-xs font-medium">{tokenCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="h-3 w-3 text-purple-400 mr-2" />
              <span className="text-xs text-gray-400">Confidence</span>
            </div>
            <div className="flex items-center space-x-2">
              <Progress
                value={confidenceScore}
                className="w-16 h-1 bg-gray-700"
              />
              <span className="text-xs font-medium">{confidenceScore}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className={`h-3 w-3 ${isProcessing ? 'text-green-400' : 'text-gray-400'} mr-2`} />
              <span className="text-xs text-gray-400">Status</span>
            </div>
            <span className={`text-xs font-medium ${isProcessing ? 'text-green-400' : 'text-gray-400'}`}>
              {isProcessing ? 'Processing' : 'Idle'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-3 w-3 text-purple-400 mr-2" />
              <span className="text-xs text-gray-400">Time</span>
            </div>
            <span className="text-xs font-medium">{currentTime}</span>
          </div>
        </div>
      </Card>
      
      <Card className="bg-black/30 border-purple-500/10 p-3">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <Terminal className="h-4 w-4 text-purple-400 mr-2" />
          System Logs
        </h3>
        
        <ScrollArea className="h-[200px] rounded bg-black/40 p-2">
          <div className="font-mono text-xs text-gray-300 space-y-1">
            {logs.map((log, index) => (
              <div key={index} className={index % 2 === 0 ? 'opacity-90' : 'opacity-100'}>
                {log}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default TokenMetrics;