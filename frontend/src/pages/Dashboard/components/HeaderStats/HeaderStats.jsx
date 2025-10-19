import React from "react";
import "./HeaderStats.css";
import { dashboardMockData } from "../../../../data/dashboardMockData";
import zaytoonaWave from "../../../../assets/images/zaytoonaWave.png";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function HeaderStats() {
  const data = dashboardMockData;

  return (
    <div className="header-stats">
      {/* القسم اليسار - الترحيب والإحصائيات */}
      <div className="header-left">
        <h2 className="welcome-title">Welcome Back, {data.name}</h2>

        <div className="stats-row">
          <div className="stat-item">
            <strong>{data.newWords}</strong>
            <p>New Words</p>
          </div>
          <div className="divider" />
          <div className="stat-item">
            <strong>{data.completedLessons}</strong>
            <p>Completed Lessons</p>
          </div>
          <div className="divider" />
          <div className="stat-item">
            <strong>{data.totalTime}</strong>
            <p>Total Practice Time</p>
          </div>
        </div>
      </div>

      {/* القسم اليمين - الصورة و الهدف */}
      <div className="header-right">
        <img src={zaytoonaWave} alt="Zaytoona waving" className="mascot" />
        <div className="goal-progress">
          <CircularProgressbar
            value={data.goalProgress}
            text={`${data.goalProgress}%`}
            styles={buildStyles({
              pathColor: "var(--color-green)",
              textColor: "var(--color-green)",
              trailColor: "var(--color-green-shade)",
            })}
          />
          <p className="goal-text">of your Goal</p>
        </div>
      </div>
    </div>
  );
}