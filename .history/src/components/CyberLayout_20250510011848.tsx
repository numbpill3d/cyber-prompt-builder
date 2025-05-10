
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PromptInput from './PromptInput';
import CodeEditor from './CodeEditor';
import ActionButtons from './ActionButtons';
import { toast } from "@/hooks/use-toast";
import { generateCode } from '@/services/aiService'; // Import the actual AI service

interface CyberLayoutProps {
  children?: React.ReactNode;
}

const CyberLayout: React.FC<CyberLayoutProps> = ({ children }) => {
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFromPrompt, setGeneratedFromPrompt] = useState('');

  const handleGenerateCode = async (prompt: string) => {
    setIsGenerating(true);
    setGeneratedFromPrompt(prompt);

    try {
      const result = await generateCode({ prompt }); // Call the actual generateCode service

      if (result.error) {
        toast({
          title: "Generation Failed",
          description: result.error,
          variant: "destructive",
        });
        setCode(""); // Clear previous code on error
      } else {
        setCode(result.code);
        toast({
          title: "Code Generated",
          description: "Your code has been successfully generated.",
        });
      }

    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Generation Failed",
        description: "An unexpected error occurred during code generation. Please try again.",
        variant: "destructive",
      });
      setCode(""); // Clear previous code on error
    } finally {
      setIsGenerating(false);
    }
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

    // In a real implementation, this would create a downloadable file or ZIP
    // For now, we'll just show a toast notification
    toast({
      title: "Code Exported",
      description: "Code export functionality would be implemented here.",
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

    // Deployment is a complex process. This would typically involve:
    // 1. Building the project (e.g., vite build)
    // 2. Deploying the build output to a hosting service (e.g., Vercel, Netlify, GitHub Pages)
    // This often requires CLI tools or integration with hosting provider APIs.
    // For now, we'll just show a toast notification.
    toast({
      title: "Deployment Initiated",
      description: "Deployment functionality would be implemented here.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-cyber-ice-blue to-white text-cyber-black overflow-hidden">
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
              <div className="text-sm text-cyber-black font-orbitron uppercase flex items-center gap-2">
                <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
                Output {generatedFromPrompt && <span className="text-xs font-normal opacity-70">from: "{generatedFromPrompt}"</span>}
              </div>
              <div className="h-[400px] cyberborder ice-card hover-glow">
                <CodeEditor code={code} setCode={setCode} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-sm text-cyber-black font-orbitron uppercase flex items-center gap-2">
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
          <div className="text-xs text-cyber-black font-mono">AI Engine: {isGenerating ? "processing" : "ready"}</div>
        </div>
      </footer>
    </div>
  );
};

export default CyberLayout;
