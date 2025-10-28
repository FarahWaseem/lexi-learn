// /src/utils/voice.js

/** نطق نص عبر Web Speech API */
export function speak(text) {
    try {
        if (!window.speechSynthesis) return;
        const u = new SpeechSynthesisUtterance(String(text || ""));
        // اترك الصوت/اللغة الافتراضية أو غيّرها لاحقًا
        u.rate = 1; u.pitch = 1; u.volume = 1;
        window.speechSynthesis.cancel(); // ألغِ أي كلام سابق
        window.speechSynthesis.speak(u);
    } catch { }
}

/**
 * بدء STT بترجيعات فورية ونهائية.
 * تُرجع كائنًا فيه stop() لإيقاف الاستماع.
 */
export function startSTT({ onPartial, onFinal } = {}) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
        // متصفح لا يدعم STT — نستسلم بهدوء
        return { stop() { } };
    }

    const rec = new SpeechRec();
    rec.lang = "en-US";         // عدّلها إن أردت
    rec.continuous = true;
    rec.interimResults = true;

    let finalSoFar = "";

    rec.onresult = (e) => {
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) {
                finalSoFar += res[0].transcript + " ";
                onFinal?.(finalSoFar.trim());
            } else {
                live += res[0].transcript;
            }
        }
        if (live) onPartial?.(live);
    };

    rec.onerror = () => { };
    rec.onend = () => { };

    try { rec.start(); } catch { }

    return {
        stop() {
            try { rec.stop(); } catch { }
        },
    };
}
