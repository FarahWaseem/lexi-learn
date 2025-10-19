// Lesson.jsx — unified version (fetches from DB)
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Pagination from "../../components/reusable/pagination/pagination";
import { isUnlocked, isCompleted } from "../../utils/progress";
import { useNavigate } from "react-router-dom";
import "./Lesson.css";

// ✅ استخدمي نفس المفتاح الموجود في .env
const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:4000";

function Lessons() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);   // بيانات الدروس من الـ API
  const [total, setTotal] = useState(0);

  const pageSize = 6;

  // 🔹 تحميل الدروس من قاعدة البيانات
  useEffect(() => {
    let abort = false;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const url = new URL(`${API_BASE}/api/topics`);
        url.searchParams.set("q", search);
        url.searchParams.set("page", String(currentPage));
        url.searchParams.set("pageSize", String(pageSize));

        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (abort) return;

        const lessons = (data.items || []).map((d) => ({
          id: d.day,
          title: d.topic,
          description: `Level ${d.cefr} • 6 questions`,
          unlocked: isUnlocked(d.day),
          completed: isCompleted(d.day),
        }));

        setItems(lessons);
        setTotal(data.total || lessons.length);
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to load lessons");
      } finally {
        if (!abort) setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [search, currentPage]);

  // فلترة إضافية في الكلاينت (اختياري)
  const filtered = useMemo(() => {
    return items.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil((total || filtered.length) / pageSize));
  const pageItems = filtered;

  // التنقل عند الضغط على الكارت
  function onClickCard(lesson) {
    if (lesson.completed) {
      navigate(`/summary/${lesson.id}`);
    } else if (lesson.unlocked) {
      navigate(`/lesson1?day=${lesson.id}`);
    }
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
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search about your Lesson..."
            />
          </div>

          <button className="filter-btn">
            <img src="/src/assets/icons/Sort.svg" alt="filter" className="icon" />
            Filter
          </button>
        </div>

        {loading ? (
          <p>⏳ Loading lessons…</p>
        ) : err ? (
          <p>❌ Error: {err}</p>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

export default Lessons;
