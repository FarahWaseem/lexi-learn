import React from "react";
import "./LastVocabs.css";
import zaytoonaReadingBook from "../../../../assets/images/zaytoonaReadingBook.png";
import SpeakerIconSvg from "../../../../assets/icons/volume-high.svg"; 

const handleSpeak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); 
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; 
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser.");
  }
};

export default function LastVocabs({ vocabs = [] }) {
  const isEmpty = !vocabs || vocabs.length === 0;

  return (
    <div className="last-vocabs"> 
      <div className="last-vocabs__header">
        <h3 className="heading">Last Vocabs</h3> 
      </div>

      {isEmpty ? (
        <div className="empty-state">
          <img src={zaytoonaReadingBook} alt="Zaytoona reading" />
          <p>Your new words will appear here after the first lesson.</p>
        </div>
      ) : (
        <ul className="vocab-list">
          {vocabs.map((vocab, i) => (
            <li key={i} className="vocab-list__item">
              
              <div className="vocab-list__word-container">
                <button 
                  onClick={() => handleSpeak(vocab.en)} 
                  className="speaker-btn"
                  aria-label={`Listen to ${vocab.en}`}
                >
                  <img src={SpeakerIconSvg} alt="Speaker icon" />
                </button>
                
                <span className="vocab-list__en-word">{vocab.en}</span>
              </div>
              
              <span className="vocab-list__ar-word">{vocab.ar}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}