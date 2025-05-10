
import React from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  className?: string;
  code: string;
  setCode: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ className, code, setCode }) => {
  const lineCount = code.split('\n').length || 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="chrome-gradient h-8 flex items-center justify-between px-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyber-bright-blue hover:bg-cyber-sky-blue transition-colors cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-cyber-sky-blue hover:bg-cyber-bright-blue transition-colors cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-white hover:bg-cyber-ice-blue transition-colors cursor-pointer"></div>
        </div>
        <div className="font-mono text-xs text-cyber-black">output.js</div>
        <div className="flex items-center gap-2">
          <button className="text-xs border border-cyber-black px-2 hover:bg-white hover:bg-opacity-30 transition-colors">+</button>
          <button className="text-xs border border-cyber-black px-2 hover:bg-white hover:bg-opacity-30 transition-colors">⋮</button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="scanline"></div>
        </div>
        
        <div className="flex h-full">
          <div className="bg-white bg-opacity-90 text-right pr-2 py-4 text-xs text-cyber-black font-mono border-r border-cyber-bright-blue border-opacity-30 select-none">
            {lineNumbers.map(num => (
              <div key={num} className="px-2">{num}</div>
            ))}
          </div>
          
          <textarea 
            className="w-full h-full bg-white bg-opacity-80 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-1 focus:ring-cyber-bright-blue text-foreground rounded-br-lg"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Generated code will appear here..."
            spellCheck={false}
          ></textarea>
        </div>
      </div>
      
      <div className="chrome-gradient h-6 flex items-center justify-between px-3 rounded-b-lg">
        <div className="font-mono text-xs text-cyber-black">
          <span className="mr-4">ln: {lineCount}</span>
          <span className="mr-4">col: 0</span>
          <span>UTF-8</span>
        </div>
        <button className="text-xs hover:text-cyber-bright-blue transition-colors">Copy</button>
      </div>
    </div>
  );
};

export default CodeEditor;
