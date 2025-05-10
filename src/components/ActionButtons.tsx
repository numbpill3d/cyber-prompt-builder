
import React from 'react';
import { cn } from '@/lib/utils';
import { Download, Play } from 'lucide-react';

interface ActionButtonsProps {
  className?: string;
  onExport?: () => void;
  onDeploy?: () => void;
}

const TerminalButton: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  prefix?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}> = ({ children, className, prefix = "$", icon, onClick }) => {
  return (
    <button 
      className={cn(
        "bg-white bg-opacity-80 border border-cyber-bright-blue px-4 py-2 flex items-center gap-2 hover:border-cyber-bright-blue hover:shadow-[0_0_8px_rgba(30,174,219,0.4)] transition-all group hover-lift",
        className
      )}
      onClick={onClick}
    >
      {icon && <span className="text-cyber-bright-blue">{icon}</span>}
      {!icon && <span className="text-cyber-bright-blue">{prefix}</span>}
      <span className="font-mono text-foreground group-hover:text-cyber-bright-blue transition-colors">{children}</span>
    </button>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ className, onExport, onDeploy }) => {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      <TerminalButton icon={<Download size={18} />} onClick={onExport}>export --zip</TerminalButton>
      <TerminalButton icon={<Play size={18} />} onClick={onDeploy}>deploy --vercel</TerminalButton>
    </div>
  );
};

export default ActionButtons;
