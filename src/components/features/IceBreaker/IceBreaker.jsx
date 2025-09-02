// src/features/IceBreaker/IceBreaker.jsx
import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

const gameMap = { /* ...نفس الألعاب... */ };

const IceBreaker = ({ lesson, onComplete, handleSpeak }) => {
  // 1. تأكد من وجود الـ lesson + fallback
  const type = lesson?.iceBreaker?.type ?? 'hobby_mime';
  const config = gameMap[type] ?? gameMap.hobby_mime;

  // 2. لو ما في items رجع null (ما يظهر شي)
  if (!config?.items?.length) return null;

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const current = config.items[index];

  const buttonBase = 'px-5 py-2.5 rounded-lg font-semibold text-sm text-white shadow-md bg-gradient-to-br from-green-400 to-green-600 active:scale-95';
  const optionButton = 'px-4 py-2.5 rounded-lg text-sm font-medium shadow-md bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 active:scale-95';

  const handleAnswer = (answer) => {
    let correct = false;
    if (type === 'price_guess') correct = Math.abs(answer - current.correctPrice) <= 1;
    else correct = answer === current.correct;

    if (correct) setScore(s => s + 1);
    if (index < config.items.length - 1) setIndex(i => i + 1);
    else { setCompleted(true); setTimeout(onComplete, 1500); }
  };

  useEffect(() => { handleSpeak?.(config.title); }, []);

  if (completed) {
    return (
      <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200">
        <div className="text-6xl mb-3">🎉</div>
        <h3 className="text-2xl font-bold text-green-700">{score}/{config.items.length}</h3>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border-2 border-green-200 shadow-xl">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">{config.title}</h2>
        <p>Score: {score}/{config.items.length}</p>
      </div>
      {renderQuestion()}
    </div>
  );
};

export default IceBreaker;