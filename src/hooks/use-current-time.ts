import { useEffect, useState } from 'react';

export function useCurrentTime(intervalMs: number = 1000): string {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return time;
}
