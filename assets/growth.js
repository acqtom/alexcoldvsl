/* 180-day growth chart – views over time, money as milestones. Shared by the main page and the
   confirmation pages; needs the #growth-chart / #growth-tip markup. */
(function growthChart() {
  const svg = document.getElementById("growth-chart");
  const tip = document.getElementById("growth-tip");
  // [day, views in millions]; milestones carry the money label
  const MILESTONES = [
    { day: 30, views: 2, label: "Escaped Video Jail" },
    { day: 60, views: 10, label: "Monetized" },
    { day: 90, views: 25, label: "$5K / month" },
    { day: 120, views: 45, label: "$10K / month" },
    { day: 150, views: 70, label: "Second Channel" },
    { day: 180, views: 100, label: "$15–20K / month" },
  ];
  const POINTS = [[0, 0], ...MILESTONES.map((ms) => [ms.day, ms.views])];
  const DAYS = 180;
  const Y_TICKS = [0, 25, 50, 75, 100];
  const Y_MAX = 108;
  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Monotone cubic interpolation (Fritsch–Carlson) so the curve never dips between points
  const xs = POINTS.map((p) => p[0]), ys = POINTS.map((p) => p[1]);
  const d = xs.slice(1).map((x, i) => (ys[i + 1] - ys[i]) / (x - xs[i]));
  const m = xs.map((_, i) => (i === 0 ? d[0] : i === xs.length - 1 ? d[d.length - 1] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  function viewsAt(day) {
    let i = Math.min(xs.length - 2, xs.findIndex((x, k) => day <= xs[k + 1]));
    if (i < 0) i = xs.length - 2;
    const h = xs[i + 1] - xs[i], t = (day - xs[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  }
  const fmt = (v) => (v >= 10 ? Math.round(v) : v.toFixed(1)) + "M";
  const stage = (day) => {
    const hit = MILESTONES.filter((ms) => ms.day <= day).pop();
    return hit ? hit.label : "Finding your niche and posting daily";
  };

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent && parent.appendChild(n);
    return n;
  };

  let drawn = false;
  function render() {
    // Narrow screens get a full-size chart that scrolls sideways, so every label stays readable
    // Narrow screens draw the chart at desktop proportions (taller, with larger text) and scale it
    // down to fit, so it looks like the desktop chart with every label readable and nothing cut off.
    const fit = svg.parentElement.clientWidth < 600;
    const W = fit ? 760 : svg.parentElement.clientWidth;
    const H = fit ? 640 : 400;
    svg.classList.toggle("is-fit", fit);
    const small = false;
    const pad = fit ? { l: 84, r: 30, t: 24, b: 64 } : { l: 52, r: 28, t: 24, b: 40 };
    const X = (day) => pad.l + (day / DAYS) * (W - pad.l - pad.r);
    const Y = (v) => pad.t + (1 - v / Y_MAX) * (H - pad.t - pad.b);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = "";

    const defs = el("defs", {}, svg);
    const grad = el("linearGradient", { id: "growth-fill", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: "0%", "stop-color": "#1a5cff", "stop-opacity": 0.45 }, grad);
    el("stop", { offset: "100%", "stop-color": "#1a5cff", "stop-opacity": 0 }, grad);

    // grid + axes
    Y_TICKS.forEach((v) => {
      el("line", { class: v === 0 ? "base" : "grid", x1: pad.l, x2: W - pad.r, y1: Y(v), y2: Y(v) }, svg);
      el("text", { class: "tick", x: pad.l - (fit ? 14 : 10), y: Y(v) + (fit ? 8 : 4), "text-anchor": "end" }, svg).textContent = v === 0 ? "0" : v + "M";
    });
    (small ? [0, 60, 120, 180] : [0, 30, 60, 90, 120, 150, 180]).forEach((day) => {
      el("text", { class: "tick", x: X(day), y: H - pad.b + (fit ? 40 : 22), "text-anchor": day === 0 ? "start" : day === DAYS ? "end" : "middle" }, svg).textContent = fit && day ? String(day) : "Day " + day;
    });
    if (!small) el("text", { class: "axis-title", x: pad.l, y: pad.t - 10 }, svg).textContent = "Views";

    // curve + area
    let line = "";
    for (let day = 0; day <= DAYS; day += 1) line += (day ? "L" : "M") + X(day).toFixed(1) + "," + Y(viewsAt(day)).toFixed(1);
    const area = el("path", { d: `${line}L${X(DAYS)},${Y(0)}L${X(0)},${Y(0)}Z`, fill: "url(#growth-fill)" }, svg);
    const path = el("path", { class: "line", d: line }, svg);

    // milestones: drop line, pulsing ring, dot, money chip
    const marks = el("g", {}, svg);
    MILESTONES.forEach((ms, i) => {
      const cx = X(ms.day), cy = Y(ms.views);
      el("line", { class: "drop", x1: cx, x2: cx, y1: cy, y2: Y(0) }, marks);
      el("circle", { class: "ring", cx, cy, r: 7, style: `animation-delay:${i * 0.4}s` }, marks);
      el("circle", { class: "dot", cx, cy, r: 7 }, marks);

      const chip = el("g", { class: "chip" }, marks);
      const k = el("text", { class: "k" }, chip);
      k.textContent = "Day " + ms.day;
      const v = el("text", { class: "v" }, chip);
      v.textContent = ms.label;
      const w = Math.max(k.getComputedTextLength(), v.getComputedTextLength()) + (fit ? 32 : 24);
      const h = fit ? 66 : 48;
      // chips sit above each dot; the first leans left so it clears its neighbour
      // (on phones the second leans right too, clear of the first)
      let bx = i === 0 ? cx - w + 16 : fit && i === 1 ? cx - 16 : cx - w / 2;
      let by = cy - h - 18;
      // phones: lift the first label above the second so they don't overlap
      if (fit && i === 0) by = Y(MILESTONES[1].views) - 2 * h - 28;
      bx = Math.max(pad.l, Math.min(bx, W - pad.r - w));
      by = Math.max(0, by);
      el("rect", { x: bx, y: by, width: w, height: h, rx: 10 }, chip).parentNode.insertBefore(chip.lastChild, chip.firstChild);
      const ip = fit ? 16 : 12;
      k.setAttribute("x", bx + ip); k.setAttribute("y", by + (fit ? 26 : 19));
      v.setAttribute("x", bx + ip); v.setAttribute("y", by + (fit ? 53 : 38));
    });

    // hover layer: crosshair + focus dot + tooltip
    const cross = el("line", { class: "cross", y1: pad.t, y2: Y(0), visibility: "hidden" }, svg);
    const focus = el("circle", { class: "focus", r: 5, visibility: "hidden" }, svg);
    const hit = el("rect", { x: pad.l, y: 0, width: W - pad.l - pad.r, height: H, fill: "transparent" }, svg);
    const move = (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      const day = Math.max(0, Math.min(DAYS, Math.round(((px - pad.l) / (W - pad.l - pad.r)) * DAYS)));
      const v = viewsAt(day), cx = X(day), cy = Y(v);
      cross.setAttribute("x1", cx); cross.setAttribute("x2", cx);
      focus.setAttribute("cx", cx); focus.setAttribute("cy", cy);
      cross.setAttribute("visibility", "visible"); focus.setAttribute("visibility", "visible");
      tip.innerHTML = `<b>Day ${day}</b> · ${fmt(v)} views<br>${stage(day)}`;
      tip.hidden = false;
      const tw = tip.offsetWidth / 2;
      tip.style.left = Math.max(tw, Math.min((cx / W) * r.width, r.width - tw)) + "px";
      tip.style.top = (cy / H) * r.height + "px";
    };
    const leave = () => { cross.setAttribute("visibility", "hidden"); focus.setAttribute("visibility", "hidden"); tip.hidden = true; };
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerdown", move);
    hit.addEventListener("pointerleave", leave);

    // draw-in animation the first time the chart scrolls into view
    if (!drawn && !reduceMotion) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      area.style.opacity = 0;
      marks.style.opacity = 0;
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        drawn = true;
        path.style.transition = "stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)";
        area.style.transition = "opacity 1.2s ease .6s";
        marks.style.transition = "opacity .6s ease 1.4s";
        path.style.strokeDashoffset = 0;
        area.style.opacity = 1;
        marks.style.opacity = 1;
      }, { threshold: 0.35 });
      io.observe(svg);
    }
  }

  render();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { drawn = true; render(); }, 150); });
})();
