
import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { CodeBlock } from './CodeBlock';

interface CodeFile {
  name: string;
  content: string;
  language: string;
}

interface CodePaneProps {
  files: CodeFile[];
}

export const CodePane: React.FC<CodePaneProps> = ({ files }) => {
  return (
    <div className="h-full bg-gray-900 text-white">
      {files.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">No code to display</p>
        </div>
      ) : files.length === 1 ? (
        <div className="h-full overflow-auto">
          <CodeBlock
            code={files[0].content}
            language={files[0].language}
          />
        </div>
      ) : (
        <Tab.Group>
          <Tab.List className="flex space-x-1 bg-gray-800 p-1">
            {files.map((file, index) => (
              <Tab
                key={index}
                className={({ selected }) =>
                  `px-3 py-2 text-sm font-medium rounded-md focus:outline-none ${
                    selected
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`
                }
              >
                {file.name}
              </Tab>
            ))}
          </Tab.List>
          
          <Tab.Panels className="h-full overflow-auto">
            {files.map((file, index) => (
              <Tab.Panel key={index} className="h-full">
                <CodeBlock
                  code={file.content}
                  language={file.language}
                />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      )}
    </div>
  );
};
