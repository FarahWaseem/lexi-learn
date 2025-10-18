// /src/pages/lesson/SimpleLesson.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { connectRealtime } from "../../lib/realtime";
import { speak, startSTT } from "../../utils/voice";
import "./SimpleLesson.css";

export default function SimpleLesson() {
    const { getToken } = useAuth();

    const socketRef = useRef(null);
    const sttRef = useRef({ stop: () => { } });

    const [sessionId, setSessionId] = useState(null);
    const [dayNumber, setDayNumber] = useState(1);

    const [questionIdx, setQuestionIdx] = useState(null);
    const [timerLeft, setTimerLeft] = useState(0);

    const [messages, setMessages] = useState([]);   // {role: "ai"|"user", text}
    const [liveText, setLiveText] = useState("");   // نص جاري أثناء الاستماع
    const [finalText, setFinalText] = useState(""); // النص النهائي من STT
    const [words, setWords] = useState([]);         // كلمات اليوم
    const [finished, setFinished] = useState(false);
    const [starting, setStarting] = useState(false);
    const [err, setErr] = useState("");

    // refs لتجنّب مشاكل الإغلاقات
    const sessionRef = useRef(null);
    const qRef = useRef(null);
    const liveRef = useRef("");
    const finalRef = useRef("");

    useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);
    useEffect(() => { qRef.current = questionIdx; }, [questionIdx]);
    useEffect(() => { liveRef.current = liveText; }, [liveText]);
    useEffect(() => { finalRef.current = finalText; }, [finalText]);

    // تنظيف عند الخروج من الصفحة
    useEffect(() => {
        return () => {
            try { sttRef.current.stop?.(); } catch { }
            try { socketRef.current?.disconnect(); } catch { }
        };
    }, []);

    function formatMMSS(s) {
        const mm = String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0");
        const ss = String(Math.max(0, s) % 60).padStart(2, "0");
        return `${mm}:${ss}`;
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

            // اقطع أي اتصال سابق
            try { socketRef.current?.disconnect(); } catch { }

            const s = await connectRealtime(getToken);
            socketRef.current = s;

            // ================== أحداث قادمة من السيرفر ==================
            s.on("system_say", ({ text }) => {
                setMessages((m) => [...m, { role: "ai", text }]);
                speak(text);
            });

            s.on("session_ready", ({ sessionId, dayNumber }) => {
                setSessionId(sessionId);
                setDayNumber(dayNumber || 1);
            });

            // كلمات اليوم (10) تُرسل فور بدء اليوم
            s.on("topic_vocab", ({ vocab }) => {
                if (Array.isArray(vocab)) setWords(vocab);
            });

            s.on("ask_question", ({ prompt, seconds, questionIdx }) => {
                setQuestionIdx(questionIdx);
                setTimerLeft(seconds);
                setFinalText("");
                setLiveText("");

                setMessages((m) => [...m, { role: "ai", text: `Q${questionIdx}: ${prompt}` }]);
                speak(prompt);

                // ابدأ STT لكتابة كلام المستخدم لحظيًا
                try { sttRef.current.stop?.(); } catch { }
                sttRef.current = startSTT({
                    onPartial: (txt) => setLiveText(txt),
                    onFinal: (txt) => setFinalText(txt),
                });
            });

            s.on("timer", ({ left }) => setTimerLeft(left));

            s.on("time_up", ({ questionIdx }) => {
                // أوقفي الاستماع وخذي النص النهائي
                try { sttRef.current.stop?.(); } catch { }
                const text = (finalRef.current || liveRef.current || "").trim();

                if (text) {
                    setMessages((m) => [...m, { role: "user", text }]);
                }

                s.emit("user_final_text", {
                    sessionId: sessionRef.current,
                    questionIdx,
                    text,
                });
            });

            s.on("feedback", ({ questionIdx, transcript, correction, words: ww }) => {
                // تجنّب تكرار رسالة المستخدم إذا كانت نفسها التي أرسلناها عند time_up
                const likelySent = (finalRef.current || liveRef.current || "").trim();
                const tFromServer = (transcript || "").trim();
                if (tFromServer && tFromServer !== likelySent && !tFromServer.startsWith("(audio")) {
                    setMessages((m) => [...m, { role: "user", text: tFromServer }]);
                }

                if (correction?.feedback) {
                    const t = `Feedback: ${correction.feedback}`;
                    setMessages((m) => [...m, { role: "ai", text: t }]);
                    speak(t);
                }

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
                try { sttRef.current.stop?.(); } catch { }
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
        window.open(`http://localhost:4000/api/sessions/${sessionId}/export.pdf`, "_blank");
    }
    function handleDownloadAudio() {
        if (!sessionId) return;
        window.open(`http://localhost:4000/api/sessions/${sessionId}/export-audio`, "_blank");
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
                            <button className="export-btn" onClick={handleDownloadPDF}>Download PDF</button>
                            <button className="export-btn" onClick={handleDownloadAudio}>Download Audio</button>
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
                                <div className="text">{m.text}</div>
                            </div>
                        ))}

                        {!finished && questionIdx != null && (
                            <div className="bubble typing">
                                <div className="text">
                                    <strong>You (live):</strong>{" "}
                                    {liveText || <em>…listening</em>}
                                </div>
                                <div className="timer">⏳ {formatMMSS(timerLeft)}</div>
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
                                    <button className="speak" onClick={() => speak(w.word || "")} title="Pronounce">🔊</button>
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
