import { useEffect, useMemo, useState } from "react";
import {
  isUnlocked,
  isCompleted as isCompletedLocal,
  getSummarySessionId,
} from "../../utils/progress";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { API_BASE, TOPICS_CACHE_KEY, PAGE_SIZE } from "../../constants";

export default function useLessonsController(online) {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [tempFilter, setTempFilter] = useState({
    lessons: [],
    order: "asc",
  });

  useEffect(() => {
    let abort = false;
    const normalize = (arr) =>
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

        if (!online) {
          const cached = localStorage.getItem(TOPICS_CACHE_KEY);
          if (cached) {
            if (!abort) setItems(normalize(JSON.parse(cached).items));
            return;
          }
          throw new Error("offline-no-cache");
        }

        const token = await getToken();
        const res = await fetch(`${API_BASE}/api/my/topics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (abort) return;

        const normalized = normalize(data.items);
        setItems(normalized);
        localStorage.setItem(
          TOPICS_CACHE_KEY,
          JSON.stringify({ items: data.items })
        );
      } catch (e) {
        const cached = localStorage.getItem(TOPICS_CACHE_KEY);
        cached
          ? setItems(normalize(JSON.parse(cached).items))
          : setErr("⚠️ لازم تفتحي الدروس مرة أونلاين");
      } finally {
        !abort && setLoading(false);
      }
    })();

    return () => (abort = true);
  }, [online]);

  const filteredLessons = useMemo(() => {
    let res = items.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase())
    );

    if (tempFilter.lessons.length > 0)
      res = res.filter((l) => tempFilter.lessons.includes(l.title));

    if (tempFilter.order === "desc") res.sort((a, b) => b.id - a.id);
    else res.sort((a, b) => a.id - b.id);

    return res;
  }, [items, search, tempFilter]);

  const totalPages = Math.ceil(filteredLessons.length / PAGE_SIZE);
  const pageItems = filteredLessons.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function onAction(lesson) {
    if (lesson.completed && lesson.summarySessionId)
      navigate(`/summary/${lesson.summarySessionId}`);
    else if (lesson.unlocked)
      navigate(`/lesson/${lesson.id}`);
  }

  return {
    loading,
    err,
    pageItems,
    totalPages,
    currentPage,
    setCurrentPage,
    search,
    setSearch,
    tempFilter,
    setTempFilter,
    onAction,
  };
}
