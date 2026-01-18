/* main.js — FULL DROP-IN (matrix header + 3D matrix clickable nodes + modal with link + modal freeze) */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Main JS loaded");

  // =========================
  // 1) MATRIX MORPH HEADER
  // =========================
  const headerEl = document.querySelector("[data-matrix]");
  if (headerEl) {
    let phrases = [];
    try {
      phrases = JSON.parse(headerEl.getAttribute("data-phrases") || "[]");
    } catch (e) {
      console.error("Invalid data-phrases JSON", e);
    }

    if (phrases.length) {
      const glyphs =
        "アイウエオカキクケコサシスセソタチツテトナニヌネノ" +
        "ハヒフヘホマミムメモヤユヨラリルレロワヲン" +
        "0123456789" +
        "⌁⌇⌂⌄⌆⌈⌉⌊⌋⌐⌑⌒⍜⍝⍟⎈⏣⏥⏦⏧";

      const randomGlyph = () => glyphs[Math.floor(Math.random() * glyphs.length)];
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      async function morphTo(target, opts = {}) {
        const { steps = 22, frameMs = 60, settleEvery = 3 } = opts;

        const from = headerEl.textContent || "";
        const maxLen = Math.max(from.length, target.length);

        const a = from.padEnd(maxLen, " ");
        const b = target.padEnd(maxLen, " ");
        const locked = new Array(maxLen).fill(false);

        for (let s = 0; s < steps; s++) {
          for (let i = 0; i < maxLen; i++) {
            if (locked[i]) continue;
            const lockChance = (s / steps) * 0.9;
            if (Math.random() < lockChance && s % settleEvery === 0) locked[i] = true;
          }

          let out = "";
          for (let i = 0; i < maxLen; i++) {
            if (locked[i]) out += b[i];
            else out += (b[i] === " ") ? " " : (Math.random() < 0.10 ? a[i] : randomGlyph());
          }

          headerEl.textContent = out;
          await sleep(frameMs);
        }

        headerEl.textContent = target;
      }

      (async function loop() {
        let idx = 0;
        await sleep(1200);

        while (true) {
          idx = (idx + 1) % phrases.length;
          await morphTo(phrases[idx]);
          await sleep(2400);
        }
      })();
    }
  }

  // =========================
  // 2) CONNECTED 3D MATRIX
  // =========================
  const mount = document.querySelector("[data-matrix3d]");
  if (!mount) return;

  if (!window.THREE) {
    console.error("Three.js not loaded. Check base.html: three.min.js must be before main.js");
    return;
  }

  // IMPORTANT: modal + tip must exist in your HTML (home.html)
  const tip = document.querySelector("[data-matrix-tip]");
  const modal = document.querySelector("[data-matrix-modal]");
  const modalContent = document.querySelector("[data-matrix-modal-content]");
  const modalCloseEls = document.querySelectorAll("[data-matrix-modal-close]");

  const setTip = (html) => {
    if (!tip) return;
    if (!html) {
      tip.classList.remove("on");
      tip.innerHTML = "";
      return;
    }
    tip.innerHTML = html;
    tip.classList.add("on");
  };

  const openModal = (html) => {
    if (!modal || !modalContent) return;
    modalContent.innerHTML = html;
    modal.classList.add("on");
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("on");
  };

  // -------------------------
  // Modal HTML helpers
  // -------------------------
  const escapeHTML = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  // Supports node fields:
  // { title, desc, tags[], link } OR your older { title, text }
  const buildModalHTML = (node) => {
    const title = escapeHTML(node?.title || "");
    const desc = escapeHTML(node?.desc || node?.text || "");
    const tags = Array.isArray(node?.tags) ? node.tags : [];
    const link = node?.link ? String(node.link) : "";

    const tagsHtml = tags.length
      ? `<div class="matrix-modal__tags">
          ${tags.map(t => `<span class="matrix-tag">${escapeHTML(t)}</span>`).join("")}
         </div>`
      : "";

    const linkHtml = link
      ? `<div class="matrix-modal__linkwrap">
          <a class="matrix-modal__link" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">
            Open project ↗
          </a>
          <div class="matrix-modal__url">${escapeHTML(link)}</div>
         </div>`
      : "";

    return `
      <strong>${title}</strong><br>
      <span class="muted">${desc}</span>
      ${tagsHtml}
      ${linkHtml}
    `;
  };

  // Freeze control
  let paused = false;

  function pause() {
    paused = true;
    setTip("");
    mount.style.cursor = "default";
  }

  function resume() {
    paused = false;
  }

  // Close modal handlers
  modalCloseEls.forEach((el) =>
    el.addEventListener("click", () => {
      closeModal();
      resume();
    })
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("on")) {
      closeModal();
      resume();
    }
  });

  // Scene setup
  const scene = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  mount.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  const group = new THREE.Group();
  scene.add(group);

  // Tunables
  const POINTS = 90;
  const RANGE = 7.0;
  const LINK_DIST = 2.2;

  // Node motion arrays
  const positions = new Float32Array(POINTS * 3);
  const velocities = new Float32Array(POINTS * 3);

  for (let i = 0; i < POINTS; i++) {
    const ix = i * 3;
    positions[ix + 0] = (Math.random() * 2 - 1) * RANGE;
    positions[ix + 1] = (Math.random() * 2 - 1) * (RANGE * 0.6);
    positions[ix + 2] = (Math.random() * 2 - 1) * RANGE;

    velocities[ix + 0] = (Math.random() * 2 - 1) * 0.006;
    velocities[ix + 1] = (Math.random() * 2 - 1) * 0.006;
    velocities[ix + 2] = (Math.random() * 2 - 1) * 0.006;
  }

  // Base points cloud (bigger nodes)
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const pointsMat = new THREE.PointsMaterial({
    size: 0.10,
    transparent: true,
    opacity: 0.9,
  });

  const points = new THREE.Points(pointsGeo, pointsMat);
  group.add(points);

  // Lines
  const maxLinks = POINTS * 6;
  const linePositions = new Float32Array(maxLinks * 2 * 3);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.35 });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lines);

  // Special clickable nodes (now supports desc/tags/link)
  const specialConfig = [
    {
      idx: 5,
      color: 0xffd000,
      title: "EagleVision",
      desc: "Multi-frame ALPR recovery for Kenyan plates. Fusion + probabilistic OCR.",
      tags: ["Computer Vision", "ALPR", "Kenya"],
    },
    {
      idx: 18,
      color: 0x22c55e,
      title: "HAM Study App",
      desc: "Django quiz platform with images + Cloud SQL Postgres on GAE.",
      tags: ["RSK", "HAM radio", "Kenya Radio Society"],
      link: "https://rsk-ham-study.appspot.com/",
    },
    {
      idx: 41,
      color: 0xff7a18,
      title: "RF / Field",
      desc: "Antennas, SDR scanning, LoRa nodes, embedded prototypes.",
      tags: ["RF", "SDR", "LoRa", "Embedded"],
    },
    {
      idx: 63,
      color: 0x60a5fa,
      title: "Ops & Build",
      desc: "Pragmatic systems: constraints, deployment, reliability.",
      tags: ["Deployment", "Reliability", "Systems"],
    },
  ];

  const specialMeshes = [];
  const sphereGeo = new THREE.SphereGeometry(0.18, 18, 18);

  for (const s of specialConfig) {
    const i = s.idx * 3;
    if (i + 2 >= positions.length) continue;

    const mat = new THREE.MeshBasicMaterial({
      color: s.color,
      transparent: true,
      opacity: 0.95,
    });

    const m = new THREE.Mesh(sphereGeo, mat);
    m.position.set(positions[i], positions[i + 1], positions[i + 2]);
    m.userData = { ...s, targetScale: 1.0 };
    group.add(m);
    specialMeshes.push(m);
  }

  // Resize
  function resize() {
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(mount);

  // Mouse parallax (rotation)
  let mx = 0, my = 0;

  // Raycasting
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(999, 999);

  function updateMouse(e) {
    const r = mount.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    mx = (x - 0.5) * 2;
    my = (y - 0.5) * 2;

    const nx = x * 2 - 1;
    const ny = -(y * 2 - 1);
    mouse.set(nx, ny);
  }

  mount.addEventListener("mousemove", (e) => {
    if (paused) return;
    updateMouse(e);
  });

  mount.addEventListener("mouseleave", () => {
    if (paused) return;
    mx = 0; my = 0;
    mouse.set(999, 999);
    setTip("");
    for (const m of specialMeshes) m.userData.targetScale = 1.0;
    mount.style.cursor = "default";
  });

  mount.addEventListener("click", () => {
    if (paused) return;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(specialMeshes, false);
    if (!hits.length) return;

    const hit = hits[0].object;
    pause();
    openModal(buildModalHTML(hit.userData));
  });

  function tick() {
    if (!paused) {
      // Move points
      for (let i = 0; i < POINTS; i++) {
        const ix = i * 3;
        positions[ix + 0] += velocities[ix + 0];
        positions[ix + 1] += velocities[ix + 1];
        positions[ix + 2] += velocities[ix + 2];

        const bx = RANGE, by = RANGE * 0.6, bz = RANGE;
        if (positions[ix + 0] > bx || positions[ix + 0] < -bx) velocities[ix + 0] *= -1;
        if (positions[ix + 1] > by || positions[ix + 1] < -by) velocities[ix + 1] *= -1;
        if (positions[ix + 2] > bz || positions[ix + 2] < -bz) velocities[ix + 2] *= -1;
      }
      pointsGeo.attributes.position.needsUpdate = true;

      // Glue special spheres to their indexed node positions
      for (const m of specialMeshes) {
        const i = m.userData.idx * 3;
        m.position.set(positions[i], positions[i + 1], positions[i + 2]);
      }

      // Build links
      let ptr = 0;
      let linksCount = 0;

      for (let i = 0; i < POINTS; i++) {
        const ia = i * 3;
        const ax = positions[ia + 0], ay = positions[ia + 1], az = positions[ia + 2];

        for (let j = i + 1; j < POINTS; j++) {
          const ib = j * 3;
          const dx = ax - positions[ib + 0];
          const dy = ay - positions[ib + 1];
          const dz = az - positions[ib + 2];
          const d2 = dx * dx + dy * dy + dz * dz;

          if (d2 < LINK_DIST * LINK_DIST) {
            linePositions[ptr++] = ax; linePositions[ptr++] = ay; linePositions[ptr++] = az;
            linePositions[ptr++] = positions[ib + 0]; linePositions[ptr++] = positions[ib + 1]; linePositions[ptr++] = positions[ib + 2];
            linksCount++;
            if (linksCount >= maxLinks) break;
          }
        }
        if (linksCount >= maxLinks) break;
      }

      lineGeo.setDrawRange(0, linksCount * 2);
      lineGeo.attributes.position.needsUpdate = true;

      // Hover special nodes -> bloom + tip + cursor
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(specialMeshes, false);

      for (const m of specialMeshes) m.userData.targetScale = 1.0;

      if (hits.length) {
        const hit = hits[0].object;
        hit.userData.targetScale = 2.2;
        setTip(`<strong>${escapeHTML(hit.userData.title)}</strong><br><span class="muted">Click to open</span>`);
        mount.style.cursor = "pointer";
      } else {
        setTip("");
        mount.style.cursor = "default";
      }

      // Smooth bloom
      for (const m of specialMeshes) {
        const cur = m.scale.x;
        const tgt = m.userData.targetScale;
        m.scale.setScalar(cur + (tgt - cur) * 0.15);
      }

      // Rotation drift (stops when paused)
      group.rotation.y += 0.0015;
      group.rotation.x = my * 0.06;
      group.rotation.y += mx * 0.02;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  tick();
});

// =========================
// 3) Visitor Geo/IP (single source of truth)
// =========================
fetch("/geoip/")
  .then((r) => r.json())
  .then((data) => {
    console.log("IP/Country:", data.ip, data.country);

    const ipEl = document.getElementById("visitor-ip");
    const countryEl = document.getElementById("visitor-country");

    const ip = data.ip ?? "unavailable";
    const country = data.country ?? "unknown location";

    if (ipEl) ipEl.textContent = ip;
    if (countryEl) countryEl.textContent = country;
  })
  .catch((err) => {
    console.error("GeoIP failed:", err);
    const ipEl = document.getElementById("visitor-ip");
    const countryEl = document.getElementById("visitor-country");
    if (ipEl) ipEl.textContent = "unavailable";
    if (countryEl) countryEl.textContent = "unknown location";
  });

  document.addEventListener("DOMContentLoaded", () => {
  const out = document.getElementById("gpt-output");
  const form = document.getElementById("gpt-form");
  const input = document.getElementById("gpt-input");
  if (!out || !form || !input) return;

  const println = (text, cls) => {
    const div = document.createElement("div");
    div.className = `terminal-line ${cls || ""}`;
    div.textContent = text;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  };

  println("type 'help' for ideas. (ex: 'summarize EagleVision', 'what should I build next?')", "terminal-bot");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;

    println(`❯ ${msg}`, "terminal-user");
    input.value = "";
    input.disabled = true;

    // quick local “help”
    if (msg.toLowerCase() === "help") {
      println("Try: 'list projects', 'explain ham study app', 'red-team EagleVision', 'suggest next features'", "terminal-bot");
      input.disabled = false;
      input.focus();
      return;
    }

    println("…", "terminal-bot");

    try {
      const res = await fetch("/api/gpt/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      // replace the last "…" line
      out.lastChild.textContent =
      data.reply ||
     (data.error ? `${data.error}${data.detail ? " — " + data.detail : ""}` : "No response");
    } catch (err) {
      out.lastChild.textContent = "Request failed.";
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
});
