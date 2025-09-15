// src/hooks/useSpeechToText/useSpeechToText.js
import { useState, useCallback, useEffect } from 'react';
import { WhisperService } from '../../services/WhisperService';

export const useSpeechToText = () => {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [whisperService] = useState(new WhisperService());

  // التحقق من حالة الخادم
  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/day/1/question/1');
      setIsServerOnline(response.ok);
      return response.ok;
    } catch (error) {
      setIsServerOnline(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkServerStatus();
    
    // التحقق الدوري من حالة الخادم
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, [checkServerStatus]);

  const transcribeAudio = useCallback(async (audioBlob) => {
    if (!isServerOnline) {
      const errorMsg = "Voice recognition server is offline. Please make sure the server is running on port 3000.";
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsTranscribing(true);
    setError(null);
    
    try {
      console.log('Starting transcription...');
      const result = await whisperService.transcribeAudio(audioBlob);
      
      if (result.transcript) {
        setTranscript(result.transcript);
        console.log('Transcription successful:', result.transcript);
        return result;
      } else {
        throw new Error('No transcript received from server');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsTranscribing(false);
    }
  }, [isServerOnline, whisperService]);

  const startRealtimeTranscription = useCallback(async () => {
    // هذه الدالة يمكن تطويرها للتعرف على الصوت في الوقت الحقيقي
    console.log('Real-time transcription not implemented yet');
    return { stop: () => {} };
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const getServerStatus = useCallback(async () => {
    return await checkServerStatus();
  }, [checkServerStatus]);

  return {
    // البيانات
    transcript,
    isTranscribing,
    error,
    isServerOnline,
    
    // الدوال
    transcribeAudio,
    startRealtimeTranscription,
    resetTranscript,
    getServerStatus,
    checkServerStatus,
    
    // حالة
    hasTranscript: !!transcript.trim(),
    canTranscribe: isServerOnline && !isTranscribing
  };
};

// Hook مساعد للاستخدام السريع
export const useSimpleSpeechToText = () => {
  const { transcript, isTranscribing, error, transcribeAudio } = useSpeechToText();
  
  return {
    text: transcript,
    isLoading: isTranscribing,
    error,
    transcribe: transcribeAudio
  };
};