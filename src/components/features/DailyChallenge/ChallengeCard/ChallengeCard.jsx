import React, { useState } from 'react';
import { Volume2, Pause, Check, X, CheckCircle, XCircle } from 'lucide-react';

const ChallengeCard = ({
  challenge,
  index,
  onComplete,
  handleSpeak,
  currentlySpeaking,
  userAnswers,
  setUserAnswers,
  selectedAnswers,
  setSelectedAnswers,
  quizFeedback,
  setQuizFeedback
}) => {
  const handleQuizAnswer = (qi, optionIndex) => {
  const question = challenge.questions[qi];
  const selectedOptionText = question.options[optionIndex];
  const isCorrect = selectedOptionText === question.correct;
  
  console.log('Question:', question.word);
  console.log('Selected:', selectedOptionText);
  console.log('Correct:', question.correct);
  console.log('Is Correct:', isCorrect);

  const key = `${index}-${qi}`;
  setSelectedAnswers((prev) => ({ ...prev, [key]: optionIndex }));
  setQuizFeedback((prev) => ({ ...prev, [key]: isCorrect }));
  
  // تحقق إذا جميع الأسئلة صحيحة
  const allQuestionsAnswered = challenge.questions.every((_, i) => {
    const questionKey = `${index}-${i}`;
    return quizFeedback[questionKey] !== undefined;
  });
  
  const allQuestionsCorrect = challenge.questions.every((_, i) => {
    const questionKey = `${index}-${i}`;
    return quizFeedback[questionKey] === true;
  });
  
  if (allQuestionsAnswered && allQuestionsCorrect) {
    setTimeout(() => onComplete(index), 500);
  }
};

  const handleSentenceSubmit = () => {
    if (challenge.words.every((w) => userAnswers[w]?.trim())) {
      onComplete(index);
    }
  };

  const handlePronunciationComplete = () => {
    onComplete(index);
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${challenge.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">{challenge.title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">+{challenge.points} points</span>
          {challenge.completed && <Check className="w-6 h-6 text-green-500" />}
        </div>
      </div>
      <p className="text-gray-600 mb-3">{challenge.instruction}</p>

      {/* Pronunciation Challenge */}
      {challenge.type === 'pronunciation' && !challenge.completed && (
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {challenge.words.map((w) => (
              <button
                key={w}
                onClick={() => handleSpeak(w, 'challenge')}
                className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                {currentlySpeaking === w ? (
                  <Pause className="w-4 h-4 mr-1" />
                ) : (
                  <Volume2 className="w-4 h-4 mr-1" />
                )}
                {w}
              </button>
            ))}
          </div>
          <button
            onClick={handlePronunciationComplete}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            ✅ I practiced all words
          </button>
        </div>
      )}

      {/* Sentence Building Challenge */}
      {challenge.type === 'sentence_building' && !challenge.completed && (
        <div>
          <div className="space-y-2 mb-3">
            {challenge.words.map((w) => (
              <div key={w} className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeak(w)}
                  className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <span className="font-semibold text-purple-600">{w}:</span>
                <input
                  type="text"
                  placeholder={`Write a sentence with "${w}"`}
                  className="flex-1 px-3 py-1 border rounded focus:border-purple-400 focus:outline-none transition-colors"
                  onChange={(e) =>
                    setUserAnswers((prev) => ({ ...prev, [w]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSentenceSubmit}
            disabled={!challenge.words.every((w) => userAnswers[w]?.trim())}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 transition-colors"
          >
            ✅ Submit Sentences
          </button>
        </div>
      )}

      {/* Quick Quiz Challenge */}
      {challenge.type === 'quick_quiz' && !challenge.completed && (
        <div className="space-y-3">
          {challenge.questions.map((q, qi) => {
            const key = `${index}-${qi}`;
            const isSelected = selectedAnswers[key] !== undefined;
            const correct = quizFeedback[key];
            
            return (
              <div key={qi} className="bg-gray-50 p-3 rounded">
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => handleSpeak(q.word)}
                    className="p-1 text-blue-500 hover:bg-blue-100 rounded mr-2 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <p className="font-semibold">
                    What does "{q.word}" mean?
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => handleQuizAnswer(qi, oi)}
                      className={`px-3 py-2 border rounded text-sm transition-all ${
                        isSelected && selectedAnswers[key] === oi
                          ? correct
                            ? 'bg-green-100 border-green-400 text-green-700'
                            : 'bg-red-100 border-red-400 text-red-700'
                          : 'bg-white border-gray-200 hover:border-yellow-400'
                      }`}
                    >
                      {opt}
                      {isSelected &&
                        selectedAnswers[key] === oi &&
                        (correct ? (
                          <Check className="w-3 h-3 inline ml-1" />
                        ) : (
                          <X className="w-3 h-3 inline ml-1" />
                        ))}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {challenge.completed && (
        <div className="text-green-600 font-semibold">
          ✅ Challenge completed! +{challenge.points} points
        </div>
      )}
    </div>
  );
};

export default ChallengeCard;