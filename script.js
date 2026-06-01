/* ============================================================
   颐居 EverHome · interactions
============================================================ */
(function () {
  'use strict';

  /* ---------- Scroll progress + nav state ---------- */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('scrollProgress');
  function onScroll() {
    const st = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
    nav.classList.toggle('scrolled', st > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById('navBurger');
  burger?.addEventListener('click', () => nav.classList.toggle('open'));
  document.querySelectorAll('.nav-links a').forEach(a =>
    a.addEventListener('click', () => nav.classList.remove('open'))
  );

  /* ---------- Cursor glow ---------- */
  const glow = document.getElementById('cursorGlow');
  if (matchMedia('(pointer:fine)').matches) {
    let gx = 0, gy = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => { gx = e.clientX; gy = e.clientY; });
    (function loop() {
      cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
      glow.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
  } else { glow.style.display = 'none'; }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- Count up ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = +el.dataset.count;
      const dur = 1400; const t0 = performance.now();
      (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => cio.observe(c));

  /* ---------- Hero tilt ---------- */
  const tiltEl = document.querySelector('[data-tilt]');
  if (tiltEl && matchMedia('(pointer:fine)').matches) {
    const visual = tiltEl.closest('.hero-visual');
    visual.addEventListener('mousemove', e => {
      const r = visual.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tiltEl.style.transform = `rotateY(${px * 9}deg) rotateX(${-py * 9}deg) scale(1.02)`;
    });
    visual.addEventListener('mouseleave', () => { tiltEl.style.transform = ''; });
  }

  /* ---------- QR code (lightweight canvas renderer) ---------- */
  function drawQR(canvas, text) {
    // Deterministic pseudo-QR: stable pattern from text hash. Visual placeholder.
    const ctx = canvas.getContext('2d');
    const N = 25, size = canvas.width, cell = size / N;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#2b2520';
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
    const finder = (ox, oy) => {
      ctx.fillRect(ox * cell, oy * cell, cell * 7, cell * 7);
      ctx.clearRect((ox + 1) * cell, (oy + 1) * cell, cell * 5, cell * 5);
      ctx.fillRect((ox + 2) * cell, (oy + 2) * cell, cell * 3, cell * 3);
    };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const inFinder = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
      if (inFinder) continue;
      if (rnd() > 0.5) ctx.fillRect(x * cell, y * cell, cell, cell);
    }
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
  }
  const qr = document.getElementById('qrCanvas');
  if (qr) drawQR(qr, 'https://everhome.care/s/EH-2048-AU');

  /* ---------- Copy link ---------- */
  const copyBtn = document.getElementById('copyBtn');
  copyBtn?.addEventListener('click', () => {
    const inp = document.getElementById('shareLink');
    navigator.clipboard?.writeText(inp.value).catch(() => {});
    const old = copyBtn.textContent; copyBtn.textContent = '已复制 ✓';
    setTimeout(() => (copyBtn.textContent = old), 1600);
  });

  /* ---------- Share targets ---------- */
  const hints = {
    '家人': '家人可以查看全部进度，并参与每一处改造决策。',
    '承包商': '承包商获得施工清单、合规要点与采购方案，仅查看与施工相关的信息。',
    '社区': '社区工作者了解长者需求，协调补贴申请与上门服务。',
    '医护': '医护人员根据健康状况，对扶手高度、防滑等给出专业建议。'
  };
  const shareHint = document.getElementById('shareHint');
  document.querySelectorAll('.target').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.target').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      shareHint.textContent = hints[btn.dataset.target];
    });
  });

  /* ---------- Legal filter ---------- */
  // level: force=强制性 / rec=推荐性 / grant=补贴政策
  const LVL = { force: ['强制性', 'lvl-force'], rec: ['推荐性', 'lvl-rec'], grant: ['补贴政策', 'lvl-grant'] };
  const LAW = {
    uk: {
      label: '英国 (UK)', base: 88,
      bath: [
        { tag: 'Building Regs Part M', lvl: 'force', ok: false, h: '无障碍卫浴', p: '轮椅回转直径 ≥ 1500mm，并设置可承重抓杆（≥ 1.5kN）。', m: '当前不达标 · 须改造' },
        { tag: 'BS 8300-2', lvl: 'rec', ok: true, h: '防滑地面等级', p: '湿区地面防滑系数 R ≥ 11，符合无障碍设计指南。', m: '已满足' }
      ],
      stair: [
        { tag: 'Building Regs Part K', lvl: 'force', ok: false, h: '楼梯扶手与照明', p: '双侧连续扶手 900–1000mm，踏步前缘需对比色提示。', m: '须增设扶手' },
        { tag: 'Disabled Facilities Grant', lvl: 'grant', ok: true, h: 'DFG 改造补贴', p: '经评估可申请最高 £30,000 的住宅适配改造补贴。', m: '符合申请条件' }
      ],
      kitchen: [{ tag: 'Lifetime Homes', lvl: 'rec', ok: false, h: '可调节台面', p: '建议台面高度可调或预留坐姿操作空间。', m: '建议改造' }],
      door: [{ tag: 'Building Regs Part M', lvl: 'force', ok: false, h: '无障碍出入口', p: '净门宽 ≥ 775mm，门槛高差 ≤ 15mm。', m: '当前门槛偏高 · 须改造' }]
    },
    au: {
      label: '澳大利亚 (AU)', base: 91,
      bath: [
        { tag: 'AS 1428.1', lvl: 'force', ok: false, h: '无障碍卫生间', p: '设 L 型抓杆，淋浴区无门槛并设折叠座椅，回转空间 ≥ 1540mm。', m: '须改造' },
        { tag: 'Livable Housing AU', lvl: 'rec', ok: true, h: 'Silver 等级认证', p: '满足银级可居住住房中的卫浴可达性要求。', m: '已满足' }
      ],
      stair: [
        { tag: 'NCC / AS 1428.1', lvl: 'force', ok: false, h: '楼梯与坡道', p: '坡道坡度 ≤ 1:14，两侧连续扶手高 865–1000mm。', m: '须增设坡道' },
        { tag: 'Home Care Package', lvl: 'grant', ok: true, h: 'HCP 改造资助', p: 'Level 1–4 可覆盖部分适老化改造费用。', m: '符合申请条件' }
      ],
      kitchen: [{ tag: 'Livable Housing AU', lvl: 'rec', ok: true, h: '厨房可达性', p: '操作面前留有 1540mm 净空，满足轮椅通行。', m: '已满足' }],
      door: [{ tag: 'AS 1428.1', lvl: 'force', ok: false, h: '入口净宽', p: '主要通行门净宽 ≥ 850mm，门槛齐平。', m: '须改造' }]
    },
    cn: {
      label: '中国 (CN)', base: 84,
      bath: [
        { tag: 'GB 55019-2021', lvl: 'force', ok: false, h: '无障碍卫生间', p: '坐便器两侧设安全抓杆，地面防滑且无积水高差（强制性工程建设规范）。', m: '须改造' },
        { tag: 'GB/T 35153', lvl: 'rec', ok: true, h: '家用紧急呼叫', p: '卫生间内设置紧急呼叫按钮，符合居家适老推荐标准。', m: '已满足' }
      ],
      stair: [{ tag: 'GB 50763-2012', lvl: 'force', ok: false, h: '楼梯与台阶', p: '设双侧扶手，踏步防滑并有显著色差提示。', m: '须增设扶手' }],
      kitchen: [{ tag: '居家适老化改造标准', lvl: 'rec', ok: false, h: '厨房安全', p: '建议加装燃气泄漏报警与防干烧装置。', m: '建议改造' }],
      door: [{ tag: 'GB 55019-2021', lvl: 'force', ok: false, h: '出入口', p: '入户门净宽 ≥ 800mm，取消门槛或设缓坡（强制性）。', m: '须改造' }]
    }
  };

  // 强制性标准展示
  const STANDARDS = {
    uk: [
      { code: 'Approved Document M', name: 'Access to and use of buildings', items: ['无障碍入口与净门宽', '可达卫生间与抓杆', '门槛高差 ≤ 15mm'] },
      { code: 'Approved Document K', name: 'Protection from falling', items: ['楼梯坡度与踏步', '双侧连续扶手', '防跌落护栏高度'] },
      { code: 'BS 8300-2:2018', name: '建成环境无障碍设计', items: ['湿区防滑等级 R≥11', '照度与对比度', '回转空间 ≥1500mm'] }
    ],
    au: [
      { code: 'NCC 2022 Vol.2', name: 'National Construction Code', items: ['Livable Housing 银级强制纳入', '无障碍通行净宽', '入口无台阶'] },
      { code: 'AS 1428.1-2021', name: '建成环境通用无障碍设计', items: ['坡道 ≤1:14', '抓杆位置与承重', '回转空间 ≥1540mm'] },
      { code: 'AS 1428.2', name: '增强与额外无障碍要求', items: ['照明与标识', '操作高度 900–1100mm', '门把手形式'] }
    ],
    cn: [
      { code: 'GB 55019-2021', name: '建筑与市政工程无障碍通用规范', items: ['强制性工程建设规范，全文强制', '入户门净宽 ≥800mm', '无障碍卫生间抓杆'] },
      { code: 'GB 50763-2012', name: '无障碍设计规范', items: ['坡道坡度与扶手', '踏步防滑色差提示', '低位设施高度'] },
      { code: 'GB/T 51223-2017', name: '公共建筑标识系统', items: ['标识对比度与高度', '紧急疏散指引', '触觉/语音提示'] }
    ]
  };

  // 中国省份地图 (示意性格子地图) abbr,name,col,row,muni
  const CN_PROV = [
    ['黑', '黑龙江', 9, 1], ['吉', '吉林', 8, 2], ['辽', '辽宁', 7, 3],
    ['内蒙古', '内蒙古', 5, 2], ['新', '新疆', 1, 3], ['甘', '甘肃', 3, 4],
    ['宁', '宁夏', 4, 3], ['青', '青海', 2, 5], ['藏', '西藏', 1, 6],
    ['京', '北京', 6, 2, 1], ['津', '天津', 7, 2, 1], ['冀', '河北', 6, 3],
    ['晋', '山西', 5, 3], ['陕', '陕西', 4, 4], ['鲁', '山东', 7, 4],
    ['豫', '河南', 5, 4], ['川', '四川', 3, 5], ['渝', '重庆', 4, 5, 1],
    ['鄂', '湖北', 5, 5], ['皖', '安徽', 6, 5], ['苏', '江苏', 7, 5],
    ['沪', '上海', 8, 5, 1], ['浙', '浙江', 7, 6], ['赣', '江西', 6, 6],
    ['湘', '湖南', 5, 6], ['黔', '贵州', 4, 6], ['滇', '云南', 3, 6],
    ['桂', '广西', 4, 7], ['粤', '广东', 5, 7], ['闽', '福建', 6, 7],
    ['台', '台湾', 7, 7], ['琼', '海南', 5, 8], ['港', '香港', 6, 8, 1], ['澳', '澳门', 4, 8, 1]
  ];
  const PROV_POLICY = {
    '北京': { grant: '特殊困难老年人家庭适老化改造，市级补贴最高 ¥5000/户', law: '《北京市无障碍环境建设条例》' },
    '上海': { grant: '居家环境适老化改造项目，市/区两级补贴 ¥3000–10000', law: '《上海市无障碍环境建设条例》' },
    '广东': { grant: '困难老年人家庭适老化改造，纳入省民生实事', law: '《广东省养老服务条例》' },
    '浙江': { grant: '持证困难老人改造补助，按户施策', law: '《浙江省无障碍环境建设办法》' },
    '江苏': { grant: '适老化改造列入民生实事，分级补贴', law: '《江苏省养老服务条例》' },
    '四川': { grant: '特殊困难老年人家庭改造补贴', law: '《四川省〈无障碍环境建设法〉实施办法》' }
  };

  const analyzeBtn = document.getElementById('analyzeBtn');
  const results = document.getElementById('legalResults');
  const regionSel = document.getElementById('regionSel');
  const cnMapWrap = document.getElementById('cnMapWrap');
  const cnMap = document.getElementById('cnMap');
  const mapCurrent = document.getElementById('mapCurrent');
  const stdGrid = document.getElementById('stdGrid');
  let selectedProv = '';

  function renderStandards(region) {
    if (!stdGrid) return;
    stdGrid.innerHTML = (STANDARDS[region] || []).map(s => `
      <div class="std-card">
        <span class="std-force">强制执行</span>
        <div class="std-code">${s.code}</div>
        <div class="std-name">${s.name}</div>
        <ul>${s.items.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>`).join('');
  }
  renderStandards('uk');

  function buildMap() {
    cnMap.innerHTML = CN_PROV.map(([abbr, name, col, row, muni]) =>
      `<button class="prov ${muni ? 'muni' : ''}" data-name="${name}" style="grid-column:${col};grid-row:${row}">${abbr}</button>`
    ).join('');
    cnMap.querySelectorAll('.prov').forEach(p => p.addEventListener('click', () => {
      cnMap.querySelectorAll('.prov').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      selectedProv = p.dataset.name;
      mapCurrent.textContent = selectedProv;
      runAnalyze();
    }));
  }
  buildMap();

  regionSel?.addEventListener('change', () => {
    const r = regionSel.value;
    renderStandards(r);
    cnMapWrap.hidden = (r !== 'cn');
    if (r !== 'cn') { selectedProv = ''; }
  });

  function runAnalyze() {
    const region = regionSel.value;
    const age = document.getElementById('ageSel').value;
    const area = document.getElementById('areaSel').value;
    const data = LAW[region];
    let items = (data[area] || []).slice();
    let score = data.base - (age >= 80 ? 6 : age >= 70 ? 3 : 0);
    score = Math.max(60, Math.min(99, score));

    // China province local policy card
    if (region === 'cn' && selectedProv) {
      const pol = PROV_POLICY[selectedProv] || {
        grant: '依据《无障碍环境建设法》与各地民政适老化改造实施方案执行', law: '《' + selectedProv + '·无障碍环境建设规定》'
      };
      items.push({ tag: selectedProv + ' · 地方政策', lvl: 'grant', ok: true, h: pol.law, p: pol.grant + '。', m: '可结合本地政策申请补贴' });
    }

    analyzeBtn.querySelector('.btn-label').textContent = '分析中…';
    setTimeout(() => {
      analyzeBtn.querySelector('.btn-label').textContent = '生成合规分析';
      const locLabel = region === 'cn' && selectedProv ? selectedProv : data.label;
      results.innerHTML =
        `<div class="compliance-bar">
           <span class="cbar-num">${score}%</span>
           <div class="cbar-track"><div class="cbar-fill"></div></div>
           <span style="font-size:.85rem;color:var(--ink-soft)">${locLabel} · ${age}+ 岁 · 综合合规度</span>
         </div>
         <div class="law-grid">
           ${items.map((it, i) => {
             const lv = LVL[it.lvl] || LVL.rec;
             return `
             <div class="law-card ${it.ok ? 'ok' : ''}" style="animation-delay:${i * 0.08 + 0.1}s">
               <div class="law-head">
                 <span class="lvl ${lv[1]}">${lv[0]}</span>
                 <span class="law-tag">${it.tag}</span>
               </div>
               <h4>${it.h}</h4>
               <p>${it.p}</p>
               <div class="law-meta">${it.ok ? '✓ ' : '⚠ '}${it.m}</div>
             </div>`;
           }).join('')}
         </div>`;
      requestAnimationFrame(() => {
        const fill = results.querySelector('.cbar-fill');
        if (fill) fill.style.width = score + '%';
      });
    }, 500);
  }
  analyzeBtn?.addEventListener('click', runAnalyze);

  /* ---------- Card game ---------- */
  const DECK = [
    { suit: '🚿', scene: '卫浴 · 安全', title: '深夜起夜', body: '夜里去卫生间常常看不清、易滑倒。', need: '夜灯感应照明 + 防滑地面', ico: '💡', kw: ['起夜', '夜里', '晚上', '夜间', '半夜', '看不清'], img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=400&q=80' },
    { suit: '🧼', scene: '卫浴 · 洗浴', title: '站着洗澡很累', body: '长时间站立洗浴吃力，担心摔倒。', need: '淋浴折叠座椅 + L型抓杆', ico: '🪑', kw: ['洗澡', '淋浴', '沐浴', '站着', '卫生间', '浴室', '卫浴'], img: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?auto=format&fit=crop&w=400&q=80' },
    { suit: '🚪', scene: '通行 · 门槛', title: '过门槛绊脚', body: '房间之间的高差让助行器难以通过。', need: '取消门槛 / 设置缓坡', ico: '♿', kw: ['门槛', '绊', '高差', '轮椅', '助行器'], img: 'https://images.unsplash.com/photo-1558211583-d26f610c1eb1?auto=format&fit=crop&w=400&q=80' },
    { suit: '🪜', scene: '通行 · 楼梯', title: '上下楼吃力', body: '楼梯陡、没有可抓扶的地方，心里发慌。', need: '双侧连续扶手 + 防滑条', ico: '🤝', kw: ['楼梯', '上下楼', '上楼', '下楼', '扶手', '腿脚'], img: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=400&q=80' },
    { suit: '🍳', scene: '厨房 · 安全', title: '忘记关火', body: '做饭时偶尔忘记关燃气，家人很担心。', need: '燃气报警 + 自动断气', ico: '🔥', kw: ['关火', '燃气', '做饭', '厨房', '煤气', '烧'], img: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=400&q=80' },
    { suit: '💡', scene: '照明 · 视力', title: '走廊太暗', body: '夜间走廊昏暗，看不清脚下的路。', need: '人体感应 LED 照明', ico: '🌙', kw: ['走廊', '太暗', '昏暗', '照明', '灯', '视力', '看不清'], img: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80' },
    { suit: '🛏️', scene: '卧室 · 起身', title: '起床困难', body: '从低矮的床上起身很费力。', need: '床边扶手 + 适配床高', ico: '🛌', kw: ['起床', '床', '起身', '卧室'], img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80' },
    { suit: '📞', scene: '应急 · 呼叫', title: '摔倒没人知道', body: '独自在家若摔倒，无法及时求助。', need: '一键紧急呼叫装置', ico: '🆘', kw: ['摔倒', '跌倒', '呼叫', '求助', '独自', '一个人', '没人'], img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80' },
    { suit: '🪟', scene: '客厅 · 活动', title: '想多晒太阳', body: '希望白天有明亮、安全的活动空间。', need: '无障碍动线 + 充足采光', ico: '☀️', kw: ['晒太阳', '客厅', '采光', '阳光', '活动', '明亮'], img: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=400&q=80' },
    { suit: '🚶', scene: '出入 · 通行', title: '出门台阶高', body: '入户门口有几级台阶，进出不便。', need: '入口坡道 + 扶手', ico: '🛗', kw: ['出门', '台阶', '入户', '门口', '进出', '坡道'], img: 'https://images.unsplash.com/photo-1521783988139-89397d761dce?auto=format&fit=crop&w=400&q=80' }
  ];

  const deckEl = document.getElementById('deck');
  const summaryBox = document.getElementById('needsSummary');
  // shared selected needs: title -> deck card
  const selectedNeeds = new Map();

  function shuffle(arr) { return arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]); }
  function renderDeck() {
    const cards = shuffle(DECK).slice(0, 5);
    deckEl.innerHTML = cards.map((c, i) => {
      const on = selectedNeeds.has(c.title);
      return `
      <div class="gcard ${on ? 'picked' : ''}" data-title="${c.title}" style="transition-delay:${i * 0.04}s">
        <div class="gface gfront">
          <span class="gsuit">${c.suit}</span>
          <span class="gtitle">设计卡牌</span>
        </div>
        <div class="gface gback">
          <div class="gimg"><img src="${c.img}" alt="${c.title}" loading="lazy"/></div>
          <div class="gbody">
            <span class="gscene">${c.scene}</span>
            <h4>${c.title}</h4>
            <p>${c.body}</p>
            <label class="gpick"><input type="checkbox" ${on ? 'checked' : ''} data-title="${c.title}"/> 这是我的需求</label>
          </div>
        </div>
      </div>`;
    }).join('');
    bindCards();
  }
  function bindCards() {
    deckEl.querySelectorAll('.gcard').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.gpick')) return;
        card.classList.toggle('flipped');
      });
      const cb = card.querySelector('input');
      cb.addEventListener('change', () => {
        if (cb.checked) addNeed(cb.dataset.title); else removeNeed(cb.dataset.title);
      });
    });
  }

  function addNeed(title) {
    const c = DECK.find(d => d.title === title);
    if (!c) return;
    selectedNeeds.set(title, c);
    syncDeckState();
    renderSummary();
  }
  function removeNeed(title) {
    selectedNeeds.delete(title);
    syncDeckState();
    renderSummary();
  }
  function syncDeckState() {
    deckEl.querySelectorAll('.gcard').forEach(card => {
      const on = selectedNeeds.has(card.dataset.title);
      card.classList.toggle('picked', on);
      const cb = card.querySelector('input');
      if (cb) cb.checked = on;
    });
    // reflect on recommended list "added" badges
    document.querySelectorAll('.rec-item').forEach(r => {
      r.classList.toggle('added', selectedNeeds.has(r.dataset.title));
      const add = r.querySelector('.ri-add');
      if (add) add.textContent = selectedNeeds.has(r.dataset.title) ? '✓' : '+';
    });
    window.__ehRefreshProducts?.();
  }

  function renderSummary() {
    if (!selectedNeeds.size) {
      summaryBox.innerHTML = `<div class="summary-card"><p class="sum-empty">翻开卡牌勾选需求，或点击右下角 AI 助手推荐的卡牌，需求会汇总到这里 🙂</p></div>`;
      return;
    }
    const lis = [...selectedNeeds.values()].map(c => `
      <li>
        <span class="sum-ico">${c.ico}</span>
        <div><strong>${c.title}</strong><small>建议方案：${c.need}</small></div>
      </li>`).join('');
    summaryBox.innerHTML = `
      <div class="summary-card">
        <h3>长者改造需求总结</h3>
        <p class="sum-sub">基于 ${selectedNeeds.size} 张卡牌，自动生成的设计需求清单，可一键同步给设计师与承包商。</p>
        <ul class="sum-list">${lis}</ul>
      </div>`;
  }
  // expose for assistant module
  window.__ehAddNeed = (title) => { addNeed(title); };

  renderDeck();
  document.getElementById('shuffleBtn')?.addEventListener('click', () => { renderDeck(); });
  document.getElementById('summaryBtn')?.addEventListener('click', () => {
    renderSummary();
    summaryBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ============================================================
     PRODUCT RECOMMENDATIONS (适老产品)
  ============================================================ */
  const CAT_LABEL = { bath: '卫浴', move: '通行', kitchen: '厨房', light: '照明', bed: '卧室', sos: '应急' };
  const PRODUCTS = [
    { id: 'p1', cat: 'bath', emoji: '🪑', name: '适老折叠淋浴座椅', desc: '壁挂可折叠，铝合金防锈，承重 150kg，坐姿安全洗浴。', forCards: ['站着洗澡很累'], price: 299 },
    { id: 'p2', cat: 'bath', emoji: '🛁', name: '电动升降坐浴器', desc: '一键升降入浴，水温恒控，适合行动不便长者泡浴。', forCards: ['站着洗澡很累'], price: 2680 },
    { id: 'p3', cat: 'bath', emoji: '🤲', name: 'L 型安全抓杆', desc: '304 不锈钢，承重 ≥1.5kN，符合无障碍抓杆规范。', forCards: ['站着洗澡很累', '深夜起夜'], price: 159, hot: 1 },
    { id: 'p4', cat: 'bath', emoji: '🚽', name: '助起马桶增高架', desc: '加高 12cm 带扶手，减轻膝关节负担，免工具安装。', forCards: ['深夜起夜', '起床困难'], price: 229 },
    { id: 'p5', cat: 'bath', emoji: '🧴', name: '防滑地胶 / 防滑垫', desc: '湿区防滑系数 R11，吸盘底面，干湿两用。', forCards: ['深夜起夜'], price: 89 },
    { id: 'p6', cat: 'move', emoji: '🛣️', name: '门槛斜坡过渡垫', desc: '橡胶缓坡，消除门槛高差，轮椅 / 助行器顺畅通过。', forCards: ['过门槛绊脚'], price: 129, hot: 1 },
    { id: 'p7', cat: 'move', emoji: '🤝', name: '走廊楼梯连续扶手', desc: '木纹防滑握感，双侧连续安装，转角圆润防磕碰。', forCards: ['上下楼吃力', '过门槛绊脚'], price: 360 },
    { id: 'p8', cat: 'move', emoji: '🛗', name: '入户便携式坡道', desc: '铝合金折叠坡道，承重 270kg，适配台阶出入口。', forCards: ['出门台阶高'], price: 480 },
    { id: 'p9', cat: 'move', emoji: '🦯', name: '四脚助行器 / 助步车', desc: '可调高度带刹车与座椅，室内外通用，稳固防滑。', forCards: ['上下楼吃力', '出门台阶高'], price: 399 },
    { id: 'p10', cat: 'kitchen', emoji: '🔔', name: '燃气泄漏报警 + 自动切断', desc: '检测到泄漏自动关阀并报警，可联动子女手机。', forCards: ['忘记关火'], price: 268, hot: 1 },
    { id: 'p11', cat: 'kitchen', emoji: '🍳', name: '防干烧智能灶具', desc: '超时与高温自动熄火，离锅断气，做饭更安心。', forCards: ['忘记关火'], price: 1290 },
    { id: 'p12', cat: 'light', emoji: '💡', name: '人体感应 LED 灯带', desc: '夜间自动亮起，柔光不刺眼，照亮走廊与床边动线。', forCards: ['走廊太暗', '深夜起夜'], price: 99 },
    { id: 'p13', cat: 'light', emoji: '🌙', name: '起夜感应夜灯', desc: '插座式光感 + 人体感应，暖光过渡，避免眩光跌倒。', forCards: ['深夜起夜', '走廊太暗'], price: 49, hot: 1 },
    { id: 'p14', cat: 'bed', emoji: '🛏️', name: '床边起身扶手', desc: '插床式稳固扶手带收纳袋，助力起身翻身防坠床。', forCards: ['起床困难'], price: 189, hot: 1 },
    { id: 'p15', cat: 'bed', emoji: '🛌', name: '电动多功能护理床', desc: '背腿升降、护栏、移动滚轮，照护卧床长者更省力。', forCards: ['起床困难'], price: 3680 },
    { id: 'p16', cat: 'sos', emoji: '🆘', name: '一键紧急呼叫器', desc: '床头 / 卫浴防水按钮，一键呼叫家人或社区中心。', forCards: ['摔倒没人知道'], price: 199, hot: 1 },
    { id: 'p17', cat: 'sos', emoji: '⌚', name: '跌倒检测智能手环', desc: '自动识别跌倒并定位报警，心率监测，SOS 一键求助。', forCards: ['摔倒没人知道'], price: 459 },
    { id: 'p18', cat: 'bed', emoji: '🛋️', name: '适老高背扶手椅', desc: '高背护腰、加高坐面带扶手，起坐省力，靠窗晒太阳更舒适。', forCards: ['想多晒太阳', '起床困难'], price: 899 }
  ];

  const prodGrid = document.getElementById('prodGrid');
  const prodTabs = document.getElementById('prodTabs');
  const matchBtn = document.getElementById('matchNeeds');
  const planCountEl = document.getElementById('planCount');
  const planSet = new Set();
  let prodFilter = 'all';
  let matchMode = false;

  function renderProducts() {
    let list = PRODUCTS.filter(p => prodFilter === 'all' || p.cat === prodFilter);
    let note = '';
    if (matchMode) {
      const needTitles = new Set([...selectedNeeds.keys()]);
      const matched = list.filter(p => p.forCards.some(t => needTitles.has(t)));
      if (matched.length) {
        list = matched;
        note = `🎯 已根据你勾选的 ${needTitles.size} 项需求，匹配以下产品`;
      } else {
        // 默认推荐：没有勾选需求时，仍展示一批常用适老产品
        list = list.filter(p => p.hot);
        note = '还没有勾选需求，先为你推荐这些最常用的适老产品 👇';
      }
    }
    if (!list.length) {
      prodGrid.innerHTML = `<div class="prod-empty">该分类暂无产品。</div>`;
      return;
    }
    const noteHtml = note ? `<div class="prod-note">${note}</div>` : '';
    prodGrid.innerHTML = noteHtml + list.map((p, i) => `
      <article class="prod-card" style="animation-delay:${i * 0.04}s">
        <div class="prod-media cat-${p.cat}">
          <span class="prod-badge">${CAT_LABEL[p.cat]}</span>
          ${p.hot ? '<span class="prod-hot">★ 推荐</span>' : ''}
          <span class="prod-emoji">${p.emoji}</span>
        </div>
        <div class="prod-body">
          <h4>${p.name}</h4>
          <p>${p.desc}</p>
          <span class="prod-for">🃏 对应：${p.forCards.join(' / ')}</span>
          <div class="prod-foot">
            <span class="prod-price">¥${p.price}<small> 起</small></span>
            <button class="prod-add ${planSet.has(p.id) ? 'added' : ''}" data-id="${p.id}">${planSet.has(p.id) ? '✓ 已加入' : '加入方案'}</button>
          </div>
        </div>
      </article>`).join('');
  }
  function updatePlanCount() { planCountEl.textContent = '采购方案 ' + planSet.size + ' 件'; }

  prodTabs?.addEventListener('click', e => {
    const tab = e.target.closest('.ptab');
    if (!tab) return;
    prodTabs.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    prodFilter = tab.dataset.cat;
    renderProducts();
  });
  matchBtn?.addEventListener('click', () => {
    matchMode = !matchMode;
    matchBtn.classList.toggle('on', matchMode);
    matchBtn.textContent = matchMode ? '🎯 已按需求筛选' : '🎯 匹配我的需求';
    renderProducts();
  });
  prodGrid?.addEventListener('click', e => {
    const btn = e.target.closest('.prod-add');
    if (!btn) return;
    const id = btn.dataset.id;
    const p = PRODUCTS.find(x => x.id === id);
    if (planSet.has(id)) { planSet.delete(id); btn.classList.remove('added'); btn.textContent = '加入方案'; }
    else { planSet.add(id); btn.classList.add('added'); btn.textContent = '✓ 已加入'; toast('已加入采购方案：' + p.name); }
    updatePlanCount();
  });
  renderProducts();
  // expose so card/assistant selections can drive product matching
  window.__ehRefreshProducts = () => { if (matchMode) renderProducts(); };

  /* ============================================================
     AI ASSISTANT (豆包 / 火山方舟)
  ============================================================ */
  const DEFAULT_BASE = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
  const cardTitles = DECK.map(c => c.title).join(',');
  const SYSTEM_PROMPT =
    '你是「颐居 EverHome」的适老化改造助手。请用温暖、亲切、口语化的简体中文，与长者及其家人对话，' +
    '帮助他们梳理居家适老化改造的需求。回答要简短（2-4 句），有同理心，每次只追问一个最关键的信息，循序渐进地了解：' +
    '长者的称呼、年龄、所在地区（省/市）、居住情况（独居/与子女同住/有无护工）、行动能力（自理/拄拐/助行器/轮椅）、' +
    '健康关注（如高血压、视力、关节等）、最担心或最不方便的地方、以及改造的期望。不要长篇大论，不要使用 Markdown 标题。\n' +
    '在每次回复的最后，另起一行，输出一个用 <<<EH 和 >>> 包裹的 JSON（系统内部使用，不要在正文里解释或提及它）。' +
    '格式：<<<EH{"profile":{"name":"称呼或空","age":"年龄数字或空","region":"地区或空","living":"居住情况或空","mobility":"行动能力或空","health":"健康关注或空","concerns":["困扰简短词，可多个"],"expect":"改造期望或空"},"cards":["从这些卡牌名里选0-4个最相关的：' +
    cardTitles + '"]}>>>';

  const cfg = {
    key: localStorage.getItem('eh_key') || '',
    model: localStorage.getItem('eh_model') || '',
    base: localStorage.getItem('eh_base') || ''
  };

  const chatBody = document.getElementById('chatBody');
  const chatForm = document.getElementById('chatForm');
  const chatText = document.getElementById('chatText');
  const chatStatus = document.getElementById('chatStatus');
  const settingsToggle = document.getElementById('settingsToggle');
  const chatSettings = document.getElementById('chatSettings');
  const suggestBox = document.getElementById('chatSuggest');

  const apiKeyInp = document.getElementById('apiKey');
  const modelInp = document.getElementById('modelId');
  const baseInp = document.getElementById('apiBase');

  const profile = { name: '', age: '', region: '', living: '', mobility: '', health: '', concerns: [], expect: '' };
  let history = [{ role: 'system', content: SYSTEM_PROMPT }];

  function updateStatus() {
    if (cfg.key && cfg.model) {
      chatStatus.textContent = '已连接豆包 · ' + cfg.model;
      chatStatus.classList.add('live');
    } else {
      chatStatus.textContent = '演示模式 · 未连接豆包';
      chatStatus.classList.remove('live');
    }
  }
  apiKeyInp.value = cfg.key; modelInp.value = cfg.model; baseInp.value = cfg.base;
  updateStatus();

  // show / hide API key
  const toggleKey = document.getElementById('toggleKey');
  toggleKey?.addEventListener('click', () => {
    const show = apiKeyInp.type === 'password';
    apiKeyInp.type = show ? 'text' : 'password';
    toggleKey.textContent = show ? '🙈' : '👁️';
    toggleKey.classList.toggle('off', show);
  });

  settingsToggle?.addEventListener('click', () => {
    chatSettings.hidden = !chatSettings.hidden;
    if (!chatSettings.hidden) chatSettings.classList.remove('collapsed');
  });
  // collapse/expand via caret (倒三角)
  const csToggle = document.getElementById('csToggle');
  csToggle?.addEventListener('click', () => {
    const collapsed = chatSettings.classList.toggle('collapsed');
    csToggle.setAttribute('aria-expanded', String(!collapsed));
  });
  document.getElementById('saveKey')?.addEventListener('click', () => {
    cfg.key = apiKeyInp.value.trim();
    cfg.model = modelInp.value.trim();
    cfg.base = baseInp.value.trim();
    localStorage.setItem('eh_key', cfg.key);
    localStorage.setItem('eh_model', cfg.model);
    localStorage.setItem('eh_base', cfg.base);
    updateStatus();
    chatSettings.hidden = true;
    apiKeyInp.type = 'password';
    if (toggleKey) { toggleKey.textContent = '👁️'; toggleKey.classList.remove('off'); }
    toast(cfg.key && cfg.model ? '已连接豆包 API ✓ 密钥已隐藏' : '已保存（信息不完整，仍为演示模式）');
  });

  function addMsg(text, who) {
    const el = document.createElement('div');
    el.className = 'msg ' + who;
    el.textContent = text;
    chatBody.appendChild(el);
    chatBody.scrollTop = chatBody.scrollHeight;
    return el;
  }
  function typing() {
    const el = document.createElement('div');
    el.className = 'msg bot typing';
    el.innerHTML = '<i></i><i></i><i></i>';
    chatBody.appendChild(el);
    chatBody.scrollTop = chatBody.scrollHeight;
    return el;
  }

  // greeting
  addMsg('您好，我是颐居 AI 助手 😊 我可以陪您一起梳理长辈的居家改造需求。先告诉我，需要改造的是哪位长辈？大概多大年纪、住在哪里呢？', 'bot');

  /* ---- local extraction (used in demo & as fallback) ---- */
  function localExtract(text) {
    const ageM = text.match(/(\d{2,3})\s*岁/);
    if (ageM) profile.age = ageM[1];
    if (!profile.name) {
      const nm = text.match(/(奶奶|爷爷|外婆|外公|妈妈|母亲|爸爸|父亲|婆婆|公公|阿姨|老伴|长辈|老人家)/);
      if (nm) profile.name = nm[1];
    }
    const regions = [['英国', '英国 (UK)'], ['uk', '英国 (UK)'], ['伦敦', '英国 (UK)'],
      ['澳大利亚', '澳大利亚 (AU)'], ['澳洲', '澳大利亚 (AU)'], ['悉尼', '澳大利亚 (AU)'], ['墨尔本', '澳大利亚 (AU)'],
      ['北京', '北京'], ['上海', '上海'], ['广东', '广东'], ['广州', '广东'], ['深圳', '广东'],
      ['浙江', '浙江'], ['杭州', '浙江'], ['江苏', '江苏'], ['四川', '四川'], ['成都', '四川'],
      ['中国', '中国 (CN)'], ['国内', '中国 (CN)']];
    const low = text.toLowerCase();
    for (const [k, v] of regions) { if (low.includes(k.toLowerCase())) { profile.region = v; break; } }
    // 居住情况
    if (/独居|一个人住|独自住|自己住/.test(text)) profile.living = '独居';
    else if (/和子女|跟子女|与儿|与女|和孩子|跟孩子|同住/.test(text)) profile.living = '与子女同住';
    else if (/护工|保姆|照护/.test(text)) profile.living = '有护工照料';
    // 行动能力
    if (/轮椅/.test(text)) profile.mobility = '使用轮椅';
    else if (/助行器|助步/.test(text)) profile.mobility = '使用助行器';
    else if (/拐杖|拄拐|拐/.test(text)) profile.mobility = '拄拐行走';
    else if (/腿脚不便|行动不便|走不动|腿不好/.test(text)) profile.mobility = '行动不便';
    else if (/能自理|可以自己|身体硬朗|还硬朗/.test(text)) profile.mobility = '基本自理';
    // 健康关注
    const health = [];
    if (/高血压|血压/.test(text)) health.push('高血压');
    if (/视力|看不清|眼睛|白内障/.test(text)) health.push('视力下降');
    if (/关节|膝盖|风湿/.test(text)) health.push('关节问题');
    if (/糖尿|血糖/.test(text)) health.push('糖尿病');
    if (/心脏|心血管/.test(text)) health.push('心血管');
    if (/记忆|失智|阿尔茨海默|认知/.test(text)) health.push('认知退化');
    if (health.length) profile.health = [...new Set([...(profile.health ? profile.health.split('、') : []), ...health])].join('、');
  }
  function matchCards(text) {
    const low = text.toLowerCase();
    const hits = [];
    DECK.forEach(c => { if (c.kw.some(k => low.includes(k.toLowerCase()))) hits.push(c.title); });
    return hits;
  }

  function renderProfile() {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = val || '—';
      el.classList.toggle('filled', !!val);
    };
    set('pfName', profile.name);
    set('pfAge', profile.age ? profile.age + ' 岁' : '');
    set('pfRegion', profile.region);
    set('pfLiving', profile.living);
    set('pfMobility', profile.mobility);
    set('pfHealth', profile.health);
    set('pfConcern', profile.concerns.slice(0, 4).join('、'));
    set('pfExpect', profile.expect);
    // completeness progress
    const fields = [profile.name, profile.age, profile.region, profile.living, profile.mobility, profile.health, profile.concerns.length ? '1' : '', profile.expect];
    const done = fields.filter(Boolean).length;
    const fill = document.getElementById('pcProgressFill');
    if (fill) fill.style.width = Math.round(done / fields.length * 100) + '%';
    const btn = document.getElementById('createProfile');
    btn.disabled = !(profile.name || profile.age);
  }

  const recList = document.getElementById('recList');
  function renderRecs(titles) {
    const uniq = [...new Set(titles)].filter(Boolean);
    if (!uniq.length) return;
    recList.innerHTML = `<p class="rec-tip">点击卡牌即可加入上方「需求总结」 ↑</p>` + uniq.map(t => {
      const c = DECK.find(d => d.title === t);
      if (!c) return '';
      const added = selectedNeeds.has(t);
      return `<div class="rec-item ${added ? 'added' : ''}" data-title="${c.title}" role="button" tabindex="0">
        <span class="ri-suit">${c.suit}</span>
        <div><strong>${c.title}</strong><small>${c.need}</small></div>
        <span class="ri-add">${added ? '✓' : '+'}</span>
      </div>`;
    }).join('');
  }
  recList?.addEventListener('click', e => {
    const item = e.target.closest('.rec-item');
    if (!item) return;
    const title = item.dataset.title;
    window.__ehAddNeed?.(title);
    item.classList.add('added');
    const add = item.querySelector('.ri-add');
    if (add) add.textContent = '✓';
    toast('已加入需求总结：' + title);
    document.getElementById('needsSummary')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  function mergeProfile(p) {
    if (!p) return;
    if (p.name) profile.name = p.name;
    if (p.age) profile.age = String(p.age).replace(/[^0-9]/g, '') || profile.age;
    if (p.region) profile.region = p.region;
    if (p.living) profile.living = p.living;
    if (p.mobility) profile.mobility = p.mobility;
    if (p.health) profile.health = p.health;
    if (p.expect) profile.expect = p.expect;
    if (Array.isArray(p.concerns)) {
      p.concerns.forEach(c => { if (c && !profile.concerns.includes(c)) profile.concerns.push(c); });
    }
  }

  function parseMeta(raw) {
    const m = raw.match(/<<<EH([\s\S]*?)>>>/);
    let meta = null;
    let clean = raw;
    if (m) {
      clean = raw.replace(m[0], '').trim();
      try { meta = JSON.parse(m[1].trim()); } catch (e) { meta = null; }
    }
    return { clean, meta };
  }

  /* ---- Doubao API call ---- */
  async function callDoubao(messages) {
    const url = cfg.base || DEFAULT_BASE;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key },
      body: JSON.stringify({ model: cfg.model, messages: messages, temperature: 0.6 })
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error('API ' + res.status + ': ' + t.slice(0, 160));
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '（没有收到回复）';
  }

  /* ---- demo reply ---- */
  function demoReply(text, hits) {
    const parts = [];
    if (profile.name || profile.age) {
      parts.push(`好的，我先记下来${profile.name ? '：' + profile.name : ''}${profile.age ? '，' + profile.age + ' 岁' : ''}${profile.region ? '，住在' + profile.region : ''}。`);
    }
    if (hits.length) {
      const needs = hits.map(t => DECK.find(d => d.title === t)?.need).filter(Boolean);
      parts.push(`针对您提到的情况，我建议重点关注：${needs.slice(0, 3).join('；')}。右侧已经为您推荐了相关的设计卡牌。`);
      parts.push('还有其他不方便的地方吗？比如厨房、楼梯或者出门的台阶？');
    } else {
      parts.push('能再具体说说长辈在家里最不方便、最担心的地方吗？比如起夜、洗澡、上下楼、做饭，或者怕摔倒没人知道。');
    }
    return parts.join('\n\n');
  }

  /* ---- send flow ---- */
  let busy = false;
  async function send(text) {
    if (busy || !text.trim()) return;
    busy = true;
    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    localExtract(text);
    const demoHits = matchCards(text);
    if (demoHits.length) renderRecs([...recList.dataset.titles ? JSON.parse(recList.dataset.titles) : [], ...demoHits]);

    const tip = typing();

    let clean = '', meta = null;
    try {
      if (cfg.key && cfg.model) {
        const raw = await callDoubao(history);
        ({ clean, meta } = parseMeta(raw));
        history.push({ role: 'assistant', content: raw });
      } else {
        await new Promise(r => setTimeout(r, 650));
        clean = demoReply(text, demoHits);
        meta = { profile: {}, cards: demoHits };
      }
      tip.remove();
      addMsg(clean, 'bot');

      if (meta) {
        mergeProfile(meta.profile);
        const recTitles = (meta.cards && meta.cards.length ? meta.cards : demoHits);
        const prev = recList.dataset.titles ? JSON.parse(recList.dataset.titles) : [];
        const all = [...new Set([...prev, ...recTitles])];
        recList.dataset.titles = JSON.stringify(all);
        renderRecs(all);
      }
      renderProfile();
    } catch (err) {
      tip.remove();
      addMsg('连接豆包失败：' + err.message + '\n\n（已切换演示模式继续）请检查 API Key、模型 ID 是否正确，或浏览器是否被 CORS 拦截。', 'bot');
      clean = demoReply(text, demoHits);
      addMsg(clean, 'bot');
      renderRecs([...(recList.dataset.titles ? JSON.parse(recList.dataset.titles) : []), ...demoHits]);
      renderProfile();
    } finally {
      busy = false;
    }
  }

  chatForm?.addEventListener('submit', e => {
    e.preventDefault();
    const v = chatText.value;
    chatText.value = '';
    send(v);
  });
  suggestBox?.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (chip) send(chip.textContent);
  });
  document.getElementById('clearChat')?.addEventListener('click', () => {
    chatBody.innerHTML = '';
    history = [{ role: 'system', content: SYSTEM_PROMPT }];
    profile.name = profile.age = profile.region = profile.living = profile.mobility = profile.health = profile.expect = '';
    profile.concerns = [];
    recList.dataset.titles = '';
    recList.innerHTML = '<p class="rec-empty">和助手聊聊，这里会出现为你推荐的卡牌。</p>';
    renderProfile();
    addMsg('好的，我们重新开始 😊 需要改造的是哪位长辈，大概多大年纪、住在哪里呢？', 'bot');
  });

  document.getElementById('createProfile')?.addEventListener('click', () => {
    const id = 'EH-' + Math.floor(1000 + Math.random() * 9000) + '-' +
      (profile.region.includes('UK') ? 'UK' : profile.region.includes('AU') ? 'AU' : 'CN');
    toast('已为「' + (profile.name || '长者') + '」创建专属档案 · ' + id);
  });

  /* ---- toast ---- */
  let toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

})();
