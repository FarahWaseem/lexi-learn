// src/services/correction.js
// ✅ Gemini v1beta (response_mime_type) + LanguageTool fallback (تنظيف وتحمل أخطاء)

const LT_ENDPOINT = "https://api.languagetool.org/v2/check";

/* ----------------------------- helpers ----------------------------- */
function normalizeResult(obj = {}, original = "") {
    return {
        original: String(original || ""),
        corrected:
            obj.corrected && String(obj.corrected).trim()
                ? String(obj.corrected).trim()
                : String(original || ""),
        feedback: obj.feedback || "Good effort. See suggested fixes.",
        issues: Array.isArray(obj.issues) ? obj.issues.slice(0, 12) : [],
        fluency: Number.isFinite(obj.fluency) ? obj.fluency : 70,
        grammar: Number.isFinite(obj.grammar) ? obj.grammar : 70,
        vocab: Number.isFinite(obj.vocab) ? obj.vocab : 70,
    };
}

function safeParseJson(maybeJson) {
    if (!maybeJson) return {};
    try {
        return JSON.parse(maybeJson);
    } catch {
        const m = String(maybeJson).match(/\{[\s\S]*\}/);
        if (m) {
            try { return JSON.parse(m[0]); } catch { }
        }
        return {};
    }
}

// اختيار fetch المتاح
const _fetch = (typeof fetch === "function")
    ? fetch
    : (() => {
        try { return require("node-fetch"); } catch { return null; }
    })();

// شبكة بمهلة — تستخدم AbortController المتاح أو تكمل بدونه
async function fetchWithTimeout(url, options = {}, ms = 15000) {
    if (!_fetch) throw new Error("fetch is unavailable (install node-fetch)");
    let AC = typeof AbortController !== "undefined" ? AbortController : null;
    if (!AC) {
        try {
            AC = require("abort-controller").AbortController;
        } catch {
            AC = null;
        }
    }

    if (!AC) {
        // لا يوجد AbortController — طلب عادي بدون إلغاء
        return _fetch(url, options);
    }

    const ctrl = new AC();
    const t = setTimeout(() => {
        try { ctrl.abort(); } catch { }
    }, ms);

    try {
        const res = await _fetch(url, { ...options, signal: ctrl.signal });
        return res;
    } finally {
        clearTimeout(t);
    }
}

function ltScores(issuesCount, tokenCount) {
    const len = Math.max(1, tokenCount || 1);
    const density = issuesCount / len;
    const penalty = Math.min(45, Math.round(density * 100));
    const base = Math.max(50, 90 - Math.floor(penalty * 0.7));
    return { fluency: base, grammar: Math.max(50, base - 5), vocab: Math.max(55, 80) };
}

/* ------------------ LanguageTool: clean & apply -------------------- */
function cleanupLtMatches(matches = [], text = "") {
    const NOISE_RULES = new Set([
        "EN_QUOTES",
        "UPPERCASE_SENTENCE_START",
        "WHITESPACE_RULE",
        "MULTIPLICATION_SIGN",
        "EN_UNPAIRED_BRACKETS",
        "DASH_RULE",
        "COMMA_PARENTHESIS_WHITESPACE",
        "MORFOLOGIK_RULE_EN_US",
    ]);
    const out = [];
    for (const m of matches) {
        const id = m.rule?.id || "";
        const issueType = (m.rule?.issueType || "").toLowerCase();
        const before = text.slice(m.offset, m.offset + m.length);
        const after = m.replacements?.[0]?.value || before;
        if (!before || before === after) continue;

        const isWhitespaceOnly = before.trim() === "" && after.trim() === "";
        const isNoiseRule = NOISE_RULES.has(id);
        const onlyCase =
            /^[A-Za-z]+$/.test(before) &&
            before.toLowerCase() === after.toLowerCase() &&
            before !== after;
        if (isWhitespaceOnly || isNoiseRule || onlyCase) continue;

        const keep = ["grammar", "misspelling", "spelling", "word choice", "style"].some((k) =>
            (issueType || m.rule?.description || "").toLowerCase().includes(k)
        );
        if (!keep) continue;

        out.push({
            type: issueType || "grammar",
            before,
            after,
            note: m.message || m.rule?.description || "",
            offset: m.offset,
            length: m.length,
        });
    }
    const uniq = [];
    const seen = new Set();
    for (const it of out) {
        const key = `${it.type}|${it.before}|${it.after}|${it.note}|${it.offset}`;
        if (seen.has(key)) continue;
        seen.add(key);
        uniq.push(it);
    }
    return uniq.slice(0, 24);
}

