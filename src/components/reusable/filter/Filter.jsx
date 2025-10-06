import React from "react";
import Button from "../Button/Button";
import "./Filter.css";

export default function Filter({ title, sections, onClose, onDone }) {
  return (
    <div className="filter-overlay">
      <div className="filter-modal">
        {/* Header */}
        <div className="filter-header">
          <h3 className="filter-title">{title}</h3>
          <button className="clear-btn" onClick={onClose}>
            Clear all
          </button>
        </div>

        {/* Body */}
        <div className="filter-body">
          {sections.map((section, idx) => (
            <div key={idx} className="filter-section">
              <h4 className="section-title">{section.title}</h4>
              <div className="chip-group">
                {section.options.map((option, i) => (
                  <div
                    key={i}
                    className={`filter-chip ${option.active ? "active" : ""}`}
                    onClick={option.onClick}
                  >
                    {/* Sorting icons */}
                    {option.icon === "asc" && (
                      <img
                        src="/src/assets/icons/SortFromBottomToTop.svg"
                        alt="Ascending"
                        className="chip-icon"
                      />
                    )}
                    {option.icon === "desc" && (
                      <img
                        src="/src/assets/icons/SortFromTopToBottom.svg"
                        alt="Descending"
                        className="chip-icon"
                      />
                    )}
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="filter-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}