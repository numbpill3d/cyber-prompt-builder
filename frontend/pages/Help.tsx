import React from 'react';
import CyberLayout from '@frontend/components/CyberLayout';
import PromptFlowDiagram from '@frontend/components/PromptFlowDiagram';

const Help = () => {
  return (
    <CyberLayout>
      <div className="max-w-5xl mx-auto w-full mt-8">
        <h1 className="font-orbitron text-2xl md:text-3xl text-center text-cyber-bright-blue mb-8">
          Help & Documentation
        </h1>
        
        <div className="grid grid-cols-1 gap-8">
          <section>
            <PromptFlowDiagram />
          </section>
          
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-orbitron text-cyber-bright-blue mb-4">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg">How do I get started?</h3>
                <p className="mt-1">
                  Simply enter a prompt describing the code you want to generate in the main input field and click "Generate Code". The AI will analyze your prompt and generate code based on your requirements.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg">Which AI providers are supported?</h3>
                <p className="mt-1">
                  The application supports OpenAI (GPT models), Anthropic (Claude models), and Google (Gemini models). You can configure your API keys in the Settings page.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg">How do I set up my API keys?</h3>
                <p className="mt-1">
                  Go to the Settings page and enter your API keys for the providers you want to use. The application will securely store your keys and use them to generate code.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg">How can I improve the quality of generated code?</h3>
                <p className="mt-1">
                  Be specific in your prompts. Include details about the programming language, frameworks, and any specific requirements. You can also provide examples or constraints to guide the AI.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg">Can I edit the generated code?</h3>
                <p className="mt-1">
                  Yes, the code editor allows you to modify the generated code. You can also export the code or deploy it directly from the application.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg">How does the provider selection work?</h3>
                <p className="mt-1">
                  By default, the application uses your selected provider. You can also enable automatic routing, which selects the best provider based on your prompt's complexity and requirements.
                </p>
              </div>
            </div>
          </section>
          
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-orbitron text-cyber-bright-blue mb-4">
              Additional Resources
            </h2>
            
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <a href="/PROMPT_EXAMPLES.md" className="text-blue-600 hover:underline">
                  Prompt Examples
                </a> - Examples of effective prompts for different types of code
              </li>
              <li>
                <a href="/PROMPT_FLOW.md" className="text-blue-600 hover:underline">
                  Prompt Flow Documentation
                </a> - Detailed explanation of how prompts are processed
              </li>
              <li>
                <a href="/DEPLOYMENT.md" className="text-blue-600 hover:underline">
                  Deployment Guide
                </a> - Instructions for deploying the application
              </li>
              <li>
                <a href="https://github.com/yourusername/cyber-prompt-builder" className="text-blue-600 hover:underline">
                  GitHub Repository
                </a> - Source code and documentation
              </li>
            </ul>
          </section>
        </div>
      </div>
    </CyberLayout>
  );
};

export default Help;
