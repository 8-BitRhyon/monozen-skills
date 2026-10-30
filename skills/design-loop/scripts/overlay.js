(() => {
  if (window.__designLoopOverlay) return;
  window.__designLoopOverlay = true;

  const ENDPOINT = (window.__ANNOTATE_ENDPOINT__ || "http://127.0.0.1:4748").replace(/\/$/, "");
  const STYLE_PROPS = [
    "display", "position", "fontSize", "fontWeight", "lineHeight", "letterSpacing",
    "color", "backgroundColor", "padding", "margin", "borderRadius", "gap",
    "flexDirection", "gridTemplateColumns", "opacity", "overflow", "transform",
  ];
  const ATTR_TYPES = { "data-testid": "testid", "data-annotate": "annotate", "data-test": "test" };

  const host = document.createElement("div");
  host.id = "__design_loop_host";
  host.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
  host.setAttribute("data-design-loop", "overlay");

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      #highlight {
        position: fixed; display: none; pointer-events: none;
        border: 2px solid #7c9cff; background: rgba(124, 156, 255, 0.12);
        border-radius: 4px; z-index: 2;
      }
      #highlight span {
        position: absolute; top: -22px; left: -2px;
        font: 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
        color: #0b0c15; background: #7c9cff; padding: 2px 6px; border-radius: 4px;
        white-space: nowrap;
      }
      #hud {
        position: fixed; right: 20px; bottom: 20px; z-index: 4;
        display: flex; align-items: center; gap: 8px;
        pointer-events: auto; cursor: pointer;
        font: 12px/1 ui-sans-serif, -apple-system, "Segoe UI", sans-serif;
        color: #e6e6e6; background: #0b0c15; border: 1px solid #2a2b45;
        padding: 10px 12px; border-radius: 999px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        user-select: none;
      }
      #hud.on { border-color: #7c9cff; color: #7c9cff; }
      #hud b { font-weight: 600; }
      #count {
        display: none; min-width: 18px; height: 18px; padding: 0 5px;
        align-items: center; justify-content: center;
        background: #7c9cff; color: #0b0c15; border-radius: 999px;
        font-size: 10px; font-weight: 700;
      }
      #count.show { display: inline-flex; }
      #panel {
        position: fixed; z-index: 5; width: 340px; pointer-events: auto;
        background: #0b0c15; color: #e6e6e6; border: 1px solid #2a2b45;
        border-radius: 12px; padding: 14px;
        font: 13px/1.45 ui-sans-serif, -apple-system, "Segoe UI", sans-serif;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
      #panel[hidden] { display: none; }
      #panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      #panel-title { font-weight: 600; }
      #close { background: none; border: 0; color: #8b8ba7; font-size: 18px; cursor: pointer; line-height: 1; padding: 0; }
      #close:hover { color: #e6e6e6; }
      #selector {
        display: block; margin-bottom: 10px; padding: 6px 8px;
        background: #12132b; border: 1px solid #22233d; border-radius: 6px;
        color: #9aa4ff; font: 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      label { display: block; margin: 0 0 4px; color: #8b8ba7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
      select, textarea {
        width: 100%; background: #12132b; color: #e6e6e6;
        border: 1px solid #2a2b45; border-radius: 8px; padding: 8px;
        font: inherit; outline: none;
      }
      select { margin-bottom: 10px; }
      select:focus, textarea:focus { border-color: #7c9cff; }
      textarea { min-height: 84px; resize: vertical; }
      #actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; }
      #hint { color: #6f6f8f; font-size: 11px; }
      #save {
        background: #7c9cff; color: #0b0c15; border: 0; border-radius: 8px;
        padding: 8px 12px; font: inherit; font-weight: 600; cursor: pointer;
      }
      #save:disabled { opacity: 0.5; cursor: wait; }
      #toast {
        position: fixed; left: 50%; bottom: 74px; transform: translateX(-50%) translateY(8px);
        z-index: 6; pointer-events: none; opacity: 0; transition: opacity 160ms ease, transform 160ms ease;
        background: #12132b; color: #e6e6e6; border: 1px solid #2a2b45;
        padding: 8px 12px; border-radius: 8px;
        font: 12px/1.4 ui-sans-serif, -apple-system, "Segoe UI", sans-serif;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); max-width: 360px;
      }
      #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      #toast.bad { border-color: #ff6b6b; color: #ffb3b3; }
    </style>
    <div id="highlight"><span></span></div>
    <div id="hud" role="button" tabindex="0" aria-label="Toggle annotation mode">
      <b id="hud-label">Annotate</b><span id="count" aria-label="Pending annotations"></span>
    </div>
    <div id="panel" hidden>
      <div id="panel-head">
        <span id="panel-title">Annotate element</span>
        <button id="close" aria-label="Close annotation panel">&times;</button>
      </div>
      <code id="selector"></code>
      <label for="severity">Severity</label>
      <select id="severity">
        <option value="blocking">Blocking</option>
        <option value="important" selected>Important</option>
        <option value="suggestion">Suggestion</option>
      </select>
      <label for="comment">Comment</label>
      <textarea id="comment" placeholder="What is wrong, and what should it be?"></textarea>
      <div id="actions">
        <span id="hint">Cmd/Ctrl+Enter</span>
        <button id="save">Save</button>
      </div>
    </div>
    <div id="toast" role="status" aria-live="polite"></div>
  `;

  document.documentElement.append(host);

  const $ = (id) => shadow.getElementById(id);
  const highlight = $("highlight");
  const highlightLabel = highlight.querySelector("span");
  const hud = $("hud");
  const hudLabel = $("hud-label");
  const countBadge = $("count");
  const panel = $("panel");
  const selectorPreview = $("selector");
  const severitySelect = $("severity");
  const commentBox = $("comment");
  const saveButton = $("save");
  const toast = $("toast");

  let active = false;
  let target = null;
  let pendingCount = 0;
  let toastTimer = 0;
  let raf = 0;
  let lastPointer = null;

  const isOverlayEvent = (event) => event.composedPath().includes(host);

  function showToast(message, bad = false) {
    toast.textContent = message;
    toast.classList.toggle("bad", bad);
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function setCount(next) {
    pendingCount = next;
    countBadge.textContent = String(next);
    countBadge.classList.toggle("show", next > 0);
  }

  async function refreshCount() {
    try {
      const response = await fetch(`${ENDPOINT}/annotations?status=pending`);
      if (!response.ok) return;
      const body = await response.json();
      setCount(Array.isArray(body.annotations) ? body.annotations.length : 0);
    } catch {}
  }

  function escapeSelector(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function isUnique(selector) {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch {
      return false;
    }
  }

  function buildSelector(element) {
    for (const attr of ["data-testid", "data-annotate", "data-test"]) {
      const value = element.getAttribute && element.getAttribute(attr);
      if (value) {
        const selector = `[${attr}="${String(value).replace(/"/g, '\\"')}"]`;
        if (isUnique(selector)) return { selector, chain: [{ type: ATTR_TYPES[attr] || attr, value: selector, stability: 0.95 }] };
      }
    }

    if (element.id && isUnique(`#${escapeSelector(element.id)}`)) {
      const selector = `#${escapeSelector(element.id)}`;
      return { selector, chain: [{ type: "id", value: selector, stability: 0.9 }] };
    }

    const parts = [];
    let node = element;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        part = `#${escapeSelector(node.id)}`;
        parts.unshift(part);
        break;
      }
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter((child) => child.tagName === node.tagName);
        if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = node.parentElement;
    }

    const selector = parts.join(" > ");
    const chain = [{ type: "css", value: selector, stability: 0.6 }];
    const text = (element.innerText || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80);
    if (text) chain.push({ type: "text", value: text, stability: 0.4 });
    const label = element.getAttribute && element.getAttribute("aria-label");
    if (label) chain.push({ type: "role", value: `${element.tagName.toLowerCase()}[name="${label}"]`, stability: 0.7 });
    return { selector, chain };
  }

  function computedStyles(element) {
    const styles = {};
    const computed = getComputedStyle(element);
    for (const prop of STYLE_PROPS) {
      const value = computed[prop];
      if (value) styles[prop] = value;
    }
    return styles;
  }

  function boundingBox(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    };
  }

  function paintHighlight(element) {
    const rect = element.getBoundingClientRect();
    highlight.style.display = "block";
    highlight.style.left = `${rect.left}px`;
    highlight.style.top = `${rect.top}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    highlightLabel.textContent = `${element.tagName.toLowerCase()} ${Math.round(rect.width)}x${Math.round(rect.height)}`;
  }

  function clearHighlight() {
    highlight.style.display = "none";
  }

  function setActive(next) {
    active = next;
    hud.classList.toggle("on", active);
    hudLabel.textContent = active ? "Annotating" : "Annotate";
    document.documentElement.style.cursor = active ? "crosshair" : "";
    if (!active) {
      clearHighlight();
      hidePanel();
    }
  }

  function hidePanel() {
    panel.hidden = true;
    target = null;
  }

  function positionPanel(rect) {
    const width = 340;
    const height = panel.offsetHeight || 260;
    let left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    let top = rect.bottom + 10;
    if (top + height > window.innerHeight - 12) top = Math.max(12, rect.top - height - 10);
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }

  function openPanel(element) {
    target = element;
    paintHighlight(element);
    const built = buildSelector(element);
    selectorPreview.textContent = built.selector;
    selectorPreview.title = built.selector;
    commentBox.value = "";
    panel.hidden = false;
    positionPanel(element.getBoundingClientRect());
    commentBox.focus();
  }

  function recordFor(element, comment, severity) {
    const built = buildSelector(element);
    return {
      url: window.location.href,
      route: window.location.pathname,
      selector: built.selector,
      selectorChain: built.chain,
      boundingBox: boundingBox(element),
      textSnippet: (element.innerText || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 200),
      computedStyles: computedStyles(element),
      comment,
      severity,
      source: null,
    };
  }

  async function save() {
    if (!target) return;
    const comment = commentBox.value.trim();
    if (!comment) {
      showToast("Write a comment first", true);
      commentBox.focus();
      return;
    }

    saveButton.disabled = true;
    try {
      const response = await fetch(`${ENDPOINT}/annotations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(recordFor(target, comment, severitySelect.value)),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      showToast("Annotation saved");
      setCount(pendingCount + 1);
      hidePanel();
    } catch (error) {
      showToast(`Save failed: ${error.message}. Is the collector running?`, true);
    } finally {
      saveButton.disabled = false;
    }
  }

  hud.addEventListener("click", () => setActive(!active));
  hud.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActive(!active);
    }
  });

  shadow.getElementById("close").addEventListener("click", hidePanel);
  saveButton.addEventListener("click", save);

  commentBox.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      save();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === "a") {
      event.preventDefault();
      setActive(!active);
      return;
    }
    if (event.key === "Escape") {
      if (!panel.hidden) hidePanel();
      else if (active) setActive(false);
    }
  });

  document.addEventListener("mousemove", (event) => {
    if (!active || !panel.hidden) return;
    lastPointer = event;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!active || !lastPointer) return;
      const element = document.elementFromPoint(lastPointer.clientX, lastPointer.clientY);
      if (!element || isOverlayEvent(lastPointer) || element === document.documentElement || element === document.body) {
        clearHighlight();
        return;
      }
      paintHighlight(element);
    });
  }, true);

  document.addEventListener("click", (event) => {
    if (!active || isOverlayEvent(event)) return;
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element || element === document.documentElement || element === document.body) return;
    event.preventDefault();
    event.stopPropagation();
    openPanel(element);
  }, true);

  refreshCount();
  showToast("Annotate mode ready: Alt+Shift+A", false);
})();
