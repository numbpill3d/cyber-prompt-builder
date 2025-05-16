import React from 'react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Layout component for the application
 * Provides a consistent structure with sidebar and navbar
 */
export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-cyber-ice-blue to-white text-cyber-black overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className={cn("flex-1 overflow-auto", className)}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
