// src/services/WhisperService.js
export class WhisperService {
  constructor() {
    this.apiUrl = 'http://localhost:3001/api';
  }

  async transcribeAudio(audioBlob) {
    try {
    console.log('🔄 Sending audio to Whisper server...');

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch(`${this.apiUrl}/day/1/answer/1`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Whisper transcription failed:', error);
      throw new Error('Speech recognition unavailable. Please make sure the server is running on port 3000.');
    }
  }

  async getQuestion(day = 1, index = 1) {
    try {
      const response = await fetch(`${this.apiUrl}/day/${day}/question/${index}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch question: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch question:', error);
      return {
        topic: 'General Conversation',
        question: 'Tell me about your day'
      };
    }
  }
}