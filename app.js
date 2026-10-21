/* ============================================================
 * Feather Trace —— 主逻辑
 * ============================================================ */

  let currentChatUser = '';

// 图标映射表
const ICON_MAP = {
  '🐦': '<i class="ri-bird-line"></i>',
  '🏅': '<i class="ri-medal-line"></i>',
  '👍': '<i class="ri-thumb-up-line"></i>',
  '📍': '<i class="ri-map-pin-line"></i>',
  '📝': '<i class="ri-article-line"></i>',
  '🐟': '<i class="ri-coin-line"></i>',
  '📴': '<i class="ri-wifi-off-line"></i>',
  '👑': '<i class="ri-vip-crown-line"></i>',
  '🗑️': '<i class="ri-delete-bin-line"></i>',
  '✏️': '<i class="ri-pencil-line"></i>',
  '🔭': '<i class="ri-eye-line"></i>',
  '🧥': '<i class="ri-shirt-line"></i>',
  '📖': '<i class="ri-book-open-line"></i>',
  '🦆': '<i class="ri-bird-line"></i>',
  '🌿': '<i class="ri-leaf-line"></i>',
  '🌳': '<i class="ri-plant-line"></i>',
  '📷': '<i class="ri-camera-line"></i>',
  '🧢': '<i class="ri-user-smile-line"></i>',
  '🦜': '<i class="ri-bird-line"></i>',
  '🦅': '<i class="ri-bird-line"></i>',
  '🦉': '<i class="ri-bird-line"></i>',
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
  let currentPostId = '';

// 记录上次查看消息的时间，防止旧消息一直触发红点
  let lastCheckTime = new Date().toISOString();
  function showRedDot() {
    const dot = document.getElementById('msgRedDot');
    if (dot && current !== 'msg' && current !== 'chat-detail') {
      dot.classList.add('show');
    }
  }

  // 隐藏红点
  function hideRedDot() {
    const dot = document.getElementById('msgRedDot');
    if (dot) dot.classList.remove('show');
  }
  
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
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
    else if (['my-birds', 'my-badges', 'offline', 'edit-profile', 'user-profile', 'create-post', 'search', 'settings', 'history', 'favorites', 'follow-list', 'fans-list', 'post-detail', 'chat-detail'].includes(p)) pageId = 'page-' + p;
    
    const targetEl = document.getElementById(pageId);
    if (targetEl) targetEl.classList.add('active');
    
    // 更新顶部 Tab 的高亮状态
    document.querySelectorAll('.top-tabs .tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === p && TOP_TABS.includes(p));
    });
    
    // 更新底部 Tab 的高亮状态
    document.querySelectorAll('.bottom-nav .nav-item').forEach(el => {
      const tab = el.dataset.tab;
      let active = false;
      if (tab === 'home') active = TOP_TABS.includes(p) || p === 'comm';
      else if (tab === 'mine') active = ['mine', 'my-birds', 'my-badges', 'offline', 'edit-profile', 'settings', 'history', 'favorites', 'follow-list'].includes(p);
      else active = tab === p;
      el.classList.toggle('active', active);
    });
    
    // 👇 【强制控制顶栏和底栏】
    const topTabs = document.querySelector('.top-tabs-wrapper');
    const bottomNav = document.querySelector('.bottom-nav');
    
    // 隐藏底栏（只在深层页面隐藏）
    if (['search', 'settings', 'history', 'favorites', 'follow-list', 'fans-list', 'post-detail', 'create-post', 'edit-profile', 'chat-detail'].includes(p)) {
      if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important');
    } else {
      if (bottomNav) bottomNav.style.setProperty('display', 'flex', 'important');
    }

    // 隐藏顶栏（只在四个主页面显示，其余全隐藏）
    if (['comm', 'map', 'ai', 'progress'].includes(p)) {
      if (topTabs) topTabs.style.setProperty('display', 'flex', 'important');
    } else {
      if (topTabs) topTabs.style.setProperty('display', 'none', 'important');
    }
    
    renderCurrent();
  }

  // 记录浏览轨迹
  function addHistory(type, id, title, desc) {
    let history = Store.history() || [];
    // 去重：如果看过了，就把旧的删掉，让最新的排在前面
    history = history.filter(item => !(item.type === type && item.id === id));
    
    // 获取当前时间
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

    history.unshift({ type, id, title, desc, time: `今天 ${timeStr}` });
    // 最多只保留 20 条记录
    if (history.length > 20) history = history.slice(0, 20);
    
    Store.saveHistory(history);
  }
  
    function renderCurrent() {
    const containerId = TOP_TABS.includes(current) ? 'page-' + current : 'page-comm';
    const el = document.getElementById(containerId);
    
    // 👇 确保这里是 if 开头，而不是直接写 else if
    if (current === 'comm') renderComm(el);
    else if (current === 'map') { MapView.render(el); MapView.useGeolocation(); }
    else if (current === 'ai') AI.render(el);
    else if (current === 'progress') renderProgress(el);
    else if (current === 'shop') renderShop(el);
    else if (current === 'msg') { 
      hideRedDot(); 
      lastCheckTime = new Date().toISOString(); 
      renderMsg(el); 
    }
    else if (current === 'mine') renderMine(el);
    else if (current === 'my-birds') renderMyBirds();
    else if (current === 'my-badges') renderMyBadges();
    else if (current === 'offline') renderOfflinePage();
    else if (current === 'edit-profile') renderEditProfile();
    else if (current === 'user-profile') renderUserProfile(currentProfileName);
    else if (current === 'create-post') renderCreatePost();
    else if (current === 'search') renderSearch();
    else if (current === 'settings') renderSettings();
    else if (current === 'history') renderHistory();
    else if (current === 'favorites') renderFavorites();
    else if (current === 'follow-list') renderFollowList();
    else if (current === 'fans-list') renderFansList(); 
    else if (current === 'post-detail') renderPostDetail();
    else if (current === 'chat-detail') renderChatDetail();
  }

  /* ================= 交流区 ================= */
  let commTab = 'follow';

  async function renderComm(el) {
    if (typeof DB !== 'undefined') {
     try {
        const cloudPosts = await DB.getPosts();
        console.log("🔍 从云端拉取的帖子数量:", cloudPosts.length); // 看看控制台打印了几条
        const seedPosts = typeof SEED_POSTS !== 'undefined' ? SEED_POSTS : [];
        
        // 云端真实帖子放前面，最初的虚拟帖子放后面。绝不去碰 Store 里的旧数据！
        Store.savePosts([...cloudPosts, ...seedPosts]);
      } catch (e) {
        console.error("拉取帖子失败", e);
      }
    }
    const tabs = [
      ['follow', '关注'], ['region', '地区'], ['guide', '攻略'], ['share', '分享'], ['qa', '问答']
    ];
    let html = `<div class="page-head">${tabs.map(t => `<div class="ptab ${commTab === t[0] ? 'active' : ''}" data-ft="comm-tab" data-v="${t[0]}">${t[1]}</div>`).join('')}</div>`;
    html += `<div class="post-area" id="postArea">${postListHtml()}</div>`;
    html += `<div class="fab" id="fabPost">＋</div>`;
    el.innerHTML = replaceIcons(html);
    el.querySelectorAll('[data-ft="comm-tab"]').forEach(x =>
      x.addEventListener('click', () => { commTab = x.dataset.v; renderComm(el); })
    );
    el.querySelector('#fabPost').addEventListener('click', () => App.switchPage('create-post'));
    bindPostEvents(el);
  }

   function postListHtml() {
    const posts = Store.posts();
    let list;
    if (commTab === 'follow') list = [...posts].sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || b.likes - a.likes);
    else list = posts.filter(p => p.type === commTab);
    if (!list.length) return `<div class="empty"><div class="e">🪶</div>还没有帖子，点击右下角＋发布第一帖吧！</div>`;
    const liked = Store.liked(), fished = Store.fished(), saved = Store.savedPosts() || [];
    
    return list.map(p => `
      <!-- 👇 加了 onclick 跳转详情 -->
      <div class="post-card" onclick="App.openPostDetail('${p.id}')" style="cursor:pointer;">
        <div class="post-head">
          <span class="avatar" onclick="event.stopPropagation(); App.viewUserProfile('${escapeHtml(p.author)}')">
            ${p.avatar && p.avatar.startsWith('data:image') ? `<img src="${p.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : p.avatar}
          </span>
          <div><div class="post-author">${escapeHtml(p.author)}</div><div class="post-time">${p.time}</div></div>
          <span class="tag">${typeName(p.type)}</span>
        </div>
        <div class="post-title">${escapeHtml(p.title)}${p.hot ? '<span class="hot-badge">🔥热门</span>' : ''}</div>
        <div class="post-content">${escapeHtml(p.content)}</div>
        ${p.image ? `<img class="post-img" src="${p.image}" alt="帖子图片">` : ''}
        
        <div class="post-actions">
          <span class="pa ${liked.includes(p.id) ? 'on' : ''}" onclick="event.stopPropagation(); App.toggleLike('${p.id}', this)">👍 <b>${p.likes}</b></span>
          <span class="pa">💬 <b>${p.comments}</b></span>
          <span class="pa ${fished.includes(p.id) ? 'fish-on' : ''}" onclick="event.stopPropagation(); App.toggleFish('${p.id}', this)">🐟 <b>${p.fish}</b></span>
          <!-- 👇 新增收藏按钮 -->
          <span class="pa ${saved.includes(p.id) ? 'on' : ''}" onclick="event.stopPropagation(); App.toggleSave('${p.id}', this)" style="margin-left:auto;">
            ${saved.includes(p.id) ? '⭐' : '☆'} 收藏
          </span>
        </div>
      </div>`).join('');
  }

  function typeName(t) {
    return { share: '分享', guide: '攻略', qa: '问答', region: '地区' }[t] || t;
  }

  function bindPostEvents(root) {
    root.querySelectorAll('[data-ft="like"]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id, posts = Store.posts(), liked = Store.liked();
        const p = posts.find(x => x.id === id); if (!p) return;
        if (liked.includes(id)) {
          p.likes--; Store.saveLiked(liked.filter(x => x !== id));
        } else {
          p.likes++; liked.push(id); Store.saveLiked(liked);
          if (Store.myPosts().includes(id)) addLikesReceived(1);
        }
        Store.savePosts(posts);
        refreshComm();
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
        Store.savePosts(posts);
        toast(`打赏成功 🐟 小鱼干×1（平台抽成10%，作者获得0.9）`);
        refreshComm();
      });
    });
    root.querySelectorAll('[data-ft="comment"]').forEach(el => {
      el.addEventListener('click', () => toast('评论区演示：正式版接入真实评论系统（数据存云端）'));
    });
    root.querySelectorAll('[data-ft="share-post"]').forEach(el => {
      el.addEventListener('click', () => {
        const p = postsFind(el.dataset.id);
        toast('已生成分享卡片：' + (p ? p.title : ''));
      });
    });
  }

  function postsFind(id) { return Store.posts().find(x => x.id === id); }
  function refreshComm() {
    const el = document.getElementById('page-comm');
    if (current === 'comm') el.innerHTML = `<div class="post-area">${postListHtml()}</div><div class="fab" id="fabPost">＋</div>`;
    renderComm(el);
  }

  /* ---- 独立发帖页面 ---- */
  let postImgData = '';
  let selectedPostType = 'share';

  function renderCreatePost() {
    const el = document.getElementById('page-create-post');
    postImgData = '';
    selectedPostType = 'share';
    
    let html = `
      <div class="page-sub" style="padding: 0; height: 100%; display: flex; flex-direction: column; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee;">
          <span style="font-size: 20px; color: #333; cursor: pointer;" onclick="App.switchPage('comm')">✕</span>
          <span style="font-size: 16px; font-weight: 600;">发布新帖子</span>
          <button class="btn primary" id="postSubmit" style="padding: 6px 16px; border-radius: 20px; font-size: 14px;">发布</button>
        </div>
        
        <div style="flex: 1; overflow-y: auto; padding: 15px 20px;">
          <div class="post-type-row" id="postTypeRow">
            <span class="pt active" data-pt="share">分享</span>
            <span class="pt" data-pt="guide">攻略</span>
            <span class="pt" data-pt="qa">问答</span>
            <span class="pt" data-pt="region">地区</span>
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
    el.innerHTML = html;

    const typeRow = el.querySelector('#postTypeRow');
    typeRow.querySelectorAll('.pt').forEach(x => {
      x.addEventListener('click', () => {
        typeRow.querySelectorAll('.pt').forEach(y => y.classList.remove('active'));
        x.classList.add('active');
        selectedPostType = x.dataset.pt;
      });
    });

    el.querySelector('#postImgInput').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      compressImage(f, data => {
        postImgData = data;
        el.querySelector('#postImgPreview').innerHTML = `<img src="${data}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;"><span class="del" id="delPostImg">✕</span>`;
        el.querySelector('#delPostImg').addEventListener('click', () => {
          postImgData = ''; el.querySelector('#postImgPreview').innerHTML = '';
        });
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

      async function submitPost(el) { // 👈 加上 async
    const title = el.querySelector('#postTitle').value.trim();
    const content = el.querySelector('#postContent').value.trim();
    if (!title) { toast('请填写标题'); return; }
    
    const u = Store.user();
    const post = {
      id: 'u' + Date.now(), type: selectedPostType, author: u.name, avatar: u.avatar, time: '刚刚',
      title, content, likes: 0, comments: 0, fish: 0, image: postImgData || undefined, hot: false, realComments: []
    };
    
    const posts = Store.posts(); 
    posts.unshift(post); 
    Store.savePosts(posts);
    
    const mine = Store.myPosts(); 
    mine.push(post.id); 
    Store.saveMyPosts(mine);

    // 👇 核心修改：先把数据发到云端，测试是否成功
    if (typeof DB !== 'undefined') {
      toast('正在同步到云端...');
      try {
        const res = await DB.savePost(post); // 👈 加上 await
        if (res) {
          console.log("✅ 云端发帖成功", res);
          toast('云端同步成功！');
        } else {
          console.error("❌ 云端发帖返回空");
          toast('云端同步失败，请检查权限');
        }
      } catch (err) {
        console.error("❌ 云端发帖异常", err);
        toast('网络异常，仅保存在本地');
      }
    } else {
      console.error("DB 对象不存在！请检查 bmob.js");
    }
    
    addExp(10);
    
    // 👇 智能检测未收录鸟种
    const textToScan = title + content;
    const collected = Store.birds() || [];
    let newBirds = [];
    BIRDS.forEach(b => {
      if (textToScan.includes(b.name) && !collected.includes(b.id)) {
        newBirds.push(b);
      }
    });
    if (newBirds.length > 0) {
      const names = newBirds.map(b => b.name).join('、');
      if (confirm(`🐦 智能识别：您的帖子提到了「${names}」，检测到您还未收录。是否一键收录？`)) {
        newBirds.forEach(b => collectBird(b.id));
      }
    }

    toast('发布成功，获得经验+10');
    commTab = selectedPostType; 
    App.switchPage('comm'); 
  }

  /* ================= 全屏搜索页 ================= */
  function renderSearch() {
    const el = document.getElementById('page-search');
    if (!el) return;
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
            <div class="search-block-title">🔥 热门搜索</div>
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
    el.innerHTML = html;

    const input = el.querySelector('#searchPageInput');
    const defaultArea = el.querySelector('#searchDefaultArea');
    const resultArea = el.querySelector('#searchResultArea');

    input.addEventListener('input', (e) => {
      const kw = e.target.value.trim();
      if (!kw) {
        defaultArea.style.display = 'block';
        resultArea.style.display = 'none';
        return;
      }
      defaultArea.style.display = 'none';
      resultArea.style.display = 'block';
      executeSearch(kw, resultArea);
    });

    setTimeout(() => input.focus(), 100);
  }

  function doSearch(kw) {
    const input = document.getElementById('searchPageInput');
    if (input) {
      input.value = kw;
      input.dispatchEvent(new Event('input'));
    }
  }

  async function executeSearch(kw, container) {
    let html = '';
    const lowerKw = kw.toLowerCase();

    // 搜用户（本地 + 云端）
    let users = RANK_SEED.filter(u => u.name.toLowerCase().includes(lowerKw));
    
    // 调用云端搜索！真正去数据库里捞你另一个手机注册的号
    try {
      if (typeof DB !== 'undefined') {
        const cloudUsers = await DB.searchUser(kw);
        // 把云端搜出来的用户，合并到本地结果里
        cloudUsers.forEach(cu => {
          if (!users.find(u => u.name === cu.username)) {
            users.push({ name: cu.username, icon: '👤', birds: 0, likes: 0, isCloud: true });
          }
        });
      }
    } catch (e) {
      console.log("云端搜索失败", e);
    }
    if (users.length) {
      html += `<div class="search-block"><div class="search-block-title">👤 相关用户</div>`;
      html += users.map(u => `
        <div class="res-card" onclick="App.viewUserProfile('${u.name}')" style="display:flex; align-items:center; gap:10px;">
          <div class="res-icon">${u.icon}</div>
          <div class="res-info" style="flex:1;">
            <div class="res-title">${u.name}</div>
            <div class="res-desc">累计观鸟 ${u.birds} 种 · 获赞 ${u.likes}</div>
          </div>
          <button class="btn ghost" style="padding: 6px 12px; font-size: 12px; border-radius: 20px; flex-shrink: 0;" onclick="event.stopPropagation(); App.openChat('${u.name}')">发消息</button>
        </div>
      `).join('');
      html += `</div>`;
    }

    // 2. 搜鸟种
    const birds = BIRDS.filter(b => b.name.toLowerCase().includes(lowerKw) || b.features.toLowerCase().includes(lowerKw));
    if (birds.length) {
      html += `<div class="search-block"><div class="search-block-title">🐦 鸟类百科</div>`;
      html += birds.map(b => `
        <div class="res-card" onclick="App.openBird('${b.id}')">
          <div class="res-icon" style="background:${b.color}22;color:${b.color}">${b.name[0]}</div>
          <div class="res-info">
            <div class="res-title">${b.name}</div>
            <div class="res-desc">${b.group} · ${b.rarity}</div>
          </div>
        </div>
      `).join('');
      html += `</div>`;
    }

    // 3. 搜地点 (观测点)
    const spots = SPOTS.filter(s => s.name.toLowerCase().includes(lowerKw) || s.env.includes(lowerKw));
    if (spots.length) {
      html += `<div class="search-block"><div class="search-block-title">📍 观测地点</div>`;
      html += spots.map(s => `
        <div class="res-card" onclick="App.gotoSpotOnMap('${s.id}')">
          <div class="res-icon" style="background:#E3F2FD;color:#1E88E5"><i class="ri-map-pin-line"></i></div>
          <div class="res-info">
            <div class="res-title">${s.name}</div>
            <div class="res-desc">${s.env} · ${s.level} · ${s.uploads}条记录</div>
          </div>
        </div>
      `).join('');
      html += `</div>`;
    }

    // 4. 搜帖子
    const posts = Store.posts().filter(p => p.title.toLowerCase().includes(lowerKw) || p.content.toLowerCase().includes(lowerKw));
    if (posts.length) {
      html += `<div class="search-block"><div class="search-block-title">📝 交流帖子</div>`;
      html += posts.slice(0, 5).map(p => `
        <div class="res-card" onclick="App.toast('跳转到帖子详情（演示）')">
          <div class="res-icon" style="background:#FFF3E0;color:#FB8C00"><i class="ri-article-line"></i></div>
          <div class="res-info">
            <div class="res-title">${escapeHtml(p.title)}</div>
            <div class="res-desc">${escapeHtml(p.content).slice(0, 20)}...</div>
          </div>
        </div>
      `).join('');
      html += `</div>`;
    }

    if (!html) {
      html = `<div class="empty" style="padding:40px"><div class="e">🔍</div>没有找到与“${escapeHtml(kw)}”相关的内容</div>`;
    }
    container.innerHTML = replaceIcons(html);
  }

  function gotoSpotOnMap(spotId) {
    const spot = SPOTS.find(s => s.id === spotId);
    if (!spot) return;
    addHistory('spot', spot.id, spot.name, spot.env + ' · ' + spot.level); 
    MapView.state.center = { lat: spot.lat, lng: spot.lng };
    MapView.state.tab = 'near'; 
    switchPage('map');
    setTimeout(() => { MapView.openSpot(spotId); }, 300);
  }

  // 切换关注状态
  function toggleFollow(targetName, btnEl, isDetailPage = false) {
    let following = Store.following() || [];
    const isFollowing = following.includes(targetName);

    if (isFollowing) {
      // 取关
      following = following.filter(name => name !== targetName);
      toast('已取消关注');
      if (btnEl) { btnEl.textContent = '+ 关注'; btnEl.style.color = 'var(--green)'; btnEl.style.background = 'transparent'; }
    } else {
      // 关注
      following.push(targetName);
      toast('⭐ 关注成功');
      if (btnEl) { btnEl.textContent = '已关注'; btnEl.style.color = '#888'; btnEl.style.background = '#f5f5f5'; btnEl.style.borderColor = '#eee'; }
    }
    Store.saveFollowing(following);

    // 如果当前在关注列表，刷新列表
    if (current === 'follow-list') renderFollowList();
    // 如果当前在粉丝列表，刷新列表（因为可能有“互相关注”状态变化）
    if (current === 'fans-list') renderFansList();
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
    const allPosts = Store.posts();
    const userPosts = allPosts.filter(p => p.author === authorName);
    const userObj = RANK_SEED.find(r => r.name === authorName) || { name: authorName, icon: '🐦', birds: 0, likes: 0 };
    
        let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('comm')">← 返回交流</div>
      <div class="card" style="display:flex; align-items:center; gap:15px; position:relative;">
        <!-- 头像 -->
        <div style="width:60px; height:60px; border-radius:50%; background:var(--green-light); display:flex; justify-content:center; align-items:center; font-size:30px;">
          ${userObj.icon}
        </div>
        
        <!-- 用户信息 -->
        <div style="flex:1;">
          <div style="font-size:18px; font-weight:700;">${escapeHtml(userObj.name)}</div>
          <div style="font-size:12px; color:var(--text2); margin-top:5px;">累计观鸟：🐦 ${userObj.birds} 种 · 获赞：👍 ${userObj.likes}</div>
        </div>

        <!-- 👇 新增：发消息按钮 -->
        <button class="btn primary" style="padding: 6px 14px; font-size: 13px; border-radius: 20px; flex-shrink:0;" onclick="App.openChat('${userObj.name}')">
          💬 发消息
        </button>
      </div>
      
      <div class="section-title" style="margin:15px 0 8px 0;">TA的帖子 (${userPosts.length})</div>
      <div class="spot-list">`;
      
    if (userPosts.length) {
      userPosts.forEach(p => {
        html += `<div class="spot-item">
          <div class="spot-name">📝 ${escapeHtml(p.title)}</div>
          <div class="spot-meta"><span>${p.time}</span><span>👍 ${p.likes}</span></div>
        </div>`;
      });
    } else {
      html += `<div class="empty"><div class="e">📝</div>该用户暂无帖子</div>`;
    }
    html += `</div></div>`;
    el.innerHTML = replaceIcons(html);
  }

  /* ================= 成就 / 进度 ================= */
  function addLikesReceived(n) {
    const u = Store.user(); u.likesReceived += n; Store.saveUser(u);
    addExp(n);
  }
  function addExp(n) {
    const u = Store.user();
    u.exp += n;
    while (u.exp >= u.level * 100) { u.exp -= u.level * 100; u.level++; toast(`🎉 升级！当前等级 Lv.${u.level}`); }
    Store.saveUser(u);
  }
  function collectBird(id) {
    const list = Store.birds();
    if (!list.includes(id)) {
      list.push(id); Store.saveBirds(list);
      if (typeof DB !== 'undefined') {
        DB.updateUserBirds(Store.user().name, list);
      }
      addExp(5);
      const b = birdById(id);
      toast(`已收录「${b.name}」+5经验（共${list.length}种）`);
    }
  }
  function achieveState() {
    const u = Store.user();
    const birds = (Store.birds() || []).length + (Store.customBirds() || []).length; 
    const likes = u.likesReceived, posts = Store.myPosts().length;
    return ACHIEVEMENTS.map(a => {
      let cur = 0;
      if (a.id === 'a1') cur = birds; if (a.id === 'a2') cur = birds; if (a.id === 'a3') cur = birds; if (a.id === 'a4') cur = birds;
      if (a.id === 'a5') cur = likes; if (a.id === 'a6') cur = likes; if (a.id === 'a7') cur = likes;
      if (a.id === 'a8') cur = posts;
      if (a.id === 'a9') {
        const mineLikes = Store.posts().filter(p => Store.myPosts().includes(p.id)).map(p => p.likes);
        cur = mineLikes.length ? Math.max(...mineLikes) : 0;
      }
      const done = cur >= a.target;
      return { ...a, cur: Math.min(cur, a.target), done, pct: Math.min(100, Math.round(cur / a.target * 100)) };
    });
  }

  function renderProgress(el) {
    const u = Store.user();
    const ach = achieveState();
    const doneCount = ach.filter(a => a.done).length;
    const expNeed = u.level * 100;
    let html = `
      <div class="level-card">
        <div style="font-size:12px;opacity:.85">观鸟达人 · 等级</div>
        <div class="level-big">Lv.${u.level}</div>
        <div class="level-row"><span>${u.exp}/${expNeed} 经验</span>
          <div class="level-bar"><i style="width:${u.exp / expNeed * 100}%"></i></div>
          <span>距升级还需 ${expNeed - u.exp}</span>
        </div>
        <div class="level-row" style="font-size:11px;opacity:.9">经验获取：收录鸟类+5 · 发布帖子+10 · 获赞+1</div>
      </div>
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="card-title" style="margin-bottom:2px">🏅 成就徽章 ${doneCount}/${ACHIEVEMENTS.length}</div>
        <div class="card-sub">达成成就解锁徽章，兑换平台奖励</div></div>
        <div style="font-size:30px">${doneCount >= 3 ? '🎖️' : '🏅'}</div>
      </div>
      <div class="section-title">🏅 成就墙（已解锁 ${doneCount} 个）</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 12px">
        ${ach.map(a => `<div style="text-align:center">
          <div class="ach-icon ${a.done ? '' : 'locked'}" style="margin:0 auto">${a.icon}</div>
          <div style="font-size:11px;margin-top:4px;color:${a.done ? 'var(--green)' : 'var(--text2)'}">${a.name}</div>
        </div>`).join('')}
      </div>
      <div class="section-title">📊 成就进度</div>
      <div class="spot-list">
        ${ach.map(a => `
        <div class="ach-card">
          <div class="ach-icon ${a.done ? '' : 'locked'}">${a.icon}</div>
          <div class="ach-info">
            <div class="ach-name">${a.name} <span style="font-size:11px;color:var(--text2);font-weight:400">${a.cat}</span></div>
            <div class="ach-desc">${a.desc}</div>
            <div class="ach-progress"><i style="width:${a.pct}%"></i></div>
          </div>
          <div class="ach-state">${a.done ? '✓ 已解锁' : `${a.cur}/${a.target}`}</div>
        </div>`).join('')}
      </div>
      <div class="section-title">🏆 观鸟排名</div>
      <div class="spot-list">
        ${rankRows()}
      </div>
      <div class="section-title">🎪 平台活动</div>
      <div class="card">
        <div class="card-title">🦆 城市观鸟马拉松 · 报名中</div>
        <div class="card-sub">线上赛：本周末 24 小时内记录鸟种最多者获胜。报名费 ¥9.9（获奖得品牌方赞助奖品）。</div>
        <button class="btn primary block mt12" data-ft="join-event">立即报名</button>
      </div>
      <div class="card">
        <div class="card-title">🌿 候鸟迁徙季数据收集计划</div>
        <div class="card-sub">参与平台"数据+AI+生态保护"计划：你的每条观测记录经脱敏后将支持科研机构物种分布研究。</div>
      </div>`;
    el.innerHTML = replaceIcons(html);
    el.querySelectorAll('[data-ft="join-event"]').forEach(x =>
      x.addEventListener('click', () => toast('报名成功！本周末记得开启观鸟记录模式 🦆'))
    );
  }

  function rankRows() {
    const u = Store.user();
    const rows = [...RANK_SEED].map((r, i) => ({ ...r, rank: i + 1, me: false }));
    rows.push({ name: u.name, birds: Store.birds().length, likes: u.likesReceived, icon: u.avatar, rank: 6, me: true });
    rows.sort((a, b) => b.birds - a.birds || b.likes - a.likes);
    return rows.map((r, i) => `
      <div class="rank-row" style="${r.me ? 'border:1.5px solid var(--green);background:var(--green-light)' : ''}">
        <span class="rank-no ${i < 3 ? 'top' : ''}">${i + 1}</span>
        <span class="rank-icon">${r.icon}</span>
        <span class="rank-name">${escapeHtml(r.name)}${r.me ? ' <small style="color:var(--green)">(我)</small>' : ''}</span>
        <span class="rank-num">🐦${r.birds}</span>
        <span class="rank-num">👍${r.likes}</span>
      </div>`).join('');
  }

  /* ================= 售卖 ================= */
  function renderShop(el) {
    let html = `
      <div class="card" style="background:linear-gradient(135deg,#FFF8E1,#FFECB3)">
        <div class="card-title" style="color:#B26A00">🎯 观鸟装备 · 精准推荐</div>
        <div class="card-sub" style="color:#8D6E63">根据你收藏的鸟种与常去观测点，AI 推荐适配装备。点击跳转电商平台购买（平台获取返佣）。</div>
      </div>
      <div class="section-title">🛒 推荐装备（软广导流）</div>
      <div class="spot-list">${GEAR.map(g => `
        <div class="gear-card">
          <div class="gear-img">${g.id === 'g1' ? '🔭' : g.id === 'g2' ? '🔭' : g.id === 'g3' ? '📷' : g.id === 'g4' ? '🦵' : g.id === 'g5' ? '🧥' : '📖'}</div>
          <div class="gear-info">
            <div class="gear-name">${g.name} <span class="tag" style="margin-left:6px">${g.match}</span></div>
            <div class="gear-brand">${g.brand} · ${g.rec}</div>
            <div style="font-size:12px;color:var(--text2);margin-top:3px">${g.desc}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
              <span class="gear-price">${g.price}</span>
              <a class="gear-link" href="https://www.jd.com" target="_blank" rel="noopener">去京东购买 →</a>
            </div>
          </div>
        </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-title">💰 平台商业模式</div>
        <div class="card-sub">①装备导流返佣（本页）②基础免费+VIP订阅 ③社区打赏（抽成10%）④赛事报名费 ⑤科研数据变现 ⑥O2O生态合作。核心："数据+AI+垂直社区"。</div>
        <button class="btn ghost block mt12" data-ft="open-vip">查看 VIP 订阅方案 →</button>
      </div>`;
    el.innerHTML = replaceIcons(html);
    el.querySelectorAll('[data-ft="open-vip"]').forEach(x => x.addEventListener('click', openVip));
  }

  /* ================= 信息 ================= */
    async function renderMsg(el) {
    // 先渲染一个加载中
    el.innerHTML = `<div class="empty" style="padding-top:50px;"><div class="e">⏳</div>正在同步云端消息...</div>`;
    
    const myName = Store.user().name;
    if (typeof DB === 'undefined') return;

    try {
      // 从云端拉取联系人列表
      const sessions = await DB.getChatSessions(myName);
      
      let html = `<div class="section-title">📬 私信列表</div><div class="spot-list">`;
      
      if (sessions.length === 0) {
        html += `<div class="empty"><div class="e">💬</div>暂无云端消息，去搜索其他用户发消息吧！</div>`;
      } else {
        html += sessions.map(m => `
          <div class="msg-item" onclick="App.openChat('${m.name}')" style="cursor:pointer;">
            <span class="msg-avatar">👤</span>
            <div class="msg-info">
              <div class="msg-name">${escapeHtml(m.name)}</div>
              <div class="msg-text">${escapeHtml(m.text)}</div>
            </div>
            <span class="msg-time">${m.time}</span>
          </div>
        `).join('');
      }
      
      // 把官方的假通知留着垫底
      html += `<div class="msg-item" style="margin-top:20px;">
        <span class="msg-avatar">📢</span>
        <div class="msg-info">
          <div class="msg-name">Feather Trace 官方</div>
          <div class="msg-text">欢迎加入观鸟社区！完成新手任务可领徽章</div>
        </div>
        <span class="msg-time">10:02</span>
      </div>`;
      
      html += `</div>`;
      el.innerHTML = replaceIcons(html);
    } catch (e) {
      el.innerHTML = `<div class="empty">加载失败，请检查网络</div>`;
    }
  }

  /* ================= 我的 ================= */
  function renderMine(el) {
    const u = Store.user();
    const sysBirdsCount = (Store.birds() || []).length;
    const customBirdsCount = (Store.customBirds() || []).length;
    const totalBirds = sysBirdsCount + customBirdsCount;
    
        // 改：只要作者名字是你，就算作你的帖子！
    const myPosts = Store.posts().filter(p => p.author === u.name);
    const ach = achieveState().filter(a => a.done);
    
    const followingCount = (Store.following() || []).length;
    const followersCount = (Store.followers() || []).length;

    let html = `
      <div class="mine-head" style="padding-bottom: 30px;">
        <span class="avatar" onclick="App.switchPage('edit-profile')" style="cursor:pointer; width: 70px; height: 70px; font-size: 30px; background: rgba(255,255,255,0.2); color: #fff;">
          ${u.avatar && u.avatar.startsWith('data:image') 
            ? `<img src="${u.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` 
            : (u.avatar && u.avatar.length <= 2 ? u.avatar : (u.name ? u.name[0] : '鸟'))
          }
        </span>
        <div>
          <div class="mine-name" style="font-size: 22px;">${escapeHtml(u.name)}</div>
          <div class="mine-code" style="margin-top: 8px; color: rgba(255,255,255,0.8);">ID: ${u.code}</div>
           <button class="btn ghost" style="margin-top: 8px; padding: 4px 10px; font-size: 11px; border-radius: 20px;" onclick="App.openAuthModal()">
            ☁️ 绑定/登录云端账号
          </button>
          
          <!-- 粉丝/关注数据区 -->
          <div style="display: flex; gap: 20px; margin-top: 10px; color: #fff; font-size: 13px;">
            <div style="display: flex; flex-direction: column; align-items: center;" onclick="event.stopPropagation(); App.switchPage('fans-list')">
              <b style="font-size: 16px; cursor: pointer;">${followersCount}</b> 
              <span style="cursor: pointer; padding: 2px 5px;">粉丝</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center;" onclick="event.stopPropagation(); App.switchPage('follow-list')">
              <b style="font-size: 16px; cursor: pointer;">${followingCount}</b> 
              <span style="cursor: pointer; padding: 2px 5px;">关注</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center;">
              <b style="font-size: 16px;">${u.likesReceived}</b> 
              <span style="padding: 2px 5px;">获赞</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 数据统计面板 -->
      <div class="mine-stats" style="margin-top: -20px; position: relative; z-index: 10; border-radius: 16px; background: #fff;">
        <div class="ms" onclick="App.switchPage('my-birds')" style="cursor:pointer;"><b>${totalBirds}</b><span>收录鸟种</span></div>
        <div class="ms"><b>${myPosts.length}</b><span>发布帖子</span></div>
        <div class="ms" onclick="App.switchPage('my-badges')" style="cursor:pointer;"><b>${ach.length}</b><span>获得徽章</span></div>
        <div class="ms"><b>Lv.${u.level}</b><span>当前等级</span></div>
      </div>

      <!-- 第一组功能卡片 -->
      <div class="mine-group">
        <div class="mine-item" onclick="App.switchPage('history')">
          <div class="left"><div class="icon-box"><i class="ri-history-line"></i></div>浏览记录</div>
          <span class="arrow"><i class="ri-arrow-right-s-line"></i></span>
        </div>
        <div class="mine-item" onclick="App.switchPage('favorites')">
          <div class="left"><div class="icon-box"><i class="ri-star-line"></i></div>我的收藏</div>
          <span class="arrow"><i class="ri-arrow-right-s-line"></i></span>
        </div>
        <div class="mine-item" onclick="App.toast('已在下方展示你的帖子')">
          <div class="left"><div class="icon-box"><i class="ri-article-line"></i></div>我的帖子</div>
          <span class="arrow"><i class="ri-arrow-right-s-line"></i></span>
        </div>
        <div class="mine-item" onclick="App.switchPage('offline')">
          <div class="left"><div class="icon-box"><i class="ri-download-cloud-line"></i></div>离线包管理</div>
          <span class="arrow"><i class="ri-arrow-right-s-line"></i></span>
        </div>
      </div>

      <!-- 第二组：VIP与设置 -->
      <div class="mine-group">
        <div class="mine-item" onclick="App.openVip()">
          <div class="left"><div class="icon-box" style="color:#FFB300; background:#FFF8E1;"><i class="ri-vip-crown-line"></i></div>VIP 会员</div>
          <span class="arrow"><i class="ri-arrow-right-s-line"></i></span>
        </div>
        <div class="mine-item" onclick="App.switchPage('settings')">
          <div class="left"><div class="icon-box"><i class="ri-settings-3-line"></i></div>设置</div>
          <span class="arrow"><i class="ri-arrow-right-s-line"></i></span>
        </div>
      </div>
      
      <!-- 第三组：其他 -->
      <div class="mine-group" style="margin-bottom: 20px;">
        <div class="mine-item"><div class="left"><div class="icon-box"><i class="ri-shield-check-line"></i></div>社区公约</div><span class="arrow"><i class="ri-arrow-right-s-line"></i></span></div>
        <div class="mine-item" onclick="if(confirm('确定重置所有数据吗？')){localStorage.clear();location.reload();}">
          <div class="left"><div class="icon-box" style="color:#E53935; background:#FFEBEE;"><i class="ri-delete-bin-line"></i></div>重置演示数据</div>
          <span class="arrow"><i class="ri-arrow-right-s-line"></i></span>
        </div>
      </div>
      
      <div class="section-title">📄 最近发布</div>
      <div class="post-area" style="margin-bottom: 20px;">
        ${myPosts.length ? myPosts.slice(0,3).map(p => `
          <div class="post-card">
            <div class="post-head"><span class="avatar">${p.avatar}</span>
              <div><div class="post-author">${escapeHtml(p.author)}</div><div class="post-time">${p.time}</div></div>
              <span class="tag">${typeName(p.type)}</span></div>
            <div class="post-title">${escapeHtml(p.title)}</div>
            <div class="post-content">${escapeHtml(p.content)}</div>
          </div>`).join('')
        : '<div class="empty" style="padding:20px;"><div class="e">📝</div>还没有发过帖子</div>'}
      </div>
    `;
    el.innerHTML = html; 
  }
  
    function renderMyBirds() {
    const el = document.getElementById('page-my-birds');
    const birds = Store.birds().map(birdById).filter(Boolean);
    const customBirds = Store.customBirds() || []; // 读取自定义鸟种
    
    const totalBirds = (Store.birds() || []).length + customBirds.length;
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
    <div class="section-title" style="margin-top:0;">已收录鸟种 (${totalBirds}种)</div>
    <button class="btn primary block" style="margin-bottom:15px;" onclick="App.openUploadBirdModal()">+ 上传新鸟种记录</button>`;

    if (birds.length || customBirds.length) {
      html += `<div class="ai-cards">`;
      // 系统鸟种
      birds.forEach(b => {
        html += `<div class="ai-card" data-ft="bird-open" data-id="${b.id}">
          <div class="t">${b.name}</div><div class="d">${b.group} · ${b.rarity}</div>
        </div>`;
      });
      // 用户自定义鸟种
      customBirds.forEach(b => {
        html += `<div class="ai-card" style="border:1px solid var(--green-light);">
          ${b.image ? `<img src="${b.image}" style="width:100%; height:80px; object-fit:cover; border-radius:8px; margin-bottom:6px;">` : ''}
          <div class="t">${b.name} <span class="tag" style="font-size:10px;">我上传的</span></div>
          <div class="d">📍 ${b.location}</div>
        </div>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="empty"><div class="e">🐦</div>还没有收藏鸟种<br>去「地图」或「AI识别」收录吧</div>`;
    }
    html += `</div>`;
    el.innerHTML = replaceIcons(html);
    el.querySelectorAll('[data-ft="bird-open"]').forEach(x => x.addEventListener('click', () => App.openBird(x.dataset.id)));
  }

  function renderMyBadges() {
    const el = document.getElementById('page-my-badges');
    const ach = achieveState();
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
      <div class="section-title">🏅 我的徽章 (${ach.filter(a=>a.done).length}/${ach.length})</div>
      <div class="spot-list">`;
    ach.forEach(a => {
      html += `<div class="ach-card">
        <div class="ach-icon ${a.done ? '' : 'locked'}">${a.icon}</div>
        <div class="ach-info"><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>
        <div class="ach-state">${a.done ? '✓ 已解锁' : `${a.cur}/${a.target}`}</div>
      </div>`;
    });
    html += `</div></div>`;
    el.innerHTML = replaceIcons(html);
  }

  function renderOfflinePage() {
    const el = document.getElementById('page-offline');
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
      <div class="card"><div class="card-title">📴 离线能力（已就绪）</div>
      <div class="card-sub">本应用数据与功能全部内置，无网络也可使用</div></div>
      <div class="vip-item"><span class="vi">🗺️</span><span>离线地图：内置武汉及周边 12 个观测点</span></div>
      <div class="vip-item"><span class="vi">📚</span><span>离线物种库：25 种常见鸟类完整档案</span></div>
      <div class="vip-item"><span class="vi">🤖</span><span>离线 AI 识别：本地特征匹配识别</span></div>
      <div class="vip-item"><span class="vi">💾</span><span>数据本地存储：帖子/收藏/成就不丢失</span></div>
      <button class="btn primary block mt12" onclick="App.openVip()">升级 VIP 解锁更多离线包</button>
      </div>`;
    el.innerHTML = replaceIcons(html);
  }

    function renderEditProfile() {
    const el = document.getElementById('page-edit-profile');
    const u = Store.user();
    const isImgAvatar = u.avatar && (u.avatar.startsWith('data:image') || u.avatar.startsWith('http'));

    // 去掉了外面花里胡哨的干扰，直接竖向排版
    let html = `
      <div class="page-sub">
        <div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
        
        <div class="card">
          <div class="card-title" style="margin-bottom: 20px;">编辑资料</div>
          
          <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--green-light); display: flex; justify-content: center; align-items: center; overflow: hidden; cursor: pointer;" onclick="document.getElementById('avatarUpload').click()">
              ${isImgAvatar 
                ? `<img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover;">` 
                : `<span style="font-size:40px;">${(u.avatar && !u.avatar.includes('<')) ? u.avatar : '🐦'}</span>`
              }
            </div>
            <div style="font-size: 12px; color: #888; margin-top: 10px;">点击头像拍照或上传照片</div>
            <input type="file" id="avatarUpload" accept="image/*" style="display:none;" onchange="App.handleAvatarUpload(this)">
          </div>

          <input class="inp" id="editName" value="${escapeHtml(u.name)}" placeholder="昵称" style="margin-bottom: 20px;">

          <div class="section-title" style="margin: 0 0 10px 0;">或者选择 Emoji 头像</div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
            ${['🦜', '🦆', '🦅', '🦉', '🐦', '🌿', '🌳', '📷', '🔭', '🧢'].map(a => `
              <span class="avatar" style="cursor:pointer; ${u.avatar === a ? 'border:3px solid var(--green)' : 'border:3px solid transparent'}" data-ft="avatar" data-v="${a}">${a}</span>
            `).join('')}
          </div>

          <button class="btn primary block" id="saveProfile">保存资料</button>
        </div>
      </div>`;
      
    // ⚠️ 致命修复：直接赋值，绝对不能调 replaceIcons！
    el.innerHTML = html;
    
    // 绑定事件
    el.querySelectorAll('[data-ft="avatar"]').forEach(x => x.addEventListener('click', () => {
      el.querySelectorAll('[data-ft="avatar"]').forEach(y => y.style.border = '3px solid transparent');
      x.style.border = '3px solid var(--green)';
      el.dataset.pickedAvatar = x.dataset.v;
    }));

    el.querySelector('#saveProfile').addEventListener('click', () => {
      const name = el.querySelector('#editName').value.trim();
      const pickedEmoji = el.dataset.pickedAvatar;
      
      if (name) { u.name = name; }
      if (pickedEmoji) { u.avatar = pickedEmoji; }
      
      Store.saveUser(u); 
      toast('资料已更新'); 
      switchPage('mine');
    });
  }
  
  function handleAvatarUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxW = 200;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale; 
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        const u = Store.user();
        u.avatar = base64;
        Store.saveUser(u);
        toast('头像上传成功');
        renderEditProfile();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ================= VIP ================= */
  function openVip() {
    const u = Store.user();
    const html = `
      <div class="vip-hero"><div class="t">👑 Feather Trace VIP</div>
        <div class="s">${u.isVip ? '尊贵会员 · 已解锁全部能力' : '解锁专业观鸟的全部能力'}</div></div>
      <div class="vip-item"><span class="vi">🧠</span><span><b>高级 AI 识别</b>：稀有鸟种识别、鸟叫声纹识别</span></div>
      <div class="vip-item"><span class="vi">🗺️</span><span><b>离线包</b>：下载特定区域离线地图与物种库（野外无信号刚需）</span></div>
      <div class="vip-item"><span class="vi">☁️</span><span><b>云空间</b>：无限量高清观鸟图片云端存储</span></div>
      <div class="vip-item"><span class="vi">🕶️</span><span><b>精准防暴露</b>：隐藏自己发现的稀有鸟点坐标（保护生态）</span></div>
      <div class="vip-price">${u.isVip ? '已开通' : '¥98<small>/年 · 或 ¥298 买断'}</div>
      <button class="btn primary block" id="buyVip">${u.isVip ? '续费' : '立即开通'}</button>`;
    openModal('modalVip', '会员订阅', html);
    document.getElementById('modalVip').querySelector('#buyVip').addEventListener('click', () => {
      if (u.isVip) { toast('已是会员（演示环境，无需续费）'); return; }
      u.isVip = true; Store.saveUser(u);
      toast('🎉 开通成功！VIP 能力已解锁（演示）');
      closeModal('modalVip');
    });
  }

  /* ================= 通用弹窗 ================= */
  function openModal(modalId, title, bodyHtml) {
    const m = document.getElementById(modalId);
    m.querySelector('.modal-head span').textContent = title;
    m.querySelector('.modal-body').innerHTML = bodyHtml;
    m.classList.add('show');
  }

  /* ================= 鸟种档案 ================= */
  function openBird(id) {
    const b = birdById(id); if (!b) return;
    addHistory('bird', b.id, b.name, b.group + ' · ' + b.rarity);
    collectBird(id);
    const spots = SPOTS.filter(s => s.birds.includes(id));
    const html = `
      <div class="bird-hero">
        <span class="avatar" style="background:${b.color}22;color:${b.color}">${b.name[0]}</span>
        <div><div class="bird-name">${b.name}</div>
        <div class="bird-latin">${b.latin} · ${b.family}</div></div>
      </div>
      <div class="bird-tags">
        <span class="btag">${b.group}</span><span class="btag">${b.rarity}</span><span class="btag">${b.hatat.split('、')[0]}</span>
      </div>
      <div class="info-block mt12"><b>识别要点</b>：${b.features}</div>
      <div class="info-block"><b>栖息环境</b>：${b.habitat}</div>
      <div class="info-block"><b>行为习性</b>：${b.behavior}</div>
      <div class="info-block"><b>鸣声</b>：${b.audio}</div>
      <div class="info-block"><b>观察技巧</b>：${b.tips}</div>
      <div class="info-block"><b>常见地点</b>：${b.location}</div>
      ${spots.length ? `<div class="info-block"><b>📍 武汉观测点（${spots.length}处）</b>：${spots.map(s => s.name).join('、')}</div>` : ''}
      <div class="gear-ad">
        <div class="ga-title">🎯 装备推荐（平台导购返佣）</div>
        <div>观察${b.name}建议使用「${b.equipment}」</div>
        <a class="ga-btn" href="https://www.jd.com" target="_blank" rel="noopener">去京东看看 →</a>
      </div>
      <button class="btn ghost block mt12" data-ft="ai-chat" data-id="${id}">🤖 问 AI：关于${b.name}还想知道什么？</button>`;
    openModal('modalBird', `${b.name} · 鸟类档案`, replaceIcons(html));
    document.getElementById('modalBird').querySelectorAll('[data-ft="ai-chat"]').forEach(el =>
      el.addEventListener('click', () => {
        closeModal('modalBird');
        switchPage('ai');
        setTimeout(() => {
          const input = document.getElementById('chatInput');
          if (input) { input.value = b.name + ' 介绍'; input.dispatchEvent(new Event('input')); }
        }, 300);
      })
    );
  }

  /* ================= 初始化 ================= */
  function init() {
    if (localStorage.getItem('ft_font_large') === '1') {
      document.body.classList.add('font-large');
    }
    
    const topSearchBtn = document.getElementById('topSearchBtn');
    if (topSearchBtn) {
      topSearchBtn.addEventListener('click', () => App.switchPage('search'));
    }

    // 顶栏时间
    const now = new Date();
    document.getElementById('sbTime').textContent =
      String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    setInterval(() => {
      const n = new Date();
      document.getElementById('sbTime').textContent =
        String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    }, 30000);

    // 顶部 Tab
    document.querySelectorAll('.top-tabs .tab').forEach(el =>
      el.addEventListener('click', () => switchPage(el.dataset.tab))
    );
    // 底部导航
    document.querySelectorAll('.bottom-nav .nav-item').forEach(el =>
      el.addEventListener('click', () => switchPage(el.dataset.tab === 'home' ? 'comm' : el.dataset.tab))
    );
    // 关闭弹窗
    document.querySelectorAll('[data-close]').forEach(el =>
      el.addEventListener('click', () => closeModal(el.dataset.close))
    );
    document.querySelectorAll('.modal').forEach(m =>
      m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); })
    );

    // 支持 URL hash 直达页面
    const h = location.hash.replace('#', '');
    if (['comm', 'map', 'ai', 'progress', 'shop', 'msg', 'mine'].includes(h)) switchPage(h);
    else switchPage('comm');

    // 👇 启动全局未读消息探测（每 5 秒探测一次）
    setInterval(async () => {
      const u = Store.user();
      // 如果我们还在信息页或者聊天页，就不用亮红点了
      if (!u || !u.name || typeof DB === 'undefined' || current === 'msg' || current === 'chat-detail') return;

      try {
        // 调用我们在 bmob.js 里写好的方法
        const hasNew = await DB.checkUnread(u.name, lastCheckTime);
        if (hasNew) {
          showRedDot();
        }
      } catch (e) {
        // 静默处理
      }
    }, 5000);
  }

  /* ================= 新增：设置页面 ================= */
  function renderSettings() {
    const el = document.getElementById('page-settings');
    const isLarge = document.body.classList.contains('font-large');
    
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
      <div class="mine-group" style="margin: 0;">
        <div class="mine-item">
          <div class="left">大字体模式</div>
          <label class="switch">
            <input type="checkbox" id="fontToggle" ${isLarge ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </div>
        <div class="mine-item"><div class="left">清除缓存</div><span class="arrow">›</span></div>
        <div class="mine-item"><div class="left">关于 Feather Trace</div><span style="color:#888; font-size:13px;">v1.0.0</span></div>
      </div>
      <div style="text-align:center; margin-top:30px; color:#888; font-size:12px;">© 2026 Feather Trace Team</div>
    </div>`;
    
    el.innerHTML = html;
    
    el.querySelector('#fontToggle').addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('font-large');
        localStorage.setItem('ft_font_large', '1');
        toast('已开启大字体模式');
      } else {
        document.body.classList.remove('font-large');
        localStorage.setItem('ft_font_large', '0');
        toast('已恢复标准字体');
      }
    });
  }

  /* ================= 浏览记录 ================= */
  function renderHistory() {
    const el = document.getElementById('page-history');
    const historyData = Store.history() || [];
    
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
      <div class="mine-group" style="margin:0; padding: 0 15px;">`;
      
    if (historyData.length === 0) {
      html += `<div class="empty"><div class="e">🕒</div>暂无浏览记录<br>去逛逛帖子和鸟种吧~</div>`;
    } else {
      historyData.forEach(item => {
        let icon = 'ri-article-line';
        if (item.type === 'bird') icon = 'ri-bird-line';
        if (item.type === 'spot') icon = 'ri-map-pin-line';
        
        // 点击记录直接跳回原页面
        let clickAction = '';
        if (item.type === 'post') clickAction = `onclick="App.openPostDetail('${item.id}')"`;
        if (item.type === 'bird') clickAction = `onclick="App.openBird('${item.id}')"`;
        if (item.type === 'spot') clickAction = `onclick="App.gotoSpotOnMap('${item.id}')"`;

        html += `<div class="mine-item" style="cursor:pointer;" ${clickAction}>
          <div class="left">
            <div class="icon-box"><i class="${icon}"></i></div>
            <div>
              <div style="font-weight:600;">${escapeHtml(item.title)}</div>
              <div style="font-size:12px; color:#888; font-weight:normal; margin-top:2px;">${escapeHtml(item.desc || '')}</div>
            </div>
          </div>
          <span style="font-size:12px; color:#aaa;">${item.time}</span>
        </div>`;
      });
    }
    html += `</div></div>`;
    el.innerHTML = replaceIcons(html);
  }

  /* ================= 新增：我的收藏 ================= */
  function renderFavorites() {
    const el = document.getElementById('page-favorites');
    const savedIds = Store.savedPosts() || [];
    const allPosts = Store.posts();
    const savedPosts = allPosts.filter(p => savedIds.includes(p.id));
    
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
      <div class="section-title" style="margin-top:0;">⭐ 收藏的帖子</div>
      <div class="spot-list">`;
      
    if (savedPosts.length > 0) {
      savedPosts.forEach(p => {
        html += `<div class="spot-item" onclick="App.openPostDetail('${p.id}')" style="cursor:pointer;">
          <div class="spot-name">📝 ${escapeHtml(p.title)}</div>
          <div class="spot-meta"><span>${p.author}</span><span>👍 ${p.likes}</span></div>
        </div>`;
      });
    } else {
      html += `<div class="empty"><div class="e">⭐</div>还没有收藏任何帖子</div>`;
    }
      
    html += `</div></div>`;
    el.innerHTML = replaceIcons(html);
  }

   /* ================= 关注列表 ================= */
  function renderFollowList() {
    const el = document.getElementById('page-follow-list');
    const followingNames = Store.following() || [];
    
    // 从种子库里匹配用户信息
    const users = RANK_SEED.filter(u => followingNames.includes(u.name));
    
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
      <div class="section-title" style="margin-top:0;">我的关注 (${users.length})</div>
      <div class="spot-list">`;
      
    if (users.length === 0) {
      html += `<div class="empty"><div class="e">👤</div>还没有关注任何人</div>`;
    } else {
      users.forEach(u => {
        html += `<div class="spot-item" onclick="App.viewUserProfile('${u.name}')" style="display:flex; align-items:center; gap:15px;">
          <div style="width:46px; height:46px; border-radius:50%; background:var(--green-light); display:flex; justify-content:center; align-items:center; font-size:24px;">${u.icon}</div>
          <div style="flex:1;">
            <div style="font-weight:600; font-size:15px;">${u.name}</div>
            <div style="font-size:12px; color:#888; margin-top:2px;">🐦 ${u.birds} 种 · 👍 ${u.likes}</div>
          </div>
          <!-- 已关注按钮，点击变为取关 -->
          <button class="btn ghost" onclick="event.stopPropagation(); App.toggleFollow('${u.name}', this)" style="padding:4px 12px; font-size:12px; border-radius:20px;">已关注</button>
        </div>`;
      });
    }
    
    html += `</div></div>`;
    el.innerHTML = replaceIcons(html);
  }

   /* ================= 粉丝列表 ================= */
  function renderFansList() {
    const el = document.getElementById('page-fans-list');
    const followerNames = Store.followers() || [];
    const followingNames = Store.following() || [];
    
    const users = RANK_SEED.filter(u => followerNames.includes(u.name));
    
    let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
      <div class="section-title" style="margin-top:0;">我的粉丝 (${users.length})</div>
      <div class="spot-list">`;
      
    if (users.length === 0) {
      html += `<div class="empty"><div class="e">👤</div>还没有粉丝</div>`;
    } else {
      users.forEach(u => {
        const isMutual = followingNames.includes(u.name); // 是否互相关注
        
        html += `<div class="spot-item" onclick="App.viewUserProfile('${u.name}')" style="display:flex; align-items:center; gap:15px;">
          <div style="width:46px; height:46px; border-radius:50%; background:var(--green-light); display:flex; justify-content:center; align-items:center; font-size:24px;">${u.icon}</div>
          <div style="flex:1;">
            <div style="font-weight:600; font-size:15px;">${u.name}</div>
            <div style="font-size:12px; color:#888; margin-top:2px;">🐦 ${u.birds} 种 · 👍 ${u.likes}</div>
          </div>
          <!-- 回关按钮：如果已经互关，显示已互关且不可点 -->
          <button class="btn primary" 
            onclick="event.stopPropagation(); if(!${isMutual}) App.toggleFollow('${u.name}', this)" 
            style="padding:4px 12px; font-size:12px; border-radius:20px; ${isMutual ? 'background:#f5f5f5; color:#888;' : ''}">
            ${isMutual ? '已互关' : '回关'}
          </button>
        </div>`;
      });
    }
    
    html += `</div></div>`;
    el.innerHTML = replaceIcons(html);
  }
  
  /* ================= 帖子交互与详情 ================= */
  function toggleLike(id, el) {
    const posts = Store.posts(), liked = Store.liked();
    const p = posts.find(x => x.id === id); if (!p) return;
    if (liked.includes(id)) {
      p.likes--; Store.saveLiked(liked.filter(x => x !== id));
      if (el) { el.classList.remove('on'); el.innerHTML = `👍 <b>${p.likes}</b>`; }
    } else {
      p.likes++; liked.push(id); Store.saveLiked(liked);
      if (el) { el.classList.add('on'); el.innerHTML = `👍 <b>${p.likes}</b>`; }
      if (Store.myPosts().includes(id)) addLikesReceived(1);
    }
    Store.savePosts(posts);
    if (current === 'post-detail') renderPostDetail();
  }

  function toggleFish(id, el) {
    const posts = Store.posts(), fished = Store.fished();
    const p = posts.find(x => x.id === id); if (!p) return;
    if (fished.includes(id)) { toast('你已经打赏过这个帖子啦'); return; }
    const u = Store.user();
    if (u.fish < 1) { openVip(); return; }
    u.fish--; p.fish++; Store.saveUser(u); fished.push(id); Store.saveFished(fished);
    Store.savePosts(posts);
    toast(`打赏成功 🐟 小鱼干×1`);
    if (el) { el.classList.add('fish-on'); el.innerHTML = `🐟 <b>${p.fish}</b>`; }
    if (current === 'post-detail') renderPostDetail();
  }

  function toggleSave(id, el) {
    const saved = Store.savedPosts() || [];
    const isSaved = saved.includes(id);
    if (isSaved) {
      Store.savePostsSaved(saved.filter(x => x !== id));
      toast('已取消收藏');
      if (el) { el.classList.remove('on'); el.innerHTML = '☆ 收藏'; }
    } else {
      saved.push(id); Store.savePostsSaved(saved);
      toast('⭐ 收藏成功');
      if (el) { el.classList.add('on'); el.innerHTML = '⭐ 已收藏'; }
    }
    if (current === 'favorites') renderFavorites();
  }

  function openPostDetail(id) {
    currentPostId = id;
    const p = Store.posts().find(x => x.id === id);
    if (p) addHistory('post', p.id, p.title, p.author);
    switchPage('post-detail');
  }

    function renderPostDetail() {
    const el = document.getElementById('page-post-detail');
    const p = Store.posts().find(x => x.id === currentPostId);
    if (!p) { switchPage('comm'); return; }
    
    const liked = Store.liked().includes(p.id);
    const fished = Store.fished().includes(p.id);
    const savedList = Store.savedPosts() || [];
    const saved = savedList.includes(p.id);

    // 如果没有真实评论数组，初始化一个
    if (!p.realComments) {
       p.realComments = [
         { user: '镜头里的风', avatar: '📷', text: '太美了！下次带我一个！', likes: 3, isLiked: false, replies: [] },
         { user: '鸟导阿强', avatar: '🪶', text: '这个机位绝佳，光线很好。', likes: 1, isLiked: false, replies: [] }
       ];
    }

    let commentsHtml = p.realComments.map((c, idx) => {
      return `<div class="comment-item">
        <div class="comment-avatar">${c.avatar}</div>
        <div class="comment-content">
          <div class="comment-user">${c.user}</div>
          <div class="comment-text">${escapeHtml(c.text)}</div>
          <div class="comment-actions">
            <span onclick="App.likeComment(${idx})" class="${c.isLiked ? 'liked' : ''}">${c.isLiked ? '❤️' : '🤍'} ${c.likes || 0}</span>
            <span onclick="App.openReplyModal(${idx})">💬 回复</span>
          </div>
          ${c.replies && c.replies.length > 0 ? `
            <div class="comment-replies">
              ${c.replies.map(r => `<div><b>${r.user}:</b> ${escapeHtml(r.text)}</div>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>`;
    }).join('');

    let html = `
      <div class="detail-header">
        <span class="back" onclick="App.switchPage('comm')">✕</span>
        <span class="title">帖子详情</span>
        <span style="width: 20px;"></span>
      </div>
      
      <div class="detail-body">
        <div class="detail-author">
          <span class="avatar" onclick="App.viewUserProfile('${escapeHtml(p.author)}')">${p.avatar}</span>
          <div class="info">
            <div class="name">${escapeHtml(p.author)} <span style="font-size:10px; background:#FFD54F; padding:1px 4px; border-radius:4px;">Lv.6</span></div>
            <div class="time">${p.time} · 来自武汉</div>
          </div>
          <button class="btn-follow" onclick="App.toggleFollow('${escapeHtml(p.author)}', this)" style="${(Store.following()||[]).includes(p.author) ? 'color:#888; background:#f5f5f5; border-color:#eee;' : ''}">${(Store.following()||[]).includes(p.author) ? '已关注' : '+ 关注'}</button>
        </div>
        
        <div class="detail-title">${escapeHtml(p.title)}</div>
        <div class="detail-content">${escapeHtml(p.content)}</div>
        ${p.image ? `<img class="detail-img" src="${p.image}">` : ''}
        <div style="font-size:12px; color:#aaa; text-align:right;">发布于 ${p.time}</div>
      </div>
      
      <div class="detail-actions">
        <span class="pa ${liked ? 'on' : ''}" onclick="App.toggleLike('${p.id}', this)">
          <div class="pa-icon">👍</div><div class="pa-num">${p.likes}</div><div class="pa-text">点赞</div>
        </span>
        <span class="pa" onclick="App.openCommentModal()" style="cursor:pointer;">
          <div class="pa-icon">💬</div><div class="pa-num">${p.comments}</div><div class="pa-text">评论</div>
        </span>
        <span class="pa ${fished ? 'fish-on' : ''}" onclick="App.toggleFish('${p.id}', this)">
          <div class="pa-icon">🐟</div><div class="pa-num">${p.fish}</div><div class="pa-text">打赏</div>
        </span>
        <span class="pa ${saved ? 'on' : ''}" onclick="App.toggleSave('${p.id}', this)">
          <div class="pa-icon">${saved ? '⭐' : '☆'}</div><div class="pa-text" style="margin-top:2px;">${saved ? '已收藏' : '收藏'}</div>
        </span>
      </div>

      <div class="comment-section">
        <div class="comment-title">全部评论 (${p.comments})</div>
        ${commentsHtml}
      </div>
    `;
    
    el.innerHTML = html;
  }

  /* ================= 评论系统 ================= */
  function openCommentModal() {
    const modal = document.getElementById('commentModal');
    const input = document.getElementById('commentInput');
    input.value = '';
    modal.classList.add('show');
    // 聚焦输入框（延迟一点避免动画卡顿）
    setTimeout(() => input.focus(), 300);
  }

  function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    modal.classList.remove('show');
    // 收起键盘
    document.getElementById('commentInput').blur();
  }

  function submitComment() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text) { toast('评论不能为空'); return; }
    
    const posts = Store.posts();
    const p = posts.find(x => x.id === currentPostId);
    if (!p) return;

    // 1. 增加评论数
    p.comments = (p.comments || 0) + 1;
    
    // 2. 把评论存入该帖子的数据中
    if (!p.realComments) p.realComments = [];
    const u = Store.user();
    p.realComments.unshift({
      user: u.name,
      avatar: u.avatar,
      text: text
    });

    // 3. 保存数据并刷新页面
    Store.savePosts(posts);
    toast('评论发布成功');
    closeCommentModal();
    renderPostDetail(); // 刷新详情页
  }

  /* ================= 新增功能：上传鸟种 ================= */
  let uploadBirdImgData = '';
  function openUploadBirdModal() {
    uploadBirdImgData = '';
    document.getElementById('uploadBirdName').value = '';
    document.getElementById('uploadBirdLoc').value = '';
    document.getElementById('uploadBirdDesc').value = '';
    document.getElementById('uploadBirdImgPreview').style.display = 'none';
    
    // 绑定图片预览
    const fileInput = document.getElementById('uploadBirdImgInput');
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      compressImage(file, data => {
        uploadBirdImgData = data;
        const preview = document.getElementById('uploadBirdImgPreview');
        preview.src = data;
        preview.style.display = 'inline-block';
      });
    };
    openModal('modalUploadBird', '上传新鸟种', document.getElementById('modalUploadBird').querySelector('.modal-body').innerHTML);
  }

  function submitUploadBird() {
    const name = document.getElementById('uploadBirdName').value.trim();
    const loc = document.getElementById('uploadBirdLoc').value.trim();
    const desc = document.getElementById('uploadBirdDesc').value.trim();
    
    if (!name || !loc) { toast('请填写鸟类名称和发现地点'); return; }
    
    const customBirds = Store.customBirds() || [];
    customBirds.push({
      id: 'c' + Date.now(),
      name,
      location: loc,
      desc,
      image: uploadBirdImgData,
      time: '刚刚'
    });
        Store.saveCustomBirds(customBirds);
    closeModal('modalUploadBird');
    
    addExp(10); // 👈 上传鸟种奖励 10 经验（可选，但能增加成就感）
    const totalBirds = (Store.birds() || []).length + customBirds.length;
    toast(`收录成功！+10经验（共${totalBirds}种）`);
    
    renderMyBirds(); // 刷新列表
  }

  /* ================= 新增功能：评论点赞与回复 ================= */
  let replyTargetIndex = -1;

  function likeComment(idx) {
    const posts = Store.posts();
    const p = posts.find(x => x.id === currentPostId);
    if (!p || !p.realComments) return;
    
    const c = p.realComments[idx];
    c.isLiked = !c.isLiked;
    c.likes = c.isLiked ? (c.likes || 0) + 1 : (c.likes || 1) - 1;
    
    Store.savePosts(posts);
    renderPostDetail(); // 重绘
  }

  function openReplyModal(idx) {
    replyTargetIndex = idx;
    const modal = document.getElementById('replyModal');
    const input = document.getElementById('replyInput');
    input.value = '';
    modal.classList.add('show');
    setTimeout(() => input.focus(), 300);
  }

  function closeReplyModal() {
    document.getElementById('replyModal').classList.remove('show');
  }

  function submitReply() {
    const input = document.getElementById('replyInput');
    const text = input.value.trim();
    if (!text) { toast('回复不能为空'); return; }
    
    const posts = Store.posts();
    const p = posts.find(x => x.id === currentPostId);
    if (!p || !p.realComments || replyTargetIndex === -1) return;
    
    const c = p.realComments[replyTargetIndex];
    if (!c.replies) c.replies = [];
    
    c.replies.push({ user: Store.user().name, text });
    Store.savePosts(posts);
    
    closeReplyModal();
    toast('回复成功');
    renderPostDetail(); // 重绘
  }

  /* ================= 聊天系统 ================= */
  function openChat(userName) {
    currentChatUser = userName;
    switchPage('chat-detail');
  }

     let chatPollingTimer = null;

  async function renderChatDetail() {
    const el = document.getElementById('page-chat-detail');
    if (!currentChatUser) { switchPage('msg'); return; }

    // 清除之前的定时器
    if (chatPollingTimer) clearInterval(chatPollingTimer);

    lastCheckTime = new Date().toISOString(); 
    hideRedDot();
    
    const myName = Store.user().name; 
    // 👇 核心判断：当前聊天的对象，是不是本地写死的虚拟NPC？
    const isVirtual = RANK_SEED.some(u => u.name === currentChatUser) || ['Feather Trace 官方', '系统消息'].includes(currentChatUser);

    let html = `
      <div class="chat-header">
        <span class="back" onclick="App.switchPage('msg'); clearInterval(window.chatPollingTimer);">‹</span>
        <span class="title">${escapeHtml(currentChatUser)}</span>
        <span style="width:20px;"></span>
      </div>
      <div class="chat-content" id="chatContent"></div>
      <div class="chat-bottom-input">
        <input type="text" id="chatMsgInput" placeholder="发消息..." autocomplete="off">
        <button id="chatSendBtn">发送</button>
      </div>
    `;
    el.innerHTML = html;

    const content = el.querySelector('#chatContent');
    const input = el.querySelector('#chatMsgInput');
    const sendBtn = el.querySelector('#chatSendBtn');

    // ==========================================
    // 线路 A：如果是虚拟 NPC，走本地 LocalStorage
    // ==========================================
    if (isVirtual) {
      const allRecords = Store.chatRecords() || {};
      const msgs = allRecords[currentChatUser] || [
        { isMe: false, text: '你好呀！欢迎来到羽迹，很高兴认识你！' }
      ];

      const renderLocal = () => {
        content.innerHTML = msgs.map(m => `
          <div class="chat-msg ${m.isMe ? 'right' : 'left'}">
            <div class="chat-avatar">${m.isMe ? Store.user().avatar : '👤'}</div>
            <div class="chat-bubble">${escapeHtml(m.text)}</div>
          </div>
        `).join('');
        content.scrollTop = content.scrollHeight;
      };
      renderLocal();

      const sendLocal = () => {
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        
        msgs.push({ isMe: true, text });
        allRecords[currentChatUser] = msgs;
        Store.saveChatRecords(allRecords);
        renderLocal();

        // 模拟NPC回复
        setTimeout(() => {
          const replies = ['对面是个虚拟账号，测试发消息可以发给另一个创建了账户的真实账号'];
          msgs.push({ isMe: false, text: replies[Math.floor(Math.random() * replies.length)] });
          allRecords[currentChatUser] = msgs;
          Store.saveChatRecords(allRecords);
          renderLocal();
        }, 1000);
      };

      sendBtn.addEventListener('click', sendLocal);
      input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendLocal(); });
      return; // 虚拟线路结束，直接返回
    }

    // ==========================================
    // 线路 B：如果是真实的云端用户，走 Bmob
    // ==========================================
    const fetchMessages = async () => {
      if (typeof DB === 'undefined') return;
      
      // 👇 这是你要的第一步打印日志
      console.log("【云端查询】myName:", myName, "| currentChatUser:", currentChatUser);
      
      const msgs = await DB.getMsgs(myName, currentChatUser);
      
      console.log("【云端返回】记录数:", msgs.length);

      if (msgs.length === 0) {
        // 防止网络延迟导致清空屏幕
        if (content.innerHTML.includes('chat-bubble')) return; 
        content.innerHTML = `<div style="text-align:center; color:#aaa; font-size:12px; margin-top:20px;">暂无聊天记录，打个招呼吧！</div>`;
        return;
      }

      content.innerHTML = msgs.map(m => {
        const isMe = m.sender === myName;
        return `
          <div class="chat-msg ${isMe ? 'right' : 'left'}">
            <div class="chat-avatar">${isMe ? Store.user().avatar : '👤'}</div>
            <div class="chat-bubble">${escapeHtml(m.text)}</div>
          </div>
        `;
      }).join('');
      content.scrollTop = content.scrollHeight;
    };

    fetchMessages();
    window.chatPollingTimer = setInterval(fetchMessages, 2000);

    const sendCloud = async () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      
      // 先本地上屏
      content.innerHTML += `
        <div class="chat-msg right">
          <div class="chat-avatar">${Store.user().avatar}</div>
          <div class="chat-bubble">${escapeHtml(text)}</div>
        </div>
      `;
      content.scrollTop = content.scrollHeight;

      const res = await DB.sendMsg(myName, currentChatUser, text);
      if (!res) {
        toast('发送失败，请检查网络');
      } else {
        // 发送成功，延迟 0.5 秒拉取新数据
        setTimeout(fetchMessages, 500);
      }
    };

    sendBtn.addEventListener('click', sendCloud);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendCloud(); });
  }

  /* ================= 真实云端账号系统 ================= */
  let isRegisterMode = false;

  function openAuthModal() {
    document.getElementById('modalAuth').classList.add('show');
    document.getElementById('authUsername').value = '';
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    
    // 切换模式
    document.getElementById('authSwitchText').onclick = () => {
      isRegisterMode = !isRegisterMode;
      if (isRegisterMode) {
        document.getElementById('authTitle').textContent = '注册新账号';
        document.getElementById('authUsername').style.display = 'block';
        document.getElementById('authSubmitBtn').textContent = '注 册';
        document.getElementById('authSwitchText').textContent = '已有账号？去登录';
      } else {
        document.getElementById('authTitle').textContent = '登录账号';
        document.getElementById('authUsername').style.display = 'none';
        document.getElementById('authSubmitBtn').textContent = '登 录';
        document.getElementById('authSwitchText').textContent = '没有账号？去注册';
      }
    };
  }

    async function handleAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const username = document.getElementById('authUsername').value.trim();
    const btn = document.getElementById('authSubmitBtn');

    if (!email || !password) { toast('请填写邮箱和密码'); return; }
    btn.textContent = '处理中...';

    try {
      if (isRegisterMode) {
        if (!username) { toast('请填写用户名'); btn.textContent = '注 册'; return; }
        
        const res = await DB.register(email, password, username);
        if (res && res.success) {
          toast('注册成功，自动登录');
          const u = Store.user();
          u.name = username;
          u.code = res.user.id;
          Store.saveUser(u);
          if (typeof DB !== 'undefined') {
            const cloudBirds = await DB.getUserBirds(u.name);
            if (cloudBirds && cloudBirds.length > 0) {
              Store.saveBirds(cloudBirds);
            }
          }
          closeModal('modalAuth');
          renderMine(document.getElementById('page-mine'));
        } else {
          toast(res ? res.msg : '注册失败');
        }
      } else {
        const res = await DB.login(email, password);
         if (res && res.success) {
          toast('登录成功');
          const u = Store.user();
          u.name = res.user.username || '云端用户'; 
          Store.saveUser(u);
          closeModal('modalAuth');
          // 👇 直接跳转并刷新整个页面视图，名字瞬间变化
          App.switchPage('mine'); 
        }else {
          toast(res ? res.msg : '登录失败，请检查网络');
        }
      }
    } catch (error) {
      // 👇 终极保护：防止任何未知错误导致页面白屏或崩溃
      toast('网络请求出错，请稍后再试');
      console.error(error);
    } finally {
      btn.textContent = isRegisterMode ? '注 册' : '登 录';
    }
  }
  
  return { 
    init, switchPage, renderCurrent, toast, collectBird, openBird, openVip, 
    birdById, viewUserProfile, handleAvatarUpload, doSearch, gotoSpotOnMap,
    openPostDetail, toggleLike, toggleFish, toggleSave, toggleFollow,
    openCommentModal, closeCommentModal, submitComment,
    openUploadBirdModal, submitUploadBird, likeComment, openReplyModal, closeReplyModal, submitReply, openChat, openAuthModal, handleAuth, openChat
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
