import React from "react";
import {
  AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing,
} from "remotion";
import { Background } from "./Background";
import { CyberLogo } from "./Logo";
import { FONT } from "./fonts";
import { THEMES, THEME_ORDER } from "./themes";

// ── shared timeline (frames @30fps) ─────────────────────────────────────────
const D = {
  logo: 110, tagline: 85, tasks: 150, study: 150, streak: 120,
  lockin: 140, motivation: 140, themes: 205, close: 175,
};
const START = {};
{
  let acc = 0;
  for (const k of ["logo", "tagline", "tasks", "study", "streak", "lockin", "motivation", "themes", "close"]) {
    START[k] = acc; acc += D[k];
  }
}
export const TOTAL = Object.values(D).reduce((a, b) => a + b, 0);

// background theme schedule (seconds). Calm drift under features, then a rapid
// cycle through all five during the THEMES scene, settling on retrowave to close.
const FPS = 30;
const s = (f) => f / FPS;
const themeTimeline = [
  { at: 0, key: "retrowave" },
  { at: s(START.tasks), key: "cyberpunk" },
  { at: s(START.streak), key: "midnight" },
  { at: s(START.lockin), key: "inferno" },
  { at: s(START.motivation), key: "cyberpunk" },
  { at: s(START.themes + 5), key: "retrowave" },
  { at: s(START.themes + 38), key: "cyberpunk" },
  { at: s(START.themes + 71), key: "aurora" },
  { at: s(START.themes + 104), key: "inferno" },
  { at: s(START.themes + 137), key: "midnight" },
  { at: s(START.close), key: "retrowave" },
  { at: 999, key: "retrowave" },
];

// ── tiny animation helpers ───────────────────────────────────────────────────
const NEON = "#22e0ff";
const PINK = "#ff2d9b";
const PURPLE = "#c45bff";

const Rise = ({ delay = 0, children, y = 46, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });
  const opacity = interpolate(frame - delay, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blur = interpolate(sp, [0, 1], [8, 0]);
  return (
    <div style={{ opacity, transform: `translateY(${(1 - sp) * y}px)`, filter: `blur(${blur}px)`, ...style }}>
      {children}
    </div>
  );
};

const Kicker = ({ children, delay = 0 }) => (
  <Rise delay={delay} y={24}>
    <div style={{
      fontFamily: FONT.mono, fontSize: 27, letterSpacing: 9, color: "rgba(255,255,255,0.6)",
      textTransform: "uppercase", marginBottom: 48, textAlign: "center",
    }}>{children}</div>
  </Rise>
);

const Center = ({ children, pad = 130 }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: `0 ${pad}px`, textAlign: "center" }}>
    {children}
  </AbsoluteFill>
);

const accentText = {
  backgroundImage: `linear-gradient(90deg,${PINK},${PURPLE},${NEON})`,
  WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
  filter: "drop-shadow(0 0 30px rgba(255,45,155,0.45))",
};

const glassCard = {
  background: "rgba(16,8,28,0.6)", border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(14px)", borderRadius: 28,
};

// ── 1. LOGO ──────────────────────────────────────────────────────────────────
const SceneLogo = () => (
  <Center>
    <CyberLogo size={158} />
    <Rise delay={34} y={20}>
      <div style={{ marginTop: 50, fontFamily: FONT.mono, fontSize: 30, letterSpacing: 14, color: "rgba(255,255,255,0.55)" }}>
        WEEKLY ROUTINE TRACKER
      </div>
    </Rise>
  </Center>
);

