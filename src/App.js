import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification, deleteUser } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, enableIndexedDbPersistence, terminate, clearIndexedDbPersistence, deleteDoc } from "firebase/firestore";

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
const db = getFirestore(firebaseApp);
enableIndexedDbPersistence(db).catch(()=>{});
async function cleanSignOut(){
  try{ await signOut(auth); }catch(e){}
  // wipe local cache so another account on this device can't inherit it
  try{ await terminate(db); await clearIndexedDbPersistence(db); }catch(e){}
  window.location.reload();
}

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAYS_SHORT = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

const DEFAULT_TASKS = {
  0:[{id:"sp1",label:"Structured Programming",repeat:true,done:false},{id:"phy1",label:"Physics",repeat:true,done:false},{id:"sk1",label:"Skill Development",repeat:true,done:false}],
  1:[{id:"dld1",label:"Digital Logic Design",repeat:true,done:false},{id:"eee1",label:"Electrical Engineering",repeat:true,done:false},{id:"la1",label:"Linear Algebra",repeat:true,done:false}],
  2:[{id:"sp2",label:"Structured Programming",repeat:true,done:false},{id:"phy2",label:"Physics",repeat:true,done:false},{id:"sk2",label:"Skill Development",repeat:true,done:false}],
  3:[{id:"dld2",label:"Digital Logic Design",repeat:true,done:false},{id:"eee2",label:"Electrical Engineering",repeat:true,done:false},{id:"la2",label:"Linear Algebra",repeat:true,done:false}],
  4:[{id:"sp3",label:"Structured Programming",repeat:true,done:false},{id:"phy3",label:"Physics",repeat:true,done:false},{id:"sk3",label:"Skill Development",repeat:true,done:false}],
  5:[],
  6:[{id:"dld3",label:"Digital Logic Design",repeat:true,done:false},{id:"eee3",label:"Electrical Engineering",repeat:true,done:false},{id:"la3",label:"Linear Algebra",repeat:true,done:false}],
};

function uid(){ return Math.random().toString(36).slice(2,9); }

// ── RETRO SOUND ENGINE (synthesized, no files) ──
let _actx=null;
function ac(){ if(!_actx){try{_actx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}} return _actx; }
let SOUND_ON = (()=>{try{return localStorage.getItem("sq_sound")!=="off";}catch(e){return true;}})();
function setSoundOn(v){SOUND_ON=v;try{localStorage.setItem("sq_sound",v?"on":"off");}catch(e){}}
function beep(freq,dur,type="square",vol=0.12,when=0){
  if(!SOUND_ON)return;const ctx=ac();if(!ctx)return;
  if(ctx.state==="suspended")ctx.resume();
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type;o.frequency.value=freq;
  o.connect(g);g.connect(ctx.destination);
  const t=ctx.currentTime+when;
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(vol,t+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.start(t);o.stop(t+dur+0.02);
}
const SFX={
  tap:   ()=>beep(420,0.06,"square",0.07),
  click: ()=>beep(660,0.05,"square",0.08),
  done:  ()=>{beep(660,0.07,"square",0.11);beep(880,0.09,"square",0.11,0.07);beep(1320,0.12,"square",0.11,0.15);},
  undo:  ()=>{beep(520,0.07,"square",0.09);beep(330,0.1,"square",0.09,0.06);},
  add:   ()=>{beep(523,0.06,"triangle",0.1);beep(784,0.08,"triangle",0.1,0.06);},
  del:   ()=>{beep(300,0.08,"sawtooth",0.09);beep(160,0.12,"sawtooth",0.09,0.07);},
  theme: ()=>{beep(523,0.05,"sine",0.09);beep(659,0.05,"sine",0.09,0.05);beep(988,0.1,"sine",0.09,0.1);},
  start: ()=>{beep(440,0.08,"square",0.11);beep(660,0.08,"square",0.11,0.08);beep(880,0.14,"square",0.11,0.16);},
  stop:  ()=>{beep(880,0.08,"square",0.1);beep(587,0.1,"square",0.1,0.07);beep(392,0.16,"square",0.1,0.15);},
  win:   ()=>{[523,659,784,1047,1319].forEach((f,i)=>beep(f,0.12,"square",0.1,i*0.08));},
};

function getWeekKey(date){const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay());return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function getSundayForKey(key){const[y,m,day]=key.split("-").map(Number);return new Date(y,m-1,day);}

// Build a fresh week template: carry forward only WEEKLY (repeat) tasks from a
// source week, reset to "not done". ONE-TIME tasks do NOT carry over.
function weekFromTemplate(srcWeek){
  const out={};
  for(let dow=0;dow<7;dow++){
    const srcDay=(srcWeek&&srcWeek[dow])||[];
    out[dow]=srcDay.filter(t=>t.repeat).map(t=>({id:Math.random().toString(36).slice(2,9),label:t.label,repeat:true,done:false}));
  }
  return out;
}
function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d;}
function formatShortDate(date){return date.toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function weekLabel(key){const sun=getSundayForKey(key);const sat=addDays(sun,6);return `${formatShortDate(sun)} – ${formatShortDate(sat)}`;}
function dateStr(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function fmtDuration(secs){
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=Math.floor(secs%60);
  if(h>0) return `${h}h ${m}m ${s}s`;
  if(m>0) return `${m}m ${s}s`;
  return `${s}s`;
}
function fmtClock(secs){
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=Math.floor(secs%60);
  const mm=String(m).padStart(2,"0"), ss=String(s).padStart(2,"0");
  return h>0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ── OWNER / CONTACT ──
const OWNER_NAME  = "Nabil";
const OWNER_EMAIL = "nabilhasanjami@gmail.com";

// ── LOCK IN + MOTIVATION CONFIG ──
const BKASH_NUMBER = "01882480457";   // shown on the "give up" screen — EDIT to change
const LOCKIN_FEE   = 500;             // taka required to buy your way out early
const TRXID_RE     = /^[A-Z0-9]{10}$/;// bKash Transaction ID format (10 letters/digits)

const SAVAGE_QUOTES = [
  "{name} is studying hard. What are you doing?",
  "While you scroll, {name} is grinding.",
  "{name} just finished another chapter. And you?",
  "{name} doesn't take breaks. Why are you?",
  "Somewhere out there, {name} is locking in. Be like {name}.",
  "{name} will pass. Will you?",
  "{name} woke up early to study. You woke up to excuses.",
  "Every minute you waste, {name} gets further ahead.",
  "{name} isn't smarter than you — just more disciplined.",
  "{name} is building a future. You're building regrets.",
  "Stop scrolling. {name} already did today's tasks.",
  "{name} closed the app and opened a book.",
  "You vs {name}. Right now, {name} is winning.",
  "{name} stayed consistent. That's the whole secret.",
  "One day {name} will thank past {name}. Will you?",
];
function fillQuote(raw,name){ return (raw||"").replace(/\{name\}/g, name||"They"); }
function pickQuote(name, extra){
  const pool=[...SAVAGE_QUOTES, ...((extra||[]))];
  return fillQuote(pool[Math.floor(Math.random()*pool.length)]||"", name);
}

// Screen Wake Lock: keep the device awake while a timer/lock is active so the
// screen never sleeps. On mobile, a sleeping screen freezes/discards the page —
// that is what made the study timer appear to "reset". Re-acquired on resume.
function useWakeLock(active){
  const lockRef=useRef(null);
  useEffect(()=>{
    if(!active) return;
    let cancelled=false;
    async function acquire(){
      try{ if("wakeLock" in navigator){ lockRef.current=await navigator.wakeLock.request("screen"); } }catch(e){}
    }
    acquire();
    const onVis=()=>{ if(!cancelled && active && document.visibilityState==="visible") acquire(); };
    document.addEventListener("visibilitychange",onVis);
    return()=>{ cancelled=true; document.removeEventListener("visibilitychange",onVis); try{ lockRef.current&&lockRef.current.release(); }catch(e){} lockRef.current=null; };
  },[active]);
}

const THEMES = {
  retrowave:{name:"RETROWAVE",icon:"🌆",vars:{"--bg":"#10001f","--bg1":"#180029","--bg2":"#1f0035","--bg3":"#260041","--accent":"#ff2d9b","--accent2":"#c45bff","--accent3":"#22e0ff","--text":"#ffe8fb","--dim":"rgba(255,232,251,0.5)","--dimmer":"rgba(255,232,251,0.16)","--border":"rgba(255,45,155,0.18)","--bord2":"rgba(255,45,155,0.4)","--green":"#3dff8f","--red":"#ff4060","--yellow":"#ffd84d"},sky:["#10001f","#2a0445","#5e0a5e","#a01070","#e0316a","#ff7a3d","#ffc24d"],sun:["#fff0a0","#ffd24d","#ff8c42","#e0316a"],sunStripe:"#1a0030",grid:"#ff2d9b",star:"255,230,200",haze:"rgba(255,90,160,0.10)"},
  cyberpunk:{name:"CYBERPUNK",icon:"🏙️",vars:{"--bg":"#03060e","--bg1":"#060c18","--bg2":"#0a1424","--bg3":"#0f1c30","--accent":"#13f0ff","--accent2":"#ff2e88","--accent3":"#ffe138","--text":"#e6f6ff","--dim":"rgba(230,246,255,0.5)","--dimmer":"rgba(230,246,255,0.14)","--border":"rgba(19,240,255,0.16)","--bord2":"rgba(19,240,255,0.4)","--green":"#3dff8f","--red":"#ff3b5c","--yellow":"#ffe138"},sky:["#03060e","#070f22","#0a1838","#10204a","#1a1040","#2a0a38"],sun:["#9affff","#13f0ff","#0a90ff","#ff2e88"],sunStripe:"#06101f",grid:"#13f0ff",star:"180,240,255",haze:"rgba(19,240,255,0.08)"},
  aurora:{name:"AURORA",icon:"🌌",vars:{"--bg":"#01100f","--bg1":"#021816","--bg2":"#04201d","--bg3":"#062a24","--accent":"#2bffc6","--accent2":"#8a6bff","--accent3":"#ff7ab5","--text":"#e0fff5","--dim":"rgba(200,255,235,0.5)","--dimmer":"rgba(200,255,235,0.14)","--border":"rgba(43,255,198,0.16)","--bord2":"rgba(43,255,198,0.38)","--green":"#2bffc6","--red":"#ff6b8a","--yellow":"#ffe07a"},sky:["#01100f","#042521","#063a30","#0a4a3a","#10305a","#1a1a55"],sun:["#d6fff0","#7affd6","#2bffc6","#8a6bff"],sunStripe:"#042018",grid:"#2bffc6",star:"200,255,230",haze:"rgba(43,255,198,0.10)"},
  inferno:{name:"INFERNO",icon:"🔥",vars:{"--bg":"#1a0500","--bg1":"#220800","--bg2":"#2c0b00","--bg3":"#380f00","--accent":"#ff7a18","--accent2":"#ff2d55","--accent3":"#ffd23f","--text":"#fff0e0","--dim":"rgba(255,224,200,0.5)","--dimmer":"rgba(255,224,200,0.15)","--border":"rgba(255,122,24,0.18)","--bord2":"rgba(255,122,24,0.42)","--green":"#aaff3d","--red":"#ff2d55","--yellow":"#ffd23f"},sky:["#1a0500","#3a0a00","#6e1500","#aa2400","#e04010","#ff7a18","#ffc24d"],sun:["#fff0a0","#ffd23f","#ff7a18","#e04010"],sunStripe:"#2a0800",grid:"#ff7a18",star:"255,210,160",haze:"rgba(255,100,30,0.12)"},
  midnight:{name:"MIDNIGHT",icon:"🌙",vars:{"--bg":"#070612","--bg1":"#0c0a1e","--bg2":"#121029","--bg3":"#181436","--accent":"#b89cff","--accent2":"#6c52d6","--accent3":"#ffd76a","--text":"#f2ecff","--dim":"rgba(242,236,255,0.5)","--dimmer":"rgba(242,236,255,0.14)","--border":"rgba(184,156,255,0.16)","--bord2":"rgba(184,156,255,0.38)","--green":"#9fffb8","--red":"#ff7a8a","--yellow":"#ffd76a"},sky:["#070612","#0f0a26","#1a1040","#241552","#1a1040","#0f0a26"],sun:["#fffbe6","#ffe9a0","#ffd76a","#c8a85a"],sunStripe:null,grid:"#b89cff",star:"230,220,255",haze:"rgba(184,156,255,0.08)",moon:true},
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;500;700;900&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{background:var(--bg);font-family:'Rajdhani',sans-serif;color:var(--text);min-height:100vh;transition:background 0.6s;overflow-x:hidden;width:100%;}
*{max-width:100%;}
.scene{position:fixed;inset:0;z-index:0;overflow:hidden;}
.scene-canvas{position:absolute;inset:0;width:100%;height:100%;}
.retro-scanlines{position:fixed;inset:0;z-index:1;pointer-events:none;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px);}
.retro-vignette{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,0.7) 100%);}
@keyframes dropIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes checkPop{0%{transform:scale(1);}40%{transform:scale(1.3);}100%{transform:scale(1);}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
@keyframes pulseRing{0%{box-shadow:0 0 0 0 var(--accent);}70%{box-shadow:0 0 0 18px transparent;}100%{box-shadow:0 0 0 0 transparent;}}
@keyframes spinSlow{from{transform:rotate(0);}to{transform:rotate(360deg);}}
@keyframes popIn{0%{opacity:0;transform:scale(0.8);}100%{opacity:1;transform:scale(1);}}

.app{position:relative;z-index:2;min-height:100vh;max-width:540px;width:100%;margin:0 auto;padding-bottom:80px;overflow-x:hidden;}
.hdr{padding:24px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:10px;background:rgba(6,3,12,0.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);position:sticky;top:0;z-index:50;}
.hdr-left{display:flex;align-items:center;gap:12px;min-width:0;}
.back-btn{background:rgba(0,0,0,0.5);border:1px solid var(--border);border-radius:8px;width:34px;height:34px;cursor:pointer;color:var(--accent);font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0;}
.back-btn:hover{border-color:var(--accent);box-shadow:0 0 10px var(--accent);}
.hdr-title{font-family:'Orbitron',monospace;font-size:18px;font-weight:900;letter-spacing:3px;background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 12px var(--accent));}
.hdr-sub{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--dim);letter-spacing:3px;margin-top:3px;}
.hdr-user{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--accent2);letter-spacing:1px;margin-top:3px;}
.hdr-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;}

