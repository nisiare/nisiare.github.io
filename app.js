// app.js — client-side logic (localStorage-based)
// Features:
//  - blog posts (add/delete, persisted)
//  - habit tracker with daily checkboxes + history
//  - reminders (simple scheduler, fires Notification while page is open)
//  - custom trackers (counters and notes)

(function(){
  const DB = {
    posts: JSON.parse(localStorage.getItem('posts')||'[]'),
    habits: JSON.parse(localStorage.getItem('habits')||'[]'),
    reminders: JSON.parse(localStorage.getItem('reminders')||'[]'),
    trackers: JSON.parse(localStorage.getItem('trackers')||'[]')
  };

  // ---- Blog ----
  const postsEl = document.getElementById('posts');
  const renderPosts = ()=>{
    postsEl.innerHTML = '';
    DB.posts.slice().reverse().forEach((p,idx)=>{
      const div = document.createElement('div');
      div.className='post';
      div.innerHTML = '<h3>'+escapeHtml(p.title)+'</h3><div>'+escapeHtml(p.body).replace(/\n/g,'<br>')+'</div><small class="muted">'+new Date(p.t).toLocaleString()+'</small>';
      postsEl.appendChild(div);
    });
  };
  document.getElementById('post-form').addEventListener('submit', e=>{
    e.preventDefault();
    const t = document.getElementById('post-title').value.trim();
    const b = document.getElementById('post-body').value.trim();
    if(!t||!b) return;
    DB.posts.push({title:t,body:b,t:Date.now()});
    localStorage.setItem('posts', JSON.stringify(DB.posts));
    document.getElementById('post-title').value='';
    document.getElementById('post-body').value='';
    renderPosts();
  });
  document.getElementById('clear-posts').addEventListener('click', ()=>{
    if(confirm('Clear all posts?')){ DB.posts=[]; localStorage.setItem('posts','[]'); renderPosts(); }
  });
  renderPosts();

  // ---- Habits (simple daily toggles) ----
  const habitsApp = document.getElementById('habits-app');
  const todayKey = ()=>{ const d=new Date(); return d.toISOString().slice(0,10); };
  function ensureDefaultHabits(){
    if(DB.habits.length===0){
      ['brush teeth','make bed','wash face and do skincare','take shower','walk for an hour','mood'].forEach(name=>{
        DB.habits.push({name,history:{}}); 
      });
      localStorage.setItem('habits', JSON.stringify(DB.habits));
    }
  }
  function renderHabits(){
    habitsApp.innerHTML='';
    DB.habits.forEach((h,hi)=>{
      const row = document.createElement('div'); row.className='habit-row';
      const cb = document.createElement('input'); cb.type='checkbox';
      cb.checked = !!h.history[todayKey()];
      cb.addEventListener('change', ()=>{
        if(cb.checked) h.history[todayKey()]=true; else delete h.history[todayKey()];
        localStorage.setItem('habits', JSON.stringify(DB.habits));
      });
      const label = document.createElement('label'); label.textContent = h.name;
      row.appendChild(cb); row.appendChild(label);
      habitsApp.appendChild(row);
    });
  }
  ensureDefaultHabits();
  renderHabits();
  document.getElementById('add-habit-form').addEventListener('submit', e=>{
    e.preventDefault();
    const v = document.getElementById('new-habit-name').value.trim();
    if(!v) return;
    DB.habits.push({name:v,history:{}});
    localStorage.setItem('habits', JSON.stringify(DB.habits));
    document.getElementById('new-habit-name').value='';
    renderHabits();
  });

  // ---- Reminders ----
  function askNotification(){
    if('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }
  askNotification();
  function scheduleCheck(){
    // run every 10s to find reminders due within the next 5s
    setInterval(()=>{
      const now = Date.now();
      DB.reminders.forEach(r=>{
        if(!r.fired && new Date(r.when).getTime() <= now){
          r.fired = true;
          localStorage.setItem('reminders', JSON.stringify(DB.reminders));
          if('Notification' in window && Notification.permission === 'granted'){
            new Notification(r.title || 'Reminder', {body: r.title});
          } else {
            alert('Reminder: '+(r.title||'Reminder'));
          }
          renderReminders();
        }
      });
    },10000);
  }
  function renderReminders(){
    const el = document.getElementById('reminders-list');
    el.innerHTML='';
    DB.reminders.forEach((r,idx)=>{
      const div = document.createElement('div'); div.className='tracker';
      div.innerHTML = '<strong>'+escapeHtml(r.title)+'</strong> — '+new Date(r.when).toLocaleString() + (r.fired? ' <em>(sent)</em>':'') + ' <button data-i="'+idx+'">Cancel</button>';
      el.appendChild(div);
    });
    el.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{ DB.reminders.splice(+btn.dataset.i,1); localStorage.setItem('reminders',JSON.stringify(DB.reminders)); renderReminders(); });
    });
  }
  document.getElementById('reminder-form').addEventListener('submit', e=>{
    e.preventDefault();
    const title = document.getElementById('reminder-title').value.trim();
    const when = document.getElementById('reminder-datetime').value;
    if(!title||!when) return;
    DB.reminders.push({title,when,fired:false});
    localStorage.setItem('reminders', JSON.stringify(DB.reminders));
    document.getElementById('reminder-title').value='';
    document.getElementById('reminder-datetime').value='';
    renderReminders();
  });
  renderReminders();
  scheduleCheck();

  // ---- Trackers ----
  const trackersList = document.getElementById('trackers-list');
  function renderTrackers(){
    trackersList.innerHTML='';
    DB.trackers.forEach((t,ti)=>{
      const div = document.createElement('div'); div.className='tracker';
      if(t.type==='counter'){
        div.innerHTML = '<strong>'+escapeHtml(t.name)+'</strong><div>Value: <span class="val">'+t.value+'</span> <button data-op="+">+</button> <button data-op="-">-</button> <button data-op="reset">reset</button> <button data-op="del">delete</button></div>';
        trackersList.appendChild(div);
        div.querySelectorAll('button').forEach(b=>{
          b.addEventListener('click', ()=>{
            const op=b.dataset.op;
            if(op==='+'){ t.value = (t.value||0)+1; }
            else if(op==='-'){ t.value = Math.max(0,(t.value||0)-1); }
            else if(op==='reset'){ t.value=0; }
            else if(op==='del'){ DB.trackers.splice(ti,1); localStorage.setItem('trackers', JSON.stringify(DB.trackers)); renderTrackers(); return; }
            localStorage.setItem('trackers', JSON.stringify(DB.trackers));
            renderTrackers();
          });
        });
      } else {
        div.innerHTML = '<strong>'+escapeHtml(t.name)+'</strong><div><textarea class="note">'+escapeHtml(t.note||'')+'</textarea><br><button data-op="save">Save</button> <button data-op="del">Delete</button></div>';
        trackersList.appendChild(div);
        div.querySelector('button[data-op=save]').addEventListener('click', ()=>{
          t.note = div.querySelector('.note').value;
          localStorage.setItem('trackers', JSON.stringify(DB.trackers));
        });
        div.querySelector('button[data-op=del]').addEventListener('click', ()=>{
          DB.trackers.splice(ti,1);
          localStorage.setItem('trackers', JSON.stringify(DB.trackers));
          renderTrackers();
        });
      }
    });
  }
  document.getElementById('add-tracker-form').addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('tracker-name').value.trim();
    const type = document.getElementById('tracker-type').value;
    if(!name) return;
    const t = type==='counter' ? {name,type,value:0} : {name,type,note:''};
    DB.trackers.push(t);
    localStorage.setItem('trackers', JSON.stringify(DB.trackers));
    document.getElementById('tracker-name').value='';
    renderTrackers();
  });
  renderTrackers();

  // ---- Helpers ----
  function escapeHtml(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

})();
