
import React, { useState, useEffect } from 'react';
import { CodeBlock } from './CodeBlock';
import { Button } from './ui/button';
import { Download, Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language?: string;
  fileName?: string;
  onDownload?: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'typescript',
  fileName = 'code.txt',
  onDownload
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-white font-medium">{fileName}</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-gray-400 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-gray-400 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <CodeBlock code={code} language={language} />
      </div>
    </div>
  );
};