.controls-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 20px;background:rgba(6,3,12,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-bottom:1px solid var(--border);}
.theme-wrap{display:flex;gap:4px;}
.theme-chip{background:rgba(0,0,0,0.5);border:1px solid var(--border);border-radius:7px;padding:5px 9px;cursor:pointer;font-size:14px;transition:all 0.15s;position:relative;}
.theme-chip:hover{border-color:var(--bord2);transform:scale(1.1);}
.theme-chip.active{border-color:var(--accent);box-shadow:0 0 10px var(--accent);}
.theme-chip .theme-tip{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);border:1px solid var(--border);border-radius:5px;padding:3px 7px;font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:1px;color:var(--dim);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.15s;}
.theme-chip:hover .theme-tip{opacity:1;}
.sync-badge{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;padding:3px 8px;border-radius:4px;color:var(--green);border:1px solid rgba(61,255,143,0.25);background:rgba(0,0,0,0.3);}
.sync-badge.syncing{color:var(--yellow);border-color:rgba(255,216,77,0.25);}
.signout-btn{background:none;border:1px solid rgba(255,64,96,0.3);color:rgba(255,120,140,0.7);border-radius:6px;padding:4px 10px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;cursor:pointer;transition:all 0.15s;}
.signout-btn:hover{background:rgba(255,64,96,0.1);color:var(--red);border-color:var(--red);}

/* ── HOME ── */
.home{position:relative;z-index:2;max-width:540px;margin:0 auto;padding:40px 20px;min-height:calc(100vh - 0px);display:flex;flex-direction:column;}
.home-hero{text-align:center;margin-bottom:36px;animation:float 3.5s ease-in-out infinite;}
.home-logo{font-family:'Orbitron',monospace;font-size:30px;font-weight:900;letter-spacing:5px;background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 22px var(--accent));}
.home-sub{font-family:'Orbitron',monospace;font-size:15px;font-weight:700;color:var(--accent3);letter-spacing:4px;margin-top:8px;text-shadow:0 0 10px var(--accent3);}
.home-cards{display:flex;flex-direction:column;gap:16px;}
.home-card{
  border:1px solid var(--bord2);border-radius:20px;padding:28px 24px;cursor:pointer;
  background:rgba(10,6,20,0.58);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  transition:all 0.2s;position:relative;overflow:hidden;
  display:flex;align-items:center;gap:20px;
}
.home-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--accent) 0%,transparent 60%);opacity:0.06;transition:opacity 0.2s;}
.home-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.5),0 0 24px var(--accent);border-color:var(--accent);}
.home-card:hover::before{opacity:0.14;}
.home-card-icon{font-size:48px;flex-shrink:0;filter:drop-shadow(0 0 12px var(--accent));}
.home-card-body{flex:1;}
.home-card-title{font-family:'Orbitron',monospace;font-size:20px;font-weight:700;letter-spacing:2px;color:var(--text);}
.home-card-desc{font-family:'Rajdhani',sans-serif;font-size:14px;color:var(--dim);margin-top:5px;line-height:1.4;}
.home-card-arrow{font-size:22px;color:var(--accent);flex-shrink:0;}
.home-stat{margin-top:8px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--accent3);}

/* ── STUDY TIMER ── */
.study-wrap{position:relative;z-index:2;max-width:540px;margin:0 auto;padding:30px 20px;}
.timer-card{border:1px solid var(--bord2);border-radius:24px;padding:36px 24px;background:rgba(10,6,20,0.62);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);text-align:center;box-shadow:0 0 40px rgba(0,0,0,0.4);}
.timer-ring{width:230px;height:230px;margin:0 auto 28px;position:relative;display:flex;align-items:center;justify-content:center;}
.timer-ring svg{position:absolute;inset:0;transform:rotate(-90deg);}
.timer-ring-bg{fill:none;stroke:var(--border);stroke-width:6;}
.timer-ring-fg{fill:none;stroke:var(--accent);stroke-width:6;stroke-linecap:round;filter:drop-shadow(0 0 8px var(--accent));transition:stroke-dashoffset 1s linear;}
.timer-display{font-family:'Orbitron',monospace;font-size:40px;font-weight:900;letter-spacing:2px;color:var(--text);text-shadow:0 0 18px var(--accent);}
.timer-state{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:3px;color:var(--dim);margin-top:6px;}
.timer-state.running{color:var(--accent);}
.timer-btns{display:flex;gap:12px;justify-content:center;margin-top:8px;}
.timer-btn{font-family:'Orbitron',monospace;font-size:13px;font-weight:700;letter-spacing:2px;padding:14px 30px;border-radius:12px;border:none;cursor:pointer;transition:all 0.15s;}
.timer-btn.start{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;box-shadow:0 0 20px var(--accent);}
.timer-btn.start:hover{filter:brightness(1.15);transform:scale(1.04);}
.timer-btn.stop{background:linear-gradient(135deg,var(--red),#ff8866);color:#fff;box-shadow:0 0 20px var(--red);animation:pulseRing 1.8s infinite;}
.timer-btn.stop:hover{filter:brightness(1.1);}
.timer-hint{font-family:'Rajdhani',sans-serif;font-size:13px;color:var(--dim);margin-top:18px;line-height:1.5;}
.today-total{margin-top:20px;padding:14px;border-radius:12px;background:rgba(8,4,16,0.7);border:1px solid var(--border);}
.today-total-label{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--dim);}
.today-total-val{font-family:'Orbitron',monospace;font-size:22px;font-weight:700;color:var(--accent);margin-top:4px;text-shadow:0 0 10px var(--accent);}

/* congrats modal */
.congrats-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);animation:fadeIn 0.3s ease;}
.congrats{background:rgba(8,4,16,0.92);border:1px solid var(--accent);border-radius:24px;padding:38px 30px;text-align:center;max-width:380px;width:100%;box-shadow:0 0 60px var(--accent);animation:popIn 0.4s cubic-bezier(.23,1,.32,1);}
.congrats-emoji{font-size:56px;margin-bottom:14px;animation:float 2.5s ease-in-out infinite;}
.congrats-title{font-family:'Orbitron',monospace;font-size:22px;font-weight:900;letter-spacing:2px;background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 14px var(--accent));}
.congrats-msg{font-family:'Rajdhani',sans-serif;font-size:16px;color:var(--text);margin-top:14px;line-height:1.5;}
.congrats-time{font-family:'Orbitron',monospace;font-size:30px;font-weight:900;color:var(--accent);margin:14px 0;text-shadow:0 0 18px var(--accent);}
.congrats-btn{margin-top:18px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:12px;padding:13px 28px;font-family:'Orbitron',monospace;font-size:12px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all 0.15s;box-shadow:0 0 18px var(--accent);}
.congrats-btn:hover{filter:brightness(1.15);}

/* ── STUDY HISTORY ── */
.study-history{margin-top:24px;}
.sh-title{font-family:'Orbitron',monospace;font-size:13px;font-weight:700;letter-spacing:2px;color:var(--accent);margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.sh-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(8,4,16,0.7);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;}
.sh-row.today{border-color:var(--bord2);box-shadow:0 0 10px rgba(0,0,0,0.3);}
.sh-date{font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);letter-spacing:1px;width:90px;flex-shrink:0;}
.sh-date.today{color:var(--accent);}
.sh-bar-track{flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden;}
.sh-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--accent),var(--accent2));box-shadow:0 0 6px var(--accent);}
.sh-time{font-family:'Orbitron',monospace;font-size:12px;font-weight:700;color:var(--text);width:78px;text-align:right;flex-shrink:0;}
.sh-empty{text-align:center;padding:30px 0;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--dimmer);}
.sh-weektotal{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--accent3);text-align:right;margin-bottom:14px;}

