import React from "react";
import "./Lesson.css";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import useLessonController from "./useLessonController";

export default function Lesson() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();

  const dayNumber = Number(params.get("day")) || 1;

  const {
    starting,
    finished,
    sessionId,
    messages,
    words,
    liveText,
    questionIdx,
    timerLeft,
    isPaused,
    err,
    handleStart,
    handleResume,
    handleStopAll,
    formatMMSS,
    handleGoToSummary,
  } = useLessonController({ getToken, dayNumber, location, navigate });

  return (
    <div className="lesson-shell">
      <div className="lesson-top">

        <div className="lesson-actions">
          {!sessionId ? (
            <button className="start-btn" onClick={handleStart} disabled={starting}>
              {starting ? "Starting…" : "Start Lesson"}
            </button>
          ) : finished ? (
            <div className="done-actions">
              <button className="export-btn" onClick={handleGoToSummary}>
                View Summary
              </button>
            </div>
          ) : (
            <div className="pill">Lesson in progress…</div>
          )}
        </div>
      </div>

      <div className="lesson-body">
        <section className="chat-area">
          <div className="bubbles">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                <div className="text" style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              </div>
            ))}

            {!finished && questionIdx != null && (
              <div className="bubble typing">
                <div className="text">
                  <strong>You:</strong> {liveText || <em>…listening</em>}
                </div>
                <div className="timer">⏳ {formatMMSS(timerLeft)}</div>

                {!isPaused ? (
                  <button className="stop-btn" onClick={handleStopAll}>⏹ Stop</button>
                ) : (
                  <button className="resume-btn" onClick={handleResume}>▶ Resume</button>
                )}
              </div>
            )}

            {err && <div className="net-error">⚠ {err}</div>}
          </div>
        </section>

        <aside className="vocab">
          <div className="vocab-head">
            <strong>Words</strong>
            <span className="count">{words.length}</span>
          </div>

          {!words.length ? (
            <div className="vocab-groups empty">Words will appear here</div>
          ) : (
            <ul className="vocab-list">
              {words.map((w, i) => (
                <li key={`${w.word}-${i}`} className="vocab-item">
                  <div>
                    <b>{w.word}</b>
                    {w.meaning && <div className="meaning">{w.meaning}</div>}
                  </div>
                  <button className="speak" onClick={() => speakAsync(w.word)}>🔊</button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}