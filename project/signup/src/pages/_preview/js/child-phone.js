/* ==========================================================================
   회원가입 > 만14세 미만 — 실사용자(아동) 휴대전화번호 (SB.26 · SB.27 · SB.28)
   --------------------------------------------------------------------------
   · SB.26 아동 번호 입력 — 국내 번호만(통신사·국가번호 선택 없음), 010 자동 입력, 010-0000-0000 자동 포맷
     [인증번호 발송] → 인증번호 입력 팝업(verify.js) → 인증 성공 → 가입완료(SB.30)
   · 휴대전화가 없을 때 — 보호자 인증 수단에 따라 갈린다 (보호자 동의 SB.22 에서 고른 값)
       보호자 휴대전화 인증 → SB.27 입력 없이 인증한 보호자 번호를 등록. [가입하기] 는 항상 활성
       보호자 아이핀 인증   → SB.28 보호자 번호를 받아 인증 후 등록 (?auth=ipin, 아이핀에는 번호가 없음)
   · 하단 링크로 SB.26 과 오간다 (문구를 고칠 때는 같이 본다)
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var cards = $$(".signup-card[data-case]");
  var ERROR = "휴대전화번호가 정확한지 확인해 주세요.";

  // 보호자를 아이핀으로 인증했는지 (실서비스는 서버 값)
  var ipin = /(?:^|[?&])auth=ipin(?:&|$)/.test(location.search);

  function digits(v) { return v.replace(/\D/g, ""); }
  function formatPhone(v) {
    var d = digits(v).slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + "-" + d.slice(3);
    if (d.length === 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
    return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  }

  // 번호 입력 폼 (SB.26 아동 · SB.28 보호자 — 같은 규칙)
  function phoneForm(form, input, help, cta) {
    function isValid() { return /^01[016789]\d{7,8}$/.test(digits(input.value)); }
    function show(final) {
      var d = digits(input.value);
      var err = !isValid() && d.length > 3 && (final || d.length >= 11);
      if (err) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
      help.textContent = err ? ERROR : "";
      help.hidden = !err;
      cta.disabled = !isValid();
    }
    input.addEventListener("input", function () { input.value = formatPhone(input.value); show(false); });
    input.addEventListener("blur", function () { show(true); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!cta.disabled) SignupVerify.openOtp(input.value);
    });
    return {
      input: input,
      reset: function (value, final) { input.value = value || "010"; show(!!final); },
      focus: function () { input.focus(); try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} }
    };
  }
  var forms = {
    phone: phoneForm($("#phone-form"), $("#phone"), $("#phone-help"), $("#phone-cta")),
    guardian: phoneForm($("#guardian-form"), $("#guardian-phone"), $("#guardian-phone-help"), $("#guardian-cta"))
  };

  function showCase(key) {
    cards.forEach(function (c) { c.hidden = c.getAttribute("data-case") !== key; });
  }

  // 인증 성공 → 가입완료 (SB.30 = SB.18 과 같은 화면). SB.28 은 보호자 번호를 회원정보에 저장(서버)
  SignupVerify.onVerified(function () { location.href = "complete.html#sb29"; });

  $("#to-notice").addEventListener("click", function () { location.hash = ipin ? "sb28-ipin" : "sb27"; });
  $("#to-phone").addEventListener("click", function () { location.hash = "sb26"; });
  $("#guardian-to-phone").addEventListener("click", function () { location.hash = "sb26"; });
  // 보호자 번호를 회원정보에 저장하고 가입 완료 처리 (서버) → SB.30
  $("#notice-cta").addEventListener("click", function () { location.href = "complete.html#sb29"; });

  /* ---- 바로가기 해시 — 가이드 뷰어·QA 전용 데모 코드 (실서비스에서는 제거) ---- */
  var PRESETS = {
    "sb26":       { card: "phone" },
    "sb26-error": { card: "phone", phone: "01000", final: true },
    "sb26-otp":   { card: "phone", phone: "010-1234-5678", otp: true },
    "sb27":       { card: "notice" },
    "sb28-ipin":     { card: "guardian" },
    "sb28-ipin-otp": { card: "guardian", phone: "010-1234-5678", otp: true }
  };
  function applyHash() {
    SignupVerify.closeAll();
    var p = PRESETS[location.hash.replace("#", "")] || PRESETS.sb26;
    if (p.card === "guardian") ipin = true;   // SB.28 을 거치면 SB.26 의 링크도 SB.28 로
    showCase(p.card);
    var f = forms[p.card];
    if (!f) return;
    f.reset(p.phone, p.final);
    if (p.otp) SignupVerify.openOtp(f.input.value, { elapsed: 2 });
    else f.focus();
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
