import React from "react";
import "./NewVocabs.css";
import zaytoonaReminder from "../../../assets/images/zaytoonaReminder.png";
import { dashboardMockData } from "../../../data/dashboardMockData"; 


export default function NewVocabs() {
     const lastLessons = dashboardMockData.lessons.slice(-2);
      let vocabs = [];
      lastLessons.forEach(lesson => {
        vocabs = vocabs.concat(lesson.vocabs);
      });
      
      vocabs = vocabs.slice(-8); 
      const isEmpty = !vocabs.length;
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
      </div>
    </div>
  );
}
