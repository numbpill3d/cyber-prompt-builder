import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Archive, Search, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function History() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-orbitron text-3xl font-bold mb-2 text-cyber-bright-blue">
          Prompt History
        </h1>
        <p className="text-cyber-black opacity-70 mb-8">
          View and manage your prompt generation history
        </p>

        <Card className="cyberborder ice-card p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-bright-blue to-cyber-electric-purple flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-white" />
            </div>

            <h2 className="font-orbitron text-xl font-semibold mb-3 text-cyber-black">
              Coming Soon
            </h2>

            <p className="text-center text-cyber-black opacity-70 mb-8 max-w-md">
              The History feature is currently under development. Soon you'll be able to:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Archive className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Archive Sessions</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Save and organize your prompt sessions
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Search className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Search History</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Find past prompts and results quickly
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <FileText className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Version Control</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Track changes and iterations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Clock className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Timeline View</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Visualize your prompt evolution
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
