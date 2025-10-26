// src/utils/progress.js
// تخزين تقدّم المستخدم محليًا (قابل للربط لاحقًا مع الباك إند).
// الميزات:
// - حفظ أعلى يوم مفتوح (highestUnlocked)
// - قائمة الأيام المُنجزة (completed)
// - ربط كل يوم بـ sessionId لفتح ملخّص الدرس الصحيح (sessions[day] = sessionId)

const KEY = "lessonProgress";
const VERSION = 2;

/*
  الشكل الحالي (v2):

  {
    version: 2,
    highestUnlocked: 1,
    completed: [1, 2, ...],      // أرقام الأيام المُنجزة (بدون تكرار)
    sessions: { "1": "sess-123" },// sessionId لكل يوم مُنجز (اختياري)
    lastUpdated: 173...           // timestamp
  }
*/

function nowTs() {
    return Date.now ? Date.now() : new Date().getTime();
}

function normalizeState(raw) {
    // v1 أو غير معروف:
    // v1: { highestUnlocked: 1, completed: [] }
    const base = {
        version: VERSION,
        highestUnlocked: 1,
        completed: [],
        sessions: {},
        lastUpdated: nowTs(),
    };

    if (!raw || typeof raw !== "object") return base;

    const s = { ...base, ...raw };

    // تأكد من الأنواع
    s.version = Number(s.version) || VERSION;
    s.highestUnlocked = Math.max(1, Number(s.highestUnlocked) || 1);

    // نظّف completed: أرقام فريدة مرتّبة
    if (!Array.isArray(s.completed)) s.completed = [];
    s.completed = [...new Set(s.completed.map(n => Number(n)).filter(n => Number.isFinite(n) && n >= 1))].sort((a, b) => a - b);

    // sessions: مفاتيح كنصوص
    if (!s.sessions || typeof s.sessions !== "object") s.sessions = {};
    const fixedSessions = {};
    for (const k of Object.keys(s.sessions)) {
        const dayNum = Number(k);
        if (Number.isFinite(dayNum) && dayNum >= 1) {
            const v = s.sessions[k];
            if (typeof v === "string" && v.trim()) fixedSessions[String(dayNum)] = v.trim();
        }
    }
    s.sessions = fixedSessions;

    // lastUpdated
    s.lastUpdated = Number(s.lastUpdated) || nowTs();

    // ترقية إن لزم
    if (s.version < VERSION) {
        s.version = VERSION;
    }

    return s;
}

function read() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return normalizeState(null);
        return normalizeState(JSON.parse(raw));
    } catch {
        return normalizeState(null);
    }
}

function write(state) {
    try {
        const s = { ...state, lastUpdated: nowTs(), version: VERSION };
        localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
        // تجاهل أخطاء التخزين الصامتة
    }
}

// ---- واجهة عامة ----

export function getProgress() {
    return read();
}

/** هل اليوم مفتوح؟ الأول دائمًا مفتوح؛ وما بعده ينفتح إذا أعلى مفتوح >= اليوم */
export function isUnlocked(day) {
    const d = Number(day) || 1;
    const p = read();
    return d <= (p.highestUnlocked || 1);
}

/** هل اليوم مُنجز؟ */
export function isCompleted(day) {
    const d = Number(day) || 1;
    const p = read();
    return Array.isArray(p.completed) && p.completed.includes(d);
}

/** أعطني sessionId المرتبط بيوم (إن وجد) */
export function getSessionForDay(day) {
    const d = Number(day) || 1;
    const p = read();
    return p.sessions?.[String(d)] || null;
}

/** اربطي sessionId بيوم (لا يعلّم إنجاز تلقائيًا) */
export function setSessionForDay(day, sessionId) {
    const d = Number(day) || 1;
    const sid = (sessionId || "").trim();
    const p = read();
    if (!p.sessions) p.sessions = {};
    if (sid) {
        p.sessions[String(d)] = sid;
    } else {
        delete p.sessions[String(d)];
    }
    write(p);
}

/**
 * علّمي اليوم كمُنجز وافتحي الذي يليه.
 * - يمنع التكرار في completed
 * - يخزّن sessionId إن تم تمريره
 */
export function markCompleted(day, sessionId) {
    const d = Number(day) || 1;
    const p = read();

    if (!p.completed.includes(d)) p.completed.push(d);
    // افتح اليوم الذي يليه
    const next = d + 1;
    if ((p.highestUnlocked || 1) < next) {
        p.highestUnlocked = next;
    }

    if (sessionId && typeof sessionId === "string" && sessionId.trim()) {
        if (!p.sessions) p.sessions = {};
        p.sessions[String(d)] = sessionId.trim();
    }

    // ترتيب للاتساق
    p.completed = [...new Set(p.completed)].sort((a, b) => a - b);

    write(p);
}

/** افتحي اليوم الذي يلي اليوم المعطى (بدون تعلّم إنجاز) */
export function unlockNext(day) {
    const d = Number(day) || 1;
    const p = read();
    const next = d + 1;
    if ((p.highestUnlocked || 1) < next) {
        p.highestUnlocked = next;
        write(p);
    }
}

/** إعادة التقدّم للحالة الافتراضية */
export function resetProgress() {
    write({
        version: VERSION,
        highestUnlocked: 1,
        completed: [],
        sessions: {},
    });
}

/**
 * مُساعد اختياري: جهّز بيانات واجهة شبكة الدروس بسرعة
 * lessons: [{ id: 1 }, { id: 2 }, ...] -> يحقن unlocked/completed/sessionId
 */
export function mapLessonsWithProgress(lessons = []) {
    const p = read();
    return lessons.map((l) => {
        const id = Number(l.id) || 1;
        return {
            ...l,
            unlocked: id <= (p.highestUnlocked || 1),
            completed: p.completed.includes(id),
            sessionId: p.sessions?.[String(id)] || null,
        };
    });
}
