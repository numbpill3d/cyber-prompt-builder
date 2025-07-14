import React from 'react';

interface LivePreviewProps {
  html?: string;
  css?: string;
  js?: string;
  autoReload?: boolean;
}

export default function LivePreview({ html, css, js, autoReload }: LivePreviewProps) {
  return (
    <div className="live-preview border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
      <div className="bg-gray-100 p-4 rounded">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="text-gray-500">No preview available</p>
        )}
      </div>
      {css && (
        <style>{css}</style>
      )}
    </div>
  );
}