import React, { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, Maximize2, Minimize2, ExternalLink } from 'lucide-react';

interface LivePreviewProps {
  code: string;
  onReload?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  code,
  onReload
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract HTML, CSS, and JS from code
  const extractCodeBlocks = (code: string) => {
    const htmlMatch = code.match(/```html\s*([\s\S]*?)```/i);
    const cssMatch = code.match(/```css\s*([\s\S]*?)```/i);
    const jsMatch = code.match(/```(?:js|javascript)\s*([\s\S]*?)```/i);
    
    return {
      html: htmlMatch?.[1]?.trim() || '',
      css: cssMatch?.[1]?.trim() || '',
      js: jsMatch?.[1]?.trim() || ''
    };
  };

  const { html, css, js } = extractCodeBlocks(code);

  // Create combined HTML document
  const createPreviewHtml = () => {
    if (!html && !css && !js) return '<p>No preview available</p>';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    try {
      ${js}
    } catch (e) {
      console.error('Preview JS Error:', e);
      document.body.innerHTML += '<div style="color: red; padding: 10px; border: 1px solid red; margin: 10px 0;">JS Error: ' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
  };

  // Update iframe content
  const updateIframe = () => {
    try {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(createPreviewHtml());
          doc.close();
          setError(null);
        }
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating iframe:', err);
    }
  };

  useEffect(() => {
    updateIframe();
  }, [code]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInNewTab = () => {
    const previewHtml = createPreviewHtml();
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const hasPreviewableContent = html || css || js;

  return (
    <Card className={`cyberborder ice-card hover-glow flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : 'h-[400px]'}`}>
      <div className="p-3 border-b border-cyber-bright-blue border-opacity-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
          <h3 className="font-orbitron text-sm text-cyber-bright-blue">Live Preview</h3>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={updateIframe}
            className="h-7 w-7 p-0 text-cyber-black hover:text-cyber-bright-blue"
            title="Refresh Preview"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="h-7 w-7 p-0 text-cyber-black hover:text-cyber-bright-blue"
            title="Open in New Tab"
            disabled={!hasPreviewableContent}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-7 w-7 p-0 text-cyber-black hover:text-cyber-bright-blue"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden">
        {hasPreviewableContent ? (
          <iframe
            ref={iframeRef}
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-cyber-black opacity-60">
            <div className="text-center">
              <ExternalLink className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No previewable content</p>
              <p className="text-xs mt-1">Generate HTML, CSS, or JavaScript to see preview</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 bg-red-50 border border-red-200 p-4 overflow-auto">
            <p className="font-medium text-red-800 mb-2">Preview Error:</p>
            <pre className="text-xs text-red-700 whitespace-pre-wrap">{error}</pre>
          </div>
        )}
      </div>
      
      <div className="p-2 border-t border-cyber-bright-blue border-opacity-30 text-xs text-cyber-black opacity-60">
        <div className="flex items-center justify-between">
          <span>Sandboxed preview environment</span>
          {hasPreviewableContent && (
            <span className="text-green-600">● Ready</span>
          )}
        </div>
      </div>
    </Card>
  );
};