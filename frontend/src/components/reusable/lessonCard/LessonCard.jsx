import React from "react";
import "./LessonCard.css";

function LessonCard({ lesson, onAction }) {
  return (
    <div className="lesson-card">

        <div className="lesson-header">
          <span className="lesson-number">Lesson {lesson.id}</span>
             <h3 className="lesson-title">{lesson.title}</h3>
           </div>

      <p className="lesson-description">{lesson.description}</p>

      {lesson.status === "new" ? (
        <button
          className="lesson-btn start"
          onClick={() => onAction(lesson)}
        >
          Start Lesson
        </button>
      ) : (
        <button
          className="lesson-btn summary"
          onClick={() => onAction(lesson)}
        >
          View Summary
        </button>
      )}
    </div>
  );
}

export default LessonCard;