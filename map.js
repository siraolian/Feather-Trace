/* ============================================================
 * Feather Trace —— 交互式地图模块
 * 说明：
 *  - 使用内置于代码的"离线地图"（SVG 示意地图），不依赖网络
 *  - 观测点数据 = 平台活跃用户上传 + 网络资料整理（与方案一致）
 *  - 支持：搜索输入 / 环境下拉筛选 / 类别下拉筛选 / 观测点弹窗
 * ============================================================ */

const MapView = (() => {

  // 地图投影：武汉地区边界框 → SVG 视口
  const LNG0 = 113.7, LNG1 = 115.0, LAT1 = 30.82, LAT0 = 30.08;
  const W = 1000, H = 940;
  const toX = lng => (lng - LNG0) / (LNG1 - LNG0) * W;
  const toY = lat => (LAT1 - lat) / (LAT1 - LAT0) * H;

  // 默认"当前位置"：武汉市中心（可用定位覆盖）
  const HOME = { lat: 30.585, lng: 114.30 };

  // 简化水系（示意，非精确）
  const RIVERS = [
    'M-20,300 C 250,270 420,318 560,300 C 700,282 820,330 1020,270 L1020,360 C 830,410 700,360 560,382 C 420,404 250,356 -20,392 Z',
    'M240,-20 C 300,120 350,200 470,262 C 500,276 520,286 548,300 L 528,320 C 505,305 480,292 452,278 C 340,216 288,130 224,-20 Z',
    'M 780,330 C 810,310 860,320 880,350 C 900,385 880,430 845,445 C 800,462 750,440 745,405 C 740,370 758,345 780,330 Z',
    'M 655,345 C 668,335 685,338 688,352 C 692,368 678,378 662,376 C 648,374 644,356 655,345 Z',
    'M 505,108 C 520,100 540,104 542,118 C 545,134 528,140 514,134 C 500,128 494,116 505,108 Z',
    'M 645,545 C 672,530 705,540 708,566 C 712,596 688,616 660,608 C 628,600 620,562 645,545 Z',
    'M 830,640 C 865,615 930,630 938,668 C 946,710 905,742 858,735 C 806,728 796,668 830,640 Z',
    'M 945,215 C 962,208 980,214 982,230 C 984,248 966,256 950,250 C 934,244 932,222 945,215 Z'
  ];
  const LAKE_COLOR = '#A7D3E8', RIVER_COLOR = '#8FC7E6';

  const GROUP_COLOR = { '水鸟': '#1E88E5', '林鸟': '#43A047', '城市常见': '#8D6E63' };
  const ENV_COLOR = { '湿地': '#009688', '湖泊': '#1E88E5', '公园': '#66BB6A', '山林': '#558B2F', '园林': '#7CB342' };

  let state = {
    tab: 'near',          // near附近 / group类别 / spot地点 / filter筛选
    group: '全部',         // 全部/水鸟/林鸟/城市常见
    env: '全部',           // 全部/湿地/湖泊/公园/山林/园林
    radius: 10,            // 筛选半径(km)
    keyword: '',           // 搜索关键词
    center: HOME,
    locReady: false,
    zoom: 1 //缩放倍数
  };

  function distKm(a, b) {
    const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  // 核心过滤逻辑（结合了关键词、环境、类别、半径）
  function filteredSpots() {
    return SPOTS.filter(s => {
      if (state.env !== '全部' && s.env !== state.env) return false;
      
      const spotGroups = new Set(s.birds.map(id => birdById(id).group));
      if (state.group !== '全部' && !spotGroups.has(state.group)) return false;
      
      if (state.keyword.trim() !== '') {
        const kw = state.keyword.trim().toLowerCase();
        const nameMatch = s.name.toLowerCase().includes(kw);
        const birdMatch = s.birds.some(id => birdById(id).name.toLowerCase().includes(kw));
        if (!nameMatch && !birdMatch) return false;
      }

      if (state.tab === 'near' && distKm(state.center, s) > state.radius) return false;
      return true;
    });
  }

  function birdById(id) { return BIRDS.find(b => b.id === id) || { name: '未知', group: '未知', rarity: '未知' }; }

  function svgMap() {
    const spots = filteredSpots();
    let svg = `<svg id="birdMap" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${W}" height="${H}" fill="#E9F3E0"/>`;
    svg += `<ellipse cx="505" cy="182" rx="120" ry="80" fill="#CBE6B8" opacity=".65"/>`;
    svg += `<ellipse cx="790" cy="240" rx="105" ry="70" fill="#D2E8C2" opacity=".6"/>`;
    
    RIVERS.forEach(r => svg += `<path d="${r}" fill="${LAKE_COLOR}" stroke="#90BCD6" stroke-width="1.5"/>`);
    
    if (state.tab === 'near') {
      const kmPerPx = (111 * (LAT1 - LAT0) / H) * 1.22;
      const rPx = state.radius / kmPerPx;
      const cx = toX(state.center.lng), cy = toY(state.center.lat);
      svg += `<circle cx="${cx}" cy="${cy}" r="${rPx}" fill="rgba(46,125,50,.10)" stroke="#2E7D32" stroke-dasharray="6 5" stroke-width="1.5"/>`;
      svg += `<text x="${cx}" y="${cy - rPx - 8}" text-anchor="middle" font-size="13" fill="#2E7D32" font-weight="600">${state.radius}km 范围</text>`;
      svg += `<circle cx="${cx}" cy="${cy}" r="10" fill="#F44336" stroke="#fff" stroke-width="2.5"/>`;
      svg += `<circle cx="${cx}" cy="${cy}" r="16" fill="none" stroke="#F44336" stroke-width="1.5" opacity=".6"><animate attributeName="r" values="10;26" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="1.6s" repeatCount="indefinite"/></circle>`;
      svg += `<text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="12" fill="#B71C1C">我的位置</text>`;
    }
    
    spots.forEach(s => {
      const cx = toX(s.lng), cy = toY(s.lat);
      const c = ENV_COLOR[s.env] || '#2E7D32';
      svg += `<g class="spot-marker" data-spot="${s.id}" style="cursor:pointer">
        <circle cx="${cx}" cy="${cy}" r="13" fill="${c}" stroke="#fff" stroke-width="2.5"/>
        <circle cx="${cx}" cy="${cy}" r="17" fill="none" stroke="${c}" opacity=".35"/>
        <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">鸟</text>
        <text x="${cx}" y="${cy - 20}" text-anchor="middle" font-size="12" fill="#37474F" font-weight="600" style="pointer-events:none">${s.name}</text>
      </g>`;
    });
    
    if (!spots.length) {
      svg += `<text x="${W/2}" y="${H/2}" text-anchor="middle" font-size="16" fill="#78909C">当前条件下暂无观测点</text>`;
    }
    svg += `</svg>`;
    return svg;
  }
  /* ---- 渲染入口 ---- */
  function render(container) {
    const t = state.tab;
    let html = `
  <div class="map-toolbar" style="display:flex; flex-direction:column; gap:10px; padding: 10px 12px 0;">
    <div style="display:flex; gap:8px;">
      <input type="text" id="mapSearchInput" value="${state.keyword}" placeholder="搜索观测点或鸟种..." style="flex:1; border:1px solid #ccc; border-radius:20px; padding:8px 15px; font-size:13px; outline:none;">
    </div>
    <div style="display:flex; gap:8px;">
      <select id="mapEnvSelect" style="flex:1; border:1px solid #ccc; border-radius:20px; padding:8px; font-size:13px; outline:none;">
        <option value="全部" ${state.env === '全部' ? 'selected' : ''}>全部环境</option>
        <option value="湿地" ${state.env === '湿地' ? 'selected' : ''}>湿地</option>
        <option value="湖泊" ${state.env === '湖泊' ? 'selected' : ''}>湖泊</option>
        <option value="公园" ${state.env === '公园' ? 'selected' : ''}>公园</option>
        <option value="山林" ${state.env === '山林' ? 'selected' : ''}>山林</option>
        <option value="园林" ${state.env === '园林' ? 'selected' : ''}>园林</option>
      </select>
      <select id="mapGroupSelect" style="flex:1; border:1px solid #ccc; border-radius:20px; padding:8px; font-size:13px; outline:none;">
        <option value="全部" ${state.group === '全部' ? 'selected' : ''}>全部类别</option>
        <option value="水鸟" ${state.group === '水鸟' ? 'selected' : ''}>水鸟</option>
        <option value="林鸟" ${state.group === '林鸟' ? 'selected' : ''}>林鸟</option>
        <option value="城市常见" ${state.group === '城市常见' ? 'selected' : ''}>城市常见</option>
      </select>
    </div>
    <!-- 👇 【新增】缩放按钮 -->
    <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:4px;">
      <button class="btn ghost" style="padding:4px 12px; font-size:15px;" onclick="MapView.zoomIn()">➕ 放大</button>
      <button class="btn ghost" style="padding:4px 12px; font-size:15px;" onclick="MapView.zoomOut()">➖ 缩小</button>
    </div>
  </div>
  <div class="map-legend">
    ${Object.entries(GROUP_COLOR).map(([k, c]) => `<span><i class="dot" style="background:${c}"></i>${k}</span>`).join('')}
    ${t === 'near' ? `<span style="color:#F44336">◎ 定位点（10km内）</span>` : ''}
  </div>
  <!-- 👇 增加 max-height 和 overflow auto，配合放大查看 -->
  <div class="map-wrap" style="overflow: auto; max-height: 480px;">
    <div style="transform: scale(${state.zoom}); transform-origin: top left; transition: transform 0.2s;">
      ${svgMap()}
    </div>
  </div>
`;

    // 保留原有筛选面板（仅当点击“筛选”时显示）
    if (t === 'filter') {
      html += `<div class="filter-panel show" id="filterPanel">
        <div class="filter-row"><label>筛选半径</label>
          <input type="range" id="radiusRange" min="3" max="60" value="${state.radius}" step="1">
          <span class="val" id="radiusVal">${state.radius}km</span>
        </div>
      </div>`;
    }

    if (t === 'spot' || t === 'group') {
      html += `<div class="section-title">${t === 'spot' ? '🌍 全部观测点（按热度排序）' : `🧭 包含「${state.group}」的观测点`}</div><div class="spot-list">`;
      const list = [...SPOTS]
        .filter(s => state.group === '全部' || s.birds.some(id => birdById(id).group === state.group))
        .sort((a, b) => (b.uploads + b.birds.length * 10) - (a.uploads + a.birds.length * 10));
      list.forEach(s => {
        const names = s.birds.slice(0, 4).map(id => birdById(id).name).join('、');
        html += `<div class="spot-item" data-ft="spot-open" data-id="${s.id}">
          <div class="spot-name">📍 ${s.name} <span class="hot-badge" style="margin-left:auto">${s.uploads}条记录</span></div>
          <div class="spot-meta"><span>${s.env}</span><span>${s.level}</span><span>${s.uploads}次用户上传</span></div>
          <div class="spot-birds">🐦 ${names}${s.birds.length > 4 ? ' 等' + s.birds.length + '种' : ''}</div>
        </div>`;
      });
      html += `</div>`;
    }

    if (t === 'near') {
      html += `<div class="section-title">📍 附近推荐观测点（${state.radius}km 内，按热度）</div><div class="spot-list">`;
      const list = filteredSpots().sort((a, b) => b.uploads - a.uploads);
      if (!list.length) html += `<div class="empty"><div class="e">🔭</div>范围内暂无观测点<br>试试调整搜索或筛选条件</div>`;
      list.forEach(s => {
        const names = s.birds.slice(0, 4).map(id => birdById(id).name).join('、');
        html += `<div class="spot-item" data-ft="spot-open" data-id="${s.id}">
          <div class="spot-name">📍 ${s.name} <span style="font-size:12px;color:var(--text2);font-weight:400">${distKm(state.center, s).toFixed(1)}km</span> <span class="hot-badge" style="margin-left:auto">${s.uploads}条记录</span></div>
          <div class="spot-meta"><span>${s.env}</span><span>${s.level}</span><span>${s.uploads}次用户上传</span></div>
          <div class="spot-birds">🐦 ${names}${s.birds.length > 4 ? ' 等' + s.birds.length + '种' : ''}</div>
        </div>`;
      });
      html += `</div>`;
    }

    html += `<div class="card" style="margin-top:14px">
      <div class="card-title">📊 数据来源说明</div>
      <div class="card-sub">观测点与鸟种记录由平台活跃用户上传，经平台收集整理，并参考网络公开资料交叉验证。数据脱敏后可用于科研生态保护（详见运营方案）。</div>
    </div>`;
    
    container.innerHTML = html;
    bindEvents(container);
  }

  function bindEvents(root) {
    const searchInp = root.querySelector('#mapSearchInput');
    const envSel = root.querySelector('#mapEnvSelect');
    const groupSel = root.querySelector('#mapGroupSelect');

     // 输入框实时搜索过滤
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        state.keyword = e.target.value;
        // 只重绘列表和地图，不重新聚焦输入框，所以把光标位置存一下
        const cursorPos = searchInp.selectionStart;
        App.renderCurrent();
        // 重绘后重新聚焦并恢复光标（否则用户打字体验会很差）
        const newInp = document.getElementById('mapSearchInput');
        if (newInp) { newInp.focus(); newInp.setSelectionRange(cursorPos, cursorPos); }
      });
    }

    // 下拉菜单筛选
    if (envSel) envSel.addEventListener('change', (e) => { state.env = e.target.value; App.renderCurrent(); });
    if (groupSel) groupSel.addEventListener('change', (e) => { state.group = e.target.value; App.renderCurrent(); });

    // 重新绑定原有的半径滑块
    const r = root.querySelector('#radiusRange');
    if (r) {
      r.addEventListener('input', () => {
        state.radius = +r.value;
        const v = root.querySelector('#radiusVal');
        if (v) v.textContent = state.radius + 'km';
      });
      r.addEventListener('change', () => {
        state.radius = +r.value;
        App.renderCurrent();
      });
    }

    // 列表和地图的点击弹窗绑定
    root.querySelectorAll('[data-ft="spot-open"]').forEach(el => {
      el.addEventListener('click', () => openSpot(el.dataset.id));
    });
    root.querySelectorAll('.spot-marker').forEach(el => {
      el.addEventListener('click', () => openSpot(el.dataset.spot));
    });
  }

  /* 观测点详情弹窗 */
  function openSpot(id) {
    const s = SPOTS.find(x => x.id === id); if (!s) return;
    const birds = s.birds.map(bid => birdById(bid));
    const html = `
      <div class="info-block"><b>📍 ${s.name}</b> · ${s.env} · ${s.level}</div>
      <div class="info-block">${s.desc}</div>
      <div class="info-block"><b>📌 数据</b>：${s.uploads} 条用户观测记录（平台用户上传 + 网络资料整理）</div>
      <div class="section-title" style="margin:6px 0">此观测点常见鸟类（点击查看详情）</div>
      <div class="ai-cards">
        ${birds.map(b => `<div class="ai-card" data-ft="bird-open" data-id="${b.id}">
          <div class="t"><span class="avatar" style="width:26px;height:26px;font-size:13px;display:inline-flex;margin-right:6px;background:${b.color}22;color:${b.color}">${b.name[0]}</span>${b.name}</div>
          <div class="d">${b.group} · ${b.rarity}</div>
        </div>`).join('')}
      </div>
      <div class="gear-ad">
        <div class="ga-title">🎯 装备推荐（软广导流）</div>
        <div>观察${s.name}周边环境，推荐「${birds[0] ? birds[0].equipment : '8×42双筒望远镜'}」</div>
        <a class="ga-btn" href=" " target="_blank" rel="noopener">去京东看看 →</a >
      </div>`;
    
    // 如果 modalSpot 不存在，就动态创建一个（防止 index.html 没写）
    let modalSpot = document.getElementById('modalSpot');
    if (!modalSpot) {
      modalSpot = document.createElement('div');
      modalSpot.id = 'modalSpot';
      modalSpot.className = 'modal';
      modalSpot.innerHTML = `<div class="modal-inner"><div class="modal-head"><span id="spotModalTitle"></span><span class="close" onclick="document.getElementById('modalSpot').classList.remove('show')">✕</span></div><div class="modal-body" id="spotModalBody"></div></div>`;
      document.body.appendChild(modalSpot);
    }

    document.getElementById('spotModalTitle').textContent = s.name;
    document.getElementById('spotModalBody').innerHTML = html;
    modalSpot.classList.add('show');
    
    document.getElementById('spotModalBody').querySelectorAll('[data-ft="bird-open"]').forEach(el => {
      el.addEventListener('click', () => { modalSpot.classList.remove('show'); App.openBird(el.dataset.id); });
    });
  }

  function useGeolocation() {
    if (state.locReady) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        state.center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.locReady = true;
        App.renderCurrent();
      }, () => {}, { timeout: 4000 });
    }
  }

  // 👇 【新增】缩放控制函数
function zoomIn() {
  state.zoom = Math.min(3, state.zoom + 0.3); // 最大放大3倍
  App.renderCurrent();
}

function zoomOut() {
  state.zoom = Math.max(0.5, state.zoom - 0.3); // 最小缩小到0.5倍
  App.renderCurrent();
}
  return { render, useGeolocation, state, zoomIn, zoomOut };
})();
