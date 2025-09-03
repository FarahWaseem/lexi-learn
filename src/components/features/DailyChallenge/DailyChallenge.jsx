import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Clock, Timer, Zap, Wand2, Volume2 } from 'lucide-react';
import ChallengeCard from './ChallengeCard/ChallengeCard';

const DailyChallenge = ({
  selectedLesson,
  setPoints,
  handleSpeak,
  currentlySpeaking,
  aiService
}) => {
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeTimer, setChallengeTimer] = useState(180);
  const [currentChallenges, setCurrentChallenges] = useState([
    {
      type: 'pronunciation',
      title: 'Pronunciation Challenge 🎯',
      instruction: 'Listen and repeat these words correctly',
      words: selectedLesson?.vocabulary?.slice(0, 3) || ['market', 'price', 'buy'],
      completed: false,
      points: 25,
    },
    {
      type: 'sentence_building',
      title: 'Sentence Building Challenge 🏗️',
      instruction: 'Use these words in meaningful sentences',
      words: selectedLesson?.vocabulary?.slice(3, 5) || ['sell', 'customer'],
      completed: false,
      points: 30,
    },
    // ✅ أضفت Quick Quiz هنا!
    {
      type: 'quick_quiz',
      title: 'Quick Quiz Challenge ❓',
      instruction: 'Test your vocabulary knowledge',
      completed: false,
      points: 35,
      questions: [
        {
          word: "market",
          question: "What does 'market' mean?",
          options: ["A place to buy goods", "A type of food", "A vehicle", "A color"],
          correct: "A place to buy goods"
        },
        {
          word: "price",
          question: "What is the meaning of 'price'?",
          options: ["The cost of something", "A prize you win", "A type of rice", "A measurement"],
          correct: "The cost of something"
        },
        {
          word: "customer",
          question: "Who is a 'customer'?",
          options: ["A person who buys things", "A store owner", "A product", "A payment method"],
          correct: "A person who buys things"
        }
      ]
    }
  ]);

  const [showGrammarCorrection, setShowGrammarCorrection] = useState(false);
  const [grammarFeedback, setGrammarFeedback] = useState([]);
  const [correctingGrammar, setCorrectingGrammar] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizFeedback, setQuizFeedback] = useState({});

  // دالة جديدة لتصحيح القواعد
  const checkGrammarWithAI = async () => {
    if (!aiService || !userAnswers) return;
    
    setCorrectingGrammar(true);
    const feedbacks = [];
    
    try {
      for (const [word, sentence] of Object.entries(userAnswers)) {
        if (sentence.trim()) {
          try {
            const result = await aiService.checkSentence(word, sentence);
            feedbacks.push({
              word,
              sentence,
              isCorrect: result.isCorrect,
              feedback: result.feedback,
              source: result.source
            });
          } catch (error) {
            feedbacks.push({
              word,
              sentence,
              isCorrect: false,
              feedback: 'Unable to check with AI',
              source: 'error'
            });
          }
        }
      }
    } catch (error) {
      console.error('Grammar check failed:', error);
    } finally {
      setGrammarFeedback(feedbacks);
      setShowGrammarCorrection(true);
      setCorrectingGrammar(false);
    }
  };
  useEffect(() => {
    let intervalId = null;

    if (challengeActive && challengeTimer > 0) {
      intervalId = setInterval(() => {
        setChallengeTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(intervalId);
            setChallengeActive(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [challengeActive, challengeTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

   const completeChallenge = (index) => {
    const updated = [...currentChallenges];
    updated[index].completed = true;
    setCurrentChallenges(updated);
    setPoints(p => p + updated[index].points);
    setCompletedChallenges(c => c + 1);
    
    if (updated.every(c => c.completed)) {
      setChallengeActive(false);
      setPoints(p => p + 50);
      
      // ✅ تحقق إذا هناك جمل لتصحيحها
      if (Object.keys(userAnswers).length > 0) {
        setTimeout(() => {
          checkGrammarWithAI();
        }, 1000);
      }
    }
  };

  const startChallenge = () => {
    setChallengeActive(true);
    setChallengeTimer(180);
    setCurrentChallenges(challenges => challenges.map(c => ({ ...c, completed: false })));
    setCompletedChallenges(0);
    setUserAnswers({});
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-200">
      <div className="text-center mb-6">
        <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Daily Challenge 🌟</h2>
        <p className="text-gray-600">Complete all challenges within 3 minutes!</p>
        {challengeActive && (
          <div className="mt-4 inline-flex items-center bg-white px-4 py-2 rounded-lg border-2 border-orange-300">
            <Clock className="w-5 h-5 text-orange-500 mr-2" />
            <span className={`text-lg font-bold ${challengeTimer < 30 ? 'text-red-500' : 'text-gray-700'}`}>
              {formatTime(challengeTimer)}
            </span>
          </div>
        )}
      </div>

      {!challengeActive && completedChallenges === 0 && (
        <button onClick={startChallenge} className="w-full py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold">
          Start 3-Minute Challenge
        </button>
      )}

      {challengeTimer === 0 && completedChallenges < currentChallenges.length && (
        <div className="text-center bg-orange-50 p-6 rounded-lg">
          <Timer className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-orange-700 mb-2">Time's Up! ⏰</h3>
          <p className="text-gray-600 mb-4">
            You completed {completedChallenges} out of {currentChallenges.length} challenges
          </p>
          <button onClick={startChallenge} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Try Again
          </button>
        </div>
      )}

      {completedChallenges === currentChallenges.length && (
        <div className="text-center bg-green-50 p-6 rounded-lg">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-700 mb-2">Challenge Complete! 🎉</h3>
          <p className="text-lg mb-2">You earned {currentChallenges.reduce((s, c) => s + c.points, 0) + 50} points!</p>
          {/* ✅ زر لتصحيح القواعد - أضف هذا */}
    {Object.keys(userAnswers).length > 0 && !showGrammarCorrection && (
      <button
        onClick={checkGrammarWithAI}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center mx-auto"
      >
        <Wand2 className="w-5 h-5 mr-2" />
        Check Grammar with AI
      </button>
    )}
  </div>
)}

{/* ✅ واجهة تصحيح القواعد - أضف هذا بعد قسم Challenge Complete */}
{showGrammarCorrection && (
  <div className="mt-6 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
    <div className="flex items-center justify-center mb-4">
      <Wand2 className="w-8 h-8 text-blue-500 mr-2" />
      <h3 className="text-xl font-bold text-blue-700">AI Grammar Correction 🧠</h3>
    </div>

    {correctingGrammar ? (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-blue-600 mt-2">AI is checking your sentences...</p>
      </div>
    ) : (
      <div className="space-y-4">
        {grammarFeedback.map((item, index) => (
          <div key={index} className={`p-4 rounded-lg ${
            item.isCorrect ? 'bg-green-100 border-green-200' : 'bg-orange-100 border-orange-200'
          } border`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">"{item.word}"</h4>
                <p className="text-gray-700 mt-1">Your sentence: <span className="font-medium">"{item.sentence}"</span></p>
                <p className={`mt-2 text-sm ${
                  item.isCorrect ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {item.isCorrect ? '✅ ' : '❌ '}
                  {item.feedback}
                </p>
                <p className="text-xs text-gray-500 mt-1">Source: {item.source}</p>
              </div>
              
              {!item.isCorrect && (
                <button
                  onClick={() => handleSpeak(item.sentence, 'sentence')}
                  className="ml-2 p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {!item.isCorrect && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-semibold mb-2">💡 Suggestion:</p>
                <p className="text-sm text-gray-700">
                  Try: "I {item.word === 'go' ? 'went' : 'will go'} to the {item.word} yesterday"
                </p>
              </div>
            )}
          </div>
        ))}
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowGrammarCorrection(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
          <button
            onClick={checkGrammarWithAI}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
          >
            <Wand2 className="w-4 h-4 mr-1" />
            Re-check with AI
          </button>
        </div>
      </div>
    )}
  </div>
)} 

      {challengeActive && completedChallenges < currentChallenges.length && (
        <div className="space-y-4">
          {currentChallenges.map((challenge, index) => (
            <ChallengeCard
              key={index}
              challenge={challenge}
              index={index}
              onComplete={completeChallenge}
              handleSpeak={handleSpeak}
              currentlySpeaking={currentlySpeaking}
              userAnswers={userAnswers}
              setUserAnswers={setUserAnswers}
              selectedAnswers={selectedAnswers} 
              setSelectedAnswers={setSelectedAnswers} 
              quizFeedback={quizFeedback} 
              setQuizFeedback={setQuizFeedback} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyChallenge;