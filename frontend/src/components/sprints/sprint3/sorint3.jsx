import React, { useState, useEffect } from 'react';
import { Camera, Book, Trophy, Star, Plus, Edit, Save, Volume2, Check, X, Wifi, WifiOff, Zap, Brain, Target, Play, Pause, Download, Headphones, Sparkles } from 'lucide-react';

// Sample lesson data - هاي بيانات تجريبية للدروس
const sampleLessons = {
  shopping: {
    topic: "Shopping",
    image: "/api/placeholder/300/200",
    vocabulary: ["market", "price", "buy", "sell", "customer", "shop", "money", "product"],
    description: "Learn vocabulary and phrases for shopping and buying things",
    iceBreaker: {
      type: "price_guess",
      title: "Price Guessing Game! 🛒",
      description: "Guess the price of these common items!"
    }
  },
  food: {
    topic: "Food & Cooking",
    image: "/api/placeholder/300/200", 
    vocabulary: ["cook", "recipe", "ingredient", "delicious", "spicy", "sweet", "kitchen", "meal"],
    description: "Explore food vocabulary and cooking terms",
    iceBreaker: {
      type: "taste_challenge",
      title: "Taste Challenge! 🍎",
      description: "Can you describe these flavors?"
    }
  },
  travel: {
    topic: "Travel & Transportation",
    image: "/api/placeholder/300/200",
    vocabulary: ["airport", "ticket", "journey", "destination", "luggage", "passport", "hotel", "tourist"],
    description: "Essential vocabulary for traveling and transportation",
    iceBreaker: {
      type: "destination_match",
      title: "Where in the World? 🌍",
      description: "Match the landmark to the country!"
    }
  }
};

