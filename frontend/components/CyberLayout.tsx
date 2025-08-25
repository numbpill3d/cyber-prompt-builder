
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { 
  Zap, 
  Settings, 
  Code, 
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CyberLayoutProps {
  children: React.ReactNode;
}

const CyberLayout: React.FC<CyberLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`bg-black/20 backdrop-blur-sm border-r border-purple-500/20 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-8">
              {!sidebarCollapsed && (
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI Coder
                </h1>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-purple-400 hover:text-purple-300"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
            
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className={`w-full justify-start text-purple-300 hover:text-white hover:bg-purple-500/20 ${
                  sidebarCollapsed ? 'px-2' : ''
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-2">Chat</span>}
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start text-purple-300 hover:text-white hover:bg-purple-500/20 ${
                  sidebarCollapsed ? 'px-2' : ''
                }`}
              >
                <Code className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-2">Code</span>}
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start text-purple-300 hover:text-white hover:bg-purple-500/20 ${
                  sidebarCollapsed ? 'px-2' : ''
                }`}
              >
                <Settings className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-2">Settings</span>}
              </Button>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Zap className="h-6 w-6 text-purple-400" />
                <span className="text-lg font-semibold">AI Code Generator</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Online</span>
                <span className="text-sm text-gray-400">{currentTime}</span>
              </div>
            </div>
          </header>
          
          {/* Content */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CyberLayout;
