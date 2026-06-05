/**
 * Produktion: Kopie als osg-admin-secret.prod.js neben index.html.
 * NIE committen — in .gitignore.
 *
 * In index.html VOR dem großen App-Script einbinden:
 *   <script src="osg-admin-secret.prod.js"></script>
 */
(function () {
  window.__OSG_ADMIN_SECRET__ = "HIER_STARKES_PASSWORT_EINSETZEN";
})();
