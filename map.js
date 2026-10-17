/* ============================================================
 * Feather Trace —— 交互式地图模块
 * ============================================================ */

const MapView = (() => {
  const LNG0 = 113.7, LNG1 = 115.0, LAT1 = 30.82, LAT0 = 30.08;
  const W = 1000, H = 940;
  const toX = lng => (lng - LNG0) / (LNG1 - LNG0) * W;
  const toY = lat => (LAT1 - lat) / (LAT1 - LAT0) * H;
  const HOME = { lat: 30.585, lng: 114.30 };

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
  const LAKE_COLOR = '#A7D3E8';
  const GROUP_COLOR = { '水鸟': '#1E88E5', '林鸟': '#43A047', '城市常见': '#8D6E63' };
  const ENV_COLOR = { '湿地': '#009688', '湖泊': '#1E88E5', '公园': '#66BB6A', '山林': '#558B2F', '园林': '#7CB342' };

  let state = { tab: 'near', group: '全部', env: '全部', radius: 10, keyword: '', center: HOME, locReady: false, zoom: 1 };

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
    RIVERS.forEach(r => svg += `<path d="${r}" fill="${LAKE_COLOR}" stroke="#90BCD6" stroke-width="1.5"/>`);
    
    if (state.tab === 'near') {
      const kmPerPx = (111 * (LAT1 - LAT0) / H) * 1.22;
      const rPx = state.radius / kmPerPx;
      const cx = toX(state.center.lng), cy = toY(state.center.lat);
      svg += `<circle cx="${cx}" cy="${cy}" r="${rPx}" fill="rgba(149,189,57,.1)" stroke="#95BD39" stroke-dasharray="6 5" stroke-width="1.5"/>`;
      svg += `<circle cx="${cx}" cy="${cy}" r="10" fill="#F44336" stroke="#fff" stroke-width="2.5"/>`;
    }
    
    spots.forEach(s => {
      const cx = toX(s.lng), cy = toY(s.lat);
      const c = ENV_COLOR[s.env] || '#2E7D32';
      svg += `<g class="spot-marker" data-spot="${s.id}" style="cursor:pointer">
        <circle cx="${cx}" cy="${cy}" r="24" fill="transparent" />
        <circle cx="${cx}" cy="${cy}" r="13" fill="${c}" stroke="#fff" stroke-width="2.5"/>
        <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">鸟</text>
        <text x="${cx}" y="${cy - 20}" text-anchor="middle" font-size="12" fill="#37474F" font-weight="600" style="pointer-events:none">${s.name}</text>
      </g>`;
    });
    svg += `</svg>`;
    return svg;
  }

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
          </select>
          <select id="mapGroupSelect" style="flex:1; border:1px solid #ccc; border-radius:20px; padding:8px; font-size:13px; outline:none;">
            <option value="全部" ${state.group === '全部' ? 'selected' : ''}>全部类别</option>
            <option value="水鸟" ${state.group === '水鸟' ? 'selected' : ''}>水鸟</option>
            <option value="林鸟" ${state.group === '林鸟' ? 'selected' : ''}>林鸟</option>
          </select>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:4px;">
          <button class="btn ghost" style="padding:4px 12px; font-size:15px;" onclick="MapView.zoomIn()">➕ 放大</button>
          <button class="btn ghost" style="padding:4px 12px; font-size:15px;" onclick="MapView.zoomOut()">➖ 缩小</button>
        </div>
      </div>
      <div class="map-legend">
        ${Object.entries(GROUP_COLOR).map(([k, c]) => `<span><i class="dot" style="background:${c}"></i>${k}</span>`).join('')}
        ${t === 'near' ? `<span style="color:#F44336">◎ 定位点（${state.radius}km内）</span>` : ''}
      </div>
      <div class="map-wrap" style="overflow: auto; max-height: 480px;">
        <div style="transform: scale(${state.zoom}); transform-origin: top left; transition: transform 0.2s;">
          ${svgMap()}
        </div>
      </div>
    `;

    html += `<div class="section-title">📍 附近推荐观测点</div><div class="spot-list">`;
    const list = filteredSpots().sort((a, b) => b.uploads - a.uploads);
    if (!list.length) html += `<div class="empty"><div class="e">🔭</div>暂无匹配的观测点</div>`;
    list.forEach(s => {
      html += `<div class="spot-item" onclick="MapView.openSpot('${s.id}')">
        <div class="spot-name">📍 ${s.name} <span class="hot-badge" style="margin-left:auto">${s.uploads}条记录</span></div>
        <div class="spot-meta"><span>${s.env}</span><span>${s.level}</span></div>
      </div>`;
    });
    html += `</div>`;

    container.innerHTML = html;
    bindEvents(container);
  }

  function bindEvents(root) {
    const searchInp = root.querySelector('#mapSearchInput');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => {
        state.keyword = e.target.value;
        const pos = searchInp.selectionStart;
        App.renderCurrent();
        const newInp = document.getElementById('mapSearchInput');
        if (newInp) { newInp.focus(); newInp.setSelectionRange(pos, pos); }
      });
    }

    const envSel = root.querySelector('#mapEnvSelect');
    if (envSel) envSel.addEventListener('change', (e) => { state.env = e.target.value; App.renderCurrent(); });
    const groupSel = root.querySelector('#mapGroupSelect');
    if (groupSel) groupSel.addEventListener('change', (e) => { state.group = e.target.value; App.renderCurrent(); });

    root.querySelectorAll('.spot-marker').forEach(el => {
      el.addEventListener('click', () => openSpot(el.dataset.spot));
    });
  }

  function openSpot(id) {
    const s = SPOTS.find(x => x.id === id); if (!s) return;
    const birds = s.birds.map(bid => birdById(bid));
    const html = `
      <div class="info-block"><b>📍 ${s.name}</b> · ${s.env} · ${s.level}</div>
      <div class="info-block">${s.desc}</div>
      <div class="info-block"><b>📌 数据</b>：${s.uploads} 条用户观测记录</div>
      <div class="section-title" style="margin:6px 0">此观测点常见鸟类</div>
      <div class="ai-cards">
        ${birds.map(b => `<div class="ai-card" onclick="closeModal('modalSpot'); App.openBird('${b.id}')">
          <div class="t">${b.name}</div><div class="d">${b.group}</div>
        </div>`).join('')}
      </div>`;
    
    document.getElementById('spotModalTitle').textContent = s.name;
    document.getElementById('spotModalBody').innerHTML = html;
    document.getElementById('modalSpot').classList.add('show');
  }

  function useGeolocation() {
    if (state.locReady) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        state.center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.locReady = true; App.renderCurrent();
      }, () => {}, { timeout: 4000 });
    }
  }

  function zoomIn() { state.zoom = Math.min(3, state.zoom + 0.3); App.renderCurrent(); }
  function zoomOut() { state.zoom = Math.max(0.5, state.zoom - 0.3); App.renderCurrent(); }

  return { render, useGeolocation, state, zoomIn, zoomOut, openSpot };
})();
