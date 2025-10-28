// /src/pages/lesson/Lesson.jsx — يستخدم /api/my/topics مع كاش تلقائي للأوفلاين + فولباك لفتح السمّري
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

// ✅ أيقونات بالاستيراد (تصير شغّالة في build + PWA)
import iconSearch from "../../assets/icons/search-normal.svg";
import iconSort from "../../assets/icons/Sort.svg";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:3000";
const TOPICS_CACHE_KEY = "topics_cache_v1";

function Lessons() {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]); // {id,title,description,unlocked,completed,summarySessionId}
  const [online, setOnline] = useState(navigator.onLine);

  const pageSize = 6;

  // راقبي حالة الاتصال
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // تحميل قائمة الدروس (أونلاين أولًا + تخزين محلي، وإلا كاش محلي)
  useEffect(() => {
    let abort = false;

    const normalize = (arr = []) =>
      arr.map((d) => {
        const day = Number(d.day);
        const completed = Boolean(d.is_completed) || isCompletedLocal(day);
        return {
          id: day,
          title: d.topic,
          description: `Level ${d.cefr} • 6 questions`,
          unlocked: isUnlocked(day),
          completed,
          summarySessionId: d.session_id || getSummarySessionId(day) || null,
        };
      });

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // لو أوفلاين: جرّبي الكاش المحلي مباشرة
        if (!online) {
          const cachedRaw = localStorage.getItem(TOPICS_CACHE_KEY);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            const lessons = normalize(cached.items || cached || []);
            if (!abort) setItems(lessons);
            return;
          }
          // ما في كاش
          throw new Error("offline-no-cache");
        }

        // أونلاين: جيبي من السيرفر
        const token = await getToken();
        const res = await fetch(`${API_BASE}/api/my/topics`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (abort) return;

        const lessons = normalize(data.items || []);

        // خزّن نسخة محلية للأوفلاين (تلقائيًا)
        try {
          localStorage.setItem(
            TOPICS_CACHE_KEY,
            JSON.stringify({ items: data.items || [], savedAt: Date.now() })
          );
        } catch {}

        setItems(lessons);
      } catch (e) {
        // محاولة أخيرة: لو فشل الفetch، جرّبي الكاش المحلي
        const cachedRaw = localStorage.getItem(TOPICS_CACHE_KEY);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            const lessons = normalize(cached.items || cached || []);
            if (!abort) {
              setItems(lessons);
              setErr(""); // لا تعرضي خطأ طالما في بيانات
            }
          } catch {
            if (!abort) setErr(e?.message || "Failed to load lessons");
          }
        } else {
          if (!abort) {
            setErr(
              e?.message === "offline-no-cache"
                ? "أنتِ أوفلاين ولا توجد نسخة محفوظة بعد. افتحي هذه الصفحة وأنتِ أونلاين مرة واحدة ليتم حفظها للعمل أوفلاين."
                : e?.message || "Failed to load lessons"
            );
          }
        }
      } finally {
        if (!abort) setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [getToken, online]);

  // فلترة
  const filtered = useMemo(() => {
    return items.filter((l) => (l.title || "").toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  // ✅ عدد الصفحات مبني فقط على نتيجة الفلترة
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // ✅ لو تغيّر عدد النتائج، نضمن عدم بقاء currentPage خارج المدى
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // تقطيع للصفحة الحالية
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filtered.slice(start, end);

  // ⬇️ فتح السمّري
  async function onClickCard(lesson) {
    if (lesson.completed) {
      if (lesson.summarySessionId) {
        navigate(`/summary/${lesson.summarySessionId}`);
        return;
      }

      // لو أوفلاين ومش لاقيين sessionId، لا تحاولي الشبكة
      if (!online) {
        alert("لا توجد جلسة محفوظة محليًا لهذا اليوم بعد. افتحي الملخّص مرة وأنتِ أونلاين ليُحفظ تلقائيًا للأوفلاين.");
        return;
      }

      // فولباك أخير من السيرفر لليوم الحالي
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
            <img src={iconSearch} alt="search" className="icon" />
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
            <img src={iconSort} alt="filter" className="icon" />
            Filter
          </button>
        </div>


        {loading ? (
          <p>⏳ Loading lessons…</p>
        ) : err ? (
          <div style={{ padding: 12 }}>
            <p>❌ Error: {err}</p>
            {!online && (
              <p style={{ opacity: 0.8 }}>
                جرّبي تفعّلي الإنترنت مرة واحدة عشان نخزّن القائمة تلقائيًا للأوفلاين.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="lessons-grid">
              {pageItems.length > 0 ? (
                pageItems.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="lesson-card"
                    onClick={() => onClickCard(lesson)}
                  >
                    <div className="lesson-card__head">Lesson {lesson.id}</div>
                    <h3 className="lesson-card__title">{lesson.title}</h3>
                    <p className="lesson-card__desc">{lesson.description}</p>

                    <div className="lesson-card__actions">
                      {lesson.completed ? (
                        <button
                          className="btn btn-dark"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClickCard(lesson);
                          }}
                        >
                          View Summary
                        </button>
                      ) : lesson.unlocked ? (
                        <button
                          className="btn btn-green"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClickCard(lesson);
                          }}
                        >
                          Start Lesson
                        </button>
                      ) : (
                        <button className="btn btn-locked" disabled>
                          🔒 Locked
                        </button>
                      )}
                    </div>
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
