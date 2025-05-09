
import React from 'react';
import CyberLogo from './CyberLogo';
import { cn } from '@/lib/utils';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  return (
    <header className={cn("w-full h-16 glassmorphism chrome-gradient flex items-center justify-between px-4 z-10 shadow-md", className)}>
      <div className="flex items-center gap-3">
        <CyberLogo className="hover-lift" />
        <h1 className="font-orbitron text-xl font-bold bg-cyber-gradient bg-clip-text text-transparent tracking-wider">SYNTΩX</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="terminal-text px-3 py-1 border border-cyber-bright-blue text-sm hover:bg-cyber-bright-blue hover:bg-opacity-20 transition-all hover-lift">
          docs.txt
        </button>
        <div className="cyberborder bg-white bg-opacity-50 px-3 py-1 hover-glow">
          <span className="text-cyber-bright-blue">guest@syntox</span>
          <span className="text-foreground">:</span>
          <span className="text-cyber-bright-blue">~</span>
          <span className="text-foreground">$</span>
        </div>
        <button className="flex items-center gap-2 bg-cyber-bright-blue px-3 py-1 rounded-sm hover:bg-cyber-sky-blue transition-colors hover-lift">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span className="font-orbitron text-white text-sm">LOGIN</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
