// src/services/apiClient.js
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/** طلب عام يعيد JSON أو يرمي خطأ مفهوم */
async function jfetch(path, { method = "GET", headers = {}, body, isForm = false } = {}) {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: isForm ? headers : { "Content-Type": "application/json", ...headers },
        body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* قد يكون ملف */ }

    if (!res.ok) throw new Error(`${res.status}: ${data?.error || text || res.statusText}`);
    return data ?? text;
}

/** بدء جلسة (يتطلب Bearer من Clerk) */
export function startSession({ dayNumber, token }) {
    return jfetch(`/api/sessions/start`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: { dayNumber },
    });
}

/** رفع إجابة صوتية لسؤال واحد */
export async function submitUtteranceAudio({ sessionId, dayNumber, questionIdx, blob, token }) {
    const fd = new FormData();
    fd.append("sessionId", sessionId);
    fd.append("dayNumber", String(dayNumber));
    fd.append("questionIdx", String(questionIdx));
    fd.append("audio", new File([blob], `q${questionIdx}.webm`, { type: blob.type || "audio/webm" }));

    const res = await fetch(`${BASE}/api/utterances/audio`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
}

/** إنهاء الجلسة */
export function finishSession({ sessionId, token }) {
    return jfetch(`/api/sessions/${sessionId}/finish`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
}

/** تنزيل ملف محمي بالتوكن (PDF/Audio) */
export async function downloadProtected({ url, filename, token }) {
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
}

export const urls = {
    pdf: (id) => `${BASE}/api/sessions/${id}/export.pdf`,
    audio: (id) => `${BASE}/api/sessions/${id}/export-audio`,
};
