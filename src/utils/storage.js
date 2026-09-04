/**
 * Versioned Local Storage and State Persistence Engine
 * Supports routines, daily task checkpoints, task-bound timer sessions, and streak tracking.
 */

import { DEFAULT_ROUTINE_SCHEDULE } from "../config/routineData";

export const STORAGE_VERSION = 2;

const KEYS = {
  VERSION: "sq_storage_version",
  ROUTINE: "sq_routine_schedule_v2",
  DAILY_STATES: "sq_daily_task_states_v2",
  ACTIVE_TIMER: "sq_active_timer_session_v2",
  STUDY_LOG: "sq_study_log_v2",
  STREAK_FREEZE: "sq_streak_freeze_v2",
  THEME: "sq_theme",
  SOUND: "sq_sound",
  GUEST_MODE: "sq_guest_mode"
};

/**
 * Format Date object to YYYY-MM-DD
 */
export function dateStr(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format seconds to e.g. "2h 15m 30s" or "45m 12s"
 */
export function formatDuration(secs) {
  const total = Math.max(0, Math.floor(secs || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Format seconds into clock format "HH:MM:SS" or "MM:SS"
 */
export function formatClock(secs) {
  const total = Math.max(0, Math.floor(secs || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Load configured routine schedule, falling back to scraped defaults
 */
export function loadRoutineSchedule() {
  try {
    const raw = localStorage.getItem(KEYS.ROUTINE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load routine schedule:", e);
  }
  return DEFAULT_ROUTINE_SCHEDULE;
}

/**
 * Save customized routine schedule
 */
export function saveRoutineSchedule(schedule) {
  try {
    localStorage.setItem(KEYS.ROUTINE, JSON.stringify(schedule));
  } catch (e) {
    console.error("Failed to save routine schedule:", e);
  }
}

/**
 * Reset routine schedule back to scraped 52h default
 */
export function resetRoutineSchedule() {
  try {
    localStorage.removeItem(KEYS.ROUTINE);
  } catch (e) {
    console.error("Failed to reset routine schedule:", e);
  }
  return DEFAULT_ROUTINE_SCHEDULE;
}

/**
 * Load daily task states dictionary: { [dateStr]: { [taskId]: { status: 'pending'|'in-progress'|'completed'|'skipped', secondsStudied: number } } }
 */
export function loadAllDailyStates() {
  try {
    const raw = localStorage.getItem(KEYS.DAILY_STATES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load daily task states:", e);
  }
  return {};
}

/**
 * Load task states for a specific day
 */
export function loadDailyTaskStates(dayStr = dateStr()) {
  const all = loadAllDailyStates();
  return all[dayStr] || {};
}

/**
 * Save task states for a specific day
 */
export function saveDailyTaskStates(dayStr, states) {
  try {
    const all = loadAllDailyStates();
    all[dayStr] = states;
    localStorage.setItem(KEYS.DAILY_STATES, JSON.stringify(all));
  } catch (e) {
    console.error("Failed to save daily task states:", e);
  }
}

/**
 * Set status or progress for an individual task on a specific date
 */
export function updateTaskState(dayStr, taskId, updates) {
  const states = loadDailyTaskStates(dayStr);
  const current = states[taskId] || { status: "pending", secondsStudied: 0 };
  states[taskId] = { ...current, ...updates, lastUpdated: Date.now() };
  saveDailyTaskStates(dayStr, states);
  return states;
}

/**
 * Load active timer session
 */
export function loadActiveTimerSession() {
  try {
    const raw = localStorage.getItem(KEYS.ACTIVE_TIMER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load active timer session:", e);
  }
  return null;
}

/**
 * Save active timer session
 */
export function saveActiveTimerSession(session) {
  try {
    if (!session) {
      localStorage.removeItem(KEYS.ACTIVE_TIMER);
    } else {
      localStorage.setItem(KEYS.ACTIVE_TIMER, JSON.stringify({
        ...session,
        lastUpdatedTimestamp: Date.now()
      }));
    }
  } catch (e) {
    console.error("Failed to save active timer session:", e);
  }
}

/**
 * Clear active timer session
 */
export function clearActiveTimerSession() {
  try {
    localStorage.removeItem(KEYS.ACTIVE_TIMER);
  } catch (e) {}
}

/**
 * Load cumulative study logs: { [dateStr]: totalSecondsStudied }
 */
export function loadStudyLog() {
  try {
    const raw = localStorage.getItem(KEYS.STUDY_LOG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load study log:", e);
  }
  return {};
}

/**
 * Save cumulative study logs
 */
export function saveStudyLog(log) {
  try {
    localStorage.setItem(KEYS.STUDY_LOG, JSON.stringify(log));
  } catch (e) {
    console.error("Failed to save study log:", e);
  }
}

/**
 * Add study seconds to a date's tally
 */
export function recordStudySeconds(dayStr, seconds) {
  const log = loadStudyLog();
  log[dayStr] = (log[dayStr] || 0) + Math.max(0, Math.floor(seconds));
  saveStudyLog(log);
  return log;
}
export const recordStudyTime = recordStudySeconds;

/**
 * Load streak freeze setting
 */
export function loadStreakFreeze() {
  try {
    return localStorage.getItem(KEYS.STREAK_FREEZE) === "true";
  } catch (e) {
    return false;
  }
}

/**
 * Save streak freeze setting
 */
export function saveStreakFreeze(enabled) {
  try {
    localStorage.setItem(KEYS.STREAK_FREEZE, enabled ? "true" : "false");
  } catch (e) {}
}

/**
 * Check if guest mode is active
 */
export function isGuestMode() {
  try {
    return localStorage.getItem(KEYS.GUEST_MODE) === "true";
  } catch (e) {
    return true;
  }
}

/**
 * Set guest mode
 */
export function setGuestMode(isGuest) {
  try {
    localStorage.setItem(KEYS.GUEST_MODE, isGuest ? "true" : "false");
  } catch (e) {}
}
