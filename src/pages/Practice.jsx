// src/pages/Practice.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PLAN from "../data/conversationPlan"; // ملف الخطة (60 يوم)
import "./Practice.css";

const speak = (text) =>
    new Promise((resolve) => {
        const u = new SpeechSynthesisUtterance(text);
        speechSynthesis.cancel();
        u.onend = resolve;
        speechSynthesis.speak(u);
    });

export default function Practice() {
    // TODO: اختاري منطق اليوم (من تاريخ اليوم/من الداشبورد/من آخر تقدّم)
    const [day, setDay] = useState(1);
    const [qIdx, setQIdx] = useState(0); // 0..5
    const [seconds, setSeconds] = useState(60);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    const plan = useMemo(() => PLAN.find((p) => p.day === day) || PLAN[0], [day]);
    const question = plan.questions[qIdx];

    const mediaRecRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);

    // ابدئي جلسة حفظ على السيرفر لكل يوم
    useEffect(() => {
        (async () => {
            const r = await fetch("http://localhost:3000/api/sessions/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ day }),
            });
            const data = await r.json();
            setSessionId(data?.session?.id || null);
        })();
    }, [day]);

    // بدء كل سؤال: ترحيب أول يوم/قراءة موضوع/السؤال/تشغيل دقيقة
    useEffect(() => {
        (async () => {
            if (!plan) return;
            if (qIdx === 0) {
                await speak(`Welcome! Day ${day}. Topic: ${plan.topic}.`);
            }
            await speak(`Question ${qIdx + 1}. ${question}`);
            await startOneMinute();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [day, qIdx]);

    // عدّاد الـ 60 ثانية
    useEffect(() => {
        if (!isRecording) return;
        if (seconds <= 0) {
            stopRecord();
            return;
        }
        const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [isRecording, seconds]);

    async function startOneMinute() {
        setTranscript("");
        setFeedback("");
        setSeconds(60);
        await startRecord();
    }

    async function startRecord() {
        chunksRef.current = [];
        streamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        mediaRecRef.current = new MediaRecorder(streamRef.current, {
            mimeType: "audio/webm",
        });
        mediaRecRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
        mediaRecRef.current.onstop = onStopRecord;
        mediaRecRef.current.start();
        setIsRecording(true);
    }

    function stopRecord() {
        if (!isRecording) return;
        setIsRecording(false);
        mediaRecRef.current?.stop();
        streamRef.current?.getTracks()?.forEach((t) => t.stop());
    }

    async function onStopRecord() {
        try {
            setIsBusy(true);
            // 1) أرسل التسجيل لتفريغ النص (Whisper)
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            const form = new FormData();
            form.append("audio", blob, "answer.webm");
            const transRes = await fetch(
                `http://localhost:3000/api/day/${day}/answer/${qIdx}`,
                {
                    method: "POST",
                    body: form,
                }
            );
            const transData = await transRes.json();
            const userText = transData?.transcript || "";
            setTranscript(userText || "(no transcript)");

            // 2) تقييم بالـ Gemini
            const assessRes = await fetch("http://localhost:3000/api/assess", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: question,
                    answer: userText,
                    cefr: plan.cefr,
                }),
            });
            const assessData = await assessRes.json();
            const fb = assessData?.feedback || assessData?.raw || "";
            const fbText =
                typeof fb === "object"
                    ? `Grammar: ${fb.grammar}/5\nVocabulary: ${fb.vocabulary}/5\nFluency: ${fb.fluency}/5\n\nCorrection: ${fb.correction}\n\n${fb.encouragement}`
                    : fb;
            setFeedback(fbText);

            // 3) احفظ الدور في Postgres
            if (sessionId) {
                await fetch("http://localhost:3000/api/turns/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        qIndex: qIdx,
                        question,
                        transcript: userText,
                        feedback: assessData?.feedback || null,
                    }),
                });
            }
        } catch (e) {
            console.error(e);
            setFeedback("(assessment/save error)");
        } finally {
            setIsBusy(false);
        }
    }

    async function next() {
        if (qIdx < 5) {
            setQIdx((i) => i + 1);
        } else {
            await speak("Great job! Session complete. See you tomorrow!");
            setDay((d) => Math.min(d + 1, 60));
            setQIdx(0);
        }
    }

    return (
        <div className="practice-wrap">
            <div className="topic-card">
                <div className="meta">
                    <span>Day {plan.day}</span>
                    <span>CEFR {plan.cefr}</span>
                </div>
                <h2>{plan.topic}</h2>
                <p className="q">
                    {qIdx + 1}. {question}
                </p>

                <div className="timer">{isRecording ? `⏱ ${seconds}s` : "⏸"}</div>

                <div className="controls">
                    {!isRecording ? (
                        <button onClick={startOneMinute}>▶️ Start 1 min</button>
                    ) : (
                        <button onClick={stopRecord}>⏹ Stop</button>
                    )}
                    <button onClick={() => speak(question)} disabled={isRecording}>
                        🔊 Read again
                    </button>
                </div>

                <div className="result">
                    <h4>Your transcript</h4>
                    <pre>{isBusy && !transcript ? "Transcribing…" : transcript}</pre>
                </div>

                <div className="feedback">
                    <h4>AI Feedback</h4>
                    <pre>{isBusy && transcript && !feedback ? "Scoring…" : feedback}</pre>
                </div>

                <div className="footer">
                    <button onClick={next} disabled={isRecording || isBusy}>
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
