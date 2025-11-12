import React from 'react';
import { Link } from 'react-router-dom';
import { User, Shield, CreditCard, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Account() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-orbitron text-3xl font-bold mb-2 text-cyber-bright-blue">
          Account Settings
        </h1>
        <p className="text-cyber-black opacity-70 mb-8">
          Manage your profile and preferences
        </p>

        <Card className="cyberborder ice-card p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-bright-blue to-cyber-electric-purple flex items-center justify-center mb-6">
              <User className="w-10 h-10 text-white" />
            </div>

            <h2 className="font-orbitron text-xl font-semibold mb-3 text-cyber-black">
              Coming Soon
            </h2>

            <p className="text-center text-cyber-black opacity-70 mb-8 max-w-md">
              Account management features are currently under development. Soon you'll be able to:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <User className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Profile Management</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Update your profile and preferences
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Shield className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Security Settings</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Manage API keys and authentication
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Usage & Billing</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Track API usage and costs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white bg-opacity-50 rounded-lg">
                <Bell className="w-5 h-5 text-cyber-bright-blue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-cyber-black mb-1">Notifications</h3>
                  <p className="text-sm text-cyber-black opacity-70">
                    Configure alerts and updates
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
