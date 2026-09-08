(function () {
  const words = ["برايل", "نور", "كتاب", "صوت"];
  let i = 0;
  const host = document.getElementById("demoWord");

  function show() {
    const word = words[i];
    i = (i + 1) % words.length;
    host.innerHTML = "";
    [...word].forEach((ch, k) => {
      const l = letterByAr(ch);
      if (!l) return;
      const cell = makeCell(l.dots, "demo");
      cell.style.animationDelay = (k * 0.15) + "s";
      host.appendChild(cell);
    });
  }

  show();
  setInterval(show, 3600);
})();
