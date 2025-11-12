import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Terminal, Bug, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function DevTools() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-orbitron text-3xl font-bold mb-2 text-cyber-bright-blue">
          Developer Tools
        </h1>
        <p className="text-cyber-black opacity-70 mb-8">
          Advanced utilities for debugging and development
        </p>

        <Card className="cyberborder ice-card p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-bright-blue to-cyber-electric-purple flex items-center justify-center mb-6">
              <Code2 className="w-10 h-10 text-white" />
            </div>

            <h2 className="font-orbitron text-xl font-semibold mb-3 text-cyber-black">
              Coming Soon
            </h2>

            <p className="text-center text-cyber-black opacity-70 mb-8 max-w-md">
              Developer tools are currently under development. Soon you'll have access to:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Terminal className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">API Console</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Test API calls and inspect responses
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Bug className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Debug Logs</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    View detailed application logs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Zap className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Performance Monitor</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Analyze app performance metrics
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Code2 className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Code Inspector</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Examine generated code structure
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/builder"
              className="px-6 py-2 bg-gradient-to-r from-cyber-bright-blue to-cyber-electric-purple text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Go to Prompt Builder
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}