function applyLtCorrections(original, matchesWithOffsets) {
    // طبّق من النهاية للبداية حتى لا تتغيّر الإزاحات
    const sorted = [...matchesWithOffsets].sort((a, b) => b.offset - a.offset);
    let corrected = original;
    for (const m of sorted) {
        const before = corrected.slice(m.offset, m.offset + m.length);
        if (!before) continue;
        corrected =
            corrected.slice(0, m.offset) + m.after + corrected.slice(m.offset + m.length);
    }
    const issues = matchesWithOffsets
        .slice(0, 12)
        .map(({ type, before, after, note }) => ({ type, before, after, note }));
    return { corrected, issues };
}

/* ------------------------------- Gemini ---------------------------- */
// ✅ v1beta + response_mime_type (snake_case) + منع أي نص غير JSON
async function tryGemini(text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        MODEL
    )}:generateContent`;

    const prompt = `
You are an English speaking coach. Respond with STRICT JSON only, no code fences, no markdown, no extra text.
Schema:
{
  "feedback": "1 short sentence with the most helpful global advice",
  "corrected": "a concise corrected version (<= 20 words)",
  "issues": [
    {"before":"...","after":"...","note":"why the change (<=8 words)"}
  ],
  "fluency": 0-100,
  "grammar": 0-100,
  "vocab": 0-100
}
Rules:
- Max 3–4 issues.
- No reading speed, no WPM, no long explanations.
- Keep it simple and actionable.
- Do NOT include markdown or code blocks.
Student speech:
"""${text}"""`.trim();

    const body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.3,
            response_mime_type: "application/json", // 👈 snake_case per v1beta
        },
    };

    const res = await fetchWithTimeout(
        `${url}?key=${encodeURIComponent(apiKey)}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        },
        15000
    );

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Gemini HTTP ${res.status}: ${txt.slice(0, 200)}`);
    }

    const data = await res.json();
    const raw =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ||
        "{}";
    const parsed = safeParseJson(raw);

    // فلترة قضايا الضجيج/التكرار
    const seenPairs = new Set();
    const issues = Array.isArray(parsed.issues)
        ? parsed.issues
            .filter((it) => it && it.before && it.after && it.before !== it.after)
            .filter((it) => {
                const type = String(it.type || "").toLowerCase();
                if (/(whitespace|spacing|punctuation|quote|capitalization)/.test(type)) return false;
                const onlyCase =
                    /^[A-Za-z]+$/.test(it.before) &&
                    it.before.toLowerCase() === String(it.after || "").toLowerCase();
                if (onlyCase) return false;
                const key = `${it.before}=>${it.after}`.toLowerCase();
                if (seenPairs.has(key)) return false;
                seenPairs.add(key);
                return true;
            })
            .slice(0, 4)
        : [];

    return normalizeResult(
        {
            feedback: parsed.feedback,
            corrected: parsed.corrected,
            issues,
            fluency: Number(parsed.fluency),
            grammar: Number(parsed.grammar),
            vocab: Number(parsed.vocab),
        },
        text
    );
}

/* --------------------------- LanguageTool --------------------------- */
async function tryLanguageTool(text) {
    const params = new URLSearchParams({ text, language: "en-US" });
    const res = await fetchWithTimeout(
        LT_ENDPOINT,
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        },
        12000
    );
    if (!res.ok) throw new Error(`LanguageTool HTTP ${res.status}`);
    const data = await res.json();

    const matches = Array.isArray(data.matches) ? data.matches : [];
    const cleaned = cleanupLtMatches(matches, text);
    const { corrected, issues } = applyLtCorrections(text, cleaned);

    const tokens = String(text).trim().split(/\s+/).filter(Boolean).length;
    const scores = ltScores(issues.length, tokens);
    const feedback = issues.length
        ? "I fixed several issues. See highlights below."
        : "Looks good overall with minor or no issues.";

    return normalizeResult({ feedback, corrected, issues, ...scores }, text);
}

/* ------------------------------ Public ----------------------------- */
async function generateCorrection(text) {
    const input = String(text || "").trim();
    if (!input) {
        return normalizeResult(
            {
                feedback: "Please write something so I can correct it.",
                corrected: "",
                issues: [],
                fluency: 0,
                grammar: 0,
                vocab: 0,
            },
            ""
        );
    }
    try {
        return await tryGemini(input);
    } catch (e) {
        console.warn("[correction] Gemini failed:", e?.message || e);
        try {
            return await tryLanguageTool(input);
        } catch (e2) {
            console.error("[correction] Both Gemini and LT failed:", e2?.message || e2);
            return normalizeResult(
                {
                    feedback: "Unable to correct right now. Try again later.",
                    corrected: input,
                    issues: [],
                    fluency: 70,
                    grammar: 70,
                    vocab: 70,
                },
                input
            );
        }
    }
}

module.exports = { generateCorrection };
