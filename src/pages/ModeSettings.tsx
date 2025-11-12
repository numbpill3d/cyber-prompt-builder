import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Sliders, Layers, Workflow } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ModeSettings() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-orbitron text-3xl font-bold mb-2 text-cyber-bright-blue">
          Mode Settings
        </h1>
        <p className="text-cyber-black opacity-70 mb-8">
          Configure mode-specific behavior and parameters
        </p>

        <Card className="cyberborder ice-card p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-bright-blue to-cyber-electric-purple flex items-center justify-center mb-6">
              <Settings className="w-10 h-10 text-white" />
            </div>

            <h2 className="font-orbitron text-xl font-semibold mb-3 text-cyber-black">
              Coming Soon
            </h2>

            <p className="text-center text-cyber-black opacity-70 mb-8 max-w-md">
              Mode-specific configuration is currently under development. Soon you'll be able to:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Sliders className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Parameter Tuning</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Fine-tune model parameters per mode
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Layers className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Layer Configuration</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Customize prompt layer behavior
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Workflow className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Workflow Presets</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Save and load mode presets
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Settings className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Advanced Options</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Access expert-level settings
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                to="/settings"
                className="px-6 py-2 bg-gradient-to-r from-cyber-bright-blue to-cyber-electric-purple text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Go to Settings
              </Link>
              <Link
                to="/builder"
                className="px-6 py-2 border-2 border-cyber-bright-blue text-cyber-bright-blue rounded-lg font-semibold hover:bg-cyber-bright-blue hover:text-white transition-all"
              >
                Go to Builder
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}