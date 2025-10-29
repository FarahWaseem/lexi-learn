import React from "react";
import "./Dashboard.css";
import HeaderStats from "./components/HeaderStats";
import NextLessonCard from "./components/NextLessonCard";
import PracticeReminderCard from "./components/PracticeReminderCard";
import StreakCard from "./components/StreakCard";
import RecentLessons from "./components/RecentLessons";
import LastVocabs from "./components/LastVocabs";
import PracticeHistory from "./components/PracticeHistory";
import { dashboardMockData } from "../../data/dashboardMockData";

export default function Dashboard() {
  const { lessons, practiceHistory, user } = dashboardMockData;

  return (
    <div className="dashboard">
      <div className="dashboard__top">
        <HeaderStats />
      </div>

      <div className="dashboard__grid-flex">
        <div className="dashboard__col-left">
          <div className="dashboard__item next-lesson">
            <NextLessonCard />
          </div>

          <div className="dashboard__item recent-lessons">
            <RecentLessons lessons={lessons} />
          </div>
        </div>

        <div className="dashboard__col-right">
          <div className="dashboard__row-top-right">
            <div className="dashboard__item last-vocabs">
              <LastVocabs />
            </div>

            <div className="dashboard__col-right-mini">
              <div className="dashboard__item reminder">
                <PracticeReminderCard />
              </div>
              <div className="dashboard__item streak">
                <StreakCard streakDays={user.streakDays} />
              </div>
            </div>
          </div>

          <div className="dashboard__item history">
            <PracticeHistory data={practiceHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}