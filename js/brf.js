(function (global) {
  const DOTS_TO_ASCII = [
    " ", "A", "1", "B", "'", "K", "2", "L", "@", "C", "I", "F", "/", "M", "S", "P",
    "\"", "E", "3", "H", "9", "O", "6", "R", "^", "D", "J", "G", ">", "N", "T", "Q",
    ",", "*", "5", "<", "-", "U", "8", "V", ".", "%", "[", "$", "+", "X", "!", "&",
    ";", ":", "4", "\\", "0", "Z", "7", "(", "_", "?", "W", "]", "#", "Y", ")", "="
  ];

  function cellMask(dots) {
    let m = 0;
    for (const d of dots) m |= 1 << (d - 1);
    return m;
  }

  function cellsToAscii(cells) {
    let out = "";
    for (const c of cells) out += DOTS_TO_ASCII[cellMask(c)];
    return out;
  }

  function cellsToUnicode(cells) {
    let out = "";
    for (const c of cells) out += String.fromCodePoint(0x2800 + cellMask(c));
    return out;
  }

  function wrapCells(cells, width) {
    const lines = [];
    let line = [];
    let word = [];

    function flushWord() {
      if (!word.length) return;
      while (word.length > width) {
        lines.push(word.slice(0, width));
        word = word.slice(width);
      }
      if (!line.length) {
        line = word.slice();
      } else if (line.length + 1 + word.length <= width) {
        line.push([]);
        for (const c of word) line.push(c);
      } else {
        lines.push(line);
        line = word.slice();
      }
      word = [];
    }

    for (const c of cells) {
      if (c.length === 0) { flushWord(); continue; }
      word.push(c);
    }
    flushWord();
    if (line.length) lines.push(line);
    return lines;
  }

  function paragraphLines(text, width) {
    return wrapCells(textToBrailleCells(text), width);
  }

  function buildBRF(book, width, pageHeight) {
    const w = width || 40;
    const ph = pageHeight || 25;
    const allLines = [];

    for (const l of paragraphLines(book.title || "", w)) allLines.push(l);
    if (book.author) for (const l of paragraphLines(book.author, w)) allLines.push(l);
    allLines.push([]);

    const paras = (book.text || "").replace(/\r/g, "")
      .split(/\n+/).map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < paras.length; i++) {
      if (i > 0) allLines.push([]);
      for (const l of paragraphLines(paras[i], w)) allLines.push(l);
    }

    let ascii = "";
    let unicode = "";
    let lineOnPage = 0;
    for (const line of allLines) {
      ascii += cellsToAscii(line) + "\r\n";
      unicode += cellsToUnicode(line) + "\n";
      lineOnPage++;
      if (lineOnPage === ph) {
        ascii += "\f";
        unicode += "\f";
        lineOnPage = 0;
      }
    }

    return { ascii, unicode, width: w, pageHeight: ph, lineCount: allLines.length };
  }

  function safeFileName(name) {
    const cleaned = (name || "كتاب").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();
    return cleaned.slice(0, 60) || "كتاب";
  }

  const BRFModule = {
    DOTS_TO_ASCII, cellMask, cellsToAscii, cellsToUnicode,
    wrapCells, paragraphLines, buildBRF, safeFileName
  };

  if (typeof module !== "undefined") module.exports = BRFModule;
  global.BRF = BRFModule;
})(typeof window !== "undefined" ? window : globalThis);
