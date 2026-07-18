import React from 'react';

export interface PromptEditorProps {
  initialPrompt?: string;
  sessionId?: string;
  onSave?: (sessionId: string, prompt: string) => void;
  onExecute?: (prompt: string) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = (props) => {
  // Placeholder component - props will be implemented later
  return <div>PromptEditor</div>;
};

export default PromptEditor;
