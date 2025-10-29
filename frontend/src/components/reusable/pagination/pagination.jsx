import React from "react";
import "./Pagination.css";

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const VISIBLE = 5;

  // احسبي بداية ونهاية النافذة (5 أزرار دائماً قدر الإمكان)
  let start = currentPage - Math.floor(VISIBLE / 2); // current - 2
  start = Math.max(1, start);                        // لا تنزلي تحت 1
  if (start + VISIBLE - 1 > totalPages) {
    start = Math.max(1, totalPages - VISIBLE + 1);   // التصحيح عند النهاية
  }
  const end = Math.min(totalPages, start + VISIBLE - 1);

  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="pagination">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          className={page === currentPage ? "active" : ""}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
