import { useEffect, useState } from 'react';

export function useCurrentTime(intervalMs: number = 1000): string {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
import { useEffect, useState } from 'react';
import { useSharedTimer } from './sharedTimer'; // Assume this is implemented elsewhere

export function useCurrentTime(intervalMs: number = 1000): string {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const unsubscribe = useSharedTimer(intervalMs, () => {
      setTime(new Date().toLocaleTimeString());
    });
    return () => unsubscribe();
  }, [intervalMs]);

  return time;
    return () => clearInterval(id);
  }, [intervalMs]);

  return time;
}
