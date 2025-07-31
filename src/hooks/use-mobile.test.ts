import { renderHook } from '@testing-library/react';
import { useMobile, useIsMobile } from './use-mobile';

describe('useMobile', () => {
  it('should return false by default', () => {
    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(false);
  });
});

describe('useIsMobile', () => {
  it('should return false by default', () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
