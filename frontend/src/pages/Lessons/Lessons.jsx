import React, { useState, useMemo } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Toolbar from "../../components/reusable/Toolbar/Toolbar";
import LessonCard from "../../components/reusable/lessonCard/LessonCard";
import Pagination from "../../components/reusable/pagination/pagination";
import Filter from "../../components/reusable/filter/Filter";
import { sampleLessons } from "../../data/lessons";
import "./Lessons.css";

export default function Lessons() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showFilter, setShowFilter] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState([]); // الحالة الأساسية
  const [order, setOrder] = useState("asc");

  // حالات مؤقتة للديالوج
  const [tempSelectedLesson, setTempSelectedLesson] = useState([]);
  const [tempOrder, setTempOrder] = useState("asc");

  // ===== بيانات الدروس
  const lessons = useMemo(
    () =>
      Object.values(sampleLessons).map((lesson, idx) => ({
        id: idx + 1,
        title: lesson.topic,
        description: lesson.iceBreaker.description,
        status: idx % 2 === 0 ? "completed" : "new",
      })),
    []
  );

  // ===== فلترة الدروس (باستخدام الحالات المؤقتة أثناء فتح المودال)
  const filteredLessons = useMemo(() => {
    let result = lessons.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase())
    );
    if (tempSelectedLesson.length > 0) {
      result = result.filter((l) => tempSelectedLesson.includes(l.title));
    }
    result.sort((a, b) =>
      tempOrder === "desc" ? b.id - a.id : a.id - b.id
    );
    return result;
  }, [lessons, search, tempSelectedLesson, tempOrder]);

  // فتح الفلتر
  const openFilter = () => {
    console.log("🟦 [Lessons] openFilter()");
    setTempSelectedLesson([...selectedLesson]);
    setTempOrder(order);
    setShowFilter(true);
  };

  // تطبيق التعديلات
  const applyFilter = () => {
    console.log("🟩 [Lessons] applyFilter()", {
      tempSelectedLesson,
      tempOrder,
    });
    setSelectedLesson([...tempSelectedLesson]);
    setOrder(tempOrder);
    setShowFilter(false);
  };

  // إلغاء والرجوع للوضع السابق
  const cancelFilter = () => {
    console.log("🟥 [Lessons] cancelFilter() → رجوع للقيم القديمة وإغلاق");
    setTempSelectedLesson([...selectedLesson]);
    setTempOrder(order);
    setShowFilter(false);
  };

  // مسح الاختيارات المؤقتة فقط (المودال يظل مفتوح)
  const clearFilter = () => {
    console.log("🧹 [Lessons] clearFilter() → تفريغ المؤقت");
    setTempSelectedLesson([]);
    // ما بنسكّر المودال
  };

  const filterSections = [
    {
      title: "By Lesson",
      options: lessons.slice(0, 5).map((l) => ({
        label: l.title,
        active: tempSelectedLesson.includes(l.title),
        onClick: () => {
          setTempSelectedLesson((prev) =>
            prev.includes(l.title)
              ? prev.filter((item) => item !== l.title)
              : [...prev, l.title]
          );
          console.log("🏷️ [Lessons] toggle lesson chip:", l.title);
        },
      })),
    },
    {
      title: "Alphabetical Order",
      options: [
        {
          label: "Ascending A–Z",
          icon: "asc",
          active: tempOrder === "asc",
          onClick: () => {
            console.log("🔤 [Lessons] order → asc");
            setTempOrder("asc");
          },
        },
        {
          label: "Descending Z–A",
          icon: "desc",
          active: tempOrder === "desc",
          onClick: () => {
            console.log("🔤 [Lessons] order → desc");
            setTempOrder("desc");
          },
        },
      ],
    },
  ];

  return (
    <div className="lessons-page">
      <Sidebar />
      <div className="lessons-content">
        <Toolbar
          searchValue={search}
          onSearchChange={setSearch}
          onFilterClick={openFilter}
        />

        {showFilter && (
          <Filter
            title="Filter Lessons"
            sections={filterSections}
            onClear={clearFilter}
            onCancel={cancelFilter}
            onDone={applyFilter}
          />
        )}

        <div className="lessons-grid">
          {filteredLessons.length > 0 ? (
            filteredLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onAction={() => console.log("▶️ Clicked:", lesson)}
              />
            ))
          ) : (
            <p className="no-lessons">⚠️ No lessons found.</p>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={10}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}