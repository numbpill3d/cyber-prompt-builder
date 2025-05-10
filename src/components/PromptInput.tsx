
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  className?: string;
  onGenerate: (prompt: string) => void;
  isLoading?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ className, onGenerate, isLoading = false }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
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
            disabled={isLoading}
          ></textarea>
          
          <div className="absolute -bottom-7 right-3 bg-white px-2 font-mono text-xs text-foreground opacity-70">
            <span className="text-cyber-bright-blue">tokens</span>: {prompt.length}
          </div>
        </div>
        
        <button 
          type="submit"
          className={cn(
            "cyber-button group hover-lift relative overflow-hidden",
            isLoading ? "opacity-70 cursor-not-allowed" : ""
          )}
          data-text="GENERATE CODE"
          disabled={isLoading}
        >
          <span className="relative z-10 text-cyber-glow glitch-effect" data-text="GENERATE CODE">
            {isLoading ? "GENERATING..." : "GENERATE CODE"}
          </span>
          <div className="absolute inset-0 bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="scanline"></div>
          </div>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default PromptInput;
