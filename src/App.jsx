// src/App.jsx
import React, { useEffect, useRef } from "react";
import Practice from "./pages/Practice";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/sidebar/Sidebar";
import Lesson from "./pages/Lessons/Lesson";
import Dashboard from "./pages/Dashboard";
import VocabsNotebook from "./pages/VocabsNotebook";
import Header from "./components/header/Header";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import "./App.css";
import SimpleLesson from "./pages/Lessons/SimpleLesson";

import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/clerk-react";
import Summary from "./pages/Summary";
// ...



function App() {
  console.log("✅ App component rendered");

  return (
    <div className="app-container">
      <SignedIn>
        <AutoUpsert /> {/* ينادي /api/me مرّة واحدة */}
        <Sidebar />
        <div className="content-container">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/lesson" element={<Lesson />} />
              <Route path="/vocabsNotebook" element={<VocabsNotebook />} />
              <Route path="/login" element={<Navigate to="/dashboard" />} />
              <Route path="/signup" element={<Navigate to="/dashboard" />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/practice" element={<Practice />} />;
<Route path="/summary/:day" element={<Summary />} />
              <Route path="/lesson1" element={<SimpleLesson />} />;
            </Routes>
          </main>
        </div>
      </SignedIn>

      <SignedOut>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </SignedOut>
    </div>
  );
}

/** 🔁 يستدعي /api/me بعد تسجيل الدخول لعمل UPSERT للمستخدم – مرّة واحدة فقط */
function AutoUpsert() {
  const { isSignedIn, getToken } = useAuth();
  const calledRef = useRef(false); // يمنع التكرار

  useEffect(() => {
    if (!isSignedIn) return;
    if (calledRef.current) return;
    calledRef.current = true;

    (async () => {
      try {
        const token = await getToken(); // بدون template
        if (!token) {
          console.warn("⚠️ No token from Clerk");
          return;
        }

        const url = "http://localhost:3000/api/me";
        console.log("🔸 calling", url, "with token:", token.slice(0, 12) + "...");

        const res = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (!res.ok) {
            console.error(`❌ /api/me failed: ${res.status}`, data);
          } else {
            console.log("✅ /api/me ok:", data);
          }
        } catch {
          // رجع HTML (مثلاً "Cannot GET /") أو نص
          if (!res.ok) {
            console.error(`❌ /api/me failed: ${res.status}`, text);
          } else {
            console.log("✅ /api/me ok (text):", text);
          }
        }
      } catch (e) {
        console.error("upsert failed", e);
      }
    })();
  }, [isSignedIn, getToken]);

  return null;
}

export default App;
// داخل <Routes> تبع SignedIn

