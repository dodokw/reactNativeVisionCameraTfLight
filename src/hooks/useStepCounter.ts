import { useEffect, useState } from 'react';
import { StepCounter } from '../native/StepCounter';

type StepCounterStatus = 'idle' | 'ready' | 'unavailable' | 'denied' | 'error';

export const useStepCounter = () => {
  const [todaySteps, setTodaySteps] = useState(0);
  const [status, setStatus] = useState<StepCounterStatus>('idle');

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let isMounted = true;

    const setupStepCounter = async () => {
      try {
        const available = await StepCounter.isAvailable();
        if (!isMounted) {
          return;
        }

        if (!available) {
          setStatus('unavailable');
          return;
        }

        const granted = await StepCounter.requestPermission();
        if (!isMounted) {
          return;
        }

        if (!granted) {
          setStatus('denied');
          return;
        }

        const steps = await StepCounter.getTodaySteps();
        if (!isMounted) {
          return;
        }

        setTodaySteps(steps);
        setStatus('ready');

        cleanup = StepCounter.startStepUpdates(nextSteps => {
          setTodaySteps(nextSteps);
        });
      } catch {
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    setupStepCounter();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, []);

  return {
    todaySteps,
    status,
  };
};
