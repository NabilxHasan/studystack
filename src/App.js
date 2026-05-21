import { useState, useEffect } from "react";

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

// week key: "2025-W22"
function getWeekKey(date){
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay()); // go to Sunday
  return `${d.getFullYear()}-W${String(Math.ceil((((d - new Date(d.getFullYear(),0,1))/86400000)+1)/7)).padStart(2,"0")}`;
}

function getSundayOf(date){
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date, n){
  const d = new Date(date);
  d.setDate(d.getDate()+n);
  return d;
}

function formatShortDate(date){
  return date.toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

// deep clone tasks stripping done=false for weekly (fresh week)
function freshWeekTasks(templateTasks){
  const out = {};
  for(let dow=0;dow<7;dow++){
    out[dow]=(templateTasks[dow]||[]).map(t=>({
      ...t,
      id: t.repeat ? t.id+"-"+Date.now()+Math.random().toString(36).slice(2,5) : t.id,
      done: false
    }));
  }
  return out;
}

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

/* HEADER */
.hdr{padding:28px 22px 16px;border-bottom:1px solid var(--border);}
.hdr-title{font-size:26px;font-weight:800;letter-spacing:3px;color:var(--cyan);text-shadow:0 0 24px rgba(0,240,255,0.45);}
.hdr-sub{font-family:'DM Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:4px;margin-top:3px;}

/* WEEK NAV TABS */
.week-nav{
  display:flex;align-items:center;gap:0;
  padding:14px 16px 0;
  overflow-x:auto;scrollbar-width:none;
}
.week-nav::-webkit-scrollbar{display:none;}
.week-tab{
  flex-shrink:0;
  padding:9px 16px;
  background:none;border:none;cursor:pointer;
  font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;
  color:var(--dim);
  border-bottom:2px solid transparent;
  transition:all 0.15s;
  white-space:nowrap;
}
.week-tab:hover{color:var(--text);}
.week-tab.active{color:var(--cyan);border-bottom-color:var(--cyan);text-shadow:0 0 8px rgba(0,240,255,0.4);}
.week-tab.past{color:var(--dim);}
.week-tab.has-missed{color:var(--red);}
.week-tab.has-missed.active{color:var(--red);border-bottom-color:var(--red);}

.week-nav-border{height:1px;background:var(--border);margin:0 16px 0;}

/* week label */
.week-label{
  padding:12px 18px 6px;
  font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);
  display:flex;align-items:center;gap:10px;
}
.week-label-badge{
  padding:2px 8px;border-radius:4px;font-size:9px;letter-spacing:1px;
  font-family:'DM Mono',monospace;
}
.badge-current{background:rgba(0,240,255,0.1);color:var(--cyan);border:1px solid rgba(0,240,255,0.25);}
.badge-past{background:rgba(255,68,68,0.08);color:var(--red);border:1px solid rgba(255,68,68,0.2);}

/* STACK */
.stack{padding:10px 16px 0;display:flex;flex-direction:column;gap:8px;}

/* DAY ROW */
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

.day-num-box{
  width:48px;height:48px;flex-shrink:0;border-radius:10px;
  background:var(--bg2);border:1px solid var(--border);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
  transition:all 0.2s;
}
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

.day-count{font-family:'DM Mono',monospace;font-size:11px;color:var(--dim);margin-top:3px;letter-spacing:1px;display:flex;align-items:center;gap:6px;}
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

/* DROPDOWN */
.day-body{max-height:0;overflow:hidden;transition:max-height 0.35s cubic-bezier(.23,1,.32,1);}
.day-body.open{max-height:1400px;}
.day-body-inner{padding:0 14px 14px;border-top:1px solid var(--border);}

.mini-prog{height:2px;background:var(--border);border-radius:1px;margin:12px 0 14px;overflow:hidden;}
.mini-prog-fill{height:100%;border-radius:1px;background:linear-gradient(90deg,var(--cyan),var(--pink));box-shadow:0 0 6px rgba(0,240,255,0.5);transition:width 0.4s cubic-bezier(.23,1,.32,1);}
.mini-prog-fill.missed{background:linear-gradient(90deg,var(--red),var(--pink));}

/* TASK */
.task-list{display:flex;flex-direction:column;gap:7px;}
.task-item{display:flex;align-items:center;gap:12px;padding:13px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;transition:all 0.15s;position:relative;overflow:hidden;}
.task-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--cyan);opacity:0;transition:opacity 0.15s;box-shadow:0 0 8px var(--cyan);}
.task-item.done{background:rgba(57,255,110,0.03);border-color:rgba(57,255,110,0.15);}
.task-item.done::before{background:var(--green);opacity:1;box-shadow:0 0 8px var(--green);}
.task-item.task-missed{background:rgba(255,68,68,0.04);border-color:rgba(255,68,68,0.2);}
.task-item.task-missed::before{background:var(--red);opacity:1;box-shadow:0 0 8px var(--red);}
.task-item:hover::before{opacity:0.4;}
.task-item.done:hover::before{opacity:1;}

