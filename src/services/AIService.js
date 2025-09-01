// src/services/AIService.js

import { handleApiError, fetchWithTimeout } from '../utils/apiUtils';

export class GeminiAIService {
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
        15000 // 15 second timeout
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini error: ${response.status}`, errorText);
        throw new Error(`Gemini error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error in generateContent:', error);
      throw handleApiError(error, 'Gemini AI');
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