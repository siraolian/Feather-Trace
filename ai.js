/* ============================================================
 * Feather Trace —— AI 识别模块
 * 说明：
 *  本模块为「离线演示版」：内置物种库 + 特征关键词匹配，
 *  无需服务器即可完整演示交互流程。
 *  接入真实 AI 识别模型的方法见 README（推荐：部署轻量
 *  分类模型或调用云端图像识别 API，识别逻辑替换 recognize()）。
 * ============================================================ */

const AI = (() => {

  /* 关键词 → 鸟种 匹配表（用于文字描述识别） */
  const KEYWORDS = [
    { keys: ['翠鸟', '蓝色', '水边', '俯冲', '捕鱼', '小翠'], bird: 'cuiniao' },
    { keys: ['白鹭', '白色', '长腿', '浅滩', '涉水'], bird: 'bailu' },
    { keys: ['夜鹭', '红眼', '站树', '缩脖'], bird: 'yelu' },
    { keys: ['苍鹭', '灰色', '大鸟', '站着不动', '老等'], bird: 'canglu' },
    { keys: ['绿头鸭', '绿头', '野鸭', '水面'], bird: 'lvtouya' },
    { keys: ['戴胜', '羽冠', '花鸟', '黑白', '长嘴'], bird: 'daisheng' },
    { keys: ['红嘴蓝鹊', '蓝鹊', '长尾', '红嘴'], bird: 'hongzuilanque' },
    { keys: ['白头', '枕白', '叽啾'], bird: 'baitoubei' },
    { keys: ['乌鸫', '黑色', '黄嘴', '百舌'], bird: 'wudong' },
    { keys: ['麻雀', '脸颊黑斑', '小区'], bird: 'mashu' },
    { keys: ['斑鸠', '珠链', '咕咕'], bird: 'zhuijing' },
    { keys: ['灰喜鹊', '蓝灰', '长尾'], bird: 'huixique' },
    { keys: ['小䴙䴘', '潜水', '小鸭子', '没尾巴'], bird: 'xiaopiti' },
    { keys: ['黑水鸡', '红嘴', '黑鸡'], bird: 'heishuiji' },
    { keys: ['山雀', '倒挂', '吱吱啾'], bird: 'dashan' },
    { keys: ['柳莺', '极小', '橄榄绿'], bird: 'huangyao' },
    { keys: ['金翅', '黄斑'], bird: 'jinqiao' },
    { keys: ['红尾鸲', '颤尾', '橙红'], bird: 'beihong' },
    { keys: ['伯劳', '黑眼罩', '屠夫'], bird: 'zongbei' },
    { keys: ['鹡鸰', '点尾', '波浪'], bird: 'bailing' },
    { keys: ['鹊鸲', '小喜鹊'], bird: 'quequ' },
    { keys: ['噪鹛', '黑脸', '吵闹'], bird: 'heilian' },
    { keys: ['红头长尾', '毛球'], bird: 'hongtou' },
    { keys: ['斑嘴鸭', '黄嘴尖'], bird: 'banduanya' },
    { keys: ['树莺', '灌丛', '咳嗽声'], bird: 'huangfu' }
  ];

  /* ---- 图片识别（演示版）----
   * 真实场景：此处替换为「上传图片 → 模型推理 → 返回鸟种+置信度」
   * 演示版：根据图片内容指纹 + 随机种子，从物种库挑选结果 */
  function recognizeImage(file, callback) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = e.target.result;
      // 图片内容指纹（演示用确定性随机）
      let hash = 0;
      for (let i = 0; i <img.length; i += 97) hash = (hash * 31 + img.charCodeAt(i)) >>> 0;
      const list = ['cuiniao', 'bailu', 'baitoubei', 'wudong', 'daisheng', 'hongzuilanque', 'heishuiji', 'lvtouya'];
      const pick = list[hash % list.length];
      const conf = 0.82 + (hash % 13) / 100;
      callback({ img, bird: BIRDS.find(b => b.id === pick), conf, demo: true });
    };
    reader.readAsDataURL(file);
  }

  /* ---- 文字描述识别 ---- */
  function recognizeText(text) {
    let best = null, score = 0;
    KEYWORDS.forEach(k => {
      let s = 0;
      k.keys.forEach(w => { if (text.includes(w)) s++; });
      if (s > score) { score = s; best = k.bird; }
    });
    if (!best) return null;
    return { bird: BIRDS.find(b => b.id === best), conf: Math.min(0.97, 0.55 + score * 0.14) };
  }

  /* ---- 相关推荐：同科属 / 相似 / 同时高频出现 ---- */
  function recommend(bird) {
    const sameFamily = BIRDS.filter(b => b.family === bird.family && b.id !== bird.id);
    const sameGroup = BIRDS.filter(b => b.group === bird.group && b.id !== bird.id && b.family !== bird.family);
    const coOccur = [];
    SPOTS.forEach(s => {
      if (s.birds.includes(bird.id)) s.birds.forEach(id => {
        if (id !== bird.id && !coOccur.includes(id) && !sameFamily.some(b => b.id === id)) coOccur.push(id);
      });
    });
    const recs = [];
    sameFamily.slice(0, 2).forEach(b => recs.push({ bird: b, why: '同科属近亲' }));
    sameGroup.slice(0, 2).forEach(b => recs.push({ bird: b, why: '相似习性' }));
    coOccur.slice(0, 2).forEach(id => recs.push({ bird: BIRDS.find(b => b.id === id), why: '同地高频出现' }));
    return recs.slice(0, 4);
  }

  /* ---- AI 对话（离线知识库问答）---- */
  const QA = [
    { q: ['翠鸟', '怎么拍', '拍摄'], a: AI_KNOWLEDGE['翠鸟怎么拍'] },
    { q: ['设备', '相机', '望远镜', '入门', '新手'], a: AI_KNOWLEDGE['入门设备'] },
    { q: ['武汉', '去哪', '观鸟点', '地方'], a: AI_KNOWLEDGE['武汉去哪里'] },
    { q: ['夜鹭', '苍鹭', '区别', '区分'], a: AI_KNOWLEDGE['夜鹭和苍鹭区别'] },
    { q: ['守则', '保护', '规则', '文明'], a: AI_KNOWLEDGE['观鸟守则'] }
  ];
  function chat(text) {
    for (const item of QA) {
      if (item.q.some(k => text.includes(k))) return item.a;
    }
    // 物种知识：命中鸟种名则返回知识讲解
    const hit = BIRDS.find(b => text.includes(b.name) || text.includes(b.name.slice(0, 2)));
    if (hit) return `${hit.name}(${hit.latin})\n识别要点:${hit.features}\n习性:${hit.behavior}\n常见地点:${hit.location}\n观察建议：${hit.tips}`;
    return '我是 Feather Trace 观鸟助手 🐦\n你可以问我:\n· “翠鸟怎么拍”\n· “新手入门设备推荐”\n· “武汉去哪观鸟”\n· “夜鹭和苍鹭怎么区分”\n· 或直接输入鸟名（如"黄腹树莺"）查询知识讲解';
  }

  /* ---- 渲染 AI 识别页 ---- */
  function render(container) {
    const html = `
      <div class="ai-upload" id="aiUpload">
        <div class="big">📷</div>
        <div>上传图片 / 拍摄,AI 识别鸟类</div>
        <div style="font-size:11px;margin-top:6px">离线可识别 · 支持与 AI 对话</div>
        <input type="file" id="aiFileInput" accept="image/*" hidden>
      </div>
      <div class="ai-preview" id="aiPreview"></div>
      <div class="card" id="aiDescPanel">
        <div class="filter-row"><label style="width:80px">文字描述</label>
          <input class="inp" style="margin:0;flex:1" id="aiTextInput" placeholder="如：蓝色的小鸟在水边捕鱼">
          <button class="btn primary" id="aiTextBtn" style="padding:10px 14px">识别</button>
        </div>
      </div>
      <div class="ai-result" id="aiResult"></div>
      <div class="chat-list-wrap">
        <div class="section-title">💬 AI 观鸟助手（离线知识库）</div>
        <div class="ai-chat">
          <div class="chat-list" id="chatList">
            <div class="chat-bubble ai">你好，我是 Feather Trace 观鸟助手！上传图片或输入鸟种描述，我帮你识别；也可以问我观鸟问题，比如"翠鸟怎么拍"。🐦</div>
          </div>
          <div class="chat-input-row">
            <input class="inp" style="margin:0;flex:1" id="chatInput" placeholder="问问 AI…">
            <button class="btn primary" id="chatSend">发送</button>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="card-title">🤖 识别能力说明</div>
        <div class="card-sub">当前为离线演示版识别（内置物种库+特征匹配）。正式版可接入云端 AI 模型：支持稀有鸟种识别、声纹识别（VIP）、文字描述识别，识别后自动推荐同科属、相似习性、同地高频出现的鸟类。</div>
      </div>
    `;
    container.innerHTML = html;

    // 上传识别
    const upload = container.querySelector('#aiUpload');
    const fileInput = container.querySelector('#aiFileInput');
    upload.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const f = fileInput.files[0]; if (!f) return;
      recognizeImage(f, res => {
        const pv = container.querySelector('#aiPreview');
        pv.style.display = 'block';
        pv.innerHTML = `<img src="${res.img}" alt="待识别图片">`;
        renderResult(container, res.bird, res.conf, res.demo);
        // 识别即收录该鸟种
        App.collectBird(res.bird.id);
      });
    });

    // 文字识别
    const textBtn = container.querySelector('#aiTextBtn');
    const textInput = container.querySelector('#aiTextInput');
    const doText = () => {
      const t = textInput.value.trim(); if (!t) return;
      const res = recognizeText(t);
      if (!res) { App.toast('没匹配到，换个说法试试，或上传图片'); return; }
      renderResult(container, res.bird, res.conf, false);
      App.collectBird(res.bird.id);
    };
    textBtn.addEventListener('click', doText);
    textInput.addEventListener('keydown', e => { if (e.key === 'Enter') doText(); });

    // AI 对话
    const chatList = container.querySelector('#chatList');
    const chatInput = container.querySelector('#chatInput');
    const send = () => {
      const t = chatInput.value.trim(); if (!t) return;
      chatList.insertAdjacentHTML('beforeend', `<div class="chat-bubble me">${escapeHtml(t)}</div>`);
      chatInput.value = '';
      setTimeout(() => {
        chatList.insertAdjacentHTML('beforeend', `<div class="chat-bubble ai">${escapeHtml(chat(t))}</div>`);
        chatList.scrollTop = chatList.scrollHeight;
      }, 350);
      chatList.scrollTop = chatList.scrollHeight;
    };
    container.querySelector('#chatSend').addEventListener('click', send);
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }

  function renderResult(container, bird, conf, demo) {
    const recs = recommend(bird);
    const html = `
      <div class="card">
        <div class="card-title">🔍 识别结果</div>
        <div style="display:flex;align-items:center;gap:12px;margin:10px 0">
          <span class="avatar" style="width:52px;height:52px;font-size:22px;background:${bird.color}22;color:${bird.color}">${bird.name[0]}</span>
          <div>
            <div style="font-size:18px;font-weight:700">${bird.name}</div>
            <div style="font-size:12px;color:var(--text2);font-style:italic">${bird.latin} · ${bird.family}</div>
          </div>
          <span style="margin-left:auto;font-size:12px;color:var(--green);font-weight:600">${(conf * 100).toFixed(0)}%</span>
        </div>
        <div class="ai-confidence"><i style="width:${conf * 100}%"></i></div>
        ${demo ? '<div style="font-size:11px;color:#F59E0B;margin-bottom:8px">⚠ 演示模式：本地内置库模拟识别，正式版接入云端 AI 模型</div>' : ''}
        <div class="info-block"><b>识别要点</b>:${bird.features}</div>
        <div class="info-block"><b>习性</b>:${bird.behavior}</div>
        <div class="info-block"><b>常见地点</b>:${bird.location}</div>
        <div class="info-block"><b>鸣声</b>:${bird.audio}</div>
        <div class="info-block"><b>观察建议</b>:${bird.tips}</div>
        <button class="btn ghost block" data-ft="bird-open" data-id="${bird.id}">查看完整档案 & 装备推荐</button>
      </div>
      <div class="card">
        <div class="card-title">✨ AI 智能推荐</div>
        <div class="ai-cards">
          ${recs.map(r => `<div class="ai-card" data-ft="bird-open" data-id="${r.bird.id}">
            <div class="t">${r.bird.name}</div>
            <div class="d">${r.why} · ${r.bird.group}</div>
          </div>`).join('')}
        </div>
      </div>`;
    container.querySelector('#aiResult').innerHTML = html;
    container.querySelector('#aiResult').querySelectorAll('[data-ft="bird-open"]').forEach(el => {
      el.addEventListener('click', () => App.openBird(el.dataset.id));
    });
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { render };
})();
