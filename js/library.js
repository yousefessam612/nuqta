(function () {
  const $ = id => document.getElementById(id);
  const KEY = "nuqta.books";

  const SAMPLE = {
    title: "ما هو برايل؟",
    author: "فريق نُقطة",
    text: "برايل ليس لغة خاصة بالمكفوفين، بل هو كتابة اللغات نفسها بحروف بارزة تُقرأ بالإصبع.\nاخترع الفرنسي لويس برايل نظامه في القرن التاسع عشر، وهو صبي فقد بصره في سن مبكرة، فاعتمد على خلية من ست نقاط مرتبة في عمودين وثلاثة صفوف.\nالخلية الواحدة تعطي أربعة وستين تركيبة ممكنة، تكفي لتغطية حروف اللغة العربية وأرقامها وعلاماتها.\nبرايل العربي يُقرأ من الشمال إلى اليمين مثل الأرقام، لأن اللمس يتتبع النقاط في اتجاه واحد متفق عليه عالميًا.\nتعلّم برايل يفتح أمام الكفيف باب القراءة المستقلة: كتب، وملاحظات، ولوحات، وحتى ملصقات على العلب في المطبخ."
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }

  function save(books) {
    try { localStorage.setItem(KEY, JSON.stringify(books)); return true; }
    catch (e) { alert("مساحة التخزين ممتلئة — امسح كتب قديمة أولًا."); return false; }
  }

  let books = load();
  let q = "";

  const shelf = $("shelf");

  function snippet(t) {
    const s = t.replace(/\s+/g, " ").trim();
    return s.length > 90 ? s.slice(0, 90) + "…" : s;
  }

  function paraCount(t) {
    return t.split(/\n+/).map(s => s.trim()).filter(Boolean).length;
  }

  function render() {
    shelf.innerHTML = "";
    const filtered = books.filter(b => {
      if (!q) return true;
      return (b.title || "").includes(q) || (b.author || "").includes(q);
    });

    $("empty").hidden = filtered.length > 0;
    $("countBooks").textContent = String(books.length);

    for (const b of filtered) {
      const card = document.createElement("div");
      card.className = "book-card";

      const link = document.createElement("a");
      link.className = "book-link";
      link.href = "read.html#" + encodeURIComponent(b.id);

      const title = document.createElement("span");
      title.className = "book-title";
      title.textContent = b.title;
      link.appendChild(title);

      if (b.author) {
        const author = document.createElement("span");
        author.className = "book-author";
        author.textContent = "تأليف: " + b.author;
        link.appendChild(author);
      }

      const sn = document.createElement("span");
      sn.className = "book-snippet";
      sn.textContent = snippet(b.text);
      link.appendChild(sn);

      const meta = document.createElement("span");
      meta.className = "book-meta";
      meta.textContent = paraCount(b.text) + " فقرة · " + new Date(b.createdAt).toLocaleDateString("ar-EG");
      link.appendChild(meta);

      card.appendChild(link);

      const del = document.createElement("button");
      del.className = "book-del";
      del.textContent = "×";
      del.setAttribute("aria-label", "احذف كتاب " + b.title);
      del.addEventListener("click", () => {
        if (!confirm("تحذير: سيُحذف «" + b.title + "» نهائيًا من جهازك.")) return;
        books = books.filter(x => x.id !== b.id);
        save(books);
        render();
      });
      card.appendChild(del);

      shelf.appendChild(card);
    }
  }

  $("addBtn").addEventListener("click", () => {
    const p = $("addPanel");
    p.hidden = !p.hidden;
    if (!p.hidden) $("fTitle").focus();
  });

  $("cancelAdd").addEventListener("click", () => {
    $("addPanel").hidden = true;
  });

  $("addForm").addEventListener("submit", e => {
    e.preventDefault();
    const title = $("fTitle").value.trim();
    const author = $("fAuthor").value.trim();
    const text = $("fText").value.trim();
    if (!title || !text) { alert("العنوان والنص مطلوبين."); return; }
    books.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title, author, text,
      createdAt: Date.now()
    });
    if (!save(books)) { books.pop(); return; }
    $("addForm").reset();
    $("fileName").textContent = "";
    $("addPanel").hidden = true;
    render();
  });

  $("fileInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    $("fileName").textContent = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      $("fText").value = String(reader.result || "");
      if (!$("fTitle").value.trim()) {
        $("fTitle").value = file.name.replace(/\.txt$/i, "");
      }
    };
    reader.onerror = () => alert("تعذّر قراءة الملف.");
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  });

  $("sampleBtn").addEventListener("click", () => {
    books.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: SAMPLE.title,
      author: SAMPLE.author,
      text: SAMPLE.text,
      createdAt: Date.now()
    });
    if (!save(books)) { books.pop(); return; }
    render();
  });

  $("searchInput").addEventListener("input", e => {
    q = e.target.value.trim();
    render();
  });

  render();
})();
