import React, { useState } from 'react';
import { MessageCircle, Mic, Loader2 } from 'lucide-react';

const VoiceChat = ({ aiService, ttsService, selectedTTS, isOnline, handleSpeak }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your English practice assistant. What would you like to talk about today?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const response = await aiService.generateConversationResponse(inputMessage, messages);
      const aiMessage = { role: 'assistant', content: response };
      
      setMessages(prev => [...prev, aiMessage]);
      
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

export default VoiceChat;