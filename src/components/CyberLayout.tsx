
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PromptInput from './PromptInput';
import CodeEditor from './CodeEditor';
import ActionButtons from './ActionButtons';
import { toast } from "@/hooks/use-toast";

interface CyberLayoutProps {
  children?: React.ReactNode;
}

const CyberLayout: React.FC<CyberLayoutProps> = ({ children }) => {
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCode = (prompt: string) => {
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setCode(`// Generated from prompt: "${prompt}"\n\nfunction helloWorld() {\n  console.log("Hello, Cyber World!");\n  return "Code generated successfully";\n}`);
      setIsGenerating(false);
      toast({
        title: "Code Generated",
        description: "Your code has been successfully generated.",
      });
    }, 1500);
  };

  const handleExportCode = () => {
    if (!code) {
      toast({
        title: "Nothing to export",
        description: "Generate some code first before exporting.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Code Exported",
      description: "Your code has been exported as a ZIP file.",
    });
  };

  const handleDeploy = () => {
    if (!code) {
      toast({
        title: "Nothing to deploy",
        description: "Generate some code first before deploying.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Deployment Started",
      description: "Your code is being deployed to Vercel.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-cyber-ice-blue to-white text-foreground overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 flex flex-col p-4 md:p-6 gap-6 overflow-auto">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
            <h1 className="font-orbitron text-2xl md:text-3xl text-center text-cyber-bright-blue">
              AI <span className="text-cyber-bright-blue">Code</span> Generator
            </h1>
            
            <PromptInput onGenerate={handleGenerateCode} isLoading={isGenerating} />
            
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
              <ActionButtons onExport={handleExportCode} onDeploy={handleDeploy} />
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
