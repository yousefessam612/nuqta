(function () {
  const $ = id => document.getElementById(id);
  const KEY = "nuqta.books";

  const hasTTS = "speechSynthesis" in window;

  let book = null;
  let paras = [];
  let cur = -1;
  let playing = false;
  let paused = false;
  let speed = 1;
  let fontRatio = 1.25;

  function loadBooks() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }

  function bookId() {
    return decodeURIComponent(location.hash.slice(1));
  }

  function init() {
    const id = bookId();
    book = loadBooks().find(b => b.id === id);
    const missing = $("missing");
    const ui = $("readerUI");
    if (!book) {
      missing.hidden = false;
      ui.hidden = true;
      return;
    }
    missing.hidden = true;
    ui.hidden = false;

    $("bookTitle").textContent = book.title;
    $("bookAuthor").textContent = book.author ? "تأليف: " + book.author : "";
    $("ttsNote").hidden = hasTTS;

    paras = book.text.replace(/\r/g, "").split(/\n+/).map(s => s.trim()).filter(Boolean);
    const body = $("readerBody");
    body.innerHTML = "";
    paras.forEach((p, i) => {
      const el = document.createElement("p");
      el.className = "para";
      el.tabIndex = 0;
      el.textContent = p;
      el.addEventListener("click", () => {
        if (playing) playFrom(i);
        else setCur(i, true);
      });
      body.appendChild(el);
    });

    cur = -1;
    playing = false;
    paused = false;
    if (hasTTS) speechSynthesis.cancel();
    updatePlayBtn();

    let saved = null;
    try { saved = parseInt(localStorage.getItem("nuqta.pos." + id) || "", 10); } catch (e) {}
    if (!isNaN(saved) && saved >= 0 && saved < paras.length) setCur(saved, true);
    else updateBraillePanel();
  }

  function setCur(i, scroll) {
    const body = $("readerBody");
    const kids = body.querySelectorAll(".para");
    kids.forEach(el => el.classList.remove("reading"));
    cur = i;
    if (i >= 0 && i < kids.length) {
      const el = kids[i];
      el.classList.add("reading");
      if (scroll) el.scrollIntoView({ block: "center", behavior: "smooth" });
      try { localStorage.setItem("nuqta.pos." + book.id, String(i)); } catch (e) {}
    }
    updateBraillePanel();
  }

  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    return voices.find(v => v.lang && v.lang.toLowerCase().startsWith("ar")) || null;
  }

  if (hasTTS) {
    speechSynthesis.addEventListener("voiceschanged", () => {});
  }

  function speakPara(i) {
    const u = new SpeechSynthesisUtterance(paras[i]);
    u.lang = "ar-EG";
    u.rate = speed;
    const v = pickVoice();
    if (v) u.voice = v;
    u.onend = () => { if (playing && cur === i) next(); };
    u.onerror = () => {};
    speechSynthesis.speak(u);
  }

  function playFrom(i) {
    if (!book || !hasTTS) return;
    if (i < 0 || i >= paras.length) { stopAll(); return; }
    playing = true;
    paused = false;
    speechSynthesis.cancel();
    setCur(i, true);
    speakPara(i);
    updatePlayBtn();
  }

  function next() { playFrom(cur + 1); }

  function stopAll() {
    playing = false;
    paused = false;
    if (hasTTS) speechSynthesis.cancel();
    updatePlayBtn();
  }

  function togglePlay() {
    if (!playing) { playFrom(cur >= 0 ? cur : 0); return; }
    if (paused) {
      speechSynthesis.resume();
      paused = false;
    } else {
      speechSynthesis.pause();
      paused = true;
    }
    updatePlayBtn();
  }

  function updatePlayBtn() {
    const b = $("playBtn");
    if (!hasTTS) { b.disabled = true; return; }
    if (!playing) b.textContent = "شغّل الصوت";
    else b.textContent = paused ? "كمّل" : "إيقاف مؤقت";
  }

  function goTo(i) {
    const n = Math.min(paras.length - 1, Math.max(0, i));
    if (playing) playFrom(n);
    else setCur(n, true);
  }

  function updateBraillePanel() {
    const panel = $("braillePanel");
    if (!book || panel.hidden) return;
    const i = cur >= 0 ? cur : 0;
    if (!paras[i]) return;
    $("brailleLabel").textContent = "ترجمة الفقرة " + (i + 1) + " من " + paras.length;
    renderTextToBraille($("brailleCells"), paras[i]);
  }

  $("playBtn").addEventListener("click", togglePlay);
  $("stopBtn").addEventListener("click", stopAll);
  $("prevPara").addEventListener("click", () => goTo(cur - 1));
  $("nextPara").addEventListener("click", () => goTo(cur + 1));

  $("speedSel").addEventListener("change", e => {
    speed = parseFloat(e.target.value) || 1;
    if (playing && !paused) playFrom(cur);
  });

  function applyFont() {
    $("readerBody").style.fontSize = fontRatio + "rem";
  }

  $("fontMinus").addEventListener("click", () => {
    fontRatio = Math.max(0.9, fontRatio - 0.15);
    applyFont();
  });
  $("fontPlus").addEventListener("click", () => {
    fontRatio = Math.min(2.4, fontRatio + 0.15);
    applyFont();
  });

  $("contrastBtn").addEventListener("click", () => {
    document.body.classList.toggle("reader-light");
  });

  $("brailleBtn").addEventListener("click", () => {
    const panel = $("braillePanel");
    panel.hidden = !panel.hidden;
    if (!panel.hidden) updateBraillePanel();
  });

  function downloadBook(kind) {
    if (!book) return;
    const width = parseInt($("widthSel").value, 10) || 40;
    const out = BRF.buildBRF(book, width, 25);
    const isBrf = kind === "brf";
    const content = isBrf ? out.ascii : "\ufeff" + out.unicode;
    const blob = new Blob([content], {
      type: isBrf ? "application/octet-stream" : "text/plain;charset=utf-8"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = BRF.safeFileName(book.title) + (isBrf ? ".brf" : "-برايل.txt");
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  $("brfBtn").addEventListener("click", () => downloadBook("brf"));
  $("uniBtn").addEventListener("click", () => downloadBook("unicode"));

  document.addEventListener("keydown", e => {
    if (e.code !== "Space") return;
    if (e.target.closest("button, input, textarea, select, a")) return;
    if (!book || !hasTTS) return;
    e.preventDefault();
    togglePlay();
  });

  window.addEventListener("hashchange", () => {
    if (hasTTS) speechSynthesis.cancel();
    init();
  });

  init();
})();
