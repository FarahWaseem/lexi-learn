import React, { useState, useEffect } from 'react';

const lessons = [
  { id: 1, topic: 'Greetings', content: 'Hello! How are you?', vocab: ['Hello', 'How', 'You'] },
  { id: 2, topic: 'Daily Activities', content: 'I wake up at 7am.', vocab: ['Wake', 'Up', 'Morning'] },
  { id: 3, topic: 'Food', content: 'I like apples.', vocab: ['Like', 'Apples'] },
  { id: 4, topic: 'Travel', content: 'I am going to the market.', vocab: ['Going', 'Market'] },
];

const LexiLearn = () => {
  const [selectedLesson, setSelectedLesson] = useState(lessons[0]);
  const [step, setStep] = useState('iceBreaker'); 
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [timeLeft, setTimeLeft] = useState(180); // 3 دقائق

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  const handleNextStep = () => {
    if (step === 'iceBreaker') setStep('guessTopic');
    else if (step === 'guessTopic') setStep('vocab');
    else if (step === 'vocab') {
      setStep('dailyChallenge');
      setTimeLeft(180); // reset timer
    }
    else setStep('iceBreaker');
    setUserAnswer('');
    setFeedback('');
  };

  const handleCheckAnswer = () => {
    if (userAnswer.trim().toLowerCase() === selectedLesson.topic.toLowerCase()) {
      setFeedback('Correct ✅');
    } else {
      setFeedback(`Try again ❌ (Answer: ${selectedLesson.topic})`);
    }
  };

  // Timer للـ Daily Challenge
  useEffect(() => {
    if (step === 'dailyChallenge' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'dailyChallenge' && timeLeft === 0) {
      setFeedback("⏳ Time's up! Try again tomorrow.");
    }
  }, [timeLeft, step]);

  return (
    <div className="p-6 font-sans max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">LexiLearn</h1>

      {/* اختيار الدرس */}
      <div className="mb-6">
        <label className="mr-2 font-semibold">Choose Lesson:</label>
        <select
          className="border rounded p-2"
          value={selectedLesson.id}
          onChange={(e) => {
            const lesson = lessons.find(l => l.id === parseInt(e.target.value));
            setSelectedLesson(lesson);
            setStep('iceBreaker');
            setUserAnswer('');
            setFeedback('');
          }}
        >
          {lessons.map(lesson => (
            <option key={lesson.id} value={lesson.id}>{lesson.topic}</option>
          ))}
        </select>
      </div>

      {/* IceBreaker */}
      {step === 'iceBreaker' && (
        <div className="bg-blue-50 p-4 rounded-xl shadow mb-4">
          <h2 className="text-xl font-semibold mb-2">🧊 Ice Breaker</h2>
          <p className="mb-2">{selectedLesson.content}</p>
          <button
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => speak(selectedLesson.content)}
          >
            🔊 Play
          </button>
        </div>
      )}

      {/* Guess Topic */}
      {step === 'guessTopic' && (
        <div className="bg-green-50 p-4 rounded-xl shadow mb-4">
          <h2 className="text-xl font-semibold mb-2">🎯 Guess the Topic</h2>
          <input
            type="text"
            placeholder="Type your answer..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="border rounded p-2 w-full mb-2"
          />
          <button
            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={handleCheckAnswer}
          >
            Check
          </button>
          {feedback && <p className="mt-2 font-semibold">{feedback}</p>}
        </div>
      )}

      {/* Vocab Notebook */}
      {step === 'vocab' && (
        <div className="bg-yellow-50 p-4 rounded-xl shadow mb-4">
          <h2 className="text-xl font-semibold mb-2">📓 Vocabulary Notebook</h2>
          <ul className="space-y-2">
            {selectedLesson.vocab.map((word, index) => (
              <li key={index} className="flex items-center gap-2">
                ✅ <span className="font-medium">{word}</span>
                <button
                  className="ml-2 px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  onClick={() => speak(word)}
                >
                  🔊
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Daily Challenge */}
      {step === 'dailyChallenge' && (
        <div className="bg-purple-50 p-4 rounded-xl shadow mb-4">
          <h2 className="text-xl font-semibold mb-2">⚡ Daily Challenge</h2>
          <p className="mb-2">Write a sentence using at least 2 words from the vocabulary.</p>

          {/* Timer */}
          <p className="text-red-600 font-bold mb-2">
            ⏱ Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </p>

          <textarea
            rows="3"
            className="w-full border rounded p-2 mb-2"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={timeLeft === 0}
          />
          <button
            className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            onClick={() => setFeedback('Submitted! ✅')}
            disabled={timeLeft === 0}
          >
            Submit
          </button>
          {feedback && <p className="mt-2 font-semibold">{feedback}</p>}
        </div>
      )}

      {/* زر التنقل */}
      <button
        className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
        onClick={handleNextStep}
      >
        Next Step →
      </button>
    </div>
  );
};

export default LexiLearn;
