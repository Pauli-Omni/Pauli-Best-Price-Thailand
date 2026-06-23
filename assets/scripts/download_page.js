/**
 * Download hub — hydrates i18n and artifact links.
 */
(function () {
  "use strict";

  var LANGS = [
    "th", "en", "de", "pl", "ru", "zh",
    "fr", "es", "it", "pt", "nl",
    "ar", "ja", "ko", "vi", "tr", "hi", "id",
  ];

  function norm(code) {
    var c = String(code || "en")
      .toLowerCase()
      .split("-")[0];
    return LANGS.indexOf(c) >= 0 ? c : "en";
  }

  function pack(lang) {
    var L = window.OSG_DOWNLOAD_LOCALES || {};
    return L[lang] || L.en || {};
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el && val) el.textContent = val;
  }

  function wireLang() {
    var sel = document.getElementById("dl-lang");
    if (!sel) return;
    LANGS.forEach(function (code) {
      var o = document.createElement("option");
      o.value = code;
      o.textContent = code.toUpperCase();
      sel.appendChild(o);
    });
    var saved = "en";
    try {
      saved = norm(localStorage.getItem("osg-lang") || navigator.language);
    } catch (_) {}
    sel.value = saved;
    sel.addEventListener("change", function () {
      applyLang(sel.value);
      try {
        localStorage.setItem("osg-lang", sel.value);
      } catch (_) {}
    });
    applyLang(saved);
  }

  function applyLang(code) {
    var p = pack(norm(code));
    document.documentElement.lang =
      code === "zh" ? "zh-CN" : code === "th" ? "th" : code;
    document.title = p.pageTitle || "";
    setText("dl-heading", p.heading);
    setText("dl-lead", p.lead);
    setText("dl-pwa-heading", p.pwaHeading);
    setText("dl-pwa-lead", p.pwaLead);
    setText("dl-pwa-open", p.pwaOpenBtn);
    setText("dl-pwa-ios", p.pwaIos);
    setText("dl-pwa-android", p.pwaAndroid);
    setText("dl-pwa-desktop", p.pwaDesktop);
    setText("dl-native-heading", p.nativeHeading);
    setText("dl-android-label", p.androidLabel);
    setText("dl-mac-label", p.macLabel);
    setText("dl-win-label", p.winLabel);
    setText("dl-linux-label", p.linuxLabel);
    setText("dl-ios-label", p.iosLabel);
    setText("dl-ios-note", p.iosNote);
    setText("dl-stores-heading", p.storesHeading);
    setText("dl-aptoide", p.aptoide);
    setText("dl-lang-label", p.langLabel);
    setText("dl-android-missing", p.androidMissing);
    setText("dl-mac-missing", p.macMissing);
    setText("dl-win-missing", p.winMissing);
    setText("dl-linux-missing", p.linuxMissing);
    var ab = document.getElementById("dl-android-btn");
    if (ab) ab.textContent = p.androidBtn || "";
    var mb = document.getElementById("dl-mac-btn");
    if (mb) mb.textContent = p.macBtn || "";
    var wb = document.getElementById("dl-win-btn");
    if (wb) wb.textContent = p.winBtn || "";
    var lb = document.getElementById("dl-linux-btn");
    if (lb) lb.textContent = p.linuxBtn || "";
  }

  function artifactLinks() {
    var base = "/downloads/";
    var files = [
      { id: "dl-android-btn", path: "pauli-best-price-universal.apk", missing: "dl-android-missing" },
      { id: "dl-mac-btn", path: "pauli-best-price-macos.zip", missing: "dl-mac-missing" },
      { id: "dl-win-btn", path: "pauli-best-price-windows.zip", missing: "dl-win-missing" },
      { id: "dl-linux-btn", path: "pauli-best-price-linux.tar.gz", missing: "dl-linux-missing" },
    ];
    files.forEach(function (f) {
      var btn = document.getElementById(f.id);
      var miss = document.getElementById(f.missing);
      if (!btn) return;
      fetch(base + f.path, { method: "HEAD" })
        .then(function (r) {
          if (r.ok) {
            btn.href = base + f.path;
            btn.removeAttribute("hidden");
            if (miss) miss.setAttribute("hidden", "");
          } else {
            btn.setAttribute("hidden", "");
            if (miss) miss.removeAttribute("hidden");
          }
        })
        .catch(function () {
          btn.setAttribute("hidden", "");
          if (miss) miss.removeAttribute("hidden");
        });
    });
  }

  document.getElementById("dl-pwa-open")?.setAttribute("href", "/");
  wireLang();
  artifactLinks();
})();
