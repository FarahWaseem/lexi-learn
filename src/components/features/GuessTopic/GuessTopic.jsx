import React, { useState } from 'react';

const GuessTopic = ({ lesson, onComplete, handleSpeak, currentlySpeaking }) => {
  const [guess, setGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleGuess = () => {
    const correct = guess.toLowerCase().includes(lesson.topic.toLowerCase());
    setIsCorrect(correct);
    setShowResult(true);
    
    setTimeout(() => {
      onComplete(correct);
    }, 2000);
  };

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-blue-200 shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Can you guess today's topic? 🤔</h2>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <img
          src={lesson.image}
          alt="hint"
          className="w-full h-48 object-cover rounded-lg mb-4"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=${encodeURIComponent(lesson.topic)}`;
          }}
        />
        
        <div className="flex gap-2 mb-4">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type your guess..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={handleGuess}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Guess!
          </button>
        </div>
        
        {showResult && (
          <div className={`mt-3 p-2 rounded-lg text-sm ${
            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isCorrect
              ? `🎉 Correct! Today's topic is ${lesson.topic}!`
              : `❌ Not quite! The topic is ${lesson.topic}.`}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuessTopic;