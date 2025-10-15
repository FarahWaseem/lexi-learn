// src/pages/Lessons/SimpleLesson.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./SimpleLesson.css";
import { useAuth } from "@clerk/clerk-react";
import * as api from "../../services/apiClient";

export default function SimpleLesson() {
    const { getToken } = useAuth();

    const [dayNumber, setDayNumber] = useState(1);
    const [sessionId, setSessionId] = useState(null);

    const [topic, setTopic] = useState(null);
    const [questions, setQuestions] = useState([]);

    const [messages, setMessages] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [seconds, setSeconds] = useState(60);
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [netError, setNetError] = useState("");

    const [sideWords, setSideWords] = useState([]);

    const mediaStreamRef = useRef(null);
    const mediaRecRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const chatRef = useRef(null);

    const currentQuestion = useMemo(
        () => (questions.length ? questions[currentIdx] : null),
        [questions, currentIdx]
    );

    useEffect(() => {
        chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, currentIdx]);

    async function startMic() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
        chunksRef.current = [];
        rec.ondataavailable = (e) => e.data?.size && chunksRef.current.push(e.data);
        rec.onstop = handleRecordingStop;
        mediaRecRef.current = rec;
        rec.start();
        setIsRecording(true);
    }
    function stopMic() {
        try { mediaRecRef.current?.stop(); } catch { }
        setIsRecording(false);
        mediaStreamRef.current?.getTracks()?.forEach((t) => t.stop());
    }
    async function handleRecordingStop() {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        await uploadAnswer(blob);
    }

    useEffect(() => {
        clearInterval(timerRef.current);
        if (!currentQuestion || !sessionId) return;

        setSeconds(60);
        timerRef.current = setInterval(() => {
            setSeconds((s) => {
                if (s <= 1) {
                    clearInterval(timerRef.current);
                    if (isRecording) stopMic();
                    return 0;
                }
                return s - 1;
            });
        }, 1000);

        (async () => {
            try { await startMic(); }
            catch { setNetError("Microphone permission denied."); }
        })();

        return () => clearInterval(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestion, sessionId]);

    async function handleStart() {
        try {
            setNetError(""); setLoading(true);
            const token = await getToken();
            const payload = await api.startSession({ dayNumber, token });
            if (!payload?.session?.id) throw new Error("Start session failed (no session returned)");

            setSessionId(payload.session.id);
            setTopic(payload.topic || null);
            setQuestions(payload.questions || []);
            setCurrentIdx(0);
            setSideWords([]);

            setMessages([
                { id: crypto.randomUUID(), role: "assistant", text: payload.openingMessage || `Welcome! Let's start Day ${dayNumber}.` },
                { id: crypto.randomUUID(), role: "assistant", text: payload.firstQuestion?.prompt_en || "Question 1" },
            ]);
        } catch (e) {
            console.error(e); setNetError(e.message || "Network error");
        } finally {
            setLoading(false);
        }
    }

    async function uploadAnswer(blob) {
        if (!sessionId || !currentQuestion) return;
        try {
            setLoading(true); setNetError("");
            const token = await getToken();

            // placeholder
            const placeholderId = crypto.randomUUID();
            setMessages((m) => [...m, { id: placeholderId, role: "user", text: "(uploading your answer...)" }]);

            const resp = await api.submitUtteranceAudio({
                sessionId, dayNumber, questionIdx: currentQuestion.question_idx, blob, token,
            });

            setMessages((m) => {
                const i = m.findIndex((x) => x.id === placeholderId);
                const before = i >= 0 ? m.slice(0, i) : m;
                const after = i >= 0 ? m.slice(i + 1) : [];
                return [
                    ...before,
                    { id: crypto.randomUUID(), role: "user", text: resp.transcript || "(no speech)" },
                    ...(resp?.correction?.feedback
                        ? [{ id: crypto.randomUUID(), role: "assistant", text: resp.correction.feedback }]
                        : []),
                    ...after,
                ];
            });

            if (resp.words?.length) {
                setSideWords((prev) => {
                    const seen = new Set(prev.map((w) => (w.word || "").toLowerCase()));
                    const extra = resp.words.filter((w) => !seen.has((w.word || "").toLowerCase()));
                    return [...prev, ...extra];
                });
            }
        } catch (e) {
            console.error(e); setNetError(e.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    }

    async function goNext() {
        if (!questions.length) return;
        if (isRecording) stopMic();
        const next = currentIdx + 1;
        if (next >= questions.length) return; // آخر سؤال

        setCurrentIdx(next);
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: questions[next].prompt_en }]);
    }

    async function finishLesson() {
        if (!sessionId) return;
        try {
            if (isRecording) stopMic();
            const token = await getToken();
            await api.finishSession({ sessionId, token });
            setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: "Great job! Session finished 🎉" }]);
        } catch (e) {
            console.error(e); setNetError(e.message || "Finish failed");
        }
    }

    function speak(text) {
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(u);
    }

    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    const atLastQuestion = !!questions.length && currentIdx === questions.length - 1;

    return (
        <div className="lesson-shell">
            <div className="lesson-top">
                <div className="lesson-title">
                    <span className="mascot">🫒</span>
                    <div>
                        <h1>{topic?.title_en || "Daily Lesson"}</h1>
                        <p>{topic ? `Level ${topic.level} • ~${topic.estimated_minutes} min` : "Choose a day and press Start"}</p>
                    </div>
                </div>

                <div className="lesson-actions">
                    <div className="day-picker">
                        <label>Day</label>
                        <input type="number" min={1} value={dayNumber}
                            onChange={(e) => setDayNumber(Number(e.target.value || 1))}
                            disabled={!!sessionId} />
                    </div>

                    {!sessionId ? (
                        <button className="start-btn" onClick={handleStart} disabled={loading}>
                            {loading ? "Starting..." : `Start Day ${dayNumber}`}
                        </button>
                    ) : (
                        <div className="done-actions">
                            <button className="finish-btn" onClick={finishLesson} disabled={loading}>
                                Finish Lesson
                            </button>
                            <button className="export-btn"
                                onClick={async () => {
                                    const token = await getToken();
                                    await api.downloadProtected({ url: api.urls.pdf(sessionId), filename: `lesson-day-${dayNumber}.pdf`, token });
                                }}
                                disabled={!sessionId}>
                                Download PDF
                            </button>
                            <button className="export-btn"
                                onClick={async () => {
                                    const token = await getToken();
                                    await api.downloadProtected({ url: api.urls.audio(sessionId), filename: `lesson-day-${dayNumber}.mp3`, token });
                                }}
                                disabled={!sessionId}>
                                Download Audio
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="lesson-body">
                <section className="chat-area">
                    <div className="bubbles" ref={chatRef}>
                        {messages.map((m) => (
                            <div key={m.id} className={`bubble ${m.role}`}>
                                <div className="text">{m.text}</div>
                            </div>
                        ))}

                        {sessionId && currentQuestion && (
                            <div className="center-question">
                                <div className="timer">⏳ {mm}:{ss}</div>
                                <h3 onClick={() => speak(currentQuestion.prompt_en)} title="Speak question">
                                    {currentQuestion.prompt_en}
                                </h3>
                            </div>
                        )}

                        {netError && <div className="net-error">⚠ {netError}</div>}
                    </div>

                    <div className="composer">
                        <button className={`mic ${isRecording ? "on" : ""}`}
                            onClick={() => (isRecording ? stopMic() : startMic())}
                            disabled={!sessionId || !currentQuestion}
                            title={isRecording ? "Stop & send" : "Record"}>
                            🎙️ {isRecording ? "Stop" : "Record"}
                        </button>

                        <button className="next" onClick={goNext}
                            disabled={!sessionId || !currentQuestion || atLastQuestion}>
                            Next
                        </button>
                    </div>
                </section>

                <aside className="vocab">
                    <div className="vocab-head">
                        <strong>Vocabs notebook</strong>
                        <span className="count">{sideWords.length} words</span>
                    </div>
                    {sideWords.length ? (
                        <ul className="vocab-list">
                            {sideWords.map((w) => (
                                <li key={w.word} className="vocab-item">
                                    <div>
                                        <b>{w.word}</b>{w.ipa ? <span className="ipa"> /{w.ipa}/</span> : null}
                                        {w.meaning ? <div className="meaning">{w.meaning}</div> : null}
                                        {w.example ? <div className="ex">“{w.example}”</div> : null}
                                    </div>
                                    <button className="speak" onClick={() => speak(w.word)} title="Pronounce">🔊</button>
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
