import React from "react";
import "./StreakCard.css";
import FireForStreak from "../../../../assets/icons/fire.svg";

export default function StreakCard({ streakDays = 3 }) {
  return (
    <div className="streak-card">
      <div className="streak-header">
        <img src={FireForStreak} alt="Fire Icon" className="streak-icon" />
        <h4>Streak</h4>
      </div>
      <h3 className="streak-days">{streakDays} Days Streak</h3>
      <p className="streak-desc">
        {streakDays === 0
          ? "Start your first series! Complete one lesson each day!"
          : "You are doing great, keep it up!"}
      </p>
    </div>
  );
}
