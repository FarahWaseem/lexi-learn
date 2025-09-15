// الحصول على الأصوات المتاحة
export const getAvailableVoices = () => {
  if (!('speechSynthesis' in window)) return [];
  
  return window.speechSynthesis.getVoices().filter(voice => 
    voice.lang.startsWith('en-')
  );
};

// إعداد كائن الكلام
export const createSpeechUtterance = (text, voice, rate = 1, pitch = 1) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.rate = rate;
  utterance.pitch = pitch;
  return utterance;
};

// إيقاف كل الكلام الحالي
export const stopAllSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};