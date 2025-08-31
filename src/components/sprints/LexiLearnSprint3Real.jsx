// LexiLearnSprint3Real.jsx
import React, { useState, useEffect } from 'react';
import { Book, Trophy, Volume2, Check, X, WifiOff, Headphones, Sparkles, Loader2, CheckCircle, XCircle, Clock, Pause, Plus, Timer, MessageCircle, Mic } from 'lucide-react';

// API Keys - Hardcoded for development
const ELEVENLABS_API_KEY = 'sk_ec576bac8e4feeb3e8b7833af2eb47d40b3ab77c9841371e';  
const GEMINI_API_KEY = 'AIzaSyA8q4uxTyUxlJ0M4e9YkAdS7YPE4QqVi8Q';

/* ------------------------------------------
   TTS & AI SERVICES
------------------------------------------- */
class RealTTSService {
  constructor(apiKey) {
    this.elevenLabsKey = apiKey;
    this.voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel
  }

  async speakWithElevenLabs(text) {
    if (!this.elevenLabsKey) {
      console.error('ElevenLabs key missing');
      throw new Error('ElevenLabs key missing');
    }

    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: { stability: 0.5, similarity_boost: 0.5 },
          }),
        }
      );

      if (!res.ok) {
        console.error(`ElevenLabs error: ${res.status}`);
        throw new Error(`ElevenLabs error: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = (err) => {
          console.error('Audio playback error:', err);
          reject(err);
        };
        audio.play().catch(err => {
          console.error('Audio play failed:', err);
          reject(err);
        });
      });
    } catch (error) {
      console.error('Error in speakWithElevenLabs:', error);
      throw error;
    }
  }

  speakWithBrowser(text, rate = 1, pitch = 1) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.error('Speech synthesis not supported');
        reject('Speech synthesis not supported');
        return;
      }
      
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate;
      u.pitch = pitch;
      
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.startsWith('en-'));
      if (enVoice) u.voice = enVoice;
      
      u.onend = () => {
        console.log('Speech synthesis ended');
        resolve();
      };
      u.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        reject(event);
      };
      
      console.log('Starting speech synthesis');
      window.speechSynthesis.speak(u);
    });
  }
}

class GeminiAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  async generateContent(prompt) {
    if (!this.apiKey) {
      console.error('Gemini key missing');
      throw new Error('Gemini key missing');
    }

    try {
      const res = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Gemini error: ${res.status}`, errorText);
        throw new Error(`Gemini error: ${res.status}`);
      }
      
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error in generateContent:', error);
      throw error;
    }
  }

  async checkSentence(word, sentence) {
    try {
      const prompt = `Check if the sentence "${sentence}" uses "${word}" correctly.
Reply in exactly this format:
[CORRECT/INCORRECT]: short feedback (max 15 words)`;
      
      console.log('Sending to Gemini:', prompt);
      const resp = await this.generateContent(prompt);
      console.log('Received from Gemini:', resp);
      
      const isCorrect = resp.includes('[CORRECT]');
      const feedback = resp.replace(/\[(CORRECT|INCORRECT)\]:\s*/i, '');
      return { isCorrect, feedback };
    } catch (error) {
      console.error('Error in checkSentence:', error);
      return { 
        isCorrect: sentence.toLowerCase().includes(word.toLowerCase()),
        feedback: 'Unable to verify with AI. Using basic check.'
      };
    }
  }

  async generateConversationResponse(userMessage, conversationHistory = []) {
    try {
      const historyText = conversationHistory.map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');
      
      const prompt = `You are an English teaching assistant. Continue this conversation naturally and help the student practice English.
      
${historyText}
Student: ${userMessage}
Assistant:`;
      
      const response = await this.generateContent(prompt);
      return response;
    } catch (error) {
      console.error('Error generating conversation response:', error);
      return "I'm having trouble responding right now. Please try again.";
    }
  }
}

