// اختبارات آلية للفصل بين النقط المنطقية والإحداثيات البصرية.
// التشغيل: node tests/test-dot-mapping.js
// مفيش DOM هنا — بيتم محاكاة شبكة الخلية حسابيًا: ترتيب الأبناء في الشبكة
// (row-major) هو نفسه الـmapping المستخدم في makeCell، وكل ابن يحمل رقمه
// المنطقي. المحاكاة بتطابق سلوك المتصفح بالظبط لأن الترتيب هو مصدر الحقيقة الوحيد.

const fs = require("fs");
const path = require("path");

const {
  BRAILLE_LETTERS, DOT_GRID_ORDER, DOT_GRID_ORDER_WRITE, letterByAr
} = require(path.join(__dirname, "..", "js", "data.js"));

let fails = 0;
let passes = 0;
function check(name, cond, extra) {
  if (cond) { passes++; }
  else { fails++; console.log("FAIL:", name, extra === undefined ? "" : extra); }
}

// ===== أدوات المحاكاة (تطابق منطق الشبكة في المتصفح) =====

// رقم النقطة المنطقي الواقع عند موضع بصري (صف 1..3، عمود 1=شمال / 2=يمين)
function dotAt(order, row, col) {
  return order[(row - 1) * 2 + (col - 1)];
}

// الموضع البصري [صف، عمود] للنقطة المنطقية
function positionOf(order, dot) {
  const i = order.indexOf(dot);
  return [Math.floor(i / 2) + 1, (i % 2) + 1];
}

// المستخدم نقر على مواضع بصرية => النقط المنطقية المسجلة
function pressVisual(order, positions) {
  return positions.map(([r, c]) => dotAt(order, r, c));
}

