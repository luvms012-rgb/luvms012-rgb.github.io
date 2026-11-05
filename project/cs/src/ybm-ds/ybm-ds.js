/* ==========================================================================
   yds — 공통 인터랙션 (의존성 없음, 모든 서비스 공용)
   --------------------------------------------------------------------------
   원칙: 모양은 CSS, 스크립트는 "CSS만으로 안 되는 동작"만.
     · Text Field clear 버튼 — 값 지우기 (노출/숨김은 CSS 가 처리)
     · Dialog — data-ds-open / data-ds-close 속성으로 열고 닫기, 바깥(dim) 클릭 닫기
     · Snackbar — DS.snackbar("문구", { variant: "positive"|"critical", action: "확인", onAction, duration })
     · Slider — <input class="ds-slider"> 채움 길이(--ds-slider-value) 동기화
     · Checkbox — data-indeterminate 속성 → input.indeterminate
     · Popover — data-ds-popover="id" 로 열고 닫기, 바깥 클릭과 Esc, 안의 data-ds-close 로 닫기
     · Time Picker — 가운데 온 항목에 aria-selected, 멈추면 열에서 change(detail.value), 항목 누름과 화살표 키로 이동
     · Chat Composer — 입력이 비면 보내기 비활성, field-sizing 이 없는 브라우저에서 높이 맞춤
     · Search Suggestion — 입력 칸(role=combobox, aria-controls)에서 위아래 화살표로 줄 고르기, Enter 로 그 줄 누르기
     · Menu Sheet — Dialog 와 같이 열고 닫기, 바깥(dim) 클릭 닫기
     · Timer — data-start(흐른 시간) / data-end(남은 시간)로 1초마다 글자를 바꾸고, 남은 시간이 0 이면 ds-timer-end 이벤트
     · Segmented Control — 누르면 하나만 aria-pressed, change 이벤트. 선택 배경이 고른 항목으로 미끄러져 이동(위치는 --ds-seg-x / --ds-seg-w)
     · Side Panel — Dialog 와 같이 열고 닫기, 본문이 스크롤되면 data-scrolled
     · Pull To Refresh — 터치로 당긴 거리 표시, 넘겨 놓으면 ds-refresh 이벤트, DS.endRefresh(요소) 로 되돌리기
     · Carousel — 처음/끝이면 data-at-start / data-at-end, 버튼으로 한 화면씩 넘기기
     · Code Block — data-ds-copy 버튼으로 코드 복사
     · Multi Select — Popover 와 같이 열고 닫기, 고른 값을 칸에 Badge 로 채우기
     · File Attach — 파일을 끌어 놓는 칸 위로 끌고 오면 data-state="dragover", 벗어나거나 놓으면 뺀다
   사용: <script src="…/ybm-ds/dist/ybm-ds.js" defer></script>
   ========================================================================== */
