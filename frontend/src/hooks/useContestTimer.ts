import { useEffect, useState, useCallback, useRef } from 'react';

interface UseContestTimerOptions {
  durationSeconds: number;
  storageKey: string;
  onTimeUp?: () => void;
  autoStart?: boolean;
}

interface UseContestTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  isExpired: boolean;
  formattedTime: string;
  start: () => void;
  reset: () => void;
}

/**
 * Custom hook for contest countdown timer with localStorage persistence
 * Timer persists across page refreshes
 */
export function useContestTimer({
  durationSeconds,
  storageKey,
  onTimeUp,
  autoStart = true,
}: UseContestTimerOptions): UseContestTimerReturn {
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledTimeUp = useRef<boolean>(false);

  // Initialize timer from localStorage or start new one
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedStartTime = localStorage.getItem(storageKey);
    const now = Date.now();

    if (storedStartTime) {
      const startTime = parseInt(storedStartTime, 10);
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setIsExpired(true);
        setIsRunning(false);
      } else if (autoStart) {
        setIsRunning(true);
      }
    } else if (autoStart) {
      // First time - start the timer
      const startTime = now;
      localStorage.setItem(storageKey, startTime.toString());
      setTimeLeft(durationSeconds);
      setIsRunning(true);
    }
  }, [storageKey, durationSeconds, autoStart]);

  // Timer countdown logic
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1);
        
        if (newTime <= 0) {
          setIsExpired(true);
          setIsRunning(false);
          
          // Call onTimeUp callback only once
          if (onTimeUp && !hasCalledTimeUp.current) {
            hasCalledTimeUp.current = true;
            onTimeUp();
          }
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUp]);

  // Format time as MM:SS
  const formattedTime = useCallback(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Start timer manually
  const start = useCallback(() => {
    if (!isExpired) {
      const now = Date.now();
      localStorage.setItem(storageKey, now.toString());
      setIsRunning(true);
    }
  }, [storageKey, isExpired]);

  // Reset timer
  const reset = useCallback(() => {
    localStorage.removeItem(storageKey);
    setTimeLeft(durationSeconds);
    setIsExpired(false);
    setIsRunning(false);
    hasCalledTimeUp.current = false;
  }, [storageKey, durationSeconds]);

  return {
    timeLeft,
    isRunning,
    isExpired,
    formattedTime: formattedTime(),
    start,
    reset,
  };
}
