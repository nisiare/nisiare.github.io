// blog.js — loads markdown files from posts/ in the repository and renders them
(async function(){
  const owner = 'nisiare';
  const repo = 'nisiare.github.io';
  const postsListEl = document.getElementById('posts-list');

  function mdToHtml(md){
    const esc = s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const lines = md.split(/\r?\n/);
    let out = '';
    let inCode=false, inList=false;
    for(let line of lines){
      if(line.startsWith('```')){ inCode = !inCode; out += inCode ? '<pre><code>' : '</code></pre>'; continue; }
      if(inCode){ out += esc(line)+'\n'; continue; }
      if(/^#{1,6} /.test(line)){ const lvl=line.match(/^#+/)[0].length; out += `<h${lvl}>${esc(line.slice(lvl+1).trim())}</h${lvl}>`; continue; }
      if(/^\* /.test(line)){ if(!inList){ inList=true; out+='<ul>'; } out += `<li>${esc(line.slice(2).trim())}</li>`; continue; } else { if(inList){ inList=false; out+='</ul>'; } }
      line = line.replace(/\[(.*?)\]\((.*?)\)/g,(m,t,u)=>`<a href="${u}" target="_blank">${t}</a>`);
      if(line.trim()==='') out += '<p></p>'; else out += `<p>${line}</p>`;
    }
    if(inList) out+='</ul>';
    return out;
  }

  async function loadPosts(){
    postsListEl.textContent = 'Loading posts...';
    try{
      const api = `https://api.github.com/repos/${owner}/${repo}/contents/posts?ref=main`;
      const res = await fetch(api);
      if(!res.ok){ postsListEl.textContent = 'No posts directory or GitHub API rate-limited.'; return; }
      const files = await res.json();
      const mdFiles = files.filter(f=>f.name.endsWith('.md')).sort((a,b)=>b.name.localeCompare(a.name));
      if(mdFiles.length===0){ postsListEl.innerHTML = '<p>No posts yet.</p>'; return; }
      postsListEl.innerHTML = '';
      for(const f of mdFiles){
        const raw = f.download_url;
        const r = await fetch(raw);
        const md = await r.text();
        const wrapper = document.createElement('article');
        wrapper.className='post';
        const titleLine = md.split(/\r?\n/).find(l=>/^# /.test(l));
        const title = titleLine ? titleLine.replace(/^# /,'').trim() : f.name.replace(/\.md$/,'');
        const date = f.name.slice(0,10);
        wrapper.innerHTML = `<h3>${title}</h3><small class="muted">${date}</small>` + mdToHtml(md);
        postsListEl.appendChild(wrapper);
      }
    }catch(err){ console.error(err); postsListEl.textContent = 'Error loading posts.'; }
  }

  loadPosts();
})();
