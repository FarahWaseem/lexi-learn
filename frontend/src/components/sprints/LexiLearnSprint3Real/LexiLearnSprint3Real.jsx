import React, { useEffect, useState } from "react";
import { Book, Sparkles, Volume2 } from 'lucide-react';
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
    extractVocabularyFromConversation, 
    handleConversationComplete,
    extractedWords,
    isLoading
  } = useLexiLearn(ELEVENLABS_API_KEY, GEMINI_API_KEY);

  // أضف هذا useEffect لمتابعة extractedWords
useEffect(() => {
  if (extractedWords.length > 0) {
    console.log('📝 Extracted words:', extractedWords);
    // تحدث تلقائياً عن الكلمات المستخرجة
    handleSpeak(`I found ${extractedWords.length} new words from our conversation. Let's review them!`);
  }
}, [extractedWords, handleSpeak]);

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
          aiService={aiService}
        />
      ) : (
        <>
          {currentStep === 'ice_breaker' && selectedLesson?.iceBreaker && (
            <IceBreaker
              lesson={selectedLesson}
              onComplete={handleIceBreakerComplete}
              handleSpeak={handleSpeak}
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
              onConversationComplete={handleConversationComplete} // ✅ مرر الدالة
            />
          )}
        </>
      )}

      {/* Display extracted words */}
      {extractedWords.length > 0 && (
  <div className="bg-green-50 p-6 rounded-lg mt-6 border-2 border-green-300">
    <h3 className="text-xl font-bold mb-3 flex items-center">
      <span className="text-2xl mr-2">🎯</span> 
      New Words from Conversation
    </h3>
    <div className="flex flex-wrap gap-3 mb-4">
      {extractedWords.map((word, index) => (
        <span 
          key={index} 
          className="bg-green-200 px-4 py-2 rounded-full text-sm font-medium flex items-center"
        >
          <span className="mr-2">📝</span>
          {word}
          <button
            onClick={() => handleSpeak(word)}
            className="ml-2 p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-300"
            title="Listen to word"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </span>
      ))}
    </div>
    <p className="text-green-700 font-semibold">
      ✅ These words have been added to your vocabulary notebook!
    </p>
    <button
      onClick={() => setShowVocabNotebook(true)}
      className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
    >
      Open Vocabulary Notebook
    </button>
  </div>
)}

      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>LexiLearn • Sprint 3 Real Integration • Built with ❤️ for Palestinian learners</p>
      </div>
    </div>
  );
};

export default LexiLearnSprint3Real;