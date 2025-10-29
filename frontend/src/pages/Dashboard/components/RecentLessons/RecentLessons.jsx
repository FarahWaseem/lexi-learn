import React from "react";
import { useNavigate } from "react-router-dom";
import "./RecentLessons.css";

export default function RecentLessons({ lessons = [] }) {
  const isEmpty = !lessons.length;
  const navigate = useNavigate();

  const handleSeeAll = (e) => {
    e.preventDefault();
    navigate("/lessons");
  };

  const handleLessonClick = (lessonId) => {
    navigate(`/lessonSammary?id=${lessonId}`); 
  };

  return (
    <div className="recent-lessons">
      <div className="recent-lessons__header">
        <h3 className="recent-lessons__title">Recent Lessons</h3>
        <button className="recent-lessons__see-all" onClick={handleSeeAll}>
          See All
        </button>
      </div>

      {isEmpty ? (
        <p className="recent-lessons__empty">
          Your new lessons will appear here after the first one.
        </p>
      ) : (
        <ul className="recent-lessons__list">
          {lessons.map((lesson, index) => (
            <React.Fragment key={lesson.id || index}>
              <li
                className="recent-lessons__item"
                onClick={() => handleLessonClick(lesson.id || index)}
              >
                <h4 className="recent-lessons__lesson-title">
                  {lesson.title}
                </h4>
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