function buildDetailedFeedback({ feedback, corrected, issues }) {
  const raw = String(feedback || "").trim().replace(/^feedback:\s*/i, "").trim();
  const headerText = raw || "Good effort. See suggested fixes.";
  const correctedPart =
    corrected && String(corrected).trim() ? `\n\nCorrected:\n${String(corrected).trim()}` : "";
  const issuesPart =
    Array.isArray(issues) && issues.length
      ? `\n\nIssues:\n` +
        issues
          .slice(0, 10)
          .map((it, i) => `- ${i + 1}. [${it.type || "grammar"}] "${it.before || ""}" → "${it.after || ""}" — ${it.note || ""}`)
          .join("\n")
      : "";
  return (headerText + correctedPart + issuesPart).replace(/\n{3,}/g, "\n\n").slice(0, 4000);
}

module.exports = { buildDetailedFeedback };

