// src/pages/LexiLearnSprint3Real.jsx
import React from 'react';
import { Book, Sparkles } from 'lucide-react';
import { Header, LoadingSpinner, ErrorDisplay } from '../../common';
import { VoiceChat, VocabNotebook, DailyChallenge, IceBreaker, GuessTopic } from '../../features';
import { useLexiLearn } from '../../../hooks/useLexiLearn';
import { ELEVENLABS_API_KEY, GEMINI_API_KEY } from '../../../constants';

const LexiLearnSprint3Real = () => {
  const {
    aiService,
    currentStep,
    selectedLesson,
    vocabNotebook,
    setVocabNotebook,
    currentSentence,
    setCurrentSentence,
    selectedWord,
    setSelectedWord,
    isOnline,
    points,
    setPoints,
    showDailyChallenge,
    setShowDailyChallenge,
    showVocabNotebook,
    setShowVocabNotebook,
    error,
    ttsService,
    selectedTTS,
    setSelectedTTS,
    currentlySpeaking,
    handleSpeak,
    handleIceBreakerComplete,
    handleGuessTopicComplete,
    isLoading
  } = useLexiLearn(ELEVENLABS_API_KEY, GEMINI_API_KEY);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorDisplay error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (currentStep === 'loading' || isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <LoadingSpinner message="Loading APIs..." />
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Header title="LexiLearn Sprint 3" subtitle="Real AI Integration" points={points} />

      {/* TTS Voice Selector */}
      <div className="flex justify-center mb-4">
        <label className="text-sm font-medium text-gray-700 mr-2">🔊 Voice:</label>
        <select
          value={selectedTTS}
          onChange={(e) => setSelectedTTS(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
        >
          <option value="browser">Browser</option>
          {ELEVENLABS_API_KEY && <option value="elevenlabs">ElevenLabs</option>}
        </select>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => {
            setShowVocabNotebook(!showVocabNotebook);
            setShowDailyChallenge(false);
          }}
          className={`px-4 py-2 rounded-lg flex items-center ${
            showVocabNotebook ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          <Book className="w-4 h-4 mr-2" /> Vocabulary
        </button>

        <button
          onClick={() => {
            setShowDailyChallenge(!showDailyChallenge);
            setShowVocabNotebook(false);
          }}
          className={`px-4 py-2 rounded-lg flex items-center ${
            showDailyChallenge ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          }`}
        >
          <Sparkles className="w-4 h-4 mr-2" /> Daily Challenge
        </button>
      </div>

      {/* Conditional views */}
      {showVocabNotebook ? (
        <VocabNotebook
          selectedLesson={selectedLesson}
          vocabNotebook={vocabNotebook}
          setVocabNotebook={setVocabNotebook}
          selectedWord={selectedWord}
          setSelectedWord={setSelectedWord}
          currentSentence={currentSentence}
          setCurrentSentence={setCurrentSentence}
          handleSpeak={handleSpeak}
          currentlySpeaking={currentlySpeaking}
          isOnline={isOnline}
          aiService={aiService}
          setPoints={setPoints}
          selectedTTS={selectedTTS}
          setSelectedTTS={setSelectedTTS}
        />
      ) : showDailyChallenge ? (
        <DailyChallenge
          selectedLesson={selectedLesson}
          setPoints={setPoints}
          handleSpeak={handleSpeak}
          currentlySpeaking={currentlySpeaking}
        />
      ) : (
        <>
          {currentStep === 'ice_breaker' && selectedLesson?.iceBreaker && (
  <IceBreaker
    lesson={selectedLesson}
    onComplete={handleIceBreakerComplete}
    handleSpeak={handleSpeak}
    currentlySpeaking={currentlySpeaking}
  />
)}

          {currentStep === 'guess_topic' && selectedLesson?.topic && (
            <GuessTopic
              lesson={selectedLesson}
              onComplete={handleGuessTopicComplete}
              handleSpeak={handleSpeak}
              currentlySpeaking={currentlySpeaking}
            />
          )}

          {currentStep === 'voice_chat' && (
            <VoiceChat
              aiService={aiService}
              ttsService={ttsService}
              selectedTTS={selectedTTS}
              isOnline={isOnline}
              handleSpeak={handleSpeak}
            />
          )}
        </>
      )}

      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>LexiLearn • Sprint 3 Real Integration • Built with ❤️ for Palestinian learners</p>
      </div>
    </div>
  );
};

export default LexiLearnSprint3Real;