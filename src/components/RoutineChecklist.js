import React, { useState } from "react";
import { DAYS, DAY_METADATA, SUBJECT_THEMES } from "../config/routineData";
import { dateStr } from "../utils/storage";

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: "⏳", color: "var(--text-muted)" },
  "in-progress": { label: "In-Progress", icon: "🔄", color: "var(--warning)" },
  completed: { label: "Completed", icon: "✓", color: "var(--success)" },
  skipped: { label: "Skipped", icon: "✕", color: "var(--text-subtle)" }
};

export default function RoutineChecklist({
  routineSchedule = [],
  dailyStates = {},
  selectedDateStr = dateStr(),
  onSelectDate,
  onToggleTaskStatus,
  onStartTaskTimer,
  onUpdateSchedule,
  onResetSchedule,
  sfx
}) {
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [newTaskSubject, setNewTaskSubject] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");

  const [y, m, d] = selectedDateStr.split("-").map(Number);
  const currentDateObj = new Date(y, m - 1, d);
  const selectedDayName = DAYS[currentDateObj.getDay()];
  const todayActualName = DAYS[new Date().getDay()];

  const todayStr = dateStr();
  const isPastDay = selectedDateStr < todayStr;

  const dayTasks = routineSchedule.filter((t) => t.day === selectedDayName);

  const totalTasks = dayTasks.length;
  const completedTasks = dayTasks.filter((t) => {
    const st = dailyStates[t.id]?.status;
    return st === "completed";
  }).length;
  const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const meta = DAY_METADATA[selectedDayName] || { tag: "REGULAR" };

  function handleQuickCheck(taskId) {
    if (isPastDay) return;
    sfx?.click?.();
    const current = dailyStates[taskId]?.status || "pending";
    const next = current === "completed" ? "pending" : "completed";
    if (next === "completed") sfx?.done?.();
    onToggleTaskStatus?.(selectedDateStr, taskId, next);
  }

  function handleStatusChange(taskId, status) {
    if (isPastDay) return;
    sfx?.click?.();
    if (status === "completed") sfx?.done?.();
    onToggleTaskStatus?.(selectedDateStr, taskId, status);
  }

  function handleAddNewTask() {
    if (!newTaskSubject.trim()) {
      alert("Please enter a subject name.");
      return;
    }
    const newTask = {
      id: `custom-${Date.now()}`,
      day: selectedDayName,
      subject: newTaskSubject.trim(),
      notes: newTaskNotes.trim() || undefined,
      defaultTaskType: "custom"
    };

    const updated = [...routineSchedule, newTask];
    onUpdateSchedule?.(updated);
    sfx?.add?.();

    setNewTaskSubject("");
    setNewTaskNotes("");
    setIsEditingSchedule(false);
  }

  function handleDeleteTask(taskId) {
    if (!window.confirm("Remove this study block from your routine?")) return;
    const updated = routineSchedule.filter((t) => t.id !== taskId);
    onUpdateSchedule?.(updated);
    sfx?.del?.();
  }

  return (
    <div className="routine-checklist-wrap fade-in">
      {/* ── 7-DAY SEGMENTED PILL SELECTOR ── */}
      <div className="day-pills-scroll">
        {DAYS.map((dayName, idx) => {
          const isActive = dayName === selectedDayName;
          const isToday = dayName === todayActualName;

          return (
            <button
              key={dayName}
              className={`day-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => {
                sfx?.tap?.();
                const now = new Date();
                const diff = idx - now.getDay();
                const targetD = new Date(now);
                targetD.setDate(now.getDate() + diff);
                onSelectDate?.(dateStr(targetD));
              }}
            >
              <span>{dayName.slice(0, 3).toUpperCase()}</span>
              {isToday && <span className="day-tag-badge">TODAY</span>}
            </button>
          );
        })}
      </div>

      {/* ── DAY PROGRESS BAR CARD ── */}
      <div className="day-progress-bar-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="hero-day-tag">{meta.tag}</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>
                {selectedDayName}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              {completedTasks} of {totalTasks} blocks completed ({percentComplete}%) • Flexible Study Schedule
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "24px", fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent)" }}>
              {percentComplete}%
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {percentComplete >= 70 ? "🔥 Streak Goal Met" : "Target: 70%"}
            </div>
          </div>
        </div>

        <div className="gauge-track">
          <div
            className={`gauge-fill ${percentComplete >= 70 ? "goal-met" : ""}`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
          {!isPastDay ? (
            <button
              style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)", display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer" }}
              onClick={() => setIsEditingSchedule(!isEditingSchedule)}
            >
              {isEditingSchedule ? "✕ Close Editor" : "+ Add Study Block"}
            </button>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--text-subtle)", display: "flex", alignItems: "center", gap: "4px" }}>
              🔒 Routine Locked
            </div>
          )}
          <button
            style={{ fontSize: "11px", color: "var(--text-subtle)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => {
              if (window.confirm("Reset routine to the academic default schedule?")) {
                onResetSchedule?.();
              }
            }}
          >
            Reset Routine
          </button>
        </div>
      </div>

      {/* ── 00:00 AM MIDNIGHT CUTOFF LOCKED BANNER ── */}
      {isPastDay && (
        <div className="past-day-locked-banner fade-in">
          <span style={{ fontSize: "18px" }}>🔒</span>
          <div>
            <strong>Day Locked (00:00 AM Cutoff):</strong> Midnight has passed for {selectedDayName}. Past tasks cannot be finished or edited and are preserved as historical records.
          </div>
        </div>
      )}

      {/* ── SCHEDULE EDIT / ADD BLOCK FORM ── */}
      {isEditingSchedule && !isPastDay && (
        <div className="minimal-card" style={{ cursor: "default" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "12px" }}>
            Add Study Block to {selectedDayName}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="text"
              placeholder="Subject (e.g. DSA, OOP, Physics, Revision)"
              className="auth-input-field"
              value={newTaskSubject}
              onChange={(e) => setNewTaskSubject(e.target.value)}
            />
            <input
              type="text"
              placeholder="Notes / topics (e.g. Problem Sets, LeetCode, Review)"
              className="auth-input-field"
              value={newTaskNotes}
              onChange={(e) => setNewTaskNotes(e.target.value)}
            />
            <button className="auth-submit-btn" onClick={handleAddNewTask}>
              + Save Block
            </button>
          </div>
        </div>
      )}

      {/* ── TASK CARDS LIST ── */}
      <div className="task-cards-list">
        {dayTasks.length === 0 ? (
          <div className="minimal-card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>☕</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              No tasks scheduled for {selectedDayName}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
              Take a rest or add a flexible block above.
            </div>
          </div>
        ) : (
          dayTasks.map((task) => {
            const state = dailyStates[task.id] || { status: "pending" };
            const status = state.status || "pending";
            const isCompleted = status === "completed";
            const theme = SUBJECT_THEMES[task.subject] || {
              color: "var(--accent)",
              icon: "📚"
            };

            return (
              <div
                key={task.id}
                className={`task-card ${status} ${isPastDay ? "locked" : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: 1 }}>
                  {/* Quick-toggle checkbox / lock */}
                  <button
                    disabled={isPastDay}
                    onClick={() => handleQuickCheck(task.id)}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "6px",
                      border: isCompleted ? "none" : "2px solid var(--border)",
                      background: isCompleted ? "var(--success)" : "transparent",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isCompleted ? "14px" : "12px",
                      fontWeight: 800,
                      flexShrink: 0,
                      cursor: isPastDay ? "not-allowed" : "pointer"
                    }}
                    title={isPastDay ? "Locked: 00:00 AM cutoff passed" : "Toggle Completed"}
                  >
                    {isCompleted ? "✓" : isPastDay ? "🔒" : ""}
                  </button>

                  <div className="task-info-left">
                    {task.notes && (
                      <div className="task-meta-line">
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {task.notes}
                        </span>
                      </div>
                    )}
                    <div className="task-title" style={{ textDecoration: isCompleted ? "line-through" : "none" }}>
                      {theme.icon} {task.subject}
                    </div>
                  </div>
                </div>

                <div className="task-actions-right">
                  <button
                    className="study-task-btn"
                    disabled={isPastDay}
                    onClick={() => {
                      if (isPastDay) return;
                      sfx?.start?.();
                      onStartTaskTimer?.(task, true); // launch directly into Fullscreen Focus mode!
                    }}
                    title={isPastDay ? "Locked: 00:00 AM cutoff passed" : "Focus on this task in Fullscreen Mode"}
                  >
                    {isPastDay ? "Locked 🔒" : "Focus ▶"}
                  </button>

                  <select
                    className="status-dropdown-btn"
                    value={status}
                    disabled={isPastDay}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    title={isPastDay ? "Locked: 00:00 AM cutoff passed" : "Change Status"}
                  >
                    {Object.keys(STATUS_CONFIG).map((k) => (
                      <option key={k} value={k}>
                        {STATUS_CONFIG[k].icon} {STATUS_CONFIG[k].label}
                      </option>
                    ))}
                  </select>

                  {task.id.startsWith("custom-") && !isPastDay && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      style={{ color: "var(--danger)", padding: "4px", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}
                      title="Delete Block"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
