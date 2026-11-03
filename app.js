/* Introduction to Christianity — study companion. Vanilla JS, no deps. */
(function () {
  "use strict";

  /* ── Creed articles (the site's spine) ───────────────────────── */
  const ARTICLES = [
    "I believe in God, the Father almighty, creator of heaven and earth.",
    "and in Jesus Christ, his only Son, our Lord",
    "who was conceived by the power of the Holy Spirit, born of the Virgin Mary",
    "suffered under Pontius Pilate, was crucified, died, and was buried",
    "descended into hell",
    "rose again from the dead",
    "ascended into heaven, is seated at the right hand of the Father",
    "will come again to judge the living and the dead",
    "I believe in the Holy Spirit",
    "the holy catholic Church",
    "the communion of saints, the forgiveness of sins",
    "the resurrection of the body, and life everlasting. Amen."
  ];
  const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

  /* ── The book's load-bearing distinctions ────────────────────── */
  const CONCEPTS = [
    { a: ["Myth", "the world as a story told about the gods", ["logos vs myth"]],
      b: ["Logos", "the world as reason, and Reason as a person", ["logos vs myth"]],
      desc: "Christianity was born where Greek reason met biblical faith: not a myth about the gods, but the claim that the ground of all things is meaning — and speaks." },
    { a: ["The god of the philosophers", "the necessary being of metaphysics", ["God of the philosophers"]],
      b: ["The God of Abraham", "the God who says 'I AM' and calls you", ["the name of God"]],
      desc: "Ratzinger's most famous move: the Church chose philosophy, then let the biblical God transform it — being becomes freedom, essence becomes address." },
    { a: ["Jesus", "the Galilean teacher reconstructed by historians", ["history and modernity"]],
      b: ["Christ", "the one the disciples confess after Easter", ["Incarnation"]],
      desc: "Modern theology splits the two. The Creed refuses: faith does not climb from a reconstructed Jesus to a Christ of faith; it meets the Risen One and reads backwards from the Cross." },
    { a: ["Theology of the Incarnation", "God's descent into flesh", ["Incarnation"]],
      b: ["Theology of the Cross", "God's power hidden in weakness", ["Cross"]],
      desc: "Two centres of one mystery. Creation and incarnation belong together; the Cross is where love looks like defeat and is not." },
    { a: ["Faith as opinion", "a private guess about unprovable things", ["subjective faith"]],
      b: ["Faith as standing firm", "cre-do = cor-dare: trusting, giving one's heart", ["faith and reason"]],
      desc: "Belief is not weaker knowledge but a different act: not a theory about the world, but the decision to stand on a Thou who stands firm." }
  ];

  const STORE_KEY = "itc.progress.v2";
  const DAY = 86400000;
  const state = load();

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { items: {}, days: [], notes: {} }; }
    catch (e) { return { items: {}, days: [], notes: {} }; }
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  const today = () => new Date().toISOString().slice(0, 10);
  const gradeable = (id) => state.items[id] || (state.items[id] = { ivl: 0, ease: 2.5, reps: 0, lapses: 0, due: today() });

  /* SM-2 lite: grade 0=again 1=hard 2=good 3=easy. Returns new interval in days. */
  function schedule(itemState, grade) {
    if (grade === 0) {
      itemState.reps = 0; itemState.ivl = 0;
      itemState.ease = Math.max(1.3, itemState.ease - 0.2);
      itemState.lapses++;
    } else if (grade === 1) {
      itemState.ivl = itemState.ivl === 0 ? 1 : Math.max(1, Math.round(itemState.ivl * 1.2));
      itemState.ease = Math.max(1.3, itemState.ease - 0.15);
      itemState.reps++;
    } else if (grade === 2) {
      itemState.ivl = itemState.ivl === 0 ? 1 : Math.round(itemState.ivl * itemState.ease);
      itemState.reps++;
    } else {
      itemState.ivl = itemState.ivl === 0 ? 2 : Math.round(itemState.ivl * itemState.ease * 1.3);
      itemState.ease += 0.15;
      itemState.reps++;
    }
    itemState.due = new Date(Date.now() + itemState.ivl * DAY).toISOString().slice(0, 10);
    return itemState.ivl;
  }

  /* ── Small helpers ───────────────────────────────────────────── */
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const norm = (s) => s.toLowerCase().replace(/[\s.,;:!?"'’“”()—–-]+/g, " ").replace(/\s+/g, " ").trim();
  const fmtDate = (d) => d.toISOString().slice(0, 10);

  /* ── Content + review items + plan ───────────────────────────── */
  const SITE = (typeof window !== "undefined" && window.SITE) || {};
  const cards = SITE.cards || [];
  const glossary = SITE.glossary || [];
  const thinkers = SITE.thinkers || [];
  const corrections = SITE.corrections || [];
  const scripture = SITE.scripture || [];
  const creedWords = SITE.creedWords || [];

  /* One review item per recall question and per cloze sentence. */
  function buildItems(list) {
    return list.flatMap((c) => [
      { id: c.id + "#r", kind: "recall", card: c },
      ...c.cloze.map((cl, i) => ({ id: c.id + "#c" + i, kind: "cloze", card: c, cloze: cl }))
    ]);
  }
  const ITEMS = buildItems(cards);
  const isDue = (it) => !state.items[it.id] || state.items[it.id].due <= today();

  /* One idea a day, Mon–Sun, starting next Monday. */
  function buildPlan(list, start) {
    return list.map((c, i) => {
      const d = new Date(start.getTime());
      d.setDate(start.getDate() + i);
      return { date: d, card: c };
    });
  }
  function planStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    return d;
  }

  const icsEsc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  function buildIcs(sessions) {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Introduction to Christianity study plan//EN"];
    sessions.forEach((s) => {
      const dt = fmtDate(s.date).replace(/-/g, "");
      lines.push("BEGIN:VEVENT",
        "UID:" + s.card.id + "@intro-to-christianity",
        "DTSTART;VALUE=DATE:" + dt,
        "DTEND;VALUE=DATE:" + dt,
        "SUMMARY:" + icsEsc("Read: " + s.card.title),
        "DESCRIPTION:" + icsEsc(s.card.idea + "\nRead pp. " + s.card.pages[0] + "–" + s.card.pages[1]),
        "END:VEVENT");
    });
    return lines.concat("END:VCALENDAR").join("\r\n");
  }

  function download(filename, text, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: mime || "text/plain" }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ── Nav progress ring ───────────────────────────────────────── */
  function refreshRing() {
    const learned = ITEMS.filter((it) => (state.items[it.id] || {}).ivl >= 7).length;
    const pct = ITEMS.length ? Math.round((learned / ITEMS.length) * 100) : 0;
    $("#ring").style.strokeDashoffset = 97.4 - (97.4 * pct) / 100;
    $("#ring-label").textContent = pct + "%";
  }

  /* ── Focus a single card from any deep link ──────────────────── */
  function focusCard(id) {
    activePart = "all";
    activeArticle = null;
    renderFilters();
    renderIdeas();
    const node = $('#idea-cards .card[data-id="' + id + '"]');
    if (!node) return;
    node.classList.add("is-open", "card--flash");
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => node.classList.remove("card--flash"), 2200);
  }
  function cardLinks(ids) {
    return (ids || []).map((id) => {
      const c = cards.find((x) => x.id === id);
      return c ? '<button class="link-chip" data-goto="' + id + '">' + esc(c.title) + "</button>" : "";
    }).join(" ");
  }
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-goto]");
      if (b) focusCard(b.getAttribute("data-goto"));
      const p = e.target.closest("[data-page]");
      if (p) focusPage(+p.getAttribute("data-page"));
      const r = e.target.closest("[data-read]");
      if (r) readPage(+r.getAttribute("data-read"));
    });
  }

  /* ── Creed map + word deep-dives ─────────────────────────────── */
  function renderCreed() {
    const list = $("#creed-list");
    list.innerHTML = "";
    ARTICLES.forEach((text, i) => {
      const group = cards.filter((c) => c.article === i);
      const learned = group.filter((c) => {
        const its = ITEMS.filter((it) => it.card.id === c.id);
        return its.every((it) => (state.items[it.id] || {}).ivl >= 7);
      }).length;
      const li = el("li", "creed__item" + (group.length && learned === group.length ? " creed__item--done" : ""));
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.append(el("span", "creed__num", ROMAN[i]));
      li.append(el("span", "creed__text", text));
      const meta = el("span", "creed__meta");
      meta.innerHTML = group.length
        ? "<b>" + group.length + "</b> ideas · " + learned + " learned"
        : "read with the article above";
      li.append(meta);

      const detail = el("div", "creed__detail");
      const words = creedWords.filter((w) => w.article === i);
      detail.innerHTML = words.map((w) =>
        '<div class="word-dive"><h4>' + esc(w.word) + "</h4>" +
        '<p><b>Means:</b> ' + esc(w.means) + "</p>" +
        '<p><b>Not:</b> ' + esc(w.excludes) + "</p>" +
        '<p class="card__quote">“' + esc(w.quote) + '”</p>' +
        '<p class="card__cite">p. ' + w.page + "</p></div>").join("") ||
        '<p class="word-dive__empty">No word deep-dive for this article — the ideas below carry it.</p>';
      if (group.length) {
        const go = el("button", "btn btn--ghost btn--small", "Show its " + group.length + " ideas");
        go.addEventListener("click", (e) => { e.stopPropagation(); filterByArticle(i); });
        detail.append(go);
      }

      const toggle = () => {
        const open = detail.classList.contains("creed__detail--open");
        list.querySelectorAll(".creed__detail").forEach((d) => d.classList.remove("creed__detail--open"));
        if (!open) detail.classList.add("creed__detail--open");
      };
      li.addEventListener("click", toggle);
      li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      li.append(detail);
      list.append(li);
    });
  }

  /* ── Idea cards (with nuance panels) ─────────────────────────── */
  let activePart = "all";
  let activeArticle = null;

  function filterByArticle(i) {
    activeArticle = i;
    activePart = "all";
    renderFilters();
    renderIdeas();
    $("#ideas").scrollIntoView({ behavior: "smooth" });
  }

  function renderFilters() {
    const box = $("#idea-filters");
    box.innerHTML = "";
    const defs = [{ id: "all", label: "All" }].concat(SITE.parts.map((p) => ({ id: p.id, label: p.title })));
    defs.forEach((d) => {
      const b = el("button", "chip" + (activePart === d.id && activeArticle === null ? " chip--on" : ""), d.label);
      b.addEventListener("click", () => { activePart = d.id; activeArticle = null; renderFilters(); renderIdeas(); });
      box.append(b);
    });
    if (activeArticle !== null) {
      const b = el("button", "chip chip--on", "Article " + ROMAN[activeArticle] + " ✕");
      b.addEventListener("click", () => { activeArticle = null; renderFilters(); renderIdeas(); });
      box.append(b);
    }
  }

  function cardNode(c, compact) {
    const node = el("article", "card");
    node.dataset.id = c.id;
    node.append(el("p", "card__section", c.section + " · " + c.pages[0] + "–" + c.pages[1]));
    node.append(el("h3", "card__title", c.title));
    node.append(el("p", "card__idea", c.idea));

    const fold = el("div", "card__fold");
    const inner = el("div");
    const back = el("div", "card__back");
    if (!compact) {
      back.insertAdjacentHTML("beforeend",
        '<div class="card__row"><span class="card__label">Before you read</span><p>' + esc(c.before) + "</p></div>");
    }
    back.insertAdjacentHTML("beforeend",
      '<div class="card__row"><span class="card__label">After you read</span><p>' + esc(c.after) + "</p></div>" +
      '<div class="card__row"><span class="card__label">Why it sticks</span><p>' + esc(c.why) + "</p></div>");

    if (c.misreading) {
      back.insertAdjacentHTML("beforeend",
        '<div class="misreading"><span class="card__label">What this does <em>not</em> say</span>' +
        '<p class="misreading__wrong">✕ ' + esc(c.misreading.wrong) + "</p>" +
        '<p class="misreading__right">✓ ' + esc(c.misreading.right) + "</p>" +
        '<p class="card__quote">“' + esc(c.misreading.quote) + '”</p>' +
        '<p class="card__cite">p. ' + c.misreading.page + "</p></div>");
    }
    if (c.argument) {
      back.insertAdjacentHTML("beforeend",
        '<div class="argument"><span class="card__label">How he argues</span>' +
        '<div class="argument__steps"><div><b>Tension</b><p>' + esc(c.argument.tension) + "</p></div>" +
        '<div><b>Move</b><p>' + esc(c.argument.move) + "</p></div>" +
        '<div><b>Payoff</b><p>' + esc(c.argument.payoff) + "</p></div></div></div>");
    }

    back.insertAdjacentHTML("beforeend",
      '<div class="card__row"><span class="card__label">In his words</span>' +
      '<p class="card__quote">“' + esc(c.quote) + '”</p><p class="card__cite">' + esc(c.section) + ", p. " + c.quotePage + "</p></div>");

    if (!compact) {
      back.insertAdjacentHTML("beforeend",
        '<div class="card__row"><span class="card__label">Test yourself</span><p>' + esc(c.recall) + "</p></div>");
    }

    const tags = el("div", "card__tags");
    c.tags.forEach((t) => tags.append(el("span", "tag", t)));
    back.append(tags);

    if (!compact) {
      const note = el("div", "card__row card__note");
      note.innerHTML = '<span class="card__label">My note</span>';
      const ta = el("textarea", "note-area");
      ta.rows = 2;
      ta.placeholder = "Your own words…";
      ta.value = state.notes[c.id] || "";
      ta.addEventListener("change", () => { state.notes[c.id] = ta.value; save(); });
      note.append(ta);
      back.append(note);
    }

    inner.append(back);
    fold.append(inner);
    node.append(fold);

    const foot = el("div", "card__foot");
    const open = el("button", "card__open-btn", "Open card");
    open.addEventListener("click", () => {
      node.classList.toggle("is-open");
      open.textContent = node.classList.contains("is-open") ? "Close card" : "Open card";
    });
    foot.append(open);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const listen = el("button", "btn btn--ghost btn--small card__listen", "Listen");
      listen.addEventListener("click", (e) => {
        e.stopPropagation();
        stopReading();
        speechSynthesis.speak(new SpeechSynthesisUtterance(c.title + ". " + c.idea));
      });
      foot.append(listen);
    }
    node.append(foot);
    return node;
  }

  function renderIdeas() {
    const box = $("#idea-cards");
    box.innerHTML = "";
    cards
      .filter((c) => (activeArticle === null ? activePart === "all" || c.part === activePart : c.article === activeArticle))
      .forEach((c) => box.append(cardNode(c, false)));
    if (!box.children.length) box.append(el("p", null, "No ideas here yet."));
  }

  /* ── Review (item-level spaced repetition) ───────────────────── */
  let reviewQueue = [];

  function rebuildQueue() {
    reviewQueue = ITEMS.filter(isDue);
    renderReview();
  }

  function renderReview() {
    const stage = $("#review-stage");
    $("#due-count").textContent = ITEMS.filter(isDue).length;
    $("#mastered-count").textContent = ITEMS.filter((it) => (state.items[it.id] || {}).ivl >= 21).length;
    $("#streak-count").textContent = state.days.length;
    renderLeeches();
    stage.innerHTML = "";

    const item = reviewQueue[0];
    if (!item) {
      const due = ITEMS.filter(isDue).length;
      const empty = el("div", "review__empty");
      empty.append(el("h3", null, due ? "Session finished — continue?" : "Nothing due today"));
      empty.append(el("p", null, due
        ? "You've cleared this queue. " + due + " item(s) are still scheduled for today."
        : "Memory is built in the gaps. Come back tomorrow, or take a new idea now."));
      const b = el("button", "btn btn--gold", "Study a new item");
      b.addEventListener("click", () => {
        reviewQueue = [ITEMS.find((it) => !state.items[it.id]) || ITEMS[Math.floor(Math.random() * ITEMS.length)]];
        renderReview();
      });
      empty.append(b);
      stage.append(empty);
      return;
    }

    const c = item.card;
    stage.append(el("p", "review__section", c.section + (item.kind === "cloze" ? " · fill the blank" : "")));

    if (item.kind === "cloze") {
      const s = el("p", "practice__sentence");
      s.append(document.createTextNode(item.cloze.pre));
      const fill = el("span", "review__blank");
      fill.textContent = " _______ ";
      s.append(fill);
      s.append(document.createTextNode(item.cloze.post));
      stage.append(s);
    } else {
      stage.append(el("h3", "review__q", c.recall));
    }

    const reveal = el("button", "btn btn--ghost", "Show answer");
    stage.append(reveal);
    reveal.addEventListener("click", () => {
      reveal.remove();
      const a = el("div", "review__a");
      if (item.kind === "cloze") {
        a.append(el("p", "card__idea", "“" + item.cloze.blank + "”"));
      } else {
        a.append(el("p", "card__idea", c.idea));
      }
      a.append(el("p", null, c.after));
      if (c.rubric) {
        const r = el("div", "rubric");
        r.innerHTML = '<span class="card__label">Before you grade yourself — a full answer contained</span><ul>' +
          c.rubric.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
        a.append(r);
      }
      a.append(el("p", "card__quote", "“" + c.quote + "”"));
      a.append(el("p", "card__cite", c.section + ", p. " + c.quotePage));
      stage.append(a);
      const grades = el("div", "grades");
      [["Again", "today", 0], ["Hard", "soon", 1], ["Good", "on schedule", 2], ["Easy", "much later", 3]].forEach(([label, hint, g]) => {
        const b = el("button", "grade grade--" + label.toLowerCase(), label);
        b.append(el("small", null, hint));
        b.addEventListener("click", () => {
          schedule(gradeable(item.id), g);
          if (!state.days.includes(today())) state.days.push(today());
          save();
          reviewQueue.shift();
          refreshRing();
          renderReview();
          renderCreed();
        });
        grades.append(b);
      });
      stage.append(grades);
    });
  }

  function renderLeeches() {
    const box = $("#leech-box");
    const leeches = ITEMS.filter((it) => (state.items[it.id] || {}).lapses >= 4);
    box.hidden = !leeches.length;
    const list = $("#leech-list");
    list.innerHTML = "";
    leeches.slice(0, 6).forEach((it) => {
      const li = el("li");
      const b = el("button", "link-chip", it.card.title + (it.kind === "cloze" ? " (blank)" : ""));
      b.addEventListener("click", () => { reviewQueue = [it, ...reviewQueue.filter((x) => x !== it)]; renderReview(); });
      li.append(b);
      list.append(li);
    });
  }

  /* ── Practice (free-play cloze) ──────────────────────────────── */
  function renderPractice(focus) {
    const stage = $("#practice-stage");
    const c = cards[Math.floor(Math.random() * cards.length)];
    const cl = c.cloze[Math.floor(Math.random() * c.cloze.length)];
    stage.innerHTML = "";

    stage.append(el("p", "review__section", c.section + " · " + c.title));
    const s = el("p", "practice__sentence");
    s.append(document.createTextNode(cl.pre));
    const input = el("input", "practice__blank");
    input.type = "text";
    input.setAttribute("aria-label", "Missing word or phrase");
    input.autocomplete = "off";
    input.size = Math.max(12, cl.blank.length + 2);
    s.append(input);
    s.append(document.createTextNode(cl.post));
    stage.append(s);

    const fb = el("p", "practice__feedback");
    stage.append(fb);

    const foot = el("div", "practice__foot");
    const check = el("button", "btn btn--gold", "Check");
    const next = el("button", "btn btn--ghost", "Next sentence");
    foot.append(check, next);
    foot.append(el("p", "practice__count", ITEMS.filter((i) => i.kind === "cloze").length + " sentences in the deck"));
    stage.append(foot);

    const grade = () => {
      const ok = norm(input.value) === norm(cl.blank);
      input.classList.toggle("practice__blank--ok", ok);
      input.classList.toggle("practice__blank--no", !ok);
      fb.innerHTML = ok
        ? "<b>Yes.</b> " + esc(c.why)
        : '<span class="no">Not quite —</span> the word is <b>“' + esc(cl.blank) + '”</b>.';
    };
    check.addEventListener("click", grade);
    next.addEventListener("click", () => renderPractice(true));
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") grade(); });
    if (focus) input.focus();
  }

  /* ── The method: both/and trainer ────────────────────────────── */
  let trainerScore = { right: 0, total: 0 };

  function renderTrainer() {
    const box = $("#trainer");
    const k = CONCEPTS[Math.floor(Math.random() * CONCEPTS.length)];
    const flipped = Math.random() < 0.5;
    const shown = flipped ? k.b : k.a;
    const answer = flipped ? k.a : k.b;
    const distractors = CONCEPTS.filter((x) => x !== k)
      .sort(() => Math.random() - 0.5).slice(0, 2)
      .map((x) => (flipped ? x.a : x.b));
    const options = [answer, ...distractors].sort(() => Math.random() - 0.5);

    box.innerHTML =
      '<p class="review__section">Both / and — what\'s the other pole?</p>' +
      '<div class="trainer__q"><b>' + esc(shown[0]) + "</b> <span>" + esc(shown[1]) + "</span></div>" +
      '<div class="trainer__opts">' + options.map((o, i) =>
        '<button class="trainer__opt" data-i="' + i + '">' + esc(o[0]) + "</button>").join("") + "</div>" +
      '<div class="trainer__fb"></div>' +
      '<p class="trainer__score">' + trainerScore.right + " / " + trainerScore.total + "</p>";

    box.querySelectorAll(".trainer__opt").forEach((b) => {
      b.addEventListener("click", () => {
        const pick = options[+b.dataset.i];
        const ok = pick === answer;
        trainerScore.total++;
        if (ok) trainerScore.right++;
        box.querySelector(".trainer__fb").innerHTML = (ok ? "<b>Yes.</b> " : "<b>No —</b> it pairs with <b>" + esc(answer[0]) + "</b>. ") + esc(k.desc);
        box.querySelectorAll(".trainer__opt").forEach((x) => { x.disabled = true; if (x === b) x.classList.add(ok ? "trainer__opt--ok" : "trainer__opt--no"); });
        const next = el("button", "btn btn--gold", "Next pair");
        next.addEventListener("click", renderTrainer);
        box.append(next);
      });
    });
  }

  /* ── Concepts ────────────────────────────────────────────────── */
  function renderConcepts() {
    const box = $("#concept-list");
    CONCEPTS.forEach((k) => {
      const row = el("div", "concept");
      [["a", k.a], ["b", k.b]].forEach(([side, def]) => {
        const s = el("div", "concept__side");
        s.setAttribute("role", "button");
        s.tabIndex = 0;
        s.append(el("h3", null, def[0]));
        s.append(el("span", null, def[1]));
        const show = () => {
          const on = s.classList.contains("concept__side--on");
          box.querySelectorAll(".concept__side").forEach((x) => x.classList.remove("concept__side--on"));
          if (!on) { s.classList.add("concept__side--on"); renderConceptCards(def[2]); }
          else $("#concept-cards").innerHTML = "";
        };
        s.addEventListener("click", show);
        s.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); } });
        row.append(s);
        if (side === "a") row.append(el("p", "concept__vs", "vs"));
      });
      row.append(el("p", "concept__desc", k.desc));
      box.append(row);
    });
  }

  function renderConceptCards(tags) {
    const box = $("#concept-cards");
    box.innerHTML = "";
    cards.filter((c) => c.tags.some((t) => tags.includes(t))).forEach((c) => box.append(cardNode(c, true)));
    if (!box.children.length) box.append(el("p", null, "No cards tagged for this side yet."));
  }

  /* ── Glossary ────────────────────────────────────────────────── */
  function speak(text) {
    if (!(typeof window !== "undefined" && window.speechSynthesis)) return;
    stopReading();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  function renderGlossary() {
    const t = glossary[new Date().getDate() % glossary.length];
    if (t) {
      $("#term-of-day").innerHTML =
        '<span class="card__label">Term of the day</span><h3>' + esc(t.term) + "</h3>" +
        "<p>" + esc(t.definition) + "</p>";
    }
    $("#glossary-list").innerHTML = glossary.map((g) =>
      '<article class="term"><p class="card__section">' + esc(g.origin) + (g.pronunciation ? " · " + esc(g.pronunciation) : "") + "</p>" +
      "<h3>" + esc(g.term) + "</h3><p>" + esc(g.definition) + "</p>" +
      '<p class="term__nuance">' + esc(g.nuance) + "</p>" +
      '<p class="card__cite">p. ' + g.page + " · " + cardLinks(g.cards) + "</p></article>").join("");
  }

  /* ── Thinkers ────────────────────────────────────────────────── */
  function renderThinkers() {
    $("#thinker-list").innerHTML = thinkers.map((t) =>
      '<article class="thinker"><p class="card__section">' + esc(t.tradition) + "</p>" +
      "<h3>" + esc(t.name) + "</h3>" +
      '<div class="thinker__cols"><div><b>His claim</b><p>' + esc(t.claim) + "</p></div>" +
      '<div><b>Ratzinger\'s answer</b><p>' + esc(t.counter) + "</p></div></div>" +
      '<p class="card__quote">“' + esc(t.quote) + '”</p>' +
      '<p class="card__cite">p. ' + t.page + " · " + cardLinks(t.cards) + "</p></article>").join("");
  }

  /* ── Sources: corrections + scripture ────────────────────────── */
  function renderSources() {
    $("#correction-list").innerHTML = corrections.map((c) =>
      '<div class="tl-item"><span class="tl-year">' + c.year + "</span>" +
      "<h4>" + esc(c.title) + "</h4><p>" + esc(c.what) + "</p>" +
      '<p class="card__quote">“' + esc(c.quote) + '”</p>' +
      '<p class="card__cite">p. ' + c.page + " · " + cardLinks(c.cards) + "</p></div>").join("");

    $("#scripture-list").innerHTML = scripture.map((s) =>
      '<div class="scr-item"><h4>' + esc(s.ref) + "</h4>" +
      '<p class="scr-text">' + esc(s.text) + "</p>" +
      "<p>" + esc(s.ratzinger) + "</p>" +
      '<p class="card__cite">p. ' + s.page + " · " + cardLinks(s.cards) + "</p></div>").join("");
  }

  /* ── Quotes rotator ──────────────────────────────────────────── */
  let quoteIndex = 0;
  function renderQuote() {
    const c = cards[quoteIndex % cards.length];
    if (!c) return;
    $("#quote-text").textContent = "“" + c.quote + "”";
    $("#quote-cite").textContent = c.title + " · " + c.section + ", p. " + c.quotePage;
  }

  /* ── Plan ────────────────────────────────────────────────────── */
  function renderPlan() {
    const sessions = buildPlan(cards, planStart());
    const weeks = [];
    sessions.forEach((s) => {
      const wk = Math.floor((s.date - planStart()) / (7 * DAY));
      (weeks[wk] = weeks[wk] || []).push(s);
    });
    $("#plan-list").innerHTML = weeks.map((week, i) =>
      '<div class="plan__week"><h3>Week ' + (i + 1) + "</h3>" + week.map((s) =>
        '<div class="plan__day"><span class="plan__date">' +
        s.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + "</span>" +
        '<b>' + esc(s.card.title) + "</b>" +
        '<span class="plan__pages">pp. ' + s.card.pages[0] + "–" + s.card.pages[1] + "</span></div>").join("") +
      "</div>").join("");
  }

  /* ── Reader: the whole book, reflowed ────────────────────────── */
  let readerBuilt = false;
  let readerSize = 1;

  /* Join hard-wrapped lines; keep a line-break hyphen only when the joined
     word isn't attested elsewhere in the book. */
  function reflow(block, words) {
    return block
      .replace(/(\w+)-\n(\w+)/g, (m, a, b) => (words && words.has((a + b).toLowerCase()) ? a + b : a + "-" + b))
      .replace(/\s*\n\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const isHeading = (t) => t.split(" ").length <= 10 && !/[.,;:!?]$/.test(t);

  function buildReader() {
    const pages = window.BOOK_PAGES || [];
    const words = new Set();
    pages.forEach((p) => (p.toLowerCase().match(/[a-zà-ÿ'-]+/g) || []).forEach((w) => words.add(w)));
    const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
    $("#reader-pages").innerHTML = pages.map((text, i) => {
      const paras = text.split(/\n\s*\n/).map((b) => reflow(b, words)).filter(Boolean);
      return '<section class="reader-page" id="page-' + (i + 1) + '">' +
        '<div class="reader-page__head">' +
        '<p class="reader-page__label">PDF page ' + (i + 1) + "</p>" +
        '<button class="btn btn--ghost btn--small reader__read" data-read="' + (i + 1) + '"' +
        (canSpeak ? "" : ' title="Text-to-speech is not available in this browser"') + ">Read aloud</button>" +
        "</div>" +
        paras.map((par) => (isHeading(par) ? "<h4>" + esc(par) + "</h4>" : "<p>" + esc(par) + "</p>")).join("") +
        "</section>";
    }).join("");
    $("#reader-toc").innerHTML = cards.map((c) =>
      '<button class="link-chip" data-page="' + c.pages[0] + '">' + esc(c.section) + " — " + esc(c.title) + "</button>").join(" ");
  }

  /* ── Page-by-page TTS (chunked so long pages don't stall) ────── */
  let speaking = null;

  function chunkText(text, max) {
    max = max || 280;
    const out = [];
    let cur = "";
    text.split(/(?<=[.!?…])\s+/).forEach((s) => {
      if (cur && (cur + " " + s).length > max) { out.push(cur); cur = s; }
      else cur = cur ? cur + " " + s : s;
    });
    if (cur) out.push(cur);
    return out;
  }

  function stopReading() {
    if (typeof window !== "undefined" && window.speechSynthesis) speechSynthesis.cancel();
    if (speaking) {
      document.querySelectorAll(".reader__read--on").forEach((b) => {
        b.textContent = "Read aloud";
        b.classList.remove("reader__read--on");
      });
      speaking = null;
    }
  }

  function readPage(n) {
    const btn = document.querySelector('.reader__read[data-read="' + n + '"]');
    if (!(typeof window !== "undefined" && window.speechSynthesis)) {
      if (btn) {
        btn.textContent = "No TTS in this browser";
        setTimeout(() => { btn.textContent = "Read aloud"; }, 2500);
      }
      return;
    }
    if (speaking && speaking.page === n) return stopReading();
    stopReading();
    const section = document.getElementById("page-" + n);
    const text = Array.from(section.querySelectorAll("h4, p:not(.reader-page__label)"))
      .map((el) => el.textContent).join(" ");
    const chunks = chunkText(text);
    if (!chunks.length) return;
    speaking = { page: n };
    if (btn) { btn.textContent = "Stop"; btn.classList.add("reader__read--on"); }
    chunks.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c);
      if (i === chunks.length - 1) u.onend = () => stopReading();
      speechSynthesis.speak(u);
    });
  }

  function ensureReader(then) {
    ensureBook(() => {
      if (!readerBuilt) { readerBuilt = true; buildReader(); }
      if (then) then();
    });
  }

  function focusPage(n) {
    ensureReader(() => {
      const node = document.getElementById("page-" + n);
      if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
      const toc = document.querySelector(".toc");
      if (toc) toc.open = false;
    });
  }

  /* ── Search across the full text ─────────────────────────────── */
  let bookLoaded = false;
  function ensureBook(then) {
    if (bookLoaded) return then();
    const s = document.createElement("script");
    s.src = "src/book.js?v=2";
    s.onload = () => { bookLoaded = true; $("#search-hint").textContent = "Searching all 272 pages in your browser — nothing is sent anywhere."; then(); };
    s.onerror = () => { $("#search-hint").textContent = "Could not load the book text (src/book.js)."; };
    document.head.append(s);
  }

  function runSearch(q) {
    const out = $("#search-results");
    out.innerHTML = "";
    if (q.length < 2) return;
    const needle = q.toLowerCase();

    cards.filter((c) => (c.title + " " + c.idea + " " + c.quote).toLowerCase().includes(needle)).slice(0, 4).forEach((c) => {
      out.insertAdjacentHTML("beforeend",
        '<div class="result"><div class="result__head"><button class="result__page" data-page="' + c.pages[0] + '">Idea · p. ' + c.pages[0] + "</button>" +
        '<span class="result__title">' + esc(c.title) + "</span></div>" +
        '<p class="result__snippet">' + esc(c.idea) + "</p></div>");
    });

    const pages = window.BOOK_PAGES || [];
    let hits = 0;
    pages.forEach((text, i) => {
      if (hits >= 20) return;
      const at = text.toLowerCase().indexOf(needle);
      if (at === -1) return;
      hits++;
      const from = Math.max(0, at - 130), to = Math.min(text.length, at + q.length + 170);
      const snippet = (from > 0 ? "…" : "") + text.slice(from, to).replace(/\s+/g, " ") + (to < text.length ? "…" : "");
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      out.insertAdjacentHTML("beforeend",
        '<div class="result"><div class="result__head"><button class="result__page" data-page="' + (i + 1) + '">PDF p. ' + (i + 1) + "</button>" +
        '<span class="result__title">From the book</span></div>' +
        '<p class="result__snippet">' + esc(snippet).replace(re, (m) => "<mark>" + m + "</mark>") + "</p></div>");
    });
    if (!out.children.length) out.insertAdjacentHTML("beforeend", '<p class="search__hint">No matches for “' + esc(q) + '”.</p>');
  }

  /* ── Wire up ─────────────────────────────────────────────────── */
  function init() {
    $("#stat-cards").textContent = cards.length;
    $("#stat-questions").textContent = ITEMS.length;
    $("#stat-quotes").textContent = cards.length;
    $("#stat-terms").textContent = glossary.length + thinkers.length;

    renderCreed();
    renderFilters();
    renderIdeas();
    rebuildQueue();
    renderPractice();
    renderTrainer();
    renderConcepts();
    renderGlossary();
    renderThinkers();
    renderSources();
    renderQuote();
    renderPlan();
    refreshRing();

    $("#quote-prev").addEventListener("click", () => { quoteIndex = (quoteIndex + cards.length - 1) % cards.length; renderQuote(); });
    $("#quote-next").addEventListener("click", () => { quoteIndex = (quoteIndex + 1) % cards.length; renderQuote(); });

    $("#cram-btn").addEventListener("click", () => {
      reviewQueue = ITEMS.slice().sort(() => Math.random() - 0.5);
      renderReview();
    });

    $("#plan-ics").addEventListener("click", () =>
      download("introduction-to-christianity-plan.ics", buildIcs(buildPlan(cards, planStart())), "text/calendar"));
    $("#plan-print").addEventListener("click", () => window.print());
    $("#notes-export").addEventListener("click", () => {
      const lines = ["# My notes — Introduction to Christianity", ""];
      cards.forEach((c) => {
        if (state.notes[c.id]) lines.push("## " + c.title + " (" + c.section + ", pp. " + c.pages[0] + "–" + c.pages[1] + ")", "", state.notes[c.id], "");
      });
      download("introduction-to-christianity-notes.md", lines.join("\n"), "text/markdown");
    });

    let t = null;
    $("#search-input").addEventListener("input", (e) => {
      const q = e.target.value.trim();
      clearTimeout(t);
      if (q.length < 2) { $("#search-results").innerHTML = ""; return; }
      ensureBook(() => { t = setTimeout(() => runSearch(q), 160); });
    });

    // reader: load the text when the section comes near
    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) { ensureReader(); io.disconnect(); }
      }, { rootMargin: "800px" });
      io.observe($("#reader"));
    }
    const jump = () => {
      const n = +$("#reader-jump").value;
      if (n < 1) return;
      ensureReader(() => { if (n <= window.BOOK_PAGES.length) focusPage(n); });
    };
    $("#reader-go").addEventListener("click", jump);
    $("#reader-jump").addEventListener("keydown", (e) => { if (e.key === "Enter") jump(); });
    $("#reader-sm").addEventListener("click", () => {
      readerSize = Math.max(0, readerSize - 1);
      $("#reader-pages").className = "reader-pages reader-pages--" + readerSize;
    });
    $("#reader-lg").addEventListener("click", () => {
      readerSize = Math.min(2, readerSize + 1);
      $("#reader-pages").className = "reader-pages reader-pages--" + readerSize;
    });

    $("#reset-progress").addEventListener("click", () => {
      if (!confirm("Erase your review history in this browser? Notes are kept.")) return;
      state.items = {}; state.days = [];
      save();
      rebuildQueue();
      renderCreed();
      refreshRing();
    });
  }

  if (typeof document !== "undefined" && document.readyState !== "loading") init();
  else if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);

  if (typeof module !== "undefined") module.exports = { schedule, norm, isDue, gradeable, buildItems, buildPlan, buildIcs, reflow, chunkText, ARTICLES, CONCEPTS };
})();
