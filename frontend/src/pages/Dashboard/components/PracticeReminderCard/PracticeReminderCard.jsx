import React from "react";
import "./PracticeReminderCard.css";
import zaytoonaReminder from "../../../../assets/images/zaytoonaReminder.png";

export default function PracticeReminderCard() {
  return (
    <div className="practice-reminder-card">
      <img
        src={zaytoonaReminder}
        alt="Zaytoona Reminder"
        className="reminder-icon"
      />
      <div className="reminder-text">
        <h4>Practice Reminder</h4>
        <p>Don’t forget to practice today! A few minutes can make a big difference</p>
      </div>
    </div>
  );
}