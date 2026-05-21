import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

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

function getWeekKey(date){
  const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay());
  return `${d.getFullYear()}-W${String(Math.ceil((((d-new Date(d.getFullYear(),0,1))/86400000)+1)/7)).padStart(2,"0")}`;
}
function getSundayForKey(key){
  const[yr,wStr]=key.split("-W");const year=parseInt(yr);const week=parseInt(wStr);
  const jan1=new Date(year,0,1);const d=new Date(jan1);
  d.setDate(jan1.getDate()+(week-1)*7-jan1.getDay());return d;
}
function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d;}
function formatShortDate(date){return date.toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function weekLabel(key){const sun=getSundayForKey(key);const sat=addDays(sun,6);return `${formatShortDate(sun)} – ${formatShortDate(sat)}`;}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#06080f;--bg1:#0b0f1c;--bg2:#0f1525;--bg3:#141b2e;
  --cyan:#00f0ff;--pink:#ff2d78;--green:#39ff6e;--yellow:#ffe138;--red:#ff4444;
  --text:#ddeeff;--dim:rgba(221,238,255,0.35);--dimmer:rgba(221,238,255,0.12);
  --border:rgba(0,240,255,0.10);--bord2:rgba(0,240,255,0.22);
}
html,body{background:var(--bg);font-family:'Syne',sans-serif;color:var(--text);}
.app{min-height:100vh;max-width:520px;margin:0 auto;padding-bottom:80px;}
.app::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px);}

.auth-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;}
.auth-logo{font-size:26px;font-weight:800;letter-spacing:3px;color:var(--cyan);text-shadow:0 0 24px rgba(0,240,255,0.45);margin-bottom:6px;}
.auth-sub{font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:4px;margin-bottom:36px;}
.auth-card{width:100%;max-width:380px;background:var(--bg1);border:1px solid var(--bord2);border-radius:16px;padding:28px 24px;box-shadow:0 0 40px rgba(0,240,255,0.06);}
.auth-tabs{display:flex;margin-bottom:24px;background:var(--bg2);border-radius:9px;overflow:hidden;border:1px solid var(--border);}
.auth-tab{flex:1;padding:10px;background:none;border:none;cursor:pointer;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);transition:all 0.15s;}
.auth-tab.active{background:rgba(0,240,255,0.1);color:var(--cyan);}
.auth-field{margin-bottom:14px;}
.auth-label{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--dim);margin-bottom:6px;display:block;}
.auth-input{width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:12px 14px;font-family:'Syne',sans-serif;font-size:15px;font-weight:600;color:var(--text);outline:none;transition:border-color 0.15s;}
.auth-input:focus{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(0,240,255,0.07);}
.auth-btn{width:100%;background:var(--cyan);color:var(--bg);border:none;border-radius:9px;padding:13px;font-family:'Syne',sans-serif;font-size:15px;font-weight:800;cursor:pointer;margin-top:6px;letter-spacing:1px;transition:all 0.15s;box-shadow:0 0 16px rgba(0,240,255,0.25);}
.auth-btn:hover{background:#20f5ff;box-shadow:0 0 24px rgba(0,240,255,0.4);}
.auth-btn:disabled{opacity:0.5;cursor:not-allowed;}
.auth-error{font-family:'DM Mono',monospace;font-size:10px;color:var(--red);letter-spacing:1px;margin-top:10px;text-align:center;}

.hdr{padding:24px 22px 14px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.hdr-title{font-size:24px;font-weight:800;letter-spacing:3px;color:var(--cyan);text-shadow:0 0 24px rgba(0,240,255,0.45);}
.hdr-sub{font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);letter-spacing:3px;margin-top:3px;}
.hdr-user{font-family:'DM Mono',monospace;font-size:9px;color:var(--dim);letter-spacing:1px;margin-top:4px;}
.signout-btn{background:none;border:1px solid rgba(255,68,68,0.3);color:rgba(255,68,68,0.7);border-radius:7px;padding:6px 12px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;cursor:pointer;transition:all 0.15s;white-space:nowrap;flex-shrink:0;margin-top:4px;}
.signout-btn:hover{background:rgba(255,68,68,0.1);color:var(--red);}
.sync-indicator{font-family:'DM Mono',monospace;font-size:9px;color:var(--green);letter-spacing:2px;padding:3px 10px;border-radius:5px;border:1px solid rgba(57,255,110,0.2);background:rgba(57,255,110,0.05);}
.sync-indicator.syncing{color:var(--yellow);border-color:rgba(255,225,56,0.2);background:rgba(255,225,56,0.05);}

.week-nav{display:flex;align-items:center;gap:0;padding:14px 16px 0;overflow-x:auto;scrollbar-width:none;}
.week-nav::-webkit-scrollbar{display:none;}
.week-tab{flex-shrink:0;padding:9px 16px;background:none;border:none;cursor:pointer;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);border-bottom:2px solid transparent;transition:all 0.15s;white-space:nowrap;}
.week-tab:hover{color:var(--text);}
.week-tab.active{color:var(--cyan);border-bottom-color:var(--cyan);}
.week-tab.has-missed{color:var(--red);}
.week-tab.has-missed.active{color:var(--red);border-bottom-color:var(--red);}
.week-nav-border{height:1px;background:var(--border);margin:0 16px;}
.week-label{padding:10px 18px 4px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);display:flex;align-items:center;gap:10px;}
.week-label-badge{padding:2px 8px;border-radius:4px;font-size:9px;letter-spacing:1px;font-family:'DM Mono',monospace;}
.badge-current{background:rgba(0,240,255,0.1);color:var(--cyan);border:1px solid rgba(0,240,255,0.25);}
.badge-past{background:rgba(255,68,68,0.08);color:var(--red);border:1px solid rgba(255,68,68,0.2);}

