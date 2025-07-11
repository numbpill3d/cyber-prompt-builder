
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PromptInput from './PromptInput';
import CodeEditor from './CodeEditor';
import ActionButtons from './ActionButtons';
import ChatInterface from './ChatInterface';
import { LivePreview } from './LivePreview';
import { toast } from "@/hooks/use-toast";
import {
  generateCode,
  exportCode,
  deployCode,
  getSettingsManager
} from '@/services/aiService';

interface CyberLayoutProps {
  children?: React.ReactNode;
}

const CyberLayout: React.FC<CyberLayoutProps> = ({ children }) => {
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFromPrompt, setGeneratedFromPrompt] = useState('');
  const [taskId, setTaskId] = useState<string | undefined>(undefined);
  const [activeProvider, setActiveProvider] = useState('openai');
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API key on mount and storage changes
  useEffect(() => {
    const checkApiKey = () => {
      const openaiKey = localStorage.getItem('openai_api_key');
      const geminiKey = localStorage.getItem('gemini_api_key');
      const claudeKey = localStorage.getItem('claude_api_key');
      const hasAnyKey = !!(openaiKey || geminiKey || claudeKey);
      setHasApiKey(hasAnyKey);
      
      // Show welcome message for first-time users
      if (!hasAnyKey && !localStorage.getItem('welcome_shown')) {
        setTimeout(() => {
          toast({
            title: "Welcome to Cyber Prompt Builder!",
            description: "Get started by configuring a free Gemini API key in Settings. Click the gear icon in the top navigation.",
            duration: 8000,
          });
          localStorage.setItem('welcome_shown', 'true');
        }, 1000);
      }
    };

    checkApiKey();
    
    // Listen for storage changes (when API key is saved)
    window.addEventListener('storage', checkApiKey);
    
    // Also check on focus (when user comes back from getting API key)
    window.addEventListener('focus', checkApiKey);

    return () => {
      window.removeEventListener('storage', checkApiKey);
      window.removeEventListener('focus', checkApiKey);
    };
  }, []);

  const handleGenerateCode = async (prompt: string) => {
    if (!hasApiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenAI API key in the settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedFromPrompt(prompt);
    setCode(''); // Clear previous code

    try {
      const result = await generateCode({
        prompt,
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000
      });

      if (result.error) {
        toast({
          title: "Generation Failed",
          description: result.error,
          variant: "destructive",
        });
        setCode("");
      } else {
        setCode(result.code);
        setTaskId(result.taskId);
        
        const tokenInfo = result.usage 
          ? ` (${result.usage.total_tokens} tokens used)`
          : '';
          
        toast({
          title: "Code Generated Successfully",
          description: `Generated with OpenAI${tokenInfo}`,
        });
      }

    } catch (error: unknown) {
      console.error("Error generating code:", error);
      toast({
        title: "Generation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setCode("");
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
      const success = await exportCode(code, {
        format: 'file',
        fileName: `generated-code-${Date.now()}.txt`,
        includeMetadata: true
      });

      if (success) {
        toast({
          title: "Code Exported",
          description: "Your code has been downloaded as a file.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: "Failed to export the code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
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
      const success = await deployCode(code, {
        target: 'local',
        projectName: `cyber-project-${Date.now()}`
      });

      if (success) {
        toast({
          title: "Project Files Created",
          description: "HTML and README files have been downloaded for your project.",
        });
      } else {
        toast({
          title: "Deploy Failed",
          description: "Failed to create project files. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Error deploying code:", error);
      toast({
        title: "Deploy Failed",
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="flex flex-col gap-3">
                <div className="text-sm text-cyber-black font-orbitron uppercase flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
                  Actions
                </div>
                <ActionButtons onExport={handleExportCode} onDeploy={handleDeploy} />
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="text-sm text-cyber-black font-orbitron uppercase flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
                  AI Chat
                </div>
                <ChatInterface onCodeGenerated={(code) => setCode(code)} />
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="text-sm text-cyber-black font-orbitron uppercase flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
                  Live Preview
                </div>
                <LivePreview code={code} />
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>

      <footer className="h-10 chrome-gradient border-t border-cyber-bright-blue border-opacity-30 flex items-center justify-between px-4">
        <div className="text-xs text-cyber-black font-mono">
          Systems: {isGenerating ? "processing" : "operational"}
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500'} ${isGenerating ? 'animate-pulse' : ''}`}></div>
          <div className="text-xs text-cyber-black font-mono">
            AI Engine: {isGenerating ? "generating" : hasApiKey ? "ready" : "needs config"} | 
            {hasApiKey ? `Provider: ${activeProvider}` : "Configure API key in Settings"}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CyberLayout;
