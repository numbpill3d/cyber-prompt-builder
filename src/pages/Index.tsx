
import React from 'react';
import CyberLayout from '@/components/CyberLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Zap, Code, Sparkles } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <CyberLayout>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Cyber Prompt Builder
          </h1>
          
          <p className="text-lg text-gray-300 mb-8">
            A powerful tool for building, testing, and automating AI prompts with advanced features
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-black/30 border border-purple-500/20 rounded-lg p-6">
              <Code className="h-8 w-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Prompt Engineering</h3>
              <p className="text-gray-400">
                Build and refine prompts with real-time analysis and suggestions
              </p>
            </div>
            
            <div className="bg-black/30 border border-purple-500/20 rounded-lg p-6">
              <Zap className="h-8 w-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Automation</h3>
              <p className="text-gray-400">
                Automate workflows with variable injection, distribution, and mutation
              </p>
            </div>
            
            <div className="bg-black/30 border border-purple-500/20 rounded-lg p-6">
              <Sparkles className="h-8 w-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Version Control</h3>
              <p className="text-gray-400">
                Track changes, compare versions, and roll back to previous iterations
              </p>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => navigate('/prompt-builder')}
          >
            <Zap className="h-5 w-5 mr-2" />
            Open Prompt Builder
          </Button>
        </div>
      </div>
    </CyberLayout>
  );
};

export default Index;
