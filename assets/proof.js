/* Student results – shared by the main page (results carousel + form step) and /confirmed.
   Add, remove or reorder students here. Image paths are relative to assets/proof/. */
const PROOF_DATA = [
  { name: "Felix", result: "$12k USD / month", img: "felix.jpg", overlay: "felix-call.png" },
  { name: "Ali", result: "Monetized in 45 days", img: "ali.jpg" },
  { name: "Caleb", result: "$1,408 in 7 days", img: "caleb.png" },
  { name: "Ethan", result: "84 million views", img: "ethan.png" },
  { name: "Gabriel", result: "$7.9k / month", img: "gabriel.png" },
  { name: "Jax", result: "$8,000 / month", img: "jax.png" },
  { name: "Jibrail", result: "$2,653 in 30 days", img: "jibrail.png" },
  { name: "Lucas", result: "21 million views", img: "lucas.png" },
  { name: "Shani", result: "$6,691 in a single day", img: "shani.jpg" },
  { name: "Ripley", result: "$258 per day", img: "ripley.jpg" },
];

// The student list with image paths resolved against `dir` (e.g. "assets/proof/" or "../assets/proof/").
function proofList(dir) {
  return PROOF_DATA.map((p) => ({ ...p, img: dir + p.img, overlay: p.overlay && dir + p.overlay }));
}

/* Builds the carousel into the markup below and wires up the arrows, counter and enlarge lightbox:
     #proof-track, #proof-thumb, #proof-count, #proof-prev, #proof-next, #lightbox */
function mountProofCarousel(list) {
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const track = document.getElementById("proof-track");
  const thumb = document.getElementById("proof-thumb");
  const count = document.getElementById("proof-count");
  const prev = document.getElementById("proof-prev");
  const next = document.getElementById("proof-next");
  const lightbox = document.getElementById("lightbox");

  track.innerHTML = list
    .map(
      (p) => `<article class="proof-card">
        <header><b>${esc(p.name)}</b> · ${esc(p.result)}</header>
        <div class="proof-img">
          <img src="${esc(p.img)}" alt="${esc(p.name)}: ${esc(p.result)}" loading="lazy" onerror="this.remove()" />
          <span class="ph">${esc(p.img)}</span>
          ${p.overlay ? `<img class="ov" src="${esc(p.overlay)}" alt="" loading="lazy" />` : ""}
          <button type="button" class="proof-zoom" data-img="${esc(p.img)}" aria-label="Enlarge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>
          </button>
        </div>
      </article>`
    )
    .join("");

  const cardStep = () => {
    const c = track.children;
    return c.length > 1 ? c[1].offsetLeft - c[0].offsetLeft : track.clientWidth;
  };
  function update() {
    const max = track.scrollWidth - track.clientWidth;
    const atEnd = track.scrollLeft >= max - 2;
    const i = atEnd ? list.length - 1 : Math.round(track.scrollLeft / cardStep());
    count.textContent = `${i + 1} / ${list.length}`;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = atEnd;
    const w = Math.max(track.clientWidth / track.scrollWidth, 0.1) * 100;
    thumb.style.width = `${w}%`;
    thumb.style.left = `${max > 0 ? (track.scrollLeft / max) * (100 - w) : 0}%`;
  }
  prev.addEventListener("click", () => track.scrollBy({ left: -cardStep() }));
  next.addEventListener("click", () => track.scrollBy({ left: cardStep() }));
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();

  // Enlarge buttons open the screenshot full-screen
  document.addEventListener("click", (e) => {
    const z = e.target.closest(".proof-zoom");
    if (!z) return;
    lightbox.querySelector("img").src = z.dataset.img;
    lightbox.hidden = false;
  });
  lightbox.addEventListener("click", () => (lightbox.hidden = true));
  document.addEventListener("keydown", (e) => e.key === "Escape" && (lightbox.hidden = true));
}
