// التحقق من الجملة
export const validateSentence = (sentence, word) => {
  if (!sentence || !word) return false;
  return sentence.toLowerCase().includes(word.toLowerCase());
};

// التحقق من صحة API key
export const isValidApiKey = (key) => {
  return key && key.length > 20;
};

// التحقق من اتصال الإنترنت
export const checkOnlineStatus = async () => {
  try {
    const response = await fetch('https://httpbin.org/status/200', {
      method: 'HEAD',
      cache: 'no-store'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};