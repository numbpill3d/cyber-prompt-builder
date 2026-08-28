import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { toast, useToast } from './use-toast';

describe('useToast', () => {
  afterEach(() => {
    const { result, unmount } = renderHook(() => useToast());
    act(() => result.current.dismiss());
    unmount();
  });

  it('provides toast controls and an initially empty list', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBe(toast);
    expect(result.current.dismiss).toBeTypeOf('function');
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast to subscribed consumers', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Saved', description: 'Prompt updated' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Saved',
      description: 'Prompt updated',
      open: true,
    });
  });
});
