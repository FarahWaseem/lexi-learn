// /src/pages/lesson/SimpleLesson.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { connectRealtime } from "../../lib/realtime";
import { startSTT } from "../../utils/voice";
import "./SimpleLesson.css";
import { markCompleted } from "../../utils/progress";

// ✅ تخزين أوفلاين (مطابق لـ /src/offline/db.js)
import { saveSummaryJson, saveSummaryPdf, saveQALog } from "../../offline/db";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://127.0.0.1:3001";

export default function SimpleLesson() {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const initialDayFromURL = Number(searchParams.get("day")) || 1;

    // WS token (قالب lexi-ws)
    const tokenProvider = async () => {
        const t = await getToken({ template: "lexi-ws", skipCache: true });
        if (!t) throw new Error("Missing Clerk token (lexi-ws)");
        return t;
    };

    const socketRef = useRef(null);
    const sttRef = useRef({ stop: () => { } });

    const [sessionId, setSessionId] = useState(null);
    const [dayNumber, setDayNumber] = useState(initialDayFromURL);

    const [questionIdx, setQuestionIdx] = useState(null);
    const [timerLeft, setTimerLeft] = useState(0);

    const [messages, setMessages] = useState([]); // {role:"ai"|"user", text}
    const [liveText, setLiveText] = useState("");
    const [finalText, setFinalText] = useState("");
    const [words, setWords] = useState([]);
    const [finished, setFinished] = useState(false);
    const [starting, setStarting] = useState(false);
    const [err, setErr] = useState("");

    // ✅ لوج Q&A: نخزّنه في IndexedDB بصيغة: { day, topic, qa:[{idx,prompt,userText,correction}] }
    const [qaLog, setQaLog] = useState([]);
    const qaLogRef = useRef(qaLog);
    useEffect(() => { qaLogRef.current = qaLog; }, [qaLog]);

    // ✅ موضوع الدرس (أول system_say)
    const [topic, setTopic] = useState("");
    const topicRef = useRef(topic);
    useEffect(() => { topicRef.current = topic; }, [topic]);

    // منع التكرار
    const answeredSetRef = useRef(new Set());  // لكل questionIdx
    const feedbackSetRef = useRef(new Set());  // لكل questionIdx

    useEffect(() => {
        setDayNumber(Number(searchParams.get("day")) || 1);
    }, [searchParams]);

    // helper يضمن Array
    const asArray = (v) => (Array.isArray(v) ? v : []);

    // المؤقت
    const tickerRef = useRef(null);
    const endTimeRef = useRef(0);
    const isPausedRef = useRef(false);
    const [isPaused, setIsPaused] = useState(false);
    const totalSecRef = useRef(0);
    const timeUpSentRef = useRef(false);

    // TTS
    const currentUtterRef = useRef(null);
    function stopSpeaking() {
        try { window.speechSynthesis.cancel(); } catch { }
        currentUtterRef.current = null;
    }
    function speakAsync(text) {
        stopSpeaking();
        return new Promise((resolve) => {
            const u = new SpeechSynthesisUtterance(String(text || ""));
            currentUtterRef.current = u;
            u.onend = u.onerror = () => { if (currentUtterRef.current === u) currentUtterRef.current = null; resolve(); };
            try { window.speechSynthesis.speak(u); } catch { resolve(); }
        });
    }

    const sessionRef = useRef(null);
    const liveRef = useRef("");
    const finalRef = useRef("");
    useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);
    useEffect(() => { liveRef.current = liveText; }, [liveText]);
    useEffect(() => { finalRef.current = finalText; }, [finalText]);

    useEffect(() => {
        return () => {
            try { sttRef.current.stop?.(); } catch { }
            try { socketRef.current?.disconnect(); } catch { }
            if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
            stopSpeaking();
        };
    }, []);

    function formatMMSS(s) {
        const sec = Math.max(0, Math.floor(s));
        const mm = String(Math.floor(sec / 60)).padStart(2, "0");
        const ss = String(sec % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }

    function startAccurateTimer(seconds, qIndex) {
        if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
        isPausedRef.current = false;
        setIsPaused(false);
        totalSecRef.current = Number(seconds || 0);
        endTimeRef.current = Date.now() + totalSecRef.current * 500;
        timeUpSentRef.current = false;
        setTimerLeft(totalSecRef.current);

        const tick = () => {
            if (isPausedRef.current) { tickerRef.current = requestAnimationFrame(tick); return; }
            const now = Date.now();
            const leftMs = Math.max(0, endTimeRef.current - now);
            const left = leftMs / 500;
            setTimerLeft(left);
            if (left <= 0 && !timeUpSentRef.current) {
                timeUpSentRef.current = true;
                socketRef.current?.emit("time_up", { questionIdx: qIndex });
                return;
            }
            tickerRef.current = requestAnimationFrame(tick);
        };
        tickerRef.current = requestAnimationFrame(tick);
    }

    function handleStopAll() {
        stopSpeaking();
        try { sttRef.current.stop?.(); } catch { }
        isPausedRef.current = true;
        setIsPaused(true);
    }

    function handleResume() {
        try { sttRef.current.stop?.(); } catch { }
        sttRef.current = startSTT({ onPartial: (txt) => setLiveText(txt), onFinal: (txt) => setFinalText(txt) });
        const remaining = Math.max(1, Math.ceil(timerLeft));
        endTimeRef.current = Date.now() + remaining * 500;
        isPausedRef.current = false;
        setIsPaused(false);
        if (!tickerRef.current)
            tickerRef.current = requestAnimationFrame(() => startAccurateTimer(remaining, questionIdx));
    }

    async function flushAnswer() {
        await new Promise((r) => setTimeout(r, 250));
        return (finalRef.current || liveRef.current || "").trim();
    }

    function buildSpokenFeedback(correction) {
        if (!correction) return "";
        const issues = Array.isArray(correction.issues) ? correction.issues.slice(0, 2) : [];
        const points = issues.map((it, i) => `${i + 1}. ${it.note || `${it.before} → ${it.after}`}`).join(" ");
        const corrected = correction.corrected ? `Try: ${correction.corrected}` : "";
        const base = correction.feedback ? correction.feedback.replace(/^feedback:\s*/i, "").trim() : "";
        return [base, points, corrected].filter(Boolean).join(". ");
    }

    // جلب السمّري وPDF للأوفلاين (اختياري)
    async function prefetchSummaryAndPdf(sid) {
        if (!sid) return;
        try {
            try {
                const sRes = await fetch(`${API_BASE}/api/sessions/${sid}/lesson-summary`, { cache: "no-store" });
                if (sRes.ok) { const json = await sRes.json(); await saveSummaryJson(sid, json); }
            } catch { }
            const tryFetchPdf = async (headers = {}) => {
                const r = await fetch(`${API_BASE}/api/sessions/${sid}/export.pdf`, { headers, cache: "no-store" });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const blob = await r.blob();
                await saveSummaryPdf(sid, blob);
            };
            try {
                const token = await getToken();
                if (token) await tryFetchPdf({ Authorization: `Bearer ${token}` });
                else await tryFetchPdf();
            } catch { try { await tryFetchPdf(); } catch { } }
        } catch { }
    }

    async function handleStart() {
        try {
            setErr("");
            setStarting(true);
            setFinished(false);
            setMessages([]);
            setWords([]);
            setQaLog([]); // نبدأ مصفوفة فاضية
            setTopic("");
            answeredSetRef.current.clear();
            feedbackSetRef.current.clear();

            setQuestionIdx(null);
            setTimerLeft(0);
            setFinalText("");
            setLiveText("");
            setIsPaused(false);
            isPausedRef.current = false;
            timeUpSentRef.current = false;
            if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
            stopSpeaking();

            try { socketRef.current?.disconnect(); } catch { }

            const s = await connectRealtime(tokenProvider);
            socketRef.current = s;

            s.on("system_say", async ({ text }) => {
                if (!topicRef.current) setTopic(text || "");
                setMessages((m) => [...m, { role: "ai", text }]);
                await speakAsync(text);
            });

            s.on("session_ready", ({ sessionId: sid, dayNumber: srvDay }) => {
                setSessionId(sid);
                setDayNumber(srvDay || initialDayFromURL || 1);
            });

            s.on("topic_vocab", ({ vocab }) => { if (Array.isArray(vocab)) setWords(vocab); });

            // السؤال
            s.on("ask_question", ({ prompt, seconds, questionIdx }) => {
                setQuestionIdx(questionIdx);
                setFinalText("");
                setLiveText("");
                setMessages((m) => [...m, { role: "ai", text: `Q${questionIdx}: ${prompt}` }]);

                // أضِف السؤال للّوج إذا غير موجود
                setQaLog((old) => {
                    const arr = asArray(old);
                    if (arr.some((q) => q.idx === questionIdx)) return arr;
                    return [...arr, { idx: questionIdx, prompt, userText: "", correction: null }];
                });

                (async () => {
                    await speakAsync(`Question ${questionIdx}. ${prompt}`);
                    startAccurateTimer(seconds, questionIdx);
                    try { sttRef.current.stop?.(); } catch { }
                    sttRef.current = startSTT({
                        onPartial: (txt) => setLiveText(txt),
                        onFinal: (txt) => setFinalText(txt),
                    });
                })();
            });

            // نهاية الوقت — خزّن جواب المستخدم مرة واحدة
            s.on("time_up", async ({ questionIdx }) => {
                try { sttRef.current.stop?.(); } catch { }
                if (tickerRef.current) { cancelAnimationFrame(tickerRef.current); tickerRef.current = null; }

                const text = (await flushAnswer()) || "";

                if (text && !answeredSetRef.current.has(questionIdx)) {
                    setMessages((m) => [...m, { role: "user", text }]);
                }

                if (text && !answeredSetRef.current.has(questionIdx)) {
                    answeredSetRef.current.add(questionIdx);
                    setQaLog((old) => {
                        const arr = asArray(old);
                        return arr.map((q) =>
                            q.idx === questionIdx && !q.userText ? { ...q, userText: text } : q
                        );
                    });
                }

                const spent = Math.max(1, Math.round(totalSecRef.current - Math.max(0, timerLeft)));
                socketRef.current?.emit("user_final_text", {
                    sessionId: sessionRef.current,
                    questionIdx,
                    text,
                    mode: "spoken",
                    durationSec: spent,
                });
            });

            // التصحيح — مرّة فقط لكل سؤال
            s.on("feedback", ({ questionIdx, transcript, correction, words: ww }) => {
                const likelySent = (finalRef.current || liveRef.current || "").trim();
                const tFromServer = (transcript || "").trim();

                // لو السيرفر رجّع transcript مختلف ولم نخزّنه
                if (tFromServer && !answeredSetRef.current.has(questionIdx) && tFromServer !== likelySent) {
                    answeredSetRef.current.add(questionIdx);
                    setQaLog((old) => {
                        const arr = asArray(old);
                        return arr.map((q) => (q.idx === questionIdx ? { ...q, userText: tFromServer } : q));
                    });
                    setMessages((m) => [...m, { role: "user", text: tFromServer }]);
                }

                // عرض feedback مرة واحدة
                if (!feedbackSetRef.current.has(questionIdx)) {
                    const pretty = [];
                    const fb = String(correction?.feedback || "").replace(/^feedback:\s*/i, "").trim();
                    if (fb) pretty.push(`🎯 Speaking feedback: ${fb}`);

                    const list = Array.isArray(correction?.issues) ? correction.issues.slice(0, 4) : [];
                    if (list.length) {
                        pretty.push(
                            list
                                .map((it, i) => `${i + 1}) ${it.before} → ${it.after} — ${it.note || it.type || ""}`)
                                .join("\n")
                        );
                    }
                    if (correction?.corrected) pretty.push(`✅ Try: ${correction.corrected}`);

                    const out = pretty.filter(Boolean).join("\n");
                    if (out) setMessages((m) => [...m, { role: "ai", text: out }]);
                    feedbackSetRef.current.add(questionIdx);
                }

                // خزّن التصحيح في اللوج
                setQaLog((old) => {
                    const arr = asArray(old);
                    return arr.map((q) =>
                        q.idx === questionIdx ? { ...q, correction: correction || null } : q
                    );
                });

                // نطق موجز + التالي
                (async () => {
                    const spoken = buildSpokenFeedback(correction);
                    if (spoken) await speakAsync(spoken);
                    socketRef.current?.emit("ready_for_next", { afterQuestion: questionIdx });
                })();

                // كلمات إضافية
                if (Array.isArray(ww) && ww.length) {
                    setWords((prev) => {
                        const seen = new Set(prev.map((w) => (w.word || "").toLowerCase()));
                        const extra = ww.filter((w) => !seen.has((w.word || "").toLowerCase()));
                        return [...prev, ...extra];
                    });
                }
            });

            s.on("lesson_finished", async () => {
                setFinished(true);

                try { markCompleted(Number(dayNumber) || 1, sessionId); } catch { }

                try { sttRef.current.stop?.(); } catch { }
                if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
                stopSpeaking();
                setTimerLeft(0);
                setMessages((m) => [
                    ...m,
                    { role: "ai", text: "Great job! Lesson finished 🎉 The next lesson is now unlocked." },
                ]);

                // ✅ خزّن Q&A log للأوفلاين (مع اليوم والموضوع) — المفتاح: qalog:<sessionId>
                const sid = sessionRef.current;
                if (sid) {
                    const payload = {
                        day: Number(dayNumber) || 1,
                        topic: topicRef.current || "",
                        qa: asArray(qaLogRef.current),
                    };
                    try { await saveQALog(sid, payload); } catch { }
                    // (اختياري) حضّر السمّري و PDF من السيرفر للأوفلاين
                    prefetchSummaryAndPdf(sid);
                }
            });

            s.on("error", ({ message }) => setErr(message || "Realtime error"));

            // ابدأ اليوم الصحيح
            s.emit("start_day", { dayNumber: initialDayFromURL || 1 });
        } catch (e) {
            console.error(e);
            setErr(e?.message || "Failed to start realtime");
        } finally {
            setStarting(false);
        }
    }

    function handleGoToSummary() {
        if (!sessionId) return;
        navigate(`/summary/${sessionId}`);
    }

    return (
        <div className="lesson-shell">
            <div className="lesson-top">
                <div className="lesson-title">
                    <span className="mascot">🫒</span>
                    <div>
                        <h1>Daily Lesson (Realtime)</h1>
                        <p>Auto Q&amp;A with live transcription &amp; feedback</p>
                    </div>
                </div>

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
                                    <strong>You (live):</strong> {liveText || <em>…listening</em>}
                                </div>
                                <div className="timer">⏳ {formatMMSS(timerLeft)}</div>

                                {!isPaused ? (
                                    <button className="stop-btn" onClick={handleStopAll} title="Pause lesson">⏹ Stop</button>
                                ) : (
                                    <button className="resume-btn" onClick={handleResume} title="Resume lesson">▶ Resume</button>
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
                    {words.length ? (
                        <ul className="vocab-list">
                            {words.map((w, i) => (
                                <li key={`${w.word}-${i}`} className="vocab-item">
                                    <div>
                                        <b>{w.word}</b>
                                        {w.ipa ? <span className="ipa"> /{w.ipa}/</span> : null}
                                        {w.meaning ? <div className="meaning">{w.meaning}</div> : null}
                                        {w.example ? <div className="ex">“{w.example}”</div> : null}
                                    </div>
                                    <button className="speak" onClick={() => speakAsync(w.word || "")} title="Pronounce">🔊</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="vocab-groups empty">Words will appear here</div>
                    )}
                </aside>
            </div>
        </div>
    );
}