/* week nav + stack (tasks view) */
.week-nav{display:flex;align-items:center;gap:2px;padding:12px 16px 0;background:rgba(6,3,12,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);position:sticky;top:103px;z-index:40;}
.week-tabs{display:flex;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;scroll-behavior:smooth;}
.week-tabs::-webkit-scrollbar{display:none;}
.week-step{flex-shrink:0;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:7px;width:30px;height:30px;margin:2px 4px;cursor:pointer;color:var(--accent);font-size:12px;transition:all 0.15s;}
.week-step:hover{border-color:var(--accent);box-shadow:0 0 8px var(--accent);}
.week-step.today-jump{color:var(--accent3);}
.badge-future{background:rgba(0,0,0,0.35);color:var(--accent3);border:1px solid var(--accent3);}
.week-tab{flex-shrink:0;padding:8px 14px;background:none;border:none;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);border-bottom:2px solid transparent;transition:all 0.15s;white-space:nowrap;}
.week-tab:hover{color:var(--text);}
.week-tab.active{color:var(--accent);border-bottom-color:var(--accent);text-shadow:0 0 8px var(--accent);}
.week-tab.has-missed{color:var(--red);}
.week-tab.has-missed.active{color:var(--red);border-bottom-color:var(--red);}
.week-nav-border{height:1px;background:linear-gradient(90deg,transparent,var(--bord2),transparent);margin:0 16px;}
.week-label{padding:10px 18px 4px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);display:flex;align-items:center;gap:10px;}
.week-label-badge{padding:2px 8px;border-radius:3px;font-size:9px;letter-spacing:1px;font-family:'Share Tech Mono',monospace;}
.badge-current{background:rgba(0,0,0,0.35);color:var(--accent);border:1px solid var(--bord2);}
.badge-past{background:rgba(255,64,96,0.07);color:var(--red);border:1px solid rgba(255,64,96,0.2);}
.stack{padding:10px 16px 0;display:flex;flex-direction:column;gap:10px;}
.day-row{border-radius:14px;overflow:hidden;border:1px solid var(--border);background:rgba(10,6,20,0.58);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:border-color 0.2s,box-shadow 0.2s;position:relative;}
.day-row::before{content:'';position:absolute;inset:0;border-radius:14px;background:linear-gradient(135deg,rgba(255,255,255,0.035) 0%,transparent 55%);pointer-events:none;}
.day-row.is-open{border-color:var(--bord2);box-shadow:0 0 22px rgba(0,0,0,0.45),0 0 14px var(--accent);}
.day-row.is-today{border-color:var(--bord2);box-shadow:0 0 16px var(--accent);}
.day-row.is-missed{border-color:rgba(255,64,96,0.22);}
.day-row.is-missed.is-open{border-color:rgba(255,64,96,0.5);}
.day-row.all-done{border-color:rgba(61,255,143,0.25);box-shadow:0 0 12px rgba(61,255,143,0.15);}
.day-header{display:flex;align-items:center;padding:16px 16px;cursor:pointer;gap:12px;user-select:none;overflow:hidden;}
.day-num-box{width:52px;height:52px;flex-shrink:0;border-radius:10px;background:rgba(0,0,0,0.35);border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;transition:all 0.2s;}
.is-today .day-num-box{background:rgba(0,0,0,0.55);border-color:var(--accent);box-shadow:0 0 14px var(--accent),inset 0 0 10px rgba(255,255,255,0.04);}
.is-open .day-num-box{border-color:var(--accent2);}
.is-missed .day-num-box{border-color:rgba(255,64,96,0.3);}
.all-done .day-num-box{border-color:rgba(61,255,143,0.3);}
.day-abbr{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--dim);}
.is-today .day-abbr,.is-open .day-abbr{color:var(--accent);}
.is-missed .day-abbr{color:var(--red);}
.all-done .day-abbr{color:var(--green);}
.day-num-val{font-family:'Orbitron',monospace;font-size:18px;font-weight:700;color:var(--dim);line-height:1;}
.is-today .day-num-val{color:var(--accent);text-shadow:0 0 12px var(--accent);}
.is-open .day-num-val{color:var(--accent2);}
.is-missed .day-num-val{color:var(--red);}
.all-done .day-num-val{color:var(--green);}
.day-info{flex:1;min-width:0;}
.day-name{font-family:'Orbitron',monospace;font-size:14px;font-weight:700;letter-spacing:1px;color:var(--text);transition:color 0.15s;}
.is-open .day-name{color:var(--accent);}
.is-missed .day-name{color:rgba(255,120,140,0.9);}
.all-done .day-name{color:var(--green);}
.day-count{font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);margin-top:4px;letter-spacing:1px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.missed-tag{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1.5px;color:var(--red);padding:1px 6px;border-radius:3px;border:1px solid rgba(255,64,96,0.3);background:rgba(255,64,96,0.07);}
.day-right{display:flex;align-items:center;gap:10px;flex-shrink:0;}
.day-pct{font-family:'Orbitron',monospace;font-size:13px;font-weight:700;color:var(--accent);width:42px;text-align:right;text-shadow:0 0 8px var(--accent);}
.day-pct.done-all{color:var(--green);text-shadow:0 0 8px var(--green);}
.day-pct.missed{color:var(--red);text-shadow:0 0 8px var(--red);}
.chevron{font-size:13px;color:var(--dim);transition:transform 0.25s cubic-bezier(.23,1,.32,1);width:16px;text-align:center;}
.is-open .chevron{transform:rotate(180deg);color:var(--accent);}
.pip-row{display:flex;gap:3px;}
.pip{width:6px;height:6px;border-radius:50%;background:var(--dimmer);transition:all 0.2s;}
.pip.done{background:var(--green);box-shadow:0 0 5px var(--green);}
.pip.missed{background:var(--red);box-shadow:0 0 5px var(--red);}
.day-body{max-height:0;overflow:hidden;transition:max-height 0.38s cubic-bezier(.23,1,.32,1);}
.day-body.open{max-height:1600px;}
.day-body-inner{padding:0 16px 16px;border-top:1px solid var(--border);}
.mini-prog{height:3px;background:var(--border);border-radius:2px;margin:14px 0 16px;overflow:hidden;}
.mini-prog-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent3));box-shadow:0 0 8px var(--accent);transition:width 0.4s cubic-bezier(.23,1,.32,1);}
.mini-prog-fill.missed{background:linear-gradient(90deg,var(--red),#ff8866);}
.day-edit-bar{display:flex;justify-content:flex-end;margin-bottom:10px;padding-top:12px;}
.edit-toggle{background:none;border:1px solid transparent;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);padding:5px 10px;border-radius:6px;transition:all 0.15s;}
.edit-toggle:hover{color:var(--accent);border-color:var(--border);background:rgba(0,0,0,0.3);}
.edit-toggle.active{color:var(--red);}
.task-list{display:flex;flex-direction:column;gap:8px;}
.task-item{display:flex;align-items:center;gap:10px;padding:14px 14px;background:rgba(10,6,20,0.5);border:1px solid var(--border);border-radius:10px;transition:all 0.15s;position:relative;overflow:hidden;flex-wrap:wrap;}
.task-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--accent),var(--accent2));opacity:0;transition:opacity 0.15s;box-shadow:0 0 8px var(--accent);}
.task-item:hover{border-color:var(--bord2);background:rgba(10,6,20,0.62);}
.task-item:hover::before{opacity:0.8;}
.task-item.done{background:rgba(61,255,143,0.05);border-color:rgba(61,255,143,0.16);}
.task-item.done::before{background:var(--green);opacity:1;box-shadow:0 0 8px var(--green);}
.task-item.task-missed{background:rgba(255,64,96,0.05);border-color:rgba(255,64,96,0.18);}
.task-item.task-missed::before{background:var(--red);opacity:1;box-shadow:0 0 8px var(--red);}
.task-check{width:26px;height:26px;flex-shrink:0;border:1.5px solid var(--bord2);border-radius:6px;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:transparent;transition:all 0.15s;}
.task-check:hover{border-color:var(--accent);background:rgba(0,0,0,0.3);box-shadow:0 0 8px var(--accent);}
.task-item.done .task-check{background:var(--green);border-color:var(--green);color:#000;box-shadow:0 0 12px var(--green);}
.task-item.task-missed .task-check{border-color:rgba(255,64,96,0.35);cursor:default;}
.task-label{flex:1;min-width:0;font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:600;color:var(--text);line-height:1.3;letter-spacing:0.5px;}
.task-item.done .task-label{color:var(--dim);text-decoration:line-through;opacity:0.5;}
.task-item.task-missed .task-label{color:rgba(255,120,140,0.78);}
.task-edit-input{flex:1;min-width:0;background:rgba(0,0,0,0.45);border:1px solid var(--bord2);border-radius:6px;padding:6px 10px;font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:600;color:var(--text);outline:none;letter-spacing:0.5px;}
.task-edit-input:focus{border-color:var(--accent);}
.task-right{display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:auto;}
.type-pill{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1.5px;padding:3px 8px;border-radius:4px;border:1px solid;cursor:pointer;background:none;transition:all 0.15s;white-space:nowrap;}
.type-pill.weekly{color:var(--accent2);border-color:var(--border);}
.type-pill.once{color:var(--yellow);border-color:rgba(255,216,77,0.25);}
.type-pill.missed-pill{color:var(--red);border-color:rgba(255,64,96,0.3);cursor:default;}
.del-btn{background:rgba(255,64,96,0.12);border:1px solid rgba(255,64,96,0.3);cursor:pointer;width:34px;height:34px;flex-shrink:0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:14px;transition:all 0.15s;}
.del-btn:hover{color:var(--red);background:rgba(255,64,96,0.1);}
.add-bar{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
.add-input{flex:1;min-width:120px;background:rgba(0,0,0,0.42);border:1px solid var(--border);border-radius:10px;padding:13px 16px;font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:600;color:var(--text);outline:none;transition:all 0.15s;}
.add-input::placeholder{color:var(--dimmer);}
.add-input:focus{border-color:var(--accent);box-shadow:0 0 12px rgba(0,0,0,0.3);}
.type-toggle-bar{display:flex;background:rgba(0,0,0,0.42);border:1px solid var(--border);border-radius:10px;overflow:hidden;flex-shrink:0;}
.type-opt{padding:0 12px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1.5px;background:none;border:none;cursor:pointer;color:var(--dim);transition:all 0.15s;}
.type-opt.sel-wk{background:rgba(0,0,0,0.55);color:var(--accent2);}
.type-opt.sel-1x{background:rgba(0,0,0,0.55);color:var(--yellow);}
.add-multiday-btn{background:rgba(0,0,0,0.42);border:1px solid var(--border);border-radius:10px;padding:0 14px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--accent3);cursor:pointer;transition:all 0.15s;white-space:nowrap;flex-shrink:0;}
.add-multiday-btn:hover{border-color:var(--accent3);box-shadow:0 0 8px var(--accent3);}
.add-btn{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:10px;padding:0 20px;font-family:'Orbitron',monospace;font-size:18px;font-weight:700;cursor:pointer;flex-shrink:0;transition:all 0.15s;box-shadow:0 0 16px var(--accent);}
.add-btn:hover{filter:brightness(1.15);transform:scale(1.03);}
.add-btn:active{transform:scale(0.97);}
.empty{text-align:center;padding:32px 0 18px;}
.empty-icon{font-size:28px;opacity:0.2;margin-bottom:8px;}
.empty-txt{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--dimmer);}
.past-note{font-family:'Share Tech Mono',monospace;font-size:10px;color:rgba(255,64,96,0.5);letter-spacing:1.5px;text-align:center;padding:10px 0 4px;}
.auth-screen{position:relative;z-index:2;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;}
.auth-logo{font-family:'Orbitron',monospace;font-size:26px;font-weight:900;letter-spacing:4px;background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 18px var(--accent));margin-bottom:6px;text-align:center;animation:float 3s ease-in-out infinite;}
.auth-sub{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:4px;margin-bottom:36px;text-align:center;}
.auth-card{width:100%;max-width:390px;background:rgba(10,6,20,0.66);border:1px solid var(--bord2);border-radius:18px;padding:28px 24px;box-shadow:0 0 70px rgba(0,0,0,0.5),0 0 30px var(--accent);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);}
.auth-tabs{display:flex;margin-bottom:24px;background:rgba(0,0,0,0.4);border-radius:10px;overflow:hidden;border:1px solid var(--border);}
.auth-tab{flex:1;padding:11px;background:none;border:none;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);transition:all 0.15s;}
.auth-tab.active{background:rgba(0,0,0,0.5);color:var(--accent);text-shadow:0 0 8px var(--accent);}
.auth-field{margin-bottom:16px;}
.auth-label{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--dim);margin-bottom:7px;display:block;}
.auth-input{width:100%;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:10px;padding:13px 16px;font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:600;color:var(--text);outline:none;transition:all 0.15s;}
.auth-input:focus{border-color:var(--accent);box-shadow:0 0 10px var(--accent);}
.auth-btn{width:100%;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:10px;padding:14px;font-family:'Orbitron',monospace;font-size:12px;font-weight:700;cursor:pointer;margin-top:8px;letter-spacing:2px;transition:all 0.15s;box-shadow:0 0 22px var(--accent);}
.auth-btn:hover{filter:brightness(1.12);}
.auth-btn:disabled{opacity:0.4;cursor:not-allowed;}
.auth-error{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--red);letter-spacing:1px;margin-top:10px;text-align:center;}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);}
.modal{background:rgba(8,4,16,0.93);border:1px solid var(--bord2);border-radius:18px;padding:26px;width:100%;max-width:410px;box-shadow:0 0 60px rgba(0,0,0,0.6),0 0 24px var(--accent);}
.modal-title{font-family:'Orbitron',monospace;font-size:13px;font-weight:700;letter-spacing:2px;color:var(--accent);margin-bottom:20px;}
.modal-field{margin-bottom:18px;}
.modal-label{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--dim);margin-bottom:8px;display:block;}
.modal-input{width:100%;background:rgba(0,0,0,0.5);border:1px solid var(--border);border-radius:10px;padding:12px 14px;font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:600;color:var(--text);outline:none;transition:all 0.15s;}
.modal-input:focus{border-color:var(--accent);}
.day-picker{display:flex;gap:7px;flex-wrap:wrap;}
.day-chip{padding:8px 12px;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:8px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1.5px;color:var(--dim);cursor:pointer;transition:all 0.15s;user-select:none;}
.day-chip:hover{border-color:var(--bord2);color:var(--text);}
.day-chip.selected{background:rgba(0,0,0,0.6);border-color:var(--accent);color:var(--accent);box-shadow:0 0 8px var(--accent);}
.selected-days-preview{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--accent);letter-spacing:1px;margin-top:7px;min-height:14px;}
.type-row{display:flex;gap:8px;}
.type-card{flex:1;padding:12px;background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:10px;cursor:pointer;text-align:center;transition:all 0.15s;}
.type-card:hover{border-color:var(--bord2);}
.type-card.sel-weekly{background:rgba(0,0,0,0.6);border-color:var(--accent2);}
.type-card.sel-once{background:rgba(0,0,0,0.6);border-color:var(--yellow);}
.type-card-label{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1.5px;}
.type-card.sel-weekly .type-card-label{color:var(--accent2);}
.type-card.sel-once .type-card-label{color:var(--yellow);}
.type-card-desc{font-size:11px;color:var(--dimmer);margin-top:4px;font-family:'Rajdhani',sans-serif;}
.modal-actions{display:flex;gap:8px;margin-top:20px;}
.modal-cancel{flex:1;background:none;border:1px solid var(--border);border-radius:10px;padding:12px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);cursor:pointer;transition:all 0.15s;}
.modal-cancel:hover{border-color:var(--red);color:var(--red);}
.modal-confirm{flex:2;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:10px;padding:12px;font-family:'Orbitron',monospace;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:1px;transition:all 0.15s;}
.modal-confirm:hover{filter:brightness(1.12);}
.modal-confirm:disabled{opacity:0.4;cursor:not-allowed;}
.drop-in{animation:dropIn 0.22s ease both;}
.fade-in{animation:fadeIn 0.35s ease both;}
.check-pop{animation:checkPop 0.18s ease;}
.sound-toggle{background:rgba(0,0,0,0.5);border:1px solid var(--border);border-radius:7px;padding:5px 9px;cursor:pointer;font-size:14px;transition:all 0.15s;line-height:1;}
.sound-toggle:hover{border-color:var(--bord2);transform:scale(1.1);}
.streak-badge{display:inline-flex;align-items:center;gap:5px;font-family:'Orbitron',monospace;font-size:11px;font-weight:700;letter-spacing:1px;padding:4px 11px;border-radius:20px;background:rgba(255,122,24,0.12);border:1px solid rgba(255,140,40,0.4);color:#ff9a3c;box-shadow:0 0 12px rgba(255,122,24,0.25);}
.streak-badge .flame{font-size:13px;filter:drop-shadow(0 0 4px #ff7a18);}
.streak-badge.cold{background:rgba(120,120,140,0.12);border-color:rgba(150,150,170,0.3);color:rgba(200,200,220,0.6);box-shadow:none;}
.streak-badge.cold .flame{filter:grayscale(1);opacity:0.5;}
.home-streak{display:flex;justify-content:center;margin-top:14px;}
.loading{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Orbitron',monospace;font-size:12px;letter-spacing:4px;color:var(--accent);}

/* ── LOCK IN: setup ── */
.lock-setup{position:relative;z-index:2;max-width:540px;margin:0 auto;padding:30px 20px;}
.lock-card{border:1px solid var(--bord2);border-radius:24px;padding:32px 24px;background:rgba(10,6,20,0.62);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);text-align:center;box-shadow:0 0 40px rgba(0,0,0,0.4);}
.lock-card-icon{font-size:50px;filter:drop-shadow(0 0 14px var(--accent));}
.lock-card-title{font-family:'Orbitron',monospace;font-size:20px;font-weight:900;letter-spacing:2px;color:var(--text);margin-top:8px;}
.lock-card-desc{font-family:'Rajdhani',sans-serif;font-size:14px;color:var(--dim);margin-top:8px;line-height:1.5;}
.lock-presets{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:22px 0 8px;}
.lock-preset{font-family:'Orbitron',monospace;font-size:13px;font-weight:700;letter-spacing:1px;padding:11px 16px;border-radius:12px;border:1px solid var(--border);background:rgba(0,0,0,0.4);color:var(--text);cursor:pointer;transition:all 0.15s;}
.lock-preset:hover{border-color:var(--bord2);}
.lock-preset.active{border-color:var(--accent);color:var(--accent);box-shadow:0 0 12px var(--accent);}
.lock-custom{display:flex;align-items:flex-end;gap:10px;justify-content:center;margin:18px 0 6px;}
.lock-num{width:84px;}
.lock-num-label{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--dim);margin-bottom:6px;display:block;}
.lock-num-input{width:100%;background:rgba(0,0,0,0.5);border:1px solid var(--border);border-radius:10px;padding:12px;font-family:'Orbitron',monospace;font-size:20px;font-weight:700;color:var(--text);outline:none;text-align:center;}
.lock-num-input:focus{border-color:var(--accent);}
.lock-total{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--accent3);margin:6px 0 20px;}
.lock-start-btn{width:100%;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:14px;padding:16px;font-family:'Orbitron',monospace;font-size:14px;font-weight:700;letter-spacing:2px;cursor:pointer;box-shadow:0 0 22px var(--accent);transition:all 0.15s;}
.lock-start-btn:hover{filter:brightness(1.12);}
.lock-start-btn:disabled{opacity:0.4;cursor:not-allowed;}
.lock-warn{font-family:'Rajdhani',sans-serif;font-size:13px;color:var(--yellow);margin-top:16px;line-height:1.5;background:rgba(255,216,77,0.06);border:1px solid rgba(255,216,77,0.2);border-radius:10px;padding:12px;}

/* ── LOCK IN: full-screen lock overlay ── */
.lockin{position:fixed;inset:0;z-index:100000;background:rgba(4,2,10,0.97);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;overflow:auto;backdrop-filter:blur(4px);}
.lockin-tag{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:5px;color:var(--accent);margin-bottom:18px;}
.lockin-time{font-family:'Orbitron',monospace;font-size:clamp(40px,16vw,86px);font-weight:900;letter-spacing:2px;color:var(--text);text-shadow:0 0 26px var(--accent);line-height:1;}
.lockin-sub{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:3px;color:var(--dim);margin-top:10px;}
.lockin-quote{font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:600;color:var(--accent3);margin:26px 0;max-width:440px;line-height:1.5;}
.lockin-bar{width:min(440px,86vw);height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-bottom:26px;}
.lockin-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent3));box-shadow:0 0 8px var(--accent);transition:width 0.5s linear;}
.lockin-shame{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px;color:var(--red);margin-bottom:18px;}
.lockin-reenter{background:rgba(255,64,96,0.12);border:1px solid var(--red);color:var(--red);border-radius:12px;padding:14px 22px;font-family:'Orbitron',monospace;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;margin-bottom:16px;animation:pulseRing 1.6s infinite;}
.lockin-giveup{background:none;border:1px solid var(--border);color:var(--dim);border-radius:12px;padding:12px 22px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;cursor:pointer;transition:all 0.15s;}
.lockin-giveup:hover{border-color:var(--red);color:var(--red);}
.lockin-done-emoji{font-size:60px;margin-bottom:10px;animation:float 2.5s ease-in-out infinite;}
.lockin-finish{margin-top:24px;background:linear-gradient(135deg,var(--green),#2bd6a0);color:#04140d;border:none;border-radius:14px;padding:16px 34px;font-family:'Orbitron',monospace;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer;box-shadow:0 0 22px var(--green);}
/* give-up / donate screen */
.giveup-box{max-width:430px;width:100%;background:rgba(8,4,16,0.92);border:1px solid var(--red);border-radius:20px;padding:28px 24px;box-shadow:0 0 50px rgba(255,64,96,0.35);}
.giveup-title{font-family:'Orbitron',monospace;font-size:18px;font-weight:900;letter-spacing:1px;color:var(--red);}
.giveup-text{font-family:'Rajdhani',sans-serif;font-size:15px;color:var(--text);margin-top:12px;line-height:1.55;}
.giveup-bkash{margin:18px 0;padding:16px;border-radius:12px;background:rgba(226,0,116,0.12);border:1px solid rgba(226,0,116,0.5);}
.giveup-bkash-label{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--dim);}
.giveup-bkash-num{font-family:'Orbitron',monospace;font-size:24px;font-weight:900;color:#ff3d9b;letter-spacing:1px;margin-top:4px;text-shadow:0 0 12px rgba(226,0,116,0.6);}
.giveup-bkash-amt{font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:var(--text);margin-top:6px;}
.giveup-input{width:100%;background:rgba(0,0,0,0.5);border:1px solid var(--border);border-radius:10px;padding:13px 14px;font-family:'Share Tech Mono',monospace;font-size:16px;font-weight:600;color:var(--text);outline:none;letter-spacing:3px;text-align:center;text-transform:uppercase;}
.giveup-input:focus{border-color:var(--accent);}
.giveup-err{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--red);letter-spacing:1px;margin-top:8px;}
.giveup-actions{display:flex;gap:8px;margin-top:18px;}
.giveup-cancel{flex:1;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:#fff;border-radius:12px;padding:14px;font-family:'Orbitron',monospace;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;box-shadow:0 0 16px var(--accent);}
.giveup-confirm{flex:1;background:none;border:1px solid var(--red);color:var(--red);border-radius:12px;padding:14px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;}
.giveup-confirm:hover{background:rgba(255,64,96,0.1);}

/* ── MOTIVATION ── */
.mv-wrap{position:relative;z-index:2;max-width:540px;margin:0 auto;padding:30px 20px;}
.mv-card{border:1px solid var(--bord2);border-radius:20px;padding:24px;background:rgba(10,6,20,0.62);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);margin-bottom:16px;}
.mv-card-title{font-family:'Orbitron',monospace;font-size:13px;font-weight:700;letter-spacing:2px;color:var(--accent);margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.mv-name-input{width:100%;background:rgba(0,0,0,0.45);border:1px solid var(--border);border-radius:10px;padding:13px 16px;font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;color:var(--text);outline:none;letter-spacing:1px;}
.mv-name-input:focus{border-color:var(--accent);box-shadow:0 0 10px var(--accent);}
.mv-preview{font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:600;color:var(--accent3);margin-top:14px;line-height:1.5;min-height:24px;background:rgba(0,0,0,0.3);border:1px dashed var(--border);border-radius:10px;padding:12px;}
.mv-gen-btn{margin-top:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:10px;padding:12px 18px;font-family:'Orbitron',monospace;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;box-shadow:0 0 16px var(--accent);}
.mv-gen-btn:hover{filter:brightness(1.12);}
.mv-add-this{margin-top:10px;background:none;border:1px solid var(--bord2);color:var(--accent);border-radius:10px;padding:11px 18px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;}
.mv-add-this:hover{box-shadow:0 0 10px var(--accent);}
.mv-quote-row{display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(10,6,20,0.5);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;}
.mv-quote-txt{flex:1;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:600;color:var(--text);line-height:1.4;}
.mv-empty{text-align:center;padding:18px 0;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dimmer);}

/* motivation entry popup */
.mv-pop-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);animation:fadeIn 0.3s ease;}
.mv-pop{background:rgba(8,4,16,0.94);border:1px solid var(--accent);border-radius:24px;padding:36px 28px;text-align:center;max-width:400px;width:100%;box-shadow:0 0 60px var(--accent);animation:popIn 0.4s cubic-bezier(.23,1,.32,1);}
.mv-pop-emoji{font-size:52px;margin-bottom:12px;animation:float 2.5s ease-in-out infinite;}
.mv-pop-quote{font-family:'Rajdhani',sans-serif;font-size:21px;font-weight:700;color:var(--text);line-height:1.45;margin-bottom:6px;}
.mv-pop-btn{margin-top:22px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;border-radius:12px;padding:13px 30px;font-family:'Orbitron',monospace;font-size:12px;font-weight:700;letter-spacing:2px;cursor:pointer;box-shadow:0 0 18px var(--accent);}
.mv-pop-btn:hover{filter:brightness(1.15);}

