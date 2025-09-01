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

  speakWithBrowser(text, rate = 1, pitch = 1) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported in this browser');
      reject('Speech synthesis not supported');
      return;
    }
    // الحصول على الأصوات المتاحة أولاً
    const voices = window.speechSynthesis.getVoices();
    let enVoice = voices.find((v) => v.lang.startsWith('en-'));
    
    // إذا لم توجد أصوات بعد، ننتظر حتى يتم تحميلها
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        enVoice = updatedVoices.find((v) => v.lang.startsWith('en-'));
        this.speakWithBrowserUtil(text, rate, pitch, enVoice, resolve, reject);
      };
    } else {
      this.speakWithBrowserUtil(text, rate, pitch, enVoice, resolve, reject);
    }
  });
}
// دالة مساعدة للكلام
speakWithBrowserUtil(text, rate, pitch, voice, resolve, reject) {
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  
  if (voice) {
    utterance.voice = voice;
  }
  
  utterance.onend = () => {
    console.log('Speech synthesis ended');
    resolve();
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    reject(event);
  };
  
  console.log('Starting speech synthesis with voice:', voice ? voice.name : 'default');
  window.speechSynthesis.speak(utterance);
}
      
}