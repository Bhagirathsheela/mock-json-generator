// Animated explainer for the live-API feature. Loaded as a module (CSP-safe).
function fit() {
  const s = document.querySelector(".stage");
  const k = Math.min(window.innerWidth / 1280, window.innerHeight / 720, 1);
  s.style.transform = "scale(" + k + ")";
}
window.addEventListener("resize", fit);
fit();

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const scenes = { A: $("sceneA"), B: $("sceneB"), C: $("sceneC") };
const pills = [$("p1"), $("p2"), $("p3")];
const showScene = (k) => { for (const x in scenes) scenes[x].classList.toggle("show", x === k); };
const activePill = (i) => pills.forEach((p, n) => p.classList.toggle("on", n === i));

const codeLines = [
  '<span class="tok-com">// update record 3 — this actually persists</span>',
  '<span class="tok-fn">await</span> axios.<span class="tok-fn">patch</span>(url + <span class="tok-str">"/3"</span>, {',
  '  <span class="tok-key">name</span>: <span class="tok-str">"Neo"</span>',
  "});",
];

async function typeCode() {
  const el = $("codeB");
  el.innerHTML = "";
  for (let i = 0; i < codeLines.length; i++) {
    el.innerHTML += (i ? "\n" : "") + codeLines[i];
    await wait(420);
  }
}

async function loop() {
  while (true) {
    activePill(0); showScene("A");
    $("urlChip").classList.remove("show");
    await wait(900);
    $("pubBtn").classList.add("click");
    await wait(550); $("pubBtn").classList.remove("click");
    $("urlChip").classList.add("show");
    await wait(2400);

    activePill(1); showScene("B");
    $("okBadge").classList.remove("show");
    await wait(500);
    await typeCode();
    await wait(400);
    $("okBadge").classList.add("show");
    await wait(2200);

    activePill(2); showScene("C");
    $("nameC").textContent = "Carol";
    await wait(900);
    $("nameC").textContent = "Neo";
    $("rowC").classList.add("flash");
    await wait(2600);
    $("rowC").classList.remove("flash");
    await wait(300);
  }
}
loop();