/* ── ACCOUNT / SETTINGS modal ── */
.acct-email{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px;color:var(--text);margin-bottom:18px;word-break:break-all;}
.acct-verified{color:var(--green);}
.acct-unverified{color:var(--yellow);}
.acct-row{display:flex;align-items:center;gap:12px;padding:13px 0;border-top:1px solid var(--border);}
.acct-row.danger .acct-row-title{color:var(--red);}
.acct-row-info{flex:1;min-width:0;}
.acct-row-title{font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--text);}
.acct-row-desc{font-family:'Rajdhani',sans-serif;font-size:12px;color:var(--dim);margin-top:2px;line-height:1.35;}
.acct-btn{flex-shrink:0;background:rgba(0,0,0,0.45);border:1px solid var(--bord2);color:var(--accent);border-radius:8px;padding:9px 14px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;transition:all 0.15s;}
.acct-btn:hover{box-shadow:0 0 10px var(--accent);}
.acct-btn:disabled{opacity:0.4;cursor:not-allowed;}
.acct-btn.del{border-color:var(--red);color:var(--red);}
.acct-btn.del:hover{box-shadow:0 0 10px var(--red);background:rgba(255,64,96,0.1);}
.acct-warn{font-family:'Rajdhani',sans-serif;font-size:12px;color:var(--yellow);background:rgba(255,216,77,0.07);border:1px solid rgba(255,216,77,0.25);border-radius:8px;padding:10px;margin-top:10px;line-height:1.4;}
.acct-msg{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.5px;color:var(--accent3);margin-top:14px;line-height:1.5;background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:8px;padding:10px;}
.acct-link-btn{background:rgba(0,0,0,0.5);border:1px solid var(--border);color:var(--accent2);border-radius:7px;padding:5px 10px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;cursor:pointer;line-height:1;transition:all 0.15s;white-space:nowrap;}
.acct-link-btn:hover{border-color:var(--accent2);box-shadow:0 0 8px var(--accent2);}
.acct-uname-field{margin-bottom:6px;padding-bottom:14px;border-bottom:1px solid var(--border);}
.acct-legal{text-align:center;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--dim);margin-top:16px;}
.acct-legal a,.auth-legal a,.auth-footer a{color:var(--accent3);text-decoration:none;}
.acct-legal a:hover,.auth-legal a:hover,.auth-footer a:hover{text-decoration:underline;}
.auth-legal{font-family:'Rajdhani',sans-serif;font-size:11px;color:var(--dim);text-align:center;margin-top:14px;line-height:1.5;}
.auth-footer{margin-top:22px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);}

