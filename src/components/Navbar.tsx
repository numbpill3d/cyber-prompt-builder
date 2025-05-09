
import React from 'react';
import CyberLogo from './CyberLogo';
import { cn } from '@/lib/utils';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  return (
    <header className={cn("w-full h-16 glassmorphism chrome-gradient flex items-center justify-between px-4 z-10", className)}>
      <div className="flex items-center gap-3">
        <CyberLogo />
        <h1 className="font-orbitron text-xl font-bold text-cyber-white tracking-wider">SYNTΩX</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="terminal-text px-3 py-1 border border-cyber-green text-sm hover:bg-cyber-green hover:bg-opacity-20 transition-all">
          docs.txt
        </button>
        <div className="cyberborder bg-cyber-black bg-opacity-50 px-3 py-1">
          <span className="text-cyber-green">guest@syntox</span>
          <span className="text-cyber-silver">:</span>
          <span className="text-cyber-cyan">~</span>
          <span className="text-cyber-silver">$</span>
        </div>
        <button className="flex items-center gap-2 bg-cyber-purple px-3 py-1 rounded-sm hover:bg-cyber-deep-purple transition-colors">
          <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-pulse"></div>
          <span className="font-orbitron text-cyber-white text-sm">LOGIN</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
