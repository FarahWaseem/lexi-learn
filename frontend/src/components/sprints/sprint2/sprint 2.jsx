import React, { useState, useEffect } from 'react';
import { Camera, Book, Trophy, Star, Plus, Edit, Save, Volume2, Check, X, Wifi, WifiOff, Zap, Brain, Target } from 'lucide-react';

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
  },
  family: {
    topic: "Family & Relationships",
    image: "/api/placeholder/300/200",
    vocabulary: ["mother", "father", "sister", "brother", "aunt", "uncle", "cousin", "grandma"],
    description: "Learn family members and relationship terms",
    iceBreaker: {
      type: "family_tree",
      title: "Family Tree Quiz! 👨‍👩‍👧‍👦",
      description: "Complete the family relationships!"
    }
  },
  weather: {
    topic: "Weather & Seasons",
    image: "/api/placeholder/300/200",
    vocabulary: ["sunny", "rainy", "cloudy", "windy", "hot", "cold", "storm", "rainbow"],
    description: "Weather vocabulary and seasonal expressions",
    iceBreaker: {
      type: "weather_emoji",
      title: "Weather Emoji Game! ☀️",
      description: "Match the weather to the emoji!"
    }
  },
  hobbies: {
    topic: "Hobbies & Free Time",
    image: "/api/placeholder/300/200",
    vocabulary: ["reading", "swimming", "drawing", "music", "dancing", "sports", "gaming", "cooking"],
    description: "Talk about hobbies and leisure activities",
    iceBreaker: {
      type: "hobby_mime",
      title: "Hobby Actions! 🎭",
      description: "Guess the hobby from the description!"
    }
  }
};

