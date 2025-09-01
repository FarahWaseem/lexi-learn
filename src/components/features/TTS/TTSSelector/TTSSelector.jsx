import React from 'react';
import { Volume2, Headphones, WifiOff } from 'lucide-react';

const TTSSelector = ({ selectedTTS, setSelectedTTS, isOnline }) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
      <h3 className="font-semibold text-blue-800 flex items-center mb-3">
        <Headphones className="w-5 h-5 mr-2" />
        🎵 Text-to-Speech Service
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => setSelectedTTS('browser')}
          className={`p-3 rounded-lg border-2 transition-all ${
            selectedTTS === 'browser'
              ? 'border-blue-500 bg-blue-100'
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
        >
          <div className="text-center">
            <Volume2 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <h4 className="font-semibold text-sm">Browser TTS</h4>
            <p className="text-xs text-gray-600">Free • Works Offline</p>
          </div>
        </button>

        <button
          onClick={() => setSelectedTTS('elevenlabs')}
          disabled={!isOnline}
          className={`p-3 rounded-lg border-2 transition-all ${
            selectedTTS === 'elevenlabs'
              ? 'border-purple-500 bg-purple-100'
              : 'border-gray-200 bg-white hover:border-purple-300 disabled:bg-gray-100'
          }`}
        >
          <div className="text-center">
            <div className="w-6 h-6 mx-auto mb-2 bg-purple-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">11</span>
            </div>
            <h4 className="font-semibold text-sm">ElevenLabs</h4>
            <p className="text-xs text-gray-600">
              {isOnline ? 'AI Voice • Premium' : (
                <span className="text-red-500 flex items-center justify-center">
                  <WifiOff className="w-3 h-3 mr-1" /> Requires Internet
                </span>
              )}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default TTSSelector;