import React, { useState } from 'react';
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
  children?: React.ReactNode;
}

const CyberLayout: React.FC<CyberLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
              </div>
            </div>
          </header>
          
          {/* Content */}
          <main className="flex-1 overflow-hidden p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Welcome to AI Code Generator
                </h1>
                <p className="text-gray-300 text-lg">
                  Your intelligent coding companion powered by advanced AI
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-black/40 border-purple-500/20 p-6">
                  <div className="flex items-center mb-4">
                    <Code className="h-8 w-8 text-purple-400 mr-3" />
                    <h3 className="text-xl font-semibold text-white">Smart Code Generation</h3>
                  </div>
                  <p className="text-gray-400">
                    Generate high-quality code from natural language descriptions using advanced AI models.
                  </p>
                </Card>
                
                <Card className="bg-black/40 border-purple-500/20 p-6">
                  <div className="flex items-center mb-4">
                    <MessageSquare className="h-8 w-8 text-purple-400 mr-3" />
                    <h3 className="text-xl font-semibold text-white">Interactive Chat</h3>
                  </div>
                  <p className="text-gray-400">
                    Collaborate with AI through natural conversation to refine and improve your code.
                  </p>
                </Card>
                
                <Card className="bg-black/40 border-purple-500/20 p-6">
                  <div className="flex items-center mb-4">
                    <Settings className="h-8 w-8 text-purple-400 mr-3" />
                    <h3 className="text-xl font-semibold text-white">Customizable Settings</h3>
                  </div>
                  <p className="text-gray-400">
                    Fine-tune AI behavior and preferences to match your coding style and requirements.
                  </p>
                </Card>
              </div>
              
              <div className="mt-12 text-center">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Get Started
                </Button>
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CyberLayout;