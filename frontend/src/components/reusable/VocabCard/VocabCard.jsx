import React from "react";
import LessonChip from "../LessonChip/LessonChip";
import "./VocabCard.css";

function VocabCard({ lesson, word, translation, onPlay, onDelete }) {
  return (
    <div className="vocab-card">
      <LessonChip text={lesson} />

      <div className="vocab-body">
        <div className="vocab-row">
          <h3 className="vocab-word">{word}</h3>
          <button className="vocab-sound" onClick={onPlay}>
            <img src="/src/assets/icons/volume-high.svg" alt="play" />
          </button>
        </div>
        <p className="vocab-translation">{translation}</p>
      </div>

      <button className="vocab-delete" onClick={onDelete}>
        <img src="/src/assets/icons/trash.svg" alt="delete" />
      </button>
    </div>
  );
}

export default VocabCard;