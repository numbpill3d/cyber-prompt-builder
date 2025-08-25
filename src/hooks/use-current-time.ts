import { useEffect, useState } from 'react';

export function useCurrentTime(intervalMs: number = 1000): string {
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
