// Lesson.jsx — يستخدم /api/my/topics ويدعم fallback محلي + خادم لفتح السمري بالـ sessionId
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Pagination from "../../components/reusable/pagination/pagination";
import {
  isUnlocked,
  isCompleted as isCompletedLocal,
  getSummarySessionId,
} from "../../utils/progress";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import "./Lesson.css";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:4000";

function Lessons() {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]); // {id,title,description,unlocked,completed,summarySessionId}
  const [total, setTotal] = useState(0);

  const pageSize = 6;

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const token = await getToken();
        // بإمكانك إضافة q/page/pageSize إذا كان الراوت يدعمهم
        const res = await fetch(`${API_BASE}/api/my/topics`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (abort) return;

        const lessons = (data.items || []).map((d) => {
          const day = Number(d.day);
          // ✅ اعتبره مكتمل إذا السيرفر قال أو التخزين المحلي قال
          const completed = Boolean(d.is_completed) || isCompletedLocal(day);

          return {
            id: day,
            title: d.topic,
            description: `Level ${d.cefr} • 6 questions`,
            unlocked: isUnlocked(day),
            completed,
            // ✅ sessionId من السيرفر أولاً، وإلا من التخزين المحلي
            summarySessionId: d.session_id || getSummarySessionId(day) || null,
          };
        });

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
  }, [getToken]);

  // فلترة + تقطيع للصفحة الحالية
  const filtered = useMemo(() => {
    return items.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil((total || filtered.length) / pageSize));
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ⬇️ فتح السمري بنفس منطق SimpleLesson (sessionId حقيقي) مع فولباك إضافي
  async function onClickCard(lesson) {
    if (lesson.completed) {
      if (lesson.summarySessionId) {
        navigate(`/summary/${lesson.summarySessionId}`);
        return;
      }

      // 🔁 فولباك أخير من السيرفر لليوم الحالي (لدروس قديمة قبل التخزين المحلي)
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/api/sessions/last?day=${lesson.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.sessionId) {
            navigate(`/summary/${json.sessionId}`);
            return;
          }
        } else if (res.status !== 404) {
          alert(`HTTP ${res.status} أثناء جلب الجلسة.`);
          return;
        }
      } catch {
        // ignore
      }

      alert("لا توجد جلسة محفوظة لهذا اليوم. افتحي الدرس للحظات ثم اغلقيه لإنشاء ملخص.");
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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
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
