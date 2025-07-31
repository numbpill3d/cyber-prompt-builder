import React from 'react';
import { Link } from 'react-router-dom';

export default function Settings() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <p className="mb-4">This section will let you configure application preferences in a future update.</p>
      <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
        Return to Home
      </Link>
    </div>
  );
}