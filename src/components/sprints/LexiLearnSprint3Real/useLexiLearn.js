import { useState, useEffect, useCallback } from 'react';
import { RealTTSService } from '../../services/TTSService';
import { GeminiAIService } from '../../services/AIService';
import { sampleLessons } from '../../data/lessons';

export const useLexiLearn = (elevenLabsKey, geminiKey) => {
  const [ttsService, setTtsService] = useState(null);
  const [aiService, setAiService] = useState(null);
  const [currentStep, setCurrentStep] = useState('loading');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [topicRevealed, setTopicRevealed] = useState(false);
  const [vocabNotebook, setVocabNotebook] = useState([]);
  const [currentSentence, setCurrentSentence] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [points, setPoints] = useState(150);
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  const [selectedTTS, setSelectedTTS] = useState('browser');
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [showVocabNotebook, setShowVocabNotebook] = useState(false);
  const [challengeTimer, setChallengeTimer] = useState(180);
  const [challengeActive, setChallengeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app with API keys...');
        
        // تهيئة الخدمات
        setTtsService(new RealTTSService(elevenLabsKey));
        setAiService(new GeminiAIService(geminiKey));
        
        // اختيار درس عشوائي
        const keys = Object.keys(sampleLessons);
        const random = keys[Math.floor(Math.random() * keys.length)];
        setSelectedLesson(sampleLessons[random]);
        const chosen = sampleLessons[random];
console.log('Chosen lesson:', chosen, 'iceBreaker?', !!chosen.iceBreaker);
setSelectedLesson(chosen);
        
        // الانتقال إلى خطوة كسر الجليد بعد التهيئة
        setCurrentStep('ice_breaker');
        console.log('App initialized successfully');
      } catch (err) {
        console.error('Error initializing app:', err);
        setError(`Failed to initialize: ${err.message}`);
      }
    };

    initializeApp();

    // مراقبة حالة الاتصال بالإنترنت
    const goOnline = () => {
      console.log('App is online');
      setIsOnline(true);
    };
    const goOffline = () => {
      console.log('App is offline');
      setIsOnline(false);
    };
    
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [elevenLabsKey, geminiKey]);

  // مؤقت التحدي
  useEffect(() => {
    let timer;
    if (challengeActive && challengeTimer > 0) {
      timer = setInterval(() => setChallengeTimer((s) => s - 1), 1000);
    } else if (challengeTimer === 0) {
      setChallengeActive(false);
    }
    return () => clearInterval(timer);
  }, [challengeActive, challengeTimer]);

  // دالة التحدث
  const handleSpeak = useCallback(async (text, ctx = 'word') => {
    if (!ttsService) {
      console.error('TTS service not available');
      return;
    }
    
    if (currentlySpeaking === text) {
      window.speechSynthesis.cancel();
      setCurrentlySpeaking(null);
      return;
    }

    setCurrentlySpeaking(text);
    setIsLoading(true);
    
    try {
      console.log(`Speaking with ${selectedTTS}:`, text);
      
      if (selectedTTS === 'elevenlabs' && isOnline) {
        await ttsService.speakWithElevenLabs(text);
      } else {
        await ttsService.speakWithBrowser(text);
      }
      
      if (ctx === 'word') setPoints((p) => p + 2);
    } catch (e) {
      console.error('Error in handleSpeak:', e);
      setError(`Speech error: ${e.message}`);
    } finally {
      setCurrentlySpeaking(null);
      setIsLoading(false);
    }
  }, [ttsService, selectedTTS, isOnline, currentlySpeaking, setPoints]);

  // تنسيق الوقت
  const formatTime = useCallback((s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`, []);

  // معالجة اكتمال كسر الجليد
  const handleIceBreakerComplete = useCallback(() => {
    setCurrentStep('guess_topic');
  }, []);

  // معالجة اكتمال تخمين الموضوع
  const handleGuessTopicComplete = useCallback((correct) => {
    setTopicRevealed(correct);
    if (correct) setPoints(p => p + 20);
    setCurrentStep('voice_chat');
  }, [setPoints]);

  // إرجاع جميع القيم والدوال
  return {
    ttsService,
    aiService,
    currentStep,
    selectedLesson,
    topicRevealed,
    vocabNotebook,
    setVocabNotebook,
    currentSentence,
    setCurrentSentence,
    selectedWord,
    setSelectedWord,
    isOnline,
    points,
    setPoints,
    currentlySpeaking,
    setCurrentlySpeaking,
    selectedTTS,
    setSelectedTTS,
    showDailyChallenge,
    setShowDailyChallenge,
    showVocabNotebook,
    setShowVocabNotebook,
    challengeTimer,
    setChallengeTimer,
    challengeActive,
    setChallengeActive,
    isLoading,
    setIsLoading,
    error,
    setError,
    handleSpeak,
    formatTime,
    handleIceBreakerComplete,
    handleGuessTopicComplete
  };
};