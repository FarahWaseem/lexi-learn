import { useState, useCallback,useEffect } from 'react';
import { RealTTSService } from '../../services/TTSService';
import { stopAllSpeech } from '../../utils/speechUtils';


export const useTTS = (elevenLabsApiKey) => {
  const [ttsService, setTtsService] = useState(null);
  const [selectedTTS, setSelectedTTS] = useState('browser');
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  const [isTTSLoading, setIsTTSLoading] = useState(false);

  const initializeTTS = useCallback(() => {
    const service = new RealTTSService(elevenLabsApiKey);
    setTtsService(service);
    return service;
  }, [elevenLabsApiKey]);

  useEffect(() => {
    const service = new RealTTSService(elevenLabsApiKey);
    setTtsService(service);
  }, [elevenLabsApiKey]);

  const handleSpeak = useCallback(async (text, context = 'word', isOnline = true) => {
    if (!text || text.trim() === '') {
    console.error('Empty text provided for speech');
    return false;
  }
  if (!ttsService) {
      console.error('TTS service not available');
      return;
    }
    
    if (currentlySpeaking === text) {
      stopAllSpeech();
      setCurrentlySpeaking(null);
      return;
    }

    setCurrentlySpeaking(text);
    setIsTTSLoading(true);
    
    try {
      console.log(`Speaking with ${selectedTTS}:`, text);
      
         let success = false;
    if (selectedTTS === 'elevenlabs' && isOnline) {
      try {
        await ttsService.speakWithElevenLabs(text);
        success = true;
      } catch (error) {
        console.warn('ElevenLabs failed, falling back to browser TTS');
        await ttsService.speakWithBrowser(text);
        success = true;
      }
    } else {
      await ttsService.speakWithBrowser(text);
      success = true;
    }
    
    return success;
  } catch (error) {
    console.error('Error in handleSpeak:', error);
    return false;
  } finally {
    setCurrentlySpeaking(null);
    setIsTTSLoading(false);
  }
}, [ttsService, selectedTTS, currentlySpeaking]);


  const changeTTSService = useCallback((service) => {
    stopAllSpeech();
    setCurrentlySpeaking(null);
    setSelectedTTS(service);
  }, []);

  const stopSpeech = useCallback(() => {
    stopAllSpeech();
    setCurrentlySpeaking(null);
  }, []);

  return {
    ttsService,
    selectedTTS,
    setSelectedTTS: changeTTSService,
    currentlySpeaking,
    isTTSLoading,
    handleSpeak,
    stopSpeech,
    initializeTTS
  };
};