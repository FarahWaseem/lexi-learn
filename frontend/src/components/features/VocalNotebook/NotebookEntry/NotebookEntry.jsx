import React from 'react';
import { Volume2, Pause, CheckCircle, XCircle, WifiOff } from 'lucide-react';

const NotebookEntry = ({ entry, handleSpeak, currentlySpeaking }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-semibold text-purple-600">"{entry.word}"</span>
          <button
            onClick={() => handleSpeak(entry.word)}
            className="ml-2 p-1 text-gray-400 hover:text-purple-500"
          >
            {currentlySpeaking === entry.word ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          {entry.ttsService === 'elevenlabs' && (
            <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded ml-1">
              11Labs
            </span>
          )}
          <span className="text-sm text-gray-500 ml-2">{entry.timestamp}</span>
        </div>
        <div className="flex items-center gap-2">
          {entry.needsSync && (
            <div className="text-xs text-orange-500 flex items-center">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </div>
          )}
          {entry.isCorrect !== null &&
            (entry.isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            ))}
        </div>
      </div>

      <div className="flex items-center bg-white p-2 rounded mb-2">
        <p className="flex-1">"{entry.sentence}"</p>
        <button
          onClick={() => handleSpeak(entry.sentence)}
          className="ml-2 p-1 text-gray-400 hover:text-blue-500"
        >
          {currentlySpeaking === entry.sentence ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {entry.feedback && (
        <div
          className={`text-sm p-2 rounded ${
            entry.needsSync
              ? 'bg-orange-100 text-orange-700'
              : entry.isCorrect
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          <strong>AI Feedback:</strong> {entry.feedback}
        </div>
      )}
    </div>
  );
};

export default NotebookEntry;