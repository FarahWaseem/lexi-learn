const { GoogleGenerativeAI } = require("@google/generative-ai");
const LT_ENDPOINT = "https://api.languagetool.org/v2/check";

// ========== شكل الاستجابة الموحّد ==========
/**
 * نرجّع دائماً:
 * {
 *   feedback: string,         // تعليق موجز
 *   corrected: string,        // النص المصحّح (سطر واحد)
 *   issues: [                 // قائمة أخطاء
 *     { type: "grammar|spelling|word-choice", before: "...", after: "...", note: "explain briefly" }
 *   ],
 *   fluency: number, grammar: number, vocab: number
 * }
 */
function normalizeResult(obj = {}, original = "") {
    return {
        feedback: obj.feedback || "Good effort. See suggested fixes.",
        corrected: obj.corrected || original,
        issues: Array.isArray(obj.issues) ? obj.issues.slice(0, 10) : [],
        fluency: Number.isFinite(obj.fluency) ? obj.fluency : 70,
        grammar: Number.isFinite(obj.grammar) ? obj.grammar : 70,
        vocab: Number.isFinite(obj.vocab) ? obj.vocab : 70,
    };
}

// ========== Gemini (أولوية أولى) ==========
async function tryGeminiCorrection(text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const genAI = new GoogleGenerativeAI(apiKey);
    // لو بدك أدقّ، جرّبي pro. flash أسرع وأرخص.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const system = `
You are an English tutor. Return STRICT JSON only with this schema:
{
  "feedback": "1-2 sentence global feedback",
  "corrected": "a polished, corrected version of the learner sentence(s) in one short paragraph",
  "issues": [
    {"type":"grammar|spelling|word-choice","before":"...","after":"...","note":"brief reason"}
  ],
  "fluency": 0-100,
  "grammar": 0-100,
  "vocab": 0-100
}
Rules:
- Keep JSON valid, no markdown, no extra text.
- Keep "corrected" as one short paragraph (no line breaks).
- Be concise. Don't add fields not in the schema.
`;

    const user = `Learner text:\n${text}`;

    const generationConfig = {
        temperature: 0.3,
        // أهم سطر لضمان JSON:
        responseMimeType: "application/json",
    };

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: system + "\n\n" + user }] }],
        generationConfig,
    });

    const raw = result.response?.text?.() || result.response?.text || "";
    // بعض إصدارات SDK ترجع .text() كدالة، وبعضها كخاصية
    const json = typeof raw === "function" ? await raw() : raw;

    let parsed;
    try {
        parsed = JSON.parse(json);
    } catch {
        // إذا صار وتسرّب نص قبل/بعد JSON
        const match = json.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : {};
    }

    return normalizeResult(parsed, text);
}

// ========== LanguageTool Fallback (مجاناً) ==========
async function tryLanguageTool(text) {
    // ملاحظة: النسخة العامة محدودة؛ ممتازة كخطة ب
    const params = new URLSearchParams({
        text,
        language: "en-US",
    });

    const res = await fetch(LT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    if (!res.ok) throw new Error(`LanguageTool HTTP ${res.status}`);
    const data = await res.json();

    // بناء نص مصحّح بسيط
    let corrected = text;
    const issues = [];
    // طبّقي التعديلات من آخر لِأول لتجنّبي انزياح الإندكس
    const matchesSorted = (data.matches || []).sort((a, b) => (b.offset - a.offset));

    for (const m of matchesSorted) {
        const before = corrected.slice(m.offset, m.offset + m.length);
        const replacement = m.replacements?.[0]?.value || before;
        corrected = corrected.slice(0, m.offset) + replacement + corrected.slice(m.offset + m.length);

        issues.push({
            type: m.rule?.issueType || "grammar",
            before,
            after: replacement,
            note: m.message || "",
        });
    }

    // تقديرات درجات بسيطة بناءً على عدد الأخطاء وطول النص
    const len = Math.max(1, text.split(/\s+/).length);
    const penalty = Math.min(40, Math.round((issues.length / len) * 100));
    const base = 85 - Math.floor(penalty * 0.6);

    return normalizeResult(
        {
            feedback: issues.length ? "I fixed several issues below." : "Looks good with minor or no issues.",
            corrected,
            issues,
            fluency: Math.max(50, base),
            grammar: Math.max(50, base - 5),
            vocab: Math.max(50, 80), // LT ما يقيم مفردات بدقّة، نخليها ثابتة جيدة
        },
        text
    );
}

// ========== الدالة العامة ==========
async function generateCorrection(text) {
    try {
        const g = await tryGeminiCorrection(text);
        return g;
    } catch (e) {
        console.warn("Gemini failed, falling back to LanguageTool:", e.message);
        try {
            const lt = await tryLanguageTool(text);
            return lt;
        } catch (e2) {
            console.error("Both Gemini and LT failed:", e2);
            return normalizeResult({}, text);
        }
    }
}

module.exports.generateCorrection = generateCorrection;
