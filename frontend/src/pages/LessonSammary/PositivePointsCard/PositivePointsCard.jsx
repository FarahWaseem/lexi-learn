import React from "react";
import "./PositivePointsCard.css";
import zaytoonaReminder from "../../../assets/images/zaytoonaReminder.png";

export default function PositivePointsCard() {
  return (
    <div className="practice-reminder-card">
      <div className="reminder-content">
        <div className="reminder-header">
          <img
            src={zaytoonaReminder}
            alt="Zaytoona Reminder"
            className="reminder-icon"
          />
          <div className="reminder-text">
            <h4>Positive Points</h4>
          </div>
        </div>
        <div className="reminder-text">
          <p>
            Don’t forget to practice today! A few minutes can make a big
            difference Don’t forget to practice today! A few minutes can make a big
            difference Don’t forget to practice today! A few minutes can make a big
            difference
          </p>
        </div>
      </div>
    </div>
  );
}
