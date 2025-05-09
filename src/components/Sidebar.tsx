
import React from 'react';
import { cn } from '@/lib/utils';
import { Home, History, Download, User } from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active = false 
}: { 
  icon: React.ElementType; 
  label: string; 
  active?: boolean;
}) => (
  <div className={cn(
    "flex flex-col items-center gap-1 py-4 border-l-2 relative group transition-all hover-lift", 
    active 
      ? "border-cyber-bright-blue" 
      : "border-transparent hover:border-cyber-sky-blue"
  )}>
    <Icon 
      className={cn(
        "w-6 h-6 transition-all", 
        active 
          ? "text-cyber-bright-blue" 
          : "text-foreground group-hover:text-cyber-sky-blue"
      )} 
    />
    <span className={cn(
      "font-orbitron text-xs tracking-wide transition-all",
      active 
        ? "text-cyber-bright-blue" 
        : "text-foreground group-hover:text-cyber-sky-blue"
    )}>
      {label}
    </span>
    {active && (
      <div className="absolute -left-[1px] top-1/2 w-1 h-10 bg-cyber-bright-blue transform -translate-y-1/2 animate-pulse"></div>
    )}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  return (
    <aside className={cn(
      "w-[70px] flex flex-col bg-white bg-opacity-80 border-r border-cyber-bright-blue border-opacity-20 shadow-md",
      className
    )}>
      <div className="flex-1 flex flex-col items-center pt-4">
        <SidebarItem icon={Home} label="HOME" active={true} />
        <SidebarItem icon={History} label="HISTORY" />
        <SidebarItem icon={Download} label="EXPORT" />
        <SidebarItem icon={User} label="ACCOUNT" />
      </div>
      
      <div className="pb-4 flex flex-col items-center">
        <div className="text-xs text-foreground opacity-50 font-mono mt-4">v1.0.0</div>
        <div className="w-8 h-8 mt-3 rounded-full border border-cyber-bright-blue flex items-center justify-center hover-glow cursor-pointer">
          <div className="w-6 h-1 bg-cyber-bright-blue animate-pulse"></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
