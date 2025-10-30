import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Mic, Loader2, Volume2, Square } from 'lucide-react';
import { WhisperService } from '../../../../services/WhisperService';

const VoiceChat = ({ aiService, ttsService, selectedTTS, isOnline, handleSpeak }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your English practice assistant. What would you like to talk about today?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [whisperService] = useState(new WhisperService());
  const [serverStatus, setServerStatus] = useState('checking');

  const recordingTimeoutRef = useRef(null);

  // تحقق من حالة الخادم عند التحميل
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3001/api/day/1/question/1');
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      setServerStatus('offline');
      console.log('Server is offline - voice recognition will use fallback');
    }
  };

  // Initialize media recorder
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder, isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setIsLoading(true);
        
        try {
          let result;
          if (serverStatus === 'online') {
            result = await whisperService.transcribeAudio(audioBlob);
          } else {
            // Fallback إذا الخادم مش شغال
            result = {
              transcript: "Voice server is offline. Please type your message.",
              correction: "Server offline",
              note: "Run 'node server.js' to enable voice recognition"
            };
          }
          
          setInputMessage(result.transcript);
          
          // Auto-send only if it's actual speech, not error message
          if (result.transcript.trim() && !result.transcript.includes("server")) {
            await handleSendMessage(result.transcript);
          } else if (result.transcript.includes("server")) {
            // Show server error message
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: result.transcript 
            }]);
          }
        } catch (error) {
          console.error('Transcription failed:', error);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Speech recognition temporary unavailable. Please type your message." 
          }]);
        } finally {
          setIsLoading(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
      
      // Auto-stop after 10 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 10000);
      
    } catch (error) {
      console.error('Recording failed:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Microphone access is required for voice chat. Please allow microphone permissions." 
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    }
  };

  const handleSendMessage = async (text = null) => {
    const messageContent = text || inputMessage;
    if (!messageContent.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const response = await aiService.generateConversationResponse(messageContent, messages);
      const aiMessage = { role: 'assistant', content: response };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the response
      if (ttsService) {
        try {
          if (selectedTTS === 'elevenlabs' && isOnline) {
            await ttsService.speakWithElevenLabs(response);
          } else {
            await ttsService.speakWithBrowser(response);
          }
        } catch (speechError) {
          console.warn('Speech synthesis error (non-critical):', speechError);
          // لا تعطل المحادثة إذا فشل الصوت
        }
      }
    } catch (error) {
      console.error('Error in voice chat:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble responding right now. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-green-200 shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <MessageCircle className="mr-2" /> AI Voice Chat 🎤
      </h2>

      {/* Server Status Indicator */}
      <div className="mb-4 p-2 rounded-lg text-sm text-center">
        {serverStatus === 'online' ? (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✅ Server Online</span>
        ) : serverStatus === 'offline' ? (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⚠️ Voice Server Offline</span>
        ) : (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">🔍 Checking Server...</span>
        )}
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block p-3 rounded-lg max-w-xs ${
              msg.role === 'user' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {msg.content}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleSpeak(msg.content)}
                  className="ml-2 p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-200"
                  title="Play response"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="text-center">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-green-500" />
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleToggleRecording}
          disabled={isLoading || serverStatus === 'checking'}
          className={`flex items-center px-4 py-2 rounded-lg ${
            isRecording 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4 mr-1" /> Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-1" /> Start Recording
            </>
          )}
        </button>
        
        {isRecording && (
          <div className="flex items-center text-red-500">
            <div className="animate-pulse">● Recording...</div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={isRecording}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading || isRecording}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 flex items-center"
        >
          Send
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        {serverStatus === 'online' ? (
          "💡 Press the record button to speak, or type your message. Recording stops automatically after 10 seconds."
        ) : (
          "⚠️ Voice server is offline. Please type your messages or run 'node server.js' to enable voice recognition."
        )}
      </div>
    </div>
  );
};

export default VoiceChat;