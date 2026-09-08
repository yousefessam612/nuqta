const BRAILLE_LETTERS = [
  { ar: "ا", name: "أَلِف", dots: [1], example: "اسم" },
  { ar: "ب", name: "بَاء", dots: [1, 2], example: "باب" },
  { ar: "ت", name: "تَاء", dots: [2, 3, 4, 5], example: "تفاح" },
  { ar: "ث", name: "ثَاء", dots: [1, 4, 5, 6], example: "ثعلب" },
  { ar: "ج", name: "جِيم", dots: [2, 4, 5], example: "جمل" },
  { ar: "ح", name: "حَاء", dots: [1, 5, 6], example: "حوت" },
  { ar: "خ", name: "خَاء", dots: [1, 3, 4, 6], example: "خبز" },
  { ar: "د", name: "دَال", dots: [1, 4, 5], example: "دجاج" },
  { ar: "ذ", name: "ذَال", dots: [2, 3, 4, 6], example: "ذهب" },
  { ar: "ر", name: "رَاء", dots: [1, 2, 3, 5], example: "رمان" },
  { ar: "ز", name: "زَاي", dots: [1, 3, 5, 6], example: "زيت" },
  { ar: "س", name: "سِين", dots: [2, 3, 4], example: "سمك" },
  { ar: "ش", name: "شِين", dots: [1, 4, 6], example: "شمس" },
  { ar: "ص", name: "صَاد", dots: [1, 2, 3, 4, 6], example: "صقر" },
  { ar: "ض", name: "ضَاد", dots: [1, 2, 4, 6], example: "ضفدع" },
  { ar: "ط", name: "طَاء", dots: [2, 3, 4, 5, 6], example: "طبل" },
  { ar: "ظ", name: "ظَاء", dots: [1, 2, 3, 4, 5, 6], example: "ظرف" },
  { ar: "ع", name: "عَيْن", dots: [1, 2, 3, 5, 6], example: "عنب" },
  { ar: "غ", name: "غَيْن", dots: [1, 2, 6], example: "غزال" },
  { ar: "ف", name: "فَاء", dots: [1, 2, 4], example: "فيل" },
  { ar: "ق", name: "قَاف", dots: [1, 2, 3, 4, 5], example: "قمر" },
  { ar: "ك", name: "كَاف", dots: [1, 3], example: "كتاب" },
  { ar: "ل", name: "لَام", dots: [1, 2, 3], example: "ليمون" },
  { ar: "م", name: "مِيم", dots: [1, 3, 4], example: "موز" },
  { ar: "ن", name: "نُون", dots: [1, 3, 4, 5], example: "نجم" },
  { ar: "ه", name: "هَاء", dots: [1, 2, 5], example: "هلال" },
  { ar: "و", name: "وَاو", dots: [2, 4, 5, 6], example: "ورد" },
  { ar: "ي", name: "يَاء", dots: [2, 4], example: "يد" }
];

// ===== فصل التمثيل المنطقي عن الإحداثيات البصرية =====
// الأرقام المنطقية للنقط (1..6) ثابتة دائمًا: هي المستخدمة في بيانات الحروف
// وفي التحقق من الإجابات — لا تتغير مع تغيير وضع العرض.
// الترتيب أدناه هو ترتيب أبناء الخلية في شبكة العمودين (row-major):
// أول عنصرين = الصف الأول (العمود الأول ثم الثاني)، وهكذا.
// كل عنصر يحمل رقمه المنطقي في dataset.dot.

// وضع القراءة (الدرس، اختبار القراءة، حسّ النقط):
//   صف 1:  1  4
//   صف 2:  2  5
//   صف 3:  3  6
const DOT_GRID_ORDER = [1, 4, 2, 5, 3, 6];

// وضع الكتابة (محاكاة الكتابة على اللوح من الخلف — الخلية معكوسة أفقيًا):
//   صف 1:  4  1
//   صف 2:  5  2
//   صف 3:  6  3
// الموضع البصري يمين-أعلى => النقطة 1، والموضع شمال-أعلى => النقطة 4.
// أرقام النقط نفسها لا تتغير — يتغير موقع عرضها فقط.
const DOT_GRID_ORDER_WRITE = [4, 1, 5, 2, 6, 3];

