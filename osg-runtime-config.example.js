/**
 * Produktion (Hauptseite + API auf getrennten Hosts):
 * 1) Kopie: cp osg-runtime-config.example.js osg-runtime-config.js
 * 2) API-URL anpassen (ohne trailing slash)
 * 3) In index.html bereits eingebunden: <script src="osg-runtime-config.js"></script>
 *
 * Gleiche Domain (alles auf einem Server): diese Datei NICHT anlegen — /api/ bleibt relativ.
 */
(function () {
  window.OSG_API_BASE = "https://api.omnisolutionsglobal.com";

  /** Optional: native App-Shell setzt Kanal/Build für Lead-Tracking */
  // window.OSG_CLIENT_CHANNEL = "ios-app";
  // window.OSG_CLIENT_BUILD = "1.0.0";
})();
