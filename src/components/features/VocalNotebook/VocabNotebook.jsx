// src/components/VocabNotebook.jsx
import React, { useState, useEffect } from 'react';
import { Book, Plus, Loader2, Volume2, Pause } from 'lucide-react';
import NotebookEntry from './NotebookEntry/NotebookEntry';

const VocabNotebook = ({
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
  setSelectedTTS
}) => {
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [error, setError] = useState('');
  const [geminiStatus, setGeminiStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    
    const checkGemini = async () => {
      console.log('--- VocabNotebook useEffect starting... ---');
      if (aiService && isOnline) {
        setGeminiStatus('checking');
        console.log('4. Online, calling checkGeminiStatus from AIService.');
        try {
          const status = await aiService.checkGeminiStatus();
            console.log('5. Status received from AIService:', status);

          if (isMounted) {
            setGeminiStatus(status.operational ? 'online' : 'offline');
              console.log('6. UI status updated to:', status.operational ? 'online' : 'offline');

          }
        } catch (error) {
          if (isMounted) {
            setGeminiStatus('offline');
            console.log('Gemini check failed:', error);
              console.error('❌ Error during Gemini check:', error);

          }
        }
      } else {
       console.log('4. Offline, or aiService not ready. Setting UI status to offline.');
        if (isMounted) {
          setGeminiStatus('offline');
        }
      }
    };
    
    checkGemini();
    
    return () => { 
      isMounted = false; 
    };
  }, [aiService, isOnline]);

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
      if (isOnline && geminiStatus === 'online' && aiService) {
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
        const fallbackRes = aiService.fallbackCheck(selectedWord, currentSentence);
        setVocabNotebook((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  isCorrect: fallbackRes.isCorrect,
                  feedback: fallbackRes.feedback,
                  needsSync: false,
                }
              : e
          )
        );
        setPoints((p) => p + 5);
      }
    } catch (e) {
      console.error(e);
      setError('Error checking sentence. Please try again.');
      setVocabNotebook((prev) =>
        prev.map((e) =>
          e.id === entry.id
            ? { ...e, isCorrect: false, feedback: 'Error with check', needsSync: false }
            : e
        )
      );
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

      {/* مؤشر حالة Gemini */}
      <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">AI Grammar Check:</span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            geminiStatus === 'online' ? 'bg-green-100 text-green-800' : 
            geminiStatus === 'offline' ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'
          }`}>
            {geminiStatus === 'online' ? '✅ ONLINE' : 
              geminiStatus === 'offline' ? '❌ OFFLINE' : '⏳ CHECKING'}
          </span>
        </div>
        
        {geminiStatus === 'offline' && (
          <p className="text-xs text-red-600 mt-2">
            Using basic grammar check. AI service unavailable.
          </p>
        )}
      </div>

      {/* واجهة إضافة كلمات جديدة */}
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

      {/* عرض المدخلات */}
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
            {vocabNotebook.map((entry) => (
              <NotebookEntry
                key={entry.id}
                entry={entry}
                handleSpeak={handleSpeak}
                currentlySpeaking={currentlySpeaking}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabNotebook;