import React, { useState, useEffect } from 'react';
import { Brain, Check } from 'lucide-react';

const emojiMap = {
  Shopping: '🛍️🏪',
  'Food & Cooking': '🍳🥘',
  'Travel & Transportation': '✈️🗺️',
  'Family & Relationships': '👨‍👩‍👧‍👦❤️',
  'Weather & Seasons': '☀️🌧️',
  'Hobbies & Free Time': '🎨⚽',
};

const GuessTopic = ({ lesson, onComplete, handleSpeak,currentlySpeaking }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleGuess = () => {
    setShowResult(true);
    setTimeout(onComplete, 3000);
  };

  useEffect(() => {
    handleSpeak?.("Let’s guess today’s topic!");
  }, []);

  const handleCheckAnswer = () => {
    if (userAnswer.trim().toLowerCase() === lesson.topic.toLowerCase()) {
      setFeedback('Correct ✅');
      setShowResult(true);
      onComplete(true);
    } else {
      setFeedback(`Try again ❌ (Answer: ${lesson.topic})`);
      onComplete(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-blue-200 shadow-lg">
      <div className="text-center mb-6">
        <Brain className="w-12 h-12 mx-auto mb-3 text-blue-500" />
        <h2 className="text-2xl font-bold mb-2">Guess Today’s Topic! 🤔</h2>
        <p className="text-gray-600">Look at the image and guess what we’ll learn about today</p>
      </div>

      <div className="text-center">
        <div className="w-64 h-40 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
          <div className="text-center">
            <div className="text-5xl mb-2">{emojiMap[lesson.topic] || '📚'}</div>
            <p className="text-xs text-gray-500">Visual hints</p>
          </div>
        </div>

        {!showResult ? (
          <>
            <p className="text-lg mb-3 font-semibold">What do you think today’s topic is?</p>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your guess..."
              className="px-4 py-2 border border-gray-300 rounded-lg mr-2"
            />
            <button
              onClick={handleCheckAnswer}
              disabled={!userAnswer.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
            >
              Guess!
            </button>
            {feedback && <p className="mt-2 font-semibold">{feedback}</p>}
          </>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg">
            <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h3 className="text-xl font-bold text-green-700 mb-2">Great guess! 🎉</h3>
            <p className="text-lg">
              Today’s topic is: <strong>{lesson.topic}</strong>
            </p>
            <p className="text-gray-600 mt-2">{lesson.description}</p>
            <p className="text-sm text-gray-500 mt-2">Starting voice chat with AI…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuessTopic;