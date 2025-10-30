import React from "react";
import { useNavigate } from "react-router-dom";
import "./NextLessonCard.css";

export default function NextLessonCard({ nextLesson }) {
  const navigate = useNavigate();

  const handleStartLesson = () => {
    if (nextLesson) {
      // Navigate to lesson page with day number
      navigate(`/lesson/${nextLesson.dayNumber}`);
    }
  };

  // If no next lesson (all completed)
  if (!nextLesson) {
    return (
      <div className="next-lesson-card">
        <h3 className="lesson-title">🎉 Congratulations!</h3>
        <p style={{ 
          fontSize: '14px', 
          color: 'rgba(0, 0, 0, 0.6)',
          marginTop: '8px' 
        }}>
          You've completed all lessons!
        </p>
      </div>
    );
  }

  return (
    <div className="next-lesson-card">
      <h3 className="lesson-title">Ready for your next lesson</h3>
      {nextLesson.title && (
        <p style={{ 
          fontSize: '14px', 
          color: 'rgba(0, 0, 0, 0.6)',
          marginTop: '8px' 
        }}>
          Day {nextLesson.dayNumber}: {nextLesson.title}
        </p>
      )}
      <button className="start-btn" onClick={handleStartLesson}>
        Start Next Lesson
      </button>
    </div>
  );
}