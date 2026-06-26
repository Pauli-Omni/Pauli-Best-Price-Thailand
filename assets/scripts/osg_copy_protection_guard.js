/* OSG Copy-Protection Guard — extracted from index.html (P1 cold-start) */
(function () {
  var PROTECTED_SELECTORS = [
    ".compare-panel",
    ".compare-table",
    ".brand-app-title",
    ".page .lead",
    "#partner-affiliate-panel",
    ".partner-panel",
    ".osg-b2b-list",
    "#coin-stage",
    ".coin-stage",
  ];

  function isProtected(el) {
    if (!el) return false;
    for (var i = 0; i < PROTECTED_SELECTORS.length; i++) {
      try {
        if (el.closest && el.closest(PROTECTED_SELECTORS[i])) return true;
      } catch (_) {}
    }
    return false;
  }

  document.addEventListener(
    "contextmenu",
    function (e) {
      if (isProtected(e.target)) e.preventDefault();
    },
    true
  );

  document.addEventListener(
    "copy",
    function (e) {
      if (isProtected(e.target)) e.preventDefault();
    },
    true
  );

  document.addEventListener(
    "cut",
    function (e) {
      if (isProtected(e.target)) e.preventDefault();
    },
    true
  );

  document.addEventListener(
    "dragstart",
    function (e) {
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    },
    true
  );

  document.addEventListener(
    "keydown",
    function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        if (isProtected(document.activeElement)) e.preventDefault();
      }
    },
    true
  );
})();
