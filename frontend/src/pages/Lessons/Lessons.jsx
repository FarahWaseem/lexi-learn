import React, { useState, useMemo } from "react";
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
  const [selectedLesson, setSelectedLesson] = useState([]);
  const [order, setOrder] = useState("asc");

  const [tempSelectedLesson, setTempSelectedLesson] = useState([]);
  const [tempOrder, setTempOrder] = useState("asc");

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

  const filteredLessons = useMemo(() => {
    let result = lessons.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase())
    );
    if (tempSelectedLesson.length > 0) {
      result = result.filter((l) => tempSelectedLesson.includes(l.title));
    }
    result.sort((a, b) => (tempOrder === "desc" ? b.id - a.id : a.id - b.id));
    return result;
  }, [lessons, search, tempSelectedLesson, tempOrder]);

  const openFilter = () => {
    setTempSelectedLesson([...selectedLesson]);
    setTempOrder(order);
    setShowFilter(true);
  };

  const applyFilter = () => {
    setSelectedLesson([...tempSelectedLesson]);
    setOrder(tempOrder);
    setShowFilter(false);
    setCurrentPage(1);
  };

  const cancelFilter = () => {
    setTempSelectedLesson([...selectedLesson]);
    setTempOrder(order);
    setShowFilter(false);
  };

  const clearFilter = () => {
    setTempSelectedLesson([]);
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
          onClick: () => setTempOrder("asc"),
        },
        {
          label: "Descending Z–A",
          icon: "desc",
          active: tempOrder === "desc",
          onClick: () => setTempOrder("desc"),
        },
      ],
    },
  ];

  const lessonsPerPage = 6;
  const totalPages = Math.ceil(filteredLessons.length / lessonsPerPage);
  const startIndex = (currentPage - 1) * lessonsPerPage;
  const currentLessons = filteredLessons.slice(
    startIndex,
    startIndex + lessonsPerPage
  );

  return (
    <div className="lessons-page">
      <div className="lessons-content">
        <div className="lessons-inner">
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
        <div class="lessons-grid-wrapper">
        <div className="lessons-grid">
          {currentLessons.length > 0 ? (
            currentLessons.map((lesson) => (
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
        </div>

        <div className="pagination-footer">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
