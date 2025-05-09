
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PromptInput from './PromptInput';
import CodeEditor from './CodeEditor';
import ActionButtons from './ActionButtons';

interface CyberLayoutProps {
  children?: React.ReactNode;
}

const CyberLayout: React.FC<CyberLayoutProps> = ({ children }) => {
  const [code, setCode] = useState('');

  const handleGenerateCode = (prompt: string) => {
    // In a real app, this would call an API
    setCode(`// Generated from prompt: "${prompt}"\n\nfunction helloWorld() {\n  console.log("Hello, Cyber World!");\n  return "Code generated successfully";\n}`);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-cyber-ice-blue to-white text-foreground">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
            <h1 className="font-orbitron text-3xl text-center bg-cyber-gradient bg-clip-text text-transparent">
              AI <span className="text-cyber-bright-blue">Code</span> Generator
            </h1>
            
            <PromptInput onGenerate={handleGenerateCode} />
            
            <div className="flex flex-col gap-3">
              <div className="text-sm text-foreground font-orbitron uppercase flex items-center gap-2">
                <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
                Output
              </div>
              <div className="h-[400px] cyberborder ice-card hover-glow">
                <CodeEditor code={code} setCode={setCode} />
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="text-sm text-foreground font-orbitron uppercase flex items-center gap-2">
                <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
                Actions
              </div>
              <ActionButtons />
            </div>
          </div>
          
          {children}
        </main>
      </div>
      
      <footer className="h-10 chrome-gradient border-t border-cyber-bright-blue border-opacity-30 flex items-center justify-between px-4">
        <div className="text-xs text-cyber-black font-mono">Systems: operational</div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyber-bright-blue animate-pulse"></div>
          <div className="text-xs text-cyber-black font-mono">AI Engine: active</div>
        </div>
      </footer>
    </div>
  );
};

export default CyberLayout;
