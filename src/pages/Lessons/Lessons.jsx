import React, { useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Toolbar from "../../components/reusable/Toolbar/Toolbar";
import LessonCard from "../../components/reusable/lessonCard/LessonCard";
import Pagination from "../../components/reusable/pagination/pagination";
import { sampleLessons } from "../../data/lessons";
import "./Lessons.css";

export default function Lessons() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const lessons = Object.values(sampleLessons).map((l, idx) => ({
    id: idx + 1,
    title: l.topic,
    description: l.iceBreaker.description,
    status: idx % 2 === 0 ? "completed" : "new",
  }));

  const filtered = lessons.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="lessons-page">
      <Sidebar />

      <div className="lessons-content">
        <Toolbar
          searchValue={search}
          onSearchChange={setSearch}
          onFilterClick={() => console.log("Filter clicked!")}
        />

        <div className="lessons-grid">
          {filtered.length > 0 ? (
            filtered.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onAction={() => console.log("▶️ Clicked:", lesson)}
              />
            ))
          ) : (
            <p>⚠️ No lessons found.</p>
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