// TTS Service Handler
const TTSService = {
  // Web Speech API (Free Browser TTS)
  speakWithBrowser: (text, rate = 1, pitch = 1) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;
      
      // Try to get English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en-') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      );
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      return new Promise((resolve, reject) => {
        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(event);
        window.speechSynthesis.speak(utterance);
      });
    } else {
      throw new Error('Speech synthesis not supported');
    }
  },

  // AWS Polly Simulation (for demonstration)
  speakWithPolly: async (text, voice = 'Joanna') => {
    // This would be the actual API call to AWS Polly
    // For now, we'll simulate it and fall back to browser TTS
    console.log(`🎵 AWS Polly: Speaking "${text}" with voice ${voice}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fall back to browser TTS for demo
    return TTSService.speakWithBrowser(text);
  },

  // ElevenLabs Simulation (for demonstration)
  speakWithElevenLabs: async (text, voiceId = 'rachel') => {
    console.log(`🎤 ElevenLabs: Speaking "${text}" with voice ${voiceId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Fall back to browser TTS for demo
    return TTSService.speakWithBrowser(text, 0.9, 1.1);
  }
};

const LexiLearnSprint3 = () => {
  const [currentStep, setCurrentStep] = useState('vocab');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [vocabNotebook, setVocabNotebook] = useState([]);
  const [currentSentence, setCurrentSentence] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [points, setPoints] = useState(150);
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  const [ttsService, setTtsService] = useState('browser');
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  // Generate random lesson for demo
  useEffect(() => {
    const lessons = Object.keys(sampleLessons);
    const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];
    setSelectedLesson(sampleLessons[randomLesson]);
  }, []);

  // TTS Handler
  const handleSpeak = async (text, context = 'word') => {
    if (currentlySpeaking === text) {
      // Stop current speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setCurrentlySpeaking(null);
      return;
    }

    setCurrentlySpeaking(text);

    try {
      switch (ttsService) {
        case 'polly':
          if (isOnline) {
            await TTSService.speakWithPolly(text);
          } else {
            await TTSService.speakWithBrowser(text);
          }
          break;
        case 'elevenlabs':
          if (isOnline) {
            await TTSService.speakWithElevenLabs(text);
          } else {
            await TTSService.speakWithBrowser(text);
          }
          break;
        default:
          await TTSService.speakWithBrowser(text);
      }
      
      // Award points for using TTS
      if (context === 'word') {
        setPoints(prev => prev + 2);
      }
      
    } catch (error) {
      console.error('TTS Error:', error);
      // Fallback to browser TTS
      try {
        await TTSService.speakWithBrowser(text);
      } catch (fallbackError) {
        console.error('Fallback TTS failed:', fallbackError);
      }
    } finally {
      setCurrentlySpeaking(null);
    }
  };

  // Daily Challenge Component
  const DailyChallengeComponent = () => {
    const [challengeStep, setChallengeStep] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    
    const challenges = [
      {
        type: 'pronunciation',
        title: 'Pronunciation Challenge 🎯',
        instruction: 'Listen and repeat these words correctly',
        words: selectedLesson ? selectedLesson.vocabulary.slice(0, 3) : ['market', 'price', 'buy'],
        completed: false
      },
      {
        type: 'sentence_building',
        title: 'Sentence Building Challenge 🏗️',
        instruction: 'Use these words in meaningful sentences',
        words: selectedLesson ? selectedLesson.vocabulary.slice(3, 5) : ['sell', 'customer'],
        completed: false
      },
      {
        type: 'quick_quiz',
        title: 'Quick Definition Quiz ⚡',
        instruction: 'Match the word to its meaning',
        questions: [
          { word: 'market', options: ['a place to buy things', 'a type of food', 'a color'], correct: 0 },
          { word: 'customer', options: ['a worker', 'a person who buys', 'a building'], correct: 1 }
        ],
        completed: false
      }
    ];

    const [currentChallenges, setCurrentChallenges] = useState(challenges);

    const completeChallenge = (index) => {
      const updated = [...currentChallenges];
      updated[index].completed = true;
      setCurrentChallenges(updated);
      setPoints(prev => prev + 25);
      
      // Check if all challenges completed
      if (updated.every(c => c.completed)) {
        setChallengeCompleted(true);
        setPoints(prev => prev + 50); // Bonus for completing all
      }
    };

    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-200">
        <div className="text-center mb-6">
          <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Daily Challenge 🌟</h2>
          <p className="text-gray-600">3-minute vocabulary boost challenges</p>
          <div className="mt-4 bg-white p-3 rounded-lg inline-block">
            <p className="text-sm text-gray-600">
              Completed: {currentChallenges.filter(c => c.completed).length} / {currentChallenges.length}
            </p>
            <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${(currentChallenges.filter(c => c.completed).length / currentChallenges.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {!challengeCompleted ? (
          <div className="space-y-4">
            {currentChallenges.map((challenge, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border-2 transition-all ${
                  challenge.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{challenge.title}</h3>
                  {challenge.completed && <Check className="w-6 h-6 text-green-500" />}
                </div>
                
                <p className="text-gray-600 mb-3">{challenge.instruction}</p>
                
                {challenge.type === 'pronunciation' && !challenge.completed && (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {challenge.words.map((word, wordIndex) => (
                        <button
                          key={wordIndex}
                          onClick={() => handleSpeak(word, 'challenge')}
                          className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                        >
                          {currentlySpeaking === word ? (
                            <Pause className="w-4 h-4 mr-1" />
                          ) : (
                            <Volume2 className="w-4 h-4 mr-1" />
                          )}
                          {word}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => completeChallenge(index)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all"
                    >
                      ✅ I practiced all words
                    </button>
                  </div>
                )}

                {challenge.type === 'sentence_building' && !challenge.completed && (
                  <div>
                    <div className="space-y-2 mb-3">
                      {challenge.words.map((word, wordIndex) => (
                        <div key={wordIndex} className="flex items-center gap-2">
                          <button
                            onClick={() => handleSpeak(word)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <span className="font-semibold text-purple-600">{word}:</span>
                          <input
                            type="text"
                            placeholder={`Write a sentence with "${word}"`}
                            className="flex-1 px-3 py-1 border rounded focus:border-purple-400 focus:outline-none"
                            onChange={(e) => {
                              setUserAnswers(prev => ({...prev, [word]: e.target.value}));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => completeChallenge(index)}
                      disabled={!challenge.words.every(word => userAnswers[word]?.trim())}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 transition-all"
                    >
                      ✅ Submit Sentences
                    </button>
                  </div>
                )}

                {challenge.type === 'quick_quiz' && !challenge.completed && (
                  <div className="space-y-3">
                    {challenge.questions.map((question, qIndex) => (
                      <div key={qIndex} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center mb-2">
                          <button
                            onClick={() => handleSpeak(question.word)}
                            className="p-1 text-blue-500 hover:bg-blue-100 rounded mr-2"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <p className="font-semibold">What does "{question.word}" mean?</p>
                        </div>
                        <div className="flex gap-2">
                          {question.options.map((option, optIndex) => (
                            <button
                              key={optIndex}
                              onClick={() => {
                                if (optIndex === question.correct) {
                                  completeChallenge(index);
                                }
                              }}
                              className="px-3 py-1 bg-white border border-gray-200 rounded hover:border-yellow-400 transition-all text-sm"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {challenge.completed && (
                  <div className="text-green-600 font-semibold">
                    ✅ Challenge completed! +25 points
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-green-50 p-6 rounded-lg">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-700 mb-2">Challenge Complete! 🎉</h3>
            <p className="text-lg mb-2">You earned +125 points today!</p>
            <p className="text-gray-600">Come back tomorrow for new challenges!</p>
          </div>
        )}
      </div>
    );
  };

  // Enhanced Vocab Notebook with TTS
  const VocabNotebookComponent = () => {
    const addToNotebook = () => {
      if (selectedWord && currentSentence.trim()) {
        const newEntry = {
          id: Date.now(),
          word: selectedWord,
          sentence: currentSentence,
          isCorrect: null,
          feedback: '',
          timestamp: new Date().toLocaleString(),
          needsSync: !isOnline,
          hasAudio: isOnline, // Track if TTS is available
          ttsService: ttsService
        };
        
        // Simulate AI correction
        setTimeout(() => {
          const correctedEntry = { ...newEntry };
          const hasWordInSentence = currentSentence.toLowerCase().includes(selectedWord.toLowerCase());
          correctedEntry.isCorrect = hasWordInSentence && currentSentence.length > 10;
          
          if (isOnline) {
            correctedEntry.feedback = correctedEntry.isCorrect 
              ? "Excellent sentence! Your grammar is perfect! 👏" 
              : hasWordInSentence 
                ? "Good use of the word! Try to make the sentence a bit longer or add more details." 
                : `Please include the word "${selectedWord}" in your sentence.`;
            correctedEntry.needsSync = false;
          } else {
            correctedEntry.feedback = "Saved offline - will be corrected when online";
            correctedEntry.needsSync = true;
          }
          
          setVocabNotebook(prev => [...prev, correctedEntry]);
          setPoints(prev => prev + (correctedEntry.isCorrect ? 15 : 5));
        }, 1000);

        setCurrentSentence('');
        setSelectedWord('');
      }
    };

    return (
      <div className="space-y-6">
        {/* TTS Service Selector */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-800 flex items-center">
              <Headphones className="w-5 h-5 mr-2" />
              🎵 Text-to-Speech Service
            </h3>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="w-4 h-4 mr-1" />
                  <span className="text-sm">Online</span>
                </div>
              ) : (
                <div className="flex items-center text-orange-600">
                  <WifiOff className="w-4 h-4 mr-1" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setTtsService('browser')}
              className={`p-3 rounded-lg border-2 transition-all ${
                ttsService === 'browser' 
                  ? 'border-blue-500 bg-blue-100' 
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <Volume2 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <h4 className="font-semibold text-sm">Browser TTS</h4>
                <p className="text-xs text-gray-600">Free • Works Offline</p>
              </div>
            </button>
            
            <button
              onClick={() => setTtsService('polly')}
              disabled={!isOnline}
              className={`p-3 rounded-lg border-2 transition-all ${
                ttsService === 'polly' 
                  ? 'border-orange-500 bg-orange-100' 
                  : 'border-gray-200 bg-white hover:border-orange-300 disabled:bg-gray-100 disabled:cursor-not-allowed'
              }`}
            >
              <div className="text-center">
                <div className="w-6 h-6 mx-auto mb-2 bg-orange-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AWS</span>
                </div>
                <h4 className="font-semibold text-sm">AWS Polly</h4>
                <p className="text-xs text-gray-600">High Quality • Online</p>
              </div>
            </button>
            
            <button
              onClick={() => setTtsService('elevenlabs')}
              disabled={!isOnline}
              className={`p-3 rounded-lg border-2 transition-all ${
                ttsService === 'elevenlabs' 
                  ? 'border-purple-500 bg-purple-100' 
                  : 'border-gray-200 bg-white hover:border-purple-300 disabled:bg-gray-100 disabled:cursor-not-allowed'
              }`}
            >
              <div className="text-center">
                <div className="w-6 h-6 mx-auto mb-2 bg-purple-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">11</span>
                </div>
                <h4 className="font-semibold text-sm">ElevenLabs</h4>
                <p className="text-xs text-gray-600">AI Voice • Premium</p>
              </div>
            </button>
          </div>
        </div>

        {/* Main Vocab Notebook */}
        <div className="bg-white p-6 rounded-lg border-2 border-purple-200 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Book className="w-8 h-8 text-purple-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Vocabulary Notebook 📚</h2>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-all"
            >
              Toggle Connection
            </button>
          </div>

          {/* Add new vocabulary */}
          <div className="bg-purple-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-4">Add a new word to your notebook:</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Choose a word from today's lesson:</label>
              <div className="flex flex-wrap gap-2">
                {selectedLesson?.vocabulary.map((word) => (
                  <button
                    key={word}
                    onClick={() => setSelectedWord(word)}
                    className={`flex items-center px-3 py-1 rounded-full border transition-all ${
                      selectedWord === word 
                        ? 'bg-purple-500 text-white border-purple-500' 
                        : 'bg-white text-purple-600 border-purple-300 hover:bg-purple-100'
                    }`}
                  >
                    {word}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(word);
                      }}
                      className="ml-1 p-1 hover:bg-purple-200 rounded"
                    >
                      {currentlySpeaking === word ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>
                  </button>
                ))}
              </div>
            </div>

            {selectedWord && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Write a sentence using "{selectedWord}":
                  <button
                    onClick={() => handleSpeak(selectedWord)}
                    className="ml-2 p-1 text-purple-500 hover:bg-purple-100 rounded"
                  >
                    <Volume2 className="w-4 h-4 inline" />
                  </button>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentSentence}
                    onChange={(e) => setCurrentSentence(e.target.value)}
                    placeholder={`Example: I go to the ${selectedWord} every day.`}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none"
                  />
                  <button
                    onClick={addToNotebook}
                    disabled={!selectedWord || !currentSentence.trim()}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 flex items-center transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            )}

            {!isOnline && (
              <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-center">
                  <WifiOff className="w-5 h-5 text-orange-600 mr-2" />
                  <p className="text-sm text-orange-700">
                    <strong>Offline Mode:</strong> Using browser TTS. Premium voices will work when back online.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Vocabulary entries */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center">
                Your Vocabulary Entries 
                <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-sm">
                  {vocabNotebook.length}
                </span>
              </h3>
              
              <button
                onClick={() => setShowDailyChallenge(!showDailyChallenge)}
                className="flex items-center px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all text-sm"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Daily Challenge
              </button>
            </div>
            
            {vocabNotebook.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Book className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No entries yet. Start by adding your first vocabulary word!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vocabNotebook.map((entry) => (
                  <div key={entry.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-purple-600">"{entry.word}"</span>
                          <button
                            onClick={() => handleSpeak(entry.word)}
                            className="p-1 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded transition-all"
                            title="Listen to pronunciation"
                          >
                            {currentlySpeaking === entry.word ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                          {entry.ttsService !== 'browser' && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
                              {entry.ttsService === 'polly' ? 'AWS' : '11Labs'}
                            </span>
                          )}
                          <span className="text-sm text-gray-500">{entry.timestamp}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.needsSync && (
                          <div className="flex items-center text-orange-500 text-xs">
                            <WifiOff className="w-3 h-3 mr-1" />
                            Offline
                          </div>
                        )}
                        {entry.isCorrect !== null && (
                          <div className="flex items-center">
                            {entry.isCorrect ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded mb-2">
                      <p className="text-gray-800 flex-1">"{entry.sentence}"</p>
                      <button
                        onClick={() => handleSpeak(entry.sentence)}
                        className="ml-2 p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"
                        title="Listen to sentence"
                      >
                        {currentlySpeaking === entry.sentence ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {entry.feedback && (
                      <div className={`text-sm p-2 rounded ${
                        entry.needsSync 
                          ? 'bg-orange-100 text-orange-700' 
                          : entry.isCorrect 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        <strong>AI Feedback:</strong> {entry.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Offline capabilities info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              📱 Enhanced Features
            </h4>
            <div className="text-sm text-blue-600 space-y-1">
              <p>✅ Multiple TTS services (Browser, AWS Polly, ElevenLabs)</p>
              <p>✅ Word and sentence pronunciation</p>
              <p>✅ Daily vocabulary challenges</p>
              <p>✅ Offline fallback with browser TTS</p>
              <p>✅ Progress tracking with points system</p>
            </div>
          </div>
        </div>

        {/* Daily Challenge Section */}
        {showDailyChallenge && (
          <DailyChallengeComponent />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header with Keffiyeh pattern */}
      <div className="bg-gradient-to-r from-green-600 via-white to-red-600 p-1 rounded-lg">
        <div className="bg-white p-4 rounded-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">LexiLearn Sprint 3</h1>
            <p className="text-gray-600">Enhanced Vocabulary with Text-to-Speech & Daily Challenges</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <p className="text-sm text-gray-500">Made in Gaza 🇵🇸</p>
              <div className="flex items-center text-green-600">
                <Trophy className="w-4 h-4 mr-1" />
                <span className="text-sm font-semibold">{points} points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Sprint 3 Features Demo</h3>
          <span className="text-sm text-gray-500">
            {selectedLesson?.topic || 'Loading...'} • TTS: {ttsService}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Volume2 className="w-4 h-4 mr-1 text-blue-500" />
            Text-to-Speech
          </div>
          <div className="flex items-center">
            <Sparkles className="w-4 h-4 mr-1 text-yellow-500" />
            Daily Challenge
          </div>
          <div className="flex items-center">
            <Book className="w-4 h-4 mr-1 text-purple-500" />
            Enhanced Vocab
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-96">
        <VocabNotebookComponent />
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>LexiLearn • Sprint 3 Prototype • Built with ❤️ for Palestinian learners</p>
        <p className="mt-1">🎯 New: TTS Integration, Daily Challenges & Enhanced Vocabulary Practice</p>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs">
          <span>🎵 Browser TTS (Free)</span>
          <span>☁️ AWS Polly Integration</span>
          <span>🤖 ElevenLabs AI Voice</span>
          <span>⚡ 3-min Daily Challenges</span>
        </div>
      </div>
    </div>
  );
};

export default LexiLearnSprint3;