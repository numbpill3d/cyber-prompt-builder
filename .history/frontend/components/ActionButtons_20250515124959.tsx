
import React, { useState } from 'react';
import { cn } from '@shared/lib/utils';
import { Download, Play, Github, Database, Loader2 } from 'lucide-react';
import { toast } from '@frontend/hooks/use-toast";

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
  isLoading?: boolean;
  disabled?: boolean;
}> = ({ children, className, prefix = "$", icon, onClick, isLoading = false, disabled = false }) => {
  return (
    <button 
      className={cn(
        "bg-white bg-opacity-80 border border-cyber-bright-blue px-4 py-2 flex items-center gap-2 hover:border-cyber-bright-blue hover:shadow-[0_0_8px_rgba(30,174,219,0.4)] transition-all group hover-lift",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? 
        <Loader2 size={18} className="text-cyber-bright-blue animate-spin" /> : 
        icon ? <span className="text-cyber-bright-blue">{icon}</span> : <span className="text-cyber-bright-blue">{prefix}</span>
      }
      <span className="font-mono text-cyber-black group-hover:text-cyber-bright-blue transition-colors">
        {isLoading ? "Processing..." : children}
      </span>
    </button>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ className, onExport, onDeploy }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isGithubSyncing, setIsGithubSyncing] = useState(false);
  const [isSupabaseConnecting, setIsSupabaseConnecting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      if (onExport) {
        onExport();
      } else {
        toast({
          title: "Export Code",
          description: "Code has been downloaded as a ZIP file.",
        });
      }
      setIsExporting(false);
    }, 1000);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      if (onDeploy) {
        onDeploy();
      } else {
        toast({
          title: "Deploy to Vercel",
          description: "Deployment process initiated successfully.",
        });
      }
      setIsDeploying(false);
    }, 1500);
  };

  const handleGithub = () => {
    setIsGithubSyncing(true);
    setTimeout(() => {
      toast({
        title: "GitHub Integration",
        description: "Repository has been created and code pushed successfully.",
      });
      setIsGithubSyncing(false);
    }, 2000);
  };

  const handleSupabase = () => {
    setIsSupabaseConnecting(true);
    setTimeout(() => {
      toast({
        title: "Supabase Connected",
        description: "Your project is now linked to Supabase.",
      });
      setIsSupabaseConnecting(false);
    }, 1800);
  };

  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      <TerminalButton 
        icon={<Download size={18} />} 
        onClick={handleExport} 
        className="hover:bg-cyber-ice-blue"
        isLoading={isExporting}
      >
        export --zip
      </TerminalButton>
      
      <TerminalButton 
        icon={<Play size={18} />} 
        onClick={handleDeploy} 
        className="hover:bg-cyber-ice-blue"
        isLoading={isDeploying}
      >
        deploy --vercel
      </TerminalButton>
      
      <TerminalButton 
        icon={<Github size={18} />} 
        onClick={handleGithub} 
        className="hover:bg-cyber-ice-blue"
        isLoading={isGithubSyncing}
      >
        sync --github
      </TerminalButton>

      <TerminalButton 
        icon={<Database size={18} />} 
        onClick={handleSupabase} 
        className="hover:bg-cyber-ice-blue"
        isLoading={isSupabaseConnecting}
      >
        connect --supabase
      </TerminalButton>
    </div>
  );
};

export default ActionButtons;
