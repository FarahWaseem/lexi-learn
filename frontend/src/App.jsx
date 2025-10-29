// frontend/src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/clerk-react";

import Sidebar from "./components/sidebar/Sidebar";
import Header from "./components/header/Header";

// من شغل الفريق
import Dashboard from "./pages/Dashboard";
// ❌ حذف Lessons.jsx
import VocabsNotebook from "./pages/VocabsNotebook/VocabsNotebook";

// من شغلك
import Lesson from "./pages/Lessons/Lesson";
import SimpleLesson from "./pages/Lessons/SimpleLesson";
import LessonSammary from "./pages/LessonSammary/lessonSammary";
import Summary from "./pages/Summary";

import NoInternet from "./components/reusable/NoInternet/NoInternet";
import { useTheme } from "./context/ThemeContext";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function App() {
  const { darkMode } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();
  const onSummary = location.pathname.startsWith("/summary/");

  // مراقبة الاتصال
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
    if (navigator.onLine) setIsOnline(true);
    else window.location.reload();
  };

  if (!isOnline) return <NoInternet onRetry={handleRetry} />;

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      <SignedIn>
        {!onSummary && <AutoUpsert />}
        <Sidebar />
        <div className="content-container">
          <Header />
          <main className="main-content">
            <Routes>
              {/* من شغل الفريق */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* ✅ لما تضغطي Lesson من السايدبار، يفتح Lesson.jsx */}
              <Route path="/lessons" element={<Lesson />} />
              
              <Route path="/vocabsNotebook" element={<VocabsNotebook />} />

              {/* صفحاتك الخاصة */}
              <Route path="/lesson" element={<Lesson />} />
              <Route path="/lesson1" element={<SimpleLesson />} />
              <Route path="/lessonSammary" element={<LessonSammary />} />
              <Route path="/summary/:id" element={<Summary />} />

              {/* أي مسار غير معروف */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </SignedIn>

      <SignedOut>
        <Routes>
          <Route path="/login" element={<RedirectToSignIn />} />
          <Route path="/signup" element={<RedirectToSignIn />} />
          <Route path="/login/sso-callback" element={<div />} />
          <Route path="/sso-callback" element={<div />} />
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </SignedOut>
    </div>
  );
}

/** AutoUpsert — شغلك */
function AutoUpsert() {
  const { isSignedIn, getToken } = useAuth();
  const calledRef = useRef(false);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;
    return () => {
      abortRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || calledRef.current) return;
    calledRef.current = true;

    (async () => {
      const maxAttempts = 3;
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let attempt = 0;
      let lastError = null;

      while (attempt < maxAttempts && !abortRef.current) {
        attempt += 1;
        try {
          const token = await getToken(
            attempt === 1 ? undefined : { skipCache: true }
          );
          if (!token) throw new Error("Missing Clerk token");

          const res = await fetch(`${API_BASE}/api/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const text = await res.text();
          let payload;
          try {
            payload = JSON.parse(text);
          } catch {
            payload = text;
          }

          if (!res.ok)
            throw new Error(
              `HTTP ${res.status} ${res.statusText} — ${payload?.error || ""}`.trim()
            );

          console.log("✅ [AutoUpsert] /api/me ok:", payload);
          return;
        } catch (e) {
          lastError = e;
          console.warn(`⚠️ [AutoUpsert] attempt ${attempt} failed:`, e.message);
          if (attempt >= maxAttempts) break;
          await sleep(attempt === 1 ? 200 : 600);
        }
      }

      if (!abortRef.current && lastError)
        console.error("❌ [AutoUpsert] giving up:", lastError.message);
    })();
  }, [isSignedIn, getToken]);

  return null;
}

export default App;
