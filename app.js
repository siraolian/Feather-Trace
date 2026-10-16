/* ============================================================
 * Feather Trace —— 主逻辑
 * 负责：页面切换 / 交流区 / 进度游戏化 / 售卖·信息·我的
 *       / 鸟种档案 / 发帖 / 成就 / VIP / 数据持久化
 * ============================================================ */

// 查看用户资料
function viewUserProfile(authorName) {
  if (authorName === Store.user().name) { switchPage('mine'); return; } // 如果是自己，直接去我的界面
  switchPage('user-profile');
  renderUserProfile(authorName);
}

function renderUserProfile(authorName) {
  const el = document.getElementById('page-user-profile');
  // 从种子数据里找该用户发过的帖子
  const allPosts = Store.posts();
  const userPosts = allPosts.filter(p => p.author === authorName);
  const userObj = RANK_SEED.find(r => r.name === authorName) || { name: authorName, icon: '🐦', birds: 0, likes: 0 };
  
  let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('comm')">← 返回交流</div>
    <div class="card" style="display:flex; align-items:center; gap:15px;">
      <div style="width:60px; height:60px; border-radius:50%; background:var(--green-light); display:flex; justify-content:center; align-items:center; font-size:30px;">
        ${userObj.icon}
      </div>
      <div>
        <div style="font-size:18px; font-weight:700;">${escapeHtml(userObj.name)}</div>
        <div style="font-size:12px; color:var(--text2); margin-top:5px;">累计观鸟：🐦 ${userObj.birds} 种 · 获赞：👍 ${userObj.likes}</div>
      </div>
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
  el.innerHTML = html;
}

/* 全局弹窗关闭（供 map.js / ai.js 等模块调用） */
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

