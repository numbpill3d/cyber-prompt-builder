import React, { useEffect, useRef, useState } from 'react';
import { generateStandaloneHtml } from '../services/response-handler';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Maximize, Minimize, RefreshCw } from 'lucide-react';

interface LivePreviewProps {
  html?: string;
  css?: string;
  js?: string;
  autoReload?: boolean;
  onReload?: () => void;
}

/**
 * LivePreview renders HTML/CSS/JS in an iframe sandbox
 */
export const LivePreview: React.FC<LivePreviewProps> = ({
  html,
  css,
  js,
  autoReload = false,
  onReload
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(400);
  const [iframeWidth, setIframeWidth] = useState('100%');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create the combined HTML to inject into the iframe
  const combinedHtml = generateStandaloneHtml({
    codeBlocks: {
      html: html || '',
      css: css || '',
      js: js || ''
    },
    meta: {
      model: '',
      provider: '',
      cost: 0,
      tokens: {
        input: 0,
        output: 0,
        total: 0
      },
      timestamp: Date.now(),
      duration: 0
    }
  });

  // Update the iframe content
  const updateIframe = () => {
    if (!iframeRef.current) return;
    
    try {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!doc) {
        setError('Could not access iframe document');
        return;
      }
      
      // Clear existing content
      doc.open();
      doc.write(combinedHtml);
      doc.close();
      
      // Try to catch window errors
      iframe.contentWindow?.addEventListener('error', (e) => {
        setError(`JavaScript error: ${e.message}`);
      });
      
      setError(null);
    } catch (err) {
      setError(`Error rendering preview: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Update iframe when code changes
  useEffect(() => {
    if (autoReload) {
      updateIframe();
    }
  }, [html, css, js, autoReload]);

  // Toggle fullscreen preview
  const toggleFullscreen = () => {
    if (isFullscreen) {
      // Exit fullscreen
      setIframeHeight(400);
      setIframeWidth('100%');
    } else {
      // Enter fullscreen
      setIframeHeight(window.innerHeight * 0.8);
      setIframeWidth('100%');
    }
    setIsFullscreen(!isFullscreen);
  };

  // Define different device sizes
  const deviceSizes = [
    { name: 'Mobile', width: '375px', height: 667 },
    { name: 'Tablet', width: '768px', height: 800 },
    { name: 'Desktop', width: '100%', height: 800 }
  ];

  // Change device size
  const changeDeviceSize = (width: string, height: number) => {
    setIframeWidth(width);
    setIframeHeight(height);
  };

  return (
    <Card className="overflow-hidden border border-gray-700 bg-gray-950">
      <div className="flex justify-between items-center p-2 border-b border-gray-700">
        <Tabs defaultValue="desktop" className="w-auto">
          <TabsList>
            {deviceSizes.map(device => (
              <TabsTrigger 
                key={device.name}
                value={device.name.toLowerCase()}
                onClick={() => changeDeviceSize(device.width, device.height)}
              >
                {device.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              updateIframe();
              if (onReload) onReload();
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div 
        className="bg-white overflow-hidden transition-all duration-300 flex justify-center"
        style={{ padding: iframeWidth !== '100%' ? '1rem' : 0 }}
      >
        <iframe
          ref={iframeRef}
          title="Live Preview"
          sandbox="allow-scripts allow-same-origin"
          className="border-0 bg-white transition-all duration-300"
          style={{ 
            width: iframeWidth, 
            height: `${iframeHeight}px`,
            maxWidth: '100%'
          }}
        />
      </div>
      
      {error && (
        <div className="p-4 bg-red-900 text-white text-sm">
          <p className="font-semibold">Preview Error:</p>
          <pre className="mt-1 text-xs overflow-auto">{error}</pre>
        </div>
      )}
      
      <div className="p-2 border-t border-gray-700 text-xs text-gray-400">
        Preview updates {autoReload ? 'automatically' : 'on reload'}.
        <span className="italic"> Sandbox restrictions apply.</span>
      </div>
    </Card>
  );
};