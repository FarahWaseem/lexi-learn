import React from "react";
import "./EmptyState.css";

export default function EmptyState({ image, title, message }) {
  return (
    <div className="empty-state">
      <img src={image} alt="" className="empty-img" />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}