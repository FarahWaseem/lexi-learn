// /src/pages/Summary.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import "./LessonSammary.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  saveSummaryJson,
  loadSummaryJson,
  saveSummaryPdf,
  loadSummaryPdf,
  loadQALog,        // ✅ لنقرأ الـQ&A وقت التصدير فقط
} from "../offline/db";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:3001";

async function fetchWithTimeout(input, init = {}, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(input, { ...init, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

// ✅ توليد PDF محلي: يضم الموضوع + Q&A + بقية الأقسام (بدون إظهارها في UI)
function buildClientPDF(data, qaLog = []) {
  const {
    lesson,
    performance,
    recap,
    vocab = [],
    positivePoints = [],
    grammarFeedback = "",
  } = data || {};

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`Lesson ${lesson?.day ?? "?"} — ${lesson?.title || "Summary"}`, 40, 50);

  // معلومات عامة
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Level: ${lesson?.level || "-"}`, 40, 75);
  doc.text(`Performance: ${Number(performance ?? 0)}%`, 40, 92);

  // Recap
  doc.setFont("helvetica", "bold");
  doc.text("Lesson Recap", 40, 125);
  doc.setFont("helvetica", "normal");
  doc.text(recap || "-", 40, 145, { maxWidth: 515 });

  // ✅ Q&A فقط داخل الـPDF
  let y = 185;
  doc.setFont("helvetica", "bold");
  doc.text("Q&A Details", 40, y);
  y += 12;

  const sortedQA = [...(qaLog || [])].sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));
  if (sortedQA.length) {
    sortedQA.forEach((q) => {
      const startY = y + 12;
      doc.setFont("helvetica", "bold");
      doc.text(`Q${q.idx}: ${q.prompt || "-"}`, 40, startY);
      y = startY + 16;

      doc.setFont("helvetica", "normal");
      doc.text(`You: ${q.userText || "-"}`, 40, y, { maxWidth: 515 });
      y += 16;

      if (q.correction) {
        const fb = String(q.correction?.feedback || "").replace(/^feedback:\s*/i, "").trim();
        if (fb) { doc.text(`Feedback: ${fb}`, 40, y, { maxWidth: 515 }); y += 16; }

        if (q.correction?.corrected) {
          doc.text(`Try: ${q.correction.corrected}`, 40, y, { maxWidth: 515 });
          y += 16;
        }

        const issues = Array.isArray(q.correction?.issues) ? q.correction.issues : [];
        if (issues.length) {
          autoTable(doc, {
            startY: y + 6,
            head: [["Before", "After", "Note"]],
            body: issues.map(it => [it.before || "", it.after || "", it.note || it.type || ""]),
            styles: { fontSize: 10, cellPadding: 5 },
            headStyles: { fillColor: [34, 197, 94] },
            margin: { left: 40, right: 40 },
          });
          y = (doc.lastAutoTable?.finalY || y) + 12;
        }
      }

      // خط فاصل
      doc.setDrawColor(220);
      doc.line(40, y, 555, y);
      y += 12;

      if (y > 760) { doc.addPage(); y = 60; }
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.text("No Q&A captured.", 40, y + 8);
    y += 24;
  }

  // Vocabulary
  if (vocab.length) {
    doc.setFont("helvetica", "bold");
    doc.text("New Vocabulary", 40, y);
    autoTable(doc, {
      startY: y + 10,
      head: [["Word", "Meaning"]],
      body: vocab.map(v => [v.word || "", v.meaning || ""]),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 40, right: 40 },
    });
    y = (doc.lastAutoTable?.finalY || y) + 18;
  }

  // Positives
  const positives = positivePoints.length ? positivePoints : ["Keep going — progress comes with practice!"];
  doc.setFont("helvetica", "bold");
  doc.text("Positive Points", 40, y);
  doc.setFont("helvetica", "normal");
  doc.text(positives.map((p) => `• ${p}`).join("\n"), 40, y + 18, { maxWidth: 515 });
  y += 18 + positives.length * 14 + 18;

  // Grammar Feedback
  doc.setFont("helvetica", "bold");
  doc.text("Grammar Feedback", 40, y);
  doc.setFont("helvetica", "normal");
  const gf = (grammarFeedback || "")
    .split(/[-•–]\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  doc.text((gf.length ? gf.map((g) => `• ${g}`) : ["No feedback."]).join("\n"), 40, y + 18, { maxWidth: 515 });

  return doc;
}

export default function Summary() {
  const { id } = useParams(); // sessionId
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [downloading, setDownloading] = useState(false);

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // زر التحميل — بيقرأ Q&A من IndexedDB فقط وقت التصدير
  async function handleDownloadPDF() {
    try {
      setDownloading(true);
      const fname = data?.lesson?.day != null ? `lesson-${data.lesson.day}.pdf` : `lesson-${id}.pdf`;

      // 1) أوفلاين أولاً
      const cached = await loadSummaryPdf(id);
      if (cached) { downloadBlob(fname, cached); return; }

      // 2) سيرفر لو موجود
      try {
        const token = await getToken();
        const r = await fetch(`${API_BASE}/api/sessions/${id}/export.pdf`, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const blob = await r.blob();
        try { await saveSummaryPdf(id, blob); } catch {}
        downloadBlob(fname, blob);
        return;
      } catch {
        // 3) توليد محلي: حمّل Q&A من IndexedDB وبنِ PDF
        const qaLog = (await loadQALog(id)) || [];
        if (!data) throw new Error("No summary data to export");
        const doc = buildClientPDF(data, qaLog);
        const blob = doc.output("blob");
        try { await saveSummaryPdf(id, blob); } catch {}
        downloadBlob(fname, blob);
      }
    } catch (e) {
      alert(e?.message || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  }

  // نجيب JSON فقط للعرض (بدون Q&A)
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetchWithTimeout(
          `${API_BASE}/api/sessions/${id}/lesson-summary?t=${Date.now()}`,
          { cache: "no-store" }, 20000
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!abort) setData(json);
        await saveSummaryJson(id, json);
      } catch (e) {
        const cached = await loadSummaryJson(id);
        if (cached && !abort) setData(cached);
        else if (!abort) setErr(e.message || "Failed to load summary");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
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

  const grammarItems = (grammarFeedback || "")
    .split(/[-•–]\s+/)
    .map((s) =>
      s
        .trim()
        .replace(/^Speaking (feedback|tips)[:]?/i, "")
        .replace(/^Key issues[:]?/i, "")
    )
    .filter(Boolean);

  const goToNextLesson = () => {
    const nextDay = Math.max(1, Number(lesson?.day || 1) + 1);
    navigate(`/lesson1?day=${nextDay}`);
  };

  return (
    <div className="summary-page">
      <div className="summary-header">
        <h2>Summary of Lesson {lesson.day}</h2>
        <button className="pdf-btn" onClick={handleDownloadPDF} disabled={downloading}>
          {downloading ? "Preparing…" : "Download as PDF"}
        </button>
      </div>

      <div className="summary-grid">
        <div className="card congrat" aria-live="polite">
          <div>
            <h3>Congratulation !!</h3>
            <p>Keep it up, you’re improving every day</p>
            <small>You have successfully completed Lesson {lesson.day}. Keep learning step by step every day!</small>
          </div>
        </div>

        <div className="card perf">
          <div
            className="perf-ring"
            style={{ background: `conic-gradient(#22c55e 0deg ${performance * 3.6}deg, #e6e6e6 ${performance * 3.6}deg 360deg)` }}
            role="img"
            aria-label={`Performance ${performance} percent`}
            title={`Performance ${performance}%`}
          >
            <span>{performance}%</span>
          </div>
          <div className="perf-caption">Performance in this lesson</div>
        </div>

        <div className="card">
          <h4>Lesson Recap</h4>
          <p>{recap}</p>
        </div>

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
          ) : <p>No new words for this lesson.</p>}
        </div>

        <div className="card">
          <h4>Positive Points</h4>
          {positivePoints.length ? (
            <ul className="bullets">
              {positivePoints.map((p, i) => (<li key={`${p}-${i}`}>{p}</li>))}
            </ul>
          ) : <p>Keep going — progress comes with practice!</p>}
        </div>

        <div className="card">
          <h4>Grammar Feedback</h4>
          {grammarItems.length ? (
            <ul className="grammar-list">
              {grammarItems.map((line, i) => (<li key={i}>{line}</li>))}
            </ul>
          ) : <p>No feedback yet.</p>}
        </div>
      </div>

      <div className="summary-footer">
        <button className="ghost" type="button">Vocabulary Notebook</button>
        <div style={{ flex: 1 }} />
        <button className="primary" type="button" onClick={goToNextLesson}>Next Lesson</button>
      </div>
    </div>
  );
}
