import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TokenMetrics from './TokenMetrics';

describe('TokenMetrics', () => {
  it('renders one status row with the current processing state', () => {
    render(<TokenMetrics isProcessing={false} />);

    expect(screen.getAllByText('Status')).toHaveLength(1);
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });
});
