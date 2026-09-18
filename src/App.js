import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  onSnapshot,
  terminate,
  clearIndexedDbPersistence
} from "firebase/firestore";

import {
  DEFAULT_ROUTINE_SCHEDULE
} from "./config/routineData";

import {
  loadRoutineSchedule,
  saveRoutineSchedule,
  loadAllDailyStates,
  updateTaskState,
  loadActiveTimerSession,
  saveActiveTimerSession,
  clearActiveTimerSession,
  loadStudyLog,
  saveStudyLog,
  recordStudyTime,
  loadStreakFreeze,
  saveStreakFreeze,
  isGuestMode,
  setGuestMode,
  dateStr as getStorageDateStr
} from "./utils/storage";

import { computeStreakMetrics } from "./utils/streakEngine";

import RoutineChecklist from "./components/RoutineChecklist";
import RoutineTable from "./components/RoutineTable";
import StudyTimer from "./components/StudyTimer";
import StreakView from "./components/StreakView";
import ActiveTimerBanner from "./components/ActiveTimerBanner";
import CustomCursor from "./components/CustomCursor";

import "./App.css";

// ── FIREBASE CONFIGURATION & OFFLINE PERSISTENCE ──
const firebaseConfig = {
  apiKey: "AIzaSyAjh6UHtqNWS2d4vsot1-WicwgevBzUtpg",
  authDomain: "studyquest-e3bc8.firebaseapp.com",
  projectId: "studyquest-e3bc8",
  storageBucket: "studyquest-e3bc8.firebasestorage.app",
  messagingSenderId: "291998260310",
  appId: "1:291998260310:web:5e8945c4dde8412e7faff7",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

let db;
try {
  db = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  db = getFirestore(firebaseApp);
}

async function cleanSignOut() {
  try { await signOut(auth); } catch (e) {}
  try { await terminate(db); await clearIndexedDbPersistence(db); } catch (e) {}
  setGuestMode(false);
  window.location.reload();
}

// ── RETRO SOUND ENGINE ──
let _actx = null;
function ac() {
  if (!_actx) {
    try {
      _actx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }
  return _actx;
}
let SOUND_ON = (() => {
  try {
    return localStorage.getItem("sq_sound") !== "off";
  } catch (e) {
    return true;
  }
})();
function setSoundOn(v) {
  SOUND_ON = v;
  try {
    localStorage.setItem("sq_sound", v ? "on" : "off");
  } catch (e) {}
}
function beep(freq, dur, type = "sine", vol = 0.08, when = 0) {
  if (!SOUND_ON) return;
  const ctx = ac();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  g.connect(ctx.destination);
  const t = ctx.currentTime + when;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.02);
}
const SFX = {
  tap: () => beep(480, 0.05, "sine", 0.06),
  click: () => beep(580, 0.05, "sine", 0.07),
  done: () => {
    beep(523, 0.06, "triangle", 0.09);
    beep(659, 0.08, "triangle", 0.09, 0.06);
    beep(784, 0.12, "triangle", 0.09, 0.12);
  },
  undo: () => beep(400, 0.08, "sine", 0.06),
  add: () => beep(600, 0.06, "triangle", 0.08),
  del: () => beep(280, 0.08, "sine", 0.07),
  start: () => {
    beep(520, 0.07, "triangle", 0.09);
    beep(680, 0.1, "triangle", 0.09, 0.07);
  },
  stop: () => beep(440, 0.09, "sine", 0.08),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.1, "triangle", 0.09, i * 0.07));
  }
};

// ── CYBERPUNK 2-LINE LOGO (NEON GLITCH ENGINE) ──
export function CyberLogo({ className = "" }) {
  return (
    <div className={`cyber-logo ${className}`}>
      {["STUDY", "STACK"].map((w) => (
        <span className="cl-line" key={w}>
          <span className="cl-glitch r" aria-hidden="true">{w}</span>
          <span className="cl-glitch c" aria-hidden="true">{w}</span>
          <span className="cl-main">{w}</span>
        </span>
      ))}
    </div>
  );
}