(function () {
  "use strict";

  /* ---- Dialog ----------------------------------------------------------- */
  function openDialog(id) {
    var dialog = document.getElementById(id);
    if (dialog && !dialog.open) { dialog.showModal(); alignWheels(dialog); }
    return dialog;
  }
  function closeDialog(dialog, value) {
    if (typeof dialog === "string") dialog = document.getElementById(dialog);
    if (dialog && dialog.open) dialog.close(value || "");
  }

  /* ---- Snackbar --------------------------------------------------------- */
  var snackbarTimer;
  var SNACK_ICON = { positive: "circle-check-solid", critical: "circle-alert-solid" };
  function snackbar(message, opts) {
    if (typeof opts === "number") opts = { duration: opts };   // 하위호환: snackbar(msg, ms)
    opts = opts || {};
    var el = document.querySelector(".ds-snackbar");
    if (!el) {
      el = document.createElement("div");
      el.className = "ds-snackbar";
      el.setAttribute("role", "status");
      el.setAttribute("data-state", "closed");
      document.body.appendChild(el);
    }
    el.textContent = "";
    if (opts.variant && opts.variant !== "default") el.setAttribute("data-variant", opts.variant);
    else el.removeAttribute("data-variant");
    if (SNACK_ICON[opts.variant]) {
      var icon = document.createElement("i");
      icon.className = "ds-icon ds-icon--" + SNACK_ICON[opts.variant];
      icon.setAttribute("aria-hidden", "true");
      el.appendChild(icon);
    }
    var msg = document.createElement("span");
    msg.className = "ds-snackbar__message";
    msg.textContent = message;
    el.appendChild(msg);
    if (opts.action) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ds-snackbar__action";
      btn.textContent = opts.action;
      btn.addEventListener("click", function () {
        if (opts.onAction) opts.onAction();
        el.setAttribute("data-state", "closed");
      });
      el.appendChild(btn);
    }
    requestAnimationFrame(function () { el.setAttribute("data-state", "open"); });
    clearTimeout(snackbarTimer);
    snackbarTimer = setTimeout(function () { el.setAttribute("data-state", "closed"); }, opts.duration || 4000);
  }

  /* ---- Slider: 채움 길이 ---------------------------------------------------- */
  function syncSlider(input) {
    var min = parseFloat(input.min || 0), max = parseFloat(input.max || 100), v = parseFloat(input.value);
    input.style.setProperty("--ds-slider-value", ((v - min) / (max - min || 1)) * 100 + "%");
  }
  document.addEventListener("input", function (e) {
    if (e.target.classList && e.target.classList.contains("ds-slider")) syncSlider(e.target);
  });

  /* ---- Popover: data-ds-popover="id" 로 열고 닫기 --------------------------- */
  function setPopover(pop, open) {
    if (!pop || pop.hidden === !open) return;
    pop.hidden = !open;
    document.querySelectorAll('[data-ds-popover="' + pop.id + '"]').forEach(function (b) { b.setAttribute("aria-expanded", String(open)); });
  }
  function closePopovers(except) {
    document.querySelectorAll(".ds-popover[id]:not([hidden]), .ds-multiselect__panel[id]:not([hidden])").forEach(function (p) { if (p !== except) setPopover(p, false); });
  }

  /* ---- Time Picker: 가운데 온 항목 = 선택값 ---------------------------------- */
  function syncWheel(col, notify) {
    var opts = col.querySelectorAll(".ds-timepicker__option");
    if (!opts.length) return;
    var h = opts[0].offsetHeight || 44;
    var idx = Math.max(0, Math.min(opts.length - 1, Math.round(col.scrollTop / h)));
    opts.forEach(function (o, i) {
      if (i === idx) o.setAttribute("aria-selected", "true"); else o.removeAttribute("aria-selected");
      if (Math.abs(i - idx) === 1) o.setAttribute("data-near", ""); else o.removeAttribute("data-near");
    });
    // 굴리는 동안은 표시만 바꾸고, 멈춘 뒤 값이 바뀌었을 때만 change 를 보낸다
    if (!notify) { if (!wheelValue.has(col)) wheelValue.set(col, opts[idx]); return; }
    if (wheelValue.get(col) === opts[idx]) return;
    wheelValue.set(col, opts[idx]);
    col.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: opts[idx].getAttribute("data-value") || opts[idx].textContent.trim() } }));
  }
  var wheelValue = new WeakMap();
  function scrollWheelTo(col, opt, smooth) {
    col.scrollTo({ top: opt.offsetTop - col.querySelector(".ds-timepicker__option").offsetTop, behavior: smooth ? "smooth" : "auto" });
  }
  // 고른 항목(aria-selected)으로 휠을 맞춘다. 닫힌 창 안처럼 보이지 않는 휠은 크기가 없어 건너뛰고, 창을 열 때 다시 맞춘다 (2026-11-04)
  function alignWheels(root) {
    root.querySelectorAll(".ds-timepicker__column").forEach(function (col) {
      if (!col.offsetHeight) return;
      var sel = col.querySelector('.ds-timepicker__option[aria-selected="true"]');
      if (sel) scrollWheelTo(col, sel, false);
      syncWheel(col, false);
    });
  }
  var wheelTimer = new WeakMap();
  document.addEventListener("scroll", function (e) {
    var col = e.target;
    if (!col.classList || !col.classList.contains("ds-timepicker__column")) return;
    syncWheel(col, false);
    clearTimeout(wheelTimer.get(col));
    wheelTimer.set(col, setTimeout(function () { syncWheel(col, true); }, 120));
  }, true);

  /* ---- Chat Composer: 비어 있으면 보내기 비활성 + 줄 수만큼 늘이기 ------------- */
  function syncComposer(input) {
    var send = input.closest(".ds-chat-composer").querySelector('.ds-chat-send:not([data-state="stop"])');
    if (send) send.disabled = !input.value.trim();
    if (!CSS.supports || !CSS.supports("field-sizing", "content")) { input.style.height = "auto"; input.style.height = input.scrollHeight + "px"; }
  }
  document.addEventListener("input", function (e) {
    if (e.target.classList && e.target.classList.contains("ds-chat-composer__input")) syncComposer(e.target);
  });

  /* ---- Timer: data-start 부터 흐른 시간 / data-end 까지 남은 시간 ------------ */
  function toTime(v) { var n = Number(v); return isNaN(n) ? Date.parse(v) : n; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function formatTime(sec, format) {
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (format === "elapsed") return h ? h + "시간 " + pad(m) + "분" : m ? m + "분 " + pad(s) + "초" : s + "초";
    return h ? h + ":" + pad(m) + ":" + pad(s) : m + ":" + pad(s);
  }
  function tickTimers() {
    var now = Date.now();
    document.querySelectorAll(".ds-timer").forEach(function (el) {
      var end = el.getAttribute("data-end"), start = el.getAttribute("data-start");
      if (end == null && start == null) return;
      var ms = end != null ? toTime(end) - now : now - toTime(start);
      var sec = Math.max(0, end != null ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
      if (isNaN(sec)) return;
      el.textContent = formatTime(sec, el.getAttribute("data-format"));
      el.setAttribute("datetime", "PT" + sec + "S");
      if (end != null && sec === 0 && !el.hasAttribute("data-ended")) {
        el.setAttribute("data-ended", "");
        el.dispatchEvent(new CustomEvent("ds-timer-end", { bubbles: true }));
      }
    });
  }
  setInterval(tickTimers, 1000);

  /* ---- Accordion: 열고 닫을 때 높이가 부드럽게 바뀐다 (2026-11-04) ---------
     <details> 를 그대로 쓰고 높이만 움직인다. 움직임 줄이기 설정이면 바로 열고 닫는다.
     같은 name 묶음(하나만 열림)은 연 것과 닫히는 것이 함께 움직인다. 닫히는 동안 data-ds-closing 이 붙는다 */
  var accRun = new WeakMap();
  function accMs(el) {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
    var v = getComputedStyle(el).getPropertyValue("--ds-duration-normal").trim();
    var ms = parseFloat(v) * (/ms$/.test(v) ? 1 : 1000);
    return ms > 0 ? ms : 250;
  }
  function accMove(det, open) {
    var prev = accRun.get(det);
    var from = det.getBoundingClientRect().height;
    if (prev) { prev.cancel(); accRun.delete(det); }
    var ms = accMs(det);
    if (!det.animate || !ms) { det.open = open; det.removeAttribute("data-ds-closing"); return null; }
    det.open = open;
    var to = det.getBoundingClientRect().height;
    if (!open) { det.open = true; det.setAttribute("data-ds-closing", ""); } else det.removeAttribute("data-ds-closing");
    det.style.overflow = "hidden";
    var a = det.animate({ height: [from + "px", to + "px"] }, { duration: ms, easing: getComputedStyle(det).getPropertyValue("--ds-easing-standard").trim() || "ease" });
    accRun.set(det, a);
    // 끝내기: 움직임 끝 이벤트와 시간 둘 중 먼저 오는 쪽 (보이지 않는 탭에서는 이벤트가 늦을 수 있다). 도중에 반대로 누르면 새 움직임이 맡는다
    var end = function () {
      if (accRun.get(det) !== a) return;
      accRun.delete(det); det.style.overflow = "";
      if (!open) { det.open = false; det.removeAttribute("data-ds-closing"); }
      if (a.playState !== "finished") a.cancel();
      a.dispatchEvent && a.dispatchEvent(new Event("ds-end"));
    };
    a.onfinish = end;
    setTimeout(end, ms + 60);
    return a;
  }
  function accToggle(det) {
    var opening = !det.open || det.hasAttribute("data-ds-closing");
    if (!opening) { accMove(det, false); return; }
    var name = det.getAttribute("name");
    var others = name ? Array.prototype.filter.call(document.querySelectorAll("details.ds-accordion[open]"), function (o) { return o !== det && o.getAttribute("name") === name && !o.hasAttribute("data-ds-closing"); }) : [];
    if (others.length) det.removeAttribute("name");  // 브라우저가 다른 항목을 바로 닫지 않게 잠깐 뺀다
    var a = accMove(det, true);
    others.forEach(function (o) { accMove(o, false); });
    // 묶음 이름은 다른 항목이 다 닫힌 뒤에 되돌린다 (열린 채로 이름이 붙으면 브라우저가 한쪽을 바로 닫는다)
    if (others.length) {
      var back = function () {
        if (det.hasAttribute("name")) return;
        if (others.some(function (o) { return o.open; })) { setTimeout(back, 40); return; }
        det.setAttribute("name", name);
      };
      setTimeout(back, (a ? accMs(det) : 0) + 80);
    }
  }
  document.addEventListener("click", function (e) {
    var trig = e.target.closest && e.target.closest(".ds-accordion > .ds-accordion__trigger");
    if (!trig || e.defaultPrevented) return;
    var det = trig.parentElement;
    if (det.getAttribute("aria-disabled") === "true") return;
    e.preventDefault();
    accToggle(det);
  });

  /* ---- Carousel 끝 표시 / Side Panel 본문 스크롤 표시 --------------------- */
  function syncCarousel(car) {
    var sc = car.querySelector(".ds-carousel__scroller");
    if (!sc) return;
    var max = sc.scrollWidth - sc.clientWidth;
    car.toggleAttribute("data-at-start", sc.scrollLeft <= 1);
    car.toggleAttribute("data-at-end", sc.scrollLeft >= max - 1);
    var count = car.querySelector(".ds-carousel__count");
    var items = sc.querySelectorAll(".ds-carousel__item");
    if (count && items.length) {
      var w = items[0].offsetWidth + (parseFloat(getComputedStyle(sc).columnGap) || 0);
      var idx = sc.scrollLeft >= max - 1 ? items.length - 1 : Math.round(sc.scrollLeft / (w || 1));
      count.textContent = Math.min(items.length, idx + 1) + "/" + items.length;
    }
  }
  document.addEventListener("scroll", function (e) {
    var el = e.target;
    if (!el.classList) return;
    if (el.classList.contains("ds-carousel__scroller")) syncCarousel(el.parentElement);
    else if (el.classList.contains("ds-sidepanel__body")) el.toggleAttribute("data-scrolled", el.scrollTop > 0);
  }, true);

  /* ---- Multi Select: 고른 값을 칸에 Badge 로 ------------------------------- */
  function syncMultiSelect(panel) {
    var trigger = document.querySelector('[data-ds-popover="' + panel.id + '"]');
    var box = trigger && trigger.querySelector(".ds-multiselect__values");
    if (!box) return;
    var labels = [];
    panel.querySelectorAll(".ds-multiselect__option").forEach(function (o) {
      var c = o.querySelector("input");
      if (c && c.checked) labels.push(o.querySelector(".ds-multiselect__label").textContent);
    });
    var max = parseInt(box.getAttribute("data-max"), 10) || 2;
    box.textContent = "";
    labels.slice(0, max).forEach(function (l) { var b = document.createElement("span"); b.className = "ds-badge"; b.textContent = l; box.appendChild(b); });
    if (labels.length > max) { var m = document.createElement("span"); m.className = "ds-multiselect__overflow"; m.textContent = "+" + (labels.length - max); box.appendChild(m); }
  }
  document.addEventListener("change", function (e) {
    var panel = e.target.closest && e.target.closest(".ds-multiselect__panel[id]");
    if (panel) syncMultiSelect(panel);
  });

  /* ---- Pull To Refresh: 맨 위에서 아래로 당기기 ---------------------------- */
  var pull = null;
  function ptrParts(el) { return { ind: el.querySelector(".ds-ptr__indicator"), circle: el.querySelector(".ds-ptr__indicator .ds-progress-circle") }; }
  document.addEventListener("touchstart", function (e) {
    var el = e.target.closest && e.target.closest(".ds-ptr");
    if (!el || el.hasAttribute("data-disabled") || el.getAttribute("data-state") === "refreshing") return;
    var content = el.querySelector(".ds-ptr__content");
    if ((content && content.scrollTop > 0) || window.scrollY > 0) return;
    pull = { el: el, y: e.touches[0].clientY, d: 0 };
  }, { passive: true });
  document.addEventListener("touchmove", function (e) {
    if (!pull) return;
    var p = ptrParts(pull.el), size = p.ind.offsetHeight || 88;
    pull.d = Math.max(0, Math.min(size * 1.5, (e.touches[0].clientY - pull.y) * 0.5));
    pull.el.setAttribute("data-dragging", "");
    pull.el.style.setProperty("--ds-ptr-displacement", pull.d + "px");
    if (p.circle) p.circle.style.setProperty("--ds-progress-value", Math.min(100, Math.round((pull.d / size) * 100)));
  }, { passive: true });
  document.addEventListener("touchend", function () {
    if (!pull) return;
    var el = pull.el, p = ptrParts(el), size = p.ind.offsetHeight || 88;
    el.removeAttribute("data-dragging");
    if (pull.d >= size) {
      el.setAttribute("data-state", "refreshing");
      el.style.setProperty("--ds-ptr-displacement", size + "px");
      if (p.circle) p.circle.setAttribute("data-type", "indeterminate");
      el.dispatchEvent(new CustomEvent("ds-refresh", { bubbles: true }));
    } else el.style.setProperty("--ds-ptr-displacement", "0px");
    pull = null;
  });
  function endRefresh(el) {
    var p = ptrParts(el);
    el.removeAttribute("data-state");
    el.style.setProperty("--ds-ptr-displacement", "0px");
    if (p.circle) { p.circle.removeAttribute("data-type"); p.circle.style.setProperty("--ds-progress-value", 0); }
  }

  /* ---- Segmented Control: 하나만 누름 + 선택 배경 미끄러짐 ------------------- */
  function syncSegmented(seg) {
    var cur = seg.querySelector(".ds-segmented__item[aria-pressed='true']");
    if (!cur || !cur.offsetWidth) { seg.removeAttribute("data-ds-ready"); return; }
    seg.style.setProperty("--ds-seg-x", cur.offsetLeft + "px");
    seg.style.setProperty("--ds-seg-w", cur.offsetWidth + "px");
    // 처음 위치를 잡은 다음 프레임부터 움직임을 켠다(처음 그릴 때 미끄러지지 않게)
    if (!seg.hasAttribute("data-ds-ready")) { var ready = function () { seg.setAttribute("data-ds-ready", ""); }; requestAnimationFrame(ready); setTimeout(ready, 60); }
  }
  var segObserver = "ResizeObserver" in window ? new ResizeObserver(function (list) { list.forEach(function (e) { syncSegmented(e.target); }); }) : null;
  function watchSegmented(seg) {
    if (seg.__dsSeg) return;
    seg.__dsSeg = true;
    syncSegmented(seg);
    if (segObserver) segObserver.observe(seg);
  }
  document.addEventListener("click", function (e) {
    var item = e.target.closest && e.target.closest(".ds-segmented__item");
    if (!item || item.disabled) return;
    var seg = item.closest(".ds-segmented");
    if (item.getAttribute("aria-pressed") === "true") return;
    seg.querySelectorAll(".ds-segmented__item").forEach(function (b) { b.setAttribute("aria-pressed", String(b === item)); });
    seg.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: item.value || item.textContent.trim() } }));
  });
  // aria-pressed 를 코드로 바꿔도 따라 움직인다
  if ("MutationObserver" in window) new MutationObserver(function (list) {
    list.forEach(function (m) { var seg = m.target.closest && m.target.closest(".ds-segmented"); if (seg) syncSegmented(seg); });
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["aria-pressed"] });

  /* ---- 초기화: 페이지에 이미 있는 요소 ------------------------------------- */
  function init(root) {
    (root || document).querySelectorAll(".ds-slider").forEach(syncSlider);
    (root || document).querySelectorAll(".ds-checkbox__control[data-indeterminate]").forEach(function (c) { c.indeterminate = true; });
    alignWheels(root || document);
    (root || document).querySelectorAll(".ds-chat-composer__input").forEach(syncComposer);
    tickTimers();
    (root || document).querySelectorAll(".ds-segmented").forEach(watchSegmented);
    (root || document).querySelectorAll(".ds-carousel").forEach(syncCarousel);
    (root || document).querySelectorAll(".ds-multiselect__panel[id]").forEach(syncMultiSelect);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); });
  else init();

  /* ---- 이벤트 위임: 페이지에 요소가 나중에 추가돼도 동작 ------------------ */
  document.addEventListener("click", function (e) {
    var t = e.target;

    // clear 버튼 → 값 비우고 input 이벤트 발생(화면 검증 로직이 그대로 반응)
    var clear = t.closest(".ds-input__clear");
    if (clear) {
      var control = clear.closest(".ds-input").querySelector(".ds-input__control");
      control.value = "";
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.focus();
      return;
    }

    var popTrigger = t.closest("[data-ds-popover]");
    if (popTrigger) {
      var pop = document.getElementById(popTrigger.getAttribute("data-ds-popover"));
      closePopovers(pop);
      setPopover(pop, pop && pop.hidden);
      return;
    }
    // 열린 Popover 바깥을 누르면 닫는다
    if (!t.closest(".ds-popover, .ds-multiselect__panel")) closePopovers();

    // Carousel 버튼 → 한 화면의 80% 만큼 넘긴다
    var carBtn = t.closest(".ds-carousel__button");
    if (carBtn) {
      var sc = carBtn.closest(".ds-carousel").querySelector(".ds-carousel__scroller");
      sc.scrollBy({ left: (carBtn.getAttribute("data-direction") === "previous" ? -1 : 1) * sc.clientWidth * 0.8, behavior: "smooth" });
      return;
    }

    // Code Block 복사 버튼 → 코드를 복사하고 2초 동안 data-copied
    var copyBtn = t.closest("[data-ds-copy]");
    if (copyBtn) {
      var code = copyBtn.closest(".ds-codeblock").querySelector(".ds-codeblock__code");
      if (code && navigator.clipboard) navigator.clipboard.writeText(code.textContent).then(function () {
        copyBtn.setAttribute("data-copied", "");
        setTimeout(function () { copyBtn.removeAttribute("data-copied"); }, 2000);
      });
      return;
    }

    // Time Picker 항목을 누르면 그 값으로 굴린다
    var wheelOpt = t.closest(".ds-timepicker__option");
    if (wheelOpt) { scrollWheelTo(wheelOpt.parentElement, wheelOpt, true); return; }

    var opener = t.closest("[data-ds-open]");
    if (opener) { openDialog(opener.getAttribute("data-ds-open")); return; }

    var closer = t.closest("[data-ds-close]");
    if (closer) {
      var inPop = closer.closest(".ds-popover");
      if (inPop) { setPopover(inPop, false); var back = document.querySelector('[data-ds-popover="' + inPop.id + '"]'); if (back) back.focus(); }
      else closeDialog(closer.closest("dialog"));
      return;
    }

    // dialog 바깥(backdrop) 클릭 = dialog 요소 자신이 target
    // 단, Alert(role="alertdialog")는 버튼으로만 닫는다
    if (t.tagName === "DIALOG" && (t.classList.contains("ds-dialog") || t.classList.contains("ds-bottomsheet") || t.classList.contains("ds-menusheet") || t.classList.contains("ds-sidepanel")) && t.getAttribute("role") !== "alertdialog") closeDialog(t);
  });

  // Search Suggestion: 입력 칸에서 위아래 화살표로 줄을 고르고 Enter 로 누른다
  function moveSuggestion(input, e) {
    var panel = document.getElementById(input.getAttribute("aria-controls"));
    if (!panel || panel.hidden || !panel.classList.contains("ds-search-suggest")) return false;
    var items = [].slice.call(panel.querySelectorAll(".ds-search-suggest__item"));
    var cur = panel.querySelector(".ds-search-suggest__item[data-highlighted]");
    if (e.key === "Enter") {
      if (!cur) return false;
      e.preventDefault(); cur.click(); return true;
    }
    if (!items.length) return false;
    e.preventDefault();
    var i = items.indexOf(cur) + (e.key === "ArrowDown" ? 1 : -1);
    if (i < 0) i = items.length - 1; else if (i >= items.length) i = 0;
    items.forEach(function (it) { it.removeAttribute("data-highlighted"); it.removeAttribute("aria-selected"); });
    items[i].setAttribute("data-highlighted", ""); items[i].setAttribute("aria-selected", "true");
    if (items[i].id) input.setAttribute("aria-activedescendant", items[i].id);
    items[i].scrollIntoView({ block: "nearest" });
    return true;
  }

  // Esc = 열린 Popover 닫기 / Time Picker 열에서 위아래 화살표 = 한 칸씩 / 추천어 입력 칸에서 줄 고르기
  document.addEventListener("keydown", function (e) {
    if (e.target.getAttribute && e.target.getAttribute("role") === "combobox" && e.target.getAttribute("aria-controls")
      && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") && moveSuggestion(e.target, e)) return;
    if (e.key === "Escape") {
      var open = document.querySelector(".ds-popover[id]:not([hidden]), .ds-multiselect__panel[id]:not([hidden])");
      if (open) { setPopover(open, false); var back = document.querySelector('[data-ds-popover="' + open.id + '"]'); if (back) back.focus(); }
      return;
    }
    var col = e.target.classList && e.target.classList.contains("ds-timepicker__column") ? e.target : null;
    if (col && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      var cur = col.querySelector('.ds-timepicker__option[aria-selected="true"]');
      var next = cur && (e.key === "ArrowUp" ? cur.previousElementSibling : cur.nextElementSibling);
      if (next) scrollWheelTo(col, next, true);
    }
  });

  // clear 버튼을 누르는 순간 input 포커스가 빠지지 않게 (버튼이 사라지는 깜빡임 방지)
  document.addEventListener("mousedown", function (e) {
    if (e.target.closest(".ds-input__clear")) e.preventDefault();
  });

  // File Attach: 파일을 끌어 놓는 칸 위로 끌고 오면 표시 (놓기는 칸을 덮은 input 이 기본 동작으로 받는다)
  function dropZone(e) {
    var zone = e.target.closest && e.target.closest(".ds-fileattach__dropzone");
    return zone && !zone.querySelector(".ds-fileattach__input:disabled") ? zone : null;
  }
  document.addEventListener("dragenter", function (e) {
    var zone = dropZone(e);
    if (zone) zone.setAttribute("data-state", "dragover");
  });
  document.addEventListener("dragleave", function (e) {
    var zone = dropZone(e);
    if (zone && !zone.contains(e.relatedTarget)) zone.removeAttribute("data-state");
  });
  document.addEventListener("drop", function (e) {
    var zone = dropZone(e);
    if (zone) zone.removeAttribute("data-state");
  });

  window.DS = { version: "1.1.0", openDialog: openDialog, closeDialog: closeDialog, snackbar: snackbar, endRefresh: endRefresh, init: init };  // version 은 VERSION 과 같다 (node sync.mjs release 가 바꾼다)
  window.YBM = window.DS;  // 예전 이름 (2026-11-04 DS 로 바꿈). 이미 YBM.snackbar 를 쓰는 화면이 깨지지 않게 남겨 둔다
})();
