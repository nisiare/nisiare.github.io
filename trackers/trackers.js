// trackers.js — simple counters and notes persisted locally
(function(){
  const LS = localStorage;
  const KEY = 'custom_trackers_v1';
  function load(){ return JSON.parse(LS.getItem(KEY)||'[]'); }
  function save(d){ LS.setItem(KEY, JSON.stringify(d)); }
  const listEl = document.getElementById('trackers');
  function render(){ const data=load(); listEl.innerHTML=''; data.forEach((t,i)=>{ const div=document.createElement('div'); div.className='tracker'; if(t.type==='counter'){ div.innerHTML = `<strong>${t.name}</strong><div>Value: <span>${t.value||0}</span> <button data-op="+">+</button> <button data-op="-">-</button> <button data-op="reset">reset</button> <button data-op="del">delete</button></div>`; div.querySelectorAll('button').forEach(b=>{ b.addEventListener('click', ()=>{ const op=b.dataset.op; if(op==='+') t.value=(t.value||0)+1; else if(op==='-') t.value=Math.max(0,(t.value||0)-1); else if(op==='reset') t.value=0; else if(op==='del'){ data.splice(i,1); save(data); render(); return; } save(data); render(); }); }); } else { div.innerHTML = `<strong>${t.name}</strong><div><textarea>${t.note||''}</textarea><br><button data-op="save">Save</button> <button data-op="del">Delete</button></div>`; div.querySelector('button[data-op=save]').addEventListener('click', ()=>{ t.note = div.querySelector('textarea').value; save(data); }); div.querySelector('button[data-op=del]').addEventListener('click', ()=>{ data.splice(i,1); save(data); render(); }); }
    listEl.appendChild(div);
  }); }
  document.getElementById('add-tracker').addEventListener('submit', e=>{ e.preventDefault(); const name=document.getElementById('tracker-name').value.trim(); const type=document.getElementById('tracker-kind').value; if(!name) return; const data=load(); data.push(type==='counter'?{name,type,value:0}:{name,type,note:''}); save(data); document.getElementById('tracker-name').value=''; render(); });
  render();
})();
