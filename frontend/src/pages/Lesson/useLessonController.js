import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../../constants";
import { useLessonHeader } from "../../context/LessonContext";
import { connectRealtime } from "../../lib/realtime";
import { startSTT } from "../../utils/voice";
import { markCompleted } from "../../utils/progress";
import { saveSummaryJson, saveSummaryPdf, saveQALog } from "../../offline/db";

export default function useLessonController({ getToken, dayNumber, location, navigate }) {
  const { setLessonHeader } = useLessonHeader();

  const [sessionId, setSessionId] = useState(null);
  const [starting, setStarting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [messages, setMessages] = useState([]);
  const [liveText, setLiveText] = useState("");
  const [questionIdx, setQuestionIdx] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [words, setWords] = useState([]);
  const [err, setErr] = useState("");

  const [qaLog, setQaLog] = useState([]);
  const qaLogRef = useRef(qaLog);
  useEffect(() => { qaLogRef.current = qaLog; }, [qaLog]);

  const asArray = (v) => Array.isArray(v) ? v : [];

 useEffect(() => {
  const meta = location.state;

  async function fetchLessonDetails() {
    try {
      const res = await fetch(`${API_BASE}/api/my/topics`);
      if (!res.ok) return;
      const data = await res.json();
      const lesson = data.items.find(l => Number(l.day) === Number(dayNumber));
      if (!lesson) return;

      const subtitle = `Lesson ${dayNumber} — ${lesson.cefr} • ${lesson.num_questions || 6} questions`;

      setLessonHeader({
        title: lesson.topic || `Lesson ${dayNumber}`,
        subtitle,
      });
    } catch {}
  }

  if (meta?.title) {
    const shortDesc = meta.subtitle?.length > 50
      ? meta.subtitle.substring(0, 47) + "..."
      : meta.subtitle;

    setLessonHeader({
      title: meta.title,
      subtitle: `Lesson ${dayNumber} — ${shortDesc || ""}`,
    });
  } else {
    fetchLessonDetails();
  }
}, [location.state, dayNumber, setLessonHeader]);



  // 🎤 TTS
  function speakAsync(text) {
    return new Promise((res) => {
      const u = new SpeechSynthesisUtterance(String(text || ""));
      u.onend = res;
      try { speechSynthesis.speak(u); } catch { res(); }
    });
  }

  // 🎙️ Accurate Timer
  const tickerRef = useRef(null);
  const endTimeRef = useRef(0);
  const isPausedRef = useRef(false);
  const totalSecRef = useRef(0);

  const formatMMSS = (s) => {
    const sec = Math.max(0, Math.floor(s));
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  function startAccurateTimer(seconds, qIndex) {
    if (tickerRef.current) cancelAnimationFrame(tickerRef.current);
    isPausedRef.current = false;
    setIsPaused(false);
    totalSecRef.current = Number(seconds || 0);
    endTimeRef.current = Date.now() + totalSecRef.current * 500;
    setTimerLeft(totalSecRef.current);

    const tick = () => {
      if (isPausedRef.current) return tickerRef.current = requestAnimationFrame(tick);
      const leftMs = Math.max(0, endTimeRef.current - Date.now());
      const left = leftMs / 500;
      setTimerLeft(left);
      if (left <= 0) return;
      tickerRef.current = requestAnimationFrame(tick);
    };
    tickerRef.current = requestAnimationFrame(tick);
  }

  // 🎯 Start Lesson
  async function handleStart() {
    try {
      setStarting(true);
      setFinished(false);
      setMessages([]);
      setWords([]);
      setQaLog([]);

      const s = await connectRealtime(async () => {
        const t = await getToken({ template: "lexi-ws", skipCache: true });
        if (!t) throw new Error("Missing Clerk token");
        return t;
      });

      // ✅ Assign WS
      s.on("session_ready", ({ sessionId: sid }) => setSessionId(sid));
      s.on("system_say", async ({ text }) => {
        setMessages(m => [...m, { role: "ai", text }]);
        await speakAsync(text);
      });

      s.on("topic_vocab", ({ vocab }) => {
        if (Array.isArray(vocab)) setWords(vocab);
      });

      s.on("ask_question", ({ prompt, seconds, questionIdx }) => {
        setQuestionIdx(questionIdx);
        setMessages(m => [...m, { role: "ai", text: prompt }]);
        startAccurateTimer(seconds, questionIdx);
        startSTT({
          onPartial: setLiveText,
          onFinal: setLiveText
        });
      });

      s.on("lesson_finished", async () => {
        setFinished(true);
        await markCompleted(dayNumber, sessionId);
        navigate(`/summary/${sessionId}`);
      });

      s.on("error", ({ message }) => setErr(message));

      s.emit("start_day", { dayNumber });
    } catch (e) {
      setErr(e.message);
    } finally {
      setStarting(false);
    }
  }

  function handleStopAll() {
    isPausedRef.current = true;
    setIsPaused(true);
  }

  function handleResume() {
    isPausedRef.current = false;
    setIsPaused(false);
  }

  const handleGoToSummary = () => {
    if (sessionId) navigate(`/summary/${sessionId}`);
  };

  return {
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
    handleStopAll,
    handleResume,
    formatMMSS,
    handleGoToSummary,
  };
}