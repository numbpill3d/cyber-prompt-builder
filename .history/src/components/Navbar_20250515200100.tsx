
import React, { useState } from 'react';
import CyberLogo from './CyberLogo';
import ModeSelector from './ModeSelector';
import { cn } from '@/lib/utils';
import { toast } from "@/hooks/use-toast";
import { Github, ArrowUp } from 'lucide-react';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLoginClick = () => {
    toast({
      title: "Login Feature",
      description: "This would open the login modal in a real application.",
    });
  };

  const handleDocsClick = () => {
    toast({
      title: "Documentation",
      description: "This would open the documentation in a real application.",
    });
  };

  const handleGithubClick = () => {
    toast({
      title: "GitHub Integration",
      description: "Connect to GitHub to store and version your generated code.",
    });
  };

  const handleSupabaseClick = () => {
    toast({
      title: "Supabase Integration",
      description: "Connect to Supabase for backend functionality.",
    });
  };

  const handleVercelClick = () => {
    toast({
      title: "Vercel Integration",
      description: "Deploy your app to Vercel with one click.",
    });
  };

  return (
    <header className={cn("w-full h-16 glassmorphism chrome-gradient flex items-center justify-between px-4 z-10 shadow-md", className)}>
      <div className="flex items-center gap-3">
        <CyberLogo className="hover-lift" />
        <h1 className="font-orbitron text-xl font-bold text-cyber-bright-blue tracking-wider">SYNTΩX</h1>
      </div>

      <div className="md:flex items-center gap-4 hidden">
        <button
          className="flex items-center gap-2 px-3 py-1 border border-cyber-bright-blue text-sm hover:bg-cyber-bright-blue hover:bg-opacity-20 transition-all hover-lift"
          onClick={handleGithubClick}
        >
          <Github size={16} className="text-cyber-bright-blue" />
          <span className="terminal-text">GitHub</span>
        </button>

        <button
          className="flex items-center gap-2 px-3 py-1 border border-cyber-bright-blue text-sm hover:bg-cyber-bright-blue hover:bg-opacity-20 transition-all hover-lift"
          onClick={handleSupabaseClick}
        >
          <span className="text-cyber-bright-blue font-bold">S</span>
          <span className="terminal-text">Supabase</span>
        </button>

        <button
          className="flex items-center gap-2 px-3 py-1 border border-cyber-bright-blue text-sm hover:bg-cyber-bright-blue hover:bg-opacity-20 transition-all hover-lift"
          onClick={handleVercelClick}
        >
          <ArrowUp size={16} className="text-cyber-bright-blue" />
          <span className="terminal-text">Vercel</span>
        </button>

        <div className="cyberborder bg-white bg-opacity-50 px-3 py-1 hover-glow">
          <span className="text-cyber-bright-blue">guest@syntox</span>
          <span className="text-foreground">:</span>
          <span className="text-cyber-bright-blue">~</span>
          <span className="text-foreground">$</span>
        </div>
        <button
          className="flex items-center gap-2 bg-cyber-bright-blue px-3 py-1 rounded-sm hover:bg-cyber-sky-blue transition-colors hover-lift"
          onClick={handleLoginClick}
        >
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span className="font-orbitron text-white text-sm">LOGIN</span>
        </button>
      </div>

      <div className="md:hidden">
        <button
          className="w-8 h-8 flex flex-col justify-center items-center gap-1.5"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className={cn(
            "w-5 h-0.5 bg-cyber-bright-blue transition-all",
            isMenuOpen && "transform rotate-45 translate-y-1"
          )}></span>
          <span className={cn(
            "w-5 h-0.5 bg-cyber-bright-blue transition-all",
            isMenuOpen && "opacity-0"
          )}></span>
          <span className={cn(
            "w-5 h-0.5 bg-cyber-bright-blue transition-all",
            isMenuOpen && "transform -rotate-45 -translate-y-1"
          )}></span>
        </button>

        {isMenuOpen && (
          <div className="absolute top-16 right-0 w-48 bg-white shadow-lg border border-cyber-bright-blue py-2 z-20">
            <button
              className="w-full text-left px-4 py-2 hover:bg-cyber-ice-blue transition-colors flex items-center gap-2"
              onClick={handleGithubClick}
            >
              <Github size={16} className="text-cyber-bright-blue" />
              <span>GitHub</span>
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-cyber-ice-blue transition-colors flex items-center gap-2"
              onClick={handleSupabaseClick}
            >
              <span className="text-cyber-bright-blue font-bold">S</span>
              <span>Supabase</span>
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-cyber-ice-blue transition-colors flex items-center gap-2"
              onClick={handleVercelClick}
            >
              <ArrowUp size={16} className="text-cyber-bright-blue" />
              <span>Vercel</span>
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-cyber-ice-blue transition-colors"
              onClick={handleDocsClick}
            >
              Documentation
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-cyber-ice-blue transition-colors"
              onClick={handleLoginClick}
            >
              Login
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
