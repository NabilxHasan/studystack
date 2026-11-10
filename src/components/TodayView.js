import React, { useEffect, useState } from "react";
import { DAYS, DAY_METADATA, SUBJECT_THEMES, UNI_CLASSES, ROADMAP_SUBJECT } from "../config/routineData";
import { roadmapStats } from "../config/roadmapData";
import { dateStr } from "../utils/storage";
import { blocksNeeded, isDayGoalMet } from "../utils/streakEngine";

const KIND_LABEL = {
  review: "Class review",
  practice: "Practice",
  backlog: "Backlog",
  roadmap: "Roadmap",
  custom: "Custom"
};

function timeLeftToday() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const mins = Math.max(0, Math.floor((midnight - now) / 60000));
  return { hours: Math.floor(mins / 60), minutes: mins % 60 };
}

function ProgressRing({ done, total, met }) {
  const R = 34;
  const C = 2 * Math.PI * R;
  const ratio = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <div className={`td-ring ${met ? "met" : ""}`} aria-label={`${done} of ${total} blocks done`}>
      <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
        <circle cx="40" cy="40" r={R} fill="none" className="td-ring-track" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={R}
          fill="none"
          className="td-ring-fill"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - ratio)}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div className="td-ring-label">
        <strong>{done}</strong>
        <span>/{total}</span>
      </div>
    </div>
  );
}