/* ── CYBERPUNK 2-LINE LOGO ── */
.cyber-logo{display:inline-flex;flex-direction:column;align-items:center;font-family:'Orbitron',monospace;font-weight:900;line-height:0.86;text-align:center;user-select:none;}
.cyber-logo .cl-line{display:block;position:relative;letter-spacing:10px;padding-left:10px;}
.cyber-logo .cl-line+.cl-line{margin-top:2px;}
.cyber-logo .cl-main{position:relative;background:linear-gradient(180deg,var(--accent3) 0%,var(--accent) 45%,var(--accent2) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;filter:drop-shadow(0 0 16px var(--accent)) drop-shadow(0 0 30px var(--accent2));}
.cyber-logo .cl-glitch{position:absolute;left:10px;top:0;opacity:0;pointer-events:none;}
.cyber-logo .cl-glitch.r{color:var(--accent);-webkit-text-fill-color:var(--accent);text-shadow:0 0 8px var(--accent);animation:clGlitchR 3.2s infinite;}
.cyber-logo .cl-glitch.c{color:var(--accent3);-webkit-text-fill-color:var(--accent3);text-shadow:0 0 8px var(--accent3);animation:clGlitchC 3.9s infinite;}
@keyframes clGlitchR{0%,88%,100%{opacity:0;transform:translate(0,0);}89%{opacity:0.75;transform:translate(-3px,1px);}92%{opacity:0.55;transform:translate(2px,-1px);}95%{opacity:0;}}
@keyframes clGlitchC{0%,90%,100%{opacity:0;transform:translate(0,0);}91%{opacity:0.7;transform:translate(3px,-1px);}94%{opacity:0.5;transform:translate(-2px,1px);}97%{opacity:0;}}
.home-cyber{font-size:46px;}
.auth-cyber{font-size:40px;margin-bottom:6px;animation:float 3s ease-in-out infinite;}
@media (max-width:380px){.home-cyber{font-size:38px;}.auth-cyber{font-size:34px;}.cyber-logo .cl-line{letter-spacing:7px;}}

/* ── STREAK BOARD ── */
.streak-board{margin-top:20px;border:1px solid var(--bord2);border-radius:18px;padding:20px 18px;background:rgba(10,6,20,0.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 0 24px rgba(0,0,0,0.35);}
.sb-title{font-family:'Orbitron',monospace;font-size:13px;font-weight:700;letter-spacing:2px;color:var(--accent);text-align:center;margin-bottom:14px;}
.sb-head{display:flex;gap:22px;justify-content:center;margin-bottom:16px;}
.sb-stat{display:flex;flex-direction:column;align-items:center;}
.sb-stat-num{font-family:'Orbitron',monospace;font-size:22px;font-weight:900;color:var(--accent);text-shadow:0 0 12px var(--accent);}
.sb-stat-lbl{font-family:'Share Tech Mono',monospace;font-size:10px;font-weight:700;letter-spacing:2px;color:var(--text);margin-top:3px;}
.sb-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
.sb-dow{font-family:'Share Tech Mono',monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:var(--accent3);text-align:center;padding-bottom:4px;}
.sb-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:6px;font-family:'Share Tech Mono',monospace;font-size:12px;font-weight:600;border:1px solid var(--border);color:var(--dim);transition:transform 0.12s;}
.sb-cell:hover{transform:scale(1.12);}
.sb-done{background:rgba(61,255,143,0.85);color:#04140d;border-color:var(--green);box-shadow:0 0 8px rgba(61,255,143,0.5);font-weight:700;}
.sb-missed{background:rgba(255,64,96,0.18);border-color:rgba(255,64,96,0.5);color:rgba(255,150,165,0.9);}
.sb-rest{background:rgba(255,255,255,0.03);color:var(--dimmer);}
.sb-today{border-color:var(--accent);box-shadow:0 0 8px var(--accent);color:var(--accent);font-weight:700;}
.sb-future{opacity:0.22;}
.sb-legend{display:flex;gap:16px;justify-content:center;margin-top:16px;flex-wrap:wrap;font-family:'Share Tech Mono',monospace;font-size:11px;font-weight:600;letter-spacing:1px;color:var(--text);}
.sb-legend span{display:flex;align-items:center;gap:6px;}
.sb-dot{width:13px;height:13px;border-radius:3px;display:inline-block;}
`;

// ── SCENE (unchanged rich canvas) ──
function Scene({ themeKey }){
  const canvasRef=useRef(null);
  useEffect(()=>{
    const t=THEMES[themeKey];const canvas=canvasRef.current;const ctx=canvas.getContext("2d");
    let W,H,DPR;
    function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=canvas.width=window.innerWidth*DPR;H=canvas.height=window.innerHeight*DPR;canvas.style.width=window.innerWidth+"px";canvas.style.height=window.innerHeight+"px";}
    resize();
    const horizon=()=>H*0.62;
    const stars=Array.from({length:160},()=>({x:Math.random()*W,y:Math.random()*horizon()*0.95,r:(Math.random()*1.6+0.4)*DPR,ph:Math.random()*6.28,sp:0.4+Math.random()*0.8}));
    let shooters=[];
    function spawnShooter(){shooters.push({x:Math.random()*W*0.7,y:Math.random()*horizon()*0.5,len:(80+Math.random()*120)*DPR,sp:(6+Math.random()*6)*DPR,life:1});}
    function makeCity(maxH,baseY,color){const arr=[];let x=0;while(x<W+100*DPR){const w=(20+Math.random()*55)*DPR;const h=(30+Math.random()*maxH)*DPR;const wins=[];for(let wy=baseY-h+6*DPR;wy<baseY-6*DPR;wy+=10*DPR){for(let wx=x+4*DPR;wx<x+w-4*DPR;wx+=8*DPR){if(Math.random()>0.5)wins.push({x:wx,y:wy,ph:Math.random()*6.28,sp:0.3+Math.random()});}}arr.push({x,w,h,wins,color});x+=w+(2+Math.random()*6)*DPR;}return arr;}
    let cityFar,cityNear;
    function buildCities(){cityFar=makeCity(120,horizon()+1,"rgba(0,0,0,0.55)");cityNear=makeCity(200,horizon()+1,"rgba(0,0,0,0.85)");}
    buildCities();
    let tt=0,gridOff=0,raf,lastShoot=0;
    function drawSky(){const g=ctx.createLinearGradient(0,0,0,horizon());t.sky.forEach((c,i)=>g.addColorStop(i/(t.sky.length-1),c));ctx.fillStyle=g;ctx.fillRect(0,0,W,horizon()+2);const hz=ctx.createLinearGradient(0,horizon()-140*DPR,0,horizon());hz.addColorStop(0,"transparent");hz.addColorStop(1,t.haze);ctx.fillStyle=hz;ctx.fillRect(0,horizon()-140*DPR,W,140*DPR);}
    function drawStars(){stars.forEach(s=>{const a=0.3+0.6*Math.abs(Math.sin(s.ph+tt*s.sp));ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fillStyle=`rgba(${t.star},${a})`;ctx.fill();});}
    function drawShooters(){shooters.forEach(sh=>{const grad=ctx.createLinearGradient(sh.x,sh.y,sh.x-sh.len,sh.y-sh.len*0.4);grad.addColorStop(0,`rgba(${t.star},${sh.life})`);grad.addColorStop(1,"transparent");ctx.strokeStyle=grad;ctx.lineWidth=2*DPR;ctx.beginPath();ctx.moveTo(sh.x,sh.y);ctx.lineTo(sh.x-sh.len,sh.y-sh.len*0.4);ctx.stroke();sh.x+=sh.sp;sh.y+=sh.sp*0.4;sh.life-=0.012;});shooters=shooters.filter(s=>s.life>0&&s.x<W+200);}
    function drawSun(){
      if(t.moon){const cx=W/2,cy=horizon()*0.42,R=70*DPR;const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R*2.6);g.addColorStop(0,t.sun[0]);g.addColorStop(0.4,t.sun[1]);g.addColorStop(0.75,"rgba(255,215,106,0.15)");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R*2.6,0,6.28);ctx.fill();ctx.fillStyle=t.sun[1];ctx.beginPath();ctx.arc(cx,cy,R,0,6.28);ctx.fill();return;}
      const cx=W/2,cy=horizon()*0.74,R=130*DPR+Math.sin(tt*1.2)*6*DPR;
      const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,R*2.2);glow.addColorStop(0,t.sun[0]);glow.addColorStop(0.35,t.sun[1]);glow.addColorStop(0.6,t.sun[2]);glow.addColorStop(0.85,t.sun[3]+"00");glow.addColorStop(1,"transparent");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,R*2.2,0,6.28);ctx.fill();
      const disc=ctx.createLinearGradient(cx,cy-R,cx,cy+R);disc.addColorStop(0,t.sun[0]);disc.addColorStop(0.5,t.sun[1]);disc.addColorStop(1,t.sun[2]);
      ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.28);ctx.clip();ctx.fillStyle=disc;ctx.fillRect(cx-R,cy-R,R*2,R*2);
      if(t.sunStripe){ctx.fillStyle=t.sunStripe;let sy=cy+R*0.15;let gap=8*DPR;while(sy<cy+R){ctx.fillRect(cx-R,sy,R*2,gap*0.6);sy+=gap;gap+=3*DPR;}}
      ctx.restore();
    }
    function drawCity(layer,pa){layer.forEach(b=>{ctx.fillStyle=b.color;ctx.fillRect(b.x,horizon()-b.h,b.w,b.h);b.wins.forEach(w=>{const a=(0.5+0.5*Math.abs(Math.sin(w.ph+tt*w.sp)))*pa;ctx.fillStyle=`rgba(255,210,120,${a*0.8})`;ctx.fillRect(w.x,w.y,3*DPR,4*DPR);});});}
    function drawGrid(){const hy=horizon();const vx=W/2;ctx.strokeStyle=t.grid;ctx.lineWidth=1.2*DPR;const lines=22;for(let i=0;i<lines;i++){const p=(i+(gridOff%1))/lines;const y=hy+Math.pow(p,2)*(H-hy);ctx.globalAlpha=0.5*(1-p*0.3);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}ctx.globalAlpha=0.4;const vts=24;for(let i=-vts;i<=vts;i++){const fx=vx+(i/vts)*W*1.4;ctx.beginPath();ctx.moveTo(vx,hy);ctx.lineTo(fx,H);ctx.stroke();}ctx.globalAlpha=1;if(!t.moon){const refl=ctx.createLinearGradient(0,hy,0,H);refl.addColorStop(0,t.sun[2]+"55");refl.addColorStop(0.4,t.sun[3]+"22");refl.addColorStop(1,"transparent");ctx.fillStyle=refl;ctx.fillRect(W/2-90*DPR,hy,180*DPR,H-hy);}}
    function frame(){tt+=0.016;gridOff+=0.012;ctx.clearRect(0,0,W,H);drawSky();drawStars();if(tt-lastShoot>2.5&&Math.random()>0.6){spawnShooter();lastShoot=tt;}drawShooters();drawSun();drawCity(cityFar,0.6);drawCity(cityNear,1);drawGrid();raf=requestAnimationFrame(frame);}
    frame();
    const onResize=()=>{resize();buildCities();};window.addEventListener("resize",onResize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",onResize);};
  },[themeKey]);
  return <canvas ref={canvasRef} className="scene-canvas"/>;
}

// Cyberpunk two-line "STUDY / STACK" logo with neon gradient + glitch clones.
function CyberLogo({ className="" }){
  return(
    <div className={`cyber-logo ${className}`}>
      {["STUDY","STACK"].map(w=>(
        <span className="cl-line" key={w}>
          <span className="cl-glitch r" aria-hidden="true">{w}</span>
          <span className="cl-glitch c" aria-hidden="true">{w}</span>
          <span className="cl-main">{w}</span>
        </span>
      ))}
    </div>
  );
}

function AuthScreen(){
  const[tab,setTab]=useState("login");const[email,setEmail]=useState("");const[pass,setPass]=useState("");const[error,setError]=useState("");const[loading,setLoading]=useState(false);
  async function handle(){setError("");setLoading(true);try{if(tab==="login")await signInWithEmailAndPassword(auth,email,pass);else await createUserWithEmailAndPassword(auth,email,pass);}catch(e){setError(e.message.replace("Firebase: ","").replace(/\(auth.*\)\.?/,"").trim());}setLoading(false);}
  return(
    <div className="auth-screen fade-in">
      <CyberLogo className="auth-cyber"/><div className="auth-sub">WEEKLY ROUTINE TRACKER</div>
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={`auth-tab${tab==="login"?" active":""}`} onClick={()=>{setTab("login");setError("");}}>LOG IN</button>
          <button className={`auth-tab${tab==="signup"?" active":""}`} onClick={()=>{setTab("signup");setError("");}}>SIGN UP</button>
        </div>
        <div className="auth-field"><label className="auth-label">EMAIL</label><input className="auth-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
        <div className="auth-field"><label className="auth-label">PASSWORD</label><input className="auth-input" type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
        {error&&<div className="auth-error">{error}</div>}
        <button className="auth-btn" onClick={handle} disabled={loading||!email||!pass}>{loading?"LOADING...":tab==="login"?"ENTER":"CREATE ACCOUNT"}</button>
        {tab==="signup"&&<div className="auth-legal">By creating an account you agree to our <a href={`${process.env.PUBLIC_URL}/terms.html`} target="_blank" rel="noreferrer">Terms</a> &amp; <a href={`${process.env.PUBLIC_URL}/privacy.html`} target="_blank" rel="noreferrer">Privacy Policy</a>.</div>}
      </div>
      <div className="auth-footer"><a href={`${process.env.PUBLIC_URL}/privacy.html`} target="_blank" rel="noreferrer">Privacy</a> · <a href={`${process.env.PUBLIC_URL}/terms.html`} target="_blank" rel="noreferrer">Terms</a> · © {OWNER_NAME}</div>
    </div>
  );
}

function MultiDayModal({defaultDow,onClose,onAdd}){
  const[label,setLabel]=useState("");const[sel,setSel]=useState([defaultDow]);const[type,setType]=useState("weekly");
  function toggleDay(d){setSel(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d]);}
  function confirm(){if(!label.trim()||sel.length===0)return;onAdd(label.trim(),sel,type==="weekly");onClose();}
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal fade-in">
        <div className="modal-title">ADD TO MULTIPLE DAYS</div>
        <div className="modal-field"><label className="modal-label">TASK NAME</label><input className="modal-input" placeholder="e.g. Linear Algebra" value={label} onChange={e=>setLabel(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&confirm()}/></div>
        <div className="modal-field"><label className="modal-label">SELECT DAYS</label>
          <div className="day-picker">{DAYS_SHORT.map((d,i)=>(<div key={i} className={`day-chip${sel.includes(i)?" selected":""}`} onClick={()=>toggleDay(i)}>{d}</div>))}</div>
          <div className="selected-days-preview">{sel.length===0?"no days selected":sel.sort().map(d=>DAYS_SHORT[d]).join(" · ")}</div>
        </div>
        <div className="modal-field"><label className="modal-label">TYPE</label>
          <div className="type-row">
            <div className={`type-card${type==="weekly"?" sel-weekly":""}`} onClick={()=>setType("weekly")}><div className="type-card-label">WEEKLY</div><div className="type-card-desc">Repeats every week</div></div>
            <div className={`type-card${type==="once"?" sel-once":""}`} onClick={()=>setType("once")}><div className="type-card-label">ONE-TIME</div><div className="type-card-desc">This week only</div></div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>CANCEL</button>
          <button className="modal-confirm" onClick={confirm} disabled={!label.trim()||sel.length===0}>ADD TO {sel.length} DAY{sel.length!==1?"S":""}</button>
        </div>
      </div>
    </div>
  );
}

// ── STUDY TIMER VIEW ──
function StudyView({ studyLog, onSave }){
  const[running,setRunning]=useState(false);
  const[elapsed,setElapsed]=useState(0);
  const[congrats,setCongrats]=useState(null);
  const startRef=useRef(null);
  const tickRef=useRef(null);

  // Keep the screen awake while studying (fixes the "timer resets on sleep" bug).
  useWakeLock(running);

  // On mount, resume an in-progress session that survived a reload/sleep. The
  // start time is persisted, so elapsed is always recomputed from the wall clock.
  useEffect(()=>{
    let saved=0; try{ saved=+(localStorage.getItem("sq_study_start")||0); }catch(e){}
    if(saved>0){
      startRef.current=saved;
      setRunning(true);
      setElapsed(Math.floor((Date.now()-saved)/1000));
      tickRef.current=setInterval(()=>{ setElapsed(Math.floor((Date.now()-startRef.current)/1000)); },250);
    }
    return()=>clearInterval(tickRef.current);
  },[]);

  function start(){SFX.start();
    const t=Date.now();
    startRef.current=t;
    try{ localStorage.setItem("sq_study_start",String(t)); }catch(e){}
    setElapsed(0);setRunning(true);
    tickRef.current=setInterval(()=>{
      setElapsed(Math.floor((Date.now()-startRef.current)/1000));
    },250);
  }
  function stop(){
    clearInterval(tickRef.current);
    try{ localStorage.removeItem("sq_study_start"); }catch(e){}
    const secs=Math.floor((Date.now()-startRef.current)/1000);
    setRunning(false);
    if(secs>0){ onSave(secs); setCongrats(secs); SFX.win(); } else { SFX.stop(); }
    setElapsed(0);
  }

  const today=dateStr(new Date());
  const todayTotal=studyLog[today]||0;

  // ring progress (visual loop every 60 min)
  const R=104, C=2*Math.PI*R;
  const loopSecs=3600;
  const prog=(elapsed%loopSecs)/loopSecs;
  const offset=C*(1-prog);

  // build last 14 days history sorted desc
  const days=[];
  for(let i=0;i<14;i++){const d=new Date();d.setDate(d.getDate()-i);days.push(dateStr(d));}
  const maxSecs=Math.max(1,...days.map(d=>studyLog[d]||0));
  const weekTotal=days.slice(0,7).reduce((a,d)=>a+(studyLog[d]||0),0);

  return(
    <div className="study-wrap fade-in">
      {congrats!==null&&(
        <div className="congrats-overlay" onClick={e=>e.target===e.currentTarget&&setCongrats(null)}>
          <div className="congrats">
            <div className="congrats-emoji">🎉</div>
            <div className="congrats-title">CONGRATS!</div>
            <div className="congrats-msg">You studied for</div>
            <div className="congrats-time">{fmtDuration(congrats)}</div>
            <div className="congrats-msg">Today's total: {fmtDuration(studyLog[today]||0)}</div>
            <button className="congrats-btn" onClick={()=>setCongrats(null)}>NICE!</button>
          </div>
        </div>
      )}

      <div className="timer-card">
        <div className="timer-ring">
          <svg viewBox="0 0 230 230">
            <circle className="timer-ring-bg" cx="115" cy="115" r={R}/>
            <circle className="timer-ring-fg" cx="115" cy="115" r={R} strokeDasharray={C} strokeDashoffset={running?offset:C}/>
          </svg>
          <div>
            <div className="timer-display">{fmtClock(elapsed)}</div>
            <div className={`timer-state${running?" running":""}`}>{running?"● STUDYING":"READY"}</div>
          </div>
        </div>
        <div className="timer-btns">
          {!running
            ? <button className="timer-btn start" onClick={start}>▶ START STUDYING</button>
            : <button className="timer-btn stop" onClick={stop}>■ STOP</button>}
        </div>
        <div className="timer-hint">
          {running
            ? "Go ahead and study — screen stays awake and the timer survives sleep/reload. Hit STOP when you're done."
            : "Press start, then study away. Time keeps counting even if you switch tabs, sleep, or go AFK."}
        </div>
        <div className="today-total">
          <div className="today-total-label">STUDIED TODAY</div>
          <div className="today-total-val">{fmtDuration(todayTotal)}</div>
        </div>
      </div>

      <div className="study-history">
        <div className="sh-title">📊 STUDY HISTORY</div>
        <div className="sh-weektotal">LAST 7 DAYS: {fmtDuration(weekTotal)}</div>
        {weekTotal===0 && (studyLog[today]||0)===0 && (
          <div className="sh-empty">NO STUDY SESSIONS YET — START THE TIMER!</div>
        )}
        {days.map(d=>{
          const secs=studyLog[d]||0;
          if(secs===0 && d!==today) return null;
          const isToday=d===today;
          const dt=new Date(d+"T00:00:00");
          const lbl=isToday?"TODAY":dt.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
          return(
            <div key={d} className={`sh-row${isToday?" today":""}`}>
              <span className={`sh-date${isToday?" today":""}`}>{lbl}</span>
              <span className="sh-bar-track"><span className="sh-bar-fill" style={{width:`${Math.round((secs/maxSecs)*100)}%`}}/></span>
              <span className="sh-time">{secs>0?fmtDuration(secs):"—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── LOCK IN: setup screen ──
function LockSetupView({ onStart }){
  const[hours,setHours]=useState(2);
  const[mins,setMins]=useState(0);
  const total=(parseInt(hours,10)||0)*60+(parseInt(mins,10)||0); // minutes
  const presets=[{h:2,m:0,l:"2 HRS"},{h:4,m:0,l:"4 HRS"},{h:6,m:0,l:"6 HRS"},{h:12,m:0,l:"12 HRS"}];
  function startNow(){
    if(total<=0)return;
    SFX.start();
    // requestFullscreen must run inside this user gesture
    try{ const el=document.documentElement; const fn=el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen; fn&&fn.call(el); }catch(e){}
    onStart(total*60*1000);
  }
  return(
    <div className="lock-setup fade-in">
      <div className="lock-card">
        <div className="lock-card-icon">🔒</div>
        <div className="lock-card-title">LOCK IN</div>
        <div className="lock-card-desc">Set a countdown and commit. The screen takes over and stays awake. To bail early you'll have to donate {LOCKIN_FEE}tk via bKash.</div>
        <div className="lock-presets">
          {presets.map(p=>(
            <button key={p.l} className={`lock-preset${hours===p.h&&mins===p.m?" active":""}`} onClick={()=>{SFX.tap();setHours(p.h);setMins(p.m);}}>{p.l}</button>
          ))}
        </div>
        <div className="lock-custom">
          <div className="lock-num"><label className="lock-num-label">HOURS</label><input className="lock-num-input" type="number" min="0" max="24" value={hours} onChange={e=>setHours(e.target.value)}/></div>
          <div className="lock-num"><label className="lock-num-label">MINUTES</label><input className="lock-num-input" type="number" min="0" max="59" value={mins} onChange={e=>setMins(e.target.value)}/></div>
        </div>
        <div className="lock-total">TOTAL: {Math.floor(total/60)}H {total%60}M</div>
        <button className="lock-start-btn" onClick={startNow} disabled={total<=0}>▶ START LOCK IN</button>
        <div className="lock-warn">⚠ Heads up: a website can't fully block Alt+Tab or closing the tab — but this will go fullscreen, keep the screen awake, warn you if you try to leave, and survive reloads. The timer won't release until it ends or you pay the {LOCKIN_FEE}tk give-up fee.</div>
      </div>
    </div>
  );
}

// ── LOCK IN: full-screen lock overlay (renders over everything while active) ──
function LockOverlay({ start, end, motivation, onComplete, onGiveUp }){
  const[now,setNow]=useState(Date.now());
  const[phase,setPhase]=useState("locked"); // locked | giveup | done
  const[trx,setTrx]=useState("");
  const[err,setErr]=useState("");
  const[escapes,setEscapes]=useState(0);
  const[isFs,setIsFs]=useState(typeof document!=="undefined"&&!!document.fullscreenElement);
  const[quote]=useState(()=>pickQuote(motivation&&motivation.name, motivation&&motivation.quotes));
  useWakeLock(true);

  useEffect(()=>{ const id=setInterval(()=>setNow(Date.now()),250); return()=>clearInterval(id); },[]);
  useEffect(()=>{ if(phase==="locked"&&now>=end){ setPhase("done"); SFX.win(); } },[now,end,phase]);

  // warn before close / reload while locked
  useEffect(()=>{
    if(phase==="done")return;
    const h=e=>{ e.preventDefault(); e.returnValue=""; return ""; };
    window.addEventListener("beforeunload",h);
    return()=>window.removeEventListener("beforeunload",h);
  },[phase]);

  // shame counter: leaving fullscreen or hiding the tab counts as an escape
  useEffect(()=>{
    const onFs=()=>{ const f=!!document.fullscreenElement; setIsFs(f); if(!f&&phase==="locked") setEscapes(c=>c+1); };
    const onVis=()=>{ if(document.visibilityState==="hidden"&&phase==="locked") setEscapes(c=>c+1); };
    document.addEventListener("fullscreenchange",onFs);
    document.addEventListener("visibilitychange",onVis);
    return()=>{ document.removeEventListener("fullscreenchange",onFs); document.removeEventListener("visibilitychange",onVis); };
  },[phase]);

  function reenter(){ try{ const el=document.documentElement; const fn=el.requestFullscreen||el.webkitRequestFullscreen; fn&&fn.call(el); }catch(e){} }
  function confirmGiveUp(){
    const v=trx.trim().toUpperCase();
    if(!TRXID_RE.test(v)){ setErr("Enter a valid bKash TrxID — 10 letters/digits."); SFX.del(); return; }
    SFX.stop();
    onGiveUp(v);
  }

  const remaining=Math.max(0,Math.ceil((end-now)/1000));
  const span=Math.max(1,end-start);
  const prog=Math.min(1,Math.max(0,(now-start)/span));

  if(phase==="done"){
    return(
      <div className="lockin">
        <div className="lockin-done-emoji">🏆</div>
        <div className="lockin-tag" style={{color:"var(--green)"}}>LOCK IN COMPLETE</div>
        <div className="lockin-quote">You stayed locked in the whole time. That's discipline. Respect.</div>
        <button className="lockin-finish" onClick={()=>{ try{document.fullscreenElement&&document.exitFullscreen();}catch(e){} onComplete(); }}>FINISH ✓</button>
      </div>
    );
  }

  if(phase==="giveup"){
    return(
      <div className="lockin">
        <div className="giveup-box">
          <div className="giveup-title">🏳️ GIVING UP?</div>
          <div className="giveup-text">Quitting early costs <b>{LOCKIN_FEE}tk</b>. Send it via bKash <b>Send Money</b>, then paste the Transaction ID (TrxID) below to unlock.</div>
          <div className="giveup-bkash">
            <div className="giveup-bkash-label">bKash — SEND MONEY TO</div>
            <div className="giveup-bkash-num">{BKASH_NUMBER}</div>
            <div className="giveup-bkash-amt">AMOUNT: {LOCKIN_FEE}.00 TK</div>
          </div>
          <input className="giveup-input" placeholder="TRX ID e.g. 9F2A3BX7QK" value={trx} maxLength={10} onChange={e=>{setTrx(e.target.value.toUpperCase());setErr("");}}/>
          {err&&<div className="giveup-err">{err}</div>}
          <div className="giveup-actions">
            <button className="giveup-cancel" onClick={()=>{SFX.tap();setPhase("locked");setTrx("");setErr("");}}>NO, KEEP GOING</button>
            <button className="giveup-confirm" onClick={confirmGiveUp}>UNLOCK</button>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div className="lockin">
      <div className="lockin-tag">● LOCKED IN — STAY FOCUSED</div>
      <div className="lockin-time">{fmtClock(remaining)}</div>
      <div className="lockin-sub">REMAINING</div>
      <div className="lockin-quote">{quote}</div>
      <div className="lockin-bar"><div className="lockin-bar-fill" style={{width:`${Math.round(prog*100)}%`}}/></div>
      {escapes>0&&<div className="lockin-shame">⚠ YOU LEFT {escapes} TIME{escapes!==1?"S":""} — GET BACK TO WORK</div>}
      {!isFs&&<button className="lockin-reenter" onClick={reenter}>⛶ RE-ENTER FULLSCREEN</button>}
      <button className="lockin-giveup" onClick={()=>{SFX.tap();setPhase("giveup");}}>I GIVE UP ({LOCKIN_FEE}TK)</button>
    </div>
  );
}

// ── MOTIVATION: set rival name, manage + generate savage quotes ──
function MotivationView({ motivation, onSave }){
  const[name,setName]=useState(motivation.name||"");
  const[quotes,setQuotes]=useState(motivation.quotes||[]);
  const[draft,setDraft]=useState("");
  const[genRaw,setGenRaw]=useState("");
  const first=useRef(true);

  // push changes up (parent persists to Firestore). Skip the initial mount.
  useEffect(()=>{ if(first.current){first.current=false;return;} onSave({name,quotes}); },[name,quotes]); // eslint-disable-line react-hooks/exhaustive-deps

  function generate(){
    const avail=SAVAGE_QUOTES.filter(q=>!quotes.includes(q));
    const pool=avail.length?avail:SAVAGE_QUOTES;
    setGenRaw(pool[Math.floor(Math.random()*pool.length)]);
    SFX.click();
  }
  function addGenerated(){ if(genRaw&&!quotes.includes(genRaw)){ setQuotes([...quotes,genRaw]); SFX.add(); } }
  function addCustom(){ const v=draft.trim(); if(!v)return; setQuotes([...quotes,v]); setDraft(""); SFX.add(); }
  function delQuote(i){ setQuotes(quotes.filter((_,idx)=>idx!==i)); SFX.del(); }

  return(
    <div className="mv-wrap fade-in">
      <div className="mv-card">
        <div className="mv-card-title">😈 YOUR RIVAL</div>
        <input className="mv-name-input" placeholder="Name a rival… e.g. Bob" value={name} onChange={e=>setName(e.target.value)}/>
        <div className="mv-preview">{name?pickQuote(name,quotes):"Set a name and we'll roast you with it every time you open the app."}</div>
      </div>

      <div className="mv-card">
        <div className="mv-card-title">🎲 GENERATE A ROAST</div>
        {genRaw&&<div className="mv-preview">{fillQuote(genRaw,name)}</div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <button className="mv-gen-btn" onClick={generate}>🎲 RANDOM ROAST</button>
          {genRaw&&!quotes.includes(genRaw)&&<button className="mv-add-this" onClick={addGenerated}>+ SAVE TO MY QUOTES</button>}
        </div>
      </div>

      <div className="mv-card">
        <div className="mv-card-title">✍️ ADD YOUR OWN</div>
        <div style={{display:"flex",gap:8}}>
          <input className="add-input" placeholder="Use {name} where the rival goes…" value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCustom()}/>
          <button className="add-btn" onClick={addCustom}>+</button>
        </div>
        <div style={{marginTop:14}}>
          {quotes.length===0
            ? <div className="mv-empty">NO CUSTOM QUOTES YET</div>
            : quotes.map((q,i)=>(
                <div key={i} className="mv-quote-row">
                  <span className="mv-quote-txt">{fillQuote(q,name)}</span>
                  <button className="del-btn" onClick={()=>delQuote(i)}>✕</button>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

// ── STREAK BOARD: visual history of which past days you kept your streak ──
function StreakBoard({ tasksForDate }){
  const today=new Date(); today.setHours(0,0,0,0);
  const todayKey=dateStr(today);
  function statusOf(d){
    const dd=new Date(d); dd.setHours(0,0,0,0);
    if(dd>today) return "future";
    const ts=tasksForDate(dd);
    if(!ts || ts.length===0) return "rest";
    if(ts.every(t=>t.done)) return "done";
    if(dateStr(dd)===todayKey) return "today";
    return "missed";
  }
  // 6 calendar weeks ending this week (Sun..Sat columns)
  const sun=getSundayForKey(getWeekKey(today));
  const cells=[];
  for(let w=5;w>=0;w--){ const wkStart=addDays(sun,-7*w); for(let i=0;i<7;i++){ const d=addDays(wkStart,i); cells.push({d,st:statusOf(d)}); } }

  // current streak (rest days skip, missed breaks; today counts only if all done)
  let cur=0;
  const tt=tasksForDate(today);
  if(tt.length>0 && tt.every(t=>t.done)) cur++;
  { const d=new Date(today); d.setDate(d.getDate()-1);
    for(let i=0;i<400;i++){ const ts=tasksForDate(d); if(ts.length===0){d.setDate(d.getDate()-1);continue;} if(ts.every(t=>t.done))cur++; else break; d.setDate(d.getDate()-1); } }
  // best streak over the last ~200 days
  let run=0,best=0;
  { const d=new Date(today); d.setDate(d.getDate()-200);
    for(let i=0;i<=200;i++){ const st=statusOf(d); if(st==="done"){run++; if(run>best)best=run;} else if(st==="missed"){run=0;} d.setDate(d.getDate()+1); } }

  return(
    <div className="streak-board">
      <div className="sb-title">🔥 STREAK HISTORY</div>
      <div className="sb-head">
        <div className="sb-stat"><span className="sb-stat-num">🔥 {cur}</span><span className="sb-stat-lbl">CURRENT</span></div>
        <div className="sb-stat"><span className="sb-stat-num">🏆 {best}</span><span className="sb-stat-lbl">BEST</span></div>
      </div>
      <div className="sb-grid">
        {DAYS_SHORT.map(d=><div className="sb-dow" key={d}>{d[0]}</div>)}
        {cells.map(({d,st},i)=>(
          <div key={i} className={`sb-cell sb-${st}`} title={`${d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})} — ${st==="done"?"streak day ✓":st==="missed"?"missed":st==="today"?"today (in progress)":st==="rest"?"rest day":"upcoming"}`}>{d.getDate()}</div>
        ))}
      </div>
      <div className="sb-legend">
        <span><i className="sb-dot sb-done"/>Streak</span>
        <span><i className="sb-dot sb-missed"/>Missed</span>
        <span><i className="sb-dot sb-rest"/>Rest</span>
        <span><i className="sb-dot sb-today"/>Today</span>
      </div>
    </div>
  );
}

// ── ACCOUNT / SETTINGS (password reset, email verify, export, delete) ──
function SettingsModal({ user, username, onUsername, exportData, onClose }){
  const[msg,setMsg]=useState("");
  const[busy,setBusy]=useState(false);
  const[confirmDel,setConfirmDel]=useState(false);
  const[uname,setUname]=useState(username||"");
  function changeName(v){ setUname(v); onUsername(v); }

  function exportJson(){
    try{
      const payload={exportedAt:new Date().toISOString(),account:user.email,...exportData};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;a.download=`studystack-${(user.email||"data").replace(/[^a-z0-9]/gi,"_")}.json`;
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      SFX.click();setMsg("✓ Your data has been downloaded as a JSON file.");
    }catch(e){setMsg("Couldn't export: "+(e.message||e));}
  }
  async function resetPw(){
    setBusy(true);setMsg("");
    try{ await sendPasswordResetEmail(auth,user.email); setMsg(`✓ Password reset email sent to ${user.email}.`); }
    catch(e){ setMsg("Error: "+(e.message||e).replace("Firebase: ","")); }
    setBusy(false);
  }
  async function verify(){
    setBusy(true);setMsg("");
    try{ await sendEmailVerification(user); setMsg("✓ Verification email sent. If it's not in your inbox, check your Spam / Promotions folder and mark it 'Not spam'."); }
    catch(e){ setMsg("Error: "+(e.message||e).replace("Firebase: ","")); }
    setBusy(false);
  }
  async function reallyDelete(){
    setBusy(true);setMsg("");
    try{
      await deleteDoc(doc(db,"users",user.uid,"data","weeks"));
      await deleteUser(user);
      try{ await clearIndexedDbPersistence(db); }catch(_){}
      window.location.reload();
    }catch(e){
      if((e.code||"").includes("requires-recent-login")){
        setMsg("For security, please SIGN OUT, sign in again, then delete. (Recent login required.)");
      }else{
        setMsg("Error: "+(e.message||e).replace("Firebase: ",""));
      }
      setBusy(false);
    }
  }

  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal fade-in">
        <div className="modal-title">ACCOUNT</div>
        <div className="acct-email">{user.email}{user.emailVerified?<span className="acct-verified"> ✓ VERIFIED</span>:<span className="acct-unverified"> • UNVERIFIED</span>}</div>

        <div className="acct-uname-field">
          <label className="modal-label">USERNAME</label>
          <input className="modal-input" placeholder="Pick a username" value={uname} maxLength={24} onChange={e=>changeName(e.target.value)}/>
          <div className="acct-row-desc" style={{marginTop:6}}>This is how you're greeted in the app. Saves automatically.</div>
        </div>

        <div className="acct-row">
          <div className="acct-row-info"><div className="acct-row-title">Export my data</div><div className="acct-row-desc">Download everything we store about you as JSON.</div></div>
          <button className="acct-btn" onClick={exportJson} disabled={busy}>EXPORT</button>
        </div>
        {!user.emailVerified&&(
          <div className="acct-row">
            <div className="acct-row-info"><div className="acct-row-title">Verify email</div><div className="acct-row-desc">Confirm your address. The email may land in Spam/Promotions — mark it "Not spam".</div></div>
            <button className="acct-btn" onClick={verify} disabled={busy}>VERIFY</button>
          </div>
        )}
        <div className="acct-row">
          <div className="acct-row-info"><div className="acct-row-title">Reset password</div><div className="acct-row-desc">We'll email you a reset link.</div></div>
          <button className="acct-btn" onClick={resetPw} disabled={busy}>RESET</button>
        </div>
        <div className="acct-row danger">
          <div className="acct-row-info"><div className="acct-row-title">Delete account</div><div className="acct-row-desc">Permanently erase your account and all data. Cannot be undone.</div></div>
          {!confirmDel
            ? <button className="acct-btn del" onClick={()=>{SFX.tap();setConfirmDel(true);}} disabled={busy}>DELETE</button>
            : <button className="acct-btn del" onClick={reallyDelete} disabled={busy}>{busy?"…":"CONFIRM"}</button>}
        </div>
        {confirmDel&&!busy&&<div className="acct-warn">⚠ Tap CONFIRM to permanently delete. This wipes your tasks, study history, and motivation data.</div>}

        {msg&&<div className="acct-msg">{msg}</div>}
        <div className="acct-legal"><a href={`${process.env.PUBLIC_URL}/privacy.html`} target="_blank" rel="noreferrer">Privacy Policy</a> · <a href={`${process.env.PUBLIC_URL}/terms.html`} target="_blank" rel="noreferrer">Terms of Service</a> · <a href={`mailto:${OWNER_EMAIL}`}>Contact</a></div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──
export default function App(){
  const now=new Date();const todayDow=now.getDay();const currentWeekKey=getWeekKey(now);
  const[user,setUser]=useState(null);const[authReady,setAuthReady]=useState(false);
  const[allWeeks,setAllWeeks]=useState({[currentWeekKey]:DEFAULT_TASKS});
  const[studyLog,setStudyLog]=useState({});
  const[keptWeeks,setKeptWeeks]=useState({});
  const[motivation,setMotivation]=useState({name:"",quotes:[]});
  const[username,setUsername]=useState("");
  const[lockInLog,setLockInLog]=useState([]);
  const[entryQuote,setEntryQuote]=useState(null);
  const shownEntry=useRef(false);
  // Lock In state — restored from localStorage so a reload can't escape the lock.
  const[lockStart,setLockStart]=useState(()=>{try{const e=+(localStorage.getItem("sq_lockin_end")||0);return e>Date.now()?+(localStorage.getItem("sq_lockin_start")||0):0;}catch(e){return 0;}});
  const[lockEnd,setLockEnd]=useState(()=>{try{const e=+(localStorage.getItem("sq_lockin_end")||0);return e>Date.now()?e:0;}catch(e){return 0;}});
  const[view,setView]=useState("home"); // home | tasks | study | lockin | motivation
  const[activeWeek,setActiveWeek]=useState(currentWeekKey);
  const[openDay,setOpenDay]=useState(todayDow);const[editDay,setEditDay]=useState(null);
  const[newLabels,setNewLabels]=useState({});const[newTypes,setNewTypes]=useState({});
  const[popId,setPopId]=useState(null);const[showModal,setShowModal]=useState(null);const[syncing,setSyncing]=useState(false);
  const[showSettings,setShowSettings]=useState(false);
  const[themeKey,setThemeKey]=useState(()=>{const t=localStorage.getItem("sq_theme");return THEMES[t]?t:"retrowave";});
  const[soundOn,setSoundOnState]=useState(SOUND_ON);
  function toggleSound(){const v=!soundOn;setSoundOn(v);setSoundOnState(v);if(v)SFX.click();}
  const unsubRef=useRef(null);const saveRef=useRef(null);const loadedForUid=useRef(null);const todayRowRef=useRef(null);const activeTabRef=useRef(null);

  useEffect(()=>{const vars=THEMES[themeKey].vars;const root=document.documentElement;Object.entries(vars).forEach(([k,v])=>root.style.setProperty(k,v));localStorage.setItem("sq_theme",themeKey);},[themeKey]);
  useEffect(()=>{const unsub=onAuthStateChanged(auth,u=>{setUser(u);setAuthReady(true);});return unsub;},[]);
  // Subscribe to Firestore. We only mark "loaded" once real data arrives,
  // and we NEVER write back until after that — this prevents the in-memory
  // defaults from overwriting your saved cloud data on a fresh load.
  useEffect(()=>{
    if(unsubRef.current){unsubRef.current();unsubRef.current=null;}
    loadedForUid.current=null;
    if(!user)return;
    setSyncing(true);
    const ref=doc(db,"users",user.uid,"data","weeks");
    unsubRef.current=onSnapshot(ref,snap=>{
      if(snap.exists()){
        const d=snap.data();
        let aw=d.allWeeks||{};
        if(!aw[currentWeekKey]) aw={...aw,[currentWeekKey]:weekFromTemplate(Object.keys(aw).length?aw[Object.keys(aw).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).sort().pop()]:DEFAULT_TASKS)};
        setAllWeeks(aw);
        setStudyLog(d.studyLog||{});
        setKeptWeeks(d.keptWeeks||{});
        setMotivation(d.motivation||{name:"",quotes:[]});
        setUsername(d.username||"");
        setLockInLog(d.lockInLog||[]);
      }else{
        // brand new account — seed defaults once
        setAllWeeks({[currentWeekKey]:DEFAULT_TASKS});
        setStudyLog({});
        setMotivation({name:"",quotes:[]});
        setUsername("");
        setLockInLog([]);
        setDoc(ref,{allWeeks:{[currentWeekKey]:DEFAULT_TASKS},studyLog:{},keptWeeks:{},motivation:{name:"",quotes:[]},username:"",lockInLog:[]});
      }
      loadedForUid.current=user.uid;
      setSyncing(false);
    });
    return()=>{if(unsubRef.current)unsubRef.current();};
  },[user,currentWeekKey]);
  // Save back (debounced) ONLY after we've loaded real data at least once.
  useEffect(()=>{
    if(!user||loadedForUid.current!==user.uid)return;
    clearTimeout(saveRef.current);setSyncing(true);
    saveRef.current=setTimeout(async()=>{
      // Prune ONLY weeks that contain zero tasks across all 7 days (truly unused).
      // A carry-forward week has your weekly tasks, so it is kept. Never prune the
      // current or the currently-active week.
      const pruned={};
      for(const[k,wk]of Object.entries(allWeeks)){
        const hasAny=Object.values(wk||{}).some(arr=>Array.isArray(arr)&&arr.length>0);
        if(k===currentWeekKey||k===activeWeek||keptWeeks[k]||hasAny) pruned[k]=wk;
      }
      try{await setDoc(doc(db,"users",user.uid,"data","weeks"),{allWeeks:pruned,studyLog,keptWeeks,motivation,username,lockInLog});}catch(e){console.error(e);}
      setSyncing(false);
    },800);
  },[allWeeks,studyLog,keptWeeks,motivation,username,lockInLog,user,activeWeek,currentWeekKey]);
  // When entering TASKS view, smoothly scroll today's card into view.
  useEffect(()=>{
    if(view==="tasks"){
      const id=setTimeout(()=>{todayRowRef.current&&todayRowRef.current.scrollIntoView({behavior:"smooth",block:"center"});},150);
      return()=>clearTimeout(id);
    }
  },[view]);
  // Keep the active week's tab centered in the (scrollable) week nav, so after
  // stepping forward/back you can always see where you are.
  useEffect(()=>{
    if(view!=="tasks")return;
    const id=setTimeout(()=>{activeTabRef.current&&activeTabRef.current.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});},120);
    return()=>clearTimeout(id);
  },[activeWeek,view]);

  // Chronological order: oldest → newest, left → right. This matches the
  // ◀ (back in time) / ▶ (forward in time) arrows so tabs read intuitively.
  const weekKeys=Object.keys(allWeeks).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).sort((a,b)=>a.localeCompare(b));
  const isPast=key=>key<currentWeekKey;const isCurrentWeek=activeWeek===currentWeekKey;const past=isPast(activeWeek);
  function dateOfDow(dow){const sun=getSundayForKey(activeWeek);return addDays(sun,dow).getDate();}
  function dayHasMissed(dow,wk){if(!isPast(wk))return false;const ts=(allWeeks[wk]||{})[dow]||[];return ts.length>0&&ts.some(t=>!t.done);}
  function weekHasMissed(key){if(!isPast(key))return false;for(let d=0;d<7;d++)if(dayHasMissed(d,key))return true;return false;}
  function activeTasks(dow){return(allWeeks[activeWeek]||{})[dow]||[];}
  // Create the week if missing (carrying weekly tasks forward from the most recent
  // existing week), then navigate to it. Template is resolved inside the state
  // updater so it always uses the freshest data, never a stale closure.
  function goToWeek(key){
    setAllWeeks(prev=>{
      if(prev[key]) return prev;
      const keys=Object.keys(prev).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
      let srcKey=null;
      for(const k of keys){ if(k<=key) srcKey=k; }   // nearest past/equal
      if(!srcKey && keys.length) srcKey=keys[keys.length-1]; // else most recent
      const srcWeek=srcKey?prev[srcKey]:DEFAULT_TASKS;
      return {...prev,[key]:weekFromTemplate(srcWeek)};
    });
    setKeptWeeks(prev=>prev[key]?prev:{...prev,[key]:true});
    setActiveWeek(key);
    setOpenDay(key===currentWeekKey?todayDow:0);
    setEditDay(null);
    SFX.click();
  }
  function stepWeek(deltaWeeks){
    const sun=getSundayForKey(activeWeek);
    const target=addDays(sun,deltaWeeks*7);
    goToWeek(getWeekKey(target));
  }
  // ── STREAK: consecutive days (up to today) where all that day's tasks are done.
  // Rest days (no tasks) are skipped, not broken. Today incomplete doesn't break it yet.
  function tasksForDate(d){const wk=getWeekKey(d);return(allWeeks[wk]||{})[d.getDay()]||[];}
  function computeStreak(){
    let streak=0;
    const today=new Date();today.setHours(0,0,0,0);
    // Count today only if it actually has tasks AND every one is done.
    const tt=tasksForDate(today);
    if(tt.length>0 && tt.every(t=>t.done)) streak++;
    // Walk strictly into the PAST. A past day with tasks that are not all done
    // BREAKS the streak. A past day with genuinely no tasks is a rest day (skip).
    const d=new Date(today);d.setDate(d.getDate()-1);
    for(let i=0;i<400;i++){
      const ts=tasksForDate(d);
      if(ts.length===0){d.setDate(d.getDate()-1);continue;} // rest day, skip
      if(ts.every(t=>t.done)) streak++; else break;          // incomplete -> stop
      d.setDate(d.getDate()-1);
    }
    return streak;
  }
  const streak=computeStreak();
  function updateDay(dow,fn){setAllWeeks(prev=>({...prev,[activeWeek]:{...(prev[activeWeek]||{}),[dow]:fn((prev[activeWeek]||{})[dow]||[])}}));}
  function toggle(dow,id){if(past)return;const cur=(activeTasks(dow).find(t=>t.id===id)||{}).done;cur?SFX.undo():SFX.done();setPopId(id);setTimeout(()=>setPopId(null),180);updateDay(dow,ts=>ts.map(t=>t.id===id?{...t,done:!t.done}:t));}
  function del(dow,id){if(past)return;SFX.del();updateDay(dow,ts=>ts.filter(t=>t.id!==id));}
  function editLabel(dow,id,val){if(past)return;updateDay(dow,ts=>ts.map(t=>t.id===id?{...t,label:val}:t));}
  function toggleRepeat(dow,id){if(past)return;updateDay(dow,ts=>ts.map(t=>t.id===id?{...t,repeat:!t.repeat}:t));}
  function addTask(dow){if(past)return;const label=(newLabels[dow]||"").trim();if(!label)return;const type=newTypes[dow]||"weekly";SFX.add();updateDay(dow,ts=>[...ts,{id:uid(),label,repeat:type==="weekly",done:false}]);setNewLabels(p=>({...p,[dow]:""}));}
  function handleMultiAdd(label,days,repeat){SFX.add();days.forEach(dow=>updateDay(dow,ts=>[...ts,{id:uid(),label,repeat,done:false}]));}
  function saveStudy(secs){const d=dateStr(new Date());setStudyLog(prev=>({...prev,[d]:(prev[d]||0)+secs}));}

  // ── LOCK IN controls ──
  function startLockIn(ms){
    const s=Date.now(), e=s+ms;
    try{ localStorage.setItem("sq_lockin_start",String(s)); localStorage.setItem("sq_lockin_end",String(e)); }catch(_){}
    setLockStart(s); setLockEnd(e); setView("home");
  }
  function endLockIn(){
    try{ localStorage.removeItem("sq_lockin_start"); localStorage.removeItem("sq_lockin_end"); }catch(_){}
    try{ document.fullscreenElement&&document.exitFullscreen(); }catch(_){}
    setLockStart(0); setLockEnd(0);
  }
  function recordGiveUp(trxId){
    setLockInLog(prev=>[...prev,{trxId,amount:LOCKIN_FEE,at:new Date().toISOString()}]);
    endLockIn();
  }

  // Savage entry popup — shown once per app load if a rival name is set.
  useEffect(()=>{
    if(user && motivation && motivation.name && !shownEntry.current){
      shownEntry.current=true;
      setEntryQuote(pickQuote(motivation.name, motivation.quotes));
    }
  },[user,motivation]);
  const entryPopup = entryQuote && (
    <div className="mv-pop-overlay" onClick={e=>e.target===e.currentTarget&&setEntryQuote(null)}>
      <div className="mv-pop">
        <div className="mv-pop-emoji">😈</div>
        <div className="mv-pop-quote">{entryQuote}</div>
        <button className="mv-pop-btn" onClick={()=>{SFX.click();setEntryQuote(null);}}>LET'S GO →</button>
      </div>
    </div>
  );
  const settingsModal = showSettings && user && (
    <SettingsModal user={user} username={username} onUsername={setUsername} exportData={{username,allWeeks,studyLog,keptWeeks,motivation,lockInLog}} onClose={()=>setShowSettings(false)}/>
  );

  const sceneBlock=<><div className="scene"><Scene themeKey={themeKey}/></div><div className="retro-scanlines"/><div className="retro-vignette"/></>;

  if(!authReady)return(<><style>{CSS}</style>{sceneBlock}<div className="loading">LOADING...</div></>);
  if(!user)return(<><style>{CSS}</style>{sceneBlock}<AuthScreen/></>);

  // ── LOCK IN active: take over the whole screen, nothing else renders ──
  if(lockEnd>Date.now()){
    return(<><style>{CSS}</style>{sceneBlock}<LockOverlay start={lockStart||lockEnd-1} end={lockEnd} motivation={motivation} onComplete={endLockIn} onGiveUp={recordGiveUp}/></>);
  }

  // ── HOME ──
  if(view==="home"){
    const today=dateStr(new Date());
    const doneToday=(allWeeks[currentWeekKey]?.[todayDow]||[]).filter(t=>t.done).length;
    const totalToday=(allWeeks[currentWeekKey]?.[todayDow]||[]).length;
    return(
      <>
        <style>{CSS}</style>{sceneBlock}{entryPopup}{settingsModal}
        <div className="controls-bar">
          <div style={{flex:1}}/>
          <button className="sound-toggle" onClick={toggleSound} title={soundOn?"Sound on":"Sound off"}>{soundOn?"\uD83D\uDD0A":"\uD83D\uDD07"}</button>
          <button className="acct-link-btn" onClick={()=>{SFX.click();setShowSettings(true);}} title="Account">ACCOUNT</button>
          <div className="theme-wrap">
            {Object.entries(THEMES).map(([key,t])=>(
              <div key={key} className={`theme-chip${themeKey===key?" active":""}`} onClick={()=>{SFX.theme();setThemeKey(key);}}>{t.icon}<span className="theme-tip">{t.name}</span></div>
            ))}
          </div>
          <button className="signout-btn" onClick={cleanSignOut}>SIGN OUT</button>
        </div>
        <div className="home">
          <div className="home-hero">
            <CyberLogo className="home-cyber"/>
            <div className="home-sub">{username?`WELCOME BACK, ${username.toUpperCase()}`:"CHOOSE YOUR MODE"}</div>
            <div className="home-streak">
              <span className={`streak-badge${streak===0?" cold":""}`}>
                <span className="flame">🔥</span>{streak===0?"NO STREAK — DO TODAY'S TASKS":`${streak} DAY STREAK`}
              </span>
            </div>
          </div>
          <div className="home-cards">
            <div className="home-card" onClick={()=>{SFX.click();setView("tasks");}}>
              <div className="home-card-icon">📋</div>
              <div className="home-card-body">
                <div className="home-card-title">TASKS</div>
                <div className="home-card-desc">View and manage your weekly routine</div>
                <div className="home-stat">TODAY: {doneToday}/{totalToday} DONE</div>
              </div>
              <div className="home-card-arrow">→</div>
            </div>
            <div className="home-card" onClick={()=>{SFX.click();setView("study");}}>
              <div className="home-card-icon">⏱️</div>
              <div className="home-card-body">
                <div className="home-card-title">STUDY</div>
                <div className="home-card-desc">Start the timer and focus. Track your hours.</div>
                <div className="home-stat">TODAY: {fmtDuration(studyLog[today]||0)}</div>
              </div>
              <div className="home-card-arrow">→</div>
            </div>
            <div className="home-card" onClick={()=>{SFX.click();setView("streak");}}>
              <div className="home-card-icon">🔥</div>
              <div className="home-card-body">
                <div className="home-card-title">STREAK</div>
                <div className="home-card-desc">See which days you kept your streak. Current &amp; best.</div>
                <div className="home-stat">{streak>0?`🔥 ${streak} DAY STREAK`:"NO STREAK YET"}</div>
              </div>
              <div className="home-card-arrow">→</div>
            </div>
            <div className="home-card" onClick={()=>{SFX.click();setView("lockin");}}>
              <div className="home-card-icon">🔒</div>
              <div className="home-card-body">
                <div className="home-card-title">LOCK IN</div>
                <div className="home-card-desc">Commit to a countdown. Screen locks &amp; stays awake — bail early only by donating {LOCKIN_FEE}tk.</div>
                <div className="home-stat">{lockInLog.length>0?`${lockInLog.length} GIVE-UP${lockInLog.length!==1?"S":""} LOGGED`:"NEVER GIVEN UP"}</div>
              </div>
              <div className="home-card-arrow">→</div>
            </div>
            <div className="home-card" onClick={()=>{SFX.click();setView("motivation");}}>
              <div className="home-card-icon">😈</div>
              <div className="home-card-body">
                <div className="home-card-title">MOTIVATION</div>
                <div className="home-card-desc">Name a rival and get roasted into studying every time you open the app.</div>
                <div className="home-stat">{motivation.name?`RIVAL: ${motivation.name.toUpperCase()}`:"NO RIVAL SET"}</div>
              </div>
              <div className="home-card-arrow">→</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── STUDY ──
  if(view==="study"){
    return(
      <>
        <style>{CSS}</style>{sceneBlock}{entryPopup}
        <div className="hdr">
          <div className="hdr-left">
            <button className="back-btn" onClick={()=>{SFX.tap();setView("home");}}>←</button>
            <div><div className="hdr-title">STUDY MODE</div><div className="hdr-sub">FOCUS TIMER</div></div>
          </div>
          <div className="hdr-right"><span className={`sync-badge${syncing?" syncing":""}`}>{syncing?"SYNCING...":"● SYNCED"}</span></div>
        </div>
        <StudyView studyLog={studyLog} onSave={saveStudy}/>
      </>
    );
  }

  // ── LOCK IN (setup) ──
  if(view==="lockin"){
    return(
      <>
        <style>{CSS}</style>{sceneBlock}{entryPopup}
        <div className="hdr">
          <div className="hdr-left">
            <button className="back-btn" onClick={()=>{SFX.tap();setView("home");}}>←</button>
            <div><div className="hdr-title">LOCK IN</div><div className="hdr-sub">COMMITMENT MODE</div></div>
          </div>
          <div className="hdr-right"><span className={`sync-badge${syncing?" syncing":""}`}>{syncing?"SYNCING...":"● SYNCED"}</span></div>
        </div>
        <LockSetupView onStart={startLockIn}/>
      </>
    );
  }

  // ── STREAK ──
  if(view==="streak"){
    return(
      <>
        <style>{CSS}</style>{sceneBlock}{entryPopup}{settingsModal}
        <div className="hdr">
          <div className="hdr-left">
            <button className="back-btn" onClick={()=>{SFX.tap();setView("home");}}>←</button>
            <div><div className="hdr-title">STREAK</div><div className="hdr-sub">YOUR PROGRESS</div></div>
          </div>
          <div className="hdr-right"><span className={`sync-badge${syncing?" syncing":""}`}>{syncing?"SYNCING...":"● SYNCED"}</span></div>
        </div>
        <div className="study-wrap fade-in"><StreakBoard tasksForDate={tasksForDate}/></div>
      </>
    );
  }

  // ── MOTIVATION ──
  if(view==="motivation"){
    return(
      <>
        <style>{CSS}</style>{sceneBlock}{entryPopup}
        <div className="hdr">
          <div className="hdr-left">
            <button className="back-btn" onClick={()=>{SFX.tap();setView("home");}}>←</button>
            <div><div className="hdr-title">MOTIVATION</div><div className="hdr-sub">RIVAL &amp; ROASTS</div></div>
          </div>
          <div className="hdr-right"><span className={`sync-badge${syncing?" syncing":""}`}>{syncing?"SYNCING...":"● SYNCED"}</span></div>
        </div>
        <MotivationView motivation={motivation} onSave={setMotivation}/>
      </>
    );
  }

  // ── TASKS ──
  return(
    <>
      <style>{CSS}</style>{sceneBlock}{entryPopup}{settingsModal}
      {showModal!==null&&<MultiDayModal defaultDow={showModal} onClose={()=>setShowModal(null)} onAdd={handleMultiAdd}/>}
      <div className="app">
        <div className="hdr">
          <div className="hdr-left">
            <button className="back-btn" onClick={()=>{SFX.tap();setView("home");}}>←</button>
            <div>
              <div className="hdr-title">TASKS</div>
              <div className="hdr-sub">WEEKLY ROUTINE</div>
              <div style={{marginTop:6}}><span className={`streak-badge${streak===0?" cold":""}`}><span className="flame">🔥</span>{streak===0?"NO STREAK":`${streak} DAY`}</span></div>
              <div className="hdr-user">{username?`@${username}`:user.email}</div>
            </div>
          </div>
          <div className="hdr-right">
            <span className={`sync-badge${syncing?" syncing":""}`}>{syncing?"SYNCING...":"● SYNCED"}</span>
            <button className="signout-btn" onClick={cleanSignOut}>SIGN OUT</button>
          </div>
        </div>

        <div className="controls-bar">
          <div style={{flex:1}}/>
          <button className="sound-toggle" onClick={toggleSound} title={soundOn?"Sound on":"Sound off"}>{soundOn?"\uD83D\uDD0A":"\uD83D\uDD07"}</button>
          <button className="acct-link-btn" onClick={()=>{SFX.click();setShowSettings(true);}} title="Account">ACCOUNT</button>
          <div className="theme-wrap">
            {Object.entries(THEMES).map(([key,t])=>(
              <div key={key} className={`theme-chip${themeKey===key?" active":""}`} onClick={()=>{SFX.theme();setThemeKey(key);}}>{t.icon}<span className="theme-tip">{t.name}</span></div>
            ))}
          </div>
        </div>

        <div className="week-nav">
          <button className="week-step" onClick={()=>stepWeek(-1)} title="Previous week">◀</button>
          <div className="week-tabs">
            {weekKeys.map(key=>{const missed=weekHasMissed(key);const isCur=key===currentWeekKey;const isAct=key===activeWeek;
              return(<button key={key} ref={isAct?activeTabRef:null} className={`week-tab${isAct?" active":""}${missed?" has-missed":""}`} onClick={()=>goToWeek(key)}>{isCur?"THIS WEEK":weekLabel(key)}{missed?" ⚠":""}</button>);})}
          </div>
          <button className="week-step" onClick={()=>stepWeek(1)} title="Next week">▶</button>
          {activeWeek!==currentWeekKey&&<button className="week-step today-jump" onClick={()=>goToWeek(currentWeekKey)} title="Jump to this week">⌂</button>}
        </div>
        <div className="week-nav-border"/>
        <div className="week-label">{weekLabel(activeWeek)}<span className={`week-label-badge ${isCurrentWeek?"badge-current":isPast(activeWeek)?"badge-past":"badge-future"}`}>{isCurrentWeek?"CURRENT":isPast(activeWeek)?"PAST — READ ONLY":"UPCOMING"}</span></div>

        <div className="stack fade-in" key={activeWeek}>
          {[0,1,2,3,4,5,6].map(dow=>{
            const ts=activeTasks(dow);const done=ts.filter(t=>t.done).length;const pct=ts.length?Math.round((done/ts.length)*100):0;
            const hasMissed=dayHasMissed(dow,activeWeek);const allDone=ts.length>0&&done===ts.length;
            const isOpen=openDay===dow;const isToday=dow===todayDow&&isCurrentWeek;const isEdit=editDay===dow&&!past;
            return(
              <div key={dow} ref={isToday?todayRowRef:null} className={`day-row${isOpen?" is-open":""}${isToday?" is-today":""}${hasMissed?" is-missed":""}${allDone?" all-done":""}`}>
                <div className="day-header" onClick={()=>setOpenDay(isOpen?null:dow)}>
                  <div style={{display:"flex",alignItems:"center",gap:14,flex:1,minWidth:0}}>
                    <div className="day-num-box"><span className="day-abbr">{DAYS_SHORT[dow]}</span><span className="day-num-val">{dateOfDow(dow)}</span></div>
                    <div className="day-info">
                      <div className="day-name">{DAYS[dow]}</div>
                      <div className="day-count">
                        {ts.length===0?<span>no tasks</span>:<span>{done} of {ts.length} done</span>}
                        {hasMissed&&<span className="missed-tag">MISSED</span>}
                        {ts.length>0&&<span className="pip-row">{ts.map(t=><span key={t.id} className={`pip${t.done?" done":hasMissed&&!t.done?" missed":""}`}/>)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="day-right">{ts.length>0&&<span className={`day-pct${pct===100?" done-all":hasMissed?" missed":""}`}>{pct}%</span>}<span className="chevron">▾</span></div>
                </div>
                <div className={`day-body${isOpen?" open":""}`}>
                  <div className="day-body-inner">
                    <div className="day-edit-bar">
                      {!past?(<button className={`edit-toggle${isEdit?" active":""}`} onClick={e=>{e.stopPropagation();if(isEdit){updateDay(dow,ts=>ts.filter(t=>t.label.trim()!==""));}setEditDay(isEdit?null:dow);}}>{isEdit?"✕ DONE":"✎ EDIT"}</button>):(<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,color:"rgba(255,64,96,0.5)"}}>{hasMissed?"⚠ TASKS MISSED":"READ ONLY"}</span>)}
                    </div>
                    {ts.length>0&&<div className="mini-prog"><div className={`mini-prog-fill${hasMissed?" missed":""}`} style={{width:`${pct}%`}}/></div>}
                    <div className="task-list drop-in">
                      {ts.length===0&&<div className="empty"><div className="empty-icon">◻</div><div className="empty-txt">{past?"NO TASKS THIS DAY":"NO TASKS YET"}</div></div>}
                      {ts.map(task=>{const taskMissed=past&&!task.done;return(
                        <div key={task.id} className={`task-item${task.done?" done":""}${taskMissed?" task-missed":""}`}>
                          {!isEdit?(<>
                            <button className={`task-check${popId===task.id?" check-pop":""}`} onClick={()=>toggle(dow,task.id)} disabled={past}>{task.done?"✓":taskMissed?"✕":""}</button>
                            <span className="task-label">{task.label}</span>
                            <div className="task-right"><span className={`type-pill ${taskMissed?"missed-pill":task.repeat?"weekly":"once"}`}>{taskMissed?"MISSED":task.repeat?"WEEKLY":"ONCE"}</span></div>
                          </>):(<>
                            <input className="task-edit-input" value={task.label} onChange={e=>editLabel(dow,task.id,e.target.value)}/>
                            <div className="task-right"><button className={`type-pill ${task.repeat?"weekly":"once"}`} onClick={()=>toggleRepeat(dow,task.id)}>{task.repeat?"WEEKLY":"ONCE"}</button><button className="del-btn" onClick={()=>del(dow,task.id)}>✕</button></div>
                          </>)}
                        </div>
                      );})}
                    </div>
                    {!past?(
                      <div className="add-bar">
                        <input className="add-input" placeholder="Add a task…" value={newLabels[dow]||""} onChange={e=>setNewLabels(p=>({...p,[dow]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTask(dow)}/>
                        <div style={{display:"flex",gap:6,flexShrink:0}}>
                          <div className="type-toggle-bar">
                            <button className={`type-opt${(newTypes[dow]||"weekly")==="weekly"?" sel-wk":""}`} onClick={()=>setNewTypes(p=>({...p,[dow]:"weekly"}))}>WK</button>
                            <button className={`type-opt${(newTypes[dow]||"weekly")==="once"?" sel-1x":""}`} onClick={()=>setNewTypes(p=>({...p,[dow]:"once"}))}>1×</button>
                          </div>
                          <button className="add-multiday-btn" onClick={()=>setShowModal(dow)}>+ MULTI</button>
                          <button className="add-btn" onClick={()=>addTask(dow)}>+</button>
                        </div>
                      </div>
                    ):(<div className="past-note">{hasMissed?"⚠ INCOMPLETE TASKS FROM THIS WEEK":"✓ ARCHIVED"}</div>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}