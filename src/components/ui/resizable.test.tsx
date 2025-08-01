import { render } from '@testing-library/react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './resizable';
import React from 'react';

describe('Resizable panel components', () => {
  it('renders panel group with panels and handle', () => {
    const { container } = render(
      <ResizablePanelGroup>
        <ResizablePanel>One</ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>Two</ResizablePanel>
      </ResizablePanelGroup>
    );

    expect(container.firstChild).toBeTruthy();
  });
});
