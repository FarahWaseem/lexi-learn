import React, { useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import SearchBar from "../../components/reusable/searchBar/SearchBar";
import LessonCard from "../../components/reusable/lessonCard/LessonCard";
import Pagination from "../../components/reusable/pagination/pagination";
import { sampleLessons } from "../../data/lessons";
import "./Lesson.css";

function Lessons() {
  console.log("✅ Lessons component rendered");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const lessons = Object.values(sampleLessons).map((l, idx) => ({
    id: idx + 1,
    title: l.topic,
    description: l.iceBreaker.description,
    status: idx % 2 === 0 ? "completed" : "new",
  }));

  console.log("📚 Lessons data:", lessons);

  const filtered = lessons.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="lessons-page">
      <Sidebar />

      <div className="lessons-content">
        <div className="toolbar">
          <div className="search-container">
            <img
              src="/src/assets/icons/search-normal.svg"
              alt="search"
              className="icon"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search about your Lesson..."
            />
          </div>

          <button className="filter-btn">
            <img
              src="/src/assets/icons/Sort.svg"
              alt="filter"
              className="icon"
            />
            Filter
          </button>
        </div>
        
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
          onPageChange={(page) => {
            console.log("📄 Page changed:", page);
            setCurrentPage(page);
          }}
        />
      </div>
    </div>
  );
}

export default Lessons;