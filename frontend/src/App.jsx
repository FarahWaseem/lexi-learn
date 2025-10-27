import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/sidebar/Sidebar";
import Header from "./components/header/Header";
import Lessons from "./pages/Lessons/Lessons";
import Dashboard from "./pages/Dashboard";
import VocabsNotebook from "./pages/VocabsNotebook/VocabsNotebook";
import LessonSammary from "./pages/LessonSammary/lessonSammary";
import NoInternet from "./components/reusable/NoInternet/NoInternet";
import { useTheme } from "./context/ThemeContext";
import "./App.css";

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ✅ التعديل هنا — نستدعي darkMode بدل theme
  const { darkMode } = useTheme();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setIsOnline(true);
    } else {
      window.location.reload();
    }
  };

  if (!isOnline) {
    return <NoInternet onRetry={handleRetry} />;
  }

  // ✅ هنا كمان نغير الشرط داخل الكلاس
  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      <Sidebar />
      <div className="content-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/vocabsNotebook" element={<VocabsNotebook />} />
            <Route path="/lessonSammary" element={<LessonSammary />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;