.stack{padding:10px 16px 0;display:flex;flex-direction:column;gap:8px;}
.day-row{background:var(--bg1);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:border-color 0.2s;}
.day-row.is-open{border-color:var(--bord2);box-shadow:0 0 0 1px rgba(0,240,255,0.07),0 8px 32px rgba(0,0,0,0.5);}
.day-row.is-today{border-color:rgba(0,240,255,0.28);}
.day-row.is-missed{border-color:rgba(255,68,68,0.2);}
.day-row.is-missed.is-open{border-color:rgba(255,68,68,0.4);}
.day-row.all-done{border-color:rgba(57,255,110,0.2);}
.day-header{display:flex;align-items:center;padding:16px 18px;cursor:pointer;gap:14px;user-select:none;}
.day-header:hover .day-name{color:var(--cyan);}
.day-row.is-missed .day-header:hover .day-name{color:var(--red);}
.day-left{display:flex;align-items:center;gap:14px;flex:1;min-width:0;}
.day-num-box{width:48px;height:48px;flex-shrink:0;border-radius:10px;background:var(--bg2);border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;transition:all 0.2s;}
.is-today .day-num-box{background:rgba(0,240,255,0.08);border-color:var(--cyan);box-shadow:0 0 14px rgba(0,240,255,0.2);}
.is-open .day-num-box{background:rgba(0,240,255,0.06);border-color:var(--bord2);}
.is-missed .day-num-box{background:rgba(255,68,68,0.06);border-color:rgba(255,68,68,0.3);}
.all-done .day-num-box{background:rgba(57,255,110,0.05);border-color:rgba(57,255,110,0.25);}
.day-abbr{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--dim);}
.is-today .day-abbr{color:var(--cyan);}
.is-missed .day-abbr{color:var(--red);}
.all-done .day-abbr{color:var(--green);}
.day-num-val{font-size:20px;font-weight:800;color:var(--dim);line-height:1;}
.is-today .day-num-val{color:var(--cyan);text-shadow:0 0 10px rgba(0,240,255,0.5);}
.is-missed .day-num-val{color:var(--red);}
.all-done .day-num-val{color:var(--green);}
.day-info{flex:1;min-width:0;}
.day-name{font-size:18px;font-weight:700;letter-spacing:0.5px;color:var(--text);transition:color 0.15s;}
.is-open .day-name{color:var(--cyan);}
.is-missed .day-name{color:rgba(255,68,68,0.9);}
.is-missed.is-open .day-name{color:var(--red);}
.all-done .day-name{color:var(--green);}
.day-count{font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-top:3px;letter-spacing:1px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.missed-tag{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;color:var(--red);padding:1px 6px;border-radius:3px;border:1px solid rgba(255,68,68,0.3);background:rgba(255,68,68,0.07);}
.day-right{display:flex;align-items:center;gap:10px;flex-shrink:0;}
.day-pct{font-family:'DM Mono',monospace;font-size:12px;font-weight:500;color:var(--cyan);width:36px;text-align:right;}
.day-pct.done-all{color:var(--green);text-shadow:0 0 8px rgba(57,255,110,0.5);}
.day-pct.missed{color:var(--red);}
.chevron{font-size:12px;color:var(--dim);transition:transform 0.25s cubic-bezier(.23,1,.32,1);width:16px;text-align:center;}
.is-open .chevron{transform:rotate(180deg);color:var(--cyan);}
.is-missed.is-open .chevron{color:var(--red);}
.pip-row{display:flex;gap:3px;}
.pip{width:5px;height:5px;border-radius:50%;background:var(--dimmer);transition:all 0.2s;}
.pip.done{background:var(--green);box-shadow:0 0 5px rgba(57,255,110,0.6);}
.pip.missed{background:var(--red);box-shadow:0 0 5px rgba(255,68,68,0.5);}

.day-body{max-height:0;overflow:hidden;transition:max-height 0.35s cubic-bezier(.23,1,.32,1);}
.day-body.open{max-height:1600px;}
.day-body-inner{padding:0 14px 14px;border-top:1px solid var(--border);}
.mini-prog{height:2px;background:var(--border);border-radius:1px;margin:12px 0 14px;overflow:hidden;}
.mini-prog-fill{height:100%;border-radius:1px;background:linear-gradient(90deg,var(--cyan),var(--pink));box-shadow:0 0 6px rgba(0,240,255,0.5);transition:width 0.4s cubic-bezier(.23,1,.32,1);}
.mini-prog-fill.missed{background:linear-gradient(90deg,var(--red),var(--pink));}

.task-list{display:flex;flex-direction:column;gap:7px;}
.task-item{display:flex;align-items:center;gap:12px;padding:13px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;transition:all 0.15s;position:relative;overflow:hidden;}
.task-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--cyan);opacity:0;transition:opacity 0.15s;box-shadow:0 0 8px var(--cyan);}
.task-item.done{background:rgba(57,255,110,0.03);border-color:rgba(57,255,110,0.15);}
.task-item.done::before{background:var(--green);opacity:1;}
.task-item.task-missed{background:rgba(255,68,68,0.04);border-color:rgba(255,68,68,0.2);}
.task-item.task-missed::before{background:var(--red);opacity:1;}
.task-check{width:24px;height:24px;flex-shrink:0;border:1.5px solid var(--bord2);border-radius:6px;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;color:transparent;transition:all 0.15s;}
.task-check:hover{border-color:var(--cyan);background:rgba(0,240,255,0.06);}
.task-item.done .task-check{background:var(--green);border-color:var(--green);color:var(--bg);box-shadow:0 0 10px rgba(57,255,110,0.45);}
.task-item.task-missed .task-check{border-color:rgba(255,68,68,0.4);cursor:default;}
.task-label{flex:1;min-width:0;font-size:16px;font-weight:600;color:var(--text);line-height:1.3;transition:all 0.15s;}
.task-item.done .task-label{color:var(--dim);text-decoration:line-through;opacity:0.45;}
.task-item.task-missed .task-label{color:rgba(255,68,68,0.75);}
.task-edit-input{flex:1;background:var(--bg3);border:1px solid var(--bord2);border-radius:6px;padding:5px 10px;font-family:'Syne',sans-serif;font-size:16px;font-weight:600;color:var(--text);outline:none;}
.task-edit-input:focus{border-color:var(--cyan);}
.task-right{display:flex;align-items:center;gap:6px;flex-shrink:0;}
.type-pill{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;padding:2px 7px;border-radius:4px;border:1px solid;cursor:pointer;background:none;transition:all 0.15s;white-space:nowrap;}
.type-pill.weekly{color:var(--cyan);border-color:rgba(0,240,255,0.3);}
.type-pill.weekly:hover{background:rgba(0,240,255,0.1);}
.type-pill.once{color:var(--yellow);border-color:rgba(255,225,56,0.3);}
.type-pill.once:hover{background:rgba(255,225,56,0.08);}
.type-pill.missed-pill{color:var(--red);border-color:rgba(255,68,68,0.3);cursor:default;}
.del-btn{background:none;border:none;cursor:pointer;width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:14px;transition:all 0.15s;}
.del-btn:hover{color:var(--pink);background:rgba(255,45,120,0.1);}
.day-edit-bar{display:flex;justify-content:flex-end;margin-bottom:10px;padding-top:10px;}
.edit-toggle{background:none;border:none;cursor:pointer;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);padding:5px 10px;border-radius:7px;transition:all 0.15s;}
.edit-toggle:hover{color:var(--cyan);background:rgba(0,240,255,0.06);}
.edit-toggle.active{color:var(--pink);}

