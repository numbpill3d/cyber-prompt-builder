import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export interface OutputItem {
  id: string;
  content: string;
  timestamp: number;
  type: 'error' | 'code';
  metadata?: {
    tokens: number;
    model: string;
  };
}

interface FloatingDockProps {
  items: OutputItem[];
  onClear: () => void;
  onCopy: (item: OutputItem) => void;
  onRemove: (id: string) => void;
}

const FloatingDock: React.FC<FloatingDockProps> = ({ items, onClear, onCopy, onRemove }) => {
  return (
    <div className="space-y-2 p-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium">Output</span>
        <Button size="sm" variant="ghost" onClick={onClear}>Clear</Button>
      </div>
      <div className="space-y-2 max-h-40 overflow-auto">
        {items.map(item => (
          <Card key={item.id} className="p-2 bg-black/30 border-purple-500/20">
            <div className="text-xs mb-1 text-gray-400">
              {new Date(item.timestamp).toLocaleTimeString()}
            </div>
            <pre className="text-xs whitespace-pre-wrap">{item.content}</pre>
            <div className="flex justify-end space-x-2 mt-1">
              <Button size="icon" variant="ghost" onClick={() => onCopy(item)}>
                📋
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onRemove(item.id)}>
                ✖
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FloatingDock;
