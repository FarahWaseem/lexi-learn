import React, { useCallback } from "react";
import "./NewVocabs.css";

import zaytoonaReminder from "../../../assets/images/zaytoonaReminder.png";
import zaytoonaReadingBook from "../../../assets/images/zaytoonaReadingBook.png";
import speakerIcon from "../../../assets/icons/volume-high.svg"; // غيّري المسار لو اسم الأيقونة مختلف

import { dashboardMockData } from "../../../data/dashboardMockData";

export default function NewVocabs() {
  const lastLessons = dashboardMockData.lessons.slice(-2);

  let vocabs = [];
  lastLessons.forEach((lesson) => {
    vocabs = vocabs.concat(lesson.vocabs);
  });
  vocabs = vocabs.slice(-8);

  const isEmpty = !vocabs.length;

  // دالة نطق بسيطة باستخدام Web Speech API
  const handleSpeak = useCallback((text) => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        window.speechSynthesis.speak(utter);
      } else {
        console.warn("Speech synthesis not supported in this browser.");
      }
    } catch (e) {
      console.error("TTS error:", e);
    }
  }, []);

  return (
    <div className="practice-reminder-card">
      <div className="reminder-content">
        <div className="reminder-header">
          <img
            src={zaytoonaReminder}
            alt="Zaytoona Reminder"
            className="reminder-icon"
          />
          <div className="reminder-text">
            <h4>Lesson Recap</h4>
          </div>
        </div>

        <div className="reminder-text">
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
                      type="button"
                    >
                      <img src={speakerIcon} alt="Speaker icon" />
                    </button>
                    <span className="vocab-list__en-word">{vocab.en}</span>
                  </div>
                  <span className="vocab-list__ar-word">{vocab.ar}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
