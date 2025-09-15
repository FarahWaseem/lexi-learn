// src/components/features/VoiceRecorder/VoiceRecorder.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2, Loader2 } from 'lucide-react';

const VoiceRecorder = ({ onRecordingComplete, disabled = false, maxDuration = 10000 }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      if (isRecording) return;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        if (onRecordingComplete) {
          await onRecordingComplete(audioBlob);
        }
        
        stream.getTracks().forEach(track => track.stop());
        setIsProcessing(false);
        setRecordingTime(0);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // بدء timer للتسجيل
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration / 1000) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Recording failed:', error);
      alert('Microphone access required. Please allow permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-md">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <Mic className="mr-2 w-5 h-5" /> Voice Recorder
      </h3>
      
      <div className="flex items-center justify-center gap-4 mb-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
          className={`p-4 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300'
          }`}
        >
          {isRecording ? <Square size={24} /> : <Mic size={24} />}
        </button>
        
        {isRecording && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-red-600 font-medium">{formatTime(recordingTime)}</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex items-center">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-600">Processing...</span>
          </div>
        )}
      </div>

      {audioUrl && !isProcessing && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Last Recording:</h4>
          <audio controls src={audioUrl} className="w-full" />
          <button
            onClick={() => setAudioUrl('')}
            className="mt-2 text-sm text-red-500 hover:text-red-700"
          >
            Clear Recording
          </button>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        {isRecording 
          ? "● Recording... Speak clearly into your microphone" 
          : "Press the microphone button to start recording"}
      </div>
    </div>
  );
};

export default VoiceRecorder;