import React from 'react';
import { Link } from 'react-router-dom';

export default function ModeSettings() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mode Settings</h1>
      <p className="mb-4">Mode specific configuration will appear here once implemented.</p>
      <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
        Return to Home
      </Link>
    </div>
  );
}