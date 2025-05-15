import React from 'react';

interface PromptFlowDiagramProps {
  className?: string;
}

/**
 * Component that displays the prompt flow diagram
 */
const PromptFlowDiagram: React.FC<PromptFlowDiagramProps> = ({ className }) => {
  return (
    <div className={className}>
      <h2 className="text-xl font-orbitron text-cyber-bright-blue mb-4">
        Prompt to Code Flow
      </h2>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <img 
          src="/prompt-flow-diagram.svg" 
          alt="Prompt to Code Flow Diagram" 
          className="w-full max-w-4xl mx-auto"
        />
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-orbitron text-cyber-bright-blue text-lg mb-2">
            How It Works
          </h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>You enter a prompt describing the code you want to generate</li>
            <li>The system analyzes your prompt and enhances it with context</li>
            <li>The optimal AI provider is selected based on your prompt</li>
            <li>The AI generates code based on your requirements</li>
            <li>The response is parsed and formatted for display</li>
            <li>The generated code appears in the editor</li>
          </ol>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-orbitron text-cyber-bright-blue text-lg mb-2">
            Tips for Better Results
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Be specific about what you want the code to do</li>
            <li>Mention programming languages and frameworks</li>
            <li>Specify any requirements or constraints</li>
            <li>Ask for comments and documentation</li>
            <li>Mention edge cases you want handled</li>
            <li>Request specific patterns or approaches</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
        <h3 className="font-orbitron text-cyber-bright-blue text-lg mb-2">
          Example Prompt
        </h3>
        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
          Create a React component that displays a list of items with pagination. 
          The component should accept an array of items, items per page, and a callback 
          for when the page changes. Use TypeScript and include proper documentation.
        </div>
      </div>
    </div>
  );
};

export default PromptFlowDiagram;