.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);}
.modal{background:var(--bg1);border:1px solid var(--bord2);border-radius:16px;padding:24px;width:100%;max-width:400px;box-shadow:0 0 60px rgba(0,240,255,0.08);}
.modal-title{font-size:16px;font-weight:800;letter-spacing:1px;color:var(--cyan);margin-bottom:18px;}
.modal-field{margin-bottom:16px;}
.modal-label{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--dim);margin-bottom:8px;display:block;}
.modal-input{width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:11px 14px;font-family:'Syne',sans-serif;font-size:15px;font-weight:600;color:var(--text);outline:none;transition:border-color 0.15s;}
.modal-input:focus{border-color:var(--cyan);}
.day-picker{display:flex;gap:7px;flex-wrap:wrap;}
.day-chip{padding:8px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;color:var(--dim);cursor:pointer;transition:all 0.15s;user-select:none;}
.day-chip:hover{border-color:var(--bord2);color:var(--text);}
.day-chip.selected{background:rgba(0,240,255,0.1);border-color:var(--cyan);color:var(--cyan);box-shadow:0 0 8px rgba(0,240,255,0.15);}
.type-row{display:flex;gap:8px;}
.type-card{flex:1;padding:10px;background:var(--bg2);border:1px solid var(--border);border-radius:9px;cursor:pointer;text-align:center;transition:all 0.15s;}
.type-card:hover{border-color:var(--bord2);}
.type-card.sel-weekly{background:rgba(0,240,255,0.07);border-color:var(--cyan);}
.type-card.sel-once{background:rgba(255,225,56,0.06);border-color:var(--yellow);}
.type-card-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1.5px;}
.type-card.sel-weekly .type-card-label{color:var(--cyan);}
.type-card.sel-once .type-card-label{color:var(--yellow);}
.type-card-desc{font-size:10px;color:var(--dimmer);margin-top:3px;}
.modal-actions{display:flex;gap:8px;margin-top:20px;}
.modal-cancel{flex:1;background:none;border:1px solid var(--border);border-radius:9px;padding:11px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);cursor:pointer;transition:all 0.15s;}
.modal-cancel:hover{border-color:var(--pink);color:var(--pink);}
.modal-confirm{flex:2;background:var(--cyan);color:var(--bg);border:none;border-radius:9px;padding:11px;font-family:'Syne',sans-serif;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:1px;transition:all 0.15s;}
.modal-confirm:hover{background:#20f5ff;box-shadow:0 0 16px rgba(0,240,255,0.35);}
.modal-confirm:disabled{opacity:0.4;cursor:not-allowed;}
.selected-days-preview{font-family:'DM Mono',monospace;font-size:9px;color:var(--cyan);letter-spacing:1px;margin-top:6px;min-height:14px;}

.add-bar{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}
.add-input{flex:1;min-width:120px;background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:12px 14px;font-family:'Syne',sans-serif;font-size:15px;font-weight:600;color:var(--text);outline:none;transition:border-color 0.15s;}
.add-input::placeholder{color:var(--dimmer);}
.add-input:focus{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(0,240,255,0.07);}
.add-multiday-btn{background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:0 14px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--cyan);cursor:pointer;transition:all 0.15s;white-space:nowrap;flex-shrink:0;}
.add-multiday-btn:hover{border-color:var(--cyan);background:rgba(0,240,255,0.07);}
.add-btn{background:var(--cyan);color:var(--bg);border:none;border-radius:9px;padding:0 18px;font-family:'Syne',sans-serif;font-size:18px;font-weight:800;cursor:pointer;flex-shrink:0;transition:all 0.15s;box-shadow:0 0 14px rgba(0,240,255,0.25);}
.add-btn:hover{background:#20f5ff;box-shadow:0 0 20px rgba(0,240,255,0.45);}
.add-btn:active{transform:scale(0.96);}

.empty{text-align:center;padding:28px 0 16px;}
.empty-icon{font-size:26px;opacity:0.2;margin-bottom:8px;}
.empty-txt{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--dimmer);}
.past-note{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,68,68,0.6);letter-spacing:1.5px;text-align:center;padding:8px 0 4px;}

