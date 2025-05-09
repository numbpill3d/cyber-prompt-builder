
import React from 'react';
import { cn } from '@/lib/utils';
import { Download, Play } from 'lucide-react';

interface ActionButtonsProps {
  className?: string;
}

const TerminalButton: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  prefix?: string;
  icon?: React.ReactNode;
}> = ({ children, className, prefix = "$", icon }) => {
  return (
    <button className={cn(
      "bg-white bg-opacity-80 border border-cyber-bright-blue px-4 py-2 flex items-center gap-2 hover:border-cyber-bright-blue hover:shadow-[0_0_8px_rgba(30,174,219,0.4)] transition-all group hover-lift",
      className
    )}>
      {icon && <span className="text-cyber-bright-blue">{icon}</span>}
      {!icon && <span className="text-cyber-bright-blue">{prefix}</span>}
      <span className="font-mono text-foreground group-hover:text-cyber-bright-blue transition-colors">{children}</span>
    </button>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ className }) => {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      <TerminalButton icon={<Download size={18} />}>export --zip</TerminalButton>
      <TerminalButton icon={<Play size={18} />}>deploy --vercel</TerminalButton>
    </div>
  );
};

export default ActionButtons;
