import React from "react";

export default function StreakView({
  streakMetrics,
  onToggleStreakFreeze,
  onBack,
  sfx
}) {
  const {
    currentStreak = 0,
    longestStreak = 0,
    todayProgress,
    streakFreezeEnabled,
    history = []
  } = streakMetrics || {};

  // Calculate total completed days across history
  const totalCompletedDays = history.filter(h => h.status === "done").length + (todayProgress?.isMet ? 1 : 0);
  const totalHoursStudied = history.reduce((sum, h) => sum + (h.secondsStudied || 0), 0) / 3600;

  // Total XP calculation
  // 120 XP per streak day + 60 XP per completed day + 25 XP per hour studied
  const totalXP = (currentStreak * 120) + (totalCompletedDays * 60) + Math.floor(totalHoursStudied * 25);

  // Focus & Discipline Level Progression
  const RANKS = [
    { level: 1, rank: "FOCUS NOVICE", title: "Focus Novice: Building the Foundation", minXP: 0, maxXP: 250, motto: "The journey toward unbreakable consistency begins with a single session." },
    { level: 2, rank: "DEEP WORKER", title: "Deep Worker: Establishing Rhythm", minXP: 250, maxXP: 600, motto: "Eliminating distractions step-by-step. Momentum is building." },
    { level: 3, rank: "CONSISTENCY CRAFTSMAN", title: "Consistency Craftsman: Steady Flow", minXP: 600, maxXP: 1200, motto: "Calm, steady execution in every academic block." },
    { level: 4, rank: "DISCIPLINED SCHOLAR", title: "Disciplined Scholar: High Retention", minXP: 1200, maxXP: 2200, motto: "A focused mind repels procrastination and masters complex ideas." },
    { level: 5, rank: "ROUTINE MASTER", title: "Routine Master: Academic Precision", minXP: 2200, maxXP: 3800, motto: "Unshakeable study habits and daily discipline." },
    { level: 6, rank: "APEX ACHIEVER", title: "Apex Achiever: Elite Focus", minXP: 3800, maxXP: 6000, motto: "High serenity, sharp intellect, and peak daily productivity." },
    { level: 7, rank: "UNSTOPPABLE FORCE", title: "Unstoppable Force: Limitless Work Ethic", minXP: 6000, maxXP: 9000, motto: "Complete mastery over time and cognitive endurance." },
    { level: 8, rank: "LEGENDARY SCHOLAR", title: "Legendary Scholar: Autonomous Excellence", minXP: 9000, maxXP: 15000, motto: "Acting with pure intent, zero hesitation. Apex of focus." }
  ];

  const currentRank = RANKS.find(r => totalXP >= r.minXP && totalXP < r.maxXP) || RANKS[RANKS.length - 1];
  const nextRank = RANKS.find(r => r.level === currentRank.level + 1) || currentRank;
  const xpInLevel = Math.max(0, totalXP - currentRank.minXP);
  const xpSpan = Math.max(1, currentRank.maxXP - currentRank.minXP);
  const levelProgressPct = Math.min(100, Math.round((xpInLevel / xpSpan) * 100));

  return (
    <div className="streak-hub-wrap fade-in">
      {/* ── HERO STREAK CARD WITH NEON FLAME GLOW ── */}
      <div className="streak-hero-card">
        <div className="hero-left">
          <div className={`flame-hero-icon ${currentStreak === 0 ? "cold" : ""}`}>
            {currentStreak > 0 ? "🔥" : "❄️"}
          </div>
          <div>
            <div className="hero-count-number">{currentStreak}</div>
            <div className="hero-count-label">
              {currentStreak === 1 ? "DAY ACTIVE STREAK" : "DAYS ACTIVE STREAK"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "28px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Best Streak
            </div>
            <div style={{ fontSize: "24px", fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--text)" }}>
              {longestStreak}d
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Today's Goal
            </div>
            <div style={{
              fontSize: "14px",
              fontWeight: 800,
              color: todayProgress?.isMet ? "var(--success)" : "var(--warning)",
              textShadow: todayProgress?.isMet ? "0 0 10px rgba(0, 255, 157, 0.4)" : "none",
              marginTop: "4px"
            }}>
              {todayProgress?.isMet ? "✓ Achieved" : "In Progress"}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONSISTENCY LEVEL & PROGRESS ── */}
      <div className="level-xp-card">
        <div className="level-xp-top">
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "1px" }}>
              [{currentRank.rank}] • LEVEL {currentRank.level}
            </span>
            <div className="level-title-badge" style={{ marginTop: "2px" }}>
              {currentRank.title}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", fontStyle: "italic" }}>
              "{currentRank.motto}"
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="xp-counter-text" style={{ fontWeight: 700, color: "var(--text)" }}>
              {totalXP} XP
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {nextRank !== currentRank ? `${currentRank.maxXP - totalXP} XP to Level ${nextRank.level}` : "Max Level Achieved"}
            </div>
          </div>
        </div>
        <div className="xp-bar-track" style={{ marginTop: "8px" }}>
          <div className="xp-bar-fill" style={{ width: `${levelProgressPct}%` }} />
        </div>
      </div>

      {/* ── STREAK FREEZE SHIELD ── */}
      <div className="minimal-card" style={{ cursor: "default" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)" }}>
                🛡️ Divergence Shield: Streak Freeze
              </span>
              {streakFreezeEnabled && (
                <span className="hero-day-tag" style={{ background: "var(--accent-soft)", borderColor: "var(--accent)" }}>
                  STREAK PROTECTED
                </span>
              )}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>
              Protects your streak so 1 missed day doesn't reset your active count.
            </div>
          </div>
          <button
            className={`guest-continue-btn ${streakFreezeEnabled ? "active" : ""}`}
            style={{
              width: "auto",
              padding: "8px 18px",
              borderColor: streakFreezeEnabled ? "var(--neon-cyan)" : "var(--border)",
              boxShadow: streakFreezeEnabled ? "0 0 16px var(--accent-glow)" : "none",
              color: streakFreezeEnabled ? "var(--neon-cyan)" : "var(--text-muted)"
            }}
            onClick={() => {
              sfx?.click?.();
              onToggleStreakFreeze?.(!streakFreezeEnabled);
            }}
          >
            {streakFreezeEnabled ? "🛡️ Shield Active" : "Equip Shield"}
          </button>
        </div>
      </div>

      {/* ── MINIMALIST 90-DAY ACTIVITY HEATMAP ── */}
      <div className="heatmap-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)" }}>
            90-Day Discipline &amp; Activity Grid
          </div>
          <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "var(--text-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--success)", boxShadow: "0 0 6px rgba(0,255,157,0.5)" }} />
              Goal Met
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--danger-soft)", border: "1px solid rgba(255, 45, 85, 0.4)" }} />
              Missed
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--border)" }} />
              Rest
            </span>
          </div>
        </div>

        <div className="heatmap-grid">
          {history.map((day, idx) => (
            <div
              key={idx}
              className={`heatmap-cell ${day.status}`}
              title={`${day.date} (${day.dayName}): ${day.status === "done" ? "Goal Met ✓" : day.status === "today" ? "Today" : day.status === "missed" ? "Missed" : "Rest"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