@keyframes dropIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
.drop-in{animation:dropIn 0.22s ease both;}
@keyframes checkPop{0%{transform:scale(1);}40%{transform:scale(1.3);}100%{transform:scale(1);}}
.check-pop{animation:checkPop 0.18s ease;}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
.fade-in{animation:fadeIn 0.3s ease both;}
`;

function AuthScreen(){
  const[tab,setTab]=useState("login");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[error,setError]=useState("");
  const[loading,setLoading]=useState(false);

  async function handle(){
    setError("");setLoading(true);
    try{
      if(tab==="login") await signInWithEmailAndPassword(auth,email,password);
      else await createUserWithEmailAndPassword(auth,email,password);
    }catch(e){
      setError(e.message.replace("Firebase: ","").replace(/\(auth.*\)\.?/,"").trim());
    }
    setLoading(false);
  }

  return(
    <div className="auth-screen fade-in">
      <div className="auth-logo">STUDY STACK</div>
      <div className="auth-sub">WEEKLY ROUTINE TRACKER</div>
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={`auth-tab${tab==="login"?" active":""}`} onClick={()=>{setTab("login");setError("");}}>LOG IN</button>
          <button className={`auth-tab${tab==="signup"?" active":""}`} onClick={()=>{setTab("signup");setError("");}}>SIGN UP</button>
        </div>
        <div className="auth-field">
          <label className="auth-label">EMAIL</label>
          <input className="auth-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
        </div>
        <div className="auth-field">
          <label className="auth-label">PASSWORD</label>
          <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
        </div>
        {error&&<div className="auth-error">{error}</div>}
        <button className="auth-btn" onClick={handle} disabled={loading||!email||!password}>
          {loading?"...":tab==="login"?"LOG IN":"CREATE ACCOUNT"}
        </button>
      </div>
    </div>
  );
}

function MultiDayModal({defaultDow,onClose,onAdd}){
  const[label,setLabel]=useState("");
  const[selectedDays,setSelectedDays]=useState([defaultDow]);
  const[type,setType]=useState("weekly");

  function toggleDay(d){setSelectedDays(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]);}

  function confirm(){
    if(!label.trim()||selectedDays.length===0) return;
    onAdd(label.trim(),selectedDays,type==="weekly");
    onClose();
  }

  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal fade-in">
        <div className="modal-title">ADD TO MULTIPLE DAYS</div>
        <div className="modal-field">
          <label className="modal-label">TASK NAME</label>
          <input className="modal-input" placeholder="e.g. Linear Algebra" value={label} onChange={e=>setLabel(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&confirm()}/>
        </div>
        <div className="modal-field">
          <label className="modal-label">SELECT DAYS</label>
          <div className="day-picker">
            {DAYS_SHORT.map((d,i)=>(
              <div key={i} className={`day-chip${selectedDays.includes(i)?" selected":""}`} onClick={()=>toggleDay(i)}>{d}</div>
            ))}
          </div>
          <div className="selected-days-preview">
            {selectedDays.length===0?"no days selected":selectedDays.sort().map(d=>DAYS_SHORT[d]).join(" · ")}
          </div>
        </div>
        <div className="modal-field">
          <label className="modal-label">TYPE</label>
          <div className="type-row">
            <div className={`type-card${type==="weekly"?" sel-weekly":""}`} onClick={()=>setType("weekly")}>
              <div className="type-card-label">WEEKLY</div>
              <div className="type-card-desc">Repeats every week</div>
            </div>
            <div className={`type-card${type==="once"?" sel-once":""}`} onClick={()=>setType("once")}>
              <div className="type-card-label">ONE-TIME</div>
              <div className="type-card-desc">This week only</div>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>CANCEL</button>
          <button className="modal-confirm" onClick={confirm} disabled={!label.trim()||selectedDays.length===0}>
            ADD TO {selectedDays.length} DAY{selectedDays.length!==1?"S":""}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const now=new Date();
  const todayDow=now.getDay();
  const currentWeekKey=getWeekKey(now);

  const[user,setUser]=useState(null);
  const[authReady,setAuthReady]=useState(false);
  const[allWeeks,setAllWeeks]=useState({[currentWeekKey]:DEFAULT_TASKS});
  const[activeWeek,setActiveWeek]=useState(currentWeekKey);
  const[openDay,setOpenDay]=useState(todayDow);
  const[editDay,setEditDay]=useState(null);
  const[newLabels,setNewLabels]=useState({});
  const[newTypes,setNewTypes]=useState({});
  const[popId,setPopId]=useState(null);
  const[showModal,setShowModal]=useState(null);
  const[syncing,setSyncing]=useState(false);
  const unsubRef=useRef(null);
  const saveRef=useRef(null);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,u=>{setUser(u);setAuthReady(true);});
    return unsub;
  },[]);

  useEffect(()=>{
    if(unsubRef.current){unsubRef.current();unsubRef.current=null;}
    if(!user) return;
    setSyncing(true);
    const ref=doc(db,"users",user.uid,"data","weeks");
    unsubRef.current=onSnapshot(ref,snap=>{
      if(snap.exists()){
        const data=snap.data();
        if(data.allWeeks) setAllWeeks(data.allWeeks);
      }else{
        setDoc(ref,{allWeeks:{[currentWeekKey]:DEFAULT_TASKS}});
      }
      setSyncing(false);
    });
    return()=>{if(unsubRef.current)unsubRef.current();};
  },[user]);

  useEffect(()=>{
    if(!user) return;
    clearTimeout(saveRef.current);
    setSyncing(true);
    saveRef.current=setTimeout(async()=>{
      try{ await setDoc(doc(db,"users",user.uid,"data","weeks"),{allWeeks}); }catch(e){console.error(e);}
      setSyncing(false);
    },800);
  },[allWeeks,user]);

  useEffect(()=>{
    setAllWeeks(prev=>{
      if(prev[currentWeekKey]) return prev;
      return{...prev,[currentWeekKey]:DEFAULT_TASKS};
    });
  },[]);

  const weekKeys=Object.keys(allWeeks).sort((a,b)=>b.localeCompare(a));
  const isPast=key=>key<currentWeekKey;
  const isCurrentWeek=activeWeek===currentWeekKey;
  const past=isPast(activeWeek);

  function dateOfDow(dow){const sun=getSundayForKey(activeWeek);return addDays(sun,dow).getDate();}
  function dayHasMissed(dow,wk){if(!isPast(wk))return false;const ts=(allWeeks[wk]||{})[dow]||[];return ts.length>0&&ts.some(t=>!t.done);}
  function weekHasMissed(key){if(!isPast(key))return false;for(let d=0;d<7;d++)if(dayHasMissed(d,key))return true;return false;}
  function activeTasks(dow){return(allWeeks[activeWeek]||{})[dow]||[];}

  function updateDay(dow,fn){
    setAllWeeks(prev=>({...prev,[activeWeek]:{...(prev[activeWeek]||{}),[dow]:fn((prev[activeWeek]||{})[dow]||[])}}));
  }

  function toggle(dow,id){
    if(past) return;
    setPopId(id);setTimeout(()=>setPopId(null),180);
    updateDay(dow,ts=>ts.map(t=>t.id===id?{...t,done:!t.done}:t));
  }
  function del(dow,id){if(past)return;updateDay(dow,ts=>ts.filter(t=>t.id!==id));}
  function editLabel(dow,id,val){if(past)return;updateDay(dow,ts=>ts.map(t=>t.id===id?{...t,label:val}:t));}
  function toggleRepeat(dow,id){if(past)return;updateDay(dow,ts=>ts.map(t=>t.id===id?{...t,repeat:!t.repeat}:t));}

  function addTask(dow){
    if(past) return;
    const label=(newLabels[dow]||"").trim();
    if(!label) return;
    const type=newTypes[dow]||"weekly";
    updateDay(dow,ts=>[...ts,{id:uid(),label,repeat:type==="weekly",done:false}]);
    setNewLabels(p=>({...p,[dow]:""}));
  }

  function handleMultiAdd(label,days,repeat){
    days.forEach(dow=>updateDay(dow,ts=>[...ts,{id:uid(),label,repeat,done:false}]));
  }

  if(!authReady) return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:3,color:"rgba(0,240,255,0.5)"}}>
      LOADING...
    </div>
  );
  if(!user) return <><style>{CSS}</style><AuthScreen/></>;

  return(
    <>
      <style>{CSS}</style>
      {showModal!==null&&(
        <MultiDayModal defaultDow={showModal} onClose={()=>setShowModal(null)} onAdd={handleMultiAdd}/>
      )}
      <div className="app">
        <div className="hdr">
          <div className="hdr-left">
            <div className="hdr-title">STUDY STACK</div>
            <div className="hdr-sub">WEEKLY ROUTINE TRACKER</div>
            <div className="hdr-user">{user.email}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            <span className={`sync-indicator${syncing?" syncing":""}`}>{syncing?"SYNCING...":"● SYNCED"}</span>
            <button className="signout-btn" onClick={()=>signOut(auth)}>SIGN OUT</button>
          </div>
        </div>

        <div className="week-nav">
          {weekKeys.map(key=>{
            const missed=weekHasMissed(key);
            const isCur=key===currentWeekKey;
            const isAct=key===activeWeek;
            return(
              <button key={key} className={`week-tab${isAct?" active":""}${missed?" has-missed":""}`}
                onClick={()=>{setActiveWeek(key);setOpenDay(isCur?todayDow:null);setEditDay(null);}}>
                {isCur?"THIS WEEK":weekLabel(key)}{missed?" ⚠":""}
              </button>
            );
          })}
        </div>
        <div className="week-nav-border"/>
        <div className="week-label">
          {weekLabel(activeWeek)}
          <span className={`week-label-badge ${isCurrentWeek?"badge-current":"badge-past"}`}>
            {isCurrentWeek?"CURRENT":"PAST — READ ONLY"}
          </span>
        </div>

        <div className="stack">
          {[0,1,2,3,4,5,6].map(dow=>{
            const ts=activeTasks(dow);
            const done=ts.filter(t=>t.done).length;
            const pct=ts.length?Math.round((done/ts.length)*100):0;
            const hasMissed=dayHasMissed(dow,activeWeek);
            const allDone=ts.length>0&&done===ts.length;
            const isOpen=openDay===dow;
            const isToday=dow===todayDow&&isCurrentWeek;
            const isEdit=editDay===dow&&!past;

            return(
              <div key={dow} className={`day-row${isOpen?" is-open":""}${isToday?" is-today":""}${hasMissed?" is-missed":""}${allDone?" all-done":""}`}>
                <div className="day-header" onClick={()=>setOpenDay(isOpen?null:dow)}>
                  <div className="day-left">
                    <div className="day-num-box">
                      <span className="day-abbr">{DAYS_SHORT[dow]}</span>
                      <span className="day-num-val">{dateOfDow(dow)}</span>
                    </div>
                    <div className="day-info">
                      <div className="day-name">{DAYS[dow]}</div>
                      <div className="day-count">
                        {ts.length===0?<span>no tasks</span>:<span>{done} of {ts.length} done</span>}
                        {hasMissed&&<span className="missed-tag">MISSED</span>}
                        {ts.length>0&&<span className="pip-row">{ts.map(t=><span key={t.id} className={`pip${t.done?" done":hasMissed&&!t.done?" missed":""}`}/>)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="day-right">
                    {ts.length>0&&<span className={`day-pct${pct===100?" done-all":hasMissed?" missed":""}`}>{pct}%</span>}
                    <span className="chevron">▾</span>
                  </div>
                </div>

                <div className={`day-body${isOpen?" open":""}`}>
                  <div className="day-body-inner">
                    <div className="day-edit-bar">
                      {!past?(
                        <button className={`edit-toggle${isEdit?" active":""}`}
                          onClick={e=>{e.stopPropagation();setEditDay(isEdit?null:dow);}}>
                          {isEdit?"✕ DONE":"✎ EDIT"}
                        </button>
                      ):(
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"rgba(255,68,68,0.5)"}}>
                          {hasMissed?"⚠ TASKS MISSED":"READ ONLY"}
                        </span>
                      )}
                    </div>

                    {ts.length>0&&<div className="mini-prog"><div className={`mini-prog-fill${hasMissed?" missed":""}`} style={{width:`${pct}%`}}/></div>}

                    <div className="task-list drop-in">
                      {ts.length===0&&<div className="empty"><div className="empty-icon">◻</div><div className="empty-txt">{past?"NO TASKS THIS DAY":"NO TASKS YET"}</div></div>}
                      {ts.map(task=>{
                        const taskMissed=past&&!task.done;
                        return(
                          <div key={task.id} className={`task-item${task.done?" done":""}${taskMissed?" task-missed":""}`}>
                            {!isEdit?(
                              <>
                                <button className={`task-check${popId===task.id?" check-pop":""}${past?" readonly":""}`} onClick={()=>toggle(dow,task.id)} disabled={past}>
                                  {task.done?"✓":taskMissed?"✕":""}
                                </button>
                                <span className="task-label">{task.label}</span>
                                <div className="task-right">
                                  <span className={`type-pill ${taskMissed?"missed-pill":task.repeat?"weekly":"once"}`}>
                                    {taskMissed?"MISSED":task.repeat?"WEEKLY":"ONCE"}
                                  </span>
                                </div>
                              </>
                            ):(
                              <>
                                <input className="task-edit-input" value={task.label} onChange={e=>editLabel(dow,task.id,e.target.value)}/>
                                <div className="task-right">
                                  <button className={`type-pill ${task.repeat?"weekly":"once"}`} onClick={()=>toggleRepeat(dow,task.id)}>
                                    {task.repeat?"WEEKLY":"ONCE"}
                                  </button>
                                  <button className="del-btn" onClick={()=>del(dow,task.id)}>✕</button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!past?(
                      <div className="add-bar">
                        <input className="add-input" placeholder="Add a task…" value={newLabels[dow]||""} onChange={e=>setNewLabels(p=>({...p,[dow]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTask(dow)}/>
                        <div style={{display:"flex",gap:6,flexShrink:0}}>
                          <div style={{display:"flex",background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:9,overflow:"hidden"}}>
                            <button style={{padding:"0 10px",fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:1.5,background:(newTypes[dow]||"weekly")==="weekly"?"rgba(0,240,255,0.12)":"none",border:"none",cursor:"pointer",color:(newTypes[dow]||"weekly")==="weekly"?"var(--cyan)":"var(--dim)"}} onClick={()=>setNewTypes(p=>({...p,[dow]:"weekly"}))}>WK</button>
                            <button style={{padding:"0 10px",fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:1.5,background:(newTypes[dow]||"weekly")==="once"?"rgba(255,225,56,0.1)":"none",border:"none",cursor:"pointer",color:(newTypes[dow]||"weekly")==="once"?"var(--yellow)":"var(--dim)"}} onClick={()=>setNewTypes(p=>({...p,[dow]:"once"}))}>1×</button>
                          </div>
                          <button className="add-multiday-btn" onClick={()=>setShowModal(dow)}>+ MULTI-DAY</button>
                          <button className="add-btn" onClick={()=>addTask(dow)}>+</button>
                        </div>
                      </div>
                    ):(
                      <div className="past-note">{hasMissed?"⚠ INCOMPLETE TASKS FROM THIS WEEK":"✓ ARCHIVED"}</div>
                    )}
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