function makeCell(dots, extraClass, mirrored) {
  const cell = document.createElement("div");
  cell.className = "bcell" + (extraClass ? " " + extraClass : "");
  const order = mirrored ? DOT_GRID_ORDER_WRITE : DOT_GRID_ORDER;
  for (const d of order) {
    const dot = document.createElement("span");
    dot.className = "dot " + (dots.includes(d) ? "on" : "off");
    dot.dataset.dot = String(d);
    cell.appendChild(dot);
  }
  return cell;
}

function dotsToBraille(dots) {
  let code = 0;
  for (const d of dots) code |= 1 << (d - 1);
  return String.fromCodePoint(0x2800 + code);
}

function letterByAr(ar) {
  return BRAILLE_LETTERS.find(l => l.ar === ar);
}

function brailleWord(word) {
  let out = "";
  for (const ch of word) {
    const l = letterByAr(ch);
    if (l) out += dotsToBraille(l.dots);
    else if (ch === " ") out += "\u2800";
  }
  return out;
}

function makeWordCells(word) {
  const wrap = document.createElement("span");
  wrap.className = "bword ltr";
  for (const ch of word) {
    if (ch === " ") wrap.appendChild(makeCell([], "small space"));
    else {
      const l = letterByAr(ch);
      if (l) wrap.appendChild(makeCell(l.dots, "small"));
    }
  }
  return wrap;
}

const BRAILLE_EXTRA = {
  "لا": [1, 2, 3, 6],
  "ى": [1, 3, 5],
  "ة": [1, 6],
  "ء": [3],
  "أ": [3, 4],
  "إ": [4, 6],
  "ؤ": [1, 2, 5, 6],
  "ئ": [1, 3, 4, 5, 6],
  "آ": [3, 4, 5]
};

const BRAILLE_DIGITS = {
  "1": [1], "2": [1, 2], "3": [1, 4], "4": [1, 4, 5], "5": [1, 5],
  "6": [1, 2, 4], "7": [1, 2, 4, 5], "8": [1, 2, 5], "9": [2, 4], "0": [2, 4, 5],
  "١": [1], "٢": [1, 2], "٣": [1, 4], "٤": [1, 4, 5], "٥": [1, 5],
  "٦": [1, 2, 4], "٧": [1, 2, 4, 5], "٨": [1, 2, 5], "٩": [2, 4], "٠": [2, 4, 5]
};

const NUMBER_SIGN = [3, 4, 5, 6];

const BRAILLE_PUNCT = {
  "،": [[2]],
  ",": [[2]],
  ".": [[2, 5, 6]],
  "؛": [[2, 3], [5]]
};

function textToBrailleCells(text) {
  const out = [];
  const t = text.replace(/[\u064B-\u0652\u0670\u0640]/g, "");
  const chars = [...t];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === " " || ch === "\n" || ch === "\t") { out.push([]); continue; }
    if (ch === "ل" && chars[i + 1] === "ا") { out.push([1, 2, 3, 6]); i++; continue; }
    const letter = letterByAr(ch);
    if (letter) { out.push(letter.dots); continue; }
    const extra = BRAILLE_EXTRA[ch];
    if (extra) { out.push(extra); continue; }
    if (Object.prototype.hasOwnProperty.call(BRAILLE_DIGITS, ch)) {
      const prev = chars[i - 1];
      if (!(prev && Object.prototype.hasOwnProperty.call(BRAILLE_DIGITS, prev))) out.push(NUMBER_SIGN);
      out.push(BRAILLE_DIGITS[ch]);
      continue;
    }
    const p = BRAILLE_PUNCT[ch];
    if (p) { for (const cell of p) out.push(cell); continue; }
  }
  return out;
}

function renderTextToBraille(host, text) {
  host.innerHTML = "";
  const cells = textToBrailleCells(text);
  const frag = document.createDocumentFragment();
  for (const c of cells) frag.appendChild(makeCell(c, "small"));
  host.appendChild(frag);
}

if (typeof module !== "undefined") {
  module.exports = { BRAILLE_LETTERS, BRAILLE_EXTRA, BRAILLE_DIGITS, BRAILLE_PUNCT, NUMBER_SIGN, DOT_GRID_ORDER, DOT_GRID_ORDER_WRITE, dotsToBraille, brailleWord, letterByAr, textToBrailleCells };
}
