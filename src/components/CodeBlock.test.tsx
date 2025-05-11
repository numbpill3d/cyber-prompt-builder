import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CodeBlock } from './CodeBlock';

// Mock the SyntaxHighlighter component to simplify testing
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: React.ReactNode }) => (
    <pre data-testid="syntax-highlighter">{children}</pre>
  )
}));

// Mock the styles import
vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  coldarkDark: {}
}));

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve())
  },
  configurable: true
});

describe('CodeBlock Component', () => {
  const defaultProps = {
    code: 'const test = "Hello, World!";',
    language: 'js'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('renders correctly with default props', () => {
    render(<CodeBlock {...defaultProps} />);
    
    // Check if code content is rendered
    expect(screen.getByTestId('syntax-highlighter')).toHaveTextContent(defaultProps.code);
    
    // Check if language is displayed correctly (JavaScript instead of js)
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    
    // Check if default filename is shown
    expect(screen.getByText('code.js')).toBeInTheDocument();
  });

  it('renders with custom filename', () => {
    render(<CodeBlock {...defaultProps} fileName="test-script.js" />);
    expect(screen.getByText('test-script.js')).toBeInTheDocument();
  });

  it('maps languages correctly', () => {
    render(<CodeBlock code={defaultProps.code} language="py" />);
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('handles markdown with proper default filename', () => {
    render(<CodeBlock code="# Heading" language="md" />);
    expect(screen.getByText('README.md')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
  });

  it('shows copy button and copies text when clicked', async () => {
    render(<CodeBlock {...defaultProps} />);
    
    // Click copy button
    const copyButton = screen.getByRole('button', { name: /copy code/i });
    fireEvent.click(copyButton);
    
    // Check if clipboard API was called with correct text
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.code);
    
    // Check if UI shows copied state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
    });
    
    // Fast-forward timers to clear the copied state
    vi.advanceTimersByTime(2500);
    
    // Check if copied state is cleared
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
    });
  });

  it('calls onCopy callback when copy button is clicked', () => {
    const onCopy = vi.fn();
    render(<CodeBlock {...defaultProps} onCopy={onCopy} />);
    
    const copyButton = screen.getByRole('button', { name: /copy code/i });
    fireEvent.click(copyButton);
    
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('renders regenerate button when onRegenerate is provided', () => {
    const onRegenerate = vi.fn();
    render(<CodeBlock {...defaultProps} onRegenerate={onRegenerate} />);
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate code/i });
    expect(regenerateButton).toBeInTheDocument();
    
    fireEvent.click(regenerateButton);
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('renders download button when onDownload is provided', () => {
    const onDownload = vi.fn();
    render(<CodeBlock {...defaultProps} onDownload={onDownload} />);
    
    const downloadButton = screen.getByRole('button', { name: /download file/i });
    expect(downloadButton).toBeInTheDocument();
    
    fireEvent.click(downloadButton);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('does not render regenerate or download buttons when callbacks are not provided', () => {
    render(<CodeBlock {...defaultProps} />);
    
    expect(screen.queryByRole('button', { name: /regenerate code/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download file/i })).not.toBeInTheDocument();
  });

  it('resets copied state when code changes', () => {
    const { rerender } = render(<CodeBlock {...defaultProps} />);
    
    // Click copy button
    const copyButton = screen.getByRole('button', { name: /copy code/i });
    fireEvent.click(copyButton);
    
    // Check if UI shows copied state
    expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
    
    // Rerender with new code
    rerender(<CodeBlock code="newCode();" language="js" />);
    
    // Check if copied state is reset
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
  });
});