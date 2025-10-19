import React from "react";
import "./LastVocabs.css";
import zaytoonaReadingBook from "../../../../assets/images/zaytoonaReadingBook.png";

export default function LastVocabs({ vocabs = [] }) {
  const isEmpty = !vocabs.length;

  return (
    <div className="last-vocabs card">
      <h3 className="heading">Last Vocabs</h3>

      {isEmpty ? (
        <div className="empty-state">
          <img src={zaytoonaReadingBook} alt="Zaytoona reading" />
          <p>Your new words will appear here after the first lesson.</p>
        </div>
      ) : (
        <ul className="vocab-list">
          {vocabs.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
