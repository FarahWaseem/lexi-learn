import React from "react";
import "./HeaderStats.css";
import zaytoonaWave from "../../../../assets/images/zaytoonaWave.png";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function HeaderStats({ user, stats }) {
  // Fallback values if data is not available
  const userName = user?.name || user?.firstName || "Student";
  const newWords = stats?.newWords || 0;
  const completedLessons = stats?.completedLessons || 0;
  const totalTime = stats?.totalTime || 0;
  const goalProgress = stats?.goalProgress || 0;

  return (
    <div className="header-stats">
      <div className="header-card">
        <div className="header-info">
          <div className="welcome-title">Welcome Back, {userName}</div>
          <div className="stats-row">
            <div className="stat-item">
              <strong>{newWords}</strong>
              <p>New Words</p>
            </div>
            <div className="divider" />
            <div className="stat-item">
              <strong>{completedLessons}</strong>
              <p>Completed Lessons</p>
            </div>
            <div className="divider" />
            <div className="stat-item">
              <strong>{totalTime} min</strong>
              <p>Total Practice Time</p>
            </div>
          </div>
        </div>
        <img
          src={zaytoonaWave}
          alt="Zaytoona waving"
          style={{ width: 158, height: 172 }}
        />
      </div>

      <div className="goal-card">
        <div className="goal-progress">
          <CircularProgressbar
            value={goalProgress}
            text={`${goalProgress}%`}
            styles={buildStyles({
              pathColor: "#007A3D",
              textColor: "#007A3D",
              trailColor: "rgba(0, 122, 61, 0.10)",
            })}
          />
        </div>
        <div className="goal-text">of your Goal</div>
      </div>
    </div>
  );
}