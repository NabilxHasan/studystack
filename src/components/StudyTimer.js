import React, { useState, useEffect, useRef } from "react";
import { formatClock, formatDuration } from "../utils/storage";

export default function StudyTimer({
  activeSession,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onResetSession,
  onAddMinutes,
  onFinishSession,
  onMarkTaskCompleted,
  routineSchedule = [],
  sfx,
  initialFocusMode = false
}) {
  // Configurable subject and target before starting
  const [selectedSubject, setSelectedSubject] = useState(
    activeSession?.subject || "General Study"
  );
  const [boundTaskId, setBoundTaskId] = useState(
    activeSession?.taskId || null
  );
  const [targetMinutes, setTargetMinutes] = useState(
    activeSession?.targetSeconds ? Math.round(activeSession.targetSeconds / 60) : 60
  );
  const [customMinutesInput, setCustomMinutesInput] = useState("");
  const [showCustomTarget, setShowCustomTarget] = useState(false);

  // Fullscreen Focus Study Mode
  const [isFocusMode, setIsFocusMode] = useState(initialFocusMode);
  const [completionModal, setCompletionModal] = useState(null);

  const wakeLockRef = useRef(null);

  // Sync selection if activeSession exists or changes
  useEffect(() => {
    if (activeSession) {
      if (activeSession.subject) setSelectedSubject(activeSession.subject);
      if (activeSession.taskId !== undefined) setBoundTaskId(activeSession.taskId);
      if (activeSession.targetSeconds) {
        setTargetMinutes(Math.round(activeSession.targetSeconds / 60));
      }
      if (activeSession.isCompleted && !completionModal) {
        setCompletionModal({
          taskId: activeSession.taskId,
          subject: activeSession.subject,
          secondsStudied: activeSession.elapsedSeconds
        });
      }
    }
  }, [activeSession, completionModal]);

  // Derived state directly from lifted activeSession in App.js
  const isRunning = activeSession ? !activeSession.isPaused : false;
  const isPaused = activeSession ? activeSession.isPaused : false;
  const elapsedSeconds = activeSession?.elapsedSeconds || 0;
  const remainingSeconds = activeSession?.remainingSeconds !== undefined
    ? activeSession.remainingSeconds
    : (targetMinutes * 60);

  // Screen Wake Lock (with safe try/catch for iOS Chrome / Safari)
  useEffect(() => {
    if (!isRunning) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      return;
    }

    let cancelled = false;
    async function requestLock() {
      if (cancelled || wakeLockRef.current) return;
      try {
        if ("wakeLock" in navigator && typeof navigator.wakeLock.request === "function") {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch (e) {}
    }
    requestLock();

    const onVis = () => {
      if (document.visibilityState === "visible") requestLock();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isRunning]);

  function handleStart() {
    sfx?.start?.();
    onStartSession?.({
      taskId: boundTaskId,
      subject: selectedSubject,
      targetSeconds: targetMinutes * 60
    });
  }

  function handlePause() {
    sfx?.stop?.();
    onPauseSession?.();
  }

  function handleResume() {
    sfx?.start?.();
    onResumeSession?.();
  }

  function handleReset() {
    sfx?.undo?.();
    onResetSession?.();
  }

  function handleAddFiveMinutes() {
    sfx?.add?.();
    onAddMinutes?.(5);
    setTargetMinutes((prev) => prev + 5);
  }

  function handleMarkAsFinished() {
    if (elapsedSeconds < 10 && remainingSeconds > 10) {
      if (!window.confirm("You have only studied for a short time. Finish session now?")) {
        return;
      }
    }
    sfx?.win?.();
    onFinishSession?.(elapsedSeconds, boundTaskId, selectedSubject);
    setCompletionModal({
      taskId: boundTaskId,
      subject: selectedSubject,
      secondsStudied: elapsedSeconds
    });
  }

  function handleConfirmCompletionTask() {
    if (completionModal?.taskId) {
      onMarkTaskCompleted?.(completionModal.taskId);
    }
    setCompletionModal(null);
    handleReset();
  }

  // Safe Fullscreen Handler with iOS WebKit graceful fallback
  function toggleFullscreenFocus(enable) {
    setIsFocusMode(enable);
    if (enable) {
      try {
        const el = document.documentElement;
        if (el && typeof el.requestFullscreen === "function") {
          el.requestFullscreen().catch(() => {});
        } else if (el && typeof el.webkitRequestFullscreen === "function") {
          el.webkitRequestFullscreen();
        }
      } catch (e) {}
    } else {
      try {
        if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitFullscreenElement && typeof document.webkitExitFullscreen === "function") {
          document.webkitExitFullscreen();
        }
      } catch (e) {}
    }
  }

  const boundTask = routineSchedule.find((t) => t.id === boundTaskId);

  const totalTargetSecs = Math.max(1, targetMinutes * 60);
  const progressRatio = targetMinutes > 0
    ? Math.min(1, Math.max(0, (totalTargetSecs - remainingSeconds) / totalTargetSecs))
    : 0;

  const R = 96;
  const C = 2 * Math.PI * R;
  const strokeDashoffset = C * (1 - progressRatio);

  return (
    <div className="study-wrap fade-in">
      {/* ── FULLSCREEN FOCUS STUDY MODE OVERLAY ── */}
      {isFocusMode && (
        <div className="study-focus-overlay">
          <div className="focus-top-bar">
            <div className="focus-task-header">
              <span className="focus-subject-tag">{selectedSubject}</span>
              <span className="focus-task-title">
                {boundTask ? boundTask.notes || boundTask.subject : "Distraction-Free Focus"}
              </span>
            </div>
            <button
              className="focus-exit-btn"
              onClick={() => toggleFullscreenFocus(false)}
              title="Exit Fullscreen"
            >
              ✕ Exit Focus
            </button>
          </div>

          <div className="focus-center-body">
            <div className="focus-timer-digits">
              {formatClock(remainingSeconds > 0 ? remainingSeconds : elapsedSeconds)}
            </div>
            <div className="focus-state-label">
              {isRunning ? "● FOCUSING" : isPaused ? "⏸ PAUSED" : "READY"}
            </div>

            <div className="focus-progress-track">
              <div
                className="focus-progress-bar"
                style={{ width: `${Math.round(progressRatio * 100)}%` }}
              />
            </div>

            <div className="focus-controls-row">
              {!isRunning && !isPaused && (
                <button className="focus-main-btn" onClick={handleStart}>
                  ▶ Start Focus
                </button>
              )}

              {isRunning && (
                <button className="focus-main-btn" onClick={handlePause}>
                  ⏸ Pause
                </button>
              )}

              {isPaused && (
                <button className="focus-main-btn paused" onClick={handleResume}>
                  ▶ Resume
                </button>
              )}

              <button className="focus-secondary-btn" onClick={handleAddFiveMinutes} title="Add 5 minutes">
                +5m
              </button>

              {(isRunning || isPaused) && (
                <button className="focus-finish-btn" onClick={handleMarkAsFinished}>
                  ✓ Finish
                </button>
              )}
            </div>
          </div>

          <div style={{ color: "var(--text-subtle)", fontSize: "12px" }}>
            Screen stays awake • Press Esc or Exit to leave fullscreen
          </div>
        </div>
      )}

      {/* ── SESSION COMPLETE CELEBRATION MODAL ── */}
      {completionModal && (
        <div className="clean-modal-backdrop">
          <div className="clean-modal-box" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>🏆</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>
              Session Complete!
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
              {completionModal.subject}
            </div>
            <div style={{
              fontSize: "28px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--accent)",
              margin: "14px 0"
            }}>
              {formatDuration(completionModal.secondsStudied)}
            </div>
            <div style={{ fontSize: "12px", color: "var(--success)", fontWeight: 600 }}>
              ✓ Logged to your daily study and streak tally
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              {completionModal.taskId && (
                <button
                  className="auth-submit-btn"
                  style={{ flex: 1 }}
                  onClick={handleConfirmCompletionTask}
                >
                  ✓ Mark Task Completed
                </button>
              )}
              <button
                className="guest-continue-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  setCompletionModal(null);
                  handleReset();
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STANDARD TIMER CARD ── */}
      <div className="timer-standard-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Target Focus
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              {selectedSubject}
            </div>
          </div>
          <button
            className="fullscreen-launcher-btn"
            style={{ margin: 0, padding: "6px 12px", fontSize: "12px" }}
            onClick={() => toggleFullscreenFocus(true)}
          >
            ⛶ Fullscreen Focus
          </button>
        </div>

        {boundTask && (
          <div style={{
            background: "var(--bg-surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "20px",
            textAlign: "left"
          }}>
            📌 Bound to routine task: <strong>{boundTask.day}</strong> • {boundTask.subject} ({boundTask.allocatedDurationMinutes ? `${boundTask.allocatedDurationMinutes}m target` : "Flexible"})
          </div>
        )}

        {/* Preset duration selection */}
        <div className="preset-durations-row">
          {[25, 45, 60, 90, 120].map((mins) => (
            <button
              key={mins}
              className={`preset-btn ${targetMinutes === mins && !showCustomTarget ? "active" : ""}`}
              disabled={isRunning || isPaused}
              onClick={() => {
                setTargetMinutes(mins);
                setShowCustomTarget(false);
              }}
            >
              {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
            </button>
          ))}
          <button
            className={`preset-btn ${showCustomTarget ? "active" : ""}`}
            disabled={isRunning || isPaused}
            onClick={() => setShowCustomTarget(true)}
          >
            Custom
          </button>
        </div>

        {showCustomTarget && (
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
            <input
              type="number"
              min="1"
              max="480"
              placeholder="Minutes"
              value={customMinutesInput}
              onChange={(e) => setCustomMinutesInput(e.target.value)}
              className="auth-input-field"
              style={{ width: "120px", textAlign: "center" }}
            />
            <button
              className="auth-submit-btn"
              style={{ padding: "8px 16px" }}
              onClick={() => {
                const m = parseInt(customMinutesInput, 10);
                if (m > 0) {
                  setTargetMinutes(m);
                }
              }}
            >
              Set
            </button>
          </div>
        )}

        {/* Circular Progress Display */}
        <div className="timer-ring-wrap">
          <svg viewBox="0 0 220 220" width="220" height="220">
            <circle
              cx="110"
              cy="110"
              r={R}
              fill="none"
              stroke="var(--border)"
              strokeWidth="8"
            />
            <circle
              cx="110"
              cy="110"
              r={R}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="8"
              strokeDasharray={C}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 110 110)"
              style={{
                transition: isRunning ? "stroke-dashoffset 0.8s ease-out" : "none"
              }}
            />
          </svg>

          <div className="timer-ring-center">
            <div className="timer-display-time">
              {formatClock(remainingSeconds > 0 ? remainingSeconds : elapsedSeconds)}
            </div>
            <div className="timer-display-label">
              {remainingSeconds > 0 ? "REMAINING" : "ELAPSED"}
            </div>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
          {!isRunning && !isPaused && (
            <button
              className="auth-submit-btn"
              style={{ padding: "12px 32px", fontSize: "15px" }}
              onClick={handleStart}
            >
              ▶ Start Studying
            </button>
          )}

          {isRunning && (
            <>
              <button
                className="guest-continue-btn"
                style={{ width: "auto", padding: "10px 24px", color: "var(--warning)" }}
                onClick={handlePause}
              >
                ⏸ Pause
              </button>
              <button
                className="auth-submit-btn"
                style={{ width: "auto", padding: "10px 24px", background: "var(--success)" }}
                onClick={handleMarkAsFinished}
              >
                ✓ Finish
              </button>
              <button
                className="guest-continue-btn"
                style={{ width: "auto", padding: "10px 18px" }}
                onClick={handleReset}
              >
                ↺ Reset
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                className="auth-submit-btn"
                style={{ width: "auto", padding: "10px 24px" }}
                onClick={handleResume}
              >
                ▶ Resume
              </button>
              <button
                className="auth-submit-btn"
                style={{ width: "auto", padding: "10px 24px", background: "var(--success)" }}
                onClick={handleMarkAsFinished}
              >
                ✓ Finish
              </button>
              <button
                className="guest-continue-btn"
                style={{ width: "auto", padding: "10px 18px" }}
                onClick={handleReset}
              >
                ↺ Reset
              </button>
            </>
          )}
        </div>

        <button
          className="fullscreen-launcher-btn"
          onClick={() => toggleFullscreenFocus(true)}
        >
          ⛶ Open Distraction-Free Fullscreen Mode
        </button>
      </div>
    </div>
  );
}