/* ------------------------------------------
   LESSON DATA
------------------------------------------- */
const sampleLessons = {
  shopping: {
    topic: 'Shopping',
    hiddenTopic: true,
    image: 'https://source.unsplash.com/300x200/?shopping,mall,store',
    vocabulary: [
      'market', 'price', 'buy', 'sell', 'customer', 'shop', 'money', 'product',
    ],
    description: 'Learn vocabulary and phrases for shopping and buying things',
    iceBreaker: {
      type: 'price_guess',
      title: 'Price Guessing Game! 🛒',
      description: 'Guess the price of these common items!',
      questions: [
        { item: "a loaf of bread", price: 3.50 },
        { item: "a gallon of milk", price: 2.99 },
        { item: "a dozen eggs", price: 4.25 }
      ]
    },
  },
  food: {
    topic: 'Food & Cooking',
    hiddenTopic: true,
    image: 'https://source.unsplash.com/300x200/?food,cooking,kitchen',
    vocabulary: [
      'cook', 'recipe', 'ingredient', 'delicious', 'spicy', 'sweet', 'kitchen', 'meal',
    ],
    description: 'Explore food vocabulary and cooking terms',
    iceBreaker: {
      type: 'taste_challenge',
      title: 'Taste Challenge! 🍎',
      description: 'Can you describe these flavors?',
      questions: [
        { item: "sweet apple", price: 0 },
        { item: "spicy pepper", price: 0 }
      ]
    },
  },
  travel: {
    topic: 'Travel & Transportation',
    hiddenTopic: true,
    image: 'https://source.unsplash.com/300x200/?travel,airport,vacation',
    vocabulary: [
      'airport', 'ticket', 'journey', 'destination', 'luggage', 'passport', 'hotel', 'tourist',
    ],
    description: 'Essential vocabulary for traveling and transportation',
    iceBreaker: {
      type: 'destination_match',
      title: 'Where in the World? 🌍',
      description: 'Match the landmark to the country!',
      questions: [
        { item: "Eiffel Tower", price: 0 },
        { item: "Pyramids", price: 0 }
      ]
    },
  },
};

/* ------------------------------------------
   SUB-COMPONENTS
------------------------------------------- */
const IceBreaker = ({ lesson, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // التحقق من وجود الأسئلة
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
    
    // Calculate score based on how close the guess is (within 20%)
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
        <p className="text-lg mb-4">How much do you think {lesson.iceBreaker.questions[currentQuestion].item} costs?</p>
        
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

const GuessTopic = ({ lesson, onComplete }) => {
  const [guess, setGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleGuess = () => {
    const correct = guess.toLowerCase().includes(lesson.topic.toLowerCase());
    setIsCorrect(correct);
    setShowResult(true);
    
    setTimeout(() => {
      onComplete(correct);
    }, 2000);
  };

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-blue-200 shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Can you guess today's topic? 🤔</h2>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <img
          src={lesson.image}
          alt="hint"
          className="w-full h-48 object-cover rounded-lg mb-4"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=${encodeURIComponent(lesson.topic)}`;
          }}
        />
        
        <div className="flex gap-2 mb-4">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type your guess..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={handleGuess}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Guess!
          </button>
        </div>
        
        {showResult && (
          <div className={`mt-3 p-2 rounded-lg text-sm ${
            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isCorrect
              ? `🎉 Correct! Today's topic is ${lesson.topic}!`
              : `❌ Not quite! The topic is ${lesson.topic}.`}
          </div>
        )}
      </div>
    </div>
  );
};

const VoiceChat = ({ aiService, ttsService, selectedTTS, isOnline, handleSpeak }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your English practice assistant. What would you like to talk about today?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    // Add user message
    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Get AI response
      const response = await aiService.generateConversationResponse(inputMessage, messages);
      const aiMessage = { role: 'assistant', content: response };
      
      // Add AI message
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the response
      if (ttsService) {
        if (selectedTTS === 'elevenlabs' && isOnline) {
          await ttsService.speakWithElevenLabs(response);
        } else {
          await ttsService.speakWithBrowser(response);
        }
      }
    } catch (error) {
      console.error('Error in voice chat:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble responding right now. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-green-200 shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <MessageCircle className="mr-2" /> AI Voice Chat
      </h2>
      
      <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {msg.content}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleSpeak(msg.content, 'chat')}
                  className="ml-2 p-1 text-gray-400 hover:text-blue-500"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="text-center">
            <Loader2 className="w-6 h-6 mx-auto animate-spin" />
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 flex items-center"
        >
          <Mic className="w-4 h-4 mr-1" /> Send
        </button>
      </div>
    </div>
  );
};

