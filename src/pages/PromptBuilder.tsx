import React from 'react';
import CyberLayout from '@/components/CyberLayout';
import PromptWorkspace from '@/components/PromptWorkspace';

const PromptBuilder: React.FC = () => {
  return (
    <CyberLayout>
      <div className="h-full">
        <PromptWorkspace />
      </div>
    </CyberLayout>
  );
};

export default PromptBuilder;