/* ============================================================
 * Feather Trace —— 交互式地图模块
 * 说明：
 *  - 使用内置于代码的"离线地图"（SVG 示意地图），不依赖网络
 *  - 观测点数据 = 平台活跃用户上传 + 网络资料整理（与方案一致）
 *  - 支持：附近/类别/地点/筛选 四类检索 + 鸟点点击弹窗
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
    // 长江（自西南向东北穿过武汉）
    'M-20,300 C 250,270 420,318 560,300 C 700,282 820,330 1020,270 L1020,360 C 830,410 700,360 560,382 C 420,404 250,356 -20,392 Z',
    // 汉江（西北汇入长江，汉口处）
    'M240,-20 C 300,120 350,200 470,262 C 500,276 520,286 548,300 L 528,320 C 505,305 480,292 452,278 C 340,216 288,130 224,-20 Z',
    // 东湖
    'M 780,330 C 810,310 860,320 880,350 C 900,385 880,430 845,445 C 800,462 750,440 745,405 C 740,370 758,345 780,330 Z',
    // 沙湖
    'M 655,345 C 668,335 685,338 688,352 C 692,368 678,378 662,376 C 648,374 644,356 655,345 Z',
    // 金银湖
    'M 505,108 C 520,100 540,104 542,118 C 545,134 528,140 514,134 C 500,128 494,116 505,108 Z',
    // 汤逊湖
    'M 645,545 C 672,530 705,540 708,566 C 712,596 688,616 660,608 C 628,600 620,562 645,545 Z',
    // 梁子湖（右下大湖）
    'M 830,640 C 865,615 930,630 938,668 C 946,710 905,742 858,735 C 806,728 796,668 830,640 Z',
    // 涨渡湖
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
    center: HOME,
    locReady: false
  };

  function distKm(a, b) {
    const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  function filteredSpots() {
    return SPOTS.filter(s => {
      if (state.env !== '全部' && s.env !== state.env) return false;
      const spotGroups = new Set(s.birds.map(id => birdById(id).group));
      if (state.group !== '全部' && !spotGroups.has(state.group)) return false;
      if (state.tab === 'near' && distKm(state.center, s) > state.radius) return false;
      return true;
    });
  }

  function birdById(id) { return BIRDS.find(b => b.id === id) || { name: '未知' }; }

  function svgMap() {
    const spots = filteredSpots();
    let svg = `<svg id="birdMap" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    // 底图
    svg += `<rect width="${W}" height="${H}" fill="#E9F3E0"/>`;
    // 公园色块（示意）
    svg += `<ellipse cx="505" cy="182" rx="120" ry="80" fill="#CBE6B8" opacity=".65"/>`;   // 解放公园一带
    svg += `<ellipse cx="790" cy="240" rx="105" ry="70" fill="#D2E8C2" opacity=".6"/>`;    // 磨山一带
    // 水系
    RIVERS.forEach(r => svg += `<path d="${r}" fill="${LAKE_COLOR}" stroke="#90BCD6" stroke-width="1.5"/>`);
    // 半径圈（附近模式）
    if (state.tab === 'near') {
      const kmPerPx = (111 * (LAT1 - LAT0) / H) * 1.22; // 近似
      const rPx = state.radius / kmPerPx;
      const cx = toX(state.center.lng), cy = toY(state.center.lat);
      svg += `<circle cx="${cx}" cy="${cy}" r="${rPx}" fill="rgba(46,125,50,.10)" stroke="#2E7D32" stroke-dasharray="6 5" stroke-width="1.5"/>`;
      svg += `<text x="${cx}" y="${cy - rPx - 8}" text-anchor="middle" font-size="13" fill="#2E7D32" font-weight="600">${state.radius}km 范围</text>`;
      // 当前位置
      svg += `<circle cx="${cx}" cy="${cy}" r="10" fill="#F44336" stroke="#fff" stroke-width="2.5"/>`;
      svg += `<circle cx="${cx}" cy="${cy}" r="16" fill="none" stroke="#F44336" stroke-width="1.5" opacity=".6"><animate attributeName="r" values="10;26" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="1.6s" repeatCount="indefinite"/></circle>`;
      svg += `<text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="12" fill="#B71C1C">我的位置</text>`;
    }
    // 观测点标记
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
    // 无结果显示
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
      <div class="map-toolbar">
        <span class="chip ${t === 'near' ? 'active' : ''}" data-ft="map-tab" data-v="near">附近</span>
        <span class="chip ${t === 'group' ? 'active' : ''}" data-ft="map-tab" data-v="group">类别</span>
        <span class="chip ${t === 'spot' ? 'active' : ''}" data-ft="map-tab" data-v="spot">地点</span>
        <span class="chip ${t === 'filter' ? 'active' : ''}" data-ft="map-tab" data-v="filter">筛选</span>
      </div>
      <div class="map-legend">
        ${Object.entries(GROUP_COLOR).map(([k, c]) => `<span><i class="dot" style="background:${c}"></i>${k}</span>`).join('')}
        ${t === 'near' ? `<span style="color:#F44336">◎ 我的位置</span>` : ''}
      </div>
      <div class="map-wrap">${svgMap()}</div>
      <div class="filter-panel ${t === 'filter' ? 'show' : ''}" id="filterPanel">
        <div class="filter-row"><label>筛选半径</label>
          <input type="range" id="radiusRange" min="3" max="60" value="${state.radius}" step="1">
          <span class="val" id="radiusVal">${state.radius}km</span>
        </div>
        <div class="filter-row"><label>环境类型</label>
          <div class="chip-row" id="envChips">
            ${['全部','湿地','湖泊','公园','山林','园林'].map(e => `<span class="chip ${state.env === e ? 'active' : ''}" data-ft="env" data-v="${e}">${e}</span>`).join('')}
          </div>
        </div>
        <div class="filter-row"><label>鸟种类别</label>
          <div class="chip-row" id="groupChips">
            ${['全部','水鸟','林鸟','城市常见'].map(g => `<span class="chip ${state.group === g ? 'active' : ''}" data-ft="group" data-v="${g}">${g}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
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
      if (!list.length) html += `<div class="empty"><div class="e">🔭</div>范围内暂无观测点<br>试试扩大筛选半径</div>`;
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
    root.querySelectorAll('[data-ft="map-tab"]').forEach(el => {
      el.addEventListener('click', () => { state.tab = el.dataset.v; App.renderCurrent(); });
    });
    root.querySelectorAll('[data-ft="env"]').forEach(el => {
      el.addEventListener('click', () => { state.env = el.dataset.v; App.renderCurrent(); });
    });
    root.querySelectorAll('[data-ft="group"]').forEach(el => {
      el.addEventListener('click', () => { state.group = el.dataset.v; App.renderCurrent(); });
    });
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
    root.querySelectorAll('[data-ft="spot-open"]').forEach(el => {
      el.addEventListener('click', () => openSpot(el.dataset.id));
    });
    root.querySelectorAll('.spot-marker').forEach(el => {
      el.addEventListener('click', () => openSpot(el.dataset.spot));
    });
  }

  /* 观测点详情弹窗（含鸟种 → 鸟种详情联动 + 装备软广） */
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
        <a class="ga-btn" href="https://www.jd.com" target="_blank" rel="noopener">去京东看看 →</a>
      </div>`;
    document.getElementById('spotModalTitle').textContent = s.name;
    document.getElementById('spotModalBody').innerHTML = html;
    document.getElementById('modalSpot').classList.add('show');
    document.getElementById('spotModalBody').querySelectorAll('[data-ft="bird-open"]').forEach(el => {
      el.addEventListener('click', () => { closeModal('modalSpot'); App.openBird(el.dataset.id); });
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

  return { render, useGeolocation, state };
})();
