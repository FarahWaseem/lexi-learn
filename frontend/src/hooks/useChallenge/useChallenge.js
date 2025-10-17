import { useState, useCallback, useEffect } from 'react';
import { formatTime } from '../../utils/timeUtils';

export const useChallenge = (initialTime = 180) => {
  const [challengeTimer, setChallengeTimer] = useState(initialTime);
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  const startChallenge = useCallback((duration = initialTime) => {
    setChallengeTimer(duration);
    setChallengeActive(true);
    setChallengeCompleted(false);
  }, [initialTime]);

  const stopChallenge = useCallback(() => {
    setChallengeActive(false);
  }, []);

  const resetChallenge = useCallback((duration = initialTime) => {
    setChallengeTimer(duration);
    setChallengeActive(false);
    setChallengeCompleted(false);
  }, [initialTime]);

  const completeChallenge = useCallback(() => {
    setChallengeActive(false);
    setChallengeCompleted(true);
  }, []);

  useEffect(() => {
    let intervalId = null;

    if (challengeActive && challengeTimer > 0) {
      intervalId = setInterval(() => {
        setChallengeTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(intervalId);
            setChallengeActive(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    } else if (challengeTimer === 0 && challengeActive) {
      setChallengeActive(false);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [challengeActive, challengeTimer]);

  return {
    challengeTimer,
    challengeActive,
    setChallengeActive,
    challengeCompleted,
    startChallenge,
    stopChallenge,
    resetChallenge,
    completeChallenge,
    getFormattedTime: () => formatTime(challengeTimer)
  };
};