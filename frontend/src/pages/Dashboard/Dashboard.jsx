import React from "react";
import "./Dashboard.css";

// 🧩 Components
import HeaderStats from "./components/HeaderStats";
import NextLessonCard from "./components/NextLessonCard";
import PracticeReminderCard from "./components/PracticeReminderCard";
import StreakCard from "./components/StreakCard";
import RecentLessons from "./components/RecentLessons";
import LastVocabs from "./components/LastVocabs";
import PracticeHistory from "./components/PracticeHistory";

export default function Dashboard() {
  const lessons = [
    { id: 1, title: "Lesson 1", desc: "Basic greetings and phrases" },
    { id: 2, title: "Lesson 2", desc: "Introducing yourself" },
  ];

  const vocabs = ["hello", "good morning", "how are you", "thank you"];

  return (
    <div className="dashboard">
      {/* 🟢 Top Section */}
      <div className="dashboard__top">
        <HeaderStats />
      </div>

      {/* 🟡 Middle Section */}
      <div className="dashboard__middle">
        <NextLessonCard />
        <PracticeReminderCard />
        <StreakCard streakDays={3} />
      </div>

      {/* 🔵 Bottom Section */}
      <div className="dashboard__bottom">
        <RecentLessons lessons={lessons} />
        <LastVocabs vocabs={vocabs} />
        <PracticeHistory />
      </div>
    </div>
  );
}