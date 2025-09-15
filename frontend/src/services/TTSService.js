// src/services/TTSService.js

export class RealTTSService {
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
        const errorText = await res.text();
        console.error(`ElevenLabs error: ${res.status}`, errorText);
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

 speakWithBrowser(text) {
  return new Promise((resolve, reject) => {
    // أوقف أي كلام سابق
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      console.log('✅ Speech synthesis completed');
      resolve();
    };
    
    utterance.onerror = (event) => {
      console.warn('⚠️ Speech synthesis error (non-critical):', event.error);
      resolve(); // ✅ لا ترفض الـ promise، فقط سجل التحذير
    };
    
    // انتظر قليلاً قبل البدء
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  });
}

}