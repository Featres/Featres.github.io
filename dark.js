// piotr-marciniak.com — theme switcher
// Themes are stored in localStorage under 'theme' and applied via
// data-theme on <html>. A pre-paint inline script in each <head>
// sets the attribute before first render to avoid any flash.
(function () {
  'use strict';

  var THEMES = ['stone', 'dark', 'ocean', 'grain'];
  var DEFAULT = 'grain';

  window.setTheme = function (name) {
    if (!THEMES.includes(name)) return;
    document.documentElement.setAttribute('data-theme', name);
    try { localStorage.setItem('theme', name); } catch (e) {}
    document.querySelectorAll('.theme-dot').forEach(function (d) {
      d.classList.toggle('active', d.dataset.theme === name);
    });
  };

  function init() {
    var saved;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    setTheme(THEMES.includes(saved) ? saved : DEFAULT);
  }

  init();
  document.addEventListener('DOMContentLoaded', init);
})();
