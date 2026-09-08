(function () {
  const $ = id => document.getElementById(id);

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

  function speakText(text) {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-EG";
    const arVoice = synth.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith("ar"));
    if (arVoice) u.voice = arVoice;
    synth.cancel();
    synth.speak(u);
  }

  const tabs = document.querySelectorAll(".tabs .tab");
  const modes = { learn: $("learn"), quiz: $("quiz"), write: $("write") };

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const t of tabs) {
        const on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", String(on));
      }
      for (const key in modes) modes[key].classList.toggle("active", key === tab.dataset.mode);
    });
  }

  const initialMode = { "#quiz": "quiz", "#write": "write" }[location.hash];
  if (initialMode) {
    const t = document.querySelector('.tab[data-mode="' + initialMode + '"]');
    if (t) t.click();
  }

  let idx = 0;
  let learned = [];
  try { learned = JSON.parse(localStorage.getItem("nuqta.learned") || "[]"); } catch (e) { learned = []; }

  function saveLearned() {
    try { localStorage.setItem("nuqta.learned", JSON.stringify(learned)); } catch (e) {}
  }

  const letterAr = $("letterAr");
  const letterName = $("letterName");
  const lessonCell = $("lessonCell");
  const dotsLabelEl = $("dotsLabel");
  const exampleWord = $("exampleWord");
  const exampleBraille = $("exampleBraille");
  const progressCount = $("progressCount");
  const markDone = $("markDone");
  const picker = $("letterPicker");

  function updateDoneBtn() {
    const isDone = learned.includes(BRAILLE_LETTERS[idx].ar);
    markDone.textContent = isDone ? "تمّ" : "علّمه كمكتمل";
    markDone.classList.toggle("done", isDone);
  }

  function renderPicker() {
    picker.innerHTML = "";
    BRAILLE_LETTERS.forEach((l, i) => {
      const b = document.createElement("button");
      b.className = "chip" + (i === idx ? " current" : "") + (learned.includes(l.ar) ? " done" : "");
      b.setAttribute("aria-label", "حرف " + l.name);
      const ar = document.createElement("span");
      ar.className = "chip-ar";
      ar.textContent = l.ar;
      const br = document.createElement("span");
      br.className = "chip-br ltr";
      br.textContent = dotsToBraille(l.dots);
      b.appendChild(ar);
      b.appendChild(br);
      b.addEventListener("click", () => { idx = i; renderLetter(); });
      picker.appendChild(b);
    });
  }

  function renderLetter() {
    const l = BRAILLE_LETTERS[idx];
    letterAr.textContent = l.ar;
    letterName.textContent = l.name;
    lessonCell.innerHTML = "";
    lessonCell.appendChild(makeCell(l.dots, "big"));
    dotsLabelEl.textContent = l.dots.join("، ");
    exampleWord.textContent = l.example;
    exampleBraille.innerHTML = "";
    exampleBraille.appendChild(makeWordCells(l.example));
    progressCount.textContent = learned.length;
    updateDoneBtn();
    renderPicker();
  }

  $("prevLetter").addEventListener("click", () => { idx = (idx + BRAILLE_LETTERS.length - 1) % BRAILLE_LETTERS.length; renderLetter(); });
  $("nextLetter").addEventListener("click", () => { idx = (idx + 1) % BRAILLE_LETTERS.length; renderLetter(); });

  markDone.addEventListener("click", () => {
    const ar = BRAILLE_LETTERS[idx].ar;
    const i = learned.indexOf(ar);
    if (i >= 0) learned.splice(i, 1);
    else learned.push(ar);
    saveLearned();
    updateDoneBtn();
    progressCount.textContent = learned.length;
    renderPicker();
  });

  if ("speechSynthesis" in window) {
    $("speakBtn").addEventListener("click", () => {
      const l = BRAILLE_LETTERS[idx];
      speakText("الحرف " + l.name + ". مثال: " + l.example);
    });
  } else {
    $("speakBtn").style.display = "none";
  }

  let quizScore = 0;
  let quizBest = 0;
  try { quizBest = parseInt(localStorage.getItem("nuqta.quizBest") || "0", 10) || 0; } catch (e) {}
  $("quizBest").textContent = quizBest;
  let quizTarget = null;
  let quizLocked = false;

  function newQuiz() {
    quizTarget = randomLetter();
    quizLocked = false;
    const cellHost = $("quizCell");
    cellHost.innerHTML = "";
    cellHost.appendChild(makeCell(quizTarget.dots, "big"));
    const host = $("quizOptions");
    host.innerHTML = "";
    for (const opt of shuffled([quizTarget, ...randomOthers(quizTarget, 3)])) {
      const b = document.createElement("button");
      b.className = "opt";
      b.textContent = opt.ar;
      b.addEventListener("click", () => answerQuiz(opt, b));
      host.appendChild(b);
    }
    const fb = $("quizFeedback");
    fb.textContent = "";
    fb.className = "quiz-feedback";
    $("quizNext").classList.remove("show");
  }

  function answerQuiz(opt) {
    if (quizLocked) return;
    quizLocked = true;
    const fb = $("quizFeedback");
    fb.className = "quiz-feedback";
    if (opt === quizTarget) {
      quizScore++;
      if (quizScore > quizBest) {
        quizBest = quizScore;
        try { localStorage.setItem("nuqta.quizBest", String(quizBest)); } catch (e) {}
      }
      fb.textContent = "صح! " + quizTarget.name + " — النقاط " + quizTarget.dots.join("، ");
      fb.classList.add("ok");
    } else {
      quizScore = 0;
      fb.textContent = "غلط. ده حرف " + quizTarget.name + " (" + quizTarget.ar + ") — النقاط " + quizTarget.dots.join("، ");
      fb.classList.add("bad");
    }
    $("quizScore").textContent = quizScore;
    $("quizBest").textContent = quizBest;
    for (const b of $("quizOptions").children) {
      b.disabled = true;
      if (b.textContent === quizTarget.ar) b.classList.add("correct");
    }
    $("quizNext").classList.add("show");
  }

  $("quizNext").addEventListener("click", newQuiz);

  let writeTarget = null;

  function newWrite() {
    writeTarget = randomLetter();
    $("writeLetter").textContent = writeTarget.ar;
    const host = $("writeCell");
    host.innerHTML = "";
    host.appendChild(makeCell([], "big interactive write"));
    for (const dot of host.querySelectorAll(".dot")) {
      dot.addEventListener("click", () => {
        dot.classList.toggle("on");
        dot.classList.toggle("off");
      });
    }
    const fb = $("writeFeedback");
    fb.textContent = "";
    fb.className = "quiz-feedback";
  }

  $("writeCheck").addEventListener("click", () => {
    const on = [...$("writeCell").querySelectorAll(".dot.on")]
      .map(d => Number(d.dataset.dot)).sort((a, b) => a - b);
    const target = writeTarget.dots.slice().sort((a, b) => a - b);
    const same = on.length === target.length && on.every((v, i) => v === target[i]);
    const fb = $("writeFeedback");
    fb.className = "quiz-feedback";
    if (same) {
      fb.textContent = "ممتاز! النقط صح.";
      fb.classList.add("ok");
    } else {
      fb.textContent = "نقرت على النقط " + on.join("، ") + " — حرف " + writeTarget.name + " نقاطه " + writeTarget.dots.join("، ") +
        ". افتكر: النقاط ١، ٢، ٣ في العمود الشمال و٤، ٥، ٦ في اليمين.";
      fb.classList.add("bad");
    }
  });

  $("writeNext").addEventListener("click", newWrite);

  renderLetter();
  newQuiz();
  newWrite();
})();
