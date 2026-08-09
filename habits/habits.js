// habits.js — calendar-style habit tracker, localStorage-based
(function(){
  const LS = localStorage;
  const HABITS_KEY = 'habits_v2';
  const TODO_KEY = 'habits_todo_v2';
  const MOOD_KEY = 'habits_mood_v2';

  let today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();

  function loadHabits(){ return JSON.parse(LS.getItem(HABITS_KEY)||'[]'); }
  function saveHabits(h){ LS.setItem(HABITS_KEY, JSON.stringify(h)); }
  function ensureDefaults(){ let h = loadHabits(); if(h.length===0){ h = ['brush teeth','make bed','wash face and do skincare','take shower','walk for an hour','mood']; saveHabits(h); } }
  ensureDefaults();

  const habitSelect = document.getElementById('habit-select');
  const calendar = document.getElementById('calendar');
  const monthLabel = document.getElementById('month-label');
  const prev = document.getElementById('prev-month');
  const next = document.getElementById('next-month');
  const addBtn = document.getElementById('add-habit');
  const newName = document.getElementById('new-habit-name');
  const dayLabel = document.getElementById('day-label');
  const dailyListEl = document.getElementById('daily-list');

  function renderHabitOptions(){ const h = loadHabits(); habitSelect.innerHTML=''; h.forEach((name,i)=>{ const opt = document.createElement('option'); opt.value=i; opt.textContent=name; habitSelect.appendChild(opt); }); }

  function monthKey(y,m){ return `habit_${y}_${m}`; }
  function loadMonthData(y,m){ return JSON.parse(LS.getItem(monthKey(y,m))||'{}'); }
  function saveMonthData(y,m,data){ LS.setItem(monthKey(y,m), JSON.stringify(data)); }

  function renderCalendar(){
    const y=viewYear,m=viewMonth;
    monthLabel.textContent = new Date(y,m,1).toLocaleString(undefined,{month:'long',year:'numeric'});
    calendar.innerHTML='';
    const first = new Date(y,m,1).getDay();
    const days = new Date(y,m+1,0).getDate();
    // build grid
    const grid = document.createElement('div'); grid.className='habit-grid';
    ['S','M','T','W','T','F','S'].forEach(dn=>{ const d=document.createElement('div'); d.className='habit-cell header'; d.textContent=dn; grid.appendChild(d); });
    for(let i=0;i<first;i++){ const d=document.createElement('div'); d.className='habit-cell empty'; grid.appendChild(d); }
    const monthData = loadMonthData(y,m);
    const habits = loadHabits();
    const currentHabitIdx = +habitSelect.value || 0;
    for(let day=1;day<=days;day++){
      const d = document.createElement('div'); d.className='habit-cell day';
      const key = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const done = monthData[key] && monthData[key][currentHabitIdx];
      if(done) d.classList.add('done');
      d.innerHTML = `<div class="daynum">${day}</div><div class="dot"></div>`;
      d.addEventListener('click', ()=>{
        const md = loadMonthData(y,m);
        md[key] = md[key] || {};
        md[key][currentHabitIdx] = !md[key][currentHabitIdx];
        saveMonthData(y,m,md);
        renderCalendar();
        renderDailyList();
      });
      grid.appendChild(d);
    }
    calendar.appendChild(grid);
    renderDailyList();
  }

  function renderDailyList(){
    const y=viewYear,m=viewMonth;
    const sel = +habitSelect.value || 0;
    const keyDate = new Date(y,m,today.getDate()).toISOString().slice(0,10);
    dayLabel.textContent = new Date(y,m,today.getDate()).toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}).toUpperCase();
    const md = loadMonthData(y,m);
    const habits = loadHabits();
    dailyListEl.innerHTML = '';
    habits.forEach((h,idx)=>{
      const div = document.createElement('div');
      const checked = (md[keyDate] && md[keyDate][idx]) ? 'checked' : '';
      div.innerHTML = `<label><input type="checkbox" data-idx="${idx}" ${checked}> ${h}</label>`;
      div.querySelector('input').addEventListener('change', e=>{
        const k = keyDate;
        const data = loadMonthData(viewYear,viewMonth);
        data[k] = data[k] || {};
        data[k][idx] = e.target.checked;
        saveMonthData(viewYear,viewMonth,data);
        renderCalendar();
      });
      dailyListEl.appendChild(div);
    });
  }

  habitSelect.addEventListener('change', ()=>renderCalendar());
  prev.addEventListener('click', ()=>{ viewMonth--; if(viewMonth<0){ viewMonth=11; viewYear--; } renderCalendar(); });
  next.addEventListener('click', ()=>{ viewMonth++; if(viewMonth>11){ viewMonth=0; viewYear++; } renderCalendar(); });
  addBtn.addEventListener('click', ()=>{ if(newName.style.display==='none'){ newName.style.display='inline-block'; newName.focus(); } else { const v=newName.value.trim(); if(v){ const h=loadHabits(); h.push(v); saveHabits(h); newName.value=''; newName.style.display='none'; renderHabitOptions(); renderCalendar(); } else { newName.style.display='none'; } } });

  // mood
  const moodRow = document.getElementById('mood-row');
  const moods = ['🙂','😄','😐','😞','😡','😴'];
  function renderMood(){ const key = new Date().toISOString().slice(0,10); const stored = JSON.parse(LS.getItem(MOOD_KEY)||'{}'); moodRow.innerHTML=''; moods.forEach(m=>{ const b=document.createElement('button'); b.textContent=m; b.addEventListener('click', ()=>{ stored[key]=m; LS.setItem(MOOD_KEY,JSON.stringify(stored)); renderMood(); renderMoodGrid(); }); if(stored[key]===m) b.className='selected'; moodRow.appendChild(b); }); renderMoodGrid(); }
  function renderMoodGrid(){ const grid = document.getElementById('mood-grid'); grid.innerHTML=''; const stored = JSON.parse(LS.getItem(MOOD_KEY)||'{}'); const days=42; for(let i=0;i<days;i++){ const box=document.createElement('div'); box.style.width='20px'; box.style.height='20px'; box.style.display='inline-block'; box.style.margin='4px'; box.style.background='#0f0e16'; grid.appendChild(box); } }

  // todo
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  function loadTodos(){ return JSON.parse(LS.getItem(TODO_KEY)||'{}'); }
  function saveTodos(t){ LS.setItem(TODO_KEY, JSON.stringify(t)); }
  function renderTodos(){ const key=new Date().toISOString().slice(0,10); const all=loadTodos(); const list=all[key]||[]; todoList.innerHTML=''; list.forEach((it,i)=>{ const li=document.createElement('li'); li.innerHTML=`<input type="checkbox" ${it.done? 'checked':''}> <span>${it.text}</span> <button data-i="${i}">x</button>`; todoList.appendChild(li); li.querySelector('input').addEventListener('change', e=>{ list[i].done=e.target.checked; all[key]=list; saveTodos(all); renderTodos(); }); li.querySelector('button').addEventListener('click', ()=>{ list.splice(i,1); all[key]=list; saveTodos(all); renderTodos(); }); }); }
  todoInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const val=todoInput.value.trim(); if(!val) return; const all=loadTodos(); const key=new Date().toISOString().slice(0,10); all[key]=all[key]||[]; all[key].push({text:val,done:false}); saveTodos(all); todoInput.value=''; renderTodos(); } });

  // read grid stub
  function renderReadGrid(){ const el = document.getElementById('read-grid'); el.innerHTML=''; for(let i=0;i<30;i++){ const s=document.createElement('div'); s.style.width='28px'; s.style.height='28px'; s.style.display='inline-block'; s.style.margin='4px'; s.style.border='1px solid rgba(255,255,255,0.06)'; el.appendChild(s); } }

  renderHabitOptions(); renderCalendar(); renderMood(); renderTodos(); renderReadGrid();
})();