const LexiLearnPrototype = () => {
  const [currentStep, setCurrentStep] = useState('icebreaker');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [userGuess, setUserGuess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [vocabNotebook, setVocabNotebook] = useState([]);
  const [currentSentence, setCurrentSentence] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [iceBreakerData, setIceBreakerData] = useState(null);
  const [iceBreakerCompleted, setIceBreakerCompleted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [points, setPoints] = useState(0);

  // Generate random lesson for demo
  useEffect(() => {
    const lessons = Object.keys(sampleLessons);
    const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];
    setSelectedLesson(sampleLessons[randomLesson]);
  }, []);

  // 3.1 AI Welcome & Ice Breaker Component
  const IceBreakerComponent = () => {
    useEffect(() => {
      if (selectedLesson && !iceBreakerData) {
        initializeIceBreaker();
      }
    }, [selectedLesson]);

    const initializeIceBreaker = () => {
      const lesson = selectedLesson;
      switch (lesson.iceBreaker.type) {
        case 'price_guess':
          setIceBreakerData({
            items: [
              { name: 'Apple', correctPrice: 2, userGuess: null, emoji: '🍎' },
              { name: 'Bread', correctPrice: 3, userGuess: null, emoji: '🍞' },
              { name: 'Milk', correctPrice: 5, userGuess: null, emoji: '🥛' }
            ],
            currentItem: 0,
            score: 0
          });
          break;
        
        case 'taste_challenge':
          setIceBreakerData({
            flavors: [
              { emoji: '🍯', options: ['sweet', 'sour', 'spicy'], correct: 'sweet' },
              { emoji: '🍋', options: ['sweet', 'sour', 'bitter'], correct: 'sour' },
              { emoji: '🌶️', options: ['mild', 'spicy', 'sweet'], correct: 'spicy' }
            ],
            currentFlavor: 0,
            score: 0
          });
          break;

        case 'destination_match':
          setIceBreakerData({
            landmarks: [
              { landmark: 'Eiffel Tower', options: ['France', 'Italy', 'Spain'], correct: 'France', emoji: '🗼' },
              { landmark: 'Big Ben', options: ['USA', 'UK', 'Germany'], correct: 'UK', emoji: '🕰️' },
              { landmark: 'Pyramids', options: ['Egypt', 'Mexico', 'Peru'], correct: 'Egypt', emoji: '🏛️' }
            ],
            currentLandmark: 0,
            score: 0
          });
          break;

        case 'family_tree':
          setIceBreakerData({
            relationships: [
              { question: "Your father's wife is your...", options: ['mother', 'aunt', 'sister'], correct: 'mother', emoji: '👩' },
              { question: "Your mother's father is your...", options: ['uncle', 'grandfather', 'cousin'], correct: 'grandfather', emoji: '👴' },
              { question: "Your aunt's child is your...", options: ['brother', 'cousin', 'nephew'], correct: 'cousin', emoji: '👦' }
            ],
            currentQuestion: 0,
            score: 0
          });
          break;

        case 'weather_emoji':
          setIceBreakerData({
            weather: [
              { emoji: '☀️', options: ['rainy', 'sunny', 'cloudy'], correct: 'sunny' },
              { emoji: '🌧️', options: ['snowy', 'windy', 'rainy'], correct: 'rainy' },
              { emoji: '❄️', options: ['hot', 'snowy', 'warm'], correct: 'snowy' }
            ],
            currentWeather: 0,
            score: 0
          });
          break;

        case 'hobby_mime':
          setIceBreakerData({
            hobbies: [
              { description: 'Moving your body to music 🎵', options: ['dancing', 'singing', 'reading'], correct: 'dancing', emoji: '💃' },
              { description: 'Creating pictures with colors 🎨', options: ['writing', 'drawing', 'cooking'], correct: 'drawing', emoji: '🎨' },
              { description: 'Moving in water for exercise 💦', options: ['running', 'swimming', 'jumping'], correct: 'swimming', emoji: '🏊‍♀️' }
            ],
            currentHobby: 0,
            score: 0
          });
          break;

        default:
          setIceBreakerData({
            type: 'default',
            choices: ['rock', 'paper', 'scissors'],
            score: 0
          });
      }
    };

    const handleAnswer = (answer) => {
      const lesson = selectedLesson;
      const data = { ...iceBreakerData };
      
      switch (lesson.iceBreaker.type) {
        case 'price_guess':
          data.items[data.currentItem].userGuess = answer;
          if (Math.abs(answer - data.items[data.currentItem].correctPrice) <= 1) {
            data.score += 1;
            setPoints(prev => prev + 10);
          }
          break;
          
        case 'taste_challenge':
        case 'destination_match':  
        case 'family_tree':
        case 'weather_emoji':
        case 'hobby_mime':
          if (answer === getCurrentCorrectAnswer()) {
            data.score += 1;
            setPoints(prev => prev + 10);
          }
          break;
      }

      const currentIndex = getCurrentIndex();
      const maxIndex = getMaxIndex();
      
      if (currentIndex < maxIndex - 1) {
        setCurrentIndex(data, currentIndex + 1);
        setIceBreakerData(data);
      } else {
        setIceBreakerData(data);
        setTimeout(() => {
          setIceBreakerCompleted(true);
          setTimeout(() => setCurrentStep('guess'), 2000);
        }, 1500);
      }
    };

    const getCurrentIndex = () => {
      const lesson = selectedLesson;
      switch (lesson.iceBreaker.type) {
        case 'price_guess': return iceBreakerData.currentItem;
        case 'taste_challenge': return iceBreakerData.currentFlavor;
        case 'destination_match': return iceBreakerData.currentLandmark;
        case 'family_tree': return iceBreakerData.currentQuestion;
        case 'weather_emoji': return iceBreakerData.currentWeather;
        case 'hobby_mime': return iceBreakerData.currentHobby;
        default: return 0;
      }
    };

    const getMaxIndex = () => {
      const lesson = selectedLesson;
      switch (lesson.iceBreaker.type) {
        case 'price_guess': return iceBreakerData.items?.length || 0;
        case 'taste_challenge': return iceBreakerData.flavors?.length || 0;
        case 'destination_match': return iceBreakerData.landmarks?.length || 0;
        case 'family_tree': return iceBreakerData.relationships?.length || 0;
        case 'weather_emoji': return iceBreakerData.weather?.length || 0;
        case 'hobby_mime': return iceBreakerData.hobbies?.length || 0;
        default: return 1;
      }
    };

    const setCurrentIndex = (data, index) => {
      const lesson = selectedLesson;
      switch (lesson.iceBreaker.type) {
        case 'price_guess': data.currentItem = index; break;
        case 'taste_challenge': data.currentFlavor = index; break;
        case 'destination_match': data.currentLandmark = index; break;
        case 'family_tree': data.currentQuestion = index; break;
        case 'weather_emoji': data.currentWeather = index; break;
        case 'hobby_mime': data.currentHobby = index; break;
      }
    };

    const getCurrentCorrectAnswer = () => {
      const lesson = selectedLesson;
      const currentIndex = getCurrentIndex();
      
      switch (lesson.iceBreaker.type) {
        case 'taste_challenge': return iceBreakerData.flavors?.[currentIndex]?.correct;
        case 'destination_match': return iceBreakerData.landmarks?.[currentIndex]?.correct;
        case 'family_tree': return iceBreakerData.relationships?.[currentIndex]?.correct;
        case 'weather_emoji': return iceBreakerData.weather?.[currentIndex]?.correct;
        case 'hobby_mime': return iceBreakerData.hobbies?.[currentIndex]?.correct;
        default: return null;
      }
    };

    const playRockPaperScissors = (userChoice) => {
      const choices = ['rock', 'paper', 'scissors'];
      const aiChoice = choices[Math.floor(Math.random() * 3)];
      let result;
      
      if (userChoice === aiChoice) {
        result = 'tie';
      } else if (
        (userChoice === 'rock' && aiChoice === 'scissors') ||
        (userChoice === 'paper' && aiChoice === 'rock') ||
        (userChoice === 'scissors' && aiChoice === 'paper')
      ) {
        result = 'win';
        setPoints(prev => prev + 15);
      } else {
        result = 'lose';
      }
      
      setTimeout(() => {
        setIceBreakerCompleted(true);
        setTimeout(() => setCurrentStep('guess'), 2000);
      }, 2000);
    };

    const renderCurrentQuestion = () => {
      if (!iceBreakerData || !selectedLesson) return null;
      
      const lesson = selectedLesson;
      const currentIndex = getCurrentIndex();
      
      switch (lesson.iceBreaker.type) {
        case 'price_guess':
          const currentItem = iceBreakerData.items[currentIndex];
          return (
            <div className="text-center">
              <div className="text-6xl mb-4">{currentItem.emoji}</div>
              <p className="text-lg mb-4">How much does a <strong>{currentItem.name}</strong> cost? (in dollars)</p>
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map(price => (
                  <button
                    key={price}
                    onClick={() => handleAnswer(price)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                  >
                    ${price}
                  </button>
                ))}
              </div>
            </div>
          );

        case 'taste_challenge':
          const currentFlavor = iceBreakerData.flavors[currentIndex];
          return (
            <div className="text-center">
              <div className="text-6xl mb-4">{currentFlavor.emoji}</div>
              <p className="text-lg mb-4">How does this taste?</p>
              <div className="flex justify-center gap-2">
                {currentFlavor.options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );

        case 'destination_match':
          const currentLandmark = iceBreakerData.landmarks[currentIndex];
          return (
            <div className="text-center">
              <div className="text-6xl mb-4">{currentLandmark.emoji}</div>
              <p className="text-lg mb-4">Where is the <strong>{currentLandmark.landmark}</strong>?</p>
              <div className="flex justify-center gap-2">
                {currentLandmark.options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );

        case 'family_tree':
          const currentQuestion = iceBreakerData.relationships[currentIndex];
          return (
            <div className="text-center">
              <div className="text-6xl mb-4">{currentQuestion.emoji}</div>
              <p className="text-lg mb-4">{currentQuestion.question}</p>
              <div className="flex justify-center gap-2">
                {currentQuestion.options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );

        case 'weather_emoji':
          const currentWeather = iceBreakerData.weather[currentIndex];
          return (
            <div className="text-center">
              <div className="text-6xl mb-4">{currentWeather.emoji}</div>
              <p className="text-lg mb-4">What's the weather like?</p>
              <div className="flex justify-center gap-2">
                {currentWeather.options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );

        case 'hobby_mime':
          const currentHobby = iceBreakerData.hobbies[currentIndex];
          return (
            <div className="text-center">
              <div className="text-6xl mb-4">{currentHobby.emoji}</div>
              <p className="text-lg mb-4">{currentHobby.description}</p>
              <p className="text-md mb-4 text-gray-600">What hobby is this?</p>
              <div className="flex justify-center gap-2">
                {currentHobby.options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
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
              <p className="text-lg mb-4 font-semibold">Let's play Rock, Paper, Scissors! 🎮</p>
              <div className="flex justify-center gap-4">
                {['rock', 'paper', 'scissors'].map((choice) => (
                  <button
                    key={choice}
                    onClick={() => playRockPaperScissors(choice)}
                    className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all text-4xl"
                  >
                    {choice === 'rock' && '🪨'}
                    {choice === 'paper' && '📄'}
                    {choice === 'scissors' && '✂️'}
                  </button>
                ))}
              </div>
            </div>
          );
      }
    };

    if (!selectedLesson) return null;

    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to LexiLearn! 🌟</h2>
          <h3 className="text-xl font-semibold text-green-600 mb-2">{selectedLesson.iceBreaker.title}</h3>
          <p className="text-gray-600 mb-4">{selectedLesson.iceBreaker.description}</p>
        </div>

        {!iceBreakerCompleted ? (
          <div>
            {iceBreakerData && (
              <div className="mb-4">
                <div className="bg-white p-2 rounded-lg inline-block">
                  <span className="text-sm font-semibold text-gray-600">
                    Score: {iceBreakerData.score || 0} / {getMaxIndex()}
                  </span>
                </div>
              </div>
            )}
            {renderCurrentQuestion()}
          </div>
        ) : (
          <div className="text-center bg-green-50 p-6 rounded-lg">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-green-700 mb-2">Great job!</h3>
            <p className="text-lg mb-2">
              You scored {iceBreakerData?.score || 0} out of {getMaxIndex()}!
            </p>
            <p className="text-gray-600 mb-2">Now let's guess today's topic!</p>
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </div>
    );
  };

  // 3.2 Guess the Topic Component
  const GuessTopicComponent = () => {
    const checkGuess = () => {
      const isCorrect = userGuess.toLowerCase().includes(selectedLesson?.topic.toLowerCase().split(' ')[0]) ||
                       selectedLesson?.topic.toLowerCase().includes(userGuess.toLowerCase());
      setShowResult(true);
      setPoints(prev => prev + 20);
      
      setTimeout(() => {
        setShowVoiceChat(true);
      }, 3001);
    };

    return (
      <div className="bg-white p-6 rounded-lg border-2 border-blue-200 shadow-lg">
        <div className="text-center mb-6">
          <Brain className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Guess Today's Topic! 🤔</h2>
          <p className="text-gray-600">Look at the image and guess what we'll learn about today</p>
        </div>

        {selectedLesson && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-64 h-40 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  {selectedLesson.topic === 'Shopping' && <div className="text-4xl mb-2">🛍️🏪</div>}
                  {selectedLesson.topic === 'Food & Cooking' && <div className="text-4xl mb-2">🍳🥘</div>}
                  {selectedLesson.topic === 'Travel & Transportation' && <div className="text-4xl mb-2">✈️🗺️</div>}
                  {selectedLesson.topic === 'Family & Relationships' && <div className="text-4xl mb-2">👨‍👩‍👧‍👦❤️</div>}
                  {selectedLesson.topic === 'Weather & Seasons' && <div className="text-4xl mb-2">☀️🌧️</div>}
                  {selectedLesson.topic === 'Hobbies & Free Time' && <div className="text-4xl mb-2">🎨⚽</div>}
                  <p className="text-sm text-gray-500">Visual hints about today's topic</p>
                </div>
              </div>
            </div>

            {!showResult ? (
              <div>
                <p className="text-lg mb-4 font-semibold">What do you think today's topic is about?</p>
                <div className="flex justify-center gap-2 mb-4">
                  <input
                    type="text"
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    placeholder="Type your guess..."
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  />
                  <button
                    onClick={checkGuess}
                    disabled={!userGuess.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                  >
                    Guess!
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Check className="w-8 h-8 text-green-500 mr-2" />
                  <h3 className="text-xl font-bold text-green-700">Great guess! 🎉</h3>
                </div>
                <p className="text-lg mb-2">Today's topic is: <strong>{selectedLesson.topic}</strong></p>
                <p className="text-gray-600 mb-4">{selectedLesson.description}</p>
                
                {!showVoiceChat ? (
                  <p className="text-sm text-gray-500 mt-2">Starting voice chat with AI...</p>
                ) : (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center mb-3">
                      <Volume2 className="w-8 h-8 text-blue-500 mr-2" />
                      <h4 className="font-semibold text-blue-800">Voice Chat with AI</h4>
                    </div>
                    <div className="bg-white p-4 rounded-lg mb-3">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">AI</span>
                        </div>
                        <p className="text-gray-700">Great! Let's practice talking about {selectedLesson.topic.toLowerCase()}. Can you tell me one thing you like about this topic?</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <button className="p-4 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all">
                          <Volume2 className="w-6 h-6" />
                        </button>
                        <span className="mx-4 text-gray-500">Click to speak</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep('vocab')}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-all"
                    >
                      Continue to Vocabulary Notebook →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 3.10 Vocab Notebook Component
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
          needsSync: !isOnline
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

    const syncOfflineEntries = () => {
      setVocabNotebook(prev => prev.map(entry => {
        if (entry.needsSync && isOnline) {
          const hasWordInSentence = entry.sentence.toLowerCase().includes(entry.word.toLowerCase());
          return {
            ...entry,
            isCorrect: hasWordInSentence && entry.sentence.length > 10,
            feedback: hasWordInSentence && entry.sentence.length > 10
              ? "Excellent sentence! Synced successfully! 👏"
              : hasWordInSentence 
                ? "Good use of the word! Try longer sentences next time."
                : `Please include the word "${entry.word}" in your sentence.`,
            needsSync: false
          };
        }
        return entry;
      }));
    };

    useEffect(() => {
      if (isOnline) {
        syncOfflineEntries();
      }
    }, [isOnline]);

    return (
      <div className="bg-white p-6 rounded-lg border-2 border-purple-200 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Book className="w-8 h-8 text-purple-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Vocabulary Notebook 📚</h2>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center text-green-600">
                <Wifi className="w-5 h-5 mr-1" />
                <span className="text-sm font-semibold">Online</span>
              </div>
            ) : (
              <div className="flex items-center text-orange-600">
                <WifiOff className="w-5 h-5 mr-1" />
                <span className="text-sm font-semibold">Offline</span>
              </div>
            )}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-all"
            >
              Toggle Connection
            </button>
          </div>
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
                  className={`px-3 py-1 rounded-full border transition-all ${
                    selectedWord === word 
                      ? 'bg-purple-500 text-white border-purple-500' 
                      : 'bg-white text-purple-600 border-purple-300 hover:bg-purple-100'
                  }`}
                >
                  {word}
                  <Volume2 className="w-3 h-3 ml-1 inline" />
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
                  <strong>Offline Mode:</strong> Your sentences will be saved and corrected when you go back online.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Vocabulary entries */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center">
            Your Vocabulary Entries 
            <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-sm">
              {vocabNotebook.length}
            </span>
            {vocabNotebook.some(entry => entry.needsSync) && (
              <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs">
                {vocabNotebook.filter(entry => entry.needsSync).length} pending sync
              </span>
            )}
          </h3>
          
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
                        <Volume2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-purple-500" />
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
                  <p className="text-gray-800 mb-2 bg-white p-2 rounded">"{entry.sentence}"</p>
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
            📱 Offline Capabilities
          </h4>
          <div className="text-sm text-blue-600 space-y-1">
            <p>✅ Save vocabulary words and sentences offline</p>
            <p>✅ Listen to word pronunciation (cached audio)</p>
            <p>✅ Review previous entries and feedback</p>
            <p>✅ Auto-sync corrections when back online</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header with Keffiyeh pattern */}
      <div className="bg-gradient-to-r from-green-600 via-white to-red-600 p-1 rounded-lg">
        <div className="bg-white p-4 rounded-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">LexiLearn</h1>
            <p className="text-gray-600">AI-Powered English Learning Platform</p>
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

      {/* Navigation */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setCurrentStep('icebreaker')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            currentStep === 'icebreaker' 
              ? 'bg-green-500 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🎮 3.1 Ice Breaker
        </button>
        <button
          onClick={() => setCurrentStep('guess')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            currentStep === 'guess' 
              ? 'bg-blue-500 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🧠 3.2 Guess Topic
        </button>
        <button
          onClick={() => setCurrentStep('vocab')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            currentStep === 'vocab' 
              ? 'bg-purple-500 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          📚 3.10 Vocab Notebook
        </button>
      </div>

      {/* Progress indicator */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Today's Lesson Progress</h3>
          <span className="text-sm text-gray-500">
            {selectedLesson?.topic || 'Loading...'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500" 
            style={{
              width: currentStep === 'icebreaker' ? '33%' : 
                     currentStep === 'guess' ? '66%' : '100%'
            }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-96">
        {currentStep === 'icebreaker' && <IceBreakerComponent />}
        {currentStep === 'guess' && <GuessTopicComponent />}
        {currentStep === 'vocab' && <VocabNotebookComponent />}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>LexiLearn • Sprint 2 Prototype • Built with ❤️ for Palestinian learners</p>
        <p className="mt-1">🎯 Focus: Ice Breaker Games, Topic Guessing & Offline Vocabulary Practice</p>
      </div>
    </div>
  );
};

export default LexiLearnPrototype;