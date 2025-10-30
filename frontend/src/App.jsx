// frontend/src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/clerk-react";
import Sidebar from "./components/sidebar/Sidebar";
import Header from "./components/header/Header";
import NoInternet from "./components/reusable/NoInternet/NoInternet";
import Dashboard from "./pages/Dashboard";
import VocabsNotebook from "./pages/VocabsNotebook/VocabsNotebook";
import LessonsList from "./pages/LessonsList/LessonsList";
import Lesson from "./pages/Lesson/Lesson";
import LessonSammary from "./pages/LessonSammary";
import { useTheme } from "./context/ThemeContext";
import { LessonProvider } from "./context/LessonContext";
import { persistCurrentRoute, canWorkOffline } from "./utils/offlineManager";
import useNetworkStatus from "./hooks/useNetworkStatus";
import "./App.css";
import { API_BASE } from "./constants";

function App() {
  const online = useNetworkStatus();
  const { darkMode } = useTheme();
  const [canUseOffline, setCanUseOffline] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const location = useLocation();
  const onSummary = location.pathname.startsWith("/summary/");

  useEffect(() => {
    setShowOfflineBanner(!online);
  }, [online]);

  useEffect(() => {
    (async () => {
      const hasCache = await canWorkOffline();
      setCanUseOffline(hasCache);
    })();
  }, []);

  useEffect(() => {
    if (location.pathname !== "/login" && location.pathname !== "/signup") {
      persistCurrentRoute(location.pathname, location.search);
    }
  }, [location.pathname, location.search]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (!online && !canUseOffline) {
    return <NoInternet onRetry={handleRetry} />;
  }

  return (
       <LessonProvider>
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      {showOfflineBanner && (
        <div className="offline-banner">
          ⚠️ You're offline - Using cached data
          {!canUseOffline && " (Limited functionality)"}
        </div>
      )}

      <SignedIn>
        {!onSummary && online && <AutoUpsert />}
        <Sidebar />
        <div className="content-container" style={{ marginTop: showOfflineBanner ? '40px' : '0' }}>
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/lessons" element={<LessonsList online={online} />} />
              <Route path="/vocabsNotebook" element={<VocabsNotebook online={online} />} />
              <Route path="/lesson/:id" element={<Lesson online={online} />} />
              <Route path="/lessonSammary/:id" element={<LessonSammary online={online} />} />
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
  </LessonProvider>
  );
}

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
      try {
        const token = await getToken();
        if (!token) throw new Error("Missing token");

        await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.warn("AutoUpsert failed:", e.message);
      }
    })();
  }, [isSignedIn, getToken]);

  return null;
}

export default App;