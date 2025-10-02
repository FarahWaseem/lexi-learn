import React from "react";
import "./SearchBar.css";

function SearchBar({ value, onChange }) {
  return (
    <div className="search-container">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search about your Lesson..."
      />
    </div>
  );
}

export default SearchBar;