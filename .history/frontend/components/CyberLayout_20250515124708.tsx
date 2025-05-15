import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PromptInput from './PromptInput';
import CodeEditor from './CodeEditor';
import ActionButtons from './ActionButtons';
import { toast } from "@frontend/hooks/use-toast";
import {
  generateCode,
  exportCode,
  deployCode,
  getSettingsManager
} from '@backend/services/aiService';

interface CyberLayoutProps {
  children?: React.ReactNode;
}

const CyberLayout: React.FC<CyberLayoutProps> = ({ children }) => {
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFromPrompt, setGeneratedFromPrompt] = useState('');
  const [taskId, setTaskId] = useState<string | undefined>(undefined);
  const [activeProvider, setActiveProvider] = useState('');
  
  // Load settings on initial render
  useEffect(() => {
    const settings = getSettingsManager().getSettings();
    setActiveProvider(settings.activeProvider);
  }, []);

  const handleGenerateCode = async (prompt: string) => {
    setIsGenerating(true);
    setGeneratedFromPrompt(prompt);

    try {
      // Get current settings
      const settings = getSettingsManager().getSettings();
      const agentSettings = settings.agent;
      const provider = settings.activeProvider;
      const modelSettings = settings.providers[provider as keyof typeof settings.providers];
      
      // Generate code using the current settings
      const result = await generateCode({
        prompt,
        provider,
        model: modelSettings.preferredModel,
        temperature: 0.7,
        maxTokens: 4000
      });

      if (result.error) {
        toast({
          title: "Generation Failed",
          description: result.error,
          variant: "destructive",
        });
        setCode(""); // Clear previous code on error
      } else {
        setCode(result.code);
        setTaskId(result.taskId);
        toast({
          title: "Code Generated",
          description: `Successfully generated with ${provider} provider`,
        });
      }

    } catch (error: any) {
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

  const handleExportCode = async () => {
    if (!code) {
      toast({
        title: "Nothing to export",
        description: "Generate some code first before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Export as a simple file
      const success = await exportCode(code, {
        format: 'file',
        fileName: `code-${Date.now()}.txt`,
        includeMetadata: true
      });
      
      if (success) {
        toast({
          title: "Code Exported",
          description: "Your code has been exported as a file.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: "Failed to export the code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error exporting code:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred during export.",
        variant: "destructive",
      });
    }
  };

  const handleDeploy = async () => {
    if (!code) {
      toast({
        title: "Nothing to deploy",
        description: "Generate some code first before deploying.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Deploy locally (just a basic example)
      const success = await deployCode(code, {
        target: 'local',
        projectName: `project-${Date.now()}`
      });
      
      if (success) {
        toast({
          title: "Code Deployed",
          description: "Your code has been prepared for local deployment.",
        });
      } else {
        toast({
          title: "Deployment Failed",
          description: "Failed to deploy the code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deploying code:", error);
      toast({
        title: "Deployment Failed",
        description: "An error occurred during deployment.",
        variant: "destructive",
      });
    }
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
          <div className="text-xs text-cyber-black font-mono">
            AI Engine: {isGenerating ? "processing" : "ready"} | Provider: {activeProvider}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CyberLayout;