// ── AUTH SCREEN (CLEAN MINIMALIST) ──
function AuthScreen({ onGuest }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle() {
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        await createUserWithEmailAndPassword(auth, email, pass);
      }
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/\(auth.*\)\.?/, "").trim());
    }
    setLoading(false);
  }

  return (
    <div className="auth-screen-container fade-in">
      <div className="auth-card-clean">
        <div className="auth-header">
          <CyberLogo className="auth-cyber" />
          <div className="auth-sub">Routine &amp; Productivity Engine</div>
        </div>

        <div className="auth-tab-row">
          <button
            className={`auth-tab-btn ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Log In
          </button>
          <button
            className={`auth-tab-btn ${tab === "signup" ? "active" : ""}`}
            onClick={() => { setTab("signup"); setError(""); }}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-input-group">
          <label className="auth-label">Email</label>
          <input
            className="auth-input-field"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handle()}
          />
        </div>

        <div className="auth-input-group">
          <label className="auth-label">Password</label>
          <input
            className="auth-input-field"
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handle()}
          />
        </div>

        {error && (
          <div style={{ fontSize: "12px", color: "var(--danger)", background: "var(--danger-soft)", padding: "8px 12px", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        <button
          className="auth-submit-btn"
          onClick={handle}
          disabled={loading || !email || !pass}
        >
          {loading ? "Processing..." : tab === "login" ? "Enter Account" : "Create Account"}
        </button>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button className="guest-continue-btn" type="button" onClick={onGuest}>
          ⚡ Continue as Guest (Offline / Local)
        </button>
      </div>
    </div>
  );
}

// ── ACCOUNT & SETTINGS MODAL ──
function SettingsModal({ user, username, onUsername, onClose }) {
  const [uname, setUname] = useState(username || "");

  function handleSaveName() {
    onUsername(uname);
    if (user) {
      updateProfile(user, { displayName: uname }).catch(() => {});
    }
    onClose();
  }

  return (
    <div className="clean-modal-backdrop" onClick={onClose}>
      <div className="clean-modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--text)" }}>Account Settings</div>
          <button onClick={onClose} style={{ color: "var(--text-muted)", fontSize: "18px" }}>✕</button>
        </div>

        <div className="auth-input-group">
          <label className="auth-label">Display Name</label>
          <input
            type="text"
            className="auth-input-field"
            value={uname}
            placeholder="Your name"
            onChange={(e) => setUname(e.target.value)}
          />
        </div>

        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Signed in as: <strong>{user?.email || "Guest Mode"}</strong>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button className="auth-submit-btn" style={{ flex: 1 }} onClick={handleSaveName}>
            Save Changes
          </button>
          <button className="guest-continue-btn" style={{ flex: 1 }} onClick={cleanSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APPLICATION ──
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [guestMode, setGuestModeState] = useState(() => isGuestMode());

  // Dark / Light Mode Theme Engine
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem("sq_theme_mode") || "dark";
    } catch (e) {
      return "dark";
    }
  });

  // Apply theme attribute to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    try {
      localStorage.setItem("sq_theme_mode", themeMode);
    } catch (e) {}
  }, [themeMode]);

  function toggleTheme() {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
    SFX.click();
  }

  // Routine schedule & state persistence
  const [routineSchedule, setRoutineSchedule] = useState(() => loadRoutineSchedule());
  const [allDailyStates, setAllDailyStates] = useState(() => loadAllDailyStates());
  const [studyLog, setStudyLog] = useState(() => loadStudyLog());
  const [streakFreeze, setStreakFreeze] = useState(() => loadStreakFreeze());
  const [activeSession, setActiveTimerSession] = useState(() => loadActiveTimerSession());
  const [selectedDate, setSelectedDate] = useState(() => getStorageDateStr());
  const [todayDateStr, setTodayDateStr] = useState(() => getStorageDateStr());

  // Online / Offline network status
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" && "onLine" in navigator ? navigator.onLine : true));
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setSyncing(true);
      setTimeout(() => setSyncing(false), 1200);
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // 00:00 AM Midnight Rollover Check (locks previous days automatically at midnight)
  useEffect(() => {
    const checkMidnight = () => {
      const currentToday = getStorageDateStr();
      if (currentToday !== todayDateStr) {
        setTodayDateStr(currentToday);
      }
    };
    const interval = setInterval(checkMidnight, 10000);
    window.addEventListener("focus", checkMidnight);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkMidnight);
    };
  }, [todayDateStr]);

  // ── CENTRAL PERSISTENT TIMER TICK LOOP (RUNS ACROSS ALL TABS/PAGES & IN BACKGROUND) ──
  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return;

    const interval = setInterval(() => {
      setActiveTimerSession((prev) => {
        if (!prev || prev.isPaused) return prev;
        const now = Date.now();
        const last = prev.lastUpdatedTimestamp || now;
        const deltaSecs = Math.max(1, Math.floor((now - last) / 1000));
        const newElapsed = (prev.elapsedSeconds || 0) + deltaSecs;
        const isCountdown = (prev.targetSeconds || 0) > 0;
        const newRemaining = isCountdown ? Math.max(0, (prev.targetSeconds || 0) - newElapsed) : 0;

        const updated = {
          ...prev,
          elapsedSeconds: newElapsed,
          remainingSeconds: newRemaining,
          lastUpdatedTimestamp: last + (deltaSecs * 1000)
        };

        saveActiveTimerSession(updated);

        // Auto-complete when countdown hits 0
        if (isCountdown && newRemaining === 0 && (prev.remainingSeconds || 0) > 0) {
          SFX.win();
          const today = getStorageDateStr();
          const updatedLog = recordStudyTime(today, newElapsed);
          setStudyLog(updatedLog);
          if (prev.taskId) {
            updateTaskState(today, prev.taskId, {
              status: "completed",
              secondsStudied: newElapsed
            });
            setAllDailyStates((allPrev) => ({
              ...allPrev,
              [today]: {
                ...(allPrev[today] || {}),
                [prev.taskId]: {
                  ...(allPrev[today]?.[prev.taskId] || {}),
                  status: "completed",
                  secondsStudied: newElapsed
                }
              }
            }));
          }
          return {
            ...updated,
            isPaused: true,
            isCompleted: true
          };
        }

        return updated;
      });
    }, 1000);

    const handleCatchup = () => {
      if (document.visibilityState === "visible") {
        setActiveTimerSession((prev) => {
          if (!prev || prev.isPaused) return prev;
          const now = Date.now();
          const last = prev.lastUpdatedTimestamp || now;
          const deltaSecs = Math.max(0, Math.floor((now - last) / 1000));
          if (deltaSecs <= 0) return prev;
          const newElapsed = (prev.elapsedSeconds || 0) + deltaSecs;
          const isCountdown = (prev.targetSeconds || 0) > 0;
          const newRemaining = isCountdown ? Math.max(0, (prev.targetSeconds || 0) - newElapsed) : 0;
          const updated = {
            ...prev,
            elapsedSeconds: newElapsed,
            remainingSeconds: newRemaining,
            lastUpdatedTimestamp: now
          };
          saveActiveTimerSession(updated);
          return updated;
        });
      }
    };

    document.addEventListener("visibilitychange", handleCatchup);
    window.addEventListener("focus", handleCatchup);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleCatchup);
      window.removeEventListener("focus", handleCatchup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.isPaused, activeSession?.taskId, activeSession?.targetSeconds]);

  // Direct fullscreen focus launch flag
  const [focusLaunchTrigger, setFocusLaunchTrigger] = useState(false);

  // Profile / user
  const [username, setUsername] = useState("");
  const [view, setView] = useState("routine"); // routine | table | study | streak
  const [syncing, setSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOnState] = useState(SOUND_ON);

  function toggleSound() {
    const v = !soundOn;
    setSoundOn(v);
    setSoundOnState(v);
    if (v) SFX.click();
  }

  const unsubRef = useRef(null);
  const saveRef = useRef(null);
  const loadedForUid = useRef(null);

  // Auth observer
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        setGuestModeState(false);
        setGuestMode(false);
      }
    });
    return unsub;
  }, []);

  // Subscribe to Firestore if logged in
  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    loadedForUid.current = null;
    if (!user) return;
    setSyncing(true);
    const ref = doc(db, "users", user.uid, "data", "weeks");
    unsubRef.current = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.routineSchedule && Array.isArray(d.routineSchedule)) {
          const hasOldData = d.routineSchedule.some((t) => t.subject === "CTF" || t.subject === "AI Hackathon" || t.allocatedDurationMinutes);
          if (hasOldData && (!d.version || d.version < 3)) {
            setRoutineSchedule(DEFAULT_ROUTINE_SCHEDULE);
            saveRoutineSchedule(DEFAULT_ROUTINE_SCHEDULE);
            setDoc(ref, { ...d, version: 3, routineSchedule: DEFAULT_ROUTINE_SCHEDULE }, { merge: true });
          } else {
            const sanitized = d.routineSchedule.map(({ allocatedDurationMinutes, ...rest }) => rest);
            setRoutineSchedule(sanitized);
            saveRoutineSchedule(sanitized);
          }
        }
        if (d.allDailyStates) {
          setAllDailyStates(d.allDailyStates);
          try {
            localStorage.setItem("sq_daily_task_states_v2", JSON.stringify(d.allDailyStates));
          } catch (_) {}
        }
        if (d.studyLog) {
          setStudyLog(d.studyLog);
          saveStudyLog(d.studyLog);
        }
        if (d.streakFreeze !== undefined) {
          setStreakFreeze(d.streakFreeze);
          saveStreakFreeze(d.streakFreeze);
        }
        setUsername(d.username || "");
      } else {
        setDoc(ref, {
          routineSchedule,
          allDailyStates,
          studyLog,
          streakFreeze,
          username: ""
        });
      }
      loadedForUid.current = user.uid;
      setSyncing(false);
    });
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Debounced Firestore Cloud Save
  useEffect(() => {
    if (!user || loadedForUid.current !== user.uid) return;
    clearTimeout(saveRef.current);
    setSyncing(true);
    saveRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, "users", user.uid, "data", "weeks"), {
          routineSchedule,
          allDailyStates,
          studyLog,
          streakFreeze,
          username
        });
      } catch (e) {
        console.error("Cloud save failed:", e);
      }
      setSyncing(false);
    }, 800);
  }, [routineSchedule, allDailyStates, studyLog, streakFreeze, username, user]);

  // Streak Calculation
  const streakMetrics = computeStreakMetrics({
    routineSchedule,
    allDailyStates,
    studyLog,
    streakFreezeEnabled: streakFreeze
  });

  // Task & Schedule handlers with strict 00:00 AM Cutoff
  function handleToggleTaskStatus(dayStr, taskId, status) {
    const today = getStorageDateStr();
    if (dayStr < today) {
      console.warn("Action blocked: 00:00 AM cutoff passed for", dayStr);
      return;
    }
    const updated = updateTaskState(dayStr, taskId, { status });
    setAllDailyStates((prev) => ({
      ...prev,
      [dayStr]: updated
    }));
  }

  // Timer Control Handlers (centralized at App level)
  function handleStartTimerSession({ taskId = null, subject = "General Study", targetSeconds = 3600, openFullscreen = false }) {
    const session = {
      taskId,
      subject,
      targetSeconds,
      elapsedSeconds: 0,
      remainingSeconds: targetSeconds,
      isPaused: false,
      lastUpdatedTimestamp: Date.now()
    };
    setActiveTimerSession(session);
    saveActiveTimerSession(session);
    if (openFullscreen) {
      setFocusLaunchTrigger(true);
    }
    SFX.start();
  }

  function handleStartTaskTimer(task, openFullscreenFocus = false) {
    const today = getStorageDateStr();
    if (selectedDate < today) {
      alert("This routine day is locked (00:00 AM cutoff passed). You cannot start sessions for past days.");
      return;
    }
    handleStartTimerSession({
      taskId: task.id,
      subject: task.subject,
      targetSeconds: (task.allocatedDurationMinutes || 60) * 60,
      openFullscreen: openFullscreenFocus
    });
    setView("study");
  }

  function handlePauseTimer() {
    setActiveTimerSession((prev) => {
      if (!prev) return null;
      const now = Date.now();
      const delta = Math.max(0, Math.floor((now - (prev.lastUpdatedTimestamp || now)) / 1000));
      const newElapsed = (prev.elapsedSeconds || 0) + delta;
      const isCountdown = (prev.targetSeconds || 0) > 0;
      const newRemaining = isCountdown ? Math.max(0, (prev.targetSeconds || 0) - newElapsed) : 0;
      const updated = {
        ...prev,
        elapsedSeconds: newElapsed,
        remainingSeconds: newRemaining,
        isPaused: true,
        lastUpdatedTimestamp: now
      };
      saveActiveTimerSession(updated);
      return updated;
    });
    SFX.stop();
  }

  function handleResumeTimer() {
    setActiveTimerSession((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        isPaused: false,
        lastUpdatedTimestamp: Date.now()
      };
      saveActiveTimerSession(updated);
      return updated;
    });
    SFX.start();
  }

  function handleResetTimer() {
    clearActiveTimerSession();
    setActiveTimerSession(null);
    SFX.undo();
  }

  function handleAddTimerMinutes(mins = 5) {
    setActiveTimerSession((prev) => {
      if (!prev) return null;
      const addedSecs = mins * 60;
      const updated = {
        ...prev,
        targetSeconds: (prev.targetSeconds || 0) + addedSecs,
        remainingSeconds: (prev.remainingSeconds || 0) + addedSecs
      };
      saveActiveTimerSession(updated);
      return updated;
    });
    SFX.add();
  }

  function handleFinishTimer(secondsStudied, taskId, subject) {
    const today = getStorageDateStr();
    const updatedLog = recordStudyTime(today, secondsStudied);
    setStudyLog(updatedLog);

    if (taskId) {
      updateTaskState(today, taskId, {
        status: "completed",
        secondsStudied
      });
      setAllDailyStates((prev) => ({
        ...prev,
        [today]: {
          ...(prev[today] || {}),
          [taskId]: {
            ...(prev[today]?.[taskId] || {}),
            status: "completed",
            secondsStudied
          }
        }
      }));
    }

    clearActiveTimerSession();
    setActiveTimerSession(null);
  }

  function handleMarkTaskCompleted(taskId) {
    const today = getStorageDateStr();
    handleToggleTaskStatus(today, taskId, "completed");
  }

  function handleUpdateSchedule(newSchedule) {
    setRoutineSchedule(newSchedule);
    saveRoutineSchedule(newSchedule);
  }

  function handleResetSchedule() {
    setRoutineSchedule(DEFAULT_ROUTINE_SCHEDULE);
    saveRoutineSchedule(DEFAULT_ROUTINE_SCHEDULE);
    SFX.undo();
  }

  function handleToggleFreeze(val) {
    setStreakFreeze(val);
    saveStreakFreeze(val);
  }

  // Loading state
  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700 }}>LOADING STUDYSTACK...</div>
      </div>
    );
  }

  // Auth gate: Show login if not logged in and not guest
  if (!user && !guestMode) {
    return (
      <AuthScreen
        onGuest={() => {
          setGuestMode(true);
          setGuestModeState(true);
          SFX.click();
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* ── ANIME & CYBERPUNK CUSTOM MOUSE CURSOR (POINTER ONLY) ── */}
      <CustomCursor />

      {/* ── STICKY TOP HEADER ── */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand-section" onClick={() => { SFX.tap(); setView("routine"); }}>
            <CyberLogo className="header-cyber" />
            <div className="brand-badge">Focus Engine</div>
          </div>

          <div className="header-right-actions">
            <button
              className="streak-pill-btn"
              onClick={() => { SFX.click(); setView("streak"); }}
              title="View Gamified Streak Analytics"
            >
              <span className="streak-flame">{streakMetrics.currentStreak > 0 ? "🔥" : "❄️"}</span>
              <span>{streakMetrics.currentStreak}d</span>
            </button>

            <span className={`sync-status-pill ${syncing ? "syncing" : ""} ${!isOnline ? "offline" : ""}`}>
              {!isOnline ? "⚡ Offline" : syncing ? "🔄 Syncing..." : user ? "● Cloud" : "● Local"}
            </span>

            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${themeMode === "dark" ? "Light" : "Dark"} Mode`}
            >
              {themeMode === "dark" ? "☀️" : "🌙"}
            </button>

            <button
              className="sound-toggle-btn"
              onClick={toggleSound}
              title={soundOn ? "Mute sounds" : "Unmute sounds"}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>

            <button
              className="header-acct-btn"
              onClick={() => setShowSettings(true)}
              title="Account Settings"
            >
              {user ? (username || "Account") : "Settings"}
            </button>
          </div>
        </div>
      </header>

      {/* ── PERSISTENT ACTIVE TIMER FLOATING BANNER (TICKS LIVE ACROSS ALL PAGES) ── */}
      {view !== "study" && (
        <ActiveTimerBanner
          session={activeSession}
          onOpenTimer={() => {
            SFX.tap();
            setView("study");
          }}
          onTogglePause={() => {
            if (!activeSession) return;
            if (activeSession.isPaused) {
              handleResumeTimer();
            } else {
              handlePauseTimer();
            }
          }}
        />
      )}

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="main-content-wrap">
        {/* Desktop Segmented Navigation Tabs */}
        <nav className="desktop-nav-bar">
          <button
            className={`desktop-tab-btn ${view === "routine" ? "active" : ""}`}
            onClick={() => { SFX.tap(); setView("routine"); }}
          >
            📋 ROUTINE CHECKLIST
          </button>
          <button
            className={`desktop-tab-btn ${view === "table" ? "active" : ""}`}
            onClick={() => { SFX.tap(); setView("table"); }}
          >
            📅 TIMETABLE
          </button>
          <button
            className={`desktop-tab-btn ${view === "study" ? "active" : ""}`}
            onClick={() => { SFX.tap(); setView("study"); }}
          >
            ⏱️ STUDY TIMER
          </button>
          <button
            className={`desktop-tab-btn ${view === "streak" ? "active" : ""}`}
            onClick={() => { SFX.tap(); setView("streak"); }}
          >
            🔥 STREAK TRACKER
          </button>
        </nav>

        {/* Views */}
        {view === "routine" && (
          <RoutineChecklist
            routineSchedule={routineSchedule}
            dailyStates={allDailyStates[selectedDate] || {}}
            selectedDateStr={selectedDate}
            onSelectDate={setSelectedDate}
            onToggleTaskStatus={handleToggleTaskStatus}
            onStartTaskTimer={handleStartTaskTimer}
            onUpdateSchedule={handleUpdateSchedule}
            onResetSchedule={handleResetSchedule}
            sfx={SFX}
          />
        )}

        {view === "table" && (
          <RoutineTable
            routineSchedule={routineSchedule}
            onStartTaskTimer={handleStartTaskTimer}
          />
        )}

        {view === "study" && (
          <StudyTimer
            activeSession={activeSession}
            onStartSession={handleStartTimerSession}
            onPauseSession={handlePauseTimer}
            onResumeSession={handleResumeTimer}
            onResetSession={handleResetTimer}
            onAddMinutes={handleAddTimerMinutes}
            onFinishSession={handleFinishTimer}
            onMarkTaskCompleted={handleMarkTaskCompleted}
            routineSchedule={routineSchedule}
            sfx={SFX}
            initialFocusMode={focusLaunchTrigger}
          />
        )}

        {view === "streak" && (
          <StreakView
            streakMetrics={streakMetrics}
            onToggleStreakFreeze={handleToggleFreeze}
            onBack={() => setView("routine")}
            sfx={SFX}
          />
        )}
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${view === "routine" ? "active" : ""}`}
          onClick={() => { SFX.tap(); setView("routine"); }}
        >
          <span className="mobile-nav-icon">📋</span>
          <span className="mobile-nav-label">Checklist</span>
        </button>

        <button
          className={`mobile-nav-item ${view === "table" ? "active" : ""}`}
          onClick={() => { SFX.tap(); setView("table"); }}
        >
          <span className="mobile-nav-icon">📅</span>
          <span className="mobile-nav-label">Timetable</span>
        </button>

        <button
          className={`mobile-nav-item ${view === "study" ? "active" : ""}`}
          onClick={() => { SFX.tap(); setView("study"); }}
        >
          <span className="mobile-nav-icon">⏱️</span>
          <span className="mobile-nav-label">Timer</span>
        </button>

        <button
          className={`mobile-nav-item ${view === "streak" ? "active" : ""}`}
          onClick={() => { SFX.tap(); setView("streak"); }}
        >
          <span className="mobile-nav-icon">🔥</span>
          <span className="mobile-nav-label">Streak</span>
        </button>
      </nav>

      {/* ── SETTINGS MODAL ── */}
      {showSettings && (
        <SettingsModal
          user={user}
          username={username}
          onUsername={setUsername}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}