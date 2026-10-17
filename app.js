/* ============================================================
 * Feather Trace —— 主逻辑
 * ============================================================ */

// 图标映射表（全局替换）
const ICON_MAP = {
  '🔍': '<i class="ri-search-line"></i>', '🏠': '<i class="ri-home-9-line"></i>', '🛒': '<i class="ri-shopping-bag-4-line"></i>',
  '💬': '<i class="ri-message-3-line"></i>', '👤': '<i class="ri-user-line"></i>', '🐦': '<i class="ri-bird-line"></i>',
  '🏅': '<i class="ri-medal-line"></i>', '👍': '<i class="ri-thumb-up-line"></i>', '📍': '<i class="ri-map-pin-line"></i>',
  '📝': '<i class="ri-article-line"></i>', '🐟': '<i class="ri-coin-line"></i>', '📴': '<i class="ri-wifi-off-line"></i>',
  '👑': '<i class="ri-vip-crown-line"></i>', '🗑️': '<i class="ri-delete-bin-line"></i>', '✏️': '<i class="ri-pencil-line"></i>',
  '🔭': '<i class="ri-eye-line"></i>', '🧥': '<i class="ri-shirt-line"></i>', '📖': '<i class="ri-book-open-line"></i>',
  '🦆': '<i class="ri-bird-line"></i>', '🌿': '<i class="ri-leaf-line"></i>', '🌳': '<i class="ri-plant-line"></i>',
  '📷': '<i class="ri-camera-line"></i>', '🧢': '<i class="ri-user-smile-line"></i>', '🦜': '<i class="ri-bird-line"></i>',
  '🦅': '<i class="ri-bird-line"></i>', '🦉': '<i class="ri-bird-line"></i>', '📢': '<i class="ri-megaphone-line"></i>',
  '🏆': '<i class="ri-trophy-line"></i>', '🧠': '<i class="ri-brain-line"></i>', '☁️': '<i class="ri-cloud-line"></i>',
  '🕶️': '<i class="ri-spy-line"></i>', '🤖': '<i class="ri-robot-line"></i>', '💾': '<i class="ri-save-line"></i>',
  '📚': '<i class="ri-book-line"></i>', '🦵': '<i class="ri-footprint-line"></i>', '🪶': '<i class="ri-quill-pen-line"></i>'
};

function replaceIcons(htmlStr) {
  if (!htmlStr) return htmlStr;
  let newStr = htmlStr;
  for (let emoji in ICON_MAP) {
    newStr = newStr.replace(new RegExp(emoji, 'g'), ICON_MAP[emoji]);
  }
  return newStr;
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

const App = (() => {
  let current = 'comm';
  let currentProfileName = ''; 

  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function birdById(id) { return BIRDS.find(b => b.id === id); }
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ================= 页面切换 ================= */
  const TOP_TABS = ['comm', 'map', 'ai', 'progress'];
  function switchPage(p) {
    current = p;
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    
    let pageId = 'page-comm';
    if (TOP_TABS.includes(p)) pageId = 'page-' + p;
    else if (['my-birds', 'my-badges', 'offline', 'edit-profile', 'user-profile', 'create-post', 'search'].includes(p)) pageId = 'page-' + p;
    
    const targetEl = document.getElementById(pageId);
    if (targetEl) targetEl.classList.add('active');
    
    document.querySelectorAll('.top-tabs .tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === p && TOP_TABS.includes(p));
    });
    document.querySelectorAll('.bottom-nav .nav-item').forEach(el => {
      const tab = el.dataset.tab;
      let active = false;
      if (tab === 'home') active = TOP_TABS.includes(p);
      else if (tab === 'mine') active = ['mine', 'my-birds', 'my-badges', 'offline', 'edit-profile', 'user-profile'].includes(p);
      else active = tab === p;
      el.classList.toggle('active', active);
    });
    
    // 顶栏和底栏的显隐
    const topTabs = document.querySelector('.top-tabs-wrapper');
    const bottomNav = document.querySelector('.bottom-nav');
    if (['shop', 'msg', 'mine', 'my-birds', 'my-badges', 'offline', 'edit-profile', 'user-profile', 'create-post', 'search'].includes(p)) {
      if (topTabs) topTabs.classList.add('hidden');
      if (bottomNav) bottomNav.style.display = 'none';
    } else {
      if (topTabs) topTabs.classList.remove('hidden');
      if (bottomNav) bottomNav.style.display = 'flex';
    }
    
    renderCurrent();
  }

  function renderCurrent() {
    const containerId = TOP_TABS.includes(current) ? 'page-' + current : 'page-comm';
    const el = document.getElementById(containerId);
    
    if (current === 'comm') renderComm(el);
    else if (current === 'map') { MapView.render(el); MapView.useGeolocation(); }
    else if (current === 'ai') AI.render(el);
    else if (current === 'progress') renderProgress(el);
    else if (current === 'shop') renderShop(el);
    else if (current === 'msg') renderMsg(el);
    else if (current === 'mine') renderMine(el);
    else if (current === 'my-birds') renderMyBirds();
    else if (current === 'my-badges') renderMyBadges();
    else if (current === 'offline') renderOfflinePage();
    else if (current === 'edit-profile') renderEditProfile();
    else if (current === 'user-profile') renderUserProfile(currentProfileName);
    else if (current === 'create-post') renderCreatePost();
    else if (current === 'search') renderSearch();
  }

  /* ================= 交流区 ================= */
  let commTab = 'follow';
  function renderComm(el) {
    const tabs = [['follow', '关注'], ['region', '地区'], ['guide', '攻略'], ['share', '分享'], ['qa', '问答']];
    let html = `<div class="page-head">${tabs.map(t => `<div class="ptab ${commTab === t[0] ? 'active' : ''}" data-ft="comm-tab" data-v="${t[0]}">${t[1]}</div>`).join('')}</div>`;
    html += `<div class="post-area" id="postArea">${postListHtml()}</div>`;
    html += `<div class="fab" id="fabPost">＋</div>`;
    el.innerHTML = replaceIcons(html);
    el.querySelectorAll('[data-ft="comm-tab"]').forEach(x => x.addEventListener('click', () => { commTab = x.dataset.v; renderComm(el); }));
    el.querySelector('#fabPost').addEventListener('click', () => App.switchPage('create-post'));
    bindPostEvents(el);
  }

  function postListHtml() {
    const posts = Store.posts();
    let list = commTab === 'follow' ? [...posts].sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || b.likes - a.likes) : posts.filter(p => p.type === commTab);
    if (!list.length) return `<div class="empty"><div class="e">🪶</div>还没有帖子，点击右下角＋发布第一帖吧！</div>`;
    const liked = Store.liked(), fished = Store.fished();
    
    return list.map(p => `
      <div class="post-card">
        <div class="post-head">
          <span class="avatar" style="cursor:pointer;" onclick="App.viewUserProfile('${escapeHtml(p.author)}')">
            ${p.avatar && p.avatar.startsWith('data:image') ? `<img src="${p.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : p.avatar}
          </span>
          <div><div class="post-author">${escapeHtml(p.author)}</div><div class="post-time">${p.time}</div></div>
          <span class="tag">${typeName(p.type)}</span>
        </div>
        <div class="post-title">${escapeHtml(p.title)}${p.hot ? '<span class="hot-badge">🔥热门</span>' : ''}</div>
        <div class="post-content">${escapeHtml(p.content)}</div>
        ${p.image ? `<img class="post-img" src="${p.image}" alt="帖子图片">` : ''}
        <div class="post-actions">
          <span class="pa ${liked.includes(p.id) ? 'on' : ''}" data-ft="like" data-id="${p.id}">👍 <b>${p.likes}</b></span>
          <span class="pa" data-ft="comment" data-id="${p.id}">💬 <b>${p.comments}</b></span>
          <span class="pa ${fished.includes(p.id) ? 'fish-on' : ''}" data-ft="fish" data-id="${p.id}">🐟 <b>${p.fish}</b></span>
          <span class="pa" data-ft="share-post" data-id="${p.id}" style="margin-left:auto">↗ 分享</span>
        </div>
      </div>`).join('');
  }

  function typeName(t) { return { share: '分享', guide: '攻略', qa: '问答', region: '地区' }[t] || t; }

  function bindPostEvents(root) {
    root.querySelectorAll('[data-ft="like"]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id, posts = Store.posts(), liked = Store.liked();
        const p = posts.find(x => x.id === id); if (!p) return;
        if (liked.includes(id)) { p.likes--; Store.saveLiked(liked.filter(x => x !== id)); } 
        else { p.likes++; liked.push(id); Store.saveLiked(liked); if (Store.myPosts().includes(id)) addLikesReceived(1); }
        Store.savePosts(posts); refreshComm();
      });
    });
    root.querySelectorAll('[data-ft="fish"]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id, posts = Store.posts(), fished = Store.fished();
        const p = posts.find(x => x.id === id); if (!p) return;
        if (fished.includes(id)) { App.toast('你已经打赏过这个帖子啦'); return; }
        const u = Store.user();
        if (u.fish < 1) { openVip(); return; }
        u.fish--; p.fish++; Store.saveUser(u); fished.push(id); Store.saveFished(fished);
        Store.savePosts(posts); toast(`打赏成功 🐟 小鱼干×1`); refreshComm();
      });
    });
    root.querySelectorAll('[data-ft="comment"]').forEach(el => el.addEventListener('click', () => toast('评论区演示：正式版接入真实评论系统')));
    root.querySelectorAll('[data-ft="share-post"]').forEach(el => el.addEventListener('click', () => toast('已生成分享卡片')));
  }

  function refreshComm() {
    const el = document.getElementById('page-comm');
    if (current === 'comm') el.innerHTML = `<div class="post-area">${postListHtml()}</div><div class="fab" id="fabPost">＋</div>`;
    renderComm(el);
  }

  /* ================= 独立发帖页面 ================= */
  let postImgData = '';
  let selectedPostType = 'share';

  function renderCreatePost() {
    const el = document.getElementById('page-create-post');
    postImgData = ''; selectedPostType = 'share';
    
    let html = `
      <div class="page-sub" style="padding: 0; height: 100%; display: flex; flex-direction: column; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee;">
          <span style="font-size: 20px; color: #333; cursor: pointer;" onclick="App.switchPage('comm')">✕</span>
          <span style="font-size: 16px; font-weight: 600;">发布新帖子</span>
          <button class="btn primary" id="postSubmit" style="padding: 6px 16px; border-radius: 20px; font-size: 14px;">发布</button>
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 15px 20px;">
          <div class="post-type-row" id="postTypeRow">
            <span class="pt active" data-pt="share">分享</span><span class="pt" data-pt="guide">攻略</span><span class="pt" data-pt="qa">问答</span><span class="pt" data-pt="region">地区</span>
          </div>
          <input class="inp" id="postTitle" placeholder="标题（一句话说清）" style="font-size: 16px; padding: 12px 0; border: none; border-bottom: 1px solid #eee; border-radius: 0; margin-bottom: 10px;">
          <textarea class="inp ta" id="postContent" placeholder="正文：写下你的观鸟经历、经验或问题…" style="border: none; font-size: 15px; padding: 12px 0; min-height: 150px; resize: none; background: transparent;"></textarea>
          <div class="img-row" style="margin-top: 15px;">
            <label class="img-add" for="postImgInput" style="width: 80px; height: 80px; border-radius: 12px;">＋<small>添加图片</small></label>
            <div class="img-preview" id="postImgPreview" style="width: 80px; height: 80px; border-radius: 12px;"></div>
            <input type="file" id="postImgInput" accept="image/*" hidden>
          </div>
        </div>
      </div>`;
    el.innerHTML = replaceIcons(html);

    const typeRow = el.querySelector('#postTypeRow');
    typeRow.querySelectorAll('.pt').forEach(x => {
      x.addEventListener('click', () => { typeRow.querySelectorAll('.pt').forEach(y => y.classList.remove('active')); x.classList.add('active'); selectedPostType = x.dataset.pt; });
    });

    el.querySelector('#postImgInput').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      compressImage(f, data => {
        postImgData = data;
        el.querySelector('#postImgPreview').innerHTML = `<img src="${data}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;"><span class="del" id="delPostImg">✕</span>`;
        el.querySelector('#delPostImg').addEventListener('click', () => { postImgData = ''; el.querySelector('#postImgPreview').innerHTML = ''; });
      });
    });

    el.querySelector('#postSubmit').addEventListener('click', () => submitPost(el));
  }

  function compressImage(file, cb) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxW = 900, scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        cb(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function submitPost(el) {
    const title = el.querySelector('#postTitle').value.trim();
    const content = el.querySelector('#postContent').value.trim();
    if (!title) { toast('请填写标题'); return; }
    const u = Store.user();
    const post = { id: 'u' + Date.now(), type: selectedPostType, author: u.name, avatar: u.avatar, time: '刚刚', title, content, likes: 0, comments: 0, fish: 0, image: postImgData || undefined, hot: false };
    const posts = Store.posts(); posts.unshift(post); Store.savePosts(posts);
    const mine = Store.myPosts(); mine.push(post.id); Store.saveMyPosts(mine);
    addExp(10); toast('发布成功，获得经验+10'); commTab = selectedPostType; App.switchPage('comm'); 
  }

  /* ================= 全屏搜索页 ================= */
  function renderSearch() {
    const el = document.getElementById('page-search');
    let html = `
      <div class="search-header">
        <div class="search-input-wrap">
          <i class="ri-search-line"></i>
          <input type="text" id="searchPageInput" placeholder="搜索用户、鸟种、帖子、地点..." autocomplete="off">
        </div>
        <span class="search-cancel" onclick="App.switchPage('comm')">取消</span>
      </div>
      <div class="search-content" id="searchContent">
        <div id="searchDefaultArea">
          <div class="search-block">
            <div class="search-block-title"><i class="ri-fire-line" style="color:#F44336"></i> 热门搜索</div>
            <div class="hot-tags">
              <span class="hot-tag" onclick="App.doSearch('翠鸟')">翠鸟 <i class="ri-fire-fill"></i></span>
              <span class="hot-tag" onclick="App.doSearch('沙湖')">沙湖</span>
              <span class="hot-tag" onclick="App.doSearch('长焦镜头')">长焦镜头</span>
              <span class="hot-tag" onclick="App.doSearch('老周')">老周</span>
              <span class="hot-tag" onclick="App.doSearch('白鹭')">白鹭</span>
            </div>
          </div>
        </div>
        <div id="searchResultArea" style="display:none;"></div>
      </div>
    `;
    el.innerHTML = replaceIcons(html);
    const input = el.querySelector('#searchPageInput');
    const defaultArea = el.querySelector('#searchDefaultArea');
    const resultArea = el.querySelector('#searchResultArea');
    input.addEventListener('input', (e) => {
      const kw = e.target.value.trim();
      if (!kw) { defaultArea.style.display = 'block'; resultArea.style.display = 'none'; return; }
      defaultArea.style.display = 'none'; resultArea.style.display = 'block'; executeSearch(kw, resultArea);
    });
    setTimeout(() => input.focus(), 100);
  }

  function doSearch(kw) {
    const input = document.getElementById('searchPageInput');
    if (input) { input.value = kw; input.dispatchEvent(new Event('input')); }
  }

  function executeSearch(kw, container) {
    let html = ''; const lowerKw = kw.toLowerCase();
    const users = RANK_SEED.filter(u => u.name.toLowerCase().includes(lowerKw));
    if (users.length) {
      html += `<div class="search-block"><div class="search-block-title"><i class="ri-user-line"></i> 相关用户</div>`;
      html += users.map(u => `<div class="res-card" onclick="App.viewUserProfile('${u.name}')"><div class="res-icon">${u.icon}</div><div class="res-info"><div class="res-title">${u.name}</div><div class="res-desc">累计观鸟 ${u.birds} 种 · 获赞 ${u.likes}</div></div></div>`).join('');
      html += `</div>`;
    }
    const birds = BIRDS.filter(b => b.name.toLowerCase().includes(lowerKw) || b.features.toLowerCase().includes(lowerKw));
    if (birds.length) {
      html += `<div class="search-block"><div class="search-block-title"><i class="ri-bird-line"></i> 鸟类百科</div>`;
      html += birds.map(b => `<div class="res-card" onclick="App.openBird('${b.id}')"><div class="res-icon" style="background:${b.color}22;color:${b.color}">${b.name[0]}</div><div class="res-info"><div class="res-title">${b.name}</div><div class="res-desc">${b.group} · ${b.rarity}</div></div></div>`).join('');
      html += `</div>`;
    }
    const spots = SPOTS.filter(s => s.name.toLowerCase().includes(lowerKw) || s.env.includes(lowerKw));
    if (spots.length) {
      html += `<div class="search-block"><div class="search-block-title"><i class="ri-map-pin-line"></i> 观测地点</div>`;
      html += spots.map(s => `<div class="res-card" onclick="App.gotoSpotOnMap('${s.id}')"><div class="res-icon" style="background:#E3F2FD;color:#1E88E5"><i class="ri-map-pin-line"></i></div><div class="res-info"><div class="res-title">${s.name}</div><div class="res-desc">${s.env} · ${s.level} · ${s.uploads}条记录</div></div></div>`).join('');
      html += `</div>`;
    }
    const posts = Store.posts().filter(p => p.title.toLowerCase().includes(lowerKw) || p.content.toLowerCase().includes(lowerKw));
    if (posts.length) {
      html += `<div class="search-block"><div class="search-block-title"><i class="ri-article-line"></i> 交流帖子</div>`;
      html += posts.slice(0, 5).map(p => `<div class="res-card" onclick="App.toast('跳转到帖子详情（演示）')"><div class="res-icon" style="background:#FFF3E0;color:#FB8C00"><i class="ri-article-line"></i></div><div class="res-info"><div class="res-title">${escapeHtml(p.title)}</div><div class="res-desc">${escapeHtml(p.content).slice(0, 20)}...</div></div></div>`).join('');
      html += `</div>`;
    }
    if (!html) html = `<div class="empty"><div class="e">🔍</div>没有找到与“${escapeHtml(kw)}”相关的内容</div>`;
    container.innerHTML = replaceIcons(html);
  }

  function gotoSpotOnMap(spotId) {
    const spot = SPOTS.find(s => s.id === spotId);
    if (!spot) return;
    MapView.state.center = { lat: spot.lat, lng: spot.lng };
    MapView.state.tab = 'near'; 
    switchPage('map');
    setTimeout(() => { MapView.openSpot(spotId); }, 300);
  }

  /* ================= 用户资料 ================= */
  function viewUserProfile(authorName) {
    if (authorName === Store.user().name) { switchPage('mine'); return; }
    currentProfileName = authorName;
    switchPage('user-profile');
  }

  function renderUserProfile(authorName) {
    if (!authorName) return;
    const el = document.getElementById('page-user-profile');
    const userPosts = Store.posts().filter(p => p.author === authorName);
    const userObj = RANK_SEED.find(r => r.name === authorName) || { name: authorName, icon: '🐦', birds: 0, likes: 0 };
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('comm')">← 返回交流</div>
      <div class="card" style="display:flex; align-items:center; gap:15px;">
        <div style="width:60px; height:60px; border-radius:50%; background:var(--green-light); display:flex; justify-content:center; align-items:center; font-size:30px;">${userObj.icon}</div>
        <div><div style="font-size:18px; font-weight:700;">${escapeHtml(userObj.name)}</div><div style="font-size:12px; color:var(--text2); margin-top:5px;">累计观鸟：🐦 ${userObj.birds} 种 · 获赞：👍 ${userObj.likes}</div></div>
      </div>
      <div class="section-title" style="margin:15px 0 8px 0;">TA的帖子 (${userPosts.length})</div><div class="spot-list">`;
    if (userPosts.length) {
      userPosts.forEach(p => { html += `<div class="spot-item"><div class="spot-name">📝 ${escapeHtml(p.title)}</div><div class="spot-meta"><span>${p.time}</span><span>👍 ${p.likes}</span></div></div>`; });
    } else { html += `<div class="empty"><div class="e">📝</div>该用户暂无帖子</div>`; }
    html += `</div></div>`;
    el.innerHTML = replaceIcons(html);
  }

  /* ================= 成就 / 进度 ================= */
  function addLikesReceived(n) { const u = Store.user(); u.likesReceived += n; Store.saveUser(u); addExp(n); }
  function addExp(n) {
    const u = Store.user(); u.exp += n;
    while (u.exp >= u.level * 100) { u.exp -= u.level * 100; u.level++; toast(`🎉 升级！当前等级 Lv.${u.level}`); }
    Store.saveUser(u);
  }
  function collectBird(id) {
    const list = Store.birds();
    if (!list.includes(id)) { list.push(id); Store.saveBirds(list); addExp(5); const b = birdById(id); toast(`已收录「${b.name}」+5经验`); }
  }
  function achieveState() {
    const u = Store.user(); const birds = Store.birds().length, likes = u.likesReceived, posts = Store.myPosts().length;
    return ACHIEVEMENTS.map(a => {
      let cur = 0;
      if (a.id === 'a1' || a.id === 'a2' || a.id === 'a3' || a.id === 'a4') cur = birds;
      if (a.id === 'a5' || a.id === 'a6' || a.id === 'a7') cur = likes;
      if (a.id === 'a8') cur = posts;
      if (a.id === 'a9') { const mineLikes = Store.posts().filter(p => Store.myPosts().includes(p.id)).map(p => p.likes); cur = mineLikes.length ? Math.max(...mineLikes) : 0; }
      return { ...a, cur: Math.min(cur, a.target), done: cur >= a.target, pct: Math.min(100, Math.round(cur / a.target * 100)) };
    });
  }

  function renderProgress(el) {
    const u = Store.user(); const ach = achieveState(); const doneCount = ach.filter(a => a.done).length; const expNeed = u.level * 100;
    let html = `
      <div class="level-card">
        <div style="font-size:12px;opacity:.85">观鸟达人 · 等级</div><div class="level-big">Lv.${u.level}</div>
        <div class="level-row"><span>${u.exp}/${expNeed} 经验</span><div class="level-bar"><i style="width:${u.exp / expNeed * 100}%"></i></div><span>距升级还需 ${expNeed - u.exp}</span></div>
      </div>
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="card-title" style="margin-bottom:2px">🏅 成就徽章 ${doneCount}/${ACHIEVEMENTS.length}</div><div class="card-sub">达成成就解锁徽章</div></div><div style="font-size:30px">${doneCount >= 3 ? '🎖️' : '🏅'}</div>
      </div>
      <div class="section-title">📊 成就进度</div>
      <div class="spot-list">${ach.map(a => `<div class="ach-card"><div class="ach-icon ${a.done ? '' : 'locked'}">${a.icon}</div><div class="ach-info"><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div><div class="ach-progress"><i style="width:${a.pct}%"></i></div></div><div class="ach-state">${a.done ? '✓ 已解锁' : `${a.cur}/${a.target}`}</div></div>`).join('')}</div>
      <div class="section-title">🏆 观鸟排名</div><div class="spot-list">${rankRows()}</div>`;
    el.innerHTML = replaceIcons(html);
  }

  function rankRows() {
    const u = Store.user();
    const rows = [...RANK_SEED].map((r, i) => ({ ...r, rank: i + 1, me: false }));
    rows.push({ name: u.name, birds: Store.birds().length, likes: u.likesReceived, icon: u.avatar, rank: 6, me: true });
    rows.sort((a, b) => b.birds - a.birds || b.likes - a.likes);
    return rows.map((r, i) => `<div class="rank-row" style="${r.me ? 'border:1.5px solid var(--green);background:var(--green-light)' : ''}"><span class="rank-no ${i < 3 ? 'top' : ''}">${i + 1}</span><span class="rank-icon">${r.icon}</span><span class="rank-name">${escapeHtml(r.name)}${r.me ? ' <small style="color:var(--green)">(我)</small>' : ''}</span><span class="rank-num">🐦${r.birds}</span><span class="rank-num">👍${r.likes}</span></div>`).join('');
  }

  /* ================= 售卖 ================= */
  function renderShop(el) {
    let html = `<div class="card" style="background:linear-gradient(135deg,#FFF8E1,#FFECB3)"><div class="card-title" style="color:#B26A00">🎯 观鸟装备 · 精准推荐</div><div class="card-sub" style="color:#8D6E63">AI 推荐适配装备，点击跳转平台购买。</div></div>
      <div class="section-title">🛒 推荐装备</div>
      <div class="spot-list">${GEAR.map(g => `<div class="gear-card"><div class="gear-img">🔭</div><div class="gear-info"><div class="gear-name">${g.name}</div><div class="gear-brand">${g.brand} · ${g.rec}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span class="gear-price">${g.price}</span><a class="gear-link" href="#" target="_blank">去购买 →</a></div></div></div>`).join('')}</div>`;
    el.innerHTML = replaceIcons(html);
  }

  /* ================= 信息 ================= */
  function renderMsg(el) {
    const msgs = [
      { icon: '📢', name: 'Feather Trace 官方', text: '欢迎加入观鸟社区！', time: '10:02' },
      { icon: '🔭', name: '镜头里的风', text: '回复了你的帖子："沙湖翠鸟可以试试下午4点去"', time: '09:41' }
    ];
    let html = `<div class="section-title">📬 私信与通知</div><div class="spot-list">`;
    html += msgs.map(m => `<div class="msg-item"><span class="msg-avatar">${m.icon}</span><div class="msg-info"><div class="msg-name">${m.name}</div><div class="msg-text">${m.text}</div></div><span class="msg-time">${m.time}</span></div>`).join('');
    el.innerHTML = replaceIcons(html + `</div>`);
  }

  /* ================= 我的 ================= */
  function renderMine(el) {
    const u = Store.user(); const birds = Store.birds(), posts = Store.myPosts();
    const myPosts = Store.posts().filter(p => posts.includes(p.id));
    const ach = achieveState().filter(a => a.done);
    let html = `
      <div class="mine-head" style="cursor: pointer;" onclick="App.switchPage('edit-profile')">
        <span class="avatar">${u.avatar && u.avatar.startsWith('data:image') ? `<img src="${u.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : u.avatar}</span>
        <div><div class="mine-name">${escapeHtml(u.name)}</div><div class="mine-code">账号码 ${u.code}</div><span class="mine-vip">${u.isVip ? '👑 VIP 会员' : '开通 VIP →'}</span></div>
      </div>
      <div class="mine-stats">
        <div class="ms"><b>${birds.length}</b><span>收录鸟种</span></div><div class="ms"><b>${myPosts.length}</b><span>我的帖子</span></div><div class="ms"><b>${u.likesReceived}</b><span>累计获赞</span></div><div class="ms"><b>Lv.${u.level}</b><span>等级</span></div>
      </div>
      <div class="mine-menu">
        <div class="menu-item" onclick="App.switchPage('my-birds')"><span><span class="mi">🐦</span>我的鸟种收藏（${birds.length}种）</span><span class="arrow">›</span></div>
        <div class="menu-item" onclick="App.switchPage('my-badges')"><span><span class="mi">🏅</span>我的徽章（${ach.length}个）</span><span class="arrow">›</span></div>
        <div class="menu-item" onclick="App.switchPage('offline')"><span><span class="mi">📴</span>离线包管理</span><span class="arrow">›</span></div>
        <div class="menu-item" onclick="App.switchPage('edit-profile')"><span><span class="mi">✏️</span>编辑资料</span><span class="arrow">›</span></div>
      </div>
      <div class="section-title">📄 我的帖子</div>
      <div class="post-area">${myPosts.length ? myPosts.map(p => `<div class="post-card"><div class="post-title">${escapeHtml(p.title)}</div><div class="post-content">${escapeHtml(p.content)}</div></div>`).join('') : '<div class="empty">还没有发过帖子</div>'}</div>`;
    el.innerHTML = replaceIcons(html);
  }

  function renderMyBirds() {
    const el = document.getElementById('page-my-birds');
    const birds = Store.birds().map(birdById).filter(Boolean);
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>`;
    html += birds.length ? `<div class="ai-cards">${birds.map(b => `<div class="ai-card" onclick="App.openBird('${b.id}')"><div class="t">${b.name}</div><div class="d">${b.group}</div></div>`).join('')}</div>` : `<div class="empty">暂无收藏</div>`;
    el.innerHTML = replaceIcons(html + `</div>`);
  }

  function renderMyBadges() {
    const el = document.getElementById('page-my-badges');
    const ach = achieveState();
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div><div class="section-title">🏅 我的徽章</div><div class="spot-list">`;
    ach.forEach(a => { html += `<div class="ach-card"><div class="ach-icon ${a.done ? '' : 'locked'}">${a.icon}</div><div class="ach-info"><div class="ach-name">${a.name}</div></div><div class="ach-state">${a.done ? '✓' : ''}</div></div>`; });
    el.innerHTML = replaceIcons(html + `</div></div>`);
  }

  function renderOfflinePage() {
    const el = document.getElementById('page-offline');
    el.innerHTML = replaceIcons(`<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div><div class="card"><div class="card-title">📴 离线包管理</div><div class="card-sub">本应用完全支持离线使用。</div></div></div>`);
  }

  function renderEditProfile() {
    const el = document.getElementById('page-edit-profile');
    const u = Store.user();
    const isImg = u.avatar && (u.avatar.startsWith('data:image') || u.avatar.startsWith('http'));
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
      <div class="card"><div class="card-title">编辑资料</div>
      <div style="display:flex; justify-content:center; margin-bottom:15px;">
        <div style="width:80px; height:80px; border-radius:50%; background:var(--green-light); display:flex; justify-content:center; align-items:center; overflow:hidden; cursor:pointer;" onclick="document.getElementById('avatarUpload').click()">
          ${isImg ? `<img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size:40px;">${u.avatar}</span>`}
        </div>
        <input type="file" id="avatarUpload" accept="image/*" style="display:none;" onchange="App.handleAvatarUpload(this)">
      </div>
      <div style="text-align:center; font-size:12px; color:#888; margin-bottom:15px;">点击头像上传照片</div>
      <input class="inp" id="editName" value="${escapeHtml(u.name)}" placeholder="昵称">
      <button class="btn primary block" id="saveProfile">保存</button></div></div>`;
    el.innerHTML = replaceIcons(html);
    
    el.querySelector('#saveProfile').addEventListener('click', () => {
      const name = el.querySelector('#editName').value.trim();
      if (name) u.name = name;
      Store.saveUser(u); toast('资料已更新'); switchPage('mine');
    });
  }
  
  function handleAvatarUpload(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxW = 200, scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const u = Store.user(); u.avatar = canvas.toDataURL('image/jpeg', 0.8);
        Store.saveUser(u); toast('头像上传成功'); renderEditProfile();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ================= 弹窗 / 鸟种 ================= */
  function openVip() {
    const u = Store.user();
    const html = `<div class="vip-hero"><div class="t">👑 Feather Trace VIP</div><div class="s">解锁全部能力</div></div>
      <div class="vip-item"><span class="vi">🧠</span><span>高级 AI 识别</span></div>
      <div class="vip-item"><span class="vi">🗺️</span><span>离线包下载</span></div>
      <button class="btn primary block mt12" onclick="closeModal('modalVip')">关闭</button>`;
    document.getElementById('vipBody').innerHTML = replaceIcons(html);
    document.getElementById('modalVip').classList.add('show');
  }

  function openModal(modalId, title, bodyHtml) {
    const m = document.getElementById(modalId);
    m.querySelector('.modal-head span').textContent = title;
    m.querySelector('.modal-body').innerHTML = bodyHtml;
    m.classList.add('show');
  }

  function openBird(id) {
    const b = birdById(id); if (!b) return;
    collectBird(id);
    const html = `
      <div class="bird-hero"><span class="avatar" style="background:${b.color}22;color:${b.color}">${b.name[0]}</span><div><div class="bird-name">${b.name}</div><div class="bird-latin">${b.latin}</div></div></div>
      <div class="info-block"><b>识别要点</b>：${b.features}</div>
      <div class="info-block"><b>栖息环境</b>：${b.habitat}</div>
      <div class="gear-ad"><div class="ga-title">🎯 装备推荐</div><div>建议使用「${b.equipment}」</div></div>
      <button class="btn ghost block mt12" onclick="closeModal('modalBird'); App.switchPage('ai');">🤖 去问 AI</button>`;
    openModal('modalBird', `${b.name} · 档案`, replaceIcons(html));
  }

  /* ================= 初始化 ================= */
  function init() {
    const topSearchBtn = document.getElementById('topSearchBtn');
    if (topSearchBtn) topSearchBtn.addEventListener('click', () => App.switchPage('search'));

    const now = new Date();
    document.getElementById('sbTime').textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    setInterval(() => {
      const n = new Date();
      document.getElementById('sbTime').textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    }, 30000);

    document.querySelectorAll('.top-tabs .tab').forEach(el => el.addEventListener('click', () => switchPage(el.dataset.tab)));
    document.querySelectorAll('.bottom-nav .nav-item').forEach(el => el.addEventListener('click', () => switchPage(el.dataset.tab === 'home' ? 'comm' : el.dataset.tab)));
    
    // 监听弹窗遮罩点击关闭
    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); }));

    // 启动初始页面
    const h = location.hash.replace('#', '');
    if (['comm', 'map', 'ai', 'progress', 'shop', 'msg', 'mine'].includes(h)) switchPage(h);
    else switchPage('comm');
  }

  return { init, switchPage, renderCurrent, toast, collectBird, openBird, openVip, birdById, viewUserProfile, handleAvatarUpload, doSearch, gotoSpotOnMap };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
