import React from "react";
import "./RecentLessons.css";

export default function RecentLessons({ lessons = [] }) {
  const isEmpty = !lessons.length;

  return (
    <div className="recent-lessons card">
      <div className="section-header">
        <h3 className="heading">Recent Lessons</h3>
        <a href="#" className="see-all">See All</a>
      </div>

      {isEmpty ? (
        <p className="empty-state">
          Your new words will appear here after the first lesson.
        </p>
      ) : (
        <ul className="lessons-list">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="lesson-item">
              <strong>{lesson.title}</strong>
              <p>{lesson.desc}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
