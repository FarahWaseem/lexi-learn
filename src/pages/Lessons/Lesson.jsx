import React, { useMemo, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Pagination from "../../components/reusable/pagination/pagination";
import PLAN from "../../data/conversationPlan"; // ← الخطة 60 يوم
import { isUnlocked, isCompleted } from "../../utils/progress";
import { useNavigate } from "react-router-dom";
import "./Lesson.css";

function Lessons() {
  console.log("✅ Lessons component rendered");

  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // حضّر كروت من PLAN
  const lessons = useMemo(() => {
    return PLAN.map((d) => ({
      id: d.day,
      title: d.topic,
      description: `Level ${d.cefr} • 6 questions`,
      unlocked: isUnlocked(d.day),
      completed: isCompleted(d.day),
    }));
  }, []);

  const filtered = lessons.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  // باچينيشن بسيطة (اختياري): 6 كروت للصفحة
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function onClickCard(lesson) {
    if (lesson.completed) {
      // روح على السّمري
      navigate(`/summary/${lesson.id}`);
    } else if (lesson.unlocked) {
      // ابدأ الدرس
      navigate(`/lesson1?day=${lesson.id}`);
    }
    // لو Locked ما منعمل إشي
  }

  return (
    <div className="lessons-page">
      <Sidebar />

      <div className="lessons-content">
        <div className="toolbar">
          <div className="search-container">
            <img src="/src/assets/icons/search-normal.svg" alt="search" className="icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search about your Lesson..."
            />
          </div>

          <button className="filter-btn">
            <img src="/src/assets/icons/Sort.svg" alt="filter" className="icon" />
            Filter
          </button>
        </div>

        <div className="lessons-grid">
          {pageItems.length > 0 ? (
            pageItems.map((lesson) => (
              <div key={lesson.id} className="lesson-card">
                <div className="lesson-card__head">Lesson {lesson.id}</div>
                <h3 className="lesson-card__title">{lesson.title}</h3>
                <p className="lesson-card__desc">{lesson.description}</p>

                {lesson.completed ? (
                  <button className="btn btn-dark" onClick={() => onClickCard(lesson)}>
                    View Summary
                  </button>
                ) : lesson.unlocked ? (
                  <button className="btn btn-green" onClick={() => onClickCard(lesson)}>
                    Start Lesson
                  </button>
                ) : (
                  <button className="btn btn-locked" disabled>
                    🔒 Locked
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>⚠️ No lessons found.</p>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}

export default Lessons;
