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
  const [newVocabulary, setNewVocabulary] = useState([]);
  const [extractedWords, setExtractedWords] = useState([]);

  const tts = useTTS(elevenLabsKey);
  const challenge = useChallenge();

  const extractVocabularyFromConversation = useCallback(async (conversationText, topic) => {
    if (!aiService || !conversationText) return;
    
    try {
      const prompt = `Extract 3-5 key vocabulary words related to ${topic} from this conversation. 
      Focus on words the learner might find challenging or useful for future practice.
      
      Conversation: "${conversationText}"
      
      Return ONLY a JSON array: ["word1", "word2", "word3"]`;
      
      const response = await aiService.generateContent(prompt);
          if (response && response.trim().startsWith('[')) {
      const words = JSON.parse(response);
      
      if (Array.isArray(words) && words.length > 0) {
        setExtractedWords(words);
        setVocabNotebook(prev => [...prev, ...words.map(word => ({
          word,
          topic,
          added: new Date().toLocaleDateString()
        }))]);
        
        setPoints(prev => prev + (words.length * 5));
        return;
      }
    } 
      // ✅ إذا فشل الاستخراج، استخدم كلمات افتراضية
    const defaultWords = ["conversation", "practice", "communication"];
    setExtractedWords(defaultWords);

  }catch (error) {
      console.error('Error extracting vocabulary:', error);
      const fallbackWords = ["language", "speak", "learn"];
    setExtractedWords(fallbackWords);
    }
  }, [aiService]);

  const handleGuessTopicSuccess = useCallback((topic) => {
    setCurrentStep('voice_chat');
    setTopicRevealed(true);
    tts.handleSpeak(`Great job guessing the topic! Today we're focusing on ${topic}. 
      Let's have a conversation about this topic. I'll help you practice and learn new words!`);
  }, [tts]);

  const handleConversationComplete = useCallback(async (conversationText) => {
    if (selectedLesson) {
      await extractVocabularyFromConversation(conversationText, selectedLesson.topic);
      tts.handleSpeak("I've extracted some useful words from our conversation. Let's review them together!");
    }
  }, [selectedLesson, extractVocabularyFromConversation, tts]);

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
      if (correct) {
        setPoints((p) => p + 20);
        handleGuessTopicSuccess(selectedLesson?.topic);  
      }
      setCurrentStep('voice_chat');
    },
    [setPoints, selectedLesson, handleGuessTopicSuccess]
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
    handleGuessTopicSuccess,
    handleGuessTopicComplete,
    extractVocabularyFromConversation, 
    handleConversationComplete, 
    extractedWords, 
    setExtractedWords 
  };
};