const VocabNotebook = (props) => {
  const {
    selectedLesson,
    vocabNotebook,
    setVocabNotebook,
    selectedWord,
    setSelectedWord,
    currentSentence,
    setCurrentSentence,
    handleSpeak,
    currentlySpeaking,
    isOnline,
    aiService,
    setPoints,
    selectedTTS,
    setSelectedTTS,
    formatTime,
  } = props;

  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [error, setError] = useState('');

  const addToNotebook = async () => {
    if (!selectedWord || !currentSentence.trim()) {
      setError('Please select a word and write a sentence');
      return;
    }

    setError('');
    const entry = {
      id: Date.now(),
      word: selectedWord,
      sentence: currentSentence,
      isCorrect: null,
      feedback: '',
      timestamp: new Date().toLocaleString(),
      needsSync: !isOnline,
      ttsService: selectedTTS,
    };

    setVocabNotebook((prev) => [...prev, entry]);
    setCheckingGrammar(true);

    try {
      if (isOnline && aiService) {
        const res = await aiService.checkSentence(selectedWord, currentSentence);
        setVocabNotebook((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? { ...e, isCorrect: res.isCorrect, feedback: res.feedback, needsSync: false }
              : e
          )
        );
        setPoints((p) => p + (res.isCorrect ? 15 : 5));
      } else {
        const hasWord = currentSentence.toLowerCase().includes(selectedWord.toLowerCase());
        setVocabNotebook((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  isCorrect: hasWord,
                  feedback: 'Saved offline – will be checked when online',
                  needsSync: true,
                }
              : e
          )
        );
        setPoints((p) => p + 5);
      }
    } catch (e) {
      console.error(e);
      setError('Error checking sentence. Please try again.');
    } finally {
      setCheckingGrammar(false);
      setCurrentSentence('');
      setSelectedWord('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-purple-200 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Book className="w-8 h-8 text-purple-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Vocabulary Notebook 📚</h2>
        </div>
      </div>

      {/* TTS Selector */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <h3 className="font-semibold text-blue-800 flex items-center mb-3">
          <Headphones className="w-5 h-5 mr-2" />
          🎵 Text-to-Speech Service
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedTTS('browser')}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedTTS === 'browser'
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
            onClick={() => setSelectedTTS('elevenlabs')}
            disabled={!isOnline}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedTTS === 'elevenlabs'
                ? 'border-purple-500 bg-purple-100'
                : 'border-gray-200 bg-white hover:border-purple-300 disabled:bg-gray-100'
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

      {/* Add new entry */}
      <div className="bg-purple-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-3">Add a new word to your notebook:</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Choose a word from today's lesson:
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedLesson?.vocabulary?.map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWord(w)}
                className={`flex items-center px-3 py-1 rounded-full border transition-all ${
                  selectedWord === w
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-white text-purple-600 border-purple-300 hover:bg-purple-100'
                }`}
              >
                {w}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak(w);
                  }}
                  className="ml-1 p-1 hover:bg-purple-200 rounded"
                >
                  {currentlySpeaking === w ? (
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
                disabled={!currentSentence.trim() || checkingGrammar}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 flex items-center"
              >
                {checkingGrammar ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Add
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </div>

      {/* Entries list */}
      <div>
        <h3 className="font-semibold mb-4">
          Your Vocabulary Entries
          <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-sm">
            {vocabNotebook.length}
          </span>
        </h3>

        {vocabNotebook.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Book className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No entries yet. Start by adding your first vocabulary word!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vocabNotebook.map((e) => (
              <div key={e.id} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold text-purple-600">"{e.word}"</span>
                    <button
                      onClick={() => handleSpeak(e.word)}
                      className="ml-2 p-1 text-gray-400 hover:text-purple-500"
                    >
                      {currentlySpeaking === e.word ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    {e.ttsService === 'elevenlabs' && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded ml-1">
                        11Labs
                      </span>
                    )}
                    <span className="text-sm text-gray-500 ml-2">{e.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.needsSync && (
                      <div className="text-xs text-orange-500 flex items-center">
                        <WifiOff className="w-3 h-3 mr-1" />
                        Offline
                      </div>
                    )}
                    {e.isCorrect !== null &&
                      (e.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ))}
                  </div>
                </div>

                <div className="flex items-center bg-white p-2 rounded mb-2">
                  <p className="flex-1">"{e.sentence}"</p>
                  <button
                    onClick={() => handleSpeak(e.sentence)}
                    className="ml-2 p-1 text-gray-400 hover:text-blue-500"
                  >
                    {currentlySpeaking === e.sentence ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {e.feedback && (
                  <div
                    className={`text-sm p-2 rounded ${
                      e.needsSync
                        ? 'bg-orange-100 text-orange-700'
                        : e.isCorrect
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    <strong>AI Feedback:</strong> {e.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DailyChallenge = ({ selectedLesson, challengeActive, setChallengeActive, challengeTimer, setChallengeTimer, formatTime, setPoints, handleSpeak, currentlySpeaking }) => {
  const challenges = [
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
    {
      type: 'quick_quiz',
      title: 'Quick Definition Quiz ⚡',
      instruction: 'Match the word to its meaning',
      questions: [
        {
          word: 'market',
          options: ['a place to buy things', 'a type of food', 'a color'],
          correct: 0,
        },
        {
          word: 'customer',
          options: ['a worker', 'a person who buys', 'a building'],
          correct: 1,
        },
      ],
      completed: false,
      points: 35,
    },
  ];

  const [currentChallenges, setCurrentChallenges] = useState(challenges);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizFeedback, setQuizFeedback] = useState({});

  const completeChallenge = (index) => {
    const updated = [...currentChallenges];
    updated[index].completed = true;
    setCurrentChallenges(updated);
    setPoints((p) => p + updated[index].points);
    setCompletedChallenges((c) => c + 1);
    if (updated.every((c) => c.completed)) {
      setChallengeActive(false);
      setPoints((p) => p + 50);
    }
  };

  const handleQuizAnswer = (ci, qi, opt) => {
    const q = currentChallenges[ci].questions[qi];
    const correct = opt === q.correct;
    const key = `${ci}-${qi}`;
    setSelectedAnswers((prev) => ({ ...prev, [key]: opt }));
    setQuizFeedback((prev) => ({ ...prev, [key]: correct }));
    const allCorrect = currentChallenges[ci].questions.every((_, i) => {
      const k = `${ci}-${i}`;
      return i === qi ? correct : quizFeedback[k];
    });
    if (allCorrect) setTimeout(() => completeChallenge(ci), 500);
  };

  const startChallenge = () => {
    setChallengeActive(true);
    setChallengeTimer(180);
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
            <span
              className={`text-lg font-bold ${challengeTimer < 30 ? 'text-red-500' : 'text-gray-700'
                }`}
            >
              {formatTime(challengeTimer)}
            </span>
          </div>
        )}
      </div>

      {!challengeActive && completedChallenges === 0 && (
        <button
          onClick={startChallenge}
          className="w-full py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold"
        >
          Start 3-Minute Challenge
        </button>
      )}

      {challengeTimer === 0 && completedChallenges < currentChallenges.length && (
        <div className="text-center bg-orange-50 p-6 rounded-lg">
          <Timer className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-orange-700 mb-2">Time's Up! ⏰</h3>
          <p className="text-gray-600 mb-4">
            You completed {completedChallenges} out of {currentChallenges.length}{' '}
            challenges
          </p>
          <button
            onClick={startChallenge}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      )}

      {completedChallenges === currentChallenges.length && (
        <div className="text-center bg-green-50 p-6 rounded-lg">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-700 mb-2">
            Challenge Complete! 🎉
          </h3>
          <p className="text-lg mb-2">
            You earned {challenges.reduce((s, c) => s + c.points, 0) + 50} points!
          </p>
          <p className="text-gray-600">Come back tomorrow for new challenges!</p>
        </div>
      )}

      {challengeActive && completedChallenges < currentChallenges.length && (
        <div className="space-y-4">
          {currentChallenges.map((c, ci) => (
            <div
              key={ci}
              className={`p-4 rounded-lg border-2 ${c.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{c.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">+{c.points} points</span>
                  {c.completed && <Check className="w-6 h-6 text-green-500" />}
                </div>
              </div>
              <p className="text-gray-600 mb-3">{c.instruction}</p>

              {/* Pronunciation */}
              {c.type === 'pronunciation' && !c.completed && (
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {c.words.map((w) => (
                      <button
                        key={w}
                        onClick={() => handleSpeak(w, 'challenge')}
                        className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg"
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
                    onClick={() => completeChallenge(ci)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
                  >
                    ✅ I practiced all words
                  </button>
                </div>
              )}

              {/* Sentence Building */}
              {c.type === 'sentence_building' && !c.completed && (
                <div>
                  <div className="space-y-2 mb-3">
                    {c.words.map((w) => (
                      <div key={w} className="flex items-center gap-2">
                        <button
                          onClick={() => handleSpeak(w)}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-purple-600">{w}:</span>
                        <input
                          type="text"
                          placeholder={`Write a sentence with "${w}"`}
                          className="flex-1 px-3 py-1 border rounded focus:border-purple-400 focus:outline-none"
                          onChange={(e) =>
                            setUserAnswers((prev) => ({ ...prev, [w]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => completeChallenge(ci)}
                    disabled={!c.words.every((w) => userAnswers[w]?.trim())}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg disabled:bg-gray-300"
                  >
                    ✅ Submit Sentences
                  </button>
                </div>
              )}

              {/* Quick Quiz */}
              {c.type === 'quick_quiz' && !c.completed && (
                <div className="space-y-3">
                  {c.questions.map((q, qi) => {
                    const key = `${ci}-${qi}`;
                    const isSelected = selectedAnswers[key] !== undefined;
                    const correct = quizFeedback[key];
                    return (
                      <div key={qi} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center mb-2">
                          <button
                            onClick={() => handleSpeak(q.word)}
                            className="p-1 text-blue-500 hover:bg-blue-100 rounded mr-2"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <p className="font-semibold">
                            What does "{q.word}" mean?
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {q.options.map((opt, oi) => (
                            <button
                              key={oi}
                              onClick={() => handleQuizAnswer(ci, qi, oi)}
                              className={`px-3 py-1 border rounded text-sm ${isSelected &&
                                selectedAnswers[key] === oi
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

              {c.completed && (
                <div className="text-green-600 font-semibold">
                  ✅ Challenge completed! +{c.points} points
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------
   MAIN COMPONENT
------------------------------------------- */
const LexiLearnSprint3Real = () => {
  const [ttsService, setTtsService] = useState(null);
  const [aiService, setAiService] = useState(null);
  const [currentStep, setCurrentStep] = useState('loading');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [topicRevealed, setTopicRevealed] = useState(false);
  const [vocabNotebook, setVocabNotebook] = useState([]);
  const [currentSentence, setCurrentSentence] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [points, setPoints] = useState(150);
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  const [selectedTTS, setSelectedTTS] = useState('browser');
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [showVocabNotebook, setShowVocabNotebook] = useState(false);
  const [challengeTimer, setChallengeTimer] = useState(180);
  const [challengeActive, setChallengeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app with API keys...');
        
        // Initialize services with hardcoded API keys
        setTtsService(new RealTTSService(ELEVENLABS_API_KEY));
        setAiService(new GeminiAIService(GEMINI_API_KEY));
        
        // Select a random lesson
        const keys = Object.keys(sampleLessons);
        const random = keys[Math.floor(Math.random() * keys.length)];
        setSelectedLesson(sampleLessons[random]);
        
        // Move to lesson step after initialization
        setCurrentStep('ice_breaker');
        console.log('App initialized successfully');
      } catch (err) {
        console.error('Error initializing app:', err);
        setError(`Failed to initialize: ${err.message}`);
      }
    };

    initializeApp();

    const goOnline = () => {
      console.log('App is online');
      setIsOnline(true);
    };
    const goOffline = () => {
      console.log('App is offline');
      setIsOnline(false);
    };
    
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    let t;
    if (challengeActive && challengeTimer > 0) {
      t = setInterval(() => setChallengeTimer((s) => s - 1), 1000);
    } else if (challengeTimer === 0) {
      setChallengeActive(false);
    }
    return () => clearInterval(t);
  }, [challengeActive, challengeTimer]);

  const handleSpeak = async (text, ctx = 'word') => {
    if (!ttsService) {
      console.error('TTS service not available');
      return;
    }
    
    if (currentlySpeaking === text) {
      window.speechSynthesis.cancel();
      setCurrentlySpeaking(null);
      return;
    }

    setCurrentlySpeaking(text);
    setIsLoading(true);
    
    try {
      console.log(`Speaking with ${selectedTTS}:`, text);
      
      if (selectedTTS === 'elevenlabs' && isOnline) {
        await ttsService.speakWithElevenLabs(text);
      } else {
        await ttsService.speakWithBrowser(text);
      }
      
      if (ctx === 'word') setPoints((p) => p + 2);
    } catch (e) {
      console.error('Error in handleSpeak:', e);
      setError(`Speech error: ${e.message}`);
    } finally {
      setCurrentlySpeaking(null);
      setIsLoading(false);
    }
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleIceBreakerComplete = () => {
    setCurrentStep('guess_topic');
  };

  const handleGuessTopicComplete = (correct) => {
    setTopicRevealed(correct);
    if (correct) setPoints(p => p + 20);
    setCurrentStep('voice_chat');
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
          <p>Loading APIs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-white to-red-600 p-1 rounded-lg">
        <div className="bg-white p-4 rounded-lg text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">LexiLearn Sprint 3</h1>
          <p className="text-gray-600">Real AI Integration with ElevenLabs & Gemini</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <p className="text-sm text-gray-500">Made in Gaza 🇵🇸</p>
            <div className="flex items-center text-green-600">
              <Trophy className="w-4 h-4 mr-1" />
              <span className="text-sm font-semibold">{points} points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => {
            setShowVocabNotebook(!showVocabNotebook);
            setShowDailyChallenge(false);
          }}
          className={`px-4 py-2 rounded-lg flex items-center ${
            showVocabNotebook 
              ? 'bg-purple-500 text-white' 
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          <Book className="w-4 h-4 mr-2" />
          Vocabulary Notebook
        </button>
        
        <button
          onClick={() => {
            setShowDailyChallenge(!showDailyChallenge);
            setShowVocabNotebook(false);
          }}
          className={`px-4 py-2 rounded-lg flex items-center ${
            showDailyChallenge 
              ? 'bg-yellow-500 text-white' 
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          }`}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Daily Challenge
        </button>
      </div>

      {/* Main Content */}
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
          formatTime={formatTime}
        />
      ) : showDailyChallenge ? (
        <DailyChallenge
          selectedLesson={selectedLesson}
          challengeActive={challengeActive}
          setChallengeActive={setChallengeActive}
          challengeTimer={challengeTimer}
          setChallengeTimer={setChallengeTimer}
          formatTime={formatTime}
          setPoints={setPoints}
          handleSpeak={handleSpeak}
          currentlySpeaking={currentlySpeaking}
        />
      ) : (
        <>
          {currentStep === 'ice_breaker' && (
            <IceBreaker 
              lesson={selectedLesson} 
              onComplete={handleIceBreakerComplete} 
            />
          )}
          
          {currentStep === 'guess_topic' && (
            <GuessTopic 
              lesson={selectedLesson} 
              onComplete={handleGuessTopicComplete} 
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

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>LexiLearn • Sprint 3 Real Integration • Built with ❤️ for Palestinian learners</p>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs">
          <span>🎯 Real ElevenLabs TTS</span>
          <span>🤖 Real Gemini AI</span>
          <span>⏱️ Timed Challenges</span>
          <span>📚 Smart Feedback</span>
        </div>
      </div>
    </div>
  );
};

export default LexiLearnSprint3Real;