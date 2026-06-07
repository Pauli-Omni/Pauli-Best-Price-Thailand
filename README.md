# PAULI BEST PRICE THAILAND (Omni Solutions Global)

Landingpage für Preis-/Affiliate‑Orientierung in Thailand: `index.html` + gemeinsames Layout in `style.css`, UI‑Texte für alle Sprachen in `i18n-locales.js` (`window.OSG_LOCALES`, vor dem Hauptskript laden).

## Lokal ausführen

```bash
npm install
npm start
```

Standard laut `server.js` (HTTPS/Port je nach Repo‑Konfiguration). Münz-Texturen: **`public/Frontseite02.png`** (Vorderseite, Avatar + Zylinder-Oberseite; lange Kante ≤1024px) und **`public/hinterseite.jpg`** (Rückseite, ebenfalls ≤1024px, JPEG mit höherer Qualität für QR-Lesbarkeit bei moderater Dateigröße). Optional **`hinterseite.png`** in `public/` als Fallback. Avatar-Stimme (ElevenLabs-Sample, offline-Fallback): **`public/sounds/pauli-avatar-voice.m4a`** (~420 KB). Live-Sprache weiter über `/api/tts`; ohne API nutzt die App diese Datei vor der Browser-Stimme.

Öffnen per `http://localhost:…`; für die 3D‑Münze und absolute Pfade unter `/ …` ohne Server hilft lokales Serving statt nur `file://`.

## Checks

```bash
npm run check:html
```

Prüft `index.html` mit [html-validate](https://html-validate.org/). CSS und `i18n-locales.js` sind dort nicht eingebunden; bei Textänderungen nur `i18n-locales.js` anpassen und Seite kurz alle Sprachen durchklicken.

## Mehrkanal (App Stores / TV)

Checkliste und realistische Security-Erwartung: `deploy-omni-solutions/STORE-ROLLOUT-CHECKLIST.txt`.  
API-Aufrufe nutzen `osgApiFetch` mit `X-OSG-Channel` / `X-OSG-Build`; Shell setzt `OSG_CLIENT_CHANNEL` / `OSG_CLIENT_BUILD` (siehe `osg-runtime-config.example.js`).

## Go-Live (Online-Schaltung)

Schritt-für-Schritt: **[GO-LIVE-CHECKLIST.md](./GO-LIVE-CHECKLIST.md)** (`.env`, Domain, Rechtstexte, Handy-Test).

Render.com: `render.yaml` + Secrets im Dashboard. Admin nur mit `osg-admin-secret.prod.js` (siehe `deploy-omni-solutions/osg-admin-secret.example.js`).

## Deploy (Überblick)

Auf Produktion sollten zusammen ausgeliefert werden:

- `index.html`, `style.css`, `i18n-locales.js`
- Bilder/audio für Münze & Sounds (wie in der Seite referenziert)
- gültiges TLS, falls Mikrofon/Audio‑Politik eingeschränkt ist

Responsive Verhalten ist in `style.css` für schmale Viewports (inkl. `safe-area-inset*` und `100dvh`) und die rechte/fliegende Münzen‑Position zusammenhängend definiert.
