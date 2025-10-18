import React from "react";
import "./LessonCard.css";

function LessonCard({ lesson, onAction }) {
  return (
    <div className="lesson-card">
      <div className="lesson-header">
        <h4 className="lesson-number">Lesson {lesson.id}</h4>
        <h3 className="lesson-title">{lesson.title}</h3>
      </div>

      <p className="lesson-description">{lesson.description}</p>

      <button
        className={`lesson-btn ${lesson.status === "new" ? "start" : "summary"}`}
        onClick={() => onAction(lesson)}
      >
        {lesson.status === "new" ? "Start Lesson" : "View Summary"}
      </button>
    </div>
  );
}

export default LessonCard;
