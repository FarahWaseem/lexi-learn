// src/services/AIService.js
//import { handleApiError, fetchWithTimeout } from '../utils/apiUtils';
import { handleApiError, fetchWithTimeout, retryOperation } from '../utils/apiUtils';


export class GeminiAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  async generateContent(prompt) {
    console.log('🔑 API Key:', this.apiKey ? 'Exists' : 'Missing');
console.log('🌐 API URL:', this.apiUrl);
  if (!this.apiKey) {
    console.error('Gemini key missing');
    throw new Error('Gemini key missing');
  }

  try {
    return await retryOperation(async () => {
      const response = await fetchWithTimeout(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
        15000
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }, 3, 2000); // 3 محاولات، 2 ثانية بينهم
    
  } catch (error) {
    console.error('Error in generateContent:', error);
    throw handleApiError(error, 'Gemini AI');
  }
}
  async checkSentence(word, sentence) {
  try {
    // ✅ prompt أكثر وضوحاً لـ Gemini
    const prompt = `As a strict English teacher, check if this sentence uses the vocabulary word correctly:
    
VOCABULARY WORD: "${word}"
STUDENT'S SENTENCE: "${sentence}"

ANALYSIS REQUIREMENTS:
1. Check if the word "${word}" is used correctly in context
2. Check grammar and tense
3. Check sentence structure

IMPORTANT: Reply ONLY in this exact format:
[CORRECT] or [INCORRECT]: Your brief explanation here (max 12 words)`;

    console.log('🔄 Sending to Gemini with prompt:', prompt);
    const resp = await this.generateContent(prompt);
    console.log('✅ Raw Gemini response:', resp);

    if (!resp) {
      throw new Error('Empty response from Gemini');
    }

    // ✅ تحسين البحث عن الرد
    const responseText = resp.trim();
    console.log('✅ Trimmed response:', responseText);

    if (responseText.includes('[CORRECT]')) {
      const feedback = responseText.replace('[CORRECT]:', '').replace('[CORRECT] :', '').trim();
      return { 
        isCorrect: true, 
        feedback: feedback || 'Excellent! Word used correctly.',
        source: 'gemini'
      };
    }
    else if (responseText.includes('[INCORRECT]')) {
      const feedback = responseText.replace('[INCORRECT]:', '').replace('[INCORRECT] :', '').trim();
      return { 
        isCorrect: false, 
        feedback: feedback || 'Please check word usage and grammar.',
        source: 'gemini'
      };
    }
    else {
      console.warn('⚠️ Unexpected response format:', responseText);
      throw new Error('Invalid response format from Gemini');
    }
    
  } catch (error) {
    console.error('❌ Gemini failed:', error.message);
    return this.fallbackCheck(word, sentence);
  }
}

// أضف هذه الدالة في AIService class
async checkGeminiStatus() {
  try {
        await new Promise(resolve => setTimeout(resolve, 2000));
    const testPrompt = 'Hello, are you working? Reply with [YES] if operational.';
    const response = await this.generateContent(testPrompt);
    return {
      operational: response.includes('[YES]'),
      response: response
    };
  } catch (error) {
    return {
      operational: false,
      error: error.message
    };
  }
}
  // ✅ Fallback محسن
  fallbackCheck(word, sentence) {
    const hasWord = sentence.toLowerCase().includes(word.toLowerCase());
    const grammar = this.simpleGrammarCheck(sentence);
    
    let feedback = '';
    if (!hasWord) {
      feedback = `Try to include "${word}" in your sentence.`;
    } else if (!grammar.isValid) {
      feedback = grammar.feedback;
    } else {
      feedback = 'Good attempt! (Basic check)';
    }
    
    return {
      isCorrect: hasWord && grammar.isValid,
      feedback,
      source: 'fallback'
    };
  }

  // ✅ دالة التحقق النحوي
  simpleGrammarCheck(sentence) {
    const errors = [];
    
    // تحقق من أن الجملة تبدأ بحرف كبير
    if (!/^[A-Z]/.test(sentence)) {
      errors.push('Start with a capital letter');
    }
    
    // تحقق من وجود نقطة في النهاية
    if (!/[.!?]$/.test(sentence)) {
      errors.push('Add punctuation at the end');
    }
    
    // تحقق من الأزمنة البسيطة
    const words = sentence.toLowerCase().split(' ');
    if (words.includes('yesterday') && words.some(w => w === 'go' || w === 'goes')) {
      errors.push('Use "went" instead of "go" with yesterday');
    }
    
    if (words.includes('tomorrow') && words.some(w => w === 'went' || w === 'go')) {
      errors.push('Use "will go" for future tense');
    }
    
    return {
      isValid: errors.length === 0,
      feedback: errors.length > 0 ? errors.join('. ') + '.' : 'Good grammar!'
    };
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
