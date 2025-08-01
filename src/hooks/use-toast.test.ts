import { renderHook, act } from '@testing-library/react';
import { useToast, toast } from './use-toast';

describe('useToast', () => {
  it('provides a toast function and list', () => {
    const { result } = renderHook(() => useToast());
    expect(typeof result.current.toast).toBe('function');
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it('calls console.log when toast is invoked', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast('hello');
    });

    expect(spy).toHaveBeenCalledWith('Toast:', 'hello');
    spy.mockRestore();
  });
});

describe('toast helper', () => {
  it('logs to console', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    toast('hi');
    expect(spy).toHaveBeenCalledWith('Toast:', 'hi');
    spy.mockRestore();
  });
});
