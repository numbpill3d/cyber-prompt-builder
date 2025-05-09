
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
    <div className="flex flex-col h-screen bg-cyber-black text-cyber-silver">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
            <h1 className="font-orbitron text-3xl text-center text-cyber-white">
              AI <span className="text-cyber-cyan">Code</span> Generator
            </h1>
            
            <PromptInput onGenerate={handleGenerateCode} />
            
            <div className="flex flex-col gap-3">
              <div className="text-sm text-cyber-silver font-orbitron uppercase flex items-center gap-2">
                <div className="w-2 h-2 bg-cyber-green animate-pulse"></div>
                Output
              </div>
              <div className="h-[400px] cyberborder">
                <CodeEditor code={code} setCode={setCode} />
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="text-sm text-cyber-silver font-orbitron uppercase flex items-center gap-2">
                <div className="w-2 h-2 bg-cyber-purple animate-pulse"></div>
                Actions
              </div>
              <ActionButtons />
            </div>
          </div>
          
          {children}
        </main>
      </div>
      
      <footer className="h-10 chrome-gradient border-t border-cyber-silver border-opacity-30 flex items-center justify-between px-4">
        <div className="text-xs text-cyber-black font-mono">Systems: nominal</div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></div>
          <div className="text-xs text-cyber-black font-mono">AI Engine: active</div>
        </div>
      </footer>
    </div>
  );
};

export default CyberLayout;
