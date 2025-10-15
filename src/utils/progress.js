// تخزين تقدّم المستخدم محليًا (مؤقتًا). لاحقًا منقدر نربطه بباك إند.
const KEY = "lessonProgress";

function read() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    // الحالة الابتدائية: اليوم 1 مفتوح، ولا شيء مُنجز
    return { highestUnlocked: 1, completed: [] };
}

function write(p) {
    localStorage.setItem(KEY, JSON.stringify(p));
}

export function getProgress() {
    return read();
}

export function isUnlocked(day) {
    const p = read();
    return day <= (p.highestUnlocked || 1);
}

export function isCompleted(day) {
    const p = read();
    return Array.isArray(p.completed) && p.completed.includes(day);
}

export function markCompleted(day) {
    const p = read();
    if (!p.completed.includes(day)) p.completed.push(day);
    // افتح اليوم اللي بعده
    if ((p.highestUnlocked || 1) < day + 1) {
        p.highestUnlocked = day + 1;
    }
    write(p);
}

export function unlockNext(day) {
    const p = read();
    if ((p.highestUnlocked || 1) < day + 1) {
        p.highestUnlocked = day + 1;
        write(p);
    }
}

export function resetProgress() {
    write({ highestUnlocked: 1, completed: [] });
}
