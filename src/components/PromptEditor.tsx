import React from 'react';

export interface PromptEditorProps {
  initialPrompt?: string;
  sessionId?: string;
  onSave?: (sessionId: string, prompt: string) => void;
  onExecute?: (prompt: string) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = () => {
  return <div>PromptEditor</div>;
};

export default PromptEditor;
