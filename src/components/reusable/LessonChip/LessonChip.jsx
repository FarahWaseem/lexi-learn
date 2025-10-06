import React from "react";
import "./LessonChip.css";

function LessonChip({ text }) {
  return (
    <div className="lesson-chip">
      <span>{text}</span>
    </div>
  );
}

export default LessonChip;
