// /src/offline/db.js
import { set, get, del, keys } from "idb-keyval";

// ============================================
// Topics / Lessons
// ============================================
export const saveTopics = (items) => set("topics", items);
export const loadTopics = () => get("topics");
export const clearTopics = () => del("topics");

// ============================================
// Session Summaries
// ============================================
export const saveSummaryJson = (sessionId, json) => set(`summary:${sessionId}`, json);
export const loadSummaryJson = (sessionId) => get(`summary:${sessionId}`);
export const clearSummaryJson = (sessionId) => del(`summary:${sessionId}`);

export const saveSummaryPdf = (sessionId, blob) => set(`summarypdf:${sessionId}`, blob);
export const loadSummaryPdf = (sessionId) => get(`summarypdf:${sessionId}`);

// ✅ Q&A log (السؤال/الجواب/التصحيح)
export const saveQALog = (sessionId, log) => set(`qalog:${sessionId}`, log || []);
export const loadQALog = (sessionId) => get(`qalog:${sessionId}`);

// ============================================
// Vocabulary
// ============================================
export const saveVocabulary = (vocab) => set("vocabulary", vocab);
export const loadVocabulary = () => get("vocabulary");
export const clearVocabulary = () => del("vocabulary");

// ============================================
// Dashboard Data
// ============================================
export const saveDashboardData = (data) => set("dashboard", data);
export const loadDashboardData = () => get("dashboard");
export const clearDashboardData = () => del("dashboard");

// ============================================
// User Progress
// ============================================
export const saveUserProgress = (progress) => set("user_progress", progress);
export const loadUserProgress = () => get("user_progress");
export const clearUserProgress = () => del("user_progress");

// ============================================
// Last Route (for offline restoration)
// ============================================
export const saveLastRoute = (route) => set("last_route", route);
export const loadLastRoute = () => get("last_route");
export const clearLastRoute = () => del("last_route");

// ============================================
// Offline State
// ============================================
export const saveOfflineState = (state) => set("offline_state", { ...state, timestamp: Date.now() });
export const loadOfflineState = () => get("offline_state");
export const clearOfflineState = () => del("offline_state");

// ============================================
// Utility Functions
// ============================================
export const getAllKeys = () => keys();

export const clearAllCache = async () => {
  const allKeys = await keys();
  await Promise.all(allKeys.map(key => del(key)));
};

export const getCacheSize = async () => {
  const allKeys = await keys();
  return allKeys.length;
};

// ============================================
// Lesson-specific caching
// ============================================
export const saveLessonData = (lessonId, data) => set(`lesson:${lessonId}`, data);
export const loadLessonData = (lessonId) => get(`lesson:${lessonId}`);
export const clearLessonData = (lessonId) => del(`lesson:${lessonId}`);
