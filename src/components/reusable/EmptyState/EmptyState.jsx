import React from "react";
import "./EmptyState.css";

export default function EmptyState({ image, title, message }) {
  return (
    <div className="empty-state">
      <img src={image} alt="Empty" className="empty-state-img" />
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
    </div>
  );
}