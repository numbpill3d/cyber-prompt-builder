import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Home, History, Download, User, Settings, Terminal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface SidebarProps {
  className?: string;
}

const SidebarItem = ({
  icon: Icon,
  label,
  active = false,
  onClick
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <div
        className={cn(
          "flex flex-col items-center gap-1 py-4 border-l-2 relative group transition-all hover-lift cursor-pointer",
          active
            ? "border-cyber-bright-blue"
            : "border-transparent hover:border-cyber-sky-blue"
        )}
        onClick={onClick}
      >
        <Icon
          className={cn(
            "w-6 h-6 transition-all",
            active
              ? "text-cyber-bright-blue"
              : "text-cyber-sky-blue"
          )}
        />
        <span className={cn(
          "font-orbitron text-xs tracking-wide transition-all",
          active
            ? "text-cyber-bright-blue"
            : "text-cyber-sky-blue"
        )}>
          {label}
        </span>
        {active && (
          <div className="absolute -left-[1px] top-1/2 w-1 h-10 bg-cyber-bright-blue transform -translate-y-1/2 animate-pulse"></div>
        )}
      </div>
    </HoverCardTrigger>
    <HoverCardContent className="bg-white bg-opacity-90 border border-cyber-bright-blue">
      <div className="font-orbitron text-sm">
        <span className="text-cyber-bright-blue">{label}</span>
        <span className="text-xs block font-mono mt-1 text-foreground opacity-70">
          {active ? 'Currently Active' : 'Click to navigate'}
        </span>
      </div>
    </HoverCardContent>
  </HoverCard>
);

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Set the active item based on the current route
  const [activeItem, setActiveItem] = useState(() => {
    if (location.pathname.startsWith('/settings')) return 'SETTINGS';
    if (location.pathname.startsWith('/history')) return 'HISTORY';
    if (location.pathname.startsWith('/export')) return 'EXPORT';
    if (location.pathname.startsWith('/account')) return 'ACCOUNT';
    if (location.pathname.startsWith('/dev-tools')) return 'DEV_TOOLS';
    return 'HOME';
const location = useLocation();

  // Set the active item based on the current route
  const activeItem = useMemo(() => { // import { useMemo } from 'react';
    if (location.pathname === '/settings') return 'SETTINGS';
    if (location.pathname === '/history') return 'HISTORY';
    if (location.pathname === '/export') return 'EXPORT';
    if (location.pathname === '/account') return 'ACCOUNT';
    if (location.pathname === '/dev-tools') return 'DEV_TOOLS';
    return 'HOME';
  }, [location.pathname]);

  const handleItemClick = (item: string) => {
    // Navigate to the appropriate route
    switch (item) {
      case 'HOME':

  const handleItemClick = (item: string) => {
    setActiveItem(item);

    // Navigate to the appropriate route
    switch (item) {
      case 'HOME':
        navigate('/');
        break;
      case 'SETTINGS':
        navigate('/settings');
        break;
      case 'HISTORY':
        navigate('/history');
        break;
      case 'EXPORT':
        navigate('/export');
        break;
      case 'ACCOUNT':
        navigate('/account');
        break;
      case 'DEV_TOOLS':
        navigate('/dev-tools');
        break;
      // Add other routes as needed
      default:
        navigate('/');
    }
  };

  return (
    <aside className={cn(
      "w-[70px] flex flex-col bg-white bg-opacity-80 border-r border-cyber-bright-blue border-opacity-20 shadow-md",
      className
    )}>
      <div className="flex-1 flex flex-col items-center pt-4">
        <SidebarItem
          icon={Home}
          label="HOME"
          active={activeItem === 'HOME'}
          onClick={() => handleItemClick('HOME')}
        />
        <SidebarItem
          icon={History}
          label="HISTORY"
          active={activeItem === 'HISTORY'}
          onClick={() => handleItemClick('HISTORY')}
        />
        <SidebarItem
          icon={Download}
          label="EXPORT"
          active={activeItem === 'EXPORT'}
          onClick={() => handleItemClick('EXPORT')}
        />
        <SidebarItem
          icon={User}
          label="ACCOUNT"
          active={activeItem === 'ACCOUNT'}
          onClick={() => handleItemClick('ACCOUNT')}
        />
        <SidebarItem
          icon={Settings}
          label="SETTINGS"
          active={activeItem === 'SETTINGS'}
          onClick={() => handleItemClick('SETTINGS')}
        />
        <SidebarItem
          icon={Terminal}
          label="DEV TOOLS"
          active={activeItem === 'DEV_TOOLS'}
          onClick={() => handleItemClick('DEV_TOOLS')}
        />
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
