import { useEffect, useState } from 'react';

export function useCurrentTime(intervalMs: number = 1000): string {
  const [time, setTime] = useState(() => {
    try {
      return new Date().toLocaleTimeString();
    } catch (error) {
      console.error('Error getting current time:', error);
      return 'Error';
    }
  });

  useEffect(() => {
    const id = setInterval(() => {
      setTime(() => {
        try {
          return new Date().toLocaleTimeString();
        } catch (error) {
          console.error('Error updating time:', error);
          return 'Error';
        }
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return time;
}