import React from "react";
import "./RecentLessons.css";

export default function RecentLessons({ lessons = [] }) {
  const isEmpty = !lessons.length;

  return (
    <div className="recent-lessons">
      <div className="recent-lessons__header">
        <h3 className="recent-lessons__title">Recent Lessons</h3>
        <a href="#" className="recent-lessons__see-all">
          See All
        </a>
      </div>

      {isEmpty ? (
        <p className="recent-lessons__empty">
          Your new lessons will appear here after the first one.
        </p>
      ) : (
        <ul className="recent-lessons__list">
          {lessons.map((lesson, index) => (
            <React.Fragment key={lesson.id || index}>
              <li className="recent-lessons__item">
                <h4 className="recent-lessons__lesson-title">{lesson.title}</h4>
                <p className="recent-lessons__lesson-desc">{lesson.desc}</p>
              </li>
              {index < lessons.length - 1 && (
                <div className="recent-lessons__divider"></div>
              )}
            </React.Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
