import React, { useState, useEffect } from 'react';
import { Play, BookOpen, Trophy, Target, Volume2, Sparkles } from 'lucide-react';
import IceBreakerSection from './Sprint2';
import VocabNotebook from './Sprint3';

const CombinedLexiLearn = () => {
  const [currentPhase, setCurrentPhase] = useState('ice-breaker'); // ice-breaker, guess-topic, vocab, daily-challenge
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(0);

  // دالة لتغيير المرحلة
  const advancePhase = () => {
    const phases = ['ice-breaker', 'guess-topic', 'vocab', 'daily-challenge'];
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex < phases.length - 1) {
      setCurrentPhase(phases[currentIndex + 1]);
      setLessonProgress(((currentIndex + 2) / phases.length) * 100);
    }
  };

  // مكون Today's Lesson Progress المحدث
  const LessonProgress = () => {
    const phaseNames = {
      'ice-breaker': '🎮 Ice Breaker',
      'guess-topic': '🔍 Guess the Topic',
      'vocab': '📚 Vocabulary Practice',
      'daily-challenge': '⭐ Daily Challenge'
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-green-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Target className="w-6 h-6 mr-2 text-green-500" />
          Today's Lesson Progress
        </h3>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{phaseNames[currentPhase]}</span>
            <span>{Math.round(lessonProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${lessonProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(phaseNames).map(([key, name]) => (
            <div 
              key={key}
              className={`p-2 rounded text-center ${
                key === currentPhase 
                  ? 'bg-green-100 text-green-700 font-semibold' 
                  : key === 'completed' 
                    ? 'bg-green-50 text-green-600'
                    : 'bg-gray-50 text-gray-500'
              }`}
            >
              {key === currentPhase ? '➡️ ' : ''}{name}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-white to-red-600 p-1 rounded-lg">
        <div className="bg-white p-6 rounded-lg">
          <h1 className="text-3xl font-bold text-center text-gray-800">LexiLearn - Complete Experience</h1>
          <p className="text-center text-gray-600 mt-2">From Ice Breaker to Daily Challenge - All in One!</p>
        </div>
      </div>

      {/* Lesson Progress */}
      <LessonProgress />

      {/* Content Area */}
      <div className="bg-white p-6 rounded-lg shadow-lg min-h-96">
        {!lessonStarted ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Ready to start your lesson?</h2>
            <p className="text-gray-600 mb-6">Choose your topic and begin the complete learning journey</p>
            <button
              onClick={() => {
                setLessonStarted(true);
                setLessonProgress(25);
              }}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg text-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all"
            >
              <Play className="w-6 h-6 inline mr-2" />
              Start Complete Lesson
            </button>
          </div>
        ) : (
          <div>
            {currentPhase === 'ice-breaker' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">🎮 Ice Breaker Games</h2>
                {/* محتوى Ice Breaker من Sprint 2 */}
                <IceBreakerSection 
                  onComplete={() => advancePhase()}
                  selectedLesson={selectedLesson}
                />
              </div>
            )}

            {currentPhase === 'guess-topic' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">🔍 Guess the Topic</h2>
                {/* محتوى Guess the Topic */}
                <GuessTopicSection 
                  onComplete={() => advancePhase()}
                  selectedLesson={selectedLesson}
                />
              </div>
            )}

            {currentPhase === 'vocab' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">📚 Vocabulary Notebook</h2>
                <VocabNotebook 
                  onComplete={() => advancePhase()}
                  selectedLesson={selectedLesson}
                />
              </div>
            )}

            {currentPhase === 'daily-challenge' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">⭐ Daily Challenge</h2>
                <DailyChallenge 
                  selectedLesson={selectedLesson}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {lessonStarted && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              const phases = ['ice-breaker', 'guess-topic', 'vocab', 'daily-challenge'];
              const currentIndex = phases.indexOf(currentPhase);
              if (currentIndex > 0) {
                setCurrentPhase(phases[currentIndex - 1]);
                setLessonProgress(((currentIndex) / phases.length) * 100);
              }
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
            disabled={currentPhase === 'ice-breaker'}
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Phase {['ice-breaker', 'guess-topic', 'vocab', 'daily-challenge'].indexOf(currentPhase) + 1} of 4
          </span>

          <button
            onClick={advancePhase}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
            disabled={currentPhase === 'daily-challenge'}
          >
            Next Phase →
          </button>
        </div>
      )}
    </div>
  );
};

export default CombinedLexiLearn;