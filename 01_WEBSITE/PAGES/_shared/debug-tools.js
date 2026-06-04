/* ═══════════════════════════════════════════════════════════════════════════
   ENDURO DEBUG TOOLS  ·  debug-tools.js
   ───────────────────────────────────────────────────────────────────────────
   Drop one <script> tag at the bottom of any page in the SITE/ folder:

     <script src="PAGES/_shared/debug-tools.js"></script>

   or, from a sub-page (e.g. PAGES/projects.html):

     <script src="../_shared/debug-tools.js"></script>

   What loads:
     1. CSS            — HUD + Focus Box styles injected via <style> into <head>
     2. Debug HUD      — press D to toggle (bottom-right panel, scroll / section / anim data)
     3. Red Focus Box  — press R to toggle (moveable + resizable red outline overlay)

   Rulers live in viewport-lab.html — not in the page itself.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────────────────────
     1. INJECT CSS
     ───────────────────────────────────────────────────────────────────────── */
  const style = document.createElement("style");
  style.id = "enduro-debug-css";
  style.textContent = /* css */`
    /* ── HUD ─────────────────────────────────────────────────────── */
    #debug-hud #hud-step-row {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      flex-wrap: wrap;
    }
    #debug-hud #hud-step-row .lbl {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,0.55);
      white-space: nowrap;
    }
    #debug-hud .hud-step-btn {
      pointer-events: auto;
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.65);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 3px;
      padding: 2px 6px;
      font: inherit;
      font-size: 10px;
      cursor: pointer;
      outline: none;
    }
    #debug-hud .hud-step-btn:hover  { background: rgba(255,255,255,0.15); color: #fff; }
    #debug-hud .hud-step-btn.active { background: rgba(227,255,23,0.18); color: #e3ff17; border-color: #e3ff17; }
    #debug-hud #hud-scrub-row {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.15);
    }
    #debug-hud #hud-scrub-row .lbl {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,0.55);
      white-space: nowrap;
    }
    #debug-hud #hud-scrub {
      flex: 1;
      background: rgba(255,255,255,0.15);
      color: #e3ff17;
      border: 1px solid #e3ff17;
      border-radius: 3px;
      padding: 2px 6px;
      font: inherit;
      text-align: right;
      outline: none;
      -moz-appearance: textfield;
    }
    #debug-hud #hud-scrub:focus                     { background: rgba(227,255,23,0.12); }
    #debug-hud #hud-scrub::-webkit-inner-spin-button,
    #debug-hud #hud-scrub::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  `;
  document.head.appendChild(style);

  /* ─────────────────────────────────────────────────────────────────────────
     2. DEBUG HUD  (press D to toggle)
     ───────────────────────────────────────────────────────────────────────── */
  (function setupDebugHUD() {
    const hud = document.createElement("div");
    hud.id = "debug-hud";
    hud.style.cssText =
      "position:fixed;bottom:12px;right:12px;z-index:9999;" +
      "background:rgba(0,0,0,0.88);color:#fff;padding:10px 12px;" +
      "font:11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;" +
      "border-radius:8px;user-select:none;pointer-events:none;" +
      "min-width:300px;max-width:360px;opacity:0.93;";
    document.body.appendChild(hud);

    let visible = false;
    function setVisible(v) {
      visible = v;
      hud.style.display = v ? "block" : "none";
    }
    setVisible(false);
    window.__debugHudSetVisible = setVisible;

    document.addEventListener("keydown", (e) => {
      if (e.key !== "d" && e.key !== "D") return;
      const t = document.activeElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      setVisible(!visible);
    });

    const stepPresets = [
      { id: "1-10",    arrow: 1,   shift: 10  },
      { id: "25-50",   arrow: 25,  shift: 50  },
      { id: "50-150",  arrow: 50,  shift: 150 },
      { id: "150-250", arrow: 150, shift: 250 },
    ];
    let activeStep = stepPresets[2];

    const stepRow = document.createElement("div");
    stepRow.id = "hud-step-row";
    stepRow.innerHTML = '<span class="lbl">step</span>';
    const stepBtns = stepPresets.map((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hud-step-btn" + (p === activeStep ? " active" : "");
      btn.textContent = p.arrow + "/" + p.shift;
      btn.title = "↑/↓ ±" + p.arrow + " px · Shift+↑/↓ ±" + p.shift + " px";
      btn.addEventListener("click", () => {
        activeStep = p;
        stepBtns.forEach((b, i) => b.classList.toggle("active", stepPresets[i] === p));
        scrub.focus();
      });
      stepRow.appendChild(btn);
      return btn;
    });
    hud.appendChild(stepRow);

    const scrubRow = document.createElement("div");
    scrubRow.id = "hud-scrub-row";
    scrubRow.innerHTML = '<span class="lbl">jump · y</span>';
    const scrub = document.createElement("input");
    scrub.type = "number";
    scrub.id = "hud-scrub";
    scrub.value = String(window.scrollY);
    scrub.title = "type + Enter to jump · ↑ +1 · ↓ -1 · Shift ±10 · Esc to blur";
    scrubRow.appendChild(scrub);
    hud.appendChild(scrubRow);

    const hudBody = document.createElement("div");
    hudBody.id = "hud-body";
    hud.appendChild(hudBody);

    scrub.addEventListener("mousedown", () => {
      const wasFocused = document.activeElement === scrub;
      if (wasFocused) return;
      setTimeout(() => scrub.select(), 0);
    });
    scrub.addEventListener("focus", () => scrub.select());
    scrub.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
        ev.preventDefault();
        const step = ev.shiftKey ? activeStep.shift : activeStep.arrow;
        const dir  = ev.key === "ArrowUp" ? 1 : -1;
        const cur  = parseFloat(scrub.value) || 0;
        const next = Math.max(0, cur + dir * step);
        scrub.value = String(next);
        window.scrollTo({ top: next, behavior: "auto" });
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        const v = parseFloat(scrub.value);
        if (!isNaN(v)) window.scrollTo({ top: Math.max(0, v), behavior: "auto" });
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        scrub.blur();
      }
    });

    const sectionIds = ["hero", "services", "projects", "reviews", "process", "team"];

    const states = [
      { sel: "#services .services-grid", cls: "trigger",          label: "IOE.trigger" },
      { sel: "#services .services-grid", cls: "trigger-exit-up",  label: "IOE.exit-up" },
      { sel: "#projects .projects-grid", cls: "exit-up",          label: "FP.exit-up"  },
      { sel: "#reviews",                 cls: "in-view",          label: "REV.in-view" },
      { sel: "#process .process-sticky", cls: "contact-revealed", label: "PROC.contact"},
    ];
    const timers = new Map();
    function startWatching() {
      states.forEach((s) => {
        const el = document.querySelector(s.sel);
        if (!el) return;
        timers.set(s.label, el.classList.contains(s.cls) ? performance.now() : null);
        new MutationObserver(() => {
          const on = el.classList.contains(s.cls);
          const prev = timers.get(s.label);
          if (on && !prev) timers.set(s.label, performance.now());
          else if (!on && prev) timers.set(s.label, null);
        }).observe(el, { attributes: true, attributeFilter: ["class"] });
      });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startWatching);
    } else {
      startWatching();
    }

    const animSelectors = [
      ".reviews-top .section-tag",
      ".reviews-heading",
      ".reviews-cards .rc:nth-child(1)",
      ".reviews-cards .rc:nth-child(2)",
      ".reviews-cards .rc:nth-child(3)",
      ".reviews-marquee-frame",
      ".projects-top",
      ".projects-grid .project-card:nth-child(1)",
      ".projects-grid .project-card:nth-child(6)",
      ".projects-grid .project-card:nth-child(12)",
      ".services-top",
      ".services-grid .service-card:nth-child(1)",
      ".services-grid .service-card:nth-child(3)",
    ];

    function currentSection() {
      const center = window.innerHeight / 2;
      let containing = null, nearest = null, nearestDist = Infinity;
      for (const id of sectionIds) {
        const node = document.getElementById(id);
        if (!node) continue;
        const r = node.getBoundingClientRect();
        if (r.top <= center && r.bottom > center) {
          containing = { id, topY: r.top, h: r.height };
        }
        const dist = Math.min(Math.abs(r.top - center), Math.abs(r.bottom - center));
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = { id, topY: r.top, h: r.height, arrow: r.top > center ? "↓" : "↑" };
        }
      }
      if (containing) return containing;
      if (nearest) return { id: nearest.arrow + " " + nearest.id, topY: nearest.topY, h: nearest.h };
      return { id: "—", topY: 0, h: 0 };
    }

    const R = (n) => Math.round(n);

    function render() {
      if (!visible) return;
      const y   = window.scrollY;
      const x   = window.scrollX;
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const pct = max > 0 ? (y / max * 100).toFixed(1) : "0";
      const vw  = window.innerWidth;
      const vh  = window.innerHeight;
      const sec = currentSection();
      const deltaCenter = (vh / 2) - sec.topY;
      const onDark = document.body.classList.contains("nav-on-dark");
      const now = performance.now();

      const heroNode = document.getElementById("hero");
      let heroLine = "";
      if (heroNode) {
        const heroH = heroNode.offsetHeight || vh;
        const progress = Math.max(0, Math.min(1, y / heroH));
        const SHRINK_END = 0.40, LIFT_START = 0.34;
        const shrink = Math.max(0, Math.min(1, progress / SHRINK_END));
        const lift   = Math.max(0, Math.min(1, (progress - LIFT_START) / (1 - LIFT_START)));
        heroLine = '<div style="color:#aaa">hero · prog ' + progress.toFixed(2) +
          ' · shrink ' + shrink.toFixed(2) + ' · lift ' + lift.toFixed(2) + '</div>';
      }

      let stateLines = "";
      states.forEach((s) => {
        const el = document.querySelector(s.sel);
        if (!el) return;
        const on = el.classList.contains(s.cls);
        const since = timers.get(s.label);
        const elapsed = (on && since) ? ((now - since) / 1000).toFixed(1) + "s" : "";
        const color = on ? "#e3ff17" : "rgba(255,255,255,0.32)";
        stateLines += '<div style="color:' + color + '">' +
          s.label + ' · ' + (on ? "ON" : "off") +
          (elapsed ? ' <span style="color:rgba(255,255,255,0.55)">(' + elapsed + ')</span>' : "") +
          '</div>';
      });

      let animLines = "";
      animSelectors.forEach((sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const cs = getComputedStyle(el);
        const op = parseFloat(cs.opacity);
        const tx = cs.transform;
        const midOp  = op > 0.005 && op < 0.995;
        const moving = tx && tx !== "none" && tx !== "matrix(1, 0, 0, 1, 0, 0)";
        if (midOp || moving) {
          const short = sel
            .replace(".reviews-", "rv·")
            .replace(".projects-", "fp·")
            .replace(".services-", "se·")
            .replace(":nth-child", "·n");
          animLines += '<div style="color:#9fdfff">' + short +
            ' <span style="color:rgba(255,255,255,0.55)">op ' + op.toFixed(2);
          if (moving) animLines += ' · tf';
          animLines += '</span></div>';
        }
      });
      if (animLines) {
        animLines = '<div style="color:rgba(255,255,255,0.5);margin-top:6px;text-transform:uppercase;letter-spacing:0.08em;font-size:9px;">Animating now</div>' + animLines;
      }

      if (document.activeElement !== scrub) scrub.value = String(y);

      hudBody.innerHTML =
        '<div style="color:rgba(255,255,255,0.55);margin-bottom:4px;letter-spacing:0.1em;text-transform:uppercase;font-size:9px;">' +
        'DEBUG HUD · press D to toggle</div>' +
        '<div>viewport · <b>' + vw + ' × ' + vh + '</b>' +
        ' <span style="color:rgba(255,255,255,0.45)">(design: 1920)</span></div>' +
        '<div>scroll · Y <b>' + y + '</b>' +
        ' / ' + max + ' (' + pct + '%) · X <b>' + x + '</b></div>' +
        '<div>section · <b style="color:#e3ff17">' + sec.id + '</b></div>' +
        '<div style="color:#aaa">  top@' + R(sec.topY) + 'px · Δcenter ' + R(deltaCenter) +
        'px · h ' + R(sec.h) + '</div>' +
        '<div>nav · <b style="color:' + (onDark ? '#e3ff17' : '#fff') + '">' +
        (onDark ? 'on-dark' : 'on-light') + '</b></div>' +
        heroLine +
        '<div style="color:rgba(255,255,255,0.5);margin-top:6px;text-transform:uppercase;letter-spacing:0.08em;font-size:9px;">States</div>' +
        stateLines +
        animLines;
    }

    function tick() { if (visible) render(); requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  })();

  /* ─────────────────────────────────────────────────────────────────────────
     3. RED FOCUS BOX  (press R to toggle)
     ───────────────────────────────────────────────────────────────────────── */
  (function setupFocusBox() {
    const box = document.createElement("div");
    box.id = "focus-box";
    Object.assign(box.style, {
      position: "fixed", left: "200px", top: "200px",
      width: "260px", height: "160px",
      border: "2px solid #ff2222", background: "rgba(255,34,34,0.06)",
      zIndex: "99999", display: "none", boxSizing: "border-box",
      cursor: "move", userSelect: "none", pointerEvents: "auto",
    });

    const label = document.createElement("div");
    Object.assign(label.style, {
      position: "absolute", bottom: "6px", left: "6px", right: "6px",
      background: "rgba(0,0,0,0.75)", color: "#ff6666",
      fontSize: "10px", fontFamily: "monospace", lineHeight: "1.4",
      padding: "3px 6px", borderRadius: "4px", pointerEvents: "none",
      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    });
    label.textContent = "focus box";
    box.appendChild(label);

    const corners = [
      { id: "nw", cursor: "nw-resize", top: "-5px",  left: "-5px"   },
      { id: "ne", cursor: "ne-resize", top: "-5px",  right: "-5px"  },
      { id: "sw", cursor: "sw-resize", bottom: "-5px", left: "-5px" },
      { id: "se", cursor: "se-resize", bottom: "-5px", right: "-5px"},
    ];
    const handleEls = {};
    corners.forEach(({ id, cursor, top, left, right, bottom }) => {
      const h = document.createElement("div");
      Object.assign(h.style, {
        position: "absolute", width: "12px", height: "12px",
        background: "#ff2222", cursor, zIndex: "1",
        ...(top    !== undefined ? { top }    : {}),
        ...(bottom !== undefined ? { bottom } : {}),
        ...(left   !== undefined ? { left }   : {}),
        ...(right  !== undefined ? { right }  : {}),
      });
      h.dataset.corner = id;
      box.appendChild(h);
      handleEls[id] = h;
    });
    document.body.appendChild(box);

    let visible = false;
    function setVisible(v) {
      visible = v;
      box.style.display = v ? "block" : "none";
      if (v) startLabelRAF(); else stopLabelRAF();
    }
    window.__focusBoxSetVisible = setVisible;

    document.addEventListener("keydown", (e) => {
      if (e.key !== "r" && e.key !== "R") return;
      const t = document.activeElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      setVisible(!visible);
    });

    let dragging = false, dragOffX = 0, dragOffY = 0;
    box.addEventListener("mousedown", (e) => {
      if (e.target.dataset.corner) return;
      dragging = true;
      const r = box.getBoundingClientRect();
      dragOffX = e.clientX - r.left;
      dragOffY = e.clientY - r.top;
      e.preventDefault();
    });

    let resizing = null, resizeStartX = 0, resizeStartY = 0;
    document.addEventListener("mousemove", (e) => {
      if (!dragging && !resizing) return;
      if (dragging) {
        box.style.left = (e.clientX - dragOffX) + "px";
        box.style.top  = (e.clientY - dragOffY) + "px";
      }
      if (resizing) {
        const corner = resizing;
        const minW = 80, minH = 50;
        if (corner === "se") {
          box.style.width  = Math.max(minW, parseFloat(box.style.width)  + (e.clientX - resizeStartX)) + "px";
          box.style.height = Math.max(minH, parseFloat(box.style.height) + (e.clientY - resizeStartY)) + "px";
        } else if (corner === "sw") {
          const dx = e.clientX - resizeStartX;
          const nw = parseFloat(box.style.width) - dx;
          if (nw > minW) { box.style.left = (parseFloat(box.style.left) + dx) + "px"; box.style.width = nw + "px"; }
          box.style.height = Math.max(minH, parseFloat(box.style.height) + (e.clientY - resizeStartY)) + "px";
        } else if (corner === "ne") {
          const dy = e.clientY - resizeStartY;
          const nh = parseFloat(box.style.height) - dy;
          box.style.width = Math.max(minW, parseFloat(box.style.width) + (e.clientX - resizeStartX)) + "px";
          if (nh > minH) { box.style.top = (parseFloat(box.style.top) + dy) + "px"; box.style.height = nh + "px"; }
        } else if (corner === "nw") {
          const dx = e.clientX - resizeStartX;
          const dy = e.clientY - resizeStartY;
          const nw = parseFloat(box.style.width)  - dx;
          const nh = parseFloat(box.style.height) - dy;
          if (nw > minW) { box.style.left = (parseFloat(box.style.left) + dx) + "px"; box.style.width  = nw + "px"; }
          if (nh > minH) { box.style.top  = (parseFloat(box.style.top)  + dy) + "px"; box.style.height = nh + "px"; }
        }
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
      }
    });
    document.addEventListener("mouseup", () => { dragging = false; resizing = null; });

    Object.values(handleEls).forEach((h) => {
      h.addEventListener("mousedown", (e) => {
        resizing = h.dataset.corner;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        e.preventDefault();
        e.stopPropagation();
      });
    });

    let labelRAF = null;
    function updateLabel() {
      const r = box.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      box.style.pointerEvents = "none";
      const el = document.elementFromPoint(cx, cy);
      box.style.pointerEvents = "auto";
      let desc = "—";
      if (el && el !== box) {
        const tag = el.tagName.toLowerCase();
        const cls = el.className && typeof el.className === "string"
          ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
          : "";
        const id = el.id ? "#" + el.id : "";
        desc = tag + (id || cls);
      }
      label.textContent = `${desc}  ·  scroll-Y ${Math.round(window.scrollY)}`;
      labelRAF = requestAnimationFrame(updateLabel);
    }
    function startLabelRAF() { if (!labelRAF) labelRAF = requestAnimationFrame(updateLabel); }
    function stopLabelRAF()  { if (labelRAF) { cancelAnimationFrame(labelRAF); labelRAF = null; } }
  })();

})(); /* end IIFE */
