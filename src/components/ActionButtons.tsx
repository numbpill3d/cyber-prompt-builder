
import React from 'react';
import { cn } from '@/lib/utils';

interface ActionButtonsProps {
  className?: string;
}

const TerminalButton: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  prefix?: string;
}> = ({ children, className, prefix = "$" }) => {
  return (
    <button className={cn(
      "bg-cyber-black border border-cyber-silver px-4 py-2 flex items-center gap-2 hover:border-cyber-green transition-colors group",
      className
    )}>
      <span className="text-cyber-green">{prefix}</span>
      <span className="font-mono text-cyber-silver group-hover:text-cyber-white transition-colors">{children}</span>
    </button>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ className }) => {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      <TerminalButton>export --zip</TerminalButton>
      <TerminalButton prefix="▶">deploy --vercel</TerminalButton>
    </div>
  );
};

export default ActionButtons;