// ── 2. TAGLINE ────────────────────────────────────────────────────────────────
const SceneTagline = () => (
  <Center>
    <Rise delay={6}>
      <div style={{ fontFamily: FONT.rajdhani, fontWeight: 300, color: "#fff", fontSize: 104, lineHeight: 1.05 }}>
        Your week.
      </div>
    </Rise>
    <Rise delay={20}>
      <div style={{ fontFamily: FONT.rajdhani, fontWeight: 700, fontSize: 132, lineHeight: 1.05, ...accentText }}>
        Stacked.
      </div>
    </Rise>
    <Rise delay={40} y={26}>
      <div style={{ marginTop: 40, fontFamily: FONT.rajdhani, fontWeight: 400, fontSize: 46, color: "rgba(255,255,255,0.72)", lineHeight: 1.4 }}>
        Plan it. Focus on it.<br />Never break the chain.
      </div>
    </Rise>
  </Center>
);

// ── 3. TASKS ──────────────────────────────────────────────────────────────────
const DayCard = ({ d, n, name, meta, delay, checkAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const check = spring({ frame: frame - checkAt, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 30, padding: "36px 42px", ...glassCard,
      opacity: sp, transform: `translateX(${(1 - sp) * 70}px)`,
    }}>
      <div style={{
        width: 102, height: 102, borderRadius: 18, flexShrink: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", border: `1px solid ${PINK}55`, background: "rgba(0,0,0,0.4)",
      }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 21, letterSpacing: 3, color: PINK }}>{d}</span>
        <span style={{ fontFamily: FONT.orbitron, fontSize: 40, fontWeight: 700, color: "#fff" }}>{n}</span>
      </div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontFamily: FONT.orbitron, fontWeight: 700, fontSize: 42, color: "#fff" }}>{name}</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 25, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>{meta}</div>
      </div>
      <div style={{
        width: 70, height: 70, borderRadius: 17, flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 42, color: "#000", background: "#3dff8f",
        boxShadow: "0 0 30px rgba(61,255,143,0.5)", transform: `scale(${check})`,
      }}>✓</div>
    </div>
  );
};
const SceneTasks = () => (
  <Center pad={90}>
    <Kicker>Every day, organized</Kicker>
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: 820 }}>
      <DayCard d="MON" n="22" name="Monday" meta="3 of 3 done · weekly routine" delay={10} checkAt={40} />
      <DayCard d="TUE" n="23" name="Tuesday" meta="2 of 2 done · 1 one-time" delay={18} checkAt={52} />
      <DayCard d="WED" n="24" name="Wednesday" meta="3 of 3 done" delay={26} checkAt={64} />
    </div>
    <Rise delay={84} y={20}>
      <div style={{ marginTop: 40, fontFamily: FONT.rajdhani, fontWeight: 500, fontSize: 40, color: "rgba(255,255,255,0.78)" }}>
        Weekly &amp; one-time tasks · auto carry-forward
      </div>
    </Rise>
  </Center>
);

// ── 4. STUDY TIMER ────────────────────────────────────────────────────────────
const SceneStudy = () => {
  const frame = useCurrentFrame();
  const R = 252, C = 2 * Math.PI * R;
  const prog = interpolate(frame, [14, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const secs = Math.round(interpolate(frame, [14, 120], [0, 1500], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <Center>
      <Kicker>Focus, measured</Kicker>
      <div style={{ width: 560, height: 560, position: "relative", marginTop: 10 }}>
        <svg width="560" height="560" viewBox="0 0 560 560" style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={PINK} /><stop offset="0.5" stopColor={PURPLE} /><stop offset="1" stopColor={NEON} />
            </linearGradient>
          </defs>
          <circle cx="280" cy="280" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" />
          <circle cx="280" cy="280" r={R} fill="none" stroke="url(#g)" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - prog)} style={{ filter: `drop-shadow(0 0 16px ${PINK})` }} />
        </svg>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontFamily: FONT.orbitron, fontWeight: 700, fontSize: 124, color: "#fff", textShadow: `0 0 30px ${PINK}` }}>
            {mm}:{ss}
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 27, letterSpacing: 8, color: NEON, marginTop: 10 }}>● STUDYING</div>
        </AbsoluteFill>
      </div>
      <Rise delay={96} y={18}>
        <div style={{ marginTop: 44, fontFamily: FONT.mono, fontSize: 30, letterSpacing: 3, color: "rgba(255,255,255,0.7)" }}>
          TODAY <span style={{ color: NEON }}>3h 12m</span> · STAYS AWAKE WHILE YOU FOCUS
        </div>
      </Rise>
    </Center>
  );
};

