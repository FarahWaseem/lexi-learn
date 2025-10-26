// /src/pages/lesson/SimpleLesson.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { connectRealtime } from "../../lib/realtime";
import { startSTT } from "../../utils/voice";
import "./SimpleLesson.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function SimpleLesson() {
    const { getToken } = useAuth();
    const navigate = useNavigate();

    // ✅ مهم: استخدمي قالب JWT المخصص للـ WS (lexi-ws) + skipCache
    const tokenProvider = async () => {
        const t = await getToken({ template: "lexi-ws", skipCache: true });
        if (!t) throw new Error("Missing Clerk token (lexi-ws)");
        return t;
    };

    const socketRef = useRef(null);
    const sttRef = useRef({ stop: () => { } });

    const [sessionId, setSessionId] = useState(null);
    const [dayNumber, setDayNumber] = useState(1);

    const [questionIdx, setQuestionIdx] = useState(null);
    const [timerLeft, setTimerLeft] = useState(0);

    const [messages, setMessages] = useState([]); // {role:"ai"|"user", text}
    const [liveText, setLiveText] = useState("");
    const [finalText, setFinalText] = useState("");
    const [words, setWords] = useState([]);
    const [finished, setFinished] = useState(false);
    const [starting, setStarting] = useState(false);
    const [err, setErr] = useState("");

    // المؤقّت (دقيق + إيقاف/استئناف)
    const tickerRef = useRef(null);
    const endTimeRef = useRef(0);
    const isPausedRef = useRef(false);
    const [isPaused, setIsPaused] = useState(false);
    const totalSecRef = useRef(0);
    const timeUpSentRef = useRef(false);

    // TTS متزامن
    const currentUtterRef = useRef(null);
    function stopSpeaking() {
        try {
            window.speechSynthesis.cancel();
        } catch { }
        currentUtterRef.current = null;
    }
    function speakAsync(text) {
        stopSpeaking();
        return new Promise((resolve) => {
            const utter = new SpeechSynthesisUtterance(String(text || ""));
            currentUtterRef.current = utter;
            utter.onend = () => {
                if (currentUtterRef.current === utter) currentUtterRef.current = null;
                resolve();
            };
            utter.onerror = () => {
                if (currentUtterRef.current === utter) currentUtterRef.current = null;
                resolve();
            };
            try {
                window.speechSynthesis.speak(utter);
            } catch {
                resolve();
            }
        });
    }

    // refs مساعدة
    const sessionRef = useRef(null);
    const liveRef = useRef("");
    const finalRef = useRef("");
    useEffect(() => {
        sessionRef.current = sessionId;
    }, [sessionId]);
    useEffect(() => {
        liveRef.current = liveText;
    }, [liveText]);
    useEffect(() => {
        finalRef.current = finalText;
    }, [finalText]);

    // تنظيف عند المغادرة
    useEffect(() => {
        return () => {
            try {
                sttRef.current.stop?.();
            } catch { }
            try {
                socketRef.current?.disconnect();
            } catch { }
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

    // مؤقّت يبدأ فقط بعد انتهاء قراءة السؤال
    function startAccurateTimer(seconds, qIndex) {
        if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
        isPausedRef.current = false;
        setIsPaused(false);
        totalSecRef.current = Number(seconds || 0);
        endTimeRef.current = Date.now() + totalSecRef.current * 500;
        timeUpSentRef.current = false;
        setTimerLeft(totalSecRef.current);

        const tick = () => {
            if (isPausedRef.current) {
                tickerRef.current = requestAnimationFrame(tick);
                return;
            }
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

    // إيقاف شامل (Pause): الصوت + STT + المؤقّت — بدون إرسال جواب
    function handleStopAll() {
        stopSpeaking();
        try {
            sttRef.current.stop?.();
        } catch { }
        isPausedRef.current = true;
        setIsPaused(true);
    }

    // استئناف كل شيء
    function handleResume() {
        try {
            sttRef.current.stop?.();
        } catch { }
        sttRef.current = startSTT({
            onPartial: (txt) => setLiveText(txt),
            onFinal: (txt) => setFinalText(txt),
        });
        const remaining = Math.max(1, Math.ceil(timerLeft));
        endTimeRef.current = Date.now() + remaining * 500;
        isPausedRef.current = false;
        setIsPaused(false);
        if (!tickerRef.current)
            tickerRef.current = requestAnimationFrame(() =>
                startAccurateTimer(remaining, questionIdx)
            );
    }

    // يلتقط آخر partial قبل الإرسال
    async function flushAnswer() {
        await new Promise((r) => setTimeout(r, 250));
        const text = (finalRef.current || liveRef.current || "").trim();
        return text;
    }

    // نسخة صوتية قصيرة مفيدة من التصحيح
    function buildSpokenFeedback(correction) {
        if (!correction) return "";
        const issues = Array.isArray(correction.issues) ? correction.issues.slice(0, 2) : [];
        const points = issues
            .map((it, i) => `${i + 1}. ${it.note || `${it.before} → ${it.after}`}`)
            .join(" ");
        const corrected = correction.corrected ? `Try: ${correction.corrected}` : "";
        const base = correction.feedback
            ? correction.feedback.replace(/^feedback:\s*/i, "").trim()
            : "";
        return [base, points, corrected].filter(Boolean).join(". ");
    }

    async function handleStart() {
        try {
            setErr("");
            setStarting(true);
            setFinished(false);
            setMessages([]);
            setWords([]);
            setQuestionIdx(null);
            setTimerLeft(0);
            setFinalText("");
            setLiveText("");
            setIsPaused(false);
            isPausedRef.current = false;
            timeUpSentRef.current = false;
            if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
            stopSpeaking();

            try {
                socketRef.current?.disconnect();
            } catch { }

            // ✅ مهم: مرري tokenProvider (يستدعي template: "lexi-ws")
            const s = await connectRealtime(tokenProvider);
            socketRef.current = s;

            // ===== أحداث السيرفر =====
            s.on("system_say", async ({ text }) => {
                setMessages((m) => [...m, { role: "ai", text }]);
                await speakAsync(text); // اقرأ الافتتاح/الموضوع
            });

            s.on("session_ready", ({ sessionId, dayNumber }) => {
                setSessionId(sessionId);
                setDayNumber(dayNumber || 1);
            });

            s.on("topic_vocab", ({ vocab }) => {
                if (Array.isArray(vocab)) setWords(vocab);
            });

            // السؤال: اقرأه ثم ابدأ المؤقّت ثم STT
            s.on("ask_question", ({ prompt, seconds, questionIdx }) => {
                setQuestionIdx(questionIdx);
                setFinalText("");
                setLiveText("");
                setMessages((m) => [...m, { role: "ai", text: `Q${questionIdx}: ${prompt}` }]);

                (async () => {
                    await speakAsync(`Question ${questionIdx}. ${prompt}`);
                    startAccurateTimer(seconds, questionIdx);
                    try {
                        sttRef.current.stop?.();
                    } catch { }
                    sttRef.current = startSTT({
                        onPartial: (txt) => setLiveText(txt),
                        onFinal: (txt) => setFinalText(txt),
                    });
                })();
            });

            // انتهاء الوقت
            s.on("time_up", async ({ questionIdx }) => {
                try {
                    sttRef.current.stop?.();
                } catch { }
                if (tickerRef.current) {
                    cancelAnimationFrame(tickerRef.current);
                    tickerRef.current = null;
                }

                const text = (await flushAnswer()) || "";
                if (text) setMessages((m) => [...m, { role: "user", text }]);

                const spent = Math.max(1, Math.round(totalSecRef.current - Math.max(0, timerLeft)));
                socketRef.current?.emit("user_final_text", {
                    sessionId: sessionRef.current,
                    questionIdx,
                    text,
                    mode: "spoken",
                    durationSec: spent,
                });
            });

            // التصحيح
            s.on("feedback", ({ questionIdx, transcript, correction, words: ww }) => {
                const likelySent = (finalRef.current || liveRef.current || "").trim();
                const tFromServer = (transcript || "").trim();
                if (tFromServer && tFromServer !== likelySent && !tFromServer.startsWith("(audio")) {
                    setMessages((m) => [...m, { role: "user", text: tFromServer }]);
                }

                // عرض مرتّب: عنوان + قائمة نقاط + جملة مصحّحة
                const pretty = [];
                const fb = String(correction?.feedback || "")
                    .replace(/^feedback:\s*/i, "")
                    .trim();
                if (fb) pretty.push(`🎯 Speaking feedback: ${fb}`);

                const list = Array.isArray(correction?.issues) ? correction.issues.slice(0, 4) : [];
                if (list.length) {
                    const lines = list.map(
                        (it, i) => `${i + 1}) ${it.before} → ${it.after} — ${it.note || it.type || ""}`
                    );
                    pretty.push(lines.join("\n"));
                }

                if (correction?.corrected) pretty.push(`✅ Try: ${correction.corrected}`);

                const out = pretty.filter(Boolean).join("\n");
                if (out) setMessages((m) => [...m, { role: "ai", text: out }]);

                // قراءة نسخة قصيرة مفيدة فقط
                (async () => {
                    const spoken = buildSpokenFeedback(correction);
                    if (spoken) await speakAsync(spoken);
                    // جاهزين للسؤال التالي الآن فقط
                    socketRef.current?.emit("ready_for_next", { afterQuestion: questionIdx });
                })();

                if (Array.isArray(ww) && ww.length) {
                    setWords((prev) => {
                        const seen = new Set(prev.map((w) => (w.word || "").toLowerCase()));
                        const extra = ww.filter((w) => !seen.has((w.word || "").toLowerCase()));
                        return [...prev, ...extra];
                    });
                }
            });

            s.on("lesson_finished", () => {
                setFinished(true);
                try {
                    sttRef.current.stop?.();
                } catch { }
                if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
                stopSpeaking();
                setTimerLeft(0);
                setMessages((m) => [...m, { role: "ai", text: "Great job! Lesson finished 🎉" }]);
            });

            s.on("error", ({ message }) => setErr(message || "Realtime error"));

            // ابدأ اليوم
            s.emit("start_day", { dayNumber: Number(dayNumber) || 1 });
        } catch (e) {
            console.error(e);
            setErr(e?.message || "Failed to start realtime");
        } finally {
            setStarting(false);
        }
    }

    function handleDownloadPDF() {
        if (!sessionId) return;
        window.open(`${API_BASE}/api/sessions/${sessionId}/export.pdf`, "_blank");
    }

    // زر View Summary — ننقل لصفحة /summary/:id
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
                    <div className="day-picker">
                        <label>Day</label>
                        <input
                            type="number"
                            min={1}
                            value={dayNumber}
                            onChange={(e) => setDayNumber(Number(e.target.value || 1))}
                            disabled={!!sessionId && !finished}
                        />
                    </div>

                    {!sessionId ? (
                        <button className="start-btn" onClick={handleStart} disabled={starting}>
                            {starting ? "Starting…" : `Start Day ${dayNumber}`}
                        </button>
                    ) : finished ? (
                        <div className="done-actions">
                            <button className="export-btn" onClick={handleDownloadPDF}>
                                Download PDF
                            </button>
                            <button className="export-btn" onClick={handleGoToSummary}>
                                View Summary
                            </button>
                        </div>
                    ) : (
                        <div className="pill">Session: {sessionId.slice(0, 8)}…</div>
                    )}
                </div>
            </div>

            <div className="lesson-body">
                <section className="chat-area">
                    <div className="bubbles">
                        {messages.map((m, i) => (
                            <div key={i} className={`bubble ${m.role}`}>
                                <div className="text" style={{ whiteSpace: "pre-wrap" }}>
                                    {m.text}
                                </div>
                            </div>
                        ))}

                        {!finished && questionIdx != null && (
                            <div className="bubble typing">
                                <div className="text">
                                    <strong>You (live):</strong>{" "}
                                    {liveText || <em>…listening</em>}
                                </div>
                                <div className="timer">⏳ {formatMMSS(timerLeft)}</div>

                                {!isPaused ? (
                                    <button className="stop-btn" onClick={handleStopAll} title="Pause lesson">
                                        ⏹ Stop
                                    </button>
                                ) : (
                                    <button className="resume-btn" onClick={handleResume} title="Resume lesson">
                                        ▶ Resume
                                    </button>
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
                                    <button
                                        className="speak"
                                        onClick={() => speakAsync(w.word || "")}
                                        title="Pronounce"
                                    >
                                        🔊
                                    </button>
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