// نفس خوارزمية التحقق في learn.js (writeCheck): مقارنة الأرقام المنطقية
function validateAnswer(pressedDots, targetDots) {
  const a = pressedDots.slice().sort((x, y) => x - y);
  const b = targetDots.slice().sort((x, y) => x - y);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// ===== 1) وضع القراءة: المواضع البصرية =====
check("READ: النقطة 1 = أعلى الشمال", dotAt(DOT_GRID_ORDER, 1, 1) === 1);
check("READ: النقطة 2 = أوسط الشمال", dotAt(DOT_GRID_ORDER, 2, 1) === 2);
check("READ: النقطة 3 = أسفل الشمال", dotAt(DOT_GRID_ORDER, 3, 1) === 3);
check("READ: النقطة 4 = أعلى اليمين", dotAt(DOT_GRID_ORDER, 1, 2) === 4);
check("READ: النقطة 5 = أوسط اليمين", dotAt(DOT_GRID_ORDER, 2, 2) === 5);
check("READ: النقطة 6 = أسفل اليمين", dotAt(DOT_GRID_ORDER, 3, 2) === 6);

// ===== 2) وضع الكتابة: المواضع البصرية (المتطلبات 6 إلى 11) =====
check("WRITE: النقطة 1 = أعلى اليمين", dotAt(DOT_GRID_ORDER_WRITE, 1, 2) === 1);
check("WRITE: النقطة 2 = أوسط اليمين", dotAt(DOT_GRID_ORDER_WRITE, 2, 2) === 2);
check("WRITE: النقطة 3 = أسفل اليمين", dotAt(DOT_GRID_ORDER_WRITE, 3, 2) === 3);
check("WRITE: النقطة 4 = أعلى الشمال", dotAt(DOT_GRID_ORDER_WRITE, 1, 1) === 4);
check("WRITE: النقطة 5 = أوسط الشمال", dotAt(DOT_GRID_ORDER_WRITE, 2, 1) === 5);
check("WRITE: النقطة 6 = أسفل الشمال", dotAt(DOT_GRID_ORDER_WRITE, 3, 1) === 6);

// ===== 3) سلامة الـmapping نفسه =====
check("READ ترتيب كامل من 1 إلى 6 بدون تكرار",
  DOT_GRID_ORDER.slice().sort((a, b) => a - b).join() === "1,2,3,4,5,6");
check("WRITE ترتيب كامل من 1 إلى 6 بدون تكرار",
  DOT_GRID_ORDER_WRITE.slice().sort((a, b) => a - b).join() === "1,2,3,4,5,6");
check("WRITE هو انعكاس أفقي لـREAD (تبديل الأعمدة)",
  DOT_GRID_ORDER_WRITE.every((d, i) => DOT_GRID_ORDER[i ^ 1] === d));

// ===== 4) بيانات الحروف المنطقية لم تتغير =====
check("«ب» منطقيًا = [1,2]", letterByAr("ب").dots.join() === "1,2");
check("«ا» منطقيًا = [1]", letterByAr("ا").dots.join() === "1");
check("«ي» منطقيًا = [2,4]", letterByAr("ي").dots.join() === "2,4");
check("«ظ» منطقيًا = [1,2,3,4,5,6]", letterByAr("ظ").dots.join() === "1,2,3,4,5,6");
check("عدد الحروف 28", BRAILLE_LETTERS.length === 28);

// ===== 5) المحاكاة الكاملة: النقر على المواضع الصحيحة في وضع الكتابة =====
// لكل نمط: المستخدم بينقر على المواضع البصرية اللي بتظهر فيها نقط النمط
// في وضع الكتابة => لازم تسجل نفس الأرقام المنطقية، والتحقق ينجح.
const PATTERNS = [
  [1], [1, 2], [1, 3], [2, 3], [1, 2, 3],
  [4], [4, 5], [4, 6], [1, 4], [1, 2, 4, 5], [1, 2, 3, 4, 5, 6]
];

for (const p of PATTERNS) {
  const visualPositions = p.map(d => positionOf(DOT_GRID_ORDER_WRITE, d));
  const recordedLogical = pressVisual(DOT_GRID_ORDER_WRITE, visualPositions);
  check("WRITE: النقر على مواضع «" + p.join(",") + "» يسجّل نفس الأرقام المنطقية",
    recordedLogical.join() === p.join(), "سُجّل: " + recordedLogical.join());
  check("WRITE: التحقق ينجح للنمط «" + p.join(",") + "»",
    validateAnswer(recordedLogical, p) === true);
}

// ===== 6) الالتباس المعكوس: النقر على مواضع القراءة داخل شبكة الكتابة =====
// حرف «ب» = [1,2]: لو المستخدم نقر على مكان 1 و2 في وضع القراءة
// (أعلى الشمال وأوسط الشمال) وهو في وضع الكتابة => لازم يسجّل [4,5] ويفشل.
const readPositionsOf12 = [1, 2].map(d => positionOf(DOT_GRID_ORDER, d));
const wronglyRecorded = pressVisual(DOT_GRID_ORDER_WRITE, readPositionsOf12);
check("النقر على مواضع القراءة لـ[1,2] داخل شبكة الكتابة يسجّل [4,5]",
  wronglyRecorded.join() === "4,5", "سُجّل: " + wronglyRecorded.join());
check("التحقق يفشل للنقر الخاطئ (لا يعتبر 4 و5 إجابة لـ[1,2])",
  validateAnswer(wronglyRecorded, [1, 2]) === false);

// النقطة 1 في وضع الكتابة = أعلى اليمين: النقر على أعلى اليمين يسجّل النقطة 1
check("في وضع الكتابة: أعلى اليمين => النقطة 1",
  pressVisual(DOT_GRID_ORDER_WRITE, [[1, 2]]).join() === "1");
// والنقر على أعلى الشمال يسجّل النقطة 4 (ولا يعتبرها 1)
check("في وضع الكتابة: أعلى الشمال => النقطة 4 (وليس 1)",
  pressVisual(DOT_GRID_ORDER_WRITE, [[1, 1]]).join() === "4");

// ===== 7) فحوص على المصدر: الكود الفعلي ملتزم بالبناء المعماري =====
const base = path.join(__dirname, "..");
const learnSrc = fs.readFileSync(path.join(base, "js", "learn.js"), "utf8");
const dataSrc = fs.readFileSync(path.join(base, "js", "data.js"), "utf8");
const touchSrc = fs.readFileSync(path.join(base, "js", "touch.js"), "utf8");
const cssSrc = fs.readFileSync(path.join(base, "css", "style.css"), "utf8");

check("learn.js: خلية الكتابة تمرر الوضع المعكوس",
  learnSrc.includes('makeCell([], "big interactive write", true)'));
check("learn.js: التحقق يقرأ الأرقام المنطقية من dataset.dot",
  learnSrc.includes("Number(d.dataset.dot)"));
check("learn.js: خلية الدرس بدون عكس (وضع قراءة)",
  learnSrc.includes('makeCell(l.dots, "big")'));
check("learn.js: خلية اختبار القراءة بدون عكس",
  learnSrc.includes('makeCell(quizTarget.dots, "big")'));
check("learn.js: رسالة التصحيح تعرض النقط المنطقية المضغوطة",
  learnSrc.includes("نقرت على النقط المنطقية"));
check("data.js: التحويل البصري داخل makeCell فقط",
  dataSrc.includes("mirrored ? DOT_GRID_ORDER_WRITE : DOT_GRID_ORDER"));
check("touch.js: وضع حسّ النقط محتفظ بترتيب القراءة",
  touchSrc.includes("[1, 4, 2, 5, 3, 6]"));
check("CSS: لا يوجد قلب scaleX",
  !cssSrc.includes("scaleX(-1)"));
check("CSS: لا يوجد direction:rtl على خلية الكتابة",
  !/\.bcell\.write[^}]*direction:\s*rtl/.test(cssSrc));

// ===== النتيجة =====
console.log(fails === 0
  ? "OK: " + passes + " فحصًا نجح كلهم — الفصل المنطقي/البصري سليم في الوضعين، والتحقق على الأرقام المنطقية"
  : fails + " مشكلة (من " + (passes + fails) + " فحصًا)");
process.exit(fails === 0 ? 0 : 1);
