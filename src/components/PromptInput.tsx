
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  className?: string;
  onGenerate: (prompt: string) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ className, onGenerate }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <div className="w-full relative cyberborder ice-card hover-glow">
          <div className="absolute -top-7 left-3 bg-white px-2 font-orbitron text-cyber-bright-blue text-sm">
            PROMPT<span className="text-cyber-bright-blue">:</span>
          </div>
          <textarea 
            className="w-full bg-transparent text-foreground p-4 min-h-[120px] resize-none focus:outline-none focus:ring-1 focus:ring-cyber-bright-blue rounded-lg"
            placeholder="Describe the code you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          ></textarea>
          
          <div className="absolute -bottom-7 right-3 bg-white px-2 font-mono text-xs text-foreground opacity-70">
            <span className="text-cyber-bright-blue">tokens</span>: {prompt.length}
          </div>
        </div>
        
        <button 
          type="submit"
          className="cyber-button group hover-lift"
          data-text="GENERATE CODE"
        >
          <span className="relative z-10 text-cyber-glow glitch-effect" data-text="GENERATE CODE">
            GENERATE CODE
          </span>
          <div className="absolute inset-0 bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="scanline"></div>
          </div>
        </button>
      </form>
    </div>
  );
};

export default PromptInput;
