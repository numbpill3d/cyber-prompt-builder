import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useIsMobile, useMobile } from './use-mobile';

describe('mobile viewport hooks', () => {
  it('returns the legacy object shape from useMobile', () => {
    const { result } = renderHook(() => useMobile());

    expect(result.current).toEqual({ isMobile: false });
  });

  it('returns a boolean from useIsMobile', () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});
