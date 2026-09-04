import React, { useState } from "react";

export default function StreakView({
  streakMetrics,
  onToggleStreakFreeze,
  onBack,
  sfx
}) {
  const [badgeFilter, setBadgeFilter] = useState("ALL");

  const {
    currentStreak = 0,
    longestStreak = 0,
    todayProgress,
    streakFreezeEnabled,
    history = []
  } = streakMetrics || {};

  // Gamification: Calculate total completed days across history
  const totalCompletedDays = history.filter(h => h.status === "done").length + (todayProgress?.isMet ? 1 : 0);
  const totalHoursStudied = history.reduce((sum, h) => sum + (h.secondsStudied || 0), 0) / 3600;

  // Total XP calculation
  // 120 XP per streak day + 60 XP per completed day + 25 XP per hour studied
  const totalXP = (currentStreak * 120) + (totalCompletedDays * 60) + Math.floor(totalHoursStudied * 25);

  // Anime Rank Progression (DBS • JJK • MHA • Demon Slayer • Dr. STONE • Steins;Gate • Hunter x Hunter)
  const RANKS = [
    { level: 1, rank: "LAB MEMBER 004", title: "Lab Member 004: Future Gadget Lab", anime: "Steins;Gate", minXP: 0, maxXP: 250, motto: "Operation Skuld: The journey toward 1.048596% divergence begins." },
    { level: 2, rank: "KINGDOM OF SCIENCE", title: "Kingdom of Science: Craftsman", anime: "Dr. Stone", minXP: 250, maxXP: 600, motto: "Acquiring science step-by-step. This is ten billion percent exhilarating!" },
    { level: 3, rank: "DEMON SLAYER CORPS", title: "Demon Slayer Corps: Mizunoto", anime: "Demon Slayer", minXP: 600, maxXP: 1200, motto: "Total Concentration Breathing: Constant. Steady rhythm in every task." },
    { level: 4, rank: "LICENSED HUNTER", title: "Pro Hunter: Nen Mastery (Ten & Ren)", anime: "Hunter x Hunter", minXP: 1200, maxXP: 2200, motto: "Water divination complete. A focused aura repels all procrastination." },
    { level: 5, rank: "UA CLASS 1-A", title: "UA High: Hero Course Prodigy", anime: "My Hero Academia", minXP: 2200, maxXP: 3800, motto: "One For All 20% Full Cowl: Shoot Style. Plus Ultra!" },
    { level: 6, rank: "SUPER SAIYAN BLUE", title: "Super Saiyan Blue: Divine Ki", anime: "Dragon Ball Super", minXP: 3800, maxXP: 6000, motto: "God Ki awakened. Perfect serenity and explosive productivity." },
    { level: 7, rank: "SPECIAL GRADE", title: "Special Grade Sorcerer: Limitless", anime: "Jujutsu Kaisen", minXP: 6000, maxXP: 9000, motto: "Infinite Void & Hollow Purple: Erasing all distractions from existence." },
    { level: 8, rank: "ULTRA INSTINCT", title: "Mastered Ultra Instinct: Supreme Angel", anime: "Dragon Ball Super", minXP: 9000, maxXP: 15000, motto: "The body acts on pure instinct, zero hesitation. Apex of focus." }
  ];

  const currentRank = RANKS.find(r => totalXP >= r.minXP && totalXP < r.maxXP) || RANKS[RANKS.length - 1];
  const nextRank = RANKS.find(r => r.level === currentRank.level + 1) || currentRank;
  const xpInLevel = Math.max(0, totalXP - currentRank.minXP);
  const xpSpan = Math.max(1, currentRank.maxXP - currentRank.minXP);
  const levelProgressPct = Math.min(100, Math.round((xpInLevel / xpSpan) * 100));

  // 52 Anime Milestone Badges (The 52-Hour Routine Master Edition)
  const BADGES = [
    // ── DR. STONE (7 Badges) ──
    {
      id: "drs_senku_first",
      franchise: "DR. STONE",
      rank: "SCIENCE",
      icon: "🧪",
      name: "Ten Billion Percent!",
      desc: "Complete your first daily routine target",
      anime: "Dr. Stone (Senku)",
      unlocked: currentStreak >= 1 || totalCompletedDays >= 1
    },
    {
      id: "drs_power_plant",
      franchise: "DR. STONE",
      rank: "SCIENCE",
      icon: "⚡",
      name: "Kingdom of Science: Power Plant",
      desc: "Log 45+ minutes of continuous deep study",
      anime: "Dr. Stone (Senku & Chrome)",
      unlocked: totalHoursStudied >= 0.75
    },
    {
      id: "drs_revival_fluid",
      franchise: "DR. STONE",
      rank: "SCIENCE",
      icon: "💧",
      name: "Nital: Miracle Revival Fluid",
      desc: "Complete 2+ routine blocks in a single day",
      anime: "Dr. Stone (Senku)",
      unlocked: Boolean(todayProgress?.completedTasks >= 2)
    },
    {
      id: "drs_iron_furnace",
      franchise: "DR. STONE",
      rank: "SCIENCE",
      icon: "🔥",
      name: "Iron Smelting & The Blast Furnace",
      desc: "Log 3+ cumulative hours of focused study",
      anime: "Dr. Stone (Kaseki)",
      unlocked: totalHoursStudied >= 3
    },
    {
      id: "drs_sulfa_drug",
      franchise: "DR. STONE",
      rank: "SCIENCE",
      icon: "💊",
      name: "Panacea: The Sulfa Drug Road",
      desc: "Complete 3+ days of routine study",
      anime: "Dr. Stone (Senku & Chrome)",
      unlocked: totalCompletedDays >= 3
    },
    {
      id: "drs_light_bulb",
      franchise: "DR. STONE",
      rank: "SCIENCE",
      icon: "💡",
      name: "Tungsten Light Bulb: Conquering Night",
      desc: "Log 6+ cumulative hours of study",
      anime: "Dr. Stone (Senku)",
      unlocked: totalHoursStudied >= 6
    },
    {
      id: "drs_rocket_moon",
      franchise: "DR. STONE",
      rank: "SCIENCE",
      icon: "🚀",
      name: "Perseus: Voyage to the Moon",
      desc: "Log 25+ cumulative hours of study",
      anime: "Dr. Stone (Kingdom of Science)",
      unlocked: totalHoursStudied >= 25
    },

    // ── STEINS;GATE (7 Badges) ──
    {
      id: "sg_reading_steiner",
      franchise: "STEINS;GATE",
      rank: "LAB MEMBER",
      icon: "📟",
      name: "Reading Steiner: Worldline Shift",
      desc: "Equip Divergence Shield (Streak Freeze)",
      anime: "Steins;Gate (Okabe Rintaro)",
      unlocked: Boolean(streakFreezeEnabled)
    },
    {
      id: "sg_operation_skuld",
      franchise: "STEINS;GATE",
      rank: "LAB MEMBER",
      icon: "🌀",
      name: "Operation Skuld: El Psy Kongroo",
      desc: "Finish 100% of all scheduled tasks in a single day",
      anime: "Steins;Gate (Hououin Kyouma)",
      unlocked: Boolean(todayProgress?.totalTasks > 0 && todayProgress?.completedTasks === todayProgress?.totalTasks)
    },
    {
      id: "sg_future_gadget",
      franchise: "STEINS;GATE",
      rank: "LAB MEMBER",
      icon: "📻",
      name: "Future Gadget No. 8: PhoneWave",
      desc: "Log 30+ minutes of focused study",
      anime: "Steins;Gate (Daru & Okabe)",
      unlocked: totalHoursStudied >= 0.5
    },
    {
      id: "sg_divergence_1",
      franchise: "STEINS;GATE",
      rank: "LAB MEMBER",
      icon: "🧭",
      name: "Divergence 1.048596%: Steins Gate",
      desc: "Reach a 14-day consecutive active streak",
      anime: "Steins;Gate (Future Gadget Lab)",
      unlocked: currentStreak >= 14 || longestStreak >= 14
    },
    {
      id: "sg_makise_kurisu",
      franchise: "STEINS;GATE",
      rank: "LAB MEMBER",
      icon: "🧠",
      name: "Makise Kurisu: Neuroscientific Focus",
      desc: "Complete 4+ routine blocks in a single day",
      anime: "Steins;Gate (Kurisu)",
      unlocked: Boolean(todayProgress?.completedTasks >= 4)
    },
    {
      id: "sg_operation_urdr",
      franchise: "STEINS;GATE",
      rank: "LAB MEMBER",
      icon: "⏳",
      name: "Operation Urd: Temporal Continuity",
      desc: "Maintain a 4-day active routine streak",
      anime: "Steins;Gate (Hououin Kyouma)",
      unlocked: currentStreak >= 4 || longestStreak >= 4
    },
    {
      id: "sg_operation_verthandi",
      franchise: "STEINS;GATE",
      rank: "LAB MEMBER",
      icon: "🌐",
      name: "Operation Verthandi: Past, Present, Future",
      desc: "Log 12+ cumulative hours of study",
      anime: "Steins;Gate (Suzuha Amane)",
      unlocked: totalHoursStudied >= 12
    },

    // ── DEMON SLAYER (8 Badges) ──
    {
      id: "ds_water_slash",
      franchise: "DEMON SLAYER",
      rank: "SLAYER",
      icon: "🌊",
      name: "First Form: Water Surface Slash",
      desc: "Complete your first study block session",
      anime: "Demon Slayer (Tanjiro)",
      unlocked: totalHoursStudied >= 0.3
    },
    {
      id: "ds_total_concentration",
      franchise: "DEMON SLAYER",
      rank: "SLAYER",
      icon: "🫁",
      name: "Total Concentration: Constant",
      desc: "Maintain a 3-day active routine streak",
      anime: "Demon Slayer (Tanjiro)",
      unlocked: currentStreak >= 3 || longestStreak >= 3
    },
    {
      id: "ds_thunderclap",
      franchise: "DEMON SLAYER",
      rank: "SLAYER",
      icon: "⚡",
      name: "Thunder Breathing: Thunderclap & Flash",
      desc: "Complete a study session in under 45 minutes",
      anime: "Demon Slayer (Zenitsu)",
      unlocked: Boolean(todayProgress?.completedTasks >= 1 && totalHoursStudied >= 0.5)
    },
    {
      id: "ds_beast_awareness",
      franchise: "DEMON SLAYER",
      rank: "SLAYER",
      icon: "🐗",
      name: "Beast Breathing: Spatial Awareness",
      desc: "Complete 3+ routine blocks in a single day",
      anime: "Demon Slayer (Inosuke)",
      unlocked: Boolean(todayProgress?.completedTasks >= 3)
    },
    {
      id: "ds_hinokami_kagura",
      franchise: "DEMON SLAYER",
      rank: "HASHIRA",
      icon: "☀️",
      name: "Hinokami Kagura: Sun Breathing",
      desc: "Conquer an entire 7-day routine week",
      anime: "Demon Slayer (Yoriichi / Tanjiro)",
      unlocked: currentStreak >= 7 || longestStreak >= 7
    },
    {
      id: "ds_flame_rengoku",
      franchise: "DEMON SLAYER",
      rank: "HASHIRA",
      icon: "🔥",
      name: "Set Your Heart Ablaze! (Ninth Form)",
      desc: "Study for 4+ hours in a single day",
      anime: "Demon Slayer (Kyojuro Rengoku)",
      unlocked: Boolean(todayProgress?.secondsStudied >= 14400) || totalHoursStudied >= 4
    },
    {
      id: "ds_transparent_world",
      franchise: "DEMON SLAYER",
      rank: "HASHIRA",
      icon: "👁️",
      name: "Transparent World (Sukitouru Sekai)",
      desc: "Reach a 20-day consecutive routine streak",
      anime: "Demon Slayer (Yoriichi Tsugikuni)",
      unlocked: currentStreak >= 20 || longestStreak >= 20
    },
    {
      id: "ds_slayer_mark",
      franchise: "DEMON SLAYER",
      rank: "HASHIRA",
      icon: "⚔️",
      name: "Demon Slayer Mark: Final Awakening",
      desc: "Log 35+ cumulative hours of focused study",
      anime: "Demon Slayer (Hashira Corps)",
      unlocked: totalHoursStudied >= 35
    },

    // ── HUNTER X HUNTER (8 Badges) ──
    {
      id: "hxh_water_divination",
      franchise: "HXH",
      rank: "HUNTER",
      icon: "🥛",
      name: "Water Divination: Nen Affinity",
      desc: "Log your first 15 minutes of study",
      anime: "Hunter x Hunter (Wing)",
      unlocked: totalHoursStudied >= 0.25
    },
    {
      id: "hxh_ten_ren",
      franchise: "HXH",
      rank: "HUNTER",
      icon: "🧘",
      name: "Ten & Ren: Shroud of Unbreakable Aura",
      desc: "Maintain a 2-day active routine streak",
      anime: "Hunter x Hunter (Gon & Killua)",
      unlocked: currentStreak >= 2 || longestStreak >= 2
    },
    {
      id: "hxh_jajanken",
      franchise: "HXH",
      rank: "HUNTER",
      icon: "✊",
      name: "First Comes Rock! Jajanken Guu",
      desc: "Log 90+ minutes of study in a single day",
      anime: "Hunter x Hunter (Gon Freecss)",
      unlocked: Boolean(todayProgress?.secondsStudied >= 5400) || totalHoursStudied >= 1.5
    },
    {
      id: "hxh_godspeed",
      franchise: "HXH",
      rank: "HUNTER",
      icon: "⚡",
      name: "Godspeed: Kanmuru (Lightning Aura)",
      desc: "Log 60+ minutes of continuous deep study",
      anime: "Hunter x Hunter (Killua Zoldyck)",
      unlocked: totalHoursStudied >= 1
    },
    {
      id: "hxh_emperor_time",
      franchise: "HXH",
      rank: "HUNTER",
      icon: "⛓️",
      name: "Scarlet Eyes: Emperor Time 100%",
      desc: "Maintain a 6-day active routine streak",
      anime: "Hunter x Hunter (Kurapika)",
      unlocked: currentStreak >= 6 || longestStreak >= 6
    },
    {
      id: "hxh_netero_gratitude",
      franchise: "HXH",
      rank: "CHAIRMAN",
      icon: "🙏",
      name: "10,000 Punches of Gratitude Daily",
      desc: "Maintain a 10-day consecutive active streak",
      anime: "Hunter x Hunter (Isaac Netero)",
      unlocked: currentStreak >= 10 || longestStreak >= 10
    },
    {
      id: "hxh_zero_hand",
      franchise: "HXH",
      rank: "CHAIRMAN",
      icon: "✨",
      name: "100-Type Guanyin Bodhisattva: Zero Hand",
      desc: "Log 5+ hours of study in a single day",
      anime: "Hunter x Hunter (Chairman Netero)",
      unlocked: Boolean(todayProgress?.secondsStudied >= 18000) || totalHoursStudied >= 5
    },
    {
      id: "hxh_triple_star",
      franchise: "HXH",
      rank: "CHAIRMAN",
      icon: "⭐",
      name: "Triple-Star Hunter License",
      desc: "Log 40+ cumulative hours of focused study",
      anime: "Hunter x Hunter (Hunter Association)",
      unlocked: totalHoursStudied >= 40
    },

    // ── MY HERO ACADEMIA (7 Badges) ──
    {
      id: "mha_detroit_smash",
      franchise: "MHA",
      rank: "HERO",
      icon: "💥",
      name: "Detroit Smash: First Spark",
      desc: "Complete 1 routine block today",
      anime: "My Hero Academia (All Might)",
      unlocked: Boolean(todayProgress?.completedTasks >= 1)
    },
    {
      id: "mha_full_cowl_5",
      franchise: "MHA",
      rank: "HERO",
      icon: "⚡",
      name: "One For All: Full Cowl 20%",
      desc: "Maintain a 5-day active routine streak",
      anime: "My Hero Academia (Izuku Midoriya)",
      unlocked: currentStreak >= 5 || longestStreak >= 5
    },
    {
      id: "mha_howitzer",
      franchise: "MHA",
      rank: "HERO",
      icon: "💣",
      name: "Howitzer Impact: Maximum Output",
      desc: "Complete 5+ routine blocks in a single day",
      anime: "My Hero Academia (Katsuki Bakugo)",
      unlocked: Boolean(todayProgress?.completedTasks >= 5)
    },
    {
      id: "mha_flashfreeze",
      franchise: "MHA",
      rank: "HERO",
      icon: "❄️",
      name: "Half-Cold Half-Hot: Flashfreeze Heatwave",
      desc: "Maintain an 8-day active routine streak",
      anime: "My Hero Academia (Shoto Todoroki)",
      unlocked: currentStreak >= 8 || longestStreak >= 8
    },
    {
      id: "mha_shoot_style",
      franchise: "MHA",
      rank: "HERO",
      icon: "👟",
      name: "Shoot Style: Breaking Limitations",
      desc: "Maintain a 12-day active routine streak",
      anime: "My Hero Academia (Deku)",
      unlocked: currentStreak >= 12 || longestStreak >= 12
    },
    {
      id: "mha_united_states",
      franchise: "MHA",
      rank: "HERO",
      icon: "🇺🇸",
      name: "United States of Smash!",
      desc: "Log 15+ cumulative hours of focused study",
      anime: "My Hero Academia (All Might)",
      unlocked: totalHoursStudied >= 15
    },
    {
      id: "mha_symbol_of_peace",
      franchise: "MHA",
      rank: "HERO",
      icon: "🏆",
      name: "Symbol of Peace: 52-Hour Routine Master",
      desc: "Log 52+ cumulative hours (full 52h weekly cycle conquered!)",
      anime: "My Hero Academia (All Might)",
      unlocked: totalHoursStudied >= 52
    },

    // ── JUJUTSU KAISEN (7 Badges) ──
    {
      id: "jjk_divergent_fist",
      franchise: "JJK",
      rank: "SORCERER",
      icon: "🥊",
      name: "Divergent Fist: Double Impact",
      desc: "Log 2+ cumulative hours of study",
      anime: "Jujutsu Kaisen (Yuji Itadori)",
      unlocked: totalHoursStudied >= 2
    },
    {
      id: "jjk_black_flash",
      franchise: "JJK",
      rank: "SPECIAL GRADE",
      icon: "💥",
      name: "Black Flash: 2.5 Power Exponent",
      desc: "Complete 4+ routine blocks in a single 24-hour cycle",
      anime: "Jujutsu Kaisen (Itadori & Todo)",
      unlocked: Boolean(todayProgress?.completedTasks >= 4)
    },
    {
      id: "jjk_reverse_cursed",
      franchise: "JJK",
      rank: "SPECIAL GRADE",
      icon: "🤍",
      name: "Reverse Cursed Technique: Restoration",
      desc: "Equip a freeze shield or bounce back after a rest day",
      anime: "Jujutsu Kaisen (Shoko & Gojo)",
      unlocked: Boolean(streakFreezeEnabled) || totalCompletedDays >= 4
    },
    {
      id: "jjk_infinite_void",
      franchise: "JJK",
      rank: "SPECIAL GRADE",
      icon: "⛩️",
      name: "Domain Expansion: Infinite Void",
      desc: "Study for 3+ hours in a single day",
      anime: "Jujutsu Kaisen (Gojo Satoru)",
      unlocked: Boolean(todayProgress?.secondsStudied >= 10800) || totalHoursStudied >= 3
    },
    {
      id: "jjk_malevolent_shrine",
      franchise: "JJK",
      rank: "SPECIAL GRADE",
      icon: "🏯",
      name: "Domain Expansion: Malevolent Shrine",
      desc: "Maintain a 15-day active routine streak",
      anime: "Jujutsu Kaisen (Ryomen Sukuna)",
      unlocked: currentStreak >= 15 || longestStreak >= 15
    },
    {
      id: "jjk_hollow_purple",
      franchise: "JJK",
      rank: "SPECIAL GRADE",
      icon: "🟣",
      name: "Secret Technique: Hollow Purple",
      desc: "Maintain a 21-day consecutive active streak",
      anime: "Jujutsu Kaisen (Gojo Satoru)",
      unlocked: currentStreak >= 21 || longestStreak >= 21
    },
    {
      id: "jjk_six_eyes",
      franchise: "JJK",
      rank: "SPECIAL GRADE",
      icon: "💎",
      name: "The Six Eyes: Boundless Focus Efficiency",
      desc: "Log 30+ cumulative hours of focused study",
      anime: "Jujutsu Kaisen (Gojo Satoru)",
      unlocked: totalHoursStudied >= 30
    },

    // ── DRAGON BALL SUPER (8 Badges) ──
    {
      id: "dbs_kaioken",
      franchise: "DBS",
      rank: "GOD KI",
      icon: "🔴",
      name: "Super Saiyan Blue Kaioken x20",
      desc: "Log 8+ cumulative hours of focused study",
      anime: "Dragon Ball Super (Goku)",
      unlocked: totalHoursStudied >= 8
    },
    {
      id: "dbs_hyperbolic_chamber",
      franchise: "DBS",
      rank: "GOD KI",
      icon: "⏳",
      name: "Hyperbolic Time Chamber (Room of Spirit & Time)",
      desc: "Log 10+ cumulative hours of focused study",
      anime: "Dragon Ball Super (Goku & Vegeta)",
      unlocked: totalHoursStudied >= 10
    },
    {
      id: "dbs_spirit_bomb",
      franchise: "DBS",
      rank: "GOD KI",
      icon: "🌐",
      name: "Universal Spirit Bomb: Energy of All Worlds",
      desc: "Maintain a 9-day active routine streak",
      anime: "Dragon Ball Super (Son Goku)",
      unlocked: currentStreak >= 9 || longestStreak >= 9
    },
    {
      id: "dbs_hakai",
      franchise: "DBS",
      rank: "GOD KI",
      icon: "🟣",
      name: "Hakai: Destruction of Procrastination",
      desc: "Maintain an 18-day active routine streak",
      anime: "Dragon Ball Super (Lord Beerus)",
      unlocked: currentStreak >= 18 || longestStreak >= 18
    },
    {
      id: "dbs_ui_omen",
      franchise: "DBS",
      rank: "GOD KI",
      icon: "🌌",
      name: "Ultra Instinct -Sign- (Omen)",
      desc: "Maintain a 25-day consecutive active streak",
      anime: "Dragon Ball Super (Son Goku)",
      unlocked: currentStreak >= 25 || longestStreak >= 25
    },
    {
      id: "dbs_mastered_ui",
      franchise: "DBS",
      rank: "GOD KI",
      icon: "🤍",
      name: "Mastered Ultra Instinct: Apex of Focus",
      desc: "Hit a legendary 30-day master streak",
      anime: "Dragon Ball Super (Son Goku & Whis)",
      unlocked: currentStreak >= 30 || longestStreak >= 30
    },
    {
      id: "dbs_whis_angel",
      franchise: "DBS",
      rank: "GOD KI",
      icon: "✨",
      name: "Whis: Supreme Autonomous Movement",
      desc: "Hit an elite 45-day master streak",
      anime: "Dragon Ball Super (Whis)",
      unlocked: currentStreak >= 45 || longestStreak >= 45
    },
    {
      id: "dbs_zeno_supreme",
      franchise: "DBS",
      rank: "GOD KI",
      icon: "👑",
      name: "Omni-King Zeno: 52-Hour Routine Champion",
      desc: "Reach a monumental 52-day streak (1 day per weekly routine hour!)",
      anime: "Dragon Ball Super (Grand Zeno)",
      unlocked: currentStreak >= 52 || longestStreak >= 52
    }
  ];

  const FRANCHISES = [
    { key: "ALL", label: "All 52 Badges" },
    { key: "DR. STONE", label: "Dr. Stone (7)" },
    { key: "STEINS;GATE", label: "Steins;Gate (7)" },
    { key: "DEMON SLAYER", label: "Demon Slayer (8)" },
    { key: "HXH", label: "Hunter x Hunter (8)" },
    { key: "MHA", label: "My Hero Academia (7)" },
    { key: "JJK", label: "Jujutsu Kaisen (7)" },
    { key: "DBS", label: "Dragon Ball Super (8)" }
  ];

  const filteredBadges = badgeFilter === "ALL"
    ? BADGES
    : BADGES.filter(b => b.franchise === badgeFilter);

  const unlockedCount = BADGES.filter(b => b.unlocked).length;

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

      {/* ── GAMIFICATION: ANIME RANK & XP ENGINE ── */}
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
              {nextRank !== currentRank ? `${currentRank.maxXP - totalXP} XP to Level ${nextRank.level}` : "Max Rank Achieved"}
            </div>
          </div>
        </div>
        <div className="xp-bar-track" style={{ marginTop: "8px" }}>
          <div className="xp-bar-fill" style={{ width: `${levelProgressPct}%` }} />
        </div>
      </div>

      {/* ── STREAK FREEZE: STEINS;GATE READING STEINER ── */}
      <div className="minimal-card" style={{ cursor: "default" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)" }}>
                🛡️ Reading Steiner: Divergence Shield
              </span>
              {streakFreezeEnabled && (
                <span className="hero-day-tag" style={{ background: "var(--accent-soft)", borderColor: "var(--accent)" }}>
                  TIMELINE PROTECTED (1.048596%)
                </span>
              )}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>
              Shifts worldlines so 1 missed day doesn't collapse your timeline's active streak.
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

      {/* ── 52 ANIME & HERO ACHIEVEMENTS (52H PUN EDITION) ── */}
      <div className="badges-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚔️ 52 Anime &amp; Hero Achievements</span>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                ({unlockedCount} / {BADGES.length} Conquered)
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              1 Badge per weekly routine hour • DBS • JJK • MHA • Demon Slayer • Dr. Stone • Steins;Gate • HxH
            </div>
          </div>
        </div>

        {/* Category filter tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
          {FRANCHISES.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                sfx?.tap?.();
                setBadgeFilter(f.key);
              }}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "6px",
                border: badgeFilter === f.key ? "1px solid var(--neon-cyan)" : "1px solid var(--border)",
                background: badgeFilter === f.key ? "var(--accent-soft)" : "transparent",
                color: badgeFilter === f.key ? "var(--neon-cyan)" : "var(--text-muted)",
                boxShadow: badgeFilter === f.key ? "0 0 8px var(--accent-glow)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="badges-grid">
          {filteredBadges.map((b) => (
            <div
              key={b.id}
              className={`badge-card ${b.unlocked ? "unlocked" : "locked"} ${b.rank === "SPECIAL GRADE" || b.rank === "GOD KI" || b.rank === "CHAIRMAN" || b.rank === "HASHIRA" ? "s-rank" : ""}`}
            >
              <div className="badge-icon-box">{b.icon}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="badge-rank-tag">{b.rank}</span>
                  <span style={{ fontSize: "10px", color: "var(--text-subtle)" }}>{b.anime}</span>
                </div>
                <div className="badge-name">
                  {b.name} {b.unlocked ? "✓" : ""}
                </div>
                <div className="badge-req">{b.desc}</div>
              </div>
            </div>
          ))}
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
