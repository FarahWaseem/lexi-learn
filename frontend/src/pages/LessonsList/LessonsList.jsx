import React from "react";
import LessonCard from "../../components/reusable/lessonCard/LessonCard";
import Pagination from "../../components/reusable/pagination/pagination";
import Toolbar from "../../components/reusable/Toolbar/Toolbar";
import Filter from "../../components/reusable/filter/Filter";
import useLessonsController from "./useLessonsController";
import "./LessonsList.css";

export default function LessonsList(online) {
  const {
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
  } = useLessonsController(online);

  const showFilter = false; 

  const filterSections = [
    {
      title: "By Lesson",
      options: pageItems.slice(0, 5).map((l) => ({
        label: l.title,
        active: tempFilter.lessons.includes(l.title),
        onClick: () =>
          setTempFilter((prev) => ({
            ...prev,
            lessons: prev.lessons.includes(l.title)
              ? prev.lessons.filter((item) => item !== l.title)
              : [...prev.lessons, l.title],
          })),
      })),
    },
    {
      title: "Order",
      options: [
        {
          label: "Ascending A–Z",
          active: tempFilter.order === "asc",
          onClick: () => setTempFilter((p) => ({ ...p, order: "asc" })),
        },
        {
          label: "Descending Z–A",
          active: tempFilter.order === "desc",
          onClick: () => setTempFilter((p) => ({ ...p, order: "desc" })),
        },
      ],
    },
  ];

  return (
    <div className="lessons-page">
      <div className="lessons-content">
        <div className="lessons-inner">

          <Toolbar
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setCurrentPage(1);
            }}
            onFilterClick={() => console.log("Filter Coming Soon ✅")}
          />

          {showFilter && (
            <Filter
              title="Filter Lessons"
              sections={filterSections}
              onCancel={() => console.log("Cancel Filter ❌")}
              onDone={() => console.log("Apply Filter ✅")}
            />
          )}

          {loading ? (
            <p>⏳ Loading lessons…</p>
          ) : err ? (
            <div style={{ padding: "12px" }}>
              <p>❌ {err}</p>
            </div>
          ) : (
            <>
              <div className="lessons-grid-wrapper">
                <div className="lessons-grid">
                  {pageItems.length > 0 ? (
                    pageItems.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onAction={onAction}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
