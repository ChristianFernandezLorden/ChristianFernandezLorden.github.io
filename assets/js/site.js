/* Light / dark switch. Follows the system setting until the visitor chooses. */
(function () {
  "use strict";
  var toggle = document.getElementById("theme-toggle");
  if (!toggle) return;
  var root = document.documentElement;
  var system = window.matchMedia("(prefers-color-scheme: dark)");

  function current() {
    return root.getAttribute("data-theme") || (system.matches ? "dark" : "light");
  }
  function label() {
    toggle.textContent = current() === "dark" ? "Light mode" : "Dark mode";
  }

  toggle.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    label();
    document.dispatchEvent(new Event("themechange"));
  });
  system.addEventListener("change", label);

  label();
  toggle.hidden = false;
})();
