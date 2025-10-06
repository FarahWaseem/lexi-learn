import React, { useState, useMemo } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Toolbar from "../../components/reusable/Toolbar/Toolbar";
import LessonCard from "../../components/reusable/lessonCard/LessonCard";
import Pagination from "../../components/reusable/pagination/pagination";
import Filter from "../../components/reusable/filter/Filter";
import { sampleLessons } from "../../data/lessons";
import "./Lessons.css";

export default function Lessons() {
  // ======== State Management ========
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState([]);
  const [order, setOrder] = useState("asc");

  // ======== Lessons Data ========
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

  // ======== Filtering Logic ========
  const filteredLessons = useMemo(() => {
    let result = lessons.filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedLesson) {
      result = result.filter((l) => l.title.includes(selectedLesson));
    }
    if (order === "desc") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [lessons, search, selectedLesson, order]);

  // ======== Filter Modal Config ========
  const filterSections = [
    {
      title: "By Lesson",
      options: lessons.slice(0, 5).map((l) => ({
        label: l.title,
        active: selectedLesson === l.title,
        onClick: () => setSelectedLesson(l.title),
      })),
    },
    {
      title: "Alphabetical Order",
      options: [
        {
          label: "Ascending A–Z",
          active: order === "asc",
          onClick: () => setOrder("asc"),
        },
        {
          label: "Descending Z–A",
          active: order === "desc",
          onClick: () => setOrder("desc"),
        },
      ],
    },
  ];

  // ======== Render ========
  return (
    <div className="lessons-page">
      <Sidebar />

      <div className="lessons-content">
        {/* Toolbar */}
        <Toolbar
          searchValue={search}
          onSearchChange={setSearch}
          onFilterClick={() => setShowFilter(true)}
        />
        {console.log("🎯 Lessons page rendered")}

{showFilter && (
  <>
    {console.log("✅ Filter component should render now")}
    <Filter
      title="Filter Lessons"
      sections={filterSections}
      onClose={() => setShowFilter(false)}
      onDone={() => setShowFilter(false)}
    />
  </>
)}


        {/* Lessons Grid */}
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

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={10}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}