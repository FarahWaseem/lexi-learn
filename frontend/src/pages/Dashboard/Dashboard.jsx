import React from "react";
import "./Dashboard.css";
import HeaderStats from "./components/HeaderStats";
import NextLessonCard from "./components/NextLessonCard";
import PracticeReminderCard from "./components/PracticeReminderCard";
import StreakCard from "./components/StreakCard";
import RecentLessons from "./components/RecentLessons";
import LastVocabs from "./components/LastVocabs";
import PracticeHistory from "./components/PracticeHistory";
import { useDashboard } from "../../hooks/useDashboard";

export default function Dashboard() {
  const { data, loading, error, refetch } = useDashboard();

  // Loading state
  if (loading) {
    return (
      <div className="dashboard">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          fontSize: '18px',
          color: '#6B7280'
        }}>
          Loading your dashboard...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          gap: '16px'
        }}>
          <div style={{ fontSize: '18px', color: '#EF4444' }}>
            Failed to load dashboard
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            {error}
          </div>
          <button 
            onClick={refetch}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007A3D',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data
  if (!data) {
    return (
      <div className="dashboard">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          fontSize: '18px',
          color: '#6B7280'
        }}>
          No dashboard data available
        </div>
      </div>
    );
  }

  // Extract data
  const { user, stats, lessons, practiceHistory, vocabs, nextLesson } = data;

  return (
    <div className="dashboard">
      <div className="dashboard__top">
        <HeaderStats user={user} stats={stats} />
      </div>

      <div className="dashboard__grid-flex">
        <div className="dashboard__col-left">
          <div className="dashboard__item next-lesson">
            <NextLessonCard nextLesson={nextLesson} />
          </div>

          <div className="dashboard__item recent-lessons">
            <RecentLessons lessons={lessons || []} />
          </div>
        </div>

        <div className="dashboard__col-right">
          <div className="dashboard__row-top-right">
            <div className="dashboard__item last-vocabs">
              <LastVocabs vocabs={vocabs || []} />
            </div>

            <div className="dashboard__col-right-mini">
              <div className="dashboard__item reminder">
                <PracticeReminderCard />
              </div>
              <div className="dashboard__item streak">
                <StreakCard streakDays={user?.streakDays || 0} />
              </div>
            </div>
          </div>

          <div className="dashboard__item history">
            <PracticeHistory data={practiceHistory || []} />
          </div>
        </div>
      </div>
    </div>
  );
}