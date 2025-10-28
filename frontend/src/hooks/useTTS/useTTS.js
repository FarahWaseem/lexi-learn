import { useState, useCallback,useEffect } from 'react';
import { RealTTSService } from '../../services/TTSService';
import { stopAllSpeech } from '../../utils/speechUtils';


export const useTTS = (elevenLabsApiKey,whisperService, onTranscriptionComplete) => {
  const [ttsService, setTtsService] = useState(null);
  const [selectedTTS, setSelectedTTS] = useState('browser');
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const initializeTTS = useCallback(() => {
    const service = new RealTTSService(elevenLabsApiKey);
    setTtsService(service);
    return service;
  }, [elevenLabsApiKey]);

  useEffect(() => {
    const service = new RealTTSService(elevenLabsApiKey);
    setTtsService(service);
  }, [elevenLabsApiKey]);

const startRecording = useCallback(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      // أرسل للـ Whisper للتحويل
      try {
        const result = await whisperService.transcribeAudio(audioBlob);
        onTranscriptionComplete(result.transcript, result.correction);
      } catch (error) {
        console.error('Transcription failed:', error);
      }
    };
     
    setMediaRecorder(recorder);
    setAudioChunks(chunks);
    recorder.start();
    setIsRecording(true);
  } catch (error) {
    console.error('Recording failed:', error);
  }
}, [whisperService, onTranscriptionComplete]);

const stopRecording = useCallback(() => {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    setIsRecording(false);
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
}, [mediaRecorder, isRecording]);
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