.task-check{width:24px;height:24px;flex-shrink:0;border:1.5px solid var(--bord2);border-radius:6px;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;color:transparent;transition:all 0.15s;}
.task-check:hover{border-color:var(--cyan);background:rgba(0,240,255,0.06);}
.task-item.done .task-check{background:var(--green);border-color:var(--green);color:var(--bg);box-shadow:0 0 10px rgba(57,255,110,0.45);}
.task-item.task-missed .task-check{border-color:rgba(255,68,68,0.4);cursor:default;}
.task-check.readonly{cursor:default;}

.task-label{flex:1;min-width:0;font-size:16px;font-weight:600;color:var(--text);line-height:1.3;transition:all 0.15s;}
.task-item.done .task-label{color:var(--dim);text-decoration:line-through;opacity:0.45;}
.task-item.task-missed .task-label{color:rgba(255,68,68,0.75);}

.task-edit-input{flex:1;background:var(--bg3);border:1px solid var(--bord2);border-radius:6px;padding:5px 10px;font-family:'Syne',sans-serif;font-size:16px;font-weight:600;color:var(--text);outline:none;}
.task-edit-input:focus{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(0,240,255,0.08);}

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

/* ADD BAR */
.add-bar{display:flex;gap:8px;margin-top:12px;}
.add-input{flex:1;background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:12px 14px;font-family:'Syne',sans-serif;font-size:15px;font-weight:600;color:var(--text);outline:none;transition:border-color 0.15s;}
.add-input::placeholder{color:var(--dimmer);}
.add-input:focus{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(0,240,255,0.07);}
.type-toggle{display:flex;background:var(--bg2);border:1px solid var(--border);border-radius:9px;overflow:hidden;flex-shrink:0;}
.type-opt{padding:0 11px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.5px;background:none;border:none;cursor:pointer;color:var(--dim);transition:all 0.15s;}
.type-opt.sel-wk{background:rgba(0,240,255,0.12);color:var(--cyan);}
.type-opt.sel-1x{background:rgba(255,225,56,0.1);color:var(--yellow);}
.add-btn{background:var(--cyan);color:var(--bg);border:none;border-radius:9px;padding:0 18px;font-family:'Syne',sans-serif;font-size:18px;font-weight:800;cursor:pointer;flex-shrink:0;transition:all 0.15s;box-shadow:0 0 14px rgba(0,240,255,0.25);}
.add-btn:hover{background:#20f5ff;box-shadow:0 0 20px rgba(0,240,255,0.45);}
.add-btn:active{transform:scale(0.96);}
.add-bar-disabled .add-input{opacity:0.4;pointer-events:none;}
.add-bar-disabled .add-btn{opacity:0.4;pointer-events:none;}
.add-bar-disabled .type-toggle{opacity:0.4;pointer-events:none;}

/* PAST WEEK NOTE */
.past-note{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,68,68,0.6);letter-spacing:1.5px;text-align:center;padding:8px 0 4px;}

.empty{text-align:center;padding:28px 0 16px;}
.empty-icon{font-size:26px;opacity:0.2;margin-bottom:8px;}
.empty-txt{font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--dimmer);}

@keyframes dropIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
.drop-in{animation:dropIn 0.22s ease both;}
@keyframes checkPop{0%{transform:scale(1);}40%{transform:scale(1.3);}100%{transform:scale(1);}}
.check-pop{animation:checkPop 0.18s ease;}
`;

export default function App(){
  const now = new Date();
  const todayDow = now.getDay();
  const currentWeekKey = getWeekKey(now);

  // All week data: { [weekKey]: { [dow]: Task[] } }
  const [allWeeks, setAllWeeks] = useState(()=>{
    try{
      const s = localStorage.getItem("sq4_allweeks");
      if(s) return JSON.parse(s);
    }catch{}
    return { [currentWeekKey]: DEFAULT_TASKS };
  });

  const [activeWeek, setActiveWeek] = useState(currentWeekKey);
  const [openDay, setOpenDay] = useState(todayDow);
  const [editDay, setEditDay] = useState(null);
  const [newLabels, setNewLabels] = useState({});
  const [newTypes, setNewTypes] = useState({});
  const [popId, setPopId] = useState(null);

  // persist
  useEffect(()=>{
    try{ localStorage.setItem("sq4_allweeks", JSON.stringify(allWeeks)); }catch{}
  },[allWeeks]);

  // On load: ensure current week exists; snapshot past weeks' incomplete tasks
  useEffect(()=>{
    setAllWeeks(prev=>{
      const out = {...prev};
      if(!out[currentWeekKey]) out[currentWeekKey] = DEFAULT_TASKS;
      return out;
    });
  },[]);

  // sorted week keys newest first
  const weekKeys = Object.keys(allWeeks).sort((a,b)=>b.localeCompare(a));

  function getSundayForKey(key){
    // parse year and week num
    const [yr, wStr] = key.split("-W");
    const year = parseInt(yr);
    const week = parseInt(wStr);
    const jan1 = new Date(year,0,1);
    const d = new Date(jan1);
    d.setDate(jan1.getDate() + (week-1)*7 - jan1.getDay());
    return d;
  }

  function weekLabel(key){
    const sun = getSundayForKey(key);
    const sat = addDays(sun,6);
    return `${formatShortDate(sun)} – ${formatShortDate(sat)}`;
  }

  const isPast = (key)=> key < currentWeekKey;
  const isCurrentWeek = activeWeek === currentWeekKey;

  // check if a day has missed tasks (past week, not all done, had tasks)
  function dayHasMissed(dow, weekKey){
    if(!isPast(weekKey)) return false;
    const ts = (allWeeks[weekKey]||{})[dow]||[];
    return ts.length > 0 && ts.some(t=>!t.done);
  }

  function weekHasMissed(key){
    if(!isPast(key)) return false;
    for(let d=0;d<7;d++){
      if(dayHasMissed(d,key)) return true;
    }
    return false;
  }

  const activeTasks = (dow)=>(allWeeks[activeWeek]||{})[dow]||[];

  function toggle(dow,id){
    if(isPast(activeWeek)) return; // read-only past
    setPopId(id);
    setTimeout(()=>setPopId(null),180);
    setAllWeeks(prev=>({
      ...prev,
      [activeWeek]:{
        ...(prev[activeWeek]||{}),
        [dow]:(prev[activeWeek]?.[dow]||[]).map(t=>t.id===id?{...t,done:!t.done}:t)
      }
    }));
  }

  function del(dow,id){
    if(isPast(activeWeek)) return;
    setAllWeeks(prev=>({...prev,[activeWeek]:{...(prev[activeWeek]||{}),[dow]:(prev[activeWeek]?.[dow]||[]).filter(t=>t.id!==id)}}));
  }

  function editLabel(dow,id,val){
    if(isPast(activeWeek)) return;
    setAllWeeks(prev=>({...prev,[activeWeek]:{...(prev[activeWeek]||{}),[dow]:(prev[activeWeek]?.[dow]||[]).map(t=>t.id===id?{...t,label:val}:t)}}));
  }

  function toggleRepeat(dow,id){
    if(isPast(activeWeek)) return;
    setAllWeeks(prev=>({...prev,[activeWeek]:{...(prev[activeWeek]||{}),[dow]:(prev[activeWeek]?.[dow]||[]).map(t=>t.id===id?{...t,repeat:!t.repeat}:t)}}));
  }

  function addTask(dow){
    if(isPast(activeWeek)) return;
    const label=(newLabels[dow]||"").trim();
    if(!label) return;
    const type=newTypes[dow]||"weekly";
    setAllWeeks(prev=>({
      ...prev,
      [activeWeek]:{
        ...(prev[activeWeek]||{}),
        [dow]:[...(prev[activeWeek]?.[dow]||[]),{id:uid(),label,repeat:type==="weekly",done:false}]
      }
    }));
    setNewLabels(p=>({...p,[dow]:""}));
  }

  // date number for a dow in the active week
  function dateOfDow(dow){
    const sun = getSundayForKey(activeWeek);
    return addDays(sun,dow).getDate();
  }

  const past = isPast(activeWeek);

  return(
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="hdr">
          <div className="hdr-title">STUDY STACK</div>
          <div className="hdr-sub">WEEKLY ROUTINE TRACKER</div>
        </div>

        {/* WEEK TABS */}
        <div className="week-nav">
          {weekKeys.map(key=>{
            const missed = weekHasMissed(key);
            const isCur = key===currentWeekKey;
            const isAct = key===activeWeek;
            return(
              <button
                key={key}
                className={`week-tab${isAct?" active":""}${!isCur&&!missed?" past":""}${missed?" has-missed":""}`}
                onClick={()=>{setActiveWeek(key);setOpenDay(isCur?todayDow:null);setEditDay(null);}}
              >
                {isCur?"THIS WEEK":weekLabel(key)}
                {missed&&" ⚠"}
              </button>
            );
          })}
        </div>
        <div className="week-nav-border"/>

        {/* WEEK LABEL */}
        <div className="week-label">
          {isCurrentWeek ? weekLabel(currentWeekKey) : weekLabel(activeWeek)}
          <span className={`week-label-badge ${isCurrentWeek?"badge-current":"badge-past"}`}>
            {isCurrentWeek?"CURRENT":"PAST — READ ONLY"}
          </span>
        </div>

        {/* DAY STACK */}
        <div className="stack">
          {[0,1,2,3,4,5,6].map(dow=>{
            const ts = activeTasks(dow);
            const done = ts.filter(t=>t.done).length;
            const pct = ts.length?Math.round((done/ts.length)*100):0;
            const hasMissed = dayHasMissed(dow,activeWeek);
            const allDone = ts.length>0 && done===ts.length;
            const isOpen = openDay===dow;
            const isToday = dow===todayDow && isCurrentWeek;
            const isEdit = editDay===dow && !past;

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
                        {ts.length===0
                          ? <span>no tasks</span>
                          : <><span>{done} of {ts.length} done</span></>
                        }
                        {hasMissed&&<span className="missed-tag">MISSED</span>}
                        {ts.length>0&&(
                          <span className="pip-row">
                            {ts.map(t=>(
                              <span key={t.id} className={`pip${t.done?" done":hasMissed&&!t.done?" missed":""}`}/>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="day-right">
                    {ts.length>0&&(
                      <span className={`day-pct${pct===100?" done-all":hasMissed?" missed":""}`}>{pct}%</span>
                    )}
                    <span className="chevron">▾</span>
                  </div>
                </div>

                <div className={`day-body${isOpen?" open":""}`}>
                  <div className="day-body-inner">
                    <div className="day-edit-bar">
                      {!past?(
                        <button
                          className={`edit-toggle${isEdit?" active":""}`}
                          onClick={e=>{e.stopPropagation();setEditDay(isEdit?null:dow);}}
                        >{isEdit?"✕ DONE":"✎ EDIT"}</button>
                      ):(
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"rgba(255,68,68,0.5)"}}>
                          {hasMissed?"⚠ TASKS MISSED":"READ ONLY"}
                        </span>
                      )}
                    </div>

                    {ts.length>0&&(
                      <div className="mini-prog">
                        <div className={`mini-prog-fill${hasMissed?" missed":""}`} style={{width:`${pct}%`}}/>
                      </div>
                    )}

                    <div className="task-list drop-in">
                      {ts.length===0&&(
                        <div className="empty">
                          <div className="empty-icon">◻</div>
                          <div className="empty-txt">{past?"NO TASKS THIS DAY":"NO TASKS YET"}</div>
                        </div>
                      )}
                      {ts.map(task=>{
                        const taskMissed = past && !task.done;
                        return(
                          <div key={task.id} className={`task-item${task.done?" done":""}${taskMissed?" task-missed":""}`}>
                            {!isEdit?(
                              <>
                                <button
                                  className={`task-check${popId===task.id?" check-pop":""}${past?" readonly":""}`}
                                  onClick={()=>toggle(dow,task.id)}
                                  disabled={past}
                                >{task.done?"✓":taskMissed?"✕":""}</button>
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
                        <input
                          className="add-input"
                          placeholder="Add a task…"
                          value={newLabels[dow]||""}
                          onChange={e=>setNewLabels(p=>({...p,[dow]:e.target.value}))}
                          onKeyDown={e=>e.key==="Enter"&&addTask(dow)}
                        />
                        <div className="type-toggle">
                          <button className={`type-opt${(newTypes[dow]||"weekly")==="weekly"?" sel-wk":""}`} onClick={()=>setNewTypes(p=>({...p,[dow]:"weekly"}))}>WK</button>
                          <button className={`type-opt${(newTypes[dow]||"weekly")==="once"?" sel-1x":""}`} onClick={()=>setNewTypes(p=>({...p,[dow]:"once"}))}>1×</button>
                        </div>
                        <button className="add-btn" onClick={()=>addTask(dow)}>+</button>
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