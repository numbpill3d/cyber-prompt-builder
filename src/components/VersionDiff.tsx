import React from 'react';
import { Card } from './ui/card';

interface VersionDiffProps {
  sessionId: string;
  onRollback: (snapshotId: string) => void;
}

const VersionDiff: React.FC<VersionDiffProps> = ({ sessionId }) => {
  return (
    <Card className="p-4 bg-black/30 border-purple-500/10">
      <p className="text-sm text-gray-400">Version history for session {sessionId} is not available.</p>
    </Card>
  );
};

export default VersionDiff;
