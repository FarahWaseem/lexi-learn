// /src/pages/summary/Summary.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useParams } from "react-router-dom";
import "./Summary.css";

const API_BASE = (import.meta?.env?.VITE_API_BASE) ?? "http://localhost:4000";

// fetch مع timeout بسيط
async function fetchWithTimeout(input, init = {}, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export default function Summary() {
  const { id } = useParams(); // sessionId
  const { getToken } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [downloading, setDownloading] = useState(false);

function handleDownloadPDF() {
  // تنزيل مباشر بدون Authorization
  window.open(`${API_BASE}/api/sessions/${id}/export.pdf`, "_blank");
}


  // تحميل بيانات الملخص للكروت
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/api/sessions/${id}/lesson-summary?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!abort) setData(json);
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to load summary");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [id]);

  if (loading) return <div className="pad">⏳ Loading…</div>;
  if (err) return <div className="pad error">❌ {err}</div>;
  if (!data) return null;

  const clamp = (n, min = 0, max = 100) =>
    Math.max(min, Math.min(max, Number.isFinite(+n) ? +n : 0));

  const {
    lesson,
    performance: perfRaw,
    recap,
    vocab: vocabRaw,
    positivePoints: positivesRaw,
    grammarFeedback,
  } = data;

  const performance = clamp(perfRaw);
  const vocab = Array.isArray(vocabRaw) ? vocabRaw : [];
  const positivePoints = Array.isArray(positivesRaw) ? positivesRaw : [];

  // بدون useMemo لتجنّب تحذير Hooks
  const grammarItems = (grammarFeedback || "")
    .split(/[-•–]\s+/)
    .map((s) =>
      s
        .trim()
        .replace(/^Speaking feedback[:]?/i, "")
        .replace(/^Speaking tips[:]?/i, "")
        .replace(/^Key issues[:]?/i, "")
        .trim()
    )
    .filter(Boolean);

  return (
    <div className="summary-page">
      <div className="summary-header">
        <h2>Summary of Lesson {lesson.day}</h2>
        <button className="pdf-btn" onClick={handleDownloadPDF} disabled={downloading}>
          {downloading ? "Preparing…" : "Download as PDF"}
        </button>
      </div>

      <div className="summary-grid">
        {/* Congratulation card */}
        <div className="card congrat" aria-live="polite">
          <div>
            <h3>Congratulation !!</h3>
            <p>Keep it up, you’re improving every day</p>
            <small>
              You have successfully completed Lesson {lesson.day}. Keep learning step by step every day!
            </small>
          </div>
          <div className="mascot" aria-hidden>
            🫒
          </div>
        </div>

        {/* Performance */}
        <div className="card perf">
          <div
            className="perf-ring"
            style={{
              background: `conic-gradient(#22c55e 0deg ${performance * 3.6}deg, #e6e6e6 ${performance * 3.6}deg 360deg)`,
            }}
            role="img"
            aria-label={`Performance ${performance} percent`}
            title={`Performance ${performance}%`}
          >
            <span>{performance}%</span>
          </div>
          <div className="perf-caption">Performance in this lesson</div>
        </div>

        {/* Recap */}
        <div className="card">
          <h4>Lesson Recap</h4>
          <p>{recap}</p>
        </div>

        {/* Vocabulary */}
        <div className="card">
          <h4>New Vocabulary</h4>
          {vocab.length ? (
            <ul className="vocab">
              {vocab.map((v, i) => (
                <li key={`${v.word}-${i}`}>
                  <div className="word">{v.word}</div>
                  <div className="meaning">{v.meaning}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No new words for this lesson.</p>
          )}
        </div>

        {/* Positives */}
        <div className="card">
          <h4>Positive Points</h4>
          {positivePoints.length ? (
            <ul className="bullets">
              {positivePoints.map((p, i) => (
                <li key={`${p}-${i}`}>{p}</li>
              ))}
            </ul>
          ) : (
            <p>Keep going — progress comes with practice!</p>
          )}
        </div>

        {/* Grammar Feedback */}
        <div className="card">
          <h4>Grammar Feedback</h4>
          {grammarItems.length ? (
            <ul className="grammar-list">
              {grammarItems.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : (
            <p>No feedback yet.</p>
          )}
        </div>
      </div>

      <div className="summary-footer">
        <button className="ghost" type="button">
          Vocabulary Notebook
        </button>
        <div style={{ flex: 1 }} />
        <button
          className="primary"
          type="button"
          onClick={() => window.location.assign("/lesson")}
        >
          Next Lesson
        </button>
      </div>
    </div>
  );
}
