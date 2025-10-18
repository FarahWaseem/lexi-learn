import React from "react";
import "./Toolbar.css";

function Toolbar({ searchValue, onSearchChange, onFilterClick }) {
  return (
    <div className="toolbar">
      <div className="search-container">
        <img
          src="/src/assets/icons/search-normal.svg"
          alt="search"
          className="icon"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search about What You Want..."
        />
      </div>

      <button className="filter-btn" onClick={onFilterClick}>
        <img src="/src/assets/icons/Sort.svg" alt="filter" className="icon" />
        Filter
      </button>
    </div>
  );
}

export default Toolbar;