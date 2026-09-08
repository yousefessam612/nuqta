(function () {
  const $ = id => document.getElementById(id);

  let soundOn = true;
  const soundToggle = $("soundToggle");
  soundToggle.addEventListener("change", () => { soundOn = soundToggle.checked; });

  function vibeStatusLines(lines) {
    const st = $("vibeStatus");
    st.innerHTML = "";
    for (const t of lines) {
      const p = document.createElement("div");
      p.textContent = t;
      st.appendChild(p);
    }
  }

  function detectBrowser(ua) {
    if (/FBAN|FBAV/i.test(ua)) return "متصفح فيسبوك الداخلي — الاهتزاز غالبًا معطّل فيه. افتح اللينك من تطبيق كروم نفسه";
    if (/Instagram/i.test(ua)) return "متصفح إنستجرام الداخلي — افتح من كروم";
    if (/MiuiBrowser|XiaoMi/i.test(ua)) return "متصفح شاومي الأصلي — الاهتزاز فيه مش مضمون. جرّب كروم";
    if (/VivoBrowser/i.test(ua)) return "متصفح فيفو الأصلي — جرّب كروم";
    if (/HeyTapBrowser|OppoBrowser/i.test(ua)) return "متصفح أوبو الأصلي — جرّب كروم";
    if (/HuaweiBrowser/i.test(ua)) return "متصفح هواوي — جرّب كروم";
    if (/; wv\)/.test(ua)) return "WebView داخل تطبيق تاني — افتح اللينك من كروم مباشرة";
    if (/SamsungBrowser\/([\d.]+)/.test(ua)) return "سامسونج إنترنت " + /SamsungBrowser\/([\d.]+)/.exec(ua)[1];
    const fx = /Firefox\/(\d+)/.exec(ua);
    if (fx) return "فايرفوكس " + fx[1];
    const ch = /Chrome\/(\d+)/.exec(ua);
    if (ch) {
      if (/Edg\/([\d.]+)/.test(ua)) return "إيدج " + /Edg\/([\d.]+)/.exec(ua)[1];
      if (/OPR\//.test(ua)) return "أوبرا";
      return "كروم " + ch[1] + " ✓ متصفح مظبوط";
    }
    return "غير معروف — " + ua.slice(0, 60);
  }

  $("vibeTest").addEventListener("click", () => {
    const lines = [];
    const secure = typeof window.isSecureContext !== "undefined" ? window.isSecureContext : null;
    lines.push(secure === true ? "الصفحة آمنة (HTTPS): ✓" : "الصفحة آمنة (HTTPS): ✗ — الاهتزاز مش ه يشتغل");

    if (!("vibrate" in navigator)) {
      lines.push("دعم الاهتزاز في المتصفح: ✗ غير موجود خالص");
      lines.push("المتصفح: " + detectBrowser(navigator.userAgent));
      vibeStatusLines(lines);
      return;
    }
    lines.push("دعم الاهتزاز في المتصفح: ✓");

    let ret = null;
    try { ret = navigator.vibrate([150, 80, 150, 80, 150]); } catch (e) { ret = null; }
    lines.push(ret === true
      ? "المتصفح قبل أمر الاهتزاز: ✓"
      : "المتصفح رفض أمر الاهتزاز: ✗ — توفير البيانات أو توفير الطاقة في كروم بيلغيه: اقفله من إعدادات كروم");

    lines.push("المتصفح: " + detectBrowser(navigator.userAgent));

    if (secure === true && ret === true) {
      lines.push("الخلاصة: كل حاجة سليمة من جهة الموقع والمتصفح — لو مش محس بيهتزاز، المشكلة من الجهاز نفسه: شيل وضع توفير الطاقة، وارفع قوة الاهتزاز من إعدادات الصوت والاهتزاز في نظام أندرويد.");
    }

    vibeStatusLines(lines);
  });

  $("vibeLong").addEventListener("click", () => {
    let ret = null;
    try { ret = navigator.vibrate(2000); } catch (e) { ret = null; }
    vibeStatusLines([ret === true
      ? "اتبعت اهتزاز ٢ ثانية — لو ما حسّيتوش: المشكلة من الجهاز/النظام مش من الموقع. شيل توفير الطاقة وارفع قوة الاهتزاز من إعدادات أندرويد."
      : "المتصفح رفض الاهتزاز — اقفل توفير البيانات والطاقة من إعدادات كروم وجرب تاني."]);
  });

  $("vibeCopy").addEventListener("click", () => {
    const text = ($("vibeStatus").innerText || "").trim();
    if (!text) {
      vibeStatusLines(["اضغط «فحص الاهتزاز» الأول وبعدين انسخ."]);
      return;
    }
    const btn = $("vibeCopy");
    const done = () => {
      const old = btn.textContent;
      btn.textContent = "تم النسخ ✓";
      setTimeout(() => { btn.textContent = old; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  });

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    ta.remove();
  }

  const hasVibrate = "vibrate" in navigator;
  $("capLine").textContent = hasVibrate
    ? "متصفحك يقول إنه يدعم الاهتزاز — طول ما إصبعك على نقطة بارزة: اهتزاز مستمر."
    : "متصفحك ما يدعمش الاهتزاز (زي سفاري آيفون) — الصوت شغّال بمكان كل نقطة.";

  const audio = {
    ctx: null,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur, type, gain) {
      const ctx = this.ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    hit(dot) {
      const f = DOT_FREQ[dot] || 950;
      this.tone(f, 0.16, "sine", 0.3);
    },
    ok() { this.tone(660, 0.12); setTimeout(() => this.tone(990, 0.18), 110); },
    bad() { this.tone(150, 0.28, "square", 0.12); }
  };

  const DOT_FREQ = {
    1: 523, 2: 440, 3: 349,
    4: 698, 5: 587, 6: 466
  };

  let buzzLoop = null;

  const VIBE_MODES = [
    { kick: [70], loop: 70, cycle: 115 },
    { kick: [60, 25, 60], loop: 90, cycle: 50 },
    { kick: [60, 20, 60, 20, 60], loop: [55, 25, 55, 25, 90], cycle: 125 }
  ];

  let vibeLevel = 2;
  try {
    const saved = parseInt(localStorage.getItem("nuqta.vibepower") || "2", 10);
    if (saved >= 0 && saved <= 2) vibeLevel = saved;
  } catch (e) {}

  function buzzOn() {
    if (!hasVibrate || buzzLoop) return;
    const mode = VIBE_MODES[vibeLevel];
    try { navigator.vibrate(mode.kick); } catch (e) {}
    buzzLoop = setInterval(() => {
      try { navigator.vibrate(mode.loop); } catch (e) {}
    }, mode.cycle);
  }

  function buzzOff() {
    if (buzzLoop) { clearInterval(buzzLoop); buzzLoop = null; }
    if (hasVibrate) { try { navigator.vibrate(0); } catch (e) {} }
  }

  function setVibeLevel(level) {
    vibeLevel = level;
    try { localStorage.setItem("nuqta.vibepower", String(level)); } catch (e) {}
    for (const b of document.querySelectorAll(".vbtn")) {
      b.classList.toggle("active", Number(b.dataset.p) === level);
    }
    const wasOn = !!buzzLoop;
    buzzOff();
    if (wasOn) buzzOn();
  }

  for (const b of document.querySelectorAll(".vbtn")) {
    b.addEventListener("click", () => { audio.ensure(); setVibeLevel(Number(b.dataset.p)); });
  }
  setVibeLevel(vibeLevel);

  function buzzPattern(p) {
    if (!hasVibrate) return;
    try { navigator.vibrate(p); } catch (e) {}
  }

  function buildTouchCell(dots, small) {
    const cell = document.createElement("div");
    cell.className = "tcell" + (small ? " small" : "");
    for (const d of [1, 4, 2, 5, 3, 6]) {
      const dot = document.createElement("span");
      dot.className = "t-dot";
      dot.dataset.dot = String(d);
      dot.dataset.raised = dots.includes(d) ? "1" : "0";
      cell.appendChild(dot);
    }
    return cell;
  }

  function makeSenseArea(area) {
    let active = null;
    function probe(x, y) {
      const el = document.elementFromPoint(x, y);
      const dot = el && el.closest ? el.closest(".t-dot") : null;
      if (dot === active) return;
      active = dot;
      buzzOff();
      if (!dot) return;
      if (dot.dataset.raised === "1") {
        buzzOn();
        if (soundOn) audio.hit(Number(dot.dataset.dot));
        const host = dot.closest(".tcell");
        if (host) {
          host.classList.remove("pulse");
          void host.offsetWidth;
          host.classList.add("pulse");
        }
      }
    }
    area.addEventListener("pointerdown", e => {
      audio.ensure();
      active = null;
      probe(e.clientX, e.clientY);
      e.preventDefault();
    });
    area.addEventListener("pointermove", e => {
      if (e.pointerType === "mouse" && !(e.buttons & 1)) return;
      probe(e.clientX, e.clientY);
    });
    area.addEventListener("pointerup", () => { active = null; buzzOff(); });
    area.addEventListener("pointercancel", () => { active = null; buzzOff(); });
    area.addEventListener("pointerleave", () => { active = null; buzzOff(); });

    area.addEventListener("touchstart", e => {
      audio.ensure();
      active = null;
      const t = e.touches[0];
      if (t) probe(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    area.addEventListener("touchmove", e => {
      const t = e.touches[0];
      if (t) probe(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    area.addEventListener("touchend", () => { active = null; buzzOff(); });
    area.addEventListener("touchcancel", () => { active = null; buzzOff(); });
    area.addEventListener("contextmenu", e => e.preventDefault());
  }

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function randomLetter() {
    return BRAILLE_LETTERS[Math.floor(Math.random() * BRAILLE_LETTERS.length)];
  }

  function randomOthers(exclude, n) {
    return shuffled(BRAILLE_LETTERS.filter(l => l !== exclude)).slice(0, n);
  }

  function celebrate(correct) {
    if (correct) { audio.ok(); buzzPattern([120, 60, 120]); }
    else { audio.bad(); buzzPattern(260); }
  }

  function buildReveal(letter) {
    const row = document.createElement("div");
    row.className = "reveal-row";
    row.appendChild(makeCell(letter.dots, "reveal"));
    const txt = document.createElement("span");
    txt.textContent = "حرف " + letter.name + " — النقاط " + letter.dots.join("، ");
    row.appendChild(txt);
    return row;
  }

  let countTarget = null;

  function newCount() {
    countTarget = randomLetter();
    const host = $("tcellCount");
    host.innerHTML = "";
    const cell = buildTouchCell(countTarget.dots);
    host.appendChild(cell);
    makeSenseArea(cell);
    const opts = $("countOptions");
    opts.innerHTML = "";
    for (let n = 1; n <= 6; n++) {
      const b = document.createElement("button");
      b.className = "opt num";
      b.textContent = String(n);
      b.addEventListener("click", () => answerCount(n));
      opts.appendChild(b);
    }
    const fb = $("countFeedback");
    fb.textContent = "";
    fb.className = "quiz-feedback";
  }

  function answerCount(n) {
    const correct = n === countTarget.dots.length;
    celebrate(correct);
    const fb = $("countFeedback");
    fb.className = "quiz-feedback " + (correct ? "ok" : "bad");
    fb.innerHTML = "";
    const row = buildReveal(countTarget);
    row.insertBefore(document.createTextNode(correct
      ? "صح! النقط " + countTarget.dots.length + " — "
      : "النقط " + countTarget.dots.length + " — "), row.firstChild);
    fb.appendChild(row);
    for (const b of $("countOptions").children) b.disabled = true;
  }

  $("countNext").addEventListener("click", newCount);

  let letterTarget = null;

  function newLetterRound() {
    letterTarget = randomLetter();
    const host = $("tcellLetter");
    host.innerHTML = "";
    const cell = buildTouchCell(letterTarget.dots);
    host.appendChild(cell);
    makeSenseArea(cell);
    const opts = $("letterOptions");
    opts.innerHTML = "";
    for (const opt of shuffled([letterTarget, ...randomOthers(letterTarget, 3)])) {
      const b = document.createElement("button");
      b.className = "opt";
      b.textContent = opt.ar;
      b.addEventListener("click", () => answerLetter(opt));
      opts.appendChild(b);
    }
    const fb = $("letterFeedback");
    fb.textContent = "";
    fb.className = "quiz-feedback";
  }

  function answerLetter(opt) {
    const correct = opt === letterTarget;
    celebrate(correct);
    const fb = $("letterFeedback");
    fb.className = "quiz-feedback " + (correct ? "ok" : "bad");
    fb.innerHTML = "";
    fb.appendChild(buildReveal(letterTarget));
    for (const b of $("letterOptions").children) b.disabled = true;
  }

  $("letterNext").addEventListener("click", newLetterRound);

  const WORDS = ["باب", "سمك", "ورد", "فيل", "قمر", "نجم", "موز", "كتاب", "لبن", "برد"];
  let wordTarget = null;

  function newWordRound() {
    wordTarget = WORDS[Math.floor(Math.random() * WORDS.length)];
    const host = $("twordCells");
    host.innerHTML = "";
    for (const ch of wordTarget) {
      const l = letterByAr(ch);
      if (l) host.appendChild(buildTouchCell(l.dots, true));
    }
    makeSenseArea(host);
    const opts = $("wordOptions");
    opts.innerHTML = "";
    for (const w of shuffled([wordTarget, ...shuffled(WORDS.filter(w => w !== wordTarget)).slice(0, 2)])) {
      const b = document.createElement("button");
      b.className = "opt word";
      b.textContent = w;
      b.addEventListener("click", () => answerWord(w));
      opts.appendChild(b);
    }
    const fb = $("wordFeedback");
    fb.textContent = "";
    fb.className = "quiz-feedback";
  }

  function answerWord(w) {
    const correct = w === wordTarget;
    celebrate(correct);
    const fb = $("wordFeedback");
    fb.className = "quiz-feedback " + (correct ? "ok" : "bad");
    fb.textContent = correct
      ? "برافو! الكلمة «" + wordTarget + "»"
      : "الكلمة كانت «" + wordTarget + "»";
    for (const b of $("wordOptions").children) b.disabled = true;
  }

  $("wordNext").addEventListener("click", newWordRound);

  const tabs = document.querySelectorAll(".tabs .tab");
  const levels = { count: $("countLevel"), letter: $("letterLevel"), word: $("wordLevel") };
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const t of tabs) {
        const on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", String(on));
      }
      for (const key in levels) levels[key].classList.toggle("active", key === tab.dataset.level);
    });
  }

  newCount();
  newLetterRound();
  newWordRound();
})();
