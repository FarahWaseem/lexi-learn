import React from "react";
import Button from "../Button/Button";
import SortAsc from "../../../assets/icons/SortFromBottomToTop.svg";
import SortDesc from "../../../assets/icons/SortFromTopToBottom.svg";
import "./Filter.css";

export default function Filter({ title, sections, onClear, onCancel, onDone }) {
  const handleClear = () => {
    console.log("🧹 [Filter] Clear all clicked");
    onClear?.();
  };

  const handleCancel = () => {
    console.log("🟥 [Filter] Cancel clicked");
    onCancel?.();
  };

  const handleDone = () => {
    console.log("🟩 [Filter] Done clicked");
    onDone?.();
  };

  return (
    <div className="filter-overlay">
      <div className="filter-modal">
        <div className="filter-header">
          <h3 className="filter-title">{title}</h3>
          <button className="clear-btn" onClick={handleClear} id="btn-clear">
            Clear all
          </button>
        </div>

        <div className="filter-body">
          {sections.map((section, idx) => (
            <div key={idx} className="filter-section">
              <h4 className="section-title">{section.title}</h4>

              <div className="chip-group">
                {section.options.map((option, i) => (
                  <div
                    key={i}
                    className={`filter-chip ${option.active ? "active" : ""}`}
                    onClick={() => {
                      console.log("🏷️ [Filter] chip clicked:", option.label);
                      option.onClick();
                    }}
                  >
                    {option.icon === "asc" && (
                      <img
                        src={SortAsc}
                        alt="Ascending"
                        className="chip-icon"
                      />
                    )}
                    {option.icon === "desc" && (
                      <img
                        src={SortDesc}
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

        <div className="filter-footer">
          <Button variant="secondary" onClick={handleCancel} id="btn-cancel">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDone} id="btn-done">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}