// /src/offline/db.js
import { set, get, del } from "idb-keyval";

export const saveTopics       = (items) => set("topics", items);
export const loadTopics       = () => get("topics");

export const saveSummaryJson  = (sessionId, json) => set(`summary:${sessionId}`, json);
export const loadSummaryJson  = (sessionId)        => get(`summary:${sessionId}`);
export const clearSummaryJson = (sessionId)        => del(`summary:${sessionId}`);

export const saveSummaryPdf   = (sessionId, blob)  => set(`summarypdf:${sessionId}`, blob);
export const loadSummaryPdf   = (sessionId)        => get(`summarypdf:${sessionId}`);

// ✅ Q&A log (السؤال/الجواب/التصحيح)
export const saveQALog        = (sessionId, log)   => set(`qalog:${sessionId}`, log || []);
export const loadQALog        = (sessionId)        => get(`qalog:${sessionId}`);
