import React from 'react';
import { Link } from 'react-router-dom';

export default function DevTools() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dev Tools</h1>
      <p className="mb-4">Developer utilities and diagnostics will appear here in a later release.</p>
      <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
        Return to Home
      </Link>
    </div>
  );
}