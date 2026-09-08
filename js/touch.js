(function () {
  const $ = id => document.getElementById(id);

  let soundOn = true;
  const soundToggle = $("soundToggle");
  soundToggle.addEventListener("change", () => { soundOn = soundToggle.checked; });

  const hasVibrate = "vibrate" in navigator;
  $("capLine").textContent = hasVibrate
    ? "جهازك يدعم الاهتزاز: هتحس بكل نقطة عند لمسها."
    : "متصفحك ما يدعمش الاهتزاز (زي سفاري على آيفون) — سيب الصوت شغّال: كل نقطة تصفّرة.";

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
    hit() { this.tone(950, 0.1, "sine", 0.22); },
    ok() { this.tone(660, 0.12); setTimeout(() => this.tone(990, 0.18), 110); },
    bad() { this.tone(150, 0.28, "square", 0.12); }
  };

  function buzz(pattern) {
    if (hasVibrate) navigator.vibrate(pattern);
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
      if (!dot) return;
      if (dot.dataset.raised === "1") {
        buzz(40);
        if (soundOn) audio.hit();
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
    area.addEventListener("pointerup", () => { active = null; });
    area.addEventListener("pointerleave", () => { active = null; });
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
    if (correct) { audio.ok(); buzz([70, 40, 70]); }
    else { audio.bad(); buzz(220); }
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
