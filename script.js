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
  if (qr) drawQR(qr, 'https://everhome.care/s/EH-DC67-BJ');

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
    '本人': '本人可以确认真实生活习惯、隐私授权与每一项改造是否愿意接受。',
    '家人': '家人可以查看全部进度，并参与每一处改造决策。',
    '承包商': '承包商获得施工清单、合规要点与采购方案，仅查看与施工相关的信息。',
    '社区': '社区工作者了解长者需求，协调补贴申请与上门服务。',
    '医护': '医护人员根据健康状况，对扶手高度、防滑等给出专业建议。'
  };
  const stakeholderGuides = {
    '本人': {
      icon: '👵',
      title: '本人视角：确认真实需求与授权边界',
      role: '陈秀英奶奶 · 67 岁 · 北京东城区',
      summary: '本人是改造决策的核心。需要优先确认夜间起夜、卫生间防滑、紧急呼叫这些需求是否真实影响日常生活，以及哪些改造可以接受、哪些会造成不适。',
      visual: {
        type: 'consent',
        title: '本人决策面板',
        metrics: [
          { icon: '🛁', label: '优先改造', value: '卫浴间', note: '防滑 + 夜灯' },
          { icon: '🔐', label: '隐私授权', value: '本人确认', note: '照片与健康信息分开授权' },
          { icon: '🌙', label: '高风险时段', value: '夜间', note: '起夜路线最需保护' }
        ],
        bars: [
          { label: '愿意接受：感应夜灯', value: 92 },
          { label: '需要商量：扶手位置', value: 68 },
          { label: '谨慎处理：生活物品移动', value: 42 }
        ]
      },
      access: ['查看自己的改造档案、需求卡牌和每项改造的原因', '查看施工前后对比、进度节点和家人留言', '查看哪些人获得了访问权限以及他们能看到什么'],
      provide: ['每天最容易摔倒、看不清或需要扶手的位置', '洗澡、如厕、起床、做饭等动作中最吃力的环节', '不希望被改动的家具、物品、生活动线和隐私区域', '可接受的施工时间、噪音程度和临时生活安排'],
      cautions: ['不能只由家人替本人决定，关键改造需要本人确认', '不要一次性改变过多生活习惯，避免长者不适应', '涉及健康、隐私、钥匙、摄像头等内容必须单独授权'],
      actions: ['确认本轮优先级：卫浴防滑、感应夜灯、紧急呼叫', '标记不方便拍照或不希望共享的位置', '在施工前确认样式、高度、颜色和安装位置']
    },
    '家人': {
      icon: '👪',
      title: '家人视角：补充照护信息与共同决策',
      role: '女儿 / 子女 / 主要照护者',
      summary: '家人负责补充日常观察、预算、紧急联系人和陪同安排，但应以本人意愿为前提，避免把“方便照护”凌驾于长者自主生活之上。',
      visual: {
        type: 'budget',
        title: '家庭协作看板',
        metrics: [
          { icon: '💰', label: '预算预留', value: '¥5,000+', note: '先覆盖必须项' },
          { icon: '📷', label: '待补材料', value: '6 类', note: '照片 / 尺寸 / 票据' },
          { icon: '📞', label: '紧急联系人', value: '2 人', note: '子女 + 社区' }
        ],
        bars: [
          { label: '必须项：防滑与夜灯', value: 86 },
          { label: '推荐项：扶手与坐浴椅', value: 72 },
          { label: '可选项：智能设备', value: 48 }
        ]
      },
      access: ['查看全部改造进度、需求总结、设计卡牌和采购建议', '查看预算估算、施工节点、待确认事项和风险提醒', '查看本人授权范围内的健康关注和行动能力信息'],
      provide: ['近期跌倒、滑倒、忘关火、夜间求助等真实事件', '家中平面图、卫浴照片、入户门槛和走廊照片', '预算范围、可接受施工周期、陪同到场时间', '紧急联系人、常用医院、物业或社区联系人'],
      cautions: ['不要在本人未确认时直接替换常用家具和收纳位置', '不要把医疗细节过度共享给承包商', '施工期间要安排临时洗浴、如厕和夜间照明方案'],
      actions: ['和本人一起确认前三项最急需求', '准备现场照片和尺寸，交给承包商复核', '把补贴申请材料交给社区窗口预审']
    },
    '承包商': {
      icon: '👷',
      title: '承包商视角：把需求转为可施工清单',
      role: '施工方 / 设计施工一体化团队',
      summary: '承包商只需要看到与施工直接相关的信息：位置、尺寸、材料、安装高度、施工限制和验收标准。健康与家庭隐私信息应最小化披露。',
      visual: {
        type: 'construction',
        title: '施工拆解清单',
        steps: [
          { icon: '📏', label: '现场复尺', value: '门槛 / 墙体 / 湿区坡度' },
          { icon: '🧱', label: '承重确认', value: '扶手和坐浴椅固定点' },
          { icon: '🔌', label: '点位预留', value: '夜灯 / 紧急呼叫 / 防水电源' },
          { icon: '✅', label: '验收交付', value: '无锐角、无绊点、可清洁' }
        ],
        risks: [
          { label: '湿区防滑', value: 88 },
          { label: '墙体承重', value: 76 },
          { label: '临时通行', value: 58 }
        ]
      },
      access: ['查看卫浴、走廊、入户等施工部位的需求卡牌', '查看现场照片、尺寸、材料偏好和施工优先级', '查看合规提示、验收要点和采购清单'],
      provide: ['扶手、坐浴椅、夜灯、紧急按钮的建议安装点位', '门槛处理、防滑地面、墙体承重和水电改造可行性', '报价明细、材料型号、施工周期、质保范围', '施工期间的防尘、防滑、临时通行和噪音控制方案'],
      cautions: ['不得要求长者提供与施工无关的健康隐私', '扶手、座椅、报警器安装前必须现场复尺并确认承重', '施工后要保留通道安全，不能产生新的绊倒点或锐角'],
      actions: ['完成一次上门踏勘并输出点位图', '将施工清单拆成必须项、推荐项、可选项', '施工前与本人/家人逐项确认高度、位置、颜色和工期']
    },
    '社区': {
      icon: '🏘️',
      title: '社区视角：衔接评估、补贴与上门服务',
      role: '社区工作者 / 街道窗口 / 居家养老服务站',
      summary: '社区主要负责确认政策适配、补贴资格、服务资源和上门评估安排，帮助长者把“想改”转化为可申请、可落地的流程。',
      visual: {
        type: 'subsidy',
        title: '补贴办理流程',
        steps: [
          { icon: '🪪', label: '身份核验', value: '户籍 / 年龄 / 居住地' },
          { icon: '📝', label: '需求评估', value: '上门确认风险点' },
          { icon: '🏷️', label: '补贴匹配', value: '60-79 周岁产品补贴' },
          { icon: '📦', label: '改造回访', value: '验收与服务闭环' }
        ],
        stats: [
          { label: '年龄段', value: '67 岁' },
          { label: '地区', value: '东城区' },
          { label: '补贴上限', value: '¥5,000' }
        ]
      },
      access: ['查看长者所在地区、年龄段、居住情况和主要改造诉求', '查看本人授权后的补贴申请所需材料清单', '查看施工进度和需要社区协调的节点'],
      provide: ['东城区及北京市当前适老化改造补贴办理路径', '申请对象、材料、窗口、时限和可咨询电话', '可转介的评估人员、养老服务驿站或上门服务资源', '经济困难、失能、高龄等补贴津贴的初步匹配建议'],
      cautions: ['政策资格不能仅凭页面判断，需要以窗口审核为准', '不得公开长者住址、健康状况、家庭经济情况等敏感信息', '上门评估需提前预约，并确认本人或家属在场'],
      actions: ['协助核对户籍、年龄、居住地和申请材料', '安排上门评估或推荐就近养老服务驿站', '跟进补贴申请、施工验收和后续回访']
    },
    '医护': {
      icon: '🩺',
      title: '医护视角：给出功能与安全建议',
      role: '家庭医生 / 康复师 / 护理人员',
      summary: '医护人员不负责施工决策，但可以基于长者行动能力、视力、慢病和跌倒风险，给出扶手高度、防滑、夜间照明、紧急呼叫等专业建议。',
      visual: {
        type: 'care',
        title: '健康风险评估',
        score: 74,
        metrics: [
          { icon: '👁️', label: '视力下降', value: '中高', note: '夜间路线需增强照明' },
          { icon: '🩸', label: '高血压', value: '需关注', note: '避免施工期情绪和噪音刺激' },
          { icon: '🚶', label: '行动能力', value: '基本自理', note: '重点防滑，不替代自主行动' }
        ],
        bars: [
          { label: '跌倒风险', value: 74 },
          { label: '夜间可视性', value: 38 },
          { label: '求助可达性', value: 46 }
        ]
      },
      access: ['查看本人授权后的健康关注、行动能力和主要风险场景', '查看卫浴、卧室、走廊等与跌倒风险相关的设计卡牌', '查看待确认的辅具和安全设备清单'],
      provide: ['高血压、视力下降、关节疼痛、跌倒史等风险提示', '扶手高度、坐浴椅、床边扶手、夜灯位置的建议', '紧急呼叫器佩戴/安装方式和响应流程建议', '是否需要助行器、康复训练或进一步评估的建议'],
      cautions: ['只共享本人授权的健康信息，避免把病历完整暴露给施工方', '医护建议不能替代现场结构复核和施工验收', '对认知、用药、眩晕等高风险情况要提示家属进一步就医确认'],
      actions: ['完成一次跌倒风险和日常动作评估', '标注卫生间、床边、走廊的重点风险点', '把医护建议转写成承包商可理解的安装要求']
    }
  };
  const shareHint = document.getElementById('shareHint');
  document.querySelectorAll('.target').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.target').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      shareHint.textContent = hints[btn.dataset.target];
      openStakeholderModal(btn.dataset.target);
    });
  });

  function ensureStakeholderModal() {
    let modal = document.getElementById('stakeholderModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'stakeholderModal';
    modal.className = 'stake-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="stake-backdrop" data-stake-close></div>
      <section class="stake-dialog" role="dialog" aria-modal="true" aria-labelledby="stakeTitle">
        <button class="doc-close" type="button" data-stake-close aria-label="关闭">×</button>
        <div class="stake-head">
          <span class="stake-icon" id="stakeIcon"></span>
          <div>
            <span class="stake-kicker" id="stakeRole"></span>
            <h3 id="stakeTitle"></h3>
            <p id="stakeSummary"></p>
          </div>
        </div>
        <div class="stake-body" id="stakeBody"></div>
      </section>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target.closest('[data-stake-close]')) closeStakeholderModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.hidden) closeStakeholderModal();
    });
    return modal;
  }
  function openStakeholderModal(target) {
    const data = stakeholderGuides[target];
    if (!data) return;
    const modal = ensureStakeholderModal();
    modal.querySelector('#stakeIcon').textContent = data.icon;
    modal.querySelector('#stakeRole').textContent = data.role;
    modal.querySelector('#stakeTitle').textContent = data.title;
    modal.querySelector('#stakeSummary').textContent = data.summary;
    modal.querySelector('#stakeBody').innerHTML = renderStakeholderPanel(target, data);
    modal.hidden = false;
    document.body.classList.add('modal-open');
  }
  function renderStakeholderPanel(target, data) {
    const list = items => `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    const chips = ['夜间起夜', '卫生间防滑', '紧急呼叫', '北京东城区'].map(x => `<b>${x}</b>`).join('');
    const detailRail = (title, icon, items) => `
      <aside class="role-rail">
        <h4><span>${icon}</span>${escapeHtml(title)}</h4>
        ${list(items)}
      </aside>`;

    if (target === '本人') {
      return `
        <div class="role-panel self-panel">
          <div class="role-tags"><span>当前基准需求</span>${chips}</div>
          <div class="self-route">
            <div class="route-node safe"><span>🛏️</span><strong>床边</strong><small>起身先照明</small></div>
            <i></i>
            <div class="route-node warn"><span>🌙</span><strong>走廊</strong><small>夜间看清脚下</small></div>
            <i></i>
            <div class="route-node danger"><span>🚿</span><strong>卫浴</strong><small>防滑与抓扶</small></div>
            <i></i>
            <div class="route-node call"><span>📞</span><strong>呼叫</strong><small>一键求助</small></div>
          </div>
          <div class="self-layout">
            <div class="consent-board">
              <h4>本人授权与舒适度</h4>
              <div class="consent-row"><span>照片共享</span><b>仅家人 / 施工必要区域</b><i class="ok">已确认</i></div>
              <div class="consent-row"><span>健康信息</span><b>只给医护与家人</b><i>需本人确认</i></div>
              <div class="consent-row"><span>物品移动</span><b>先拍照留原位</b><i class="warn">谨慎</i></div>
              <div class="comfort-meter"><span>接受度</span><strong>82%</strong><u><em style="width:82%"></em></u></div>
            </div>
            ${detailRail('本人需要给到的信息', '✍️', data.provide)}
          </div>
          <div class="self-preference">
            <div class="pref-card">
              <span>不改变</span>
              <strong>床头柜位置</strong>
              <small>夜间摸索路径已形成习惯</small>
            </div>
            <div class="pref-card">
              <span>可接受</span>
              <strong>低位感应灯</strong>
              <small>不刺眼，自动亮灭</small>
            </div>
            <div class="pref-card">
              <span>需试用</span>
              <strong>坐浴椅高度</strong>
              <small>先现场坐姿确认</small>
            </div>
            <div class="privacy-grid">
              <h4>隐私边界</h4>
              <p><b>公开给家人：</b>改造进度、预算、施工提醒</p>
              <p><b>仅本人确认：</b>卧室照片、健康信息、摄像/感应设备</p>
              <p><b>不给施工方：</b>慢病详情、家庭经济、非施工区域照片</p>
            </div>
          </div>
        </div>`;
    }

    if (target === '家人') {
      return `
        <div class="role-panel family-panel">
          <div class="family-command">
            <div class="family-budget">
              <span>预算优先级</span>
              <strong>先保安全</strong>
              <div class="budget-stack"><i style="height:42%"></i><i style="height:32%"></i><i style="height:18%"></i></div>
              <small>防滑夜灯 / 扶手坐浴 / 智能设备</small>
            </div>
            <div class="family-matrix">
              <h4>家庭协作分工</h4>
              <div><span>本人</span><b>确认习惯与边界</b></div>
              <div><span>子女</span><b>照片、预算、陪同</b></div>
              <div><span>社区</span><b>补贴材料预审</b></div>
              <div><span>承包商</span><b>复尺报价与施工</b></div>
            </div>
            <div class="family-alerts">
              <h4>家人重点盯防</h4>
              <p>夜间起夜、洗浴站立、独自在家求助失败。</p>
              <b>本周动作：补齐现场照片 + 约一次上门踏勘</b>
            </div>
          </div>
          <div class="family-ops">
            <div class="family-timeline">
              <h4>7 天协作节奏</h4>
              <div><span>Day 1</span><b>和本人确认优先级</b></div>
              <div><span>Day 2</span><b>补拍卫浴、走廊、入户照片</b></div>
              <div><span>Day 3</span><b>社区预审补贴材料</b></div>
              <div><span>Day 4-5</span><b>承包商上门复尺报价</b></div>
              <div><span>Day 6-7</span><b>本人确认施工方案</b></div>
            </div>
            <div class="family-contact-map">
              <h4>紧急协作链</h4>
              <div><span>本人</span><i></i><b>女儿</b><i></i><em>社区</em></div>
              <p>紧急呼叫设备必须绑定至少 2 个联系人，并约定无人接听时由社区或物业协助上门。</p>
            </div>
          </div>
          <div class="family-bottom">
            ${detailRail('家人应补充', '📎', data.provide)}
            ${detailRail('不要忽略', '⚠️', data.cautions)}
          </div>
        </div>`;
    }

    if (target === '承包商') {
      return `
        <div class="role-panel contractor-panel">
          <div class="blueprint-board">
            <div class="blueprint">
              <span class="bp-room bath">卫浴</span>
              <span class="bp-room hall">走廊</span>
              <span class="bp-room entry">入户</span>
              <i class="pin p1">扶手</i><i class="pin p2">夜灯</i><i class="pin p3">呼叫</i>
            </div>
            <div class="spec-table">
              <h4>施工点位与验收口径</h4>
              <div><span>L 型扶手</span><b>现场复尺承重</b><em>必须项</em></div>
              <div><span>湿区防滑</span><b>排水坡度 + 防滑材料</b><em>必须项</em></div>
              <div><span>紧急按钮</span><b>坐便 / 淋浴可触达</b><em>推荐项</em></div>
              <div><span>临时通行</span><b>施工期间无绊点</b><em>验收项</em></div>
            </div>
          </div>
          <div class="site-risks">
            <h4>施工风险条</h4>
            <div><span>湿区防滑</span><i><u style="width:88%"></u></i><b>高</b></div>
            <div><span>墙体承重</span><i><u style="width:76%"></u></i><b>中高</b></div>
            <div><span>临时通行</span><i><u style="width:58%"></u></i><b>中</b></div>
          </div>
          <div class="build-plan">
            <div class="gantt-card">
              <h4>3 日微施工排期</h4>
              <div><span>Day 1</span><i><u style="width:32%"></u></i><b>拆改 / 复尺</b></div>
              <div><span>Day 2</span><i><u style="width:68%"></u></i><b>扶手 / 防滑</b></div>
              <div><span>Day 3</span><i><u style="width:100%"></u></i><b>夜灯 / 呼叫 / 验收</b></div>
            </div>
            <div class="material-board">
              <h4>材料与辅具看板</h4>
              <div><span>防滑地材</span><b>湿区优先</b><em>耐清洁</em></div>
              <div><span>L 型扶手</span><b>承重复核</b><em>防锈</em></div>
              <div><span>低位夜灯</span><b>感应延迟</b><em>不眩光</em></div>
            </div>
          </div>
          <div class="contractor-bottom">
            ${detailRail('施工方需要给到', '🧰', data.provide)}
            ${detailRail('施工边界', '🔒', data.cautions)}
          </div>
        </div>`;
    }

    if (target === '社区') {
      return `
        <div class="role-panel community-panel">
          <div class="eligibility-card">
            <span>初步匹配</span>
            <strong>北京市东城区 · 67 岁</strong>
            <p>适合进入 60-79 周岁居家适老化改造产品补贴咨询流程；最终以窗口审核为准。</p>
          </div>
          <div class="service-flow">
            <div><span>1</span><strong>身份核验</strong><small>户籍 / 年龄 / 居住地</small></div>
            <div><span>2</span><strong>上门评估</strong><small>确认卫浴与夜间风险</small></div>
            <div><span>3</span><strong>补贴匹配</strong><small>产品清单与材料预审</small></div>
            <div><span>4</span><strong>验收回访</strong><small>服务闭环与后续照护</small></div>
          </div>
          <div class="subsidy-dashboard">
            <div class="subsidy-meter">
              <span>产品补贴测算</span>
              <strong>60%</strong>
              <small>60-79 周岁产品补贴比例，单户上限以政策审核为准</small>
            </div>
            <div class="resource-map">
              <h4>社区资源转介</h4>
              <div><span>养老服务驿站</span><b>上门评估 / 服务转介</b></div>
              <div><span>街道窗口</span><b>材料预审 / 申请咨询</b></div>
              <div><span>家庭医生</span><b>跌倒风险建议</b></div>
            </div>
          </div>
          <div class="community-grid">
            <div class="doc-check">
              <h4>材料清单</h4>
              <label><input type="checkbox" checked disabled> 身份与户籍信息</label>
              <label><input type="checkbox" checked disabled> 长者改造需求</label>
              <label><input type="checkbox" disabled> 现场照片与报价</label>
              <label><input type="checkbox" disabled> 补贴申请表</label>
            </div>
            ${detailRail('社区需要给到', '🏷️', data.provide)}
          </div>
        </div>`;
    }

    return `
      <div class="role-panel medical-panel">
        <div class="medical-top">
          <div class="clinical-score" style="--score:74">
            <strong>74</strong><span>跌倒风险</span>
          </div>
          <div class="body-map">
            <span class="m-eye">视力</span><span class="m-hand">抓扶</span><span class="m-knee">膝部</span><span class="m-call">呼叫</span>
          </div>
          <div class="care-orders">
            <h4>医护建议转译</h4>
            <p><b>照明：</b>床边到卫生间连续低位夜灯。</p>
            <p><b>抓扶：</b>坐便与淋浴区均需可触达扶手。</p>
            <p><b>呼叫：</b>坐姿和跌倒后仍能触达。</p>
          </div>
        </div>
          <div class="clinical-bars">
            <div><span>夜间可视性</span><i><u style="width:38%"></u></i><b>偏低</b></div>
            <div><span>求助可达性</span><i><u style="width:46%"></u></i><b>需加强</b></div>
            <div><span>自主行动</span><i><u style="width:72%"></u></i><b>保留</b></div>
          </div>
        <div class="care-prescription">
          <div class="assistive-table">
            <h4>辅具处方矩阵</h4>
            <div><span>坐浴椅</span><b>降低站立洗浴负荷</b><em>优先</em></div>
            <div><span>床边扶手</span><b>减少夜间起身失衡</b><em>推荐</em></div>
            <div><span>呼叫器</span><b>跌倒后仍可触达</b><em>优先</em></div>
          </div>
          <div class="care-routine">
            <h4>日常观察重点</h4>
            <p>记录一周内夜间起床次数、是否头晕、是否摸黑行走、是否忘记携带呼叫器。</p>
            <b>若出现反复眩晕或近期跌倒，应先做医疗评估再施工。</b>
          </div>
        </div>
        <div class="medical-bottom">
          ${detailRail('医护应补充', '🩺', data.provide)}
          ${detailRail('医护注意', '⚠️', data.cautions)}
        </div>
      </div>`;
  }
  function closeStakeholderModal() {
    const modal = document.getElementById('stakeholderModal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  /* ---------- Legal filter ---------- */
  // level: force=强制性 / rec=推荐性 / grant=补贴政策
  const LVL = { force: ['强制性', 'lvl-force'], rec: ['推荐性', 'lvl-rec'], grant: ['补贴政策', 'lvl-grant'] };
  const DOCS = {
    cnLaw: {
      title: '中华人民共和国无障碍环境建设法',
      org: '中国政府网 / 新华社',
      type: '官方原文',
      url: 'https://www.gov.cn/yaowen/liebiao/202306/content_6888910.htm',
      summary: '自 2023 年 9 月 1 日施行，明确保障残疾人、老年人平等、充分、便捷参与社会生活。'
    },
    bjBarrier: {
      title: '北京市无障碍环境建设条例',
      org: '北京市人民政府门户网站',
      type: 'PDF',
      url: 'https://www.beijing.gov.cn/zhengce/dfxfg/202110/W020230904572688598051.pdf',
      summary: '规定本市无障碍设施建设、维护管理、社会服务及家庭生活设施无障碍改造支持。'
    },
    bjRetrofit2023: {
      title: '关于进一步推进老年人居家适老化改造工程的实施意见',
      org: '北京市民政局 / 北京市财政局 / 北京市残联',
      type: '官方原文',
      url: 'https://www.beijing.gov.cn/zhengce/zhengcefagui/202401/t20240112_3534326.html',
      summary: '建立北京市居家适老化改造推荐清单、服务平台、经济困难老年人补贴等工作机制。'
    },
    bjRetrofit2024: {
      title: '北京市促进居家适老化改造产品消费工作方案',
      org: '北京市民政局等部门',
      type: 'PDF',
      url: 'https://www.beijing.gov.cn/zhengce/zhengcefagui/202410/W020241205591300285104.pdf',
      summary: '面向全市 60 周岁及以上户籍老年人家庭，60-79 周岁补贴 60%，每户上限 5000 元。'
    },
    bjDesign2024: {
      title: '加强设计服务推动居家适老化改造和产业发展实施方案（试行）',
      org: '北京市发展和改革委员会',
      type: 'PDF',
      url: 'https://www.beijing.gov.cn/zhengce/zhengcefagui/202404/W020240704557722438038.pdf',
      summary: '提出两年内建设高质量适老化改造公共样板间，推动“百街万户”实践。'
    },
    guide2023: {
      title: '城市居家适老化改造指导手册',
      org: '住房和城乡建设部城市建设司 / 中国政府网',
      type: 'PDF',
      url: 'https://www.gov.cn/lianbo/bumen/202305/P020230531277245356328.pdf',
      summary: '围绕通用性改造、入户、起居、卧室、卫生间、厨房、阳台形成 47 项改造要点。'
    },
    dcAllowance: {
      title: '东城区老年人养老服务补贴津贴',
      org: '北京市东城区人民政府',
      type: '官方原文',
      url: 'https://www.bjdch.gov.cn/zwgk/zdlygk/mzbzxxgk/202207/t20220701_3052916.html',
      summary: '说明困难老年人服务补贴、失能老年人护理补贴、高龄津贴的对象、标准和办理渠道。'
    }
  };
  function docByKey(key) { return DOCS[key]; }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
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
        { tag: '北京市 · 无障碍条例', lvl: 'force', ok: false, h: '卫生间无障碍与防滑', p: '坐便器两侧设置安全抓杆，湿区地面防滑、排水顺畅，夜间动线减少高差。', m: '东城 67 岁 demo · 卫浴需优先改造', docs: ['bjBarrier', 'cnLaw'] },
        { tag: '住建部指导手册', lvl: 'rec', ok: true, h: '夜间如厕与紧急呼叫', p: '卫生间宜设置感应夜灯、紧急呼叫按钮和坐式淋浴辅助设施。', m: '建议纳入基础型改造', docs: ['guide2023'] }
      ],
      stair: [{ tag: '北京市 · 居家改造', lvl: 'force', ok: false, h: '楼梯 / 走廊连续扶手', p: '走廊与楼梯应重点处理扶手连续性、踏步防滑、照度和色差提示。', m: '须结合现场踏勘', docs: ['bjRetrofit2023', 'guide2023'] }],
      kitchen: [{ tag: '居家适老化改造', lvl: 'rec', ok: false, h: '厨房燃气与操作安全', p: '建议加装燃气泄漏报警、防干烧装置，并优化台面照明和取物高度。', m: '建议改造', docs: ['guide2023', 'bjDesign2024'] }],
      door: [{ tag: '北京市 · 无障碍条例', lvl: 'force', ok: false, h: '入户出入口与门槛', p: '入户与室内门槛宜改为缓坡或齐平过渡，保障长者自主安全通行。', m: '须改造', docs: ['bjBarrier', 'guide2023'] }]
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
      { code: '《无障碍环境建设法》', name: '全国性法律依据', items: ['保障老年人自主安全通行', '鼓励家庭与居住区无障碍改造', '推进标准体系衔接'], docs: ['cnLaw'] },
      { code: '《北京市无障碍环境建设条例》', name: '北京市地方性法规', items: ['区政府组织无障碍设施改造', '街道按职责参与相关工作', '家庭生活设施改造可按规定补贴'], docs: ['bjBarrier'] },
      { code: '北京市居家适老化改造政策', name: '市级实施与补贴依据', items: ['经济困难老年人重点保障', '60-79 周岁适老产品补贴 60%', '每户补贴上限 5000 元'], docs: ['bjRetrofit2023', 'bjRetrofit2024'] }
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
    '北京': { grant: '北京市东城区 67 岁户籍长者 demo：60—79 周岁适老产品补贴 60%，每户补贴上限 ¥5000；经济困难老年人家庭优先保障', law: '《北京市无障碍环境建设条例》', docs: ['bjBarrier', 'bjRetrofit2024', 'dcAllowance'] },
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
      <button class="std-card ${(s.docs || []).length ? 'doc-trigger' : ''}" type="button" data-docs="${escapeHtml((s.docs || []).join(','))}">
        <span class="std-force">强制执行</span>
        <div class="std-code">${s.code}</div>
        <div class="std-name">${s.name}</div>
        <ul>${s.items.map(i => `<li>${i}</li>`).join('')}</ul>
        ${(s.docs || []).length ? '<span class="doc-hint">查看支持文档</span>' : ''}
      </button>`).join('');
  }

  function buildMap() {
    cnMap.innerHTML = CN_PROV.map(([abbr, name, col, row, muni]) =>
      `<button class="prov ${muni ? 'muni' : ''}" data-name="${name}" style="grid-column:${col};grid-row:${row}">${abbr}</button>`
    ).join('');
    cnMap.querySelectorAll('.prov').forEach(p => p.addEventListener('click', () => {
      cnMap.querySelectorAll('.prov').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      selectedProv = p.dataset.name;
      mapCurrent.textContent = selectedProv === '北京' ? '北京 · 东城区' : selectedProv;
      runAnalyze();
    }));
    const bj = cnMap.querySelector('[data-name="北京"]');
    if (bj) bj.classList.add('active');
  }
  buildMap();
  selectedProv = '北京';
  if (mapCurrent) mapCurrent.textContent = '北京 · 东城区';
  if (regionSel) regionSel.value = 'cn';
  renderStandards('cn');

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
      items.push({ tag: selectedProv + ' · 东城区支持', lvl: 'grant', ok: true, h: pol.law, p: pol.grant + '。', m: '可结合本地政策申请补贴', docs: pol.docs || ['cnLaw'] });
    }

    analyzeBtn.querySelector('.btn-label').textContent = '分析中…';
    setTimeout(() => {
      analyzeBtn.querySelector('.btn-label').textContent = '生成合规分析';
      const locLabel = region === 'cn' && selectedProv ? selectedProv : data.label;
      const ageLabel = region === 'cn' && selectedProv === '北京' && age === '60' ? '67 岁' : age + '+ 岁';
      results.innerHTML =
        `<div class="compliance-bar">
           <span class="cbar-num">${score}%</span>
           <div class="cbar-track"><div class="cbar-fill"></div></div>
           <span style="font-size:.85rem;color:var(--ink-soft)">${locLabel === '北京' ? '北京 · 东城区' : locLabel} · ${ageLabel} · 综合合规度</span>
         </div>
         <div class="law-grid">
           ${items.map((it, i) => {
             const lv = LVL[it.lvl] || LVL.rec;
             const docs = it.docs || [];
             return `
             <button class="law-card ${docs.length ? 'doc-trigger' : ''} ${it.ok ? 'ok' : ''}" type="button" data-docs="${escapeHtml(docs.join(','))}" style="animation-delay:${i * 0.08 + 0.1}s">
               <div class="law-head">
                 <span class="lvl ${lv[1]}">${lv[0]}</span>
                 <span class="law-tag">${it.tag}</span>
               </div>
               <h4>${it.h}</h4>
               <p>${it.p}</p>
               <div class="law-meta">${it.ok ? '✓ ' : '⚠ '}${it.m}</div>
               ${docs.length ? '<span class="doc-hint">点击查看 PDF / 原文</span>' : ''}
             </button>`;
           }).join('')}
         </div>`;
      requestAnimationFrame(() => {
        const fill = results.querySelector('.cbar-fill');
        if (fill) fill.style.width = score + '%';
      });
    }, 500);
  }
  analyzeBtn?.addEventListener('click', runAnalyze);

  function ensureDocModal() {
    let modal = document.getElementById('docModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'docModal';
    modal.className = 'doc-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="doc-backdrop" data-doc-close></div>
      <section class="doc-dialog" role="dialog" aria-modal="true" aria-labelledby="docTitle">
        <button class="doc-close" type="button" data-doc-close aria-label="关闭">×</button>
        <div class="doc-info">
          <span class="doc-type" id="docType"></span>
          <h3 id="docTitle"></h3>
          <p id="docSummary"></p>
          <div class="doc-actions" id="docActions"></div>
        </div>
        <iframe id="docFrame" title="政策文档预览" loading="lazy"></iframe>
      </section>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target.closest('[data-doc-close]')) closeDocModal();
      const next = e.target.closest('[data-doc-key]');
      if (next) openDocModal(next.dataset.docKey, activeDocKeys);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.hidden) closeDocModal();
    });
    return modal;
  }
  let activeDocKeys = [];
  function openDocModal(key, allKeys) {
    const doc = docByKey(key);
    if (!doc) return;
    activeDocKeys = allKeys?.length ? allKeys : (activeDocKeys.length ? activeDocKeys : [key]);
    const modal = ensureDocModal();
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('#docType').textContent = `${doc.type} · ${doc.org}`;
    modal.querySelector('#docTitle').textContent = doc.title;
    modal.querySelector('#docSummary').textContent = doc.summary;
    const docTabs = activeDocKeys.map(docKey => {
      const item = docByKey(docKey);
      if (!item) return '';
      return `<button class="doc-chip ${docKey === key ? 'active' : ''}" type="button" data-doc-key="${docKey}">${escapeHtml(item.type)} · ${escapeHtml(item.title)}</button>`;
    }).join('');
    modal.querySelector('#docActions').innerHTML = `${docTabs}<a class="btn btn-mini btn-primary" href="${doc.url}" target="_blank" rel="noopener">新窗口打开官方来源</a>`;
    modal.querySelector('#docFrame').src = doc.url;
  }
  function closeDocModal() {
    const modal = document.getElementById('docModal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    modal.querySelector('#docFrame').src = 'about:blank';
  }
  document.addEventListener('click', e => {
    const trigger = e.target.closest('.doc-trigger');
    if (!trigger) return;
    const keys = (trigger.dataset.docs || '').split(',').map(k => k.trim()).filter(Boolean);
    if (!keys.length) return;
    e.preventDefault();
    openDocModal(keys[0], keys);
  });

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
    updateHeatmap();
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
  function initHeatModelViewer(options) {
    const host = document.getElementById(options.id);
    if (!host || !window.THREE || !THREE.GLTFLoader) return null;
    const canvas = host.querySelector('canvas');
    if (!canvas) return null;
    host.classList.add('loading');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(options.camera?.[0] ?? 0, options.camera?.[1] ?? 1.2, options.camera?.[2] ?? 5.2);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const root = new THREE.Group();
    root.rotation.set(options.rotation?.[0] ?? 0, options.rotation?.[1] ?? -0.35, options.rotation?.[2] ?? 0);
    scene.add(root);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c4a5, 2.3));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xf6ead8, 1.1);
    fill.position.set(-4, 2, 2);
    scene.add(fill);

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8f6ef,
      roughness: 0.62,
      metalness: 0.02,
      envMapIntensity: 0.25
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.74,
      metalness: 0
    });

    function resize() {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    const loader = new THREE.GLTFLoader();
    loader.load(options.path, gltf => {
      const model = gltf.scene;
      model.traverse(node => {
        if (!node.isMesh) return;
        node.castShadow = false;
        node.receiveShadow = false;
        node.material = options.kind === 'home' ? whiteMat.clone() : accentMat.clone();
      });
      root.add(model);

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = (options.fit ?? 2.7) / maxDim;
      model.scale.setScalar(scale);
      model.position.y += options.yOffset ?? 0;
      host.classList.remove('loading');
    }, undefined, () => {
      host.classList.remove('loading');
      host.classList.add('failed');
    });

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    host.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      host.setPointerCapture?.(e.pointerId);
    });
    host.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      root.rotation.y += dx * 0.01;
      root.rotation.x = Math.max(-0.7, Math.min(0.7, root.rotation.x + dy * 0.006));
    });
    const stopDrag = e => {
      dragging = false;
      if (e?.pointerId !== undefined) host.releasePointerCapture?.(e.pointerId);
    };
    host.addEventListener('pointerup', stopDrag);
    host.addEventListener('pointercancel', stopDrag);
    host.addEventListener('pointerleave', stopDrag);

    function animate() {
      if (!dragging) root.rotation.y += options.autoRotate ?? 0.0025;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
    return { host, scene, camera, renderer, root };
  }
  function initHeatModels() {
    initHeatModelViewer({
      id: 'bodyModel',
      path: 'assets/models/kenney-character-a.glb',
      kind: 'body',
      fit: 3.15,
      yOffset: -0.15,
      camera: [0, 1.1, 5.3],
      rotation: [0.03, -0.32, 0],
      autoRotate: 0.0023
    });
    initHeatModelViewer({
      id: 'homeModel',
      path: 'assets/models/kenney-building-a.glb',
      kind: 'home',
      fit: 3.55,
      yOffset: -0.2,
      camera: [0, 1.65, 5.6],
      rotation: [-0.18, -0.56, 0],
      autoRotate: 0.002
    });
  }
  function updateHeatmap() {
    const titles = [...selectedNeeds.keys()];
    const has = (...names) => names.some(name => titles.includes(name));
    const night = has('深夜起夜', '走廊太暗');
    const bath = has('站着洗澡很累', '深夜起夜');
    const move = has('过门槛绊脚', '上下楼吃力', '出门台阶高');
    const sos = has('摔倒没人知道');
    const kitchen = has('忘记关火');
    const bodyScore = Math.min(96, 58 + (night ? 10 : 0) + (bath ? 12 : 0) + (move ? 10 : 0) + (sos ? 6 : 0));
    const homeScore = Math.min(98, 62 + (night ? 8 : 0) + (bath ? 14 : 0) + (move ? 10 : 0) + (kitchen ? 5 : 0));
    const priority = bodyScore >= 88 || homeScore >= 88 ? 'A+' : bodyScore >= 76 || homeScore >= 76 ? 'A' : 'B';
    const bodyScoreEl = document.getElementById('bodyHeatScore');
    const homeScoreEl = document.getElementById('homeHeatScore');
    const priorityEl = document.getElementById('heatPriority');
    if (bodyScoreEl) bodyScoreEl.textContent = bodyScore;
    if (homeScoreEl) homeScoreEl.textContent = homeScore;
    if (priorityEl) priorityEl.textContent = priority;

    const metricHtml = [
      ['平衡稳定', move || bath ? 82 : 72],
      ['夜间视线', night ? 86 : 48],
      ['求助可达', sos ? 88 : 64]
    ].map(([label, value]) => `<div><span>${label}</span><i><u style="width:${value}%"></u></i><b>${value}%</b></div>`).join('');
    const metrics = document.getElementById('bodyHeatMetrics');
    if (metrics) metrics.innerHTML = metricHtml;

    const output = document.getElementById('heatOutput');
    if (output) {
      const focus = [];
      if (bath) focus.push('卫浴防滑与坐浴支撑');
      if (night) focus.push('夜间连续照明');
      if (move) focus.push('门槛/楼梯通行动线');
      if (sos) focus.push('紧急呼叫响应');
      if (kitchen) focus.push('厨房燃气安全');
      output.innerHTML = `<span>当前重点</span><strong>${focus.length ? focus.join('、') : '卫浴防滑、夜间照明、紧急呼叫'}</strong>`;
    }

    const toggle = (selector, on) => document.querySelector(selector)?.classList.toggle('active', !!on);
    toggle('.body-eye', night);
    toggle('.body-hand', bath);
    toggle('.body-knee', move || bath);
    toggle('.body-foot', night || move || bath);
    toggle('.bath-hot', bath);
    toggle('.hall-hot', night);
    toggle('.bed-hot', night || has('起床困难'));
    toggle('.entry-hot', move);

    document.querySelectorAll('.heat-link-item').forEach((item, index) => {
      const active = index === 0 ? night : index === 1 ? bath : move;
      item.classList.toggle('active', active || (!titles.length && index === 0));
    });
  }
  document.getElementById('heatmap')?.addEventListener('click', e => {
    const point = e.target.closest('[data-heat-tip]');
    if (!point) return;
    const output = document.getElementById('heatOutput');
    if (output) output.innerHTML = `<span>热力点解释</span><strong>${escapeHtml(point.dataset.heatTip)}</strong>`;
    document.querySelectorAll('.heat-dot,.home-hotspot').forEach(el => el.classList.remove('active'));
    point.classList.add('active');
  });
  // expose for assistant module
  window.__ehAddNeed = (title) => { addNeed(title); };

  renderDeck();
  updateHeatmap();
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

  /* ---- 相关法规与支持政策（依据所在地区） ---- */
  const REGION_POLICY = {
    uk: {
      label: '英国 United Kingdom',
      laws: [
        { code: 'Building Regs Part M', name: '无障碍入口、净门宽与可达卫生间' },
        { code: 'Building Regs Part K', name: '楼梯防跌落与双侧连续扶手' },
        { code: 'BS 8300-2:2018', name: '建成环境无障碍设计：防滑、照度与回转空间' }
      ],
      support: [
        { name: 'Disabled Facilities Grant (DFG)', detail: '经地方政府评估，最高可申请 £30,000 住宅适配改造补贴。' },
        { name: 'Home Improvement Agency / Care & Repair', detail: '为长者提供改造咨询、施工对接与小额维修资助。' }
      ]
    },
    au: {
      label: '澳大利亚 Australia',
      laws: [
        { code: 'NCC 2022 · Livable Housing', name: '银级可居住住房标准强制纳入新建住宅' },
        { code: 'AS 1428.1-2021', name: '坡道 ≤1:14、抓杆承重与回转空间 ≥1540mm' },
        { code: 'AS 1428.2', name: '照明、标识与操作高度等增强要求' }
      ],
      support: [
        { name: 'Home Care Package (HCP)', detail: 'Level 1–4 资助可覆盖部分适老化改造与辅具费用。' },
        { name: 'Commonwealth Home Support (CHSP)', detail: '为居家长者提供扶手安装、小型改造等支持服务。' }
      ]
    },
    cn: {
      label: '中国大陆 China',
      laws: [
        { code: '《无障碍环境建设法》', name: '2023 年施行，面向老年人等群体推进无障碍环境建设', docs: ['cnLaw'] },
        { code: '《北京市无障碍环境建设条例》', name: '区政府、街道按职责推进无障碍设施建设与改造', docs: ['bjBarrier'] },
        { code: '北京市居家适老化改造实施意见', name: '建立推荐清单、服务平台与经济困难老年人补贴机制', docs: ['bjRetrofit2023'] }
      ],
      support: [
        { name: '北京市适老化改造产品消费补贴', detail: '60—79 周岁补贴 60%，每户上限 5000 元；经济困难家庭优先。', docs: ['bjRetrofit2024'] },
        { name: '东城区养老服务补贴津贴', detail: '困难、失能、高龄等老年人可按条件申领养老服务补贴或津贴。', docs: ['dcAllowance'] }
      ]
    }
  };

  function resolveRegion(regionStr) {
    if (!regionStr) return null;
    const s = regionStr;
    if (/UK|英国|伦敦/.test(s)) return { key: 'uk', prov: '' };
    if (/AU|澳/.test(s)) return { key: 'au', prov: '' };
    const prov = Object.keys(PROV_POLICY).find(p => s.includes(p)) || (/东城|朝阳|海淀|西城|丰台|石景山|通州/.test(s) ? '北京' : '');
    if (prov || /CN|中国|国内/.test(s)) return { key: 'cn', prov };
    return null;
  }

  const policyList = document.getElementById('policyList');
  function renderPolicy() {
    if (!policyList) return;
    const r = resolveRegion(profile.region);
    if (!r) {
      policyList.innerHTML = '<p class="policy-empty">说说长辈住在哪里（如英国、澳大利亚或国内省市），这里会显示当地适老化法规与可申请的补贴政策。</p>';
      return;
    }
    const info = REGION_POLICY[r.key];
    const support = info.support.slice();
    let locLabel = info.label;
    if (r.key === 'cn' && r.prov) {
      locLabel = r.prov === '北京' && /东城/.test(profile.region) ? '北京市东城区' : r.prov;
      const pol = PROV_POLICY[r.prov];
      if (pol) support.unshift({ name: '北京市东城区 · ' + pol.law, detail: pol.grant + '。', docs: pol.docs || [] });
    }
    policyList.innerHTML =
      `<div class="policy-loc">📍 ${locLabel}</div>
       <div class="policy-group">
         <p class="policy-gt"><span>⚖️</span> 相关法规标准</p>
         ${info.laws.map(l => {
           const docs = l.docs || [];
           return `<button class="policy-item law ${docs.length ? 'doc-trigger' : ''}" type="button" data-docs="${escapeHtml(docs.join(','))}"><strong>${l.code}</strong><small>${l.name}</small>${docs.length ? '<em>查看来源</em>' : ''}</button>`;
         }).join('')}
       </div>
       <div class="policy-group">
         <p class="policy-gt"><span>💰</span> 可申请的支持政策</p>
         ${support.map(s => {
           const docs = s.docs || [];
           return `<button class="policy-item grant ${docs.length ? 'doc-trigger' : ''}" type="button" data-docs="${escapeHtml(docs.join(','))}"><strong>${s.name}</strong><small>${s.detail}</small>${docs.length ? '<em>查看来源</em>' : ''}</button>`;
         }).join('')}
       </div>
       <a href="#legal" class="policy-more">查看完整合规分析 →</a>`;
  }

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
      const namedElder = text.match(/(?:^|[，,。；;\s])([\u4e00-\u9fa5]{2,4})(奶奶|爷爷|外婆|外公|妈妈|母亲|爸爸|父亲|婆婆|公公|阿姨)/);
      const nm = text.match(/(奶奶|爷爷|外婆|外公|妈妈|母亲|爸爸|父亲|婆婆|公公|阿姨|老伴|长辈|老人家)/);
      if (namedElder) profile.name = namedElder[1] + namedElder[2];
      else if (nm) profile.name = nm[1];
    }
    const regions = [['东城区', '北京市东城区'], ['东城', '北京市东城区'], ['北京东城', '北京市东城区'],
      ['英国', '英国 (UK)'], ['uk', '英国 (UK)'], ['伦敦', '英国 (UK)'],
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
    const concerns = [
      [/起夜|夜里|夜间/, '夜间起夜'],
      [/滑倒|摔倒|跌倒|防滑/, '跌倒风险'],
      [/卫生间|浴室|洗澡|如厕/, '卫生间安全'],
      [/门槛|台阶|上下楼|楼梯/, '通行动线'],
      [/呼叫|求助|没人知道/, '紧急求助']
    ];
    concerns.forEach(([pattern, label]) => {
      if (pattern.test(text) && !profile.concerns.includes(label)) profile.concerns.push(label);
    });
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
    renderPolicy();
  }

  const recList = document.getElementById('recList');
  function renderRecs(titles) {
    const uniq = [...new Set(titles)].filter(Boolean);
    if (!uniq.length) return;
    recList.innerHTML = `<p class="rec-tip">点击卡牌即可加入需求总结</p>` + uniq.map(t => {
      const c = DECK.find(d => d.title === t);
      if (!c) return '';
      const added = selectedNeeds.has(t);
      return `<div class="rec-item ${added ? 'added' : ''}" data-title="${c.title}" role="button" tabindex="0">
        <div class="ri-media">
          <img src="${c.img}" alt="${c.title}" loading="lazy"/>
          <span class="ri-suit">${c.suit}</span>
        </div>
        <div class="ri-body">
          <span class="ri-scene">${c.scene}</span>
          <strong>${c.title}</strong>
          <small>${c.need}</small>
          <span class="ri-add">${added ? '已加入' : '加入'}</span>
        </div>
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
    if (add) add.textContent = '已加入';
    toast('已加入需求总结：' + title);
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

  const visibilityLabels = {
    self: '仅本人',
    family: '本人 + 家人',
    care: '本人 + 家人 + 医护',
    project: '项目协同方',
    community: '社区/政策办理',
    all: '全部协作者'
  };
  const profileVisibility = {
    name: 'family',
    age: 'family',
    region: 'project',
    living: 'family',
    mobility: 'care',
    health: 'care',
    concerns: 'project',
    expect: 'project',
    route: 'project',
    needs: 'project',
    products: 'project',
    budget: 'family',
    contacts: 'family',
    address: 'self',
    photos: 'project',
    docs: 'community'
  };
  let generatedProfileId = '';

  function profileCode() {
    const region = profile.region || '';
    if (/UK|英国/i.test(region)) return 'UK';
    if (/AU|澳大利亚|澳洲/i.test(region)) return 'AU';
    if (/东城/.test(region)) return 'BJDC';
    if (/北京/.test(region)) return 'BJ';
    return 'CN';
  }
  function getProfileId() {
    if (!generatedProfileId) {
      generatedProfileId = 'EH-' + Math.floor(1000 + Math.random() * 9000) + '-' + profileCode();
    }
    return generatedProfileId;
  }
  function profileValue(value, fallback = '待补充') {
    return escapeHtml(value || fallback);
  }
  function selectedNeedText() {
    const needs = [...selectedNeeds.keys()];
    return needs.length ? needs.join('、') : (profile.concerns.length ? profile.concerns.slice(0, 4).join('、') : '');
  }
  function selectedProductText() {
    const items = PRODUCTS.filter(p => planSet.has(p.id)).map(p => p.name);
    return items.length ? items.join('、') : '待根据需求卡牌匹配';
  }
  function completionPercent() {
    const fields = [profile.name, profile.age, profile.region, profile.living, profile.mobility, profile.health, profile.concerns.length ? '1' : '', profile.expect];
    return Math.round(fields.filter(Boolean).length / fields.length * 100);
  }
  function riskScore() {
    let score = 34;
    if (profile.age && Number(profile.age) >= 65) score += 12;
    if (profile.mobility) score += /轮椅|助行器|拄拐|不便/.test(profile.mobility) ? 18 : 8;
    if (profile.health) score += Math.min(18, profile.health.split('、').filter(Boolean).length * 6);
    if (profile.concerns.length) score += Math.min(18, profile.concerns.length * 5);
    return Math.min(score, 96);
  }
  function visibilitySelect(key) {
    return `<label class="pv-select"><span>可见性</span><select data-profile-visibility="${key}">
      ${Object.entries(visibilityLabels).map(([value, label]) =>
        `<option value="${value}" ${profileVisibility[key] === value ? 'selected' : ''}>${label}</option>`
      ).join('')}
    </select></label>`;
  }
  function profileRow(key, icon, label, value, note) {
    const current = visibilityLabels[profileVisibility[key]] || visibilityLabels.family;
    return `<article class="profile-data-row" data-visibility="${profileVisibility[key] || 'family'}">
      <div class="pdr-main">
        <span class="pdr-icon">${icon}</span>
        <div>
          <small>${escapeHtml(label)}</small>
          <strong>${profileValue(value)}</strong>
          ${note ? `<p>${escapeHtml(note)}</p>` : ''}
        </div>
      </div>
      <div class="pdr-access"><b>${current}</b>${visibilitySelect(key)}</div>
    </article>`;
  }
  function profileModule(title, desc, rows) {
    return `<section class="profile-module">
      <div class="profile-module-head">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(desc)}</p>
      </div>
      <div class="profile-data-grid">${rows.join('')}</div>
    </section>`;
  }
  function visibilitySummary() {
    const counts = Object.values(profileVisibility).reduce((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(visibilityLabels).map(([key, label]) =>
      `<span><b>${counts[key] || 0}</b>${label}</span>`
    ).join('');
  }
  function renderProfilePage() {
    const pct = completionPercent();
    const score = riskScore();
    const concernText = profile.concerns.slice(0, 5).join('、');
    const firstName = profile.name || '长者';
    const modules = [
      profileModule('基础身份与居住情况', '用于确认补贴资格、服务范围和家庭协同边界。', [
        profileRow('name', '👤', '称呼', profile.name, '显示在共享链接、二维码和协作通知中。'),
        profileRow('age', '🎂', '年龄', profile.age ? profile.age + ' 岁' : '', '用于匹配 60 周岁以上适老化改造政策。'),
        profileRow('region', '📍', '所在地区', profile.region, '影响法规、补贴、社区服务和承包商派单范围。'),
        profileRow('living', '🏠', '居住情况', profile.living, '用于判断是否需要紧急联系人、上门评估和陪同施工。')
      ]),
      profileModule('健康、行动与风险信息', '默认更保守，仅向家人和医护开放，施工方只看到必要的安装要求。', [
        profileRow('mobility', '🦽', '行动能力', profile.mobility, '用于确定扶手、坡道、坐浴椅和通道宽度。'),
        profileRow('health', '❤️', '健康关注', profile.health, '慢病、视力、关节等信息建议只给医护与家人。'),
        profileRow('concerns', '⚠️', '主要困扰', concernText, '会转化为设计卡牌和施工优先级。'),
        profileRow('route', '🌙', '高风险动线', selectedNeedText() || '待根据对话生成', '夜间起夜、床边到卫生间、入户门槛等重点路线。')
      ]),
      profileModule('改造方案与执行信息', '给设计师、承包商和家人使用，确保需求、产品、预算和验收一致。', [
        profileRow('expect', '✨', '改造期望', profile.expect, '例如少打扰、保留习惯、先做卫浴等。'),
        profileRow('needs', '🃏', '已选设计需求', selectedNeedText(), '来自 AI 推荐卡牌或手动加入的需求总结。'),
        profileRow('products', '🛋️', '采购/辅具建议', selectedProductText(), '用于后续采购方案和预算核对。'),
        profileRow('budget', '💰', '预算与优先级', pct >= 60 ? '先保安全，再做舒适升级' : '待家人补充预算范围', '建议先覆盖防滑、照明、抓扶和紧急呼叫。')
      ]),
      profileModule('联系人、材料与授权', '这些信息关系到隐私和上门服务，建议逐项设置可见范围。', [
        profileRow('contacts', '📞', '紧急联系人', '子女 / 社区 / 物业待绑定', '至少配置 2 位联系人，并确认夜间响应方式。'),
        profileRow('address', '🔐', '详细住址', profile.region ? profile.region + ' · 具体门牌仅本人可见' : '', '详细门牌默认仅本人可见，需要上门时再临时授权。'),
        profileRow('photos', '📷', '现场照片', '卫浴、走廊、入户、卧室分区授权', '卧室和健康相关照片不默认给施工方。'),
        profileRow('docs', '📄', '政策/评估材料', '身份证明、评估表、补贴申请材料待上传', '社区只能看到办理所需材料，不展示完整家庭隐私。')
      ])
    ];

    return `
      <aside class="profile-sidebar-page">
        <div class="profile-avatar-card">
          <img src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=240&q=80" alt="${escapeHtml(firstName)}头像" />
          <span>${escapeHtml(getProfileId())}</span>
          <h4>${escapeHtml(firstName)}的适老化改造档案</h4>
          <p>${profileValue(profile.region, '地区待补充')} · ${profile.age ? escapeHtml(profile.age + ' 岁') : '年龄待补充'}</p>
        </div>
        <div class="profile-score-card">
          <div class="profile-ring" style="--score:${score}"><strong>${score}</strong><span>风险指数</span></div>
          <div>
            <b>档案完整度 ${pct}%</b>
            <i><em style="width:${pct}%"></em></i>
            <small>${pct >= 75 ? '可进入协同执行阶段' : '建议继续补充健康、预算和现场照片'}</small>
          </div>
        </div>
        <div class="profile-status-grid">
          <div><span>当前阶段</span><b>需求确认</b></div>
          <div><span>重点空间</span><b>${concernText ? '卫浴 / 夜间动线' : '待识别'}</b></div>
          <div><span>协作者</span><b>本人、家人、医护、社区、承包商</b></div>
        </div>
        <div class="profile-privacy-card">
          <h4>可见性分布</h4>
          <div id="profileVisibilitySummary">${visibilitySummary()}</div>
        </div>
      </aside>
      <main class="profile-main-page">
        <div class="profile-action-strip">
          <div>
            <span>资料页已生成</span>
            <strong>每一项数据都可以单独设置谁能看到</strong>
          </div>
          <div class="profile-share-mini">
            <button class="btn btn-mini btn-ghost" type="button" data-privacy-preset="private">保守共享</button>
            <button class="btn btn-mini btn-ghost" type="button" data-privacy-preset="team">协同共享</button>
          </div>
        </div>
        ${modules.join('')}
      </main>`;
  }
  function updateProfileVisibilitySummary(modal) {
    const summary = modal.querySelector('#profileVisibilitySummary');
    if (summary) summary.innerHTML = visibilitySummary();
    modal.querySelectorAll('.profile-data-row').forEach(row => {
      const select = row.querySelector('select[data-profile-visibility]');
      const badge = row.querySelector('.pdr-access b');
      if (!select || !badge) return;
      row.dataset.visibility = select.value;
      badge.textContent = visibilityLabels[select.value] || '自定义';
    });
  }
  function ensureProfileModal() {
    let modal = document.getElementById('profileModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.className = 'profile-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="profile-backdrop" data-profile-close></div>
      <section class="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">
        <button class="doc-close" type="button" data-profile-close aria-label="关闭">×</button>
        <header class="profile-page-head">
          <span class="profile-page-icon">📁</span>
          <div>
            <span class="profile-page-kicker">长者专属档案 · 个人信息页</span>
            <h3 id="profileModalTitle">生成可共享、可分权的长者资料页</h3>
            <p>把 AI 对话整理出的长者情况、风险场景、设计需求和协作材料集中到一个页面，并逐项控制可见范围。</p>
          </div>
        </header>
        <div class="profile-page-body" id="profilePageBody"></div>
      </section>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target.closest('[data-profile-close]')) closeProfileModal();
      const select = e.target.closest('select[data-profile-visibility]');
      if (select) return;
      const preset = e.target.closest('[data-privacy-preset]');
      if (preset) {
        applyVisibilityPreset(preset.dataset.privacyPreset);
        modal.querySelector('#profilePageBody').innerHTML = renderProfilePage();
        toast(preset.dataset.privacyPreset === 'private' ? '已切换为保守共享' : '已切换为协同共享');
      }
    });
    modal.addEventListener('change', e => {
      const select = e.target.closest('select[data-profile-visibility]');
      if (!select) return;
      profileVisibility[select.dataset.profileVisibility] = select.value;
      updateProfileVisibilitySummary(modal);
      toast('已更新「' + visibilityLabels[select.value] + '」可见性');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.hidden) closeProfileModal();
    });
    return modal;
  }
  function applyVisibilityPreset(type) {
    if (type === 'private') {
      Object.assign(profileVisibility, {
        name: 'family', age: 'family', region: 'project', living: 'family',
        mobility: 'care', health: 'care', concerns: 'family', expect: 'family',
        route: 'project', needs: 'project', products: 'project', budget: 'family',
        contacts: 'family', address: 'self', photos: 'family', docs: 'community'
      });
    } else {
      Object.assign(profileVisibility, {
        name: 'project', age: 'project', region: 'project', living: 'project',
        mobility: 'care', health: 'care', concerns: 'project', expect: 'project',
        route: 'project', needs: 'all', products: 'project', budget: 'family',
        contacts: 'family', address: 'self', photos: 'project', docs: 'community'
      });
    }
  }
  function openProfileModal() {
    const modal = ensureProfileModal();
    modal.querySelector('#profilePageBody').innerHTML = renderProfilePage();
    modal.hidden = false;
    document.body.classList.add('modal-open');
  }
  function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  document.getElementById('createProfile')?.addEventListener('click', () => {
    openProfileModal();
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

  const demoRecs = ['深夜起夜', '站着洗澡很累', '摔倒没人知道'];
  if (recList) {
    recList.dataset.titles = JSON.stringify(demoRecs);
    renderRecs(demoRecs);
  }
  renderProfile();
  runAnalyze();

})();
