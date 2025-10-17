// src/hooks/useLexiLearn/useLexiLearn.js
import { useState, useEffect, useCallback } from 'react';
import { useTTS } from '../useTTS/useTTS';
import { useChallenge } from '../useChallenge/useChallenge';
import { RealTTSService } from '../../services/TTSService';
import { GeminiAIService } from '../../services/AIService';
import { sampleLessons } from '../../data/lessons';

export const useLexiLearn = (elevenLabsKey, geminiKey) => {
  const [aiService, setAiService] = useState(null);
  const [currentStep, setCurrentStep] = useState('loading');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [topicRevealed, setTopicRevealed] = useState(false);
  const [vocabNotebook, setVocabNotebook] = useState([]);
  const [currentSentence, setCurrentSentence] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [points, setPoints] = useState(150);
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [showVocabNotebook, setShowVocabNotebook] = useState(false);
  const [error, setError] = useState('');

  const tts = useTTS(elevenLabsKey);
  const challenge = useChallenge();

  // تهيئة التطبيق مرة واحدة عند تغيّر المفاتيح
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app with API keys...');
        setAiService(new GeminiAIService(geminiKey));

        const keys = Object.keys(sampleLessons);
        const random = keys[Math.floor(Math.random() * keys.length)];
        setSelectedLesson(sampleLessons[random]);

        setCurrentStep('ice_breaker');
        console.log('App initialized successfully');
      } catch (err) {
        console.error('Error initializing app:', err);
        setError(`Failed to initialize: ${err.message}`);
      }
    };

    initializeApp();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [elevenLabsKey, geminiKey]);

  // تهيئة TTS لاحقاً عند تغيّر المفتاح فقط
  useEffect(() => {
    if (tts.initializeTTS) {
      tts.initializeTTS();
    }
  }, [elevenLabsKey]);

  const handleIceBreakerComplete = useCallback(() => {
    setCurrentStep('guess_topic');
  }, []);

  const handleGuessTopicComplete = useCallback(
    (correct) => {
      setTopicRevealed(correct);
      if (correct) setPoints((p) => p + 20);
      setCurrentStep('voice_chat');
    },
    [setPoints]
  );

  return {
    // From TTS
    ...tts,

    // From Challenge
    challengeTimer: challenge.challengeTimer,
    challengeActive: challenge.challengeActive,
    setChallengeActive: challenge.setChallengeActive,
    challengeCompleted: challenge.challengeCompleted,
    formatTime: challenge.getFormattedTime,

    // From LexiLearn
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
    showDailyChallenge,
    setShowDailyChallenge,
    showVocabNotebook,
    setShowVocabNotebook,
    error,
    setError,
    handleIceBreakerComplete,
    handleGuessTopicComplete,
  };
};