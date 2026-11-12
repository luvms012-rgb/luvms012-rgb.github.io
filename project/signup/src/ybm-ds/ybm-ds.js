/* ==========================================================================
   YDS — 공통 인터랙션 (의존성 없음, 모든 서비스 공용)
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
     · Code Input — 한 칸에 한 글자, 넣으면 다음 칸, 지우면 앞 칸, 붙여 넣으면 모든 칸, 다 채우면 ds-code-complete(detail.value)
     · Toolbar — 막대 안에서 좌우 화살표로 버튼 사이를 옮긴다, data-ds-selection 표의 고른 체크박스를 세어 막대를 보이고 숨긴다, 머리 체크박스는 모두 고르기, 해제 버튼
     · Tree — 줄을 누르면 펼치고 접고 고른다(change, detail.value), 위아래 화살표 이동, 오른쪽 펼침, 왼쪽 접기
     · Wheel Picker — Time Picker 와 같은 휠
     · Menu — checkbox 항목은 켜고 끄고, radio 항목은 묶음에서 하나만, 하위 메뉴 버튼은 열고 닫기
     · Date Field — 숫자만 넣으면 YYYY.MM.DD 로 점을 넣는다
     · Lightbox — Dialog 와 같이 열고 닫기, data-ds-index 로 시작 사진, 이전/다음 버튼과 좌우 화살표 키로 넘기기
     · Mega Menu — data-ds-megamenu 트리거로 열고 닫기, Esc 와 바깥 누름으로 닫기
     · Command Palette — Dialog 와 같이 열기, data-ds-hotkey="k" 면 Ctrl/Command + K, 낱말로 거르기, 위아래 화살표와 Enter
     · Segmented Text Input — 자리 수를 채우면 다음 구간, 빈 구간에서 Backspace 는 앞 구간 마지막 글자 지우기, 끝과 처음에서 좌우 화살표로 옆 구간, 붙여 넣으면 구분자를 빼고 차례로 채우되 가린 구간 앞에서 멈춤, 한글 조합 중에는 옮기지 않음
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
  // Wheel Picker 도 같은 휠이다 (2026-11-05)
  var WHEEL_COL = ".ds-timepicker__column, .ds-wheelpicker__column", WHEEL_OPT = ".ds-timepicker__option, .ds-wheelpicker__option";
  function isWheelCol(el) { return !!(el && el.matches && el.matches(WHEEL_COL)); }
  function syncWheel(col, notify) {
    var opts = col.querySelectorAll(WHEEL_OPT);
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
    col.scrollTo({ top: opt.offsetTop - col.querySelector(WHEEL_OPT).offsetTop, behavior: smooth ? "smooth" : "auto" });
  }
  // 고른 항목(aria-selected)으로 휠을 맞춘다. 닫힌 창 안처럼 보이지 않는 휠은 크기가 없어 건너뛰고, 창을 열 때 다시 맞춘다 (2026-11-04)
  function alignWheels(root) {
    root.querySelectorAll(WHEEL_COL).forEach(function (col) {
      if (!col.offsetHeight) return;
      var sel = col.querySelector('[role="option"][aria-selected="true"]');
      if (sel) scrollWheelTo(col, sel, false);
      syncWheel(col, false);
    });
  }
  var wheelTimer = new WeakMap();
  document.addEventListener("scroll", function (e) {
    var col = e.target;
    if (!isWheelCol(col)) return;
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

  /* ---- Code Input: 한 칸에 한 글자 (2026-11-05) ----------------------------- */
  function codeCells(cell) { return [].slice.call(cell.closest(".ds-codeinput").querySelectorAll(".ds-codeinput__cell")); }
  // 여러 글자가 한 번에 들어오면(붙여 넣기, 문자 자동 채움) 그 칸부터 차례로 나눠 넣고, 마지막으로 채운 칸을 돌려준다
  function codeFill(cells, from, text) {
    var chars = String(text).replace(/\s/g, "").split(""), i = from, last = from;
    for (; i < cells.length && chars.length; i++) { cells[i].value = chars.shift(); last = i; }
    return last;
  }
  function codeDone(cell) {
    var cells = codeCells(cell), v = cells.map(function (c) { return c.value; }).join("");
    if (v.length === cells.length) cell.closest(".ds-codeinput").dispatchEvent(new CustomEvent("ds-code-complete", { bubbles: true, detail: { value: v } }));
  }
  document.addEventListener("input", function (e) {
    var cell = e.target.closest && e.target.closest(".ds-codeinput__cell");
    if (!cell) return;
    var cells = codeCells(cell), i = cells.indexOf(cell);
    if (cell.value.length > 1) cells[codeFill(cells, i, cell.value)].focus();
    else if (cell.value && i < cells.length - 1) cells[i + 1].focus();
    codeDone(cell);
  });
  document.addEventListener("paste", function (e) {
    var cell = e.target.closest && e.target.closest(".ds-codeinput__cell");
    if (!cell) return;
    e.preventDefault();
    var cells = codeCells(cell);
    cells[codeFill(cells, cells.indexOf(cell), (e.clipboardData || window.clipboardData).getData("text"))].focus();
    codeDone(cell);
  });
  function codeKey(cell, e) {
    var cells = codeCells(cell), i = cells.indexOf(cell);
    if (e.key === "Backspace" && !cell.value && i > 0) { e.preventDefault(); cells[i - 1].value = ""; cells[i - 1].focus(); return true; }
    if (e.key === "ArrowLeft" && i > 0) { e.preventDefault(); cells[i - 1].focus(); return true; }
    if (e.key === "ArrowRight" && i < cells.length - 1) { e.preventDefault(); cells[i + 1].focus(); return true; }
    return false;
  }

  /* ---- Segmented Text Input: 구간마다 따로 입력 (2026-11-10) ------------------ */
  function segParts(seg) { return [].slice.call(seg.closest(".ds-segmentinput").querySelectorAll(".ds-segmentinput__segment")); }
  function segMax(seg) { return parseInt(seg.getAttribute("maxlength"), 10) || 0; }
  function segNumeric(seg) { return seg.getAttribute("inputmode") === "numeric"; }
  function segFocus(seg, atEnd) {
    seg.focus();
    var n = atEnd ? seg.value.length : 0;
    try { seg.setSelectionRange(n, n); } catch (err) { /* 자리 지정이 안 되는 칸은 그대로 */ }
  }
  function segEditable(seg) { return seg && !seg.disabled && !seg.readOnly; }
  // 가린 구간은 입력한 글자 수만큼 CSS 가 점을 그린다 (값을 코드로 바꾸면 input 이벤트를 보내거나 DS.init 을 다시 부른다)
  function segSync(seg) { if (seg.hasAttribute("data-masked")) seg.style.setProperty("--ds-segmentinput-filled", seg.value.length); }
  // 글자를 이 구간부터 차례로 나눠 넣는다. 다음 구간이 가린 구간이면 그 앞에서 멈추고, 마지막으로 채운 구간 번호를 돌려준다
  function segFill(segs, i, text) {
    var last = i;
    for (var k = i; k < segs.length && text; k++) {
      if (k > i && (segs[k].hasAttribute("data-masked") || !segEditable(segs[k]))) break;
      var max = segMax(segs[k]) || text.length;
      segs[k].value = text.slice(0, max);
      segSync(segs[k]);
      text = text.slice(max);
      last = k;
    }
    return last;
  }
  // 채운 구간이 다 찼으면 다음 구간(가린 구간이어도)으로, 아니면 그 구간 끝으로
  function segLand(segs, last) {
    var max = segMax(segs[last]);
    if (max && segs[last].value.length >= max && segEditable(segs[last + 1])) segFocus(segs[last + 1], false);
    else segFocus(segs[last], true);
  }
  function segAfterInput(seg) {
    var segs = segParts(seg), i = segs.indexOf(seg), max = segMax(seg);
    var v = segNumeric(seg) ? seg.value.replace(/\D/g, "") : seg.value;
    if (max && v.length > max) { segLand(segs, segFill(segs, i, v)); return; }  // 자동 채움처럼 한 번에 여러 글자
    if (v !== seg.value) seg.value = v;
    segSync(seg);
    if (max && v.length === max && seg.selectionStart === v.length && segEditable(segs[i + 1])) segFocus(segs[i + 1], false);
  }
  document.addEventListener("input", function (e) {
    var seg = e.target.closest && e.target.closest(".ds-segmentinput__segment");
    if (seg && !e.isComposing) segAfterInput(seg);
  });
  document.addEventListener("compositionend", function (e) {
    var seg = e.target.closest && e.target.closest(".ds-segmentinput__segment");
    if (seg) segAfterInput(seg);
  });
  document.addEventListener("paste", function (e) {
    var seg = e.target.closest && e.target.closest(".ds-segmentinput__segment");
    if (!seg) return;
    e.preventDefault();
    var clip = (e.clipboardData || window.clipboardData).getData("text");
    clip = segNumeric(seg) ? clip.replace(/\D/g, "") : clip.replace(/[\s\-–.\/]/g, "");
    var segs = segParts(seg), i = segs.indexOf(seg);
    var text = seg.value.slice(0, seg.selectionStart || 0) + clip;
    segLand(segs, segFill(segs, i, text));
  });
  // 가린 구간의 글자는 복사하거나 잘라 낼 수 없다
  function segNoCopy(e) { var seg = e.target.closest && e.target.closest(".ds-segmentinput__segment[data-masked]"); if (seg) e.preventDefault(); }
  document.addEventListener("copy", segNoCopy);
  document.addEventListener("cut", segNoCopy);
  function segKey(seg, e) {
    if (e.isComposing || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false;
    var segs = segParts(seg), i = segs.indexOf(seg);
    var at = seg.selectionStart, len = seg.value.length, collapsed = at === seg.selectionEnd;
    var prev = segs[i - 1], next = segs[i + 1];
    if (e.key === "Backspace" && !len && segEditable(prev)) { e.preventDefault(); prev.value = prev.value.slice(0, -1); segSync(prev); segFocus(prev, true); return true; }
    if (e.key === "ArrowLeft" && collapsed && at === 0 && prev) { e.preventDefault(); segFocus(prev, true); return true; }
    if (e.key === "ArrowRight" && collapsed && at === len && next) { e.preventDefault(); segFocus(next, false); return true; }
    return false;
  }

  /* ---- Toolbar: 좌우 화살표로 막대 안 버튼 사이를 옮긴다 (2026-11-05) -------- */
  function toolbarKey(el, e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return false;
    if (el.matches("input, textarea, select, [contenteditable]")) return false;
    var bar = el.closest(".ds-toolbar");
    var items = [].slice.call(bar.querySelectorAll("button:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])"));
    var i = items.indexOf(el);
    if (i < 0) return false;
    e.preventDefault();
    items[(i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length].focus();
    return true;
  }

  /* ---- Tree: 펼치고 접기, 고르기, 화살표 키 (2026-11-05) -------------------- */
  function treeVisible(tree) { return [].slice.call(tree.querySelectorAll(".ds-tree__node")).filter(function (n) { return n.offsetParent !== null || n.getClientRects().length; }); }
  function treeFocus(node) {
    var tree = node.closest(".ds-tree");
    tree.querySelectorAll(".ds-tree__node").forEach(function (n) { n.setAttribute("tabindex", n === node ? "0" : "-1"); });
    node.focus();
  }
  function treeSelect(node) {
    var tree = node.closest(".ds-tree");
    tree.querySelectorAll('.ds-tree__node[aria-selected="true"]').forEach(function (n) { n.removeAttribute("aria-selected"); });
    node.setAttribute("aria-selected", "true");
    var label = node.querySelector(".ds-tree__label");
    tree.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: node.getAttribute("data-value") || (label ? label.textContent.trim() : "") } }));
  }
  function treeToggle(node, open) {
    if (!node.hasAttribute("aria-expanded")) return false;
    var now = node.getAttribute("aria-expanded") === "true";
    if (open === undefined) open = !now;
    if (open === now) return false;
    node.setAttribute("aria-expanded", open ? "true" : "false");
    return true;
  }
  function treeKey(node, e) {
    var list = treeVisible(node.closest(".ds-tree")), i = list.indexOf(node), k = e.key;
    if (k === "ArrowDown" && list[i + 1]) treeFocus(list[i + 1]);
    else if (k === "ArrowUp" && list[i - 1]) treeFocus(list[i - 1]);
    else if (k === "Home") treeFocus(list[0]);
    else if (k === "End") treeFocus(list[list.length - 1]);
    else if (k === "ArrowRight") { if (!treeToggle(node, true)) { var child = node.querySelector(".ds-tree__group .ds-tree__node"); if (child && node.getAttribute("aria-expanded") === "true") treeFocus(child); } }
    else if (k === "ArrowLeft") { if (!treeToggle(node, false)) { var parent = node.parentElement.closest(".ds-tree__node"); if (parent) treeFocus(parent); } }
    else if (k === "Enter" || k === " ") { var row = node.querySelector(".ds-tree__row"); if (row) row.click(); }
    else return false;
    e.preventDefault();
    return true;
  }
  function treeClick(row, t) {
    var node = row.closest(".ds-tree__node");
    if (!node || node.getAttribute("aria-disabled") === "true") return;
    // 링크 줄은 이동이 할 일이라 펼침 표시를 눌렀을 때만 펼친다
    if (row.tagName === "A") { if (t.closest(".ds-tree__toggle")) { treeToggle(node); return true; } return false; }
    treeToggle(node);
    treeSelect(node);
    treeFocus(node);
    return true;
  }

  /* ---- Menu: 켜고 끄는 항목, 하나 고르는 항목, 하위 메뉴 (2026-11-05) ------- */
  function menuClick(item) {
    var role = item.getAttribute("role");
    if (item.getAttribute("aria-haspopup") === "menu" && item.parentElement.classList.contains("ds-menu__sub")) {
      item.setAttribute("aria-expanded", item.getAttribute("aria-expanded") === "true" ? "false" : "true");
      return true;
    }
    if (role === "menuitemcheckbox") { item.setAttribute("aria-checked", item.getAttribute("aria-checked") === "true" ? "false" : "true"); return true; }
    if (role === "menuitemradio") {
      var box = item.closest('[role="group"]') || item.closest(".ds-menu");
      box.querySelectorAll('[role="menuitemradio"]').forEach(function (r) { r.setAttribute("aria-checked", r === item ? "true" : "false"); });
      return true;
    }
    return false;
  }

  /* ---- Date Field: 숫자만 넣으면 점을 넣는다 ------------------------------- */
  function formatDateField(input) {
    var d = input.value.replace(/\D/g, "").slice(0, 8);
    var v = d.length > 6 ? d.slice(0, 4) + "." + d.slice(4, 6) + "." + d.slice(6) : d.length > 4 ? d.slice(0, 4) + "." + d.slice(4) : d;
    if (v !== input.value) input.value = v;
  }

  /* ---- Lightbox ---------------------------------------------------------- */
  function lightboxGo(box, i) {
    var slides = [].slice.call(box.querySelectorAll(".ds-lightbox__slide"));
    if (!slides.length) return;
    i = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, k) { if (k === i) s.setAttribute("aria-current", "true"); else s.removeAttribute("aria-current"); });
    var count = box.querySelector(".ds-lightbox__count");
    if (count) count.textContent = (i + 1) + " / " + slides.length;
    box.querySelectorAll(".ds-lightbox__nav").forEach(function (b) {
      b.disabled = b.getAttribute("data-direction") === "previous" ? i === 0 : i === slides.length - 1;
    });
  }
  function lightboxIndex(box) {
    return [].indexOf.call(box.querySelectorAll(".ds-lightbox__slide"), box.querySelector('.ds-lightbox__slide[aria-current="true"]'));
  }

  /* ---- Toolbar 선택 개수 ------------------------------------------------- */
  function selectionBoxes(table) {
    return [].slice.call(table.querySelectorAll('tbody input[type="checkbox"], [role="listitem"] input[type="checkbox"], li input[type="checkbox"]'));
  }
  function syncSelection(table) {
    var bar = document.getElementById(table.getAttribute("data-ds-selection"));
    if (!bar) return;
    var boxes = selectionBoxes(table), n = boxes.filter(function (b) { return b.checked; }).length;
    var all = table.querySelector('thead input[type="checkbox"]');
    if (all) { all.checked = n > 0 && n === boxes.length; all.indeterminate = n > 0 && n < boxes.length; }
    var count = bar.querySelector(".ds-toolbar__count");
    if (count) count.textContent = (bar.getAttribute("data-count-format") || "{n}개 선택").replace("{n}", n);
    bar.hidden = n === 0;
  }

  /* ---- Mega Menu --------------------------------------------------------- */
  function setMegamenu(trigger, open) {
    var panel = document.getElementById(trigger.getAttribute("data-ds-megamenu"));
    if (!panel) return;
    panel.hidden = !open;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function closeMegamenus(except) {
    document.querySelectorAll('[data-ds-megamenu][aria-expanded="true"]').forEach(function (tr) { if (tr !== except) setMegamenu(tr, false); });
  }

  /* ---- Command Palette --------------------------------------------------- */
  function commandItems(box) {
    return [].slice.call(box.querySelectorAll(".ds-command__item")).filter(function (it) { return !it.hidden; });
  }
  function commandSelect(box, item) {
    box.querySelectorAll(".ds-command__item").forEach(function (it) { it.setAttribute("aria-selected", it === item ? "true" : "false"); });
    var input = box.querySelector(".ds-command__input");
    if (item) { if (item.id && input) input.setAttribute("aria-activedescendant", item.id); item.scrollIntoView({ block: "nearest" }); }
    else if (input) input.removeAttribute("aria-activedescendant");
  }
  function commandFilter(box) {
    var input = box.querySelector(".ds-command__input");
    var q = (input ? input.value : "").trim().toLowerCase();
    box.querySelectorAll(".ds-command__item").forEach(function (it) { it.hidden = !!q && it.textContent.toLowerCase().indexOf(q) < 0; });
    box.querySelectorAll(".ds-command__group").forEach(function (g) { g.hidden = !g.querySelector(".ds-command__item:not([hidden])"); });
    var items = commandItems(box), empty = box.querySelector(".ds-command__empty");
    if (empty) empty.hidden = items.length > 0;
    commandSelect(box, items[0] || null);
  }
  function commandMove(box, step) {
    var items = commandItems(box);
    if (!items.length) return;
    var i = items.indexOf(box.querySelector('.ds-command__item[aria-selected="true"]')) + step;
    if (i < 0) i = items.length - 1; else if (i >= items.length) i = 0;
    commandSelect(box, items[i]);
  }
  function commandReset(box) {
    var input = box.querySelector(".ds-command__input");
    if (input) { input.value = ""; setTimeout(function () { input.focus(); }, 0); }
    commandFilter(box);
  }

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
    (root || document).querySelectorAll("[data-ds-selection]").forEach(syncSelection);
    (root || document).querySelectorAll("dialog.ds-lightbox").forEach(function (b) { lightboxGo(b, Math.max(0, lightboxIndex(b))); });
    (root || document).querySelectorAll(".ds-segmentinput__segment[data-masked]").forEach(segSync);
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

    // Mega Menu 트리거 → 열고 닫기, 바깥이나 링크를 누르면 닫는다
    var mmTrigger = t.closest("[data-ds-megamenu]");
    if (mmTrigger) { var mmOpen = mmTrigger.getAttribute("aria-expanded") !== "true"; closeMegamenus(mmTrigger); setMegamenu(mmTrigger, mmOpen); return; }
    if (!t.closest(".ds-megamenu") || t.closest(".ds-megamenu__link")) closeMegamenus();

    // Lightbox 이전/다음
    var lbNav = t.closest(".ds-lightbox__nav");
    if (lbNav) { var lb = lbNav.closest(".ds-lightbox"); lightboxGo(lb, lightboxIndex(lb) + (lbNav.getAttribute("data-direction") === "previous" ? -1 : 1)); return; }

    // Toolbar 선택 해제 버튼
    var selClear = t.closest(".ds-toolbar__clear");
    if (selClear) {
      var selBar = selClear.closest(".ds-toolbar");
      var selTable = selBar.id && document.querySelector('[data-ds-selection="' + selBar.id + '"]');
      if (selTable) { selectionBoxes(selTable).forEach(function (b) { b.checked = false; }); syncSelection(selTable); }
      else selBar.hidden = true;
      return;
    }

    // Command Palette 항목을 누르면 창을 닫는다 (항목의 할 일은 서비스가 click 으로 받는다)
    var cmdItem = t.closest(".ds-command__item");
    if (cmdItem) { var cmdBox = cmdItem.closest("dialog"); if (cmdBox) closeDialog(cmdBox); return; }

    var treeRow = t.closest(".ds-tree__row");
    if (treeRow && treeClick(treeRow, t)) { e.preventDefault(); return; }
    var menuItem = t.closest(".ds-menu-item");
    if (menuItem && menuClick(menuItem)) return;

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
    var wheelOpt = t.closest(WHEEL_OPT);
    if (wheelOpt) { scrollWheelTo(wheelOpt.parentElement, wheelOpt, true); return; }

    var opener = t.closest("[data-ds-open]");
    if (opener) {
      var opened = openDialog(opener.getAttribute("data-ds-open"));
      if (opened && opened.classList.contains("ds-lightbox")) lightboxGo(opened, +(opener.getAttribute("data-ds-index") || 0));
      if (opened && opened.classList.contains("ds-command")) commandReset(opened);
      return;
    }

    var closer = t.closest("[data-ds-close]");
    if (closer) {
      var inPop = closer.closest(".ds-popover");
      if (inPop) { setPopover(inPop, false); var back = document.querySelector('[data-ds-popover="' + inPop.id + '"]'); if (back) back.focus(); }
      else closeDialog(closer.closest("dialog"));
      return;
    }

    // dialog 바깥(backdrop) 클릭 = dialog 요소 자신이 target
    // 단, Alert(role="alertdialog")는 버튼으로만 닫는다
    if (t.tagName === "DIALOG" && (t.classList.contains("ds-dialog") || t.classList.contains("ds-bottomsheet") || t.classList.contains("ds-menusheet") || t.classList.contains("ds-sidepanel") || t.classList.contains("ds-lightbox") || t.classList.contains("ds-command")) && t.getAttribute("role") !== "alertdialog") closeDialog(t);
    // Lightbox 사진 바깥 빈 곳을 누르면 닫는다
    if (t.classList && t.classList.contains("ds-lightbox__slide")) closeDialog(t.closest("dialog"));
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
    // Command Palette 단축키 (Ctrl/Command + K)
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "k" || e.key === "K")) {
      var hot = document.querySelector('dialog.ds-command[data-ds-hotkey="k"]');
      if (hot) { e.preventDefault(); if (hot.open) closeDialog(hot); else { openDialog(hot.id); commandReset(hot); } return; }
    }
    var openLb = document.querySelector("dialog.ds-lightbox[open]");
    if (openLb && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); lightboxGo(openLb, lightboxIndex(openLb) + (e.key === "ArrowLeft" ? -1 : 1)); return; }
    var cmdInput = e.target.classList && e.target.classList.contains("ds-command__input") ? e.target : null;
    if (cmdInput && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); commandMove(cmdInput.closest(".ds-command"), e.key === "ArrowDown" ? 1 : -1); return; }
    if (cmdInput && e.key === "Enter") {
      var sel = cmdInput.closest(".ds-command").querySelector('.ds-command__item[aria-selected="true"]:not([hidden])');
      if (sel) { e.preventDefault(); sel.click(); }
      return;
    }
    if (e.key === "Escape" && document.querySelector('[data-ds-megamenu][aria-expanded="true"]')) {
      var mmBack = document.querySelector('[data-ds-megamenu][aria-expanded="true"]');
      closeMegamenus(); mmBack.focus(); return;
    }
    var cellK = e.target.closest && e.target.closest(".ds-codeinput__cell");
    if (cellK && codeKey(cellK, e)) return;
    var segK = e.target.closest && e.target.closest(".ds-segmentinput__segment");
    if (segK && segKey(segK, e)) return;
    if (e.target.classList && e.target.classList.contains("ds-tree__node") && treeKey(e.target, e)) return;
    if (e.target.closest && e.target.closest(".ds-toolbar") && toolbarKey(e.target, e)) return;
    if (e.target.getAttribute && e.target.getAttribute("role") === "combobox" && e.target.getAttribute("aria-controls")
      && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") && moveSuggestion(e.target, e)) return;
    if (e.key === "Escape") {
      var open = document.querySelector(".ds-popover[id]:not([hidden]), .ds-multiselect__panel[id]:not([hidden])");
      if (open) { setPopover(open, false); var back = document.querySelector('[data-ds-popover="' + open.id + '"]'); if (back) back.focus(); }
      return;
    }
    var col = isWheelCol(e.target) ? e.target : null;
    if (col && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      var cur = col.querySelector('[role="option"][aria-selected="true"]');
      var next = cur && (e.key === "ArrowUp" ? cur.previousElementSibling : cur.nextElementSibling);
      if (next) scrollWheelTo(col, next, true);
    }
  });

  // Date Field 점 넣기, Command Palette 거르기
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (!t.classList) return;
    if (t.classList.contains("ds-datefield__control")) formatDateField(t);
    else if (t.classList.contains("ds-command__input")) commandFilter(t.closest(".ds-command"));
  });
  // Toolbar 선택: 표의 체크박스가 바뀌면 센다, 머리 체크박스는 모두 고르기
  document.addEventListener("change", function (e) {
    var t = e.target;
    var table = t.closest && t.type === "checkbox" && t.closest("[data-ds-selection]");
    if (!table) return;
    if (t.closest("thead")) selectionBoxes(table).forEach(function (b) { if (!b.disabled) b.checked = t.checked; });
    syncSelection(table);
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
