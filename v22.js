/* RIHULA V2.2 shared enhancements */
(function () {
  "use strict";

  window.normalizeKenyanPhone = function (value) {
    let d = String(value || "").replace(/\D/g, "");
    if (d.startsWith("254")) d = d.slice(3);
    if (d.startsWith("0")) d = d.slice(1);
    if (/^[71]\d{8}$/.test(d)) return Number("254" + d);
    return null;
  };

  function addPasswordToggle(input) {
    if (!input || input.dataset.v22Toggle === "1") return;
    input.dataset.v22Toggle = "1";

    const wrap = input.parentElement;
    if (!wrap) return;
    wrap.classList.add("password-field");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "password-toggle";
    button.setAttribute("aria-label", "Show password");
    button.setAttribute("title", "Show password");
    button.textContent = "👁️";

    button.addEventListener("click", function () {
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.textContent = showing ? "👁️" : "🙈";
      button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      button.setAttribute("title", showing ? "Show password" : "Hide password");
    });

    wrap.appendChild(button);
  }

  function init() {
    document.querySelectorAll('input[type="password"]').forEach(addPasswordToggle);

    // Normalize phone fields on blur without changing what the user typed while editing.
    document.querySelectorAll('input[type="tel"], input[id*="phone" i]').forEach(function (input) {
      input.addEventListener("blur", function () {
        const normalized = window.normalizeKenyanPhone(input.value);
        if (normalized) input.dataset.normalizedPhone = String(normalized);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