// ── 5. STREAK ─────────────────────────────────────────────────────────────────
const SceneStreak = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 8, fps, config: { damping: 11, stiffness: 160 } });
  const num = Math.round(interpolate(frame, [16, 70], [0, 14], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const flick = 1 + Math.sin(frame / 4) * 0.03;
  const cells = ["d", "d", "d", "m", "d", "d", "t", "d", "d", "d", "d", "d", "r", "f"];
  const cmap = {
    d: { bg: "rgba(61,255,143,0.85)", bd: "#3dff8f", c: "#04140d" },
    m: { bg: "rgba(255,64,96,0.18)", bd: "rgba(255,64,96,0.5)", c: "#ff96a5" },
    r: { bg: "rgba(255,255,255,0.03)", bd: "rgba(255,255,255,0.12)", c: "rgba(255,255,255,0.25)" },
    t: { bg: "rgba(0,0,0,0.3)", bd: NEON, c: NEON },
    f: { bg: "rgba(255,255,255,0.03)", bd: "rgba(255,255,255,0.08)", c: "rgba(255,255,255,0.15)" },
  };
  return (
    <Center pad={110}>
      <Kicker>Keep the fire going</Kicker>
      <div style={{ fontSize: 200, lineHeight: 1, transform: `scale(${pop * flick})`, filter: "drop-shadow(0 0 60px rgba(255,140,40,0.6))" }}>🔥</div>
      <div style={{
        fontFamily: FONT.orbitron, fontWeight: 900, fontSize: 180, lineHeight: 1, marginTop: 4,
        backgroundImage: "linear-gradient(90deg,#ffd84d,#ff7a18)", WebkitBackgroundClip: "text", backgroundClip: "text",
        WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 40px rgba(255,122,24,0.4))",
      }}>{num}</div>
      <div style={{ fontFamily: FONT.mono, fontSize: 32, letterSpacing: 12, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>DAY STREAK</div>
      <Rise delay={70} y={20}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 12, marginTop: 46, width: 620 }}>
          {cells.map((k, i) => {
            const cc = cmap[k];
            return <div key={i} style={{
              aspectRatio: "1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT.mono, fontSize: 26, fontWeight: 700, background: cc.bg, border: `1px solid ${cc.bd}`, color: cc.c,
              boxShadow: k === "d" ? "0 0 8px rgba(61,255,143,0.4)" : k === "t" ? `0 0 8px ${NEON}` : "none",
            }}>{i + 10}</div>;
          })}
        </div>
      </Rise>
    </Center>
  );
};

