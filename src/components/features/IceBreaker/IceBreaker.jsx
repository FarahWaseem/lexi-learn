import React, { useState } from 'react';
import { Volume2, Pause } from 'lucide-react';

const IceBreaker = ({ lesson, onComplete, handleSpeak, currentlySpeaking }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  if (!lesson?.iceBreaker?.questions || lesson.iceBreaker.questions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border-2 border-blue-200 shadow-lg mb-6">
        <h2 className="text-xl font-bold mb-4">No questions available</h2>
        <button
          onClick={() => onComplete()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Continue
        </button>
      </div>
    );
  }

  const handleGuess = () => {
    const actualPrice = lesson.iceBreaker.questions[currentQuestion].price;
    const userPrice = parseFloat(userGuess);
    
    const difference = Math.abs(userPrice - actualPrice);
    const percentageDiff = difference / actualPrice;
    
    if (percentageDiff <= 0.2) {
      setScore(score + 10);
    }
    
    setShowResult(true);
    setTimeout(() => {
      setShowResult(false);
      setUserGuess('');
      
      if (currentQuestion < lesson.iceBreaker.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        onComplete();
      }
    }, 2000);
  };

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-blue-200 shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4">{lesson.iceBreaker.title}</h2>
      <p className="text-gray-600 mb-4">{lesson.iceBreaker.description}</p>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Question {currentQuestion + 1} of {lesson.iceBreaker.questions.length}</h3>
        
        <div className="flex items-center mb-3">
          <button
            onClick={() => handleSpeak(lesson.iceBreaker.questions[currentQuestion].item)}
            className="p-2 text-blue-500 hover:bg-blue-100 rounded mr-2"
          >
            {currentlySpeaking === lesson.iceBreaker.questions[currentQuestion].item ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <p className="text-lg">How much do you think {lesson.iceBreaker.questions[currentQuestion].item} costs?</p>
        </div>
        
        <div className="flex gap-2 mb-4">
          <span className="text-2xl">$</span>
          <input
            type="number"
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            placeholder="Enter price"
            className="flex-1 px-3 py-2 border rounded-lg text-lg"
            step="0.01"
            min="0"
          />
        </div>
        
        <button
          onClick={handleGuess}
          disabled={!userGuess}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
        >
          Submit Guess
        </button>
        
        {showResult && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg">
            <p>The actual price is ${lesson.iceBreaker.questions[currentQuestion].price.toFixed(2)}</p>
            <p className="font-semibold">Your score: {score}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IceBreaker;