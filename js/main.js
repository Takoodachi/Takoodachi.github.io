(() => {
  "use strict";

  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const hero = $(".hero");

  /* ---------- local time in Appleton ---------- */
  const clock = $("[data-clock]");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------- split text into letters (words stay unbreakable) ---------- */
  function split(el, from = 0) {
    let i = from;
    const text = el.textContent;
    el.textContent = "";
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.append(" "); return; }
      const word = document.createElement("span");
      word.className = "word";
      for (const c of part) {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = c;
        s.style.setProperty("--i", i++);
        word.append(s);
      }
      el.append(word);
    });
    return i;
  }

  /* ---------- variable-font letters that widen and thicken near the cursor ---------- */
  function stretchy(el, area, { minW, maxW, minG, maxG, wave }) {
    const chars = $$(".ch", el);
    if (reduce || !chars.length) return { measure() {} };
    const v = chars.map(() => 0);
    let centers = [], radius = 200, px = 0, py = 0, inside = false, raf = 0, visible = true;
    let waving = wave;

    const measure = () => {
      centers = chars.map((c) => {
        const r = c.getBoundingClientRect();
        return [r.left + r.width / 2 + scrollX, r.top + r.height / 2 + scrollY];
      });
      radius = parseFloat(getComputedStyle(el).fontSize) * 1.5;
    };

    const frame = (t) => {
      let busy = false;
      chars.forEach((c, i) => {
        let target = 0;
        if (inside) {
          const k = clamp(1 - Math.hypot(px - centers[i][0], py - centers[i][1]) / radius, 0, 1);
          target = k * k * (3 - 2 * k);
        } else if (waving) {
          target = ((Math.sin(t / 650 - i * 0.5) + 1) / 2) * 0.55;
        }
        const next = v[i] + (target - v[i]) * 0.14;
        if (Math.abs(target - next) > 0.002) busy = true;
        if (Math.abs(next - v[i]) > 0.0004) {
          v[i] = next;
          c.style.fontVariationSettings = `"wdth" ${lerp(minW, maxW, next).toFixed(1)}, "wght" ${Math.round(lerp(minG, maxG, next))}`;
        }
      });
      raf = visible && (busy || (waving && !inside)) ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

    area.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      px = e.pageX; py = e.pageY; inside = true; waving = false;
      kick();
    });
    area.addEventListener("pointerleave", () => { inside = false; kick(); });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(el);
    measure();
    return { measure };
  }

  /* ---------- hero ---------- */
  const name = $("[data-name]");
  let heroType = { measure() {} };
  if (name) {
    let i = 0;
    $$(".name-line", name).forEach((line) => { i = split(line, i); });
    // Touch screens get a slow wave instead of the cursor effect.
    heroType = stretchy(name, hero, { minW: 92, maxW: 150, minG: 560, maxG: 900, wave: true });

    const dims = $("[data-dims]", name);
    const sizeTag = () => {
      const r = name.getBoundingClientRect();
      dims.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
    };
    sizeTag();
    addEventListener("resize", sizeTag);
    document.fonts && document.fonts.ready.then(() => { sizeTag(); heroType.measure(); });

    if (!reduce) {
      // After the letters land, the inspector "selects" the name for a moment.
      setTimeout(() => { heroType.measure(); hero.classList.add("intro"); }, 1300);
      setTimeout(() => hero.classList.remove("intro"), 3200);
    }
  }

  // Rulers, guides and the cursor readout
  if (hero) {
    const rx = $(".ruler-x", hero), ry = $(".ruler-y", hero);
    const gx = $(".guide-x", hero), gy = $(".guide-y", hero);
    const mx = $(".ruler-x .ruler-mark", hero), my = $(".ruler-y .ruler-mark", hero);
    const ox = $("[data-x]", hero), oy = $("[data-y]", hero);
    const labels = () => {
      $$(".ruler span:not(.ruler-mark)", hero).forEach((s) => s.remove());
      for (let x = 100; x < hero.offsetWidth; x += 100) {
        const s = document.createElement("span"); s.textContent = x; s.style.left = x + "px"; rx.append(s);
      }
      for (let y = 100; y < hero.offsetHeight; y += 100) {
        const s = document.createElement("span"); s.textContent = y; s.style.top = y + "px"; ry.append(s);
      }
    };
    labels();
    addEventListener("resize", labels);

    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = hero.getBoundingClientRect();
      const x = Math.round(e.clientX - r.left), y = Math.round(e.clientY - r.top);
      gx.style.transform = mx.style.transform = `translateX(${x}px)`;
      gy.style.transform = my.style.transform = `translateY(${y}px)`;
      ox.textContent = x; oy.textContent = y;
      hero.classList.add("is-pointing");
    });
    hero.addEventListener("pointerleave", () => hero.classList.remove("is-pointing"));
  }

  /* ---------- contact title reacts the same way ---------- */
  const stretchTitle = $("[data-stretch]");
  let contactType = { measure() {} };
  if (stretchTitle) {
    split(stretchTitle);
    const chars = $$(".ch", stretchTitle);
    chars[chars.length - 1].classList.add("accent");
    $$(".word", stretchTitle).forEach((w) => w.setAttribute("aria-hidden", "true"));
    contactType = stretchy(stretchTitle, stretchTitle.closest("section"), { minW: 80, maxW: 140, minG: 700, maxG: 900, wave: false });
  }

  /* ---------- statement lights up word by word as it scrolls past ---------- */
  const scrub = $("[data-scrub]");
  let words = [];
  if (scrub) {
    const accent = new Set(["feel", "320", "pixels", "wide."]);
    const text = scrub.textContent.trim().split(/\s+/);
    scrub.textContent = "";
    text.forEach((w, i) => {
      const s = document.createElement("span");
      s.className = "w" + (accent.has(w) ? " em" : "");
      s.textContent = w;
      scrub.append(s, i < text.length - 1 ? " " : "");
    });
    words = $$(".w", scrub);
    if (reduce) words.forEach((w) => w.classList.add("lit"));
  }

  /* ---------- project cards stack while scrolling (when they fit on screen) ---------- */
  const projects = $$(".project");
  const fitStack = () => {
    const fits = !reduce && innerWidth > 960 && projects.every((p) => p.offsetHeight + 150 < innerHeight);
    root.classList.toggle("can-stack", fits);
    if (!fits) projects.forEach((p) => p.style.setProperty("--cover", 0));
  };
  fitStack();
  addEventListener("resize", fitStack);

  /* ---------- one scroll loop: progress bar, statement, stack, active nav ---------- */
  const navLinks = $$(".nav a");
  const sections = navLinks.map((a) => $(a.getAttribute("href")));
  const update = () => {
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty("--scroll", max > 0 ? (scrollY / max).toFixed(4) : 0);

    if (words.length && !reduce) {
      const r = scrub.getBoundingClientRect();
      const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.25), 0, 1);
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("lit", i < lit));
    }

    if (root.classList.contains("can-stack")) {
      for (let i = 0; i < projects.length - 1; i++) {
        const a = projects[i].getBoundingClientRect(), b = projects[i + 1].getBoundingClientRect();
        projects[i].style.setProperty("--cover", clamp((a.bottom - b.top) / a.height, 0, 1).toFixed(3));
      }
    }

    let current = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    navLinks.forEach((a, i) => (i === current ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
  };
  let scrollRaf = 0;
  const onScroll = () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; update(); }); };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { onScroll(); heroType.measure(); contactType.measure(); });
  update();

  /* ---------- reveal: only things below the fold at load are hidden, and only until they arrive ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.remove("pending");
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    $$("[data-reveal]").forEach((el) => {
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("pending"); io.observe(el); }
    });
  }

  /* ---------- previews run only while on screen ---------- */
  const tickers = [];
  let ticking = 0;
  const tick = (t) => {
    let any = false;
    tickers.forEach(([v, fn]) => { if (v.classList.contains("is-playing")) { fn(t); any = true; } });
    ticking = any ? requestAnimationFrame(tick) : 0;
  };
  const wake = () => { if (!ticking) ticking = requestAnimationFrame(tick); };
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("is-playing", e.isIntersecting && !reduce));
    wake();
  }, { threshold: 0.15 });
  $$("[data-visual]").forEach((v) => vio.observe(v));

  if (canHover && !reduce) {
    $$("[data-tilt]").forEach((v) => {
      const f = v.firstElementChild;
      v.addEventListener("pointermove", (e) => {
        const r = v.getBoundingClientRect();
        f.style.setProperty("--ry", `${(((e.clientX - r.left) / r.width) - 0.5) * 10}deg`);
        f.style.setProperty("--rx", `${(((e.clientY - r.top) / r.height) - 0.5) * -8}deg`);
      });
      v.addEventListener("pointerleave", () => { f.style.setProperty("--rx", "0deg"); f.style.setProperty("--ry", "0deg"); });
    });
  }

  // Radar chart shared by the Kotodama and Solo Leveling previews; returns a setter for new values.
  function radar(svg, { cx, cy, r, labels, values, stroke, fill, grid, text, size }) {
    const n = labels.length;
    const pt = (i, k) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k];
    };
    const poly = (k) => labels.map((_, i) => pt(i, Array.isArray(k) ? k[i] : k).map((x) => x.toFixed(1)).join(",")).join(" ");
    svg.innerHTML =
      [1, 0.66, 0.33].map((k) => `<polygon points="${poly(k)}" fill="none" stroke="${grid}" stroke-width=".8"/>`).join("") +
      labels.map((l, i) => {
        const [x, y] = pt(i, 1.24);
        return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${text}" font-size="${size}" font-family="Geist Mono, monospace" text-anchor="middle" dominant-baseline="middle">${l}</text>`;
      }).join("") +
      `<polygon class="shape" points="${poly(values)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`;
    const shape = $(".shape", svg);
    return (vals) => shape.setAttribute("points", poly(vals));
  }

  /* Kotodama: a reading quiz that answers itself, plus heatmap and radar */
  const kd = $(".kd");
  if (kd) {
    const visual = kd.closest("[data-visual]");
    const heat = $("[data-kd-heat]", kd);
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 112; i++) {
      const c = document.createElement("i");
      const r = rnd();
      c.dataset.l = i > 104 ? 3 + (i % 2) : r < 0.22 ? 0 : r < 0.48 ? 1 : r < 0.72 ? 2 : r < 0.9 ? 3 : 4;
      heat.append(c);
    }
    radar($("[data-kd-radar]", kd), {
      cx: 60, cy: 54, r: 31, size: 6.5,
      labels: ["Kana", "Kanji", "Words", "Phrases", "Sentences", "Grammar"],
      values: [0.96, 0.58, 0.74, 0.5, 0.38, 0.62],
      stroke: "#ef4c62", fill: "rgb(200 16 46 / .28)", grid: "rgb(255 255 255 / .12)", text: "#a8a39b",
    });

    const items = [
      ["水", "みず", ["ひ", "やま", "き"], "Kanji"],
      ["火", "ひ", ["みず", "つち", "かぜ"], "Kanji"],
      ["言葉", "ことば", ["こころ", "ことり", "たまご"], "Words"],
      ["山", "やま", ["かわ", "き", "そら"], "Kanji"],
      ["猫", "ねこ", ["いぬ", "とり", "さかな"], "Words"],
      ["霊", "れい", ["たま", "ゆめ", "かみ"], "Kanji"],
    ];
    const prompt = $("[data-kd-prompt]", kd), set = $("[data-kd-set]", kd), bar = $("[data-kd-progress]", kd);
    const opts = $$("[data-kd-options] span", kd);
    let k = 0, phase = 0, last = 0;
    const show = () => {
      const [q, a, wrong, label] = items[k];
      const choices = [a, ...wrong];
      const turn = k % 4; // put the answer in a different slot each time
      choices.push(...choices.splice(0, turn));
      prompt.textContent = q;
      set.textContent = label;
      opts.forEach((o, j) => { o.textContent = choices[j]; o.classList.remove("ok"); });
    };
    show();
    tickers.push([visual, (t) => {
      if (!last) last = t;
      const dt = t - last;
      if (phase === 0 && dt > 1100) {
        opts.find((o) => o.textContent === items[k][1]).classList.add("ok");
        bar.style.width = `${((k + 1) / items.length) * 100}%`;
        phase = 1;
      } else if (phase === 1 && dt > 2300) {
        prompt.classList.add("swap");
        phase = 2;
      } else if (phase === 2 && dt > 2600) {
        k = (k + 1) % items.length;
        if (k === 0) bar.style.width = "0%";
        show();
        prompt.classList.remove("swap");
        phase = 0;
        last = t;
      }
    }]);
  }

  /* Solo Leveling: the muscle-volume radar shifts between two weeks */
  const sl = $("[data-sl-radar]");
  if (sl) {
    const visual = sl.closest("[data-visual]");
    const weeks = [[0.82, 0.64, 0.9, 0.55, 0.7, 0.48], [0.6, 0.86, 0.66, 0.78, 0.52, 0.72]];
    const set = radar(sl, {
      cx: 100, cy: 88, r: 56, size: 9.5,
      labels: ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"],
      values: weeks[0],
      stroke: "#ff7a2a", fill: "rgb(255 95 26 / .25)", grid: "rgb(255 255 255 / .1)", text: "#8e8e95",
    });
    let from = 0, t0 = 0;
    tickers.push([visual, (t) => {
      if (!t0) t0 = t;
      const k = clamp((t - t0 - 1600) / 1200, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      set(weeks[from].map((v, i) => lerp(v, weeks[1 - from][i], e)));
      if (k === 1) { from = 1 - from; t0 = t; }
    }]);
  }

  /* PriceTrack: confirmed prices outrank unconfirmed ones, and a re-check finds a drop */
  const offers = $("[data-pt-offers]");
  if (offers) {
    const visual = offers.closest("[data-visual]");
    const note = $("[data-pt-note]"), checked = $("[data-pt-checked]"), chart = $("[data-pt-chart]");
    const base = [["Newegg", 334.5], ["Walmart", 339], ["Best Buy", 348], ["Target", 349.99]];
    const scenes = [
      { note: "Matched across 5 stores by model number", ago: "2 min", offers: [["Amazon", 329.99, "≈ unconfirmed"], ...base], history: [352, 349.99, 349.99, 346, 341, 339, 336, 334.5] },
      { note: "Amazon price confirmed by exact ASIN lookup", ago: "1 min", offers: [["Amazon", 329.99, "confirmed"], ...base], history: [352, 349.99, 349.99, 346, 341, 339, 336, 334.5, 329.99] },
      { note: "Price drop found on the background re-check", ago: "a moment", drop: "Walmart", offers: [["Amazon", 329.99, "confirmed"], ["Newegg", 334.5], ["Walmart", 318, "−$21.00"], ["Best Buy", 348], ["Target", 349.99]], history: [352, 349.99, 349.99, 346, 341, 339, 336, 334.5, 329.99, 318] },
    ];
    const rows = {};
    const line = $(".pt-line", chart), area = $(".pt-area", chart);
    const drawChart = (h) => {
      const lo = Math.min(...h) - 6, hi = Math.max(...h) + 4;
      const pts = h.map((p, i) => [(i / (h.length - 1)) * 240, 56 - ((p - lo) / (hi - lo)) * 56]);
      const d = "M" + pts.map((p) => p.map((x) => x.toFixed(1)).join(" ")).join(" L");
      line.setAttribute("d", d);
      area.setAttribute("d", `${d} L240 56 L0 56 Z`);
      if (reduce) return; // previews never play with reduced motion, so the draw-in would stay hidden
      chart.classList.remove("draw");
      void chart.getBoundingClientRect();
      chart.classList.add("draw");
    };
    const render = (scene) => {
      const before = new Map(Object.values(rows).map((li) => [li, li.getBoundingClientRect().top]));
      const unconfirmed = (o) => (o[2] && o[2].startsWith("≈") ? 1 : 0);
      const ranked = [...scene.offers].sort((a, b) => unconfirmed(a) - unconfirmed(b) || a[1] - b[1]);
      ranked.forEach(([store, price, tag], i) => {
        const li = rows[store] || (rows[store] = document.createElement("li"));
        li.className = (i === 0 ? "best" : "") + (store === scene.drop ? " drop" : "");
        li.innerHTML = `<span class="store">${store}</span>${i === 0 ? '<span class="badge">Best price</span>' : ""}${tag ? `<em>${tag}</em>` : ""}<b>$${price.toFixed(2)}</b>`;
        offers.append(li);
      });
      if (!reduce) {
        before.forEach((top, li) => {
          const dy = top - li.getBoundingClientRect().top;
          if (Math.abs(dy) > 1) li.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 700, easing: "cubic-bezier(.16,1,.3,1)" });
        });
      }
      note.textContent = scene.note;
      checked.textContent = scene.ago;
      drawChart(scene.history);
    };
    let s = 0, last = 0;
    render(scenes[0]);
    tickers.push([visual, (t) => {
      if (!last) last = t;
      if (t - last > 3200) { s = (s + 1) % scenes.length; render(scenes[s]); last = t; }
    }]);
  }

  /* ---------- Number Link, playable ---------- */
  const nl = $("[data-nl]");
  if (nl && window.NumberLink) {
    const NL = window.NumberLink;
    // Clue i is number i + 1. tests/numberlink.test.js proves this layout has exactly one solution.
    const CLUES = [[0, 0], [1, 1], [3, 1], [0, 3], [2, 3], [3, 3], [4, 2]];
    const LAST = CLUES.length;
    const board = $("[data-nl-board]", nl), status = $("[data-nl-status]", nl), fill = $("[data-nl-fill]", nl);
    let state = NL.create(5, CLUES), t0 = 0, done = false, drawing = false;

    const cells = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const d = document.createElement("div");
        d.className = "nl-cell";
        const n = NL.clueAt(state, [r, c]);
        if (n) d.innerHTML = `<span class="nl-end">${n}</span>`;
        board.append(d);
        cells.push(d);
      }
    }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 5 5");
    svg.setAttribute("class", "nl-paths");
    svg.setAttribute("aria-hidden", "true");
    board.append(svg);

    const render = () => {
      const next = NL.reached(state) + 1;
      cells.forEach((d, i) => {
        d.classList.remove("on", "next");
        if (!done && NL.clueAt(state, [Math.floor(i / 5), i % 5]) === next) d.classList.add("next");
      });
      state.path.forEach(([r, c]) => cells[r * 5 + c].classList.add("on"));
      svg.innerHTML = state.path.length > 1 ? `<polyline points="${state.path.map(([r, c]) => `${c + 0.5},${r + 0.5}`).join(" ")}"/>` : "";
      fill.textContent = `${state.path.length} / 25 squares`;
      if (done) return;
      status.textContent = !t0 ? `Start on 1, go through every number to ${LAST}`
        : next > LAST ? "Every square has to be filled" : `Next: ${next}`;
    };
    const cellAt = (e) => {
      const r = board.getBoundingClientRect();
      return [clamp(Math.floor(((e.clientY - r.top) / r.height) * 5), 0, 4), clamp(Math.floor(((e.clientX - r.left) / r.width) * 5), 0, 4)];
    };
    const finish = () => {
      done = true;
      drawing = false;
      nl.classList.add("solved");
      status.textContent = `Solved in ${((performance.now() - t0) / 1000).toFixed(1)} s`;
    };

    board.addEventListener("pointerdown", (e) => {
      if (done || !NL.start(state, cellAt(e))) return;
      drawing = true;
      board.setPointerCapture(e.pointerId);
      if (!t0) t0 = performance.now();
      render();
    });
    board.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      const [tr, tc] = cellAt(e);
      let moved = false;
      // Walk one square at a time toward the pointer so fast drags don't skip squares.
      for (let guard = 0; guard < 10; guard++) {
        const [r, c] = state.path[state.path.length - 1];
        if (r === tr && c === tc) break;
        const step = Math.abs(tr - r) >= Math.abs(tc - c) ? [r + Math.sign(tr - r), c] : [r, c + Math.sign(tc - c)];
        if (!NL.extend(state, step)) break;
        moved = true;
      }
      if (!moved) return;
      if (NL.solved(state)) finish();
      render();
    });
    const end = () => { drawing = false; };
    board.addEventListener("pointerup", end);
    board.addEventListener("pointercancel", end);
    $("[data-nl-reset]", nl).addEventListener("click", () => {
      state = NL.create(5, CLUES); t0 = 0; done = false;
      nl.classList.remove("solved");
      render();
    });
    render();
  }

  /* ---------- palette picker ---------- */
  const pToggle = $(".palette-toggle"), pMenu = $("#palette-menu");
  if (pToggle && pMenu) {
    const radios = $$('input[name="palette"]', pMenu);
    const themeMeta = $('meta[name="theme-color"]'), icon = $('link[rel="icon"]');
    const sync = () => {
      const current = root.dataset.palette || "iris";
      radios.forEach((r) => { r.checked = r.value === current; });
      const cs = getComputedStyle(root);
      const ink = cs.getPropertyValue("--ink").trim(), accent = cs.getPropertyValue("--accent").trim();
      themeMeta.content = ink;
      icon.href = "data:image/svg+xml," + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${ink}"/><path d="M24 15v33h19" fill="none" stroke="${accent}" stroke-width="7"/></svg>`);
    };
    const apply = (name) => {
      if (name === "iris") delete root.dataset.palette; else root.dataset.palette = name;
      try { localStorage.setItem("palette", name); } catch { /* private mode: the choice just isn't remembered */ }
      sync();
    };
    radios.forEach((r) => r.addEventListener("change", () => {
      if (reduce || !document.startViewTransition) { apply(r.value); return; }
      // The new palette grows out of the option that was picked.
      const box = r.closest("label").getBoundingClientRect();
      const x = box.left + box.width / 2, y = box.top + box.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(() => apply(r.value)).ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: "cubic-bezier(.65, 0, .35, 1)", pseudoElement: "::view-transition-new(root)" });
      }).catch(() => {});
    }));

    const open = (v) => {
      pMenu.hidden = !v;
      pToggle.setAttribute("aria-expanded", String(v));
      if (v) (radios.find((r) => r.checked) || radios[0]).focus({ preventScroll: true });
    };
    pToggle.addEventListener("click", () => open(pMenu.hidden));
    document.addEventListener("click", (e) => { if (!pMenu.hidden && !e.target.closest(".palette")) open(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !pMenu.hidden) { open(false); pToggle.focus(); } });
    sync();
  }

  /* ---------- copy email ---------- */
  $$("[data-copy]").forEach((b) => {
    const label = b.textContent;
    b.setAttribute("aria-live", "polite");
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        b.textContent = "Copied";
      } catch {
        const range = document.createRange();
        range.selectNodeContents($(".email"));
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        b.textContent = "Selected";
      }
      setTimeout(() => { b.textContent = label; }, 2000);
    });
  });

  /* ---------- Inspect mode: DevTools' element picker, for this page ---------- */
  const toggle = $(".inspect-toggle");
  if (toggle) {
    const layer = document.createElement("div");
    layer.className = "inspector";
    layer.setAttribute("aria-hidden", "true");
    layer.hidden = true;
    layer.innerHTML = '<div class="bm bm-margin"></div><div class="bm bm-padding"></div><div class="bm bm-content"></div><div class="bm-tip"></div>';
    document.body.append(layer);
    const [mBox, pBox, cBox, tip] = layer.children;
    let on = false, target = null, raf = 0;

    const hex = (c) => {
      const m = c.startsWith("rgb") && c.match(/[\d.]+/g);
      return m ? "#" + m.slice(0, 3).map((x) => Math.round(+x).toString(16).padStart(2, "0")).join("").toUpperCase() : c;
    };
    const place = (el, x, y, w, h, widths) => {
      Object.assign(el.style, { transform: `translate(${x}px, ${y}px)`, width: `${Math.max(0, w)}px`, height: `${Math.max(0, h)}px` });
      if (widths) el.style.borderWidth = widths.map((v) => `${v}px`).join(" ");
    };
    const draw = () => {
      raf = 0;
      if (!on || !target) return;
      const r = target.getBoundingClientRect();
      const cs = getComputedStyle(target);
      const side = (p) => ["Top", "Right", "Bottom", "Left"].map((s) => Math.max(0, parseFloat(cs[p.replace("$", s)]) || 0));
      const m = side("margin$"), b = side("border$Width"), p = side("padding$");
      place(mBox, r.left - m[3], r.top - m[0], r.width + m[1] + m[3], r.height + m[0] + m[2], m);
      place(pBox, r.left + b[3], r.top + b[0], r.width - b[1] - b[3], r.height - b[0] - b[2], p);
      place(cBox, r.left + b[3] + p[3], r.top + b[0] + p[0], r.width - b[1] - b[3] - p[1] - p[3], r.height - b[0] - b[2] - p[0] - p[2]);

      const tag = target.tagName.toLowerCase();
      const cls = [...target.classList].slice(0, 2).map((c) => `.${c}`).join("");
      const color = hex(cs.color);
      tip.innerHTML =
        `<div><span class="tip-tag">${tag}<span>${target.id ? "#" + target.id : ""}${cls}</span></span><span class="tip-dims">${r.width.toFixed(1)} × ${r.height.toFixed(1)}</span></div>` +
        `<div class="tip-row">Color <b><i class="sw" style="background:${cs.color}"></i>${color}</b></div>` +
        `<div class="tip-row">Font <b>${Math.round(parseFloat(cs.fontSize))}px ${cs.fontFamily.split(",")[0].replace(/["']/g, "")}</b></div>`;
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      const ty = r.top - th - 8 >= 8 ? r.top - th - 8 : Math.min(r.bottom + 8, innerHeight - th - 8);
      tip.style.transform = `translate(${clamp(r.left, 8, innerWidth - tw - 8)}px, ${ty}px)`;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const set = (v) => {
      on = v;
      toggle.setAttribute("aria-pressed", String(v));
      root.classList.toggle("inspecting", v);
      layer.hidden = !v || !target;
      if (!v) target = null;
    };

    toggle.addEventListener("click", () => set(!on));
    addEventListener("pointermove", (e) => {
      if (!on) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el === target || el === root || el === document.body) return;
      target = el;
      layer.hidden = false;
      schedule();
    }, { passive: true });
    addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("pointerleave", () => { if (on) layer.hidden = true; });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && on) set(false); });
    // Like DevTools, a click picks the element and ends the mode instead of following links.
    addEventListener("click", (e) => {
      if (!on || e.target.closest(".inspect-toggle")) return;
      e.preventDefault();
      e.stopPropagation();
      set(false);
    }, true);
  }
})();
