
import React from 'react';

interface CyberLogoProps {
  className?: string;
}

const CyberLogo: React.FC<CyberLogoProps> = ({ className }) => {
  return (
    <div className={`relative animate-rotate ${className}`}>
      <div className="w-10 h-10 rounded-full bg-cyber-purple border-2 border-cyber-cyan flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border border-cyber-green"></div>
        <div className="absolute inset-0 border-t-2 border-cyber-cyan rounded-full transform rotate-45"></div>
        <div className="absolute inset-0 border-r-2 border-cyber-green rounded-full"></div>
      </div>
    </div>
  );
};

export default CyberLogo;
