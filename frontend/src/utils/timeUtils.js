// تنسيق الوقت
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// مؤقت العد التنازلي
export const createCountdown = (initial, callback, completeCallback) => {
  let time = initial;
  let intervalId = null;

  const start = () => {
    if (intervalId) clearInterval(intervalId);
    
    intervalId = setInterval(() => {
      time--;
      callback(time);
      
      if (time <= 0) {
        clearInterval(intervalId);
        completeCallback();
      }
    }, 1000);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const reset = (newTime = initial) => {
    stop();
    time = newTime;
  };

  return { start, stop, reset };
};