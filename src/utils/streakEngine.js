/**
 * Streak Engine & Historical Tracking Logic
 * Calculates streaks, completion metrics, and date transitions with streak freeze support.
 */

import { DAYS } from "../config/routineData";
import { dateStr } from "./storage";

/**
 * Check if the daily goal was met for a specific date
 * Threshold: At least 70% of scheduled tasks completed OR at least 3 hours studied
 */
export function isDayGoalMet(targetDateStr, routineSchedule, allDailyStates, studyLog) {
  const [y, m, d] = targetDateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = DAYS[dateObj.getDay()];

  const dayTasks = routineSchedule.filter(t => t.day === dayName);
  const taskStates = allDailyStates[targetDateStr] || {};

  const totalTasks = dayTasks.length;
  const completedTasks = dayTasks.filter(t => {
    const s = taskStates[t.id];
    return s && (s.status === "completed" || s === "completed");
  }).length;

  const secondsStudied = studyLog[targetDateStr] || 0;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 1;

  // 70% tasks completed OR at least 3 hours (10,800s) studied
  const isMet = (totalTasks > 0 && taskCompletionRate >= 0.70) || (secondsStudied >= 10800);

  return {
    date: targetDateStr,
    dayName,
    totalTasks,
    completedTasks,
    taskCompletionRate,
    secondsStudied,
    isMet,
    isRestDay: totalTasks === 0
  };
}

/**
 * Calculate streak metrics across history
 */
export function computeStreakMetrics({
  routineSchedule = [],
  allDailyStates = {},
  studyLog = {},
  streakFreezeEnabled = false
}) {
  const today = dateStr();
  const todayMetrics = isDayGoalMet(today, routineSchedule, allDailyStates, studyLog);

  let currentStreak = 0;
  let lastCompletedDate = null;
  let freezeUsedForCurrent = false;

  // Check today first
  if (todayMetrics.isMet) {
    currentStreak += 1;
    lastCompletedDate = today;
  }

  // Look back consecutive days starting from yesterday
  const now = new Date();
  for (let i = 1; i <= 365; i++) {
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - i);
    const pastStr = dateStr(pastDate);

    const metrics = isDayGoalMet(pastStr, routineSchedule, allDailyStates, studyLog);

    if (metrics.isMet) {
      currentStreak += 1;
      if (!lastCompletedDate) {
        lastCompletedDate = pastStr;
      }
    } else if (metrics.isRestDay) {
      // Rest day with 0 tasks does not break streak
      continue;
    } else {
      // Day was missed
      if (streakFreezeEnabled && !freezeUsedForCurrent) {
        freezeUsedForCurrent = true;
        // Protected by streak freeze for 1 missed day
        continue;
      } else {
        // Streak breaks
        break;
      }
    }
  }

  // Calculate historical longest streak over the past 90 days
  let longestStreak = currentStreak;
  let runningRun = 0;
  const history = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dStr = dateStr(d);
    const m = isDayGoalMet(dStr, routineSchedule, allDailyStates, studyLog);

    const isToday = dStr === today;
    let status = "missed";
    if (isToday) {
      status = m.isMet ? "done" : "today";
    } else if (m.isMet) {
      status = "done";
    } else if (m.isRestDay) {
      status = "rest";
    }

    if (m.isMet) {
      runningRun += 1;
      if (runningRun > longestStreak) {
        longestStreak = runningRun;
      }
    } else if (!m.isRestDay && !isToday) {
      runningRun = 0;
    }

    history.push({
      dateStr: dStr,
      date: d,
      status,
      completed: m.completedTasks,
      total: m.totalTasks,
      seconds: m.secondsStudied,
      isMet: m.isMet
    });
  }

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate,
    todayProgress: todayMetrics,
    streakFreezeEnabled,
    history
  };
}
