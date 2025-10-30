import React from "react";
import "./LessonCard.css";

function LessonCard({ lesson, onAction }) {
  const statusLabel = lesson.completed
    ? "View Summary"
    : lesson.unlocked
    ? "Start Lesson"
    : "Locked";

  const statusClass = lesson.completed
    ? "btn-dark"
    : lesson.unlocked
    ? "btn-green"
    : "btn-locked";

  return (
    <div className="lesson-card" onClick={() => lesson.unlocked && onAction(lesson)}>
      <div className="lesson-card__head">Lesson {lesson.id}</div>
      <h3 className="lesson-card__title">{lesson.title}</h3>
      <p className="lesson-card__desc">{lesson.description}</p>

      <div className="lesson-card__actions">
        <button
          className={`btn ${statusClass}`}
          onClick={(e) => {
            e.stopPropagation();
            lesson.unlocked && onAction(lesson);
          }}
          disabled={!lesson.unlocked}
        >
          {statusLabel}
        </button>
      </div>
    </div>
  );
}

export default LessonCard;