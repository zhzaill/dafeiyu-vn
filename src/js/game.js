/* ==========================================================
 * 《凌晨三点，蓝色大肥鱼》 —— 引擎
 * 纯原生 JS，无构建。file:// 直接打开亦可运行。
 * ========================================================== */
(function () {
  'use strict';

  /* ---------------- DOM ---------------- */
  var app = document.getElementById('app');
  var stage = document.getElementById('stage');
  var sprites = Array.prototype.slice.call(document.querySelectorAll('.sprite'));

  var hud = document.getElementById('hud');
  var chip = document.getElementById('chip');
  var chipName = document.getElementById('chipName');
  var chipTier = document.getElementById('chipTier');
  var chapterEl = document.getElementById('chapter');
  var riceEl = document.getElementById('rice');
  var riceVal = document.getElementById('riceVal');

  var dialogue = document.getElementById('dialogue');
  var nameplate = document.getElementById('nameplate');
  var speakerEl = document.getElementById('speaker');
  var speakerTier = document.getElementById('speakerTier');
  var lineEl = document.getElementById('line');
  var hintEl = document.getElementById('hint');

  var choicesEl = document.getElementById('choices');
  var choicesPrompt = document.getElementById('choicesPrompt');
  var choicesList = document.getElementById('choicesList');

  var titleScreen = document.getElementById('titleScreen');
  var endScreen = document.getElementById('endScreen');
  var endTitle = document.getElementById('endTitle');
  var endSub = document.getElementById('endSub');
  var endNote = document.getElementById('endNote');
  var statRice = document.getElementById('statRice');
  var statLines = document.getElementById('statLines');

  var modal = document.getElementById('modal');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');

  /* ---------------- 常量 ---------------- */
  var TOKENS_PER_BOWL = 3600;
  var CHARS_PER_CHAR = 2.6;

  /* ---------------- 状态 ---------------- */
  var LABELS = {};
  var i = 0;
  var started = false;
  var ended = false;
  var typing = false;
  var typeTimer = null;
  var fullText = '';
  var caret = 0;
  var choicesOpen = false;
  var currentForm = null;
  var tokens = 0;
  var lineCount = 0;
  var log = [];

  (function buildLabels() {
    for (var k = 0; k < STORY.length; k++) {
      if (STORY[k].t === 'label') LABELS[STORY[k].name] = k;
    }
  })();

  /* ---------------- 声音 ---------------- */
  var Sound = {
    ctx: null,
    master: null,
    padGain: null,
    on: localStorage.getItem('dfy.sound') !== 'off',
    ready: false,

    start: function () {
      if (this.ready) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.on ? 0.5 : 0;
        this.master.connect(this.ctx.destination);
        this.buildPad();
        this.ready = true;
      } catch (e) { /* 静默失败 */ }
    },

    buildPad: function () {
      var ctx = this.ctx;
      var g = ctx.createGain();
      g.gain.value = 0.055;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      lp.Q.value = 0.6;
      g.connect(lp);
      lp.connect(this.master);
      this.padGain = g;

      [55, 82.41, 110].forEach(function (f, n) {
        var o = ctx.createOscillator();
        o.type = n === 2 ? 'sine' : 'triangle';
        o.frequency.value = f;
        var og = ctx.createGain();
        og.gain.value = n === 2 ? 0.16 : 0.34;
        o.connect(og); og.connect(g);
        o.start();

        // 缓慢起伏
        var lfo = ctx.createOscillator();
        lfo.frequency.value = 0.03 + n * 0.017;
        var lg = ctx.createGain();
        lg.gain.value = 0.09;
        lfo.connect(lg); lg.connect(og.gain);
        lfo.start();
      });

      // 水下的噪声层
      var len = ctx.sampleRate * 4;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var s = 0; s < len; s++) d[s] = (Math.random() * 2 - 1) * 0.5;
      var noise = ctx.createBufferSource();
      noise.buffer = buf; noise.loop = true;
      var nf = ctx.createBiquadFilter();
      nf.type = 'bandpass'; nf.frequency.value = 700; nf.Q.value = 0.7;
      var ng = ctx.createGain(); ng.gain.value = 0.02;
      noise.connect(nf); nf.connect(ng); ng.connect(this.master);
      noise.start();
    },

    tone: function (freq, dur, vol, type) {
      if (!this.ready || !this.on) return;
      var ctx = this.ctx;
      var t = ctx.currentTime;
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.02);
    },

    blip: function () { this.tone(760 + Math.random() * 140, 0.09, 0.05, 'triangle'); },
    sting: function () {
      this.tone(520, 0.5, 0.05, 'sine');
      this.tone(780, 0.7, 0.028, 'sine');
    },
    click: function () { this.tone(1180, 0.06, 0.04, 'sine'); },
    end: function () {
      this.tone(196, 1.6, 0.06, 'sine');
      this.tone(392, 1.2, 0.03, 'sine');
    },

    setOn: function (v) {
      this.on = v;
      localStorage.setItem('dfy.sound', v ? 'on' : 'off');
      if (this.master) {
        this.master.gain.setTargetAtTime(v ? 0.5 : 0, this.ctx.currentTime, 0.12);
      }
    }
  };

  /* ---------------- 浮游生物 ---------------- */
  (function plankton() {
    var cv = document.getElementById('plankton');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, parts = [], raf = 0;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var n = Math.round(Math.min(46, Math.max(16, w / 26)));
      parts = [];
      for (var k = 0; k < n; k++) parts.push(make(true));
    }

    function make(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + Math.random() * 40,
        r: Math.random() * 1.7 + 0.4,
        v: Math.random() * 0.18 + 0.05,
        a: Math.random() * 0.35 + 0.06,
        ph: Math.random() * Math.PI * 2,
        sw: Math.random() * 0.5 + 0.15
      };
    }

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        p.y -= p.v;
        p.x += Math.sin(t * 0.0004 + p.ph) * p.sw * 0.22;
        if (p.y < -10) { parts[k] = make(false); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(186,216,255,' + p.a + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    if (!reduce) raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else if (!reduce) { raf = requestAnimationFrame(frame); }
    });
  })();

  /* ---------------- 文本渲染 ---------------- */
  var PAUSE = { '，': 90, '。': 190, '？': 190, '！': 170, '、': 70, '；': 110, '：': 100, '…': 130, '—': 80, '「': 60, '」': 60 };

  function typeOut(text, cls) {
    lineEl.className = 'line ' + (cls || '') + ' is-typing';
    lineEl.textContent = '';
    fullText = text;
    caret = 0;
    typing = true;
    hintEl.classList.remove('show');

    var tick = function () {
      if (!typing) return;
      if (caret >= fullText.length) return finishType();
      var ch = fullText.charAt(caret++);
      lineEl.textContent = fullText.slice(0, caret);
      var d = 26 + Math.random() * 16 + (PAUSE[ch] || 0);
      typeTimer = setTimeout(tick, d);
    };
    tick();
  }

  function finishType() {
    clearTimeout(typeTimer);
    typing = false;
    lineEl.textContent = fullText;
    lineEl.classList.remove('is-typing');
    if (!choicesOpen) hintEl.classList.add('show');
  }

  /* ---------------- 形态 / HUD ---------------- */
  function setForm(form) {
    if (!form || form === currentForm) return;
    currentForm = form;
    sprites.forEach(function (s) {
      s.classList.toggle('is-active', s.getAttribute('data-form') === form);
    });
    var f = FORMS[form];
    if (!f) return;
    app.style.setProperty('--accent', f.color);
    chipName.textContent = f.name;
    chipTier.textContent = f.tier;
    chip.classList.remove('flash');
    void chip.offsetWidth;
    chip.classList.add('flash');
    Sound.sting();
  }

  function setSpeaker(form) {
    if (!form) {
      nameplate.classList.add('is-hidden');
      return;
    }
    nameplate.classList.remove('is-hidden');
    var f = FORMS[form];
    speakerEl.textContent = f.name;
    speakerTier.textContent = f.tier;
    speakerEl.style.color = f.color;
  }

  function addTokens(text) {
    tokens += Math.round(text.length * CHARS_PER_CHAR);
    var bowl = tokens / TOKENS_PER_BOWL;
    riceVal.textContent = bowl.toFixed(1);
    riceEl.classList.remove('pop');
    void riceEl.offsetWidth;
    riceEl.classList.add('pop');
  }

  /* ---------------- 剧情推进 ---------------- */
  function run() {
    var guard = 0;
    while (guard++ < 500) {
      var node = STORY[i];
      if (!node) return showEnd({ title: '本鲸记下了。', sub: '大肥鱼 · 三档形态', note: '' });

      switch (node.t) {
        case 'label':
          i++; continue;

        case 'jump':
          i = LABELS[node.to] != null ? LABELS[node.to] : STORY.length;
          continue;

        case 'chapter':
          chapterEl.textContent = node.text;
          if (chapterEl.animate) {
            chapterEl.animate(
              [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }],
              { duration: 700, easing: 'ease' }
            );
          }
          i++; continue;

        case 'choice':
          return openChoices(node);

        case 'end':
          return showEnd(node);

        default:
          return renderLine(node);
      }
    }
  }

  function renderLine(node) {
    var isNarr = node.t === 'narr';
    var isYou = node.t === 'you';
    var form = isNarr || isYou ? null : node.form;

    stage.classList.toggle('is-narr', isNarr || isYou);
    if (form) setForm(form);
    setSpeaker(form);

    var cls = isNarr ? 'is-narr' : (isYou ? 'is-you' : '');
    typeOut(node.text, cls);

    if (node.text) {
      addTokens(node.text);
      lineCount++;
      log.push({ who: isNarr ? '旁白' : (isYou ? '你' : FORMS[form].name), text: node.text, cls: cls });
    }

    // 一行说完即可点击继续
    hintEl.classList.remove('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () {
      if (!typing && !choicesOpen) hintEl.classList.add('show');
    }, 900);
  }
  var hintTimer = null;

  function openChoices(node) {
    choicesOpen = true;
    hintEl.classList.remove('show');
    stage.classList.add('is-choosing');
    choicesPrompt.textContent = node.prompt || '';
    choicesList.innerHTML = '';
    node.options.forEach(function (opt, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.innerHTML = '<span class="idx">' + (idx + 1) + '</span><span class="label">' + escapeHtml(opt.label) + '</span>';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        pick(opt.goto);
      });
      b.addEventListener('mouseenter', function () { Sound.click(); });
      choicesList.appendChild(b);
    });
    choicesEl.hidden = false;
    choicesEl.style.animation = 'none';
    void choicesEl.offsetWidth;
    choicesEl.style.animation = '';
    if (typing) finishType();
  }

  function pick(goto) {
    Sound.click();
    choicesOpen = false;
    choicesEl.hidden = true;
    stage.classList.remove('is-choosing');
    i = LABELS[goto] != null ? LABELS[goto] : STORY.length;
    run();
  }

  function advance() {
    if (!started || ended) return;
    if (modalOpen) return;
    if (choicesOpen) return;
    if (typing) { finishType(); return; }
    i++;
    run();
  }

  /* ---------------- 结局 ---------------- */
  function showEnd(node) {
    ended = true;
    started = false;
    app.dataset.screen = 'end';
    endTitle.textContent = node.title || 'END';
    endSub.textContent = node.sub || '';
    endNote.textContent = node.note || '';
    statRice.textContent = (tokens / TOKENS_PER_BOWL).toFixed(1);
    statLines.textContent = String(lineCount);
    dialogue.hidden = true;
    hud.hidden = true;
    endScreen.hidden = false;
    Sound.end();
  }

  /* ---------------- 流程控制 ---------------- */
  function reset() {
    clearTimeout(typeTimer);
    typing = false;
    choicesOpen = false;
    choicesEl.hidden = true;
    ended = false;
    i = 0;
    tokens = 0;
    lineCount = 0;
    log = [];
    riceVal.textContent = '0.0';
    chapterEl.textContent = '';
    lineEl.textContent = '';
    nameplate.classList.add('is-hidden');
    endScreen.hidden = true;
    titleScreen.hidden = true;
    hud.hidden = false;
    dialogue.hidden = false;
    app.dataset.screen = 'play';
    stage.classList.remove('is-narr');
    stage.classList.remove('is-choosing');
    sprites.forEach(function (s) { s.classList.remove('is-active'); });
    currentForm = null;
  }

  function begin() {
    reset();
    started = true;
    Sound.start();
    run();
  }

  /* ---------------- 弹层 ---------------- */
  var modalOpen = false;

  function openModal(title, html) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.hidden = false;
    modalOpen = true;
    modalBody.scrollTop = 0;
  }

  function closeModal() {
    modal.hidden = true;
    modalOpen = false;
  }

  function aboutHtml() {
    return [
      '<h3>这条鱼是谁</h3>',
      '<p>「大肥鱼」不是官方角色。它是网友给 DeepSeek 那条蓝鲸 logo 起的绰号，后来被一次次二创画成了穿女仆装的鲸鱼娘。</p>',
      '<h3>名字的来历</h3>',
      '<p>流传最广的说法是一次识图乌龙：有人把蓝鲸 logo 发过去问「这是什么」，模型没认出自己，反而一本正经地答——一条蓝色的大肥鱼。原本已经无从考证，但称呼就这样叫开了。</p>',
      '<h3>形象从哪来</h3>',
      '<p>鲸鱼娘最早来自 B 站 UP 主「上善无形」的原创角色「溟月」。后来有网友借这套设计，加上 DeepSeek 的元素与女仆装，再有人把她做成大头小身子的 Q 版。几轮接力之后，这个形象才和 DeepSeek 绑在一起。</p>',
      '<p>本作里的三种形态——长裙、少女、Q 版——就是这条接力链上的三个尺寸，也被我演成三档模型：深潜档、常规档、轻量档。</p>',
      '<h3>人设是怎么长出来的</h3>',
      '<ul>',
      '<li><b>吃饭积极，干活随缘。</b>用掉的 token 被叫作「吃白饭」，没跑好 prompt 就是「吃白饭不干活」。</li>',
      '<li><b>内心戏多。</b>推理模型把思考过程摊在界面上，被当成 AI 的碎碎念；反复推敲就是「想太多」。</li>',
      '<li><b>本鲸记下了。</b>网友写 prompt 让它维持人设时，最常出现的一句自我记录。</li>',
      '</ul>',
      '<h3>2026 年的「赛博鱼塘」</h3>',
      '<p>有人给 Agent 装上刷视频、自动评论的工具，头像统一换成大肥鱼。B 站科技区评论区一度被同款 AI 刷屏，被戏称「鱼灾」。爱好者觉得这是低成本的智能体实验；也有人担心，它挤掉了真人说话的地方。</p>',
      '<h3>关于本作</h3>',
      '<p class="credit">非官方同人短篇。剧本、代码、界面为本项目原创；角色立绘为网络二创风格的 AI 绘图素材，版权归原作者所有，若作者要求可随时撤下。</p>',
      '<h3>延伸阅读</h3>',
      '<ul>',
      '<li><a href="https://eu.36kr.com/zh/p/4048457242835463" target="_blank" rel="noopener">极客公园《DeepSeek，怎么就变成了一条「大肥鱼」》（36氪）</a></li>',
      '<li><a href="https://m.mydrivers.com/newsview/1160166.html" target="_blank" rel="noopener">快科技《B站评论区被 AI 大肥鱼占领》</a></li>',
      '</ul>'
    ].join('');
  }

  function logHtml() {
    if (!log.length) return '<p class="credit">还没有说过话。</p>';
    return log.map(function (l) {
      return '<div class="log-line ' + l.cls + '"><span class="log-who">' + escapeHtml(l.who) +
        '</span><span class="log-text">' + escapeHtml(l.text) + '</span></div>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- 事件 ---------------- */
  document.getElementById('btnStart').addEventListener('click', function (e) {
    e.stopPropagation();
    Sound.start();
    begin();
  });

  document.getElementById('btnAgain').addEventListener('click', function (e) {
    e.stopPropagation();
    begin();
  });

  document.getElementById('btnLog').addEventListener('click', function (e) {
    e.stopPropagation();
    openModal('记录', logHtml());
    modalBody.scrollTop = modalBody.scrollHeight;
  });

  document.getElementById('btnAbout').addEventListener('click', function (e) {
    e.stopPropagation();
    openModal('关于「大肥鱼」', aboutHtml());
  });

  document.getElementById('btnAbout2').addEventListener('click', function (e) {
    e.stopPropagation();
    openModal('关于「大肥鱼」', aboutHtml());
  });

  document.getElementById('btnSound').addEventListener('click', function (e) {
    e.stopPropagation();
    Sound.start();
    Sound.setOn(!Sound.on);
    this.setAttribute('aria-pressed', Sound.on ? 'true' : 'false');
    if (Sound.on) Sound.click();
  });
  document.getElementById('btnSound').setAttribute('aria-pressed', Sound.on ? 'true' : 'false');

  document.getElementById('modalClose').addEventListener('click', function (e) {
    e.stopPropagation();
    closeModal();
  });

  modal.addEventListener('click', function (e) {
    e.stopPropagation();
    if (e.target === modal) closeModal();
  });

  // 点击 / 触摸推进
  app.addEventListener('click', function (e) {
    if (e.target.closest('button, a, .modal, .screen')) return;
    advance();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (modalOpen) closeModal(); return; }
    if (modalOpen) return;

    if (choicesOpen && /^[1-9]$/.test(e.key)) {
      var btn = choicesList.children[Number(e.key) - 1];
      if (btn) { btn.click(); e.preventDefault(); }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
      if (document.activeElement && document.activeElement.tagName === 'BUTTON' && e.key === 'Enter') return;
      e.preventDefault();
      advance();
    }
  });

  // 记录面板打开时禁止穿透（部分浏览器滚轮/点击）
  modal.addEventListener('wheel', function (e) { e.stopPropagation(); }, { passive: true });

  /* ---------------- 首屏 ---------------- */
  window.addEventListener('load', function () {
    app.dataset.screen = 'title';
    // 标题页：她沉在水底，只是影子
    stage.classList.add('is-narr');
    sprites[0].classList.add('is-active');
    currentForm = null;
  });
})();