// ── 6. LOCK IN ────────────────────────────────────────────────────────────────
const SceneLockIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6, fps, config: { damping: 12 } });
  const total = 45 * 60;
  const left = Math.round(interpolate(frame, [20, 120], [total, total - 137], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const hh = String(Math.floor(left / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pulse = 0.5 + 0.5 * Math.abs(Math.sin(frame / 12));
  return (
    <Center pad={110}>
      <Kicker>No escape. That's the point.</Kicker>
      <div style={{ fontSize: 150, transform: `scale(${pop})`, filter: "drop-shadow(0 0 50px rgba(255,122,24,0.55))" }}>🔒</div>
      <div style={{
        fontFamily: FONT.orbitron, fontWeight: 900, fontSize: 134, marginTop: 10, color: "#fff",
        textShadow: `0 0 ${20 + pulse * 26}px #ff7a18`, letterSpacing: 2,
      }}>{hh}:{mm}:{ss}</div>
      <div style={{ fontFamily: FONT.mono, fontSize: 28, letterSpacing: 8, color: "#ffb060", marginTop: 14 }}>COMMITTED · LOCKED IN</div>
      <Rise delay={70} y={20}>
        <div style={{ marginTop: 40, fontFamily: FONT.rajdhani, fontWeight: 500, fontSize: 42, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
          Screen stays awake. Bail early only by<br />donating <span style={{ color: "#ffd23f", fontWeight: 700 }}>500&#2547;</span>.
        </div>
      </Rise>
    </Center>
  );
};

// ── 7. MOTIVATION ─────────────────────────────────────────────────────────────
const ROAST = "RAKIB just finished another chapter. And you?";
const SceneMotivation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6, fps, config: { damping: 12 } });
  const chars = Math.round(interpolate(frame, [30, 110], [0, ROAST.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const caret = Math.floor(frame / 8) % 2 === 0 ? "▌" : " ";
  const typed = ROAST.slice(0, chars);
  return (
    <Center pad={110}>
      <Kicker>Pick a rival. Get roasted.</Kicker>
      <div style={{ fontSize: 140, transform: `scale(${pop})`, filter: "drop-shadow(0 0 40px rgba(255,45,155,0.5))" }}>😈</div>
      <div style={{ marginTop: 24, fontFamily: FONT.mono, fontSize: 28, letterSpacing: 6, color: PINK }}>RIVAL: RAKIB</div>
      <div style={{
        marginTop: 30, ...glassCard, borderColor: `${PINK}66`, padding: "40px 44px", maxWidth: 820,
        fontFamily: FONT.rajdhani, fontWeight: 600, fontSize: 56, color: "#fff", lineHeight: 1.3, minHeight: 180,
        boxShadow: "0 0 50px -10px rgba(255,45,155,0.4)",
      }}>
        "{typed}<span style={{ color: PINK }}>{chars < ROAST.length ? caret : ""}</span>"
      </div>
      <Rise delay={118} y={16}>
        <div style={{ marginTop: 30, fontFamily: FONT.mono, fontSize: 26, letterSpacing: 3, color: "rgba(255,255,255,0.55)" }}>
          50+ savage lines · every time you open the app
        </div>
      </Rise>
    </Center>
  );
};

// ── 8. THEMES ─────────────────────────────────────────────────────────────────
const SceneThemes = () => {
  const frame = useCurrentFrame();
  // active theme tracks the background cycle: starts ~frame 5, ~33f each
  const idx = Math.max(0, Math.min(THEME_ORDER.length - 1, Math.floor((frame - 5) / 33)));
  return (
    <Center pad={90}>
      <Kicker>Five worlds to study in</Kicker>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%", maxWidth: 840 }}>
        {THEME_ORDER.map((key, i) => {
          const t = THEMES[key];
          const active = i === idx;
          return (
            <Rise key={key} delay={10 + i * 6} y={30}>
              <div style={{
                position: "relative", display: "flex", alignItems: "center", gap: 34, padding: "30px 42px",
                borderRadius: 26, overflow: "hidden", background: t.sky[0],
                border: `1px solid ${active ? t.accent : t.accent + "55"}`,
                boxShadow: active ? `0 0 60px -8px ${t.accent}` : `0 0 30px -16px ${t.accent}`,
                transform: `scale(${active ? 1.045 : 1})`, transition: "transform 0.2s", opacity: active ? 1 : 0.72,
              }}>
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg,${t.accent} 0%,transparent 55%)`, opacity: active ? 0.2 : 0.1 }} />
                <span style={{ fontSize: 72, zIndex: 1, filter: `drop-shadow(0 0 18px ${t.accent})` }}>{t.icon}</span>
                <span style={{
                  flex: 1, textAlign: "left", fontFamily: FONT.orbitron, fontWeight: 700, fontSize: 50, letterSpacing: 4, zIndex: 1,
                  backgroundImage: `linear-gradient(90deg,${t.accent},${t.accent2},${t.accent3})`,
                  WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>{t.name}</span>
                <span style={{
                  width: 130, height: 26, borderRadius: 13, zIndex: 1,
                  background: `linear-gradient(90deg,${t.accent},${t.accent2},${t.accent3})`, boxShadow: `0 0 22px -4px ${t.accent}`,
                }} />
              </div>
            </Rise>
          );
        })}
      </div>
      <Rise delay={150} y={16}>
        <div style={{ marginTop: 34, fontFamily: FONT.rajdhani, fontWeight: 500, fontSize: 40, color: "rgba(255,255,255,0.75)" }}>
          One tap. The whole world repaints.
        </div>
      </Rise>
    </Center>
  );
};

// ── 9. SYNC + CLOSE ───────────────────────────────────────────────────────────
const SceneClose = () => {
  const frame = useCurrentFrame();
  const tags = ["TASKS", "STUDY TIMER", "STREAKS", "LOCK IN", "MOTIVATION", "5 THEMES", "CLOUD SYNC"];
  return (
    <Center>
      <Rise delay={4} y={18}>
        <div style={{ fontFamily: FONT.mono, fontSize: 26, letterSpacing: 8, color: "rgba(255,255,255,0.55)", marginBottom: 34 }}>
          SIGN IN · SYNCS ACROSS EVERY DEVICE
        </div>
      </Rise>
      <CyberLogo size={112} delay={10} />
      <Rise delay={40} y={22}>
        <div style={{ marginTop: 78, fontFamily: FONT.rajdhani, fontWeight: 300, fontSize: 66, color: "#fff" }}>
          Available <b style={{ fontWeight: 700, ...accentText }}>now</b>.
        </div>
      </Rise>
      <Rise delay={56} y={18}>
        <div style={{ marginTop: 24, fontFamily: FONT.mono, fontSize: 30, letterSpacing: 3, color: NEON }}>
          nabilxhasan.github.io/studystack
        </div>
      </Rise>
      <Rise delay={74} y={16}>
        <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 760 }}>
          {tags.map((tg) => (
            <span key={tg} style={{
              fontFamily: FONT.mono, fontSize: 22, letterSpacing: 2, color: "rgba(255,255,255,0.8)",
              padding: "8px 16px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.04)",
            }}>{tg}</span>
          ))}
        </div>
      </Rise>
    </Center>
  );
};

// progress ticks along the bottom
const Progress = () => {
  const frame = useCurrentFrame();
  const keys = Object.keys(D);
  return (
    <div style={{ position: "absolute", bottom: 70, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14 }}>
      {keys.map((k) => {
        const p = interpolate(frame, [START[k], START[k] + D[k]], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={k} style={{ width: 50, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${p * 100}%`, background: "#fff" }} />
          </div>
        );
      })}
    </div>
  );
};

// Fade the foreground out at the tail of each scene (entrances stay spring-driven).
const SceneFade = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 6, dur - 12, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const Scene = ({ name, children }) => (
  <Sequence from={START[name]} durationInFrames={D[name]}>
    <SceneFade dur={D[name]}>{children}</SceneFade>
  </Sequence>
);

export const LaunchVideo = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Background themeTimeline={themeTimeline} />
    <Scene name="logo"><SceneLogo /></Scene>
    <Scene name="tagline"><SceneTagline /></Scene>
    <Scene name="tasks"><SceneTasks /></Scene>
    <Scene name="study"><SceneStudy /></Scene>
    <Scene name="streak"><SceneStreak /></Scene>
    <Scene name="lockin"><SceneLockIn /></Scene>
    <Scene name="motivation"><SceneMotivation /></Scene>
    <Scene name="themes"><SceneThemes /></Scene>
    <Scene name="close"><SceneClose /></Scene>
    <Progress />
  </AbsoluteFill>
);