export default function TodayView({
  routineSchedule = [],
  allDailyStates = {},
  studyLog = {},
  selectedDateStr = dateStr(),
  onSelectDate,
  onToggleTaskStatus,
  onStartTaskTimer,
  onUpdateSchedule,
  onResetSchedule,
  onOpenRoadmap,
  streakMetrics,
  roadmapProgress = {},
  sfx
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [left, setLeft] = useState(() => timeLeftToday());

  useEffect(() => {
    const t = setInterval(() => setLeft(timeLeftToday()), 30000);
    return () => clearInterval(t);
  }, []);

  const todayStr = dateStr();
  const [y, m, d] = selectedDateStr.split("-").map(Number);
  const selectedDayName = DAYS[new Date(y, m - 1, d).getDay()];
  const isToday = selectedDateStr === todayStr;
  const isPastDay = selectedDateStr < todayStr;

  const dailyStates = allDailyStates[selectedDateStr] || {};
  const dayTasks = routineSchedule.filter((t) => t.day === selectedDayName);
  const total = dayTasks.length;
  const isDone = (t) => dailyStates[t.id]?.status === "completed";
  const completed = dayTasks.filter(isDone).length;
  const need = Math.max(0, blocksNeeded(total) - completed);
  const dayMetrics = isDayGoalMet(selectedDateStr, routineSchedule, allDailyStates, studyLog);
  const met = dayMetrics.isMet;
  const nextTask = dayTasks.find((t) => !isDone(t));

  const streak = streakMetrics?.currentStreak || 0;
  const roadmap = roadmapStats(roadmapProgress);
  const classes = UNI_CLASSES[selectedDayName] || [];
  const meta = DAY_METADATA[selectedDayName] || { tag: "" };

  let headline;
  let sub;
  if (!isToday) {
    headline = selectedDayName;
    sub = isPastDay
      ? met
        ? "Committed. This day counted."
        : "Locked at midnight. This day did not count."
      : `${total} blocks planned.`;
  } else if (met) {
    headline = `Day ${streak} locked in.`;
    sub = completed < total ? "Today counts. Finish the rest for a clean sheet." : "Clean sheet. Every block done.";
  } else if (streak > 0) {
    headline = `${streak}-day streak on the line.`;
    sub = `${need} more ${need === 1 ? "block" : "blocks"} before midnight keeps it alive.`;
  } else {
    headline = "Day 1 starts with one block.";
    sub = `${need} ${need === 1 ? "block" : "blocks"} before midnight and today counts.`;
  }

  function toggle(task) {
    if (isPastDay) return;
    const next = isDone(task) ? "pending" : "completed";
    if (next === "completed") sfx?.done?.();
    else sfx?.undo?.();
    onToggleTaskStatus?.(selectedDateStr, task.id, next);
  }

  function addBlock() {
    if (!newSubject.trim()) return;
    onUpdateSchedule?.([
      ...routineSchedule,
      {
        id: `custom-${Date.now()}`,
        day: selectedDayName,
        subject: newSubject.trim(),
        notes: newNotes.trim() || undefined,
        kind: "custom"
      }
    ]);
    sfx?.add?.();
    setNewSubject("");
    setNewNotes("");
    setIsAdding(false);
  }

  function removeBlock(taskId) {
    if (!window.confirm("Remove this block from your routine?")) return;
    onUpdateSchedule?.(routineSchedule.filter((t) => t.id !== taskId));
    sfx?.del?.();
  }

  return (
    <div className="td-wrap fade-in">
      {/* ── HERO: what is at stake today ── */}
      <section className={`td-hero ${met ? "met" : ""} ${isToday && !met && streak > 0 ? "risk" : ""}`}>
        <div className="td-hero-main">
          <div className="td-eyebrow">
            {isToday ? "TODAY" : isPastDay ? "PAST DAY" : "UPCOMING"} · {selectedDayName.toUpperCase()} · {meta.tag}
          </div>
          <h1 className="td-headline">{headline}</h1>
          <p className="td-sub">{sub}</p>

          {isToday && (
            <div className="td-hero-actions">
              {nextTask ? (
                <button
                  className="td-cta"
                  onClick={() => {
                    sfx?.start?.();
                    onStartTaskTimer?.(nextTask, true);
                  }}
                >
                  ▶ Start {nextTask.subject}
                </button>
              ) : (
                <span className="td-done-chip">✓ All blocks done</span>
              )}
              <span className="td-clock">
                {left.hours}h {String(left.minutes).padStart(2, "0")}m left today
              </span>
            </div>
          )}
        </div>
        <ProgressRing done={completed} total={total} met={met} />
      </section>

      {/* ── WEEK STRIP ── */}
      <div className="td-week" role="tablist" aria-label="Week">
        {DAYS.map((dayName, idx) => {
          const now = new Date();
          const target = new Date(now);
          target.setDate(now.getDate() + (idx - now.getDay()));
          const ds = dateStr(target);
          const dm = isDayGoalMet(ds, routineSchedule, allDailyStates, studyLog);
          const state = dm.isMet ? "done" : ds < todayStr ? "missed" : ds === todayStr ? "today" : "future";
          return (
            <button
              key={dayName}
              role="tab"
              aria-selected={ds === selectedDateStr}
              className={`td-day ${ds === selectedDateStr ? "active" : ""} ${state}`}
              onClick={() => {
                sfx?.tap?.();
                onSelectDate?.(ds);
              }}
            >
              <span className="td-day-name">{dayName.slice(0, 3)}</span>
              <span className="td-day-num">{target.getDate()}</span>
              <span className="td-day-dot" />
            </button>
          );
        })}
      </div>

      {/* ── UNIVERSITY CLASSES (fixed) ── */}
      <section className="td-section">
        <div className="td-section-head">
          <h2>University</h2>
          <span>{classes.length ? `${classes.length} ${classes.length === 1 ? "slot" : "slots"}` : "No classes"}</span>
        </div>
        {classes.length === 0 ? (
          <div className="td-classes-empty">No classes. The whole day is yours, so the long blocks go here.</div>
        ) : (
          <div className="td-classes">
            {classes.map((c, i) => (
              <div className="td-class" key={i}>
                <span className="td-class-time">{c.time}</span>
                <span className="td-class-name">{c.subject}</span>
                <span className="td-class-meta">
                  {c.code}
                  {c.group ? ` · ${c.group}` : ""}
                  {c.room ? ` · #${c.room}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── STUDY BLOCKS ── */}
      <section className="td-section">
        <div className="td-section-head">
          <h2>Study blocks</h2>
          <span>
            {completed}/{total} done · {blocksNeeded(total)} to count the day
          </span>
        </div>

        {isPastDay && (
          <div className="td-locked">Locked at midnight. Past days are a record, not a to-do list.</div>
        )}

        <div className="td-blocks">
          {dayTasks.map((task) => {
            const done = isDone(task);
            const theme = SUBJECT_THEMES[task.subject] || { color: "var(--text-subtle)" };
            const isRoadmap = task.subject === ROADMAP_SUBJECT;
            return (
              <div
                key={task.id}
                className={`td-block ${done ? "done" : ""} ${isPastDay ? "locked" : ""} ${isRoadmap ? "roadmap" : ""}`}
                style={{ "--block-color": theme.color }}
              >
                <button
                  className="td-check"
                  disabled={isPastDay}
                  onClick={() => toggle(task)}
                  aria-pressed={done}
                  aria-label={`${done ? "Unmark" : "Mark"} ${task.subject} as done`}
                >
                  {done ? "✓" : ""}
                </button>

                <div className="td-block-body">
                  <div className="td-block-title">
                    <span>{task.subject}</span>
                    <span className="td-kind">{KIND_LABEL[task.kind] || "Study"}</span>
                  </div>
                  <div className="td-block-notes">
                    {isRoadmap && roadmap.next ? (
                      <>
                        Next: <strong>{roadmap.next.label}</strong> · {roadmap.percent}% of roadmap done
                      </>
                    ) : (
                      task.notes
                    )}
                  </div>
                </div>

                <div className="td-block-actions">
                  {isRoadmap && (
                    <button className="td-ghost" onClick={() => onOpenRoadmap?.()}>
                      Open
                    </button>
                  )}
                  {!isPastDay && !done && (
                    <button
                      className="td-focus"
                      onClick={() => {
                        sfx?.start?.();
                        onStartTaskTimer?.(task, true);
                      }}
                    >
                      Focus ▶
                    </button>
                  )}
                  {task.id.startsWith("custom-") && !isPastDay && (
                    <button className="td-remove" onClick={() => removeBlock(task.id)} aria-label="Remove block">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!isPastDay && (
          <div className="td-foot">
            {isAdding ? (
              <div className="td-add-form">
                <input
                  className="auth-input-field"
                  placeholder="Subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addBlock()}
                  autoFocus
                />
                <input
                  className="auth-input-field"
                  placeholder="What exactly (optional)"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addBlock()}
                />
                <div className="td-add-row">
                  <button className="td-cta small" onClick={addBlock} disabled={!newSubject.trim()}>
                    Add to {selectedDayName}s
                  </button>
                  <button className="td-ghost" onClick={() => setIsAdding(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button className="td-ghost" onClick={() => setIsAdding(true)}>
                  + Add block
                </button>
                <button
                  className="td-ghost muted"
                  onClick={() => {
                    if (window.confirm("Reset the routine to the default built from your university timetable?")) {
                      onResetSchedule?.();
                    }
                  }}
                >
                  Reset routine
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
