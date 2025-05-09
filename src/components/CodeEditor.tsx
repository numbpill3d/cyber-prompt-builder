
import React from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  className?: string;
  code: string;
  setCode: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ className, code, setCode }) => {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="chrome-gradient h-8 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyber-purple"></div>
          <div className="w-3 h-3 rounded-full bg-cyber-green"></div>
          <div className="w-3 h-3 rounded-full bg-cyber-cyan"></div>
        </div>
        <div className="font-mono text-xs text-cyber-black">output.js</div>
        <div className="flex items-center gap-2">
          <button className="text-xs border border-cyber-black px-2">+</button>
          <button className="text-xs border border-cyber-black px-2">⋮</button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="scanline"></div>
        </div>
        
        <textarea 
          className="w-full h-full bg-cyber-black font-mono text-sm p-4 resize-none focus:outline-none focus:ring-1 focus:ring-cyber-cyan text-cyber-silver"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Generated code will appear here..."
          spellCheck={false}
        ></textarea>
      </div>
      
      <div className="chrome-gradient h-6 flex items-center px-3">
        <div className="font-mono text-xs text-cyber-black">
          <span className="mr-4">ln: 1</span>
          <span className="mr-4">col: 0</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
