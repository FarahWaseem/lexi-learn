import React from "react";
import "./LessonCard.css";

function LessonCard({ lesson, onAction }) {
  return (
    <div className="lesson-card">
      {/* Header */}
      <div className="lesson-header">
        <span className="lesson-number">Lesson {lesson.id}</span>
        <h3 className="lesson-title">{lesson.title}</h3>
      </div>

      {/* Description */}
      <p className="lesson-description">{lesson.description}</p>

      {/* Action button */}
      <button
        className={`lesson-btn ${
          lesson.status === "new" ? "start" : "summary"
        }`}
        onClick={() => onAction(lesson)}
      >
        {lesson.status === "new" ? "Start Lesson" : "View Summary"}
      </button>
    </div>
  );
}

export default LessonCard;
