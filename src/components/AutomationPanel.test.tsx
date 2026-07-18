import { render } from '@testing-library/react';
import React from 'react';
import AutomationPanel from './AutomationPanel';

describe('AutomationPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<AutomationPanel prompt="hi" apiKey="key" />);
    expect(container.firstChild).toBeTruthy();
  });
});
