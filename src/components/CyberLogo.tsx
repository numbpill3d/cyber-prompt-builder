
import React from 'react';

interface CyberLogoProps {
  className?: string;
}

const CyberLogo: React.FC<CyberLogoProps> = ({ className }) => {
  return (
    <div className={`relative animate-rotate ${className}`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-sky-blue to-cyber-bright-blue border-2 border-white flex items-center justify-center shadow-[0_0_10px_rgba(30,174,219,0.5)] hover:shadow-[0_0_15px_rgba(30,174,219,0.8)] transition-all">
        <div className="w-6 h-6 rounded-full border border-white"></div>
        <div className="absolute inset-0 border-t-2 border-white rounded-full transform rotate-45"></div>
        <div className="absolute inset-0 border-r-2 border-white rounded-full"></div>
      </div>
    </div>
  );
};

export default CyberLogo;
