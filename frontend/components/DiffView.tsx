
import React from 'react';
import { Card } from './ui/card';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

interface DiffViewProps {
  beforeCode?: string;
  afterCode?: string;
  title?: string;
}

export const DiffView: React.FC<DiffViewProps> = ({
  beforeCode = '',
  afterCode = '',
  title = 'Code Changes'
}) => {
  const generateDiff = (before: string, after: string): DiffLine[] => {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    const diff: DiffLine[] = [];
    
    // Simple diff - mark all before lines as removed and after lines as added
    beforeLines.forEach(line => {
      diff.push({ type: 'removed', content: line });
    });
    
    afterLines.forEach(line => {
      diff.push({ type: 'added', content: line });
    });
    
    return diff;
  };

  const diffLines = generateDiff(beforeCode, afterCode);

  return (
    <Card className="h-full bg-gray-900 text-white border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-medium">{title}</h3>
      </div>
      
      <div className="h-full overflow-auto font-mono text-sm">
        {diffLines.map((line, index) => (
          <div
            key={index}
            className={`px-4 py-1 ${
              line.type === 'added'
                ? 'bg-green-900/30 text-green-300'
                : line.type === 'removed'
                ? 'bg-red-900/30 text-red-300'
                : 'text-gray-300'
            }`}
          >
            <span className="text-gray-500 mr-4 select-none">
              {(index + 1).toString().padStart(3, ' ')}
            </span>
            <span className="mr-2">
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </span>
            <span>{line.content}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
