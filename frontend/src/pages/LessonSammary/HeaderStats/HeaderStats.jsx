import React from "react";
import "./HeaderStats.css";
import { dashboardMockData } from "../../../data/dashboardMockData";
import zaytoonaWave from "../../../assets/images/zaytoonaWave.png";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function HeaderStats() {
  const { user, stats } = dashboardMockData;

  return (
    <div className="header-stats">
      <div className="header-card">
        <div className="header-info">
          <div className="welcome-title">Welcome Back, {user.name}</div>
          <div className="stats-row">
             <img
          src={zaytoonaWave}
          alt="Zaytoona waving"
          style={{ width: 158, height: 172 }}
        />
            <div className="stat-item">
              <strong>{stats.newWords}</strong>
              <p>New Words</p>
            </div>
            <div className="divider" />
            <div className="stat-item">
              <strong>{stats.completedLessons}</strong>
              <p>Completed Lessons</p>
            </div>
            <div className="divider" />
            <div className="stat-item">
              <strong>{stats.totalTime} min</strong>
              <p>Total Practice Time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="goal-card">
        <div className="goal-progress">
          <CircularProgressbar
            value={stats.goalProgress}
            text={`${stats.goalProgress}%`}
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