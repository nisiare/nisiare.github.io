// blog.js — loads markdown files from posts/ in the repository and renders them
(async function(){
  const owner = 'nisiare';
  const repo = 'nisiare.github.io';
  const postsListEl = document.getElementById('posts-list');

  function mdToHtml(md){
    // very small markdown -> html converter (headings, links, paragraphs, lists, code blocks)
    // not full-featured but enough for simple posts
    const esc = s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const lines = md.split(/\r?\n/);
    let out = '';
    let inCode=false, inList=false;
    for(let line of lines){
      if(line.startsWith('```')){ inCode = !inCode; out += inCode ? '<pre><code>' : '</code></pre>'; continue; }
      if(inCode){ out += esc(line)+'\n'; continue; }
      if(/^#{1,6} /.test(line)){ const lvl=line.match(/^#+/)[0].length; out += `<h${lvl}>${esc(line.slice(lvl+1).trim())}</h${lvl}>`; continue; }
      if(/^\* /.test(line)){ if(!inList){ inList=true; out+='<ul>'; } out += `<li>${esc(line.slice(2).trim())}</li>`; continue; } else { if(inList){ inList=false; out+='</ul>'; } }
      // link-like [text](url)
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
        // first heading or filename as title
        const titleLine = md.split(/\r?\n/).find(l=>/^# /.test(l));
        const title = titleLine ? titleLine.replace(/^# /,'').trim() : f.name.replace(/\.md$/,'');
        const date = f.name.slice(0,10);
        wrapper.innerHTML = `<h3>${title}</h3><small class="muted">${date}</small>` + mdToHtml(md);
        postsListEl.appendChild(wrapper);
      }
    }catch(err){ console.error(err); postsListEl.textContent = 'Error loading posts.'; }
  }

  // Create PR workflow (optional): uses GitHub REST API to create a branch, add file, and open PR
  document.getElementById('create-post-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const name = document.getElementById('pr-name').value.trim() || 'guest';
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value;
    const token = document.getElementById('gh-token').value.trim();
    const result = document.getElementById('pr-result');
    if(!title||!content){ result.textContent='Title and content required.'; return; }
    if(!token){ result.textContent='No token provided — cannot create PR. You can add posts manually in posts/.'; return; }
    result.textContent='Creating PR...';
    try{
      const branch = 'add-post-'+Date.now();
      const baseRef = 'main';
      const headers = { 'Authorization': 'token '+token, 'Accept':'application/vnd.github.v3+json' };
      // get latest commit sha
      const r1 = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${baseRef}`,{headers});
      if(!r1.ok) throw new Error('Cannot read base ref: '+(await r1.text()));
      const base = await r1.json();
      const baseSha = base.object.sha;
      // create new branch
      const r2 = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`,{method:'POST',headers,body:JSON.stringify({ref:'refs/heads/'+branch,sha:baseSha})});
      if(!r2.ok) throw new Error('Failed to create branch: '+(await r2.text()));
      // prepare file
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
      const filename = `${new Date().toISOString().slice(0,10)}-${slug}.md`;
      const bodyContent = `# ${title}\n\n${content}\n\n_Posted by ${name}_`;
      const encoded = btoa(unescape(encodeURIComponent(bodyContent)));
      // create file on branch
      const r3 = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/posts/${filename}`,{method:'PUT',headers,body:JSON.stringify({message:'Add post '+filename,content:encoded,branch})});
      if(!r3.ok) throw new Error('Failed to create file: '+(await r3.text()));
      // open PR
      const pr = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`,{method:'POST',headers,body:JSON.stringify({title:'Add post: '+title,head:branch,base:baseRef,body:'Post created via site by '+name})});
      if(!pr.ok) throw new Error('Failed to open PR: '+(await pr.text()));
      const prJson = await pr.json();
      result.innerHTML = `Pull request created: <a href="${prJson.html_url}" target="_blank">${prJson.html_url}</a>`;
    }catch(err){ console.error(err); result.textContent = 'Error: '+err.message; }
  });

  loadPosts();
})();
