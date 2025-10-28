// src/App.jsx
import React, { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Sidebar from "./components/sidebar/Sidebar";
import Lesson from "./pages/Lessons/Lesson";
import SimpleLesson from "./pages/Lessons/SimpleLesson";
import Dashboard from "./pages/Dashboard";
import VocabsNotebook from "./pages/VocabsNotebook";
import Header from "./components/header/Header";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Summary from "./pages/Summary";

import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useAuth,
} from "@clerk/clerk-react";

import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

function App() {
  console.log("✅ App component rendered");

  // 👇 الجديد: نحدد إذا إحنا على صفحة السمري
  const location = useLocation();
  const onSummary = location.pathname.startsWith("/summary/");

  return (
    <div className="app-container">
      {/* يظهر المحتوى الكامل للتطبيق فقط عند تسجيل الدخول */}
      <SignedIn>
        {/* 👇 لا تشغّل AutoUpsert على صفحة السمري لتفادي السباق */}
        {!onSummary && <AutoUpsert />}
        <Sidebar />
        <div className="content-container">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* الدروس */}
              <Route path="/lesson" element={<Lesson />} />
              <Route path="/lesson1" element={<SimpleLesson />} />

              {/* الملخّص */}
              <Route path="/summary/:id" element={<Summary />} />

              {/* أي مسار غير معروف داخل SignedIn يروح للداشبورد */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </SignedIn>

      {/* وضع غير مسجّل الدخول: صفحات Auth + تحويل تلقائي */}
      <SignedOut>
        <Routes>
          {/* صفحاتك المخصّصة */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* مسارات SSO الممكنة من Clerk لتفادي التحذيرات */}
          <Route path="/login/sso-callback" element={<div />} />
          <Route path="/sso-callback" element={<div />} />

          {/* أي شيء آخر: وجّهي المستخدم لنافذة تسجيل الدخول */}
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </SignedOut>
    </div>
  );
}

/** 🔁 يستدعي /api/me بعد تسجيل الدخول لعمل UPSERT للمستخدم – مرّة واحدة فقط مع إعادة محاولات ذكية */
function AutoUpsert() {
  const { isSignedIn, getToken } = useAuth();
  const calledRef = useRef(false);   // يمنع التكرار المنطقي
  const abortRef = useRef(false);    // يلغي عند unmount

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
          // المحاولة الأولى: توكن عادي. المحاولات التالية: skipCache
          const token = await getToken(
            attempt === 1 ? undefined : { skipCache: true }
          );
          if (!token) throw new Error("Missing Clerk token");

          const url = `${API_BASE}/api/me`;
          console.log(
            `🔸 [AutoUpsert] attempt ${attempt}/${maxAttempts} →`,
            url,
            "token:",
            token.slice(0, 12) + "…"
          );

          const res = await fetch(url, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });

          // حاول قراءة JSON، ولو فشل إرجع النص
          let payload;
          const text = await res.text();
          try {
            payload = JSON.parse(text);
          } catch {
            payload = text;
          }

          if (!res.ok) {
            const msg =
              typeof payload === "object"
                ? payload?.error || JSON.stringify(payload)
                : String(payload || "");
            throw new Error(
              `HTTP ${res.status} ${res.statusText || ""} — ${msg}`.trim()
            );
          }

          console.log("✅ [AutoUpsert] /api/me ok:", payload);
          return; // نجاح — لا نعيد المحاولة
        } catch (e) {
          lastError = e;
          console.warn(`⚠️ [AutoUpsert] attempt ${attempt} failed:`, e?.message);

          // لو آخر محاولة، اخرج
          if (attempt >= maxAttempts) break;

          // backoff: 200ms, 600ms
          const backoff = attempt === 1 ? 200 : 600;
          await sleep(backoff);
        }
      }

      if (!abortRef.current && lastError) {
        console.error("❌ [AutoUpsert] giving up:", lastError.message);
      }
    })();
  }, [isSignedIn, getToken]);

  return null;
}

export default App;
