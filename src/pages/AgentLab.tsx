import React from 'react';
import { Link } from 'react-router-dom';

export default function AgentLab() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Agent Lab</h1>
      <p className="mb-4">Experimental tools for building and testing agents will live here.</p>
      <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
        Return to Home
      </Link>
    </div>
  );
}