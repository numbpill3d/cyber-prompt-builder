import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatInterface from '@/components/ChatInterface';
import CodeEditor from '@/components/CodeEditor';


export default function AgentLab() {
  const [code, setCode] = useState('');

  return (
<div className="container mx-auto px-4 py-8 space-y-6">
  <h1 className="text-2xl font-bold">Agent Lab</h1>
  <p className="mb-4">Experimental tools for building and testing agents will live here.</p>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
    <ChatInterface onCodeGenerated={setCode} />
    <CodeEditor code={code} setCode={setCode} className="h-[500px]" />
  </div>

  <Link 
    to="/" 
    className="text-blue-500 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-label="Navigate back to home page"
  >
    Ret

    </div>
  );
}