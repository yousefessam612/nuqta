(function () {
  "use strict";

  function fmt(n) {
    n = Number(n);
    if (isNaN(n)) return "";
    try { return n.toLocaleString("en-US"); } catch (e) { return String(n); }
  }

  function init() {
    var badge = document.querySelector(".visitor-badge");
    if (!badge) return;
    var numEl = badge.querySelector(".vc-num");
    if (!numEl) return;

    fetch("https://count.getloli.com/record/@nuqta-braille", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) {
        var n = d && Number(d.num);
        if (isNaN(n) || n < 0) throw new Error("bad data");
        numEl.textContent = fmt(n);
      })
      .catch(function () { badge.style.display = "none"; });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
