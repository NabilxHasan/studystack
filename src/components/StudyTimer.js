import React, { useState, useEffect, useRef } from "react";
import { formatClock, formatDuration } from "../utils/storage";

export default function StudyTimer({
  activeSession,
  onUpdateSession,
  onCompleteSession,
  onMarkTaskCompleted,
  routineSchedule = [],
  sfx,
  initialFocusMode = false
}) {
  // Current subject and bound task
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

  // Timer running state & numbers
  const [isRunning, setIsRunning] = useState(activeSession ? !activeSession.isPaused : false);
  const [isPaused, setIsPaused] = useState(activeSession ? activeSession.isPaused : false);
  const [elapsedSeconds, setElapsedSeconds] = useState(activeSession?.elapsedSeconds || 0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    activeSession?.remainingSeconds !== undefined
      ? activeSession.remainingSeconds
      : (targetMinutes * 60)
  );
  const [completionModal, setCompletionModal] = useState(null);

  // Fullscreen Focus Study Mode
  const [isFocusMode, setIsFocusMode] = useState(initialFocusMode);

  const startWallTimestampRef = useRef(null);
  const tickIntervalRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Screen Wake Lock to prevent sleep while studying
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
        if ("wakeLock" in navigator) {
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

  // Sync state if activeSession changes externally
  useEffect(() => {
    if (!activeSession) return;
    setSelectedSubject(activeSession.subject || "General Study");
    setBoundTaskId(activeSession.taskId || null);
    setIsRunning(!activeSession.isPaused);
    setIsPaused(activeSession.isPaused);
    setElapsedSeconds(activeSession.elapsedSeconds || 0);
    setRemainingSeconds(activeSession.remainingSeconds !== undefined ? activeSession.remainingSeconds : 0);

    if (activeSession.targetSeconds) {
      setTargetMinutes(Math.round(activeSession.targetSeconds / 60));
    }

    if (!activeSession.isPaused && activeSession.lastUpdatedTimestamp) {
      const deltaSecs = Math.floor((Date.now() - activeSession.lastUpdatedTimestamp) / 1000);
      if (deltaSecs > 0) {
        const newElapsed = (activeSession.elapsedSeconds || 0) + deltaSecs;
        const newRemaining = Math.max(0, (activeSession.remainingSeconds || 0) - deltaSecs);
        setElapsedSeconds(newElapsed);
        setRemainingSeconds(newRemaining);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession]);

  // Main tick loop
  useEffect(() => {
    if (isRunning && !isPaused) {
      startWallTimestampRef.current = Date.now();
      tickIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prevElapsed) => {
          const newElapsed = prevElapsed + 1;
          setRemainingSeconds((prevRem) => {
            const newRem = Math.max(0, prevRem - 1);
            onUpdateSession?.({
              taskId: boundTaskId,
              subject: selectedSubject,
              targetSeconds: targetMinutes * 60,
              elapsedSeconds: newElapsed,
              remainingSeconds: newRem,
              isPaused: false
            });

            if (targetMinutes > 0 && newRem === 0 && prevRem > 0) {
              handleTimerCompleted(newElapsed);
            }
            return newRem;
          });
          return newElapsed;
        });
      }, 1000);
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isPaused, boundTaskId, selectedSubject, targetMinutes]);

  function handleStart() {
    sfx?.start?.();
    setIsRunning(true);
    setIsPaused(false);
    onUpdateSession?.({
      taskId: boundTaskId,
      subject: selectedSubject,
      targetSeconds: targetMinutes * 60,
      elapsedSeconds,
      remainingSeconds,
      isPaused: false
    });
  }

  function handlePause() {
    sfx?.stop?.();
    setIsPaused(true);
    onUpdateSession?.({
      taskId: boundTaskId,
      subject: selectedSubject,
      targetSeconds: targetMinutes * 60,
      elapsedSeconds,
      remainingSeconds,
      isPaused: true
    });
  }

  function handleResume() {
    sfx?.start?.();
    setIsPaused(false);
    onUpdateSession?.({
      taskId: boundTaskId,
      subject: selectedSubject,
      targetSeconds: targetMinutes * 60,
      elapsedSeconds,
      remainingSeconds,
      isPaused: false
    });
  }

  function handleReset() {
    sfx?.undo?.();
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setRemainingSeconds(targetMinutes * 60);
    onUpdateSession?.(null);
  }

  function handleTimerCompleted(finalElapsedSeconds) {
    sfx?.win?.();
    setIsRunning(false);
    setIsPaused(false);
    onCompleteSession?.(finalElapsedSeconds, boundTaskId, selectedSubject);
    setCompletionModal({
      taskId: boundTaskId,
      subject: selectedSubject,
      secondsStudied: finalElapsedSeconds
    });
  }

  function handleMarkAsFinished() {
    if (elapsedSeconds < 10 && remainingSeconds > 10) {
      if (!window.confirm("You have only studied for a short time. Finish session now?")) {
        return;
      }
    }
    handleTimerCompleted(elapsedSeconds);
  }

  function handleConfirmCompletionTask() {
    if (completionModal?.taskId) {
      onMarkTaskCompleted?.(completionModal.taskId);
    }
    setCompletionModal(null);
    handleReset();
  }

  function toggleFullscreenFocus(enable) {
    setIsFocusMode(enable);
    if (enable) {
      try {
        const el = document.documentElement;
        const fn = el.requestFullscreen || el.webkitRequestFullscreen;
        fn && fn.call(el);
      } catch (e) {}
    } else {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      } catch (e) {}
    }
  }

  function addFiveMinutes() {
    setRemainingSeconds((prev) => prev + 300);
    setTargetMinutes((prev) => prev + 5);
    sfx?.add?.();
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

              <button className="focus-secondary-btn" onClick={addFiveMinutes} title="Add 5 minutes">
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
                setRemainingSeconds(mins * 60);
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
                  setRemainingSeconds(m * 60);
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
