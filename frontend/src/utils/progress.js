// src/utils/progress.js
// بسيط وخفيف: تخزين التقدّم محليًا لفتح الدروس تدريجيًا

const KEY_COMPLETED = "lexi.completedDays"; // Array<number> مثل [1,2,3]
const KEY_SUMMARIES = "lexi.summaryByDay";  // Map day->sessionId

function readJSON(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    if (!s) return fallback;
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getCompletedDays() {
  const arr = readJSON(KEY_COMPLETED, []);
  return Array.isArray(arr) ? arr : [];
}

export function isCompleted(day) {
  day = Number(day);
  const completed = getCompletedDays();
  return completed.includes(day);
}

export function markCompleted(day, sessionId) {
  day = Number(day);
  const completed = getCompletedDays();
  if (!completed.includes(day)) {
    completed.push(day);
    completed.sort((a, b) => a - b);
    writeJSON(KEY_COMPLETED, completed);
  }

  // احفظ آخر sessionId لزر الـ Summary (اختياري/مفيد)
  const map = readJSON(KEY_SUMMARIES, {});
  map[String(day)] = String(sessionId || "");
  writeJSON(KEY_SUMMARIES, map);
}

export function getSummarySessionId(day) {
  const map = readJSON(KEY_SUMMARIES, {});
  return map[String(day)] || null;
}

/**
 * منطق الفتح:
 * - يوم 1 دائمًا مفتوح
 * - أي يوم d مفتوح إذا كان اليوم (d-1) مكتمل
 */
export function isUnlocked(day) {
  day = Number(day);
  if (day <= 1) return true;
  return isCompleted(day - 1);
}

/** (اختياري) مسح التقدّم */
export function resetProgress() {
  writeJSON(KEY_COMPLETED, []);
  writeJSON(KEY_SUMMARIES, {});
}
