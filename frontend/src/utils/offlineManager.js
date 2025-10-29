// /src/utils/offlineManager.js
// Centralized offline state management

import {
  saveLastRoute,
  loadLastRoute,
  saveOfflineState,
  loadOfflineState,
  saveTopics,
  loadTopics,
  saveDashboardData,
  loadDashboardData,
  saveVocabulary,
  loadVocabulary,
} from "../offline/db";

/**
 * Save current route for offline restoration
 */
export const persistCurrentRoute = (pathname, search = "") => {
  try {
    const route = { pathname, search, timestamp: Date.now() };
    saveLastRoute(route);
    localStorage.setItem("last_route", JSON.stringify(route));
  } catch (error) {
    console.warn("Failed to persist route:", error);
  }
};

/**
 * Restore last route when coming back online or refreshing offline
 */
export const restoreLastRoute = async () => {
  try {
    // Try IndexedDB first
    let route = await loadLastRoute();
    
    // Fallback to localStorage
    if (!route) {
      const stored = localStorage.getItem("last_route");
      if (stored) {
        route = JSON.parse(stored);
      }
    }
    
    return route;
  } catch (error) {
    console.warn("Failed to restore route:", error);
    return null;
  }
};

/**
 * Check if we have cached data for offline mode
 */
export const hasOfflineData = async () => {
  try {
    const [topics, dashboard, vocab] = await Promise.all([
      loadTopics(),
      loadDashboardData(),
      loadVocabulary(),
    ]);
    
    return {
      hasTopics: !!topics,
      hasDashboard: !!dashboard,
      hasVocab: !!vocab,
      hasAnyData: !!(topics || dashboard || vocab),
    };
  } catch (error) {
    console.warn("Failed to check offline data:", error);
    return {
      hasTopics: false,
      hasDashboard: false,
      hasVocab: false,
      hasAnyData: false,
    };
  }
};

/**
 * Save offline state with metadata
 */
export const persistOfflineState = async (state) => {
  try {
    await saveOfflineState({
      ...state,
      lastUpdated: Date.now(),
      version: "1.0",
    });
    
    // Also save to localStorage as backup
    localStorage.setItem("offline_state", JSON.stringify({
      ...state,
      lastUpdated: Date.now(),
    }));
  } catch (error) {
    console.warn("Failed to persist offline state:", error);
  }
};

/**
 * Get offline state
 */
export const getOfflineState = async () => {
  try {
    let state = await loadOfflineState();
    
    // Fallback to localStorage
    if (!state) {
      const stored = localStorage.getItem("offline_state");
      if (stored) {
        state = JSON.parse(stored);
      }
    }
    
    return state || {};
  } catch (error) {
    console.warn("Failed to get offline state:", error);
    return {};
  }
};

/**
 * Check if app can work offline
 */
export const canWorkOffline = async () => {
  const data = await hasOfflineData();
  return data.hasAnyData;
};

/**
 * Get offline readiness status
 */
export const getOfflineReadiness = async () => {
  const data = await hasOfflineData();
  const state = await getOfflineState();
  
  return {
    isReady: data.hasAnyData,
    lastSync: state.lastUpdated || null,
    cachedData: data,
    message: data.hasAnyData 
      ? "App is ready for offline use" 
      : "Please visit pages while online to enable offline access",
  };
};

/**
 * Sync data when online
 */
export const syncOnlineData = async (dataToSync) => {
  try {
    const promises = [];
    
    if (dataToSync.topics) {
      promises.push(saveTopics(dataToSync.topics));
    }
    
    if (dataToSync.dashboard) {
      promises.push(saveDashboardData(dataToSync.dashboard));
    }
    
    if (dataToSync.vocabulary) {
      promises.push(saveVocabulary(dataToSync.vocabulary));
    }
    
    await Promise.all(promises);
    
    await persistOfflineState({
      lastSync: Date.now(),
      syncedData: Object.keys(dataToSync),
    });
    
    return true;
  } catch (error) {
    console.error("Failed to sync online data:", error);
    return false;
  }
};

/**
 * Check if data is stale (older than specified hours)
 */
export const isDataStale = (timestamp, maxAgeHours = 24) => {
  if (!timestamp) return true;
  const ageMs = Date.now() - timestamp;
  const ageHours = ageMs / (1000 * 60 * 60);
  return ageHours > maxAgeHours;
};

/**
 * Get cache status for debugging
 */
export const getCacheStatus = async () => {
  const data = await hasOfflineData();
  const state = await getOfflineState();
  const route = await restoreLastRoute();
  
  return {
    offlineData: data,
    offlineState: state,
    lastRoute: route,
    timestamp: Date.now(),
  };
};

