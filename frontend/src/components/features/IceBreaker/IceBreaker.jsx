// src/features/IceBreaker/IceBreaker.jsx
import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

const gameMap = {
  price_guess: {
    title: "Price Guessing Game! 🛒",
    items: [
      {
        question: "How much does a loaf of bread cost?",
        options: [1, 3, 5, 8],
        correctPrice: 3
      },
      {
        question: "How much does a cup of coffee cost?",
        options: [2, 4, 6, 10],
        correctPrice: 4
      },
      {
        question: "How much does a movie ticket cost?",
        options: [8, 12, 15, 20],
        correctPrice: 15
      }
    ]
  },
  hobby_mime: {
    title: "Hobby Actions! 🎭",
    items: [
      {
        description: "Moving hands on a keyboard quickly",
        options: ["Typing", "Swimming", "Drawing", "Cooking"],
        correct: "Typing"
      },
      {
        description: "Holding a brush and making colors on paper",
        options: ["Painting", "Running", "Singing", "Reading"],
        correct: "Painting"
      },
      {
        description: "Kicking a ball towards a goal",
        options: ["Soccer", "Dancing", "Writing", "Sleeping"],
        correct: "Soccer"
      }
    ]
  },
  taste_challenge: {
    title: "Taste Challenge! 🍎",
    items: [
      {
        question: "What does lemon taste like?",
        options: ["Sweet", "Sour", "Salty", "Bitter"],
        correct: "Sour"
      },
      {
        question: "What does chocolate taste like?",
        options: ["Spicy", "Sweet", "Sour", "Bitter"],
        correct: "Sweet"
      },
      {
        question: "What does chili taste like?",
        options: ["Sweet", "Sour", "Spicy", "Salty"],
        correct: "Spicy"
      }
    ]
  },
  destination_match: {
    title: "Where in the World? 🌍",
    items: [
      {
        landmark: "Eiffel Tower",
        options: ["France", "Italy", "Spain", "Germany"],
        correct: "France"
      },
      {
        landmark: "Great Wall",
        options: ["China", "Japan", "Korea", "Vietnam"],
        correct: "China"
      },
      {
        landmark: "Pyramids",
        options: ["Egypt", "Mexico", "Peru", "India"],
        correct: "Egypt"
      }
    ]
  },
  family_tree: {
    title: "Family Tree Quiz! 👨‍👩‍👧‍👦",
    items: [
      {
        question: "Your father's sister is your...?",
        options: ["Aunt", "Uncle", "Cousin", "Grandma"],
        correct: "Aunt"
      },
      {
        question: "Your mother's mother is your...?",
        options: ["Aunt", "Grandma", "Sister", "Cousin"],
        correct: "Grandma"
      },
      {
        question: "Your uncle's son is your...?",
        options: ["Brother", "Cousin", "Nephew", "Son"],
        correct: "Cousin"
      }
    ]
  },
  weather_emoji: {
    title: "Weather Emoji Game! ☀️",
    items: [
      {
        emoji: "☀️",
        options: ["Sunny", "Rainy", "Cloudy", "Snowy"],
        correct: "Sunny"
      },
      {
        emoji: "🌧️",
        options: ["Windy", "Rainy", "Foggy", "Stormy"],
        correct: "Rainy"
      },
      {
        emoji: "⛄",
        options: ["Cold", "Hot", "Warm", "Humid"],
        correct: "Cold"
      }
    ]
  }
};

const IceBreaker = ({ lesson, onComplete, handleSpeak, currentlySpeaking }) => {
  const type = lesson?.iceBreaker?.type ?? 'hobby_mime';
  const config = gameMap[type] ?? gameMap.hobby_mime;

  if (!config?.items?.length) return null;

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const current = config.items[index];

  const optionButton = 'px-4 py-2.5 rounded-lg text-sm font-medium shadow-md bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 active:scale-95';

  const handleAnswer = (answer) => {
    let correct = false;
    if (type === 'price_guess') {
      correct = Math.abs(answer - current.correctPrice) <= 1;
    } else {
      correct = answer === current.correct;
    }

    if (correct) setScore(s => s + 1);
    
    if (index < config.items.length - 1) {
      setIndex(i => i + 1);
    } else {
      setCompleted(true);
      setTimeout(onComplete, 1500);
    }
  };

  useEffect(() => {
    handleSpeak?.(config.title);
  }, [handleSpeak, config.title]);

  if (completed) {
    return (
      <div className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200">
        <div className="text-6xl mb-3">🎉</div>
        <h3 className="text-2xl font-bold text-green-700">{score}/{config.items.length}</h3>
        <p className="text-green-600 mt-2">Great job! Let's continue...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border-2 border-green-200 shadow-xl">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{config.title}</h2>
        <p className="text-gray-600 mt-1">Score: {score}/{config.items.length}</p>
      </div>
      
      {(() => {
        switch (type) {
          case 'price_guess':
            return (
              <div className="text-center">
                <p className="text-lg font-medium mb-4">{current.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  {current.options.map((option, i) => (
                    <button
                      key={i}
                      className={optionButton}
                      onClick={() => handleAnswer(option)}
                    >
                      ${option}
                    </button>
                  ))}
                </div>
              </div>
            );

          case 'hobby_mime':
            return (
              <div className="text-center">
                <p className="text-lg font-medium mb-4">{current.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  {current.options.map((option, i) => (
                    <button
                      key={i}
                      className={optionButton}
                      onClick={() => handleAnswer(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            );

          case 'taste_challenge':
            return (
              <div className="text-center">
                <p className="text-lg font-medium mb-4">{current.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  {current.options.map((option, i) => (
                    <button
                      key={i}
                      className={optionButton}
                      onClick={() => handleAnswer(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            );

          case 'destination_match':
            return (
              <div className="text-center">
                <p className="text-lg font-medium mb-4">Where is {current.landmark} located?</p>
                <div className="grid grid-cols-2 gap-3">
                  {current.options.map((option, i) => (
                    <button
                      key={i}
                      className={optionButton}
                      onClick={() => handleAnswer(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            );

          case 'family_tree':
            return (
              <div className="text-center">
                <p className="text-lg font-medium mb-4">{current.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  {current.options.map((option, i) => (
                    <button
                      key={i}
                      className={optionButton}
                      onClick={() => handleAnswer(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            );

          case 'weather_emoji':
            return (
              <div className="text-center">
                <p className="text-4xl mb-4">{current.emoji}</p>
                <p className="text-sm text-gray-600 mb-4">What weather does this represent?</p>
                <div className="grid grid-cols-2 gap-3">
                  {current.options.map((option, i) => (
                    <button
                      key={i}
                      className={optionButton}
                      onClick={() => handleAnswer(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            );

          default:
            return (
              <div className="text-center">
                <p className="text-red-500">Game type not supported: {type}</p>
              </div>
            );
        }
      })()}

      <div className="mt-6 text-center">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${((index + 1) / config.items.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Question {index + 1} of {config.items.length}
        </p>
      </div>
    </div>
  );
};

export default IceBreaker;