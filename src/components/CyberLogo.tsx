
import React from 'react';

interface CyberLogoProps {
  className?: string;
}

const CyberLogo: React.FC<CyberLogoProps> = ({ className }) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-sky-blue to-cyber-bright-blue border-2 border-white flex items-center justify-center shadow-[0_0_10px_rgba(30,174,219,0.5)] hover:shadow-[0_0_15px_rgba(30,174,219,0.8)] transition-all group-hover:animate-rotate">
        <div className="w-6 h-6 rounded-full border border-white"></div>
        <div className="absolute inset-0 border-t-2 border-white rounded-full transform rotate-45"></div>
        <div className="absolute inset-0 border-r-2 border-white rounded-full"></div>
      </div>
      
      {/* Add pulse effect */}
      <div className="absolute -inset-1 bg-cyber-bright-blue rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity"></div>
      
      {/* Add scanline effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 overflow-hidden rounded-full">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-white animate-scanline"></div>
      </div>
    </div>
  );
};

export default CyberLogo;
