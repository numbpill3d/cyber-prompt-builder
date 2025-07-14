// Simplified toast hook
export function useToast() {
  return {
    toast: (message: any) => console.log('Toast:', message),
    toasts: []
  };
}

export const toast = (message: any) => console.log('Toast:', message);