const App = (() => {

  let current = 'comm'; // comm / map / ai / progress / shop / msg / mine

  /* ================= 工具 ================= */
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
  // 判断要显示哪个容器
  let pageId = 'page-comm';
  if (TOP_TABS.includes(p)) pageId = 'page-' + p;
  else if (['my-birds', 'my-badges', 'offline', 'edit-profile','user-profile'].includes(p)) pageId = 'page-' + p;
  
  document.getElementById(pageId).classList.add('active');
  
  // 顶栏和底部导航的 active 状态逻辑
  document.querySelectorAll('.top-tabs .tab').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === p && TOP_TABS.includes(p));
  });
  document.querySelectorAll('.bottom-nav .nav-item').forEach(el => {
    const tab = el.dataset.tab;
    let active = false;
    if (tab === 'home') active = TOP_TABS.includes(p);
    else if (tab === 'mine') active = ['mine', 'my-birds', 'my-badges', 'offline', 'edit-profile'].includes(p);
    else active = tab === p;
    el.classList.toggle('active', active);
  });
  renderCurrent();
}

  function renderCurrent() {
    // 售卖/信息/我的 复用 page-comm 容器（底部导航页）
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
    else if (current === 'user-profile') renderUserProfile();
  }

  /* ================= 交流区 ================= */
  let commTab = 'follow'; // follow关注 / region地区 / guide攻略 / share分享 / qa问答

  function renderComm(el) {
    const tabs = [
      ['follow', '关注'], ['region', '地区'], ['guide', '攻略'], ['share', '分享'], ['qa', '问答']
    ];
    let html = `<div class="page-head">${tabs.map(t => `<div class="ptab ${commTab === t[0] ? 'active' : ''}" data-ft="comm-tab" data-v="${t[0]}">${t[1]}</div>`).join('')}</div>`;
    html += `<div class="post-area" id="postArea">${postListHtml()}</div>`;
    html += `<div class="fab" id="fabPost">＋</div>`;
    el.innerHTML = html;
    el.querySelectorAll('[data-ft="comm-tab"]').forEach(x =>
      x.addEventListener('click', () => { commTab = x.dataset.v; renderComm(el); })
    );
    el.querySelector('#fabPost').addEventListener('click', openPostModal);
    bindPostEvents(el);
  }

 function postListHtml() {
  const posts = Store.posts();
  let list;
  if (commTab === 'follow') list = [...posts].sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || b.likes - a.likes);
  else list = posts.filter(p => p.type === commTab);
  if (!list.length) return `<div class="empty"><div class="e">🪶</div>还没有帖子，点击右下角＋发布第一帖吧！</div>`;
  const liked = Store.liked(), fished = Store.fished();
  
  return list.map(p => `
    <div class="post-card">
      <div class="post-head">
        <!-- 👇 头像加了 onclick 和图片兼容 -->
        <span class="avatar" style="cursor:pointer;" onclick="App.viewUserProfile('${escapeHtml(p.author)}')">
          ${p.avatar && p.avatar.startsWith('data:image') ? `< img src="${p.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : p.avatar}
        </span>
        <div><div class="post-author">${escapeHtml(p.author)}</div><div class="post-time">${p.time}</div></div>
        <span class="tag">${typeName(p.type)}</span>
      </div>
      <div class="post-title">${escapeHtml(p.title)}${p.hot ? '<span class="hot-badge">🔥热门</span>' : ''}</div>
      <div class="post-content">${escapeHtml(p.content)}</div>
      ${p.image ? `< img class="post-img" src="${p.image}" alt="帖子图片">` : ''}
      <div class="post-actions">
        <span class="pa ${liked.includes(p.id) ? 'on' : ''}" data-ft="like" data-id="${p.id}">👍 <b>${p.likes}</b></span>
        <span class="pa" data-ft="comment" data-id="${p.id}">💬 <b>${p.comments}</b></span>
        <span class="pa ${fished.includes(p.id) ? 'fish-on' : ''}" data-ft="fish" data-id="${p.id}">🐟 <b>${p.fish}</b></span>
        <span class="pa" data-ft="share-post" data-id="${p.id}" style="margin-left:auto">↗ 分享</span>
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
          // 模拟他人给"我的帖子"点赞 → 获赞成就
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
    // 重新绑定（简单方式：重渲染整页保持 tab）
    renderComm(el);
  }

  /* ---- 发帖 ---- */
  let postImgData = '';
  function openPostModal() {
    postImgData = '';
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postImgPreview').innerHTML = '';
    document.getElementById('modalPost').classList.add('show');
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

  function submitPost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const type = document.querySelector('#postTypeRow .pt.active').dataset.pt;
    if (!title) { toast('请填写标题'); return; }
    const u = Store.user();
    const post = {
      id: 'u' + Date.now(), type, author: u.name, avatar: u.avatar, time: '刚刚',
      title, content, likes: 0, comments: 0, fish: 0, image: postImgData || undefined, hot: false
    };
    const posts = Store.posts(); posts.unshift(post); Store.savePosts(posts);
    const mine = Store.myPosts(); mine.push(post.id); Store.saveMyPosts(mine);
    addExp(10);
    closeModal('modalPost');
    toast('发布成功，获得经验+10');
    commTab = type; refreshComm();
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
      addExp(5);
      const b = birdById(id);
      toast(`已收录「${b.name}」+5经验（共${list.length}种）`);
    }
  }
  function achieveState() {
    const u = Store.user();
    const birds = Store.birds().length, likes = u.likesReceived, posts = Store.myPosts().length;
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
    const birds = Store.birds();
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
    el.innerHTML = html;
    el.querySelectorAll('[data-ft="join-event"]').forEach(x =>
      x.addEventListener('click', () => toast('报名成功！本周末记得开启观鸟记录模式 🦆'))
    );
  }

  function rankRows() {
    const u = Store.user();
    const rows = [...RANK_SEED].map((r, i) => ({
      ...r, rank: i + 1, me: false
    }));
    const myBirds = Store.birds().length, myLikes = u.likesReceived;
    rows.push({ name: u.name, birds: myBirds, likes: myLikes, icon: u.avatar, rank: 6, me: true });
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
    const u = Store.user();
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
    el.innerHTML = html;
    el.querySelectorAll('[data-ft="open-vip"]').forEach(x => x.addEventListener('click', openVip));
  }

  /* ================= 信息 ================= */
  function renderMsg(el) {
    const msgs = [
      { icon: '📢', name: 'Feather Trace 官方', text: '欢迎加入观鸟社区！完成新手任务可领徽章', time: '10:02', unread: true, type: '官方通知' },
      { icon: '🔭', name: '镜头里的风', text: '回复了你的帖子："沙湖翠鸟可以试试下午4点去"', time: '09:41', unread: true, type: '私信' },
      { icon: '🌳', name: '望江楼老周', text: '赞了你的帖子《沙湖公园的翠鸟终于蹲到了》', time: '昨天', unread: false, type: '私信' },
      { icon: '🏆', name: '系统消息', text: '你的「十鸟观」成就已达成，徽章已发放！', time: '周一', unread: false, type: '官方通知' },
      { icon: '🛒', name: '装备助手', text: '根据你的收藏，为你推荐了2件新装备', time: '上周', unread: false, type: '官方通知' }
    ];
    let html = `<div class="section-title">📬 私信与通知</div><div class="spot-list">`;
    html += msgs.map(m => `
      <div class="msg-item">
        <span class="msg-avatar">${m.icon}</span>
        <div class="msg-info">
          <div class="msg-name">${m.name} ${m.unread ? '<span class="msg-badge">新</span>' : ''}</div>
          <div class="msg-text">${m.text}</div>
        </div>
        <span class="msg-time">${m.time}</span>
      </div>`).join('');
    html += `</div>`;
    el.innerHTML = html;
  }

  /* ================= 我的 ================= */
  function renderMine(el) {
    const u = Store.user();
    const birds = Store.birds(), posts = Store.myPosts();
    const myPosts = Store.posts().filter(p => posts.includes(p.id));
    const ach = achieveState().filter(a => a.done);
    let html = `
      <div class="mine-head" style="cursor: pointer;">
        <span class="avatar">${u.avatar}</span>
        <div>
          <div class="mine-name">${escapeHtml(u.name)}</div>
          <div class="mine-code">账号码 ${u.code}</div>
          <span class="mine-vip" data-ft="open-vip">${u.isVip ? '👑 VIP 会员' : '开通 VIP →'}</span>
        </div>
      </div>
      <div class="mine-stats">
        <div class="ms"><b>${birds.length}</b><span>收录鸟种</span></div>
        <div class="ms"><b>${myPosts.length}</b><span>我的帖子</span></div>
        <div class="ms"><b>${u.likesReceived}</b><span>累计获赞</span></div>
        <div class="ms"><b>Lv.${u.level}</b><span>等级</span></div>
      </div>
      <div class="mine-menu">
        <div class="menu-item" data-ft="my-posts"><span><span class="mi">📝</span>我的帖子</span><span class="arrow">›</span></div>
        <div class="menu-item" data-ft="my-birds"><span><span class="mi">🐦</span>我的鸟种收藏（${birds.length}种）</span><span class="arrow">›</span></div>
        <div class="menu-item" data-ft="my-badges"><span><span class="mi">🏅</span>我的徽章（${ach.length}个）</span><span class="arrow">›</span></div>
        <div class="menu-item" data-ft="open-vip"><span><span class="mi">👑</span>VIP 会员（离线包/声纹识别/云空间）</span><span class="arrow">›</span></div>
        <div class="menu-item" data-ft="offline"><span><span class="mi">📴</span>离线包管理</span><span class="arrow">›</span></div>
        <div class="menu-item" data-ft="edit-profile"><span><span class="mi">✏️</span>编辑资料</span><span class="arrow">›</span></div>
        <div class="menu-item" data-ft="reset"><span><span class="mi">🗑️</span>重置演示数据</span><span class="arrow">›</span></div>
      </div>
      <div class="section-title">📄 我的帖子</div>
      <div class="post-area">
        ${myPosts.length ? myPosts.map(p => `
          <div class="post-card">
            <div class="post-head"><span class="avatar">${p.avatar}</span>
              <div><div class="post-author">${escapeHtml(p.author)}</div><div class="post-time">${p.time}</div></div>
              <span class="tag">${typeName(p.type)}</span></div>
            <div class="post-title">${escapeHtml(p.title)}</div>
            <div class="post-content">${escapeHtml(p.content)}</div>
            <div class="post-actions">
              <span class="pa">👍 ${p.likes}</span><span class="pa">💬 ${p.comments}</span><span class="pa">🐟 ${p.fish}</span>
            </div>
          </div>`).join('')
        : '<div class="empty"><div class="e">📝</div>还没有发过帖子<br>去「交流」页点右下角＋发布吧</div>'}
      </div>`;
    el.innerHTML = html;
    el.querySelectorAll('[data-ft="open-vip"]').forEach(x => x.addEventListener('click', openVip));
    el.querySelectorAll('[data-ft="my-posts"]').forEach(x => x.addEventListener('click', () => toast('已在下方展示你的帖子')));
  // 点击跳转到独立页面（不再使用弹窗）
el.querySelectorAll('[data-ft="my-birds"]').forEach(x => x.addEventListener('click', () => App.switchPage('my-birds')));
el.querySelectorAll('[data-ft="my-badges"]').forEach(x => x.addEventListener('click', () => App.switchPage('my-badges')));
el.querySelectorAll('[data-ft="offline"]').forEach(x => x.addEventListener('click', () => App.switchPage('offline')));
el.querySelectorAll('[data-ft="edit-profile"]').forEach(x => x.addEventListener('click', () => App.switchPage('edit-profile')));

// 重置演示数据（保持不变）
el.querySelectorAll('[data-ft="reset"]').forEach(x => x.addEventListener('click', () => {
  if (confirm('确定重置所有演示数据吗？（本地数据将被清空）')) { localStorage.clear(); location.reload(); }
}));

// 点击头像区域，也跳转到资料编辑页
el.querySelector('.mine-head').addEventListener('click', () => App.switchPage('edit-profile'));
  }

 /* 新增：独立页面的渲染函数 */
function renderMyBirds() {
  const el = document.getElementById('page-my-birds');
  const birds = Store.birds().map(birdById).filter(Boolean);
  let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>`;
  if (birds.length) {
    html += `<div class="ai-cards">${birds.map(b => `
      <div class="ai-card" data-ft="bird-open" data-id="${b.id}">
        <div class="t">${b.name}</div><div class="d">${b.group} · ${b.rarity}</div>
      </div>`).join('')}</div>`;
  } else {
    html += `<div class="empty"><div class="e">🐦</div>还没有收藏鸟种<br>去「地图」或「AI识别」收录吧</div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
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
  el.innerHTML = html;
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
  el.innerHTML = html;
}

function renderEditProfile() {
  const el = document.getElementById('page-edit-profile');
  const u = Store.user();
  
  // 判断当前头像是图片还是emoji
  const isImgAvatar = u.avatar && (u.avatar.startsWith('data:image') || u.avatar.startsWith('http'));

  let html = `<div class="page-sub"><div class="page-back-btn" onclick="App.switchPage('mine')">← 返回我的</div>
    <div class="card"><div class="card-title">编辑资料</div>
    
    <!-- 头像展示区（支持图片和emoji） -->
    <div style="display:flex; justify-content:center; margin-bottom:15px;">
      <div style="width:80px; height:80px; border-radius:50%; background:var(--green-light); display:flex; justify-content:center; align-items:center; overflow:hidden; cursor:pointer;" onclick="document.getElementById('avatarUpload').click()">
        ${isImgAvatar ? `< img src="${u.avatar}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size:40px;">${u.avatar}</span>`}
      </div>
      <input type="file" id="avatarUpload" accept="image/*" capture="camera" style="display:none;" onchange="App.handleAvatarUpload(this)">
    </div>
    <div style="text-align:center; font-size:12px; color:#888; margin-bottom:15px;">点击头像拍照或上传照片</div>

    <input class="inp" id="editName" value="${escapeHtml(u.name)}" placeholder="昵称">
    
    <div class="section-title" style="margin:6px 0">或者选择 Emoji 头像</div>
    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
      ${['🦜', '🦆', '🦅', '🦉', '🐦', '🌿', '🌳', '📷', '🔭', '🧢'].map(a => `<span class="avatar" style="cursor:pointer;${u.avatar === a ? 'border:3px solid var(--green)' : ''}" data-ft="avatar" data-v="${a}">${a}</span>`).join('')}
    </div>
    
    <button class="btn primary block" id="saveProfile">保存资料</button></div></div>`;
  el.innerHTML = html;
  
  // Emoji 选择逻辑
  el.querySelectorAll('[data-ft="avatar"]').forEach(x => x.addEventListener('click', () => {
    el.querySelectorAll('[data-ft="avatar"]').forEach(y => y.style.border = '3px solid transparent');
    x.style.border = '3px solid var(--green)';
    el.dataset.pickedAvatar = x.dataset.v; // 存入dataset备用
  }));

  // 保存按钮逻辑
  el.querySelector('#saveProfile').addEventListener('click', () => {
    const name = el.querySelector('#editName').value.trim();
    const pickedEmoji = el.dataset.pickedAvatar;
    
    if (name) { u.name = name; }
    if (pickedEmoji) { u.avatar = pickedEmoji; } // 如果选了emoji就覆盖图片
    
    Store.saveUser(u); 
    toast('资料已更新'); 
    switchPage('mine');
  });
}
  // 处理图片上传（压缩后保存为base64）
function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const maxW = 200; // 头像不需要太大，200px足够
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale; 
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      const u = Store.user();
      u.avatar = base64; // 保存为 base64 字符串
      Store.saveUser(u);
      
      toast('头像上传成功');
      renderEditProfile(); // 重新渲染页面显示新头像
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
    collectBird(id);
    const spots = SPOTS.filter(s => s.birds.includes(id));
    const html = `
      <div class="bird-hero">
        <span class="avatar" style="background:${b.color}22;color:${b.color}">${b.name[0]}</span>
        <div><div class="bird-name">${b.name}</div>
        <div class="bird-latin">${b.latin} · ${b.family}</div></div>
      </div>
      <div class="bird-tags">
        <span class="btag">${b.group}</span><span class="btag">${b.rarity}</span><span class="btag">${b.habitat.split('、')[0]}</span>
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
    openModal('modalBird', `${b.name} · 鸟类档案`, html);
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
   // 顶部搜索全局绑定
const topSearchBtn = document.getElementById('topSearchBtn');
if (topSearchBtn) {
  topSearchBtn.addEventListener('click', () => {
    const modal = document.getElementById('modalSearch');
    const input = document.getElementById('globalSearchInput');
    const results = document.getElementById('searchResults');
    input.value = '';
    results.innerHTML = '<div class="empty" style="padding:20px"><div class="e">🔍</div>输入关键词开始搜索</div>';
    
    // 根据当前所在的页面，改变搜索提示词
    if (current === 'comm') input.placeholder = '搜索交流区帖子...';
    else if (current === 'map') input.placeholder = '搜索观测点或鸟种...';
    else if (current === 'ai') input.placeholder = '搜索鸟类知识...';
    else input.placeholder = '搜索当前页面...';

    // 监听输入事件，开始过滤
    input.oninput = (e) => {
      const kw = e.target.value.trim();
      if (!kw) { results.innerHTML = '<div class="empty" style="padding:20px"><div class="e">🔍</div>输入关键词开始搜索</div>'; return; }
      
      let html = '';
      // 搜索用户
const users = RANK_SEED.filter(u => u.name.includes(kw));
if(users.length) {
  html += users.map(u => `<div class="spot-item" onclick="document.getElementById('modalSearch').classList.remove('show'); App.viewUserProfile('${u.name}');"><div class="spot-name">👤 ${u.name} (用户)</div></div>`).join('');
}
      // 如果在交流界面，搜帖子
      if (current === 'comm') {
        const posts = Store.posts().filter(p => p.title.includes(kw) || p.content.includes(kw));
        if(posts.length) html = posts.map(p => `<div class="spot-item" onclick="document.getElementById('modalSearch').classList.remove('show'); App.toast('跳转到帖子详情（演示）');"><div class="spot-name">📝 ${escapeHtml(p.title)}</div><div class="post-content" style="font-size:12px;">${escapeHtml(p.content).slice(0, 50)}...</div></div>`).join('');
        else html = '<div class="empty" style="padding:20px">没有找到相关帖子</div>';
      }
      // 如果在AI界面或地图界面，搜鸟类数据
      else if (current === 'map' || current === 'ai') {
        const birds = BIRDS.filter(b => b.name.includes(kw) || b.features.includes(kw));
        if(birds.length) html = birds.map(b => `<div class="ai-card" onclick="document.getElementById('modalSearch').classList.remove('show'); App.openBird('${b.id}');"><div class="t">${b.name}</div><div class="d">${b.group} · ${b.rarity}</div></div>`).join('');
        else html = '<div class="empty" style="padding:20px">没有找到相关鸟类</div>';
      }
      results.innerHTML = html;
      // 👇 【新增】监听地点输入框，进行位置定位和10km筛选
const locationInp = document.getElementById('globalLocationInput');
if (locationInp) {
  locationInp.oninput = (e) => {
    const kw = e.target.value.trim();
    const foundSpot = SPOTS.find(s => s.name.includes(kw));
    if (foundSpot) {
      // 找到地点，把地图中心移过去，半径强制为10km，切到附近模式
      MapView.state.center = { lat: foundSpot.lat, lng: foundSpot.lng };
      MapView.state.radius = 10;
      MapView.state.tab = 'near';
      document.getElementById('modalSearch').classList.remove('show'); // 关掉搜索弹窗
      App.renderCurrent(); // 刷新地图
    } else if (kw === '') {
      // 清空输入框时恢复默认位置
      MapView.state.center = MapView.state.HOME; 
      App.renderCurrent();
    }
  };
}
    };
    modal.classList.add('show');
  });
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
    // 发帖类型选择
    document.querySelectorAll('#postTypeRow .pt').forEach(el =>
      el.addEventListener('click', () => {
        document.querySelectorAll('#postTypeRow .pt').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
      })
    );
    // 发帖图片
    document.getElementById('postImgInput').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      compressImage(f, data => {
        postImgData = data;
        document.getElementById('postImgPreview').innerHTML =
          `<img src="${data}"><span class="del" id="delPostImg">✕</span>`;
        document.getElementById('delPostImg').addEventListener('click', () => {
          postImgData = ''; document.getElementById('postImgPreview').innerHTML = '';
        });
      });
    });
    // 发布
    document.getElementById('postSubmit').addEventListener('click', submitPost);

    // 支持 URL hash 直达页面（便于演示与调试）：index.html#map
    const h = location.hash.replace('#', '');
    if (['comm', 'map', 'ai', 'progress', 'shop', 'msg', 'mine'].includes(h)) switchPage(h);
    else switchPage('comm');
  }

  return { init, switchPage, renderCurrent, toast, collectBird, openBird, openVip, birdById, viewUserProfile };
})();

/* 启动 */
document.addEventListener('DOMContentLoaded', () => App.init());
