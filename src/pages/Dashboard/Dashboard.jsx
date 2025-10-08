import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import FireForStreak from "../../assets/icons/fire.svg";
import zaytoonaWave from "../../assets/images/zaytoonaWave.png";
import zaytoonaReminder from "../../assets/images/zaytoonaReminder.png";
import zaytoonaReadingBook from "../../assets/images/zaytoonaReadingBook.png";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function Dashboard() {
  const [userData, setUserData] = useState({
    name: "Ali",
    newWords: 0,
    completedLessons: 0,
    totalTime: 0,
    goalProgress: 0,
    streakDays: 0,
    lastVocabs: [],
    recentLessons: [],
    hasData: false,
  });

  useEffect(() => {
    setTimeout(() => {
      setUserData({
        name: "Ali",
        newWords: 50,
        completedLessons: 4,
        totalTime: 100,
        goalProgress: 30,
        streakDays: 3,
        lastVocabs: ["always", "hobby", "introduce"],
        recentLessons: [
          { id: 3, title: "Lesson 3: Greetings", desc: "Learn how to greet others." },
          { id: 2, title: "Lesson 2: Daily Routine", desc: "Talk about your day." },
          { id: 1, title: "Lesson 1: In School", desc: "Describe your classroom." },
        ],
        hasData: true,
      });
    }, 800);
  }, []);

  const isEmpty = !userData.hasData;

  return (
    <div className="dashboard">
      <section className="top-section">
        <div className="welcome-card card">
          <div className="welcome-text">
            <h2 className="heading">Welcome Back, {userData.name}</h2>
            <div className="stats">
              <div className="stat">
                <strong className="stat-number">{userData.newWords}</strong>
                <span className="stat-label">New Words</span>
              </div>
              <div className="divider"></div>
              <div className="stat">
                <strong className="stat-number">{userData.completedLessons}</strong>
                <span className="stat-label">Completed Lessons</span>
              </div>
              <div className="divider"></div>
              <div className="stat">
                <strong className="stat-number">
                  {Math.floor(userData.totalTime / 60)}hr {userData.totalTime % 60}m
                </strong>
                <span className="stat-label">Total Practice Time</span>
              </div>
            </div>
          </div>
          <img src={zaytoonaWave} alt="Zaytoona waving" className="mascot" />
        </div>

        <div className="goal-card card">
          <div className="progress">
            <CircularProgressbar
              value={userData.goalProgress}
              text={`${userData.goalProgress}%`}
              styles={buildStyles({
                pathColor: "var(--color-green)",
                textColor: "var(--color-green)",
                trailColor: "var(--color-green-shade)",
              })}
            />
          </div>
          <p className="goal-text">of your Goal</p>
        </div>
      </section>

      <section className="middle-section">
        <div className="lesson-ready card-primary">
          <h3 className="heading-white">Ready for your next lesson</h3>
          <button className="start-btn">Start Next Lesson</button>
        </div>

        <div className="practice-reminder card">
          <img src={zaytoonaReminder} alt="Reminder" className="zaytoona-small" />
          <div>
            <h4 className="heading">Practice Reminder</h4>
            <p className="body-text">
              Don’t forget to practice today! A few minutes can make a big difference
            </p>
          </div>
        </div>

        <div className="streak-card card">
          <div className="streak-header">
            <img src={FireForStreak} alt="Fire icon" className="streak-icon" />
            <h4 className="heading">Streak</h4>
          </div>
          <h3 className="streak-days">
            {userData.streakDays} Days Streak
          </h3>
          <p className="streak-desc">
            {isEmpty
              ? "Start your first series! Complete one lesson each day!"
              : "You are Doing Great, keep it up!"}
          </p>
        </div>
      </section>

      <section className="bottom-section">
        <div className="recent-lessons card">
          <div className="section-header">
            <h3 className="heading">Recent lessons</h3>
            <a href="#" className="see-all">See All</a>
          </div>
          {isEmpty ? (
            <p className="empty-state">
              Your new words will appear here after the first lesson.
            </p>
          ) : (
            userData.recentLessons.map((lesson) => (
              <div key={lesson.id} className="lesson-item">
                <strong>{lesson.title}</strong>
                <p>{lesson.desc}</p>
              </div>
            ))
          )}
        </div>

        <div className="last-vocabs card">
          <h3 className="heading">Last Vocabs</h3>
          {isEmpty ? (
            <div className="empty-state">
              <img src={zaytoonaReadingBook} alt="Zaytoona reading" />
              <p>Your new words will appear here after the first lesson.</p>
            </div>
          ) : (
            <ul>
              {userData.lastVocabs.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="practice-history card">
          <div className="section-header">
            <h3 className="heading">Practice History</h3>
            <span className="week-label">this week</span>
          </div>
          {isEmpty ? (
            <p className="empty-state">Your learning progress will be shown here!</p>
          ) : (
            <p>[Graph Placeholder]</p>
          )}
        </div>
      </section>
    </div>
  );
}