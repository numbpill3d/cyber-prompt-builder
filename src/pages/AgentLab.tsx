import React, { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import CodeEditor from '@/components/CodeEditor';

export default function AgentLab() {
  const [code, setCode] = useState('');

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Agent Lab</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
        <ChatInterface onCodeGenerated={setCode} />
        <CodeEditor code={code} setCode={setCode} className="h-[500px]" />
      </div>
    </div>
  );
}