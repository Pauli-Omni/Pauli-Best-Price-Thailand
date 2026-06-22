# Pauli Best Price — Live Deploy (A1 / A2)

## 1. GitHub (erledigt wenn `main` auf origin)

```bash
git push origin main
```

## 2. Render — Service `pauli-best-price-api` (Pflicht für `/api/health`)

**Ursache 404:** Der Service existiert auf Render noch nicht. Nur `omnisolutionsglobal-web` ist aktiv.

### Einmalig im Browser

1. GitHub → **Settings → Applications → Render** → Repository **pauli-bestpreis-Thailand** freigeben.
2. Render → **Blueprints → New Blueprint Instance** → Repo `Pauli-Omni/pauli-bestpreis-Thailand`, Branch `main`, `render.yaml`.

### Oder per Skript (nach GitHub-Freigabe)

```bash
export RENDER_API_KEY="…"   # Render Dashboard → Account Settings → API Keys
npm run render:deploy-api
```

Health nach Deploy: `https://pauli-best-price-api.onrender.com/api/health` → **200** `{ ok: true, … }`

## 3. Client-API-Basis

`osg-runtime-config.js` zeigt auf Render:

```js
window.OSG_API_BASE = "https://pauli-best-price-api.onrender.com";
```

Optional später: Custom Domain `api.omnisolutionsglobal.com` → Render Service.

## 4. Involve Asia (A4)

Im Render-Dashboard **echte** Werte setzen (nicht Platzhalter `general`):

- `INVOLVE_ASIA_API_KEY`
- `INVOLVE_ASIA_API_SECRET`
- Offer-IDs: `INVOLVE_ASIA_OFFER_LAZADA_TH`, `SHOPEE`, `BIGC`, `LOTUS_TH`

## 5. SMTP (Support-Tickets)

Render Env:

- `OSG_SMTP_HOST=mail.privateemail.com`
- `OSG_SMTP_PORT=587`
- `OSG_SMTP_USER`, `OSG_SMTP_PASS`, `OSG_SMTP_FROM`

## 6. Multi-Platform Download (PWA + Native Sideload)

**Download-Hub (6 Sprachen):** `/download` oder `/download.html`

| Plattform | Methode | URL / Datei |
|-----------|---------|-------------|
| **iPhone / iPad** | PWA (ohne App Store) | `/download` → Safari → „Zum Home-Bildschirm“ |
| **Android** | PWA oder APK | `/downloads/pauli-best-price-universal.apk` + Aptoide |
| **MacBook (macOS)** | PWA oder `.app` Zip | `/downloads/pauli-best-price-macos.zip` |
| **Windows** | PWA oder Desktop-Zip | `/downloads/pauli-best-price-windows.zip` |
| **Linux** | PWA oder `.tar.gz` | `/downloads/pauli-best-price-linux.tar.gz` |

PWA: `manifest.webmanifest` + `sw.js` — installierbar in Chrome, Edge, Safari.

Native Shell: Flutter WebView lädt die Live-Web-App (`PAULI_WEB_URL`, Standard: Render-URL).

```bash
npm run build:stores
```

Output:

- `build/store-exports/` — alle Plattform-Artefakte
- `public/downloads/` — Dateien für direkten Web-Download nach Deploy

**Aptoide:** APK aus `public/downloads/` hochladen (siehe `~/Desktop/OSG-Pauli-Release-Paket/Aptoide/`).

**iOS IPA:** Nur mit Apple-Signierung (TestFlight / AltStore); ohne Developer-Account → **PWA empfohlen**.

## 7. i18n-Trennung

| Produkt | UI | Sprache Avatar / Vorlesen |
|---------|-----|---------------------------|
| **Omni Solutions Global Homepage** | 6 Sprachen (de, en, th, pl, ru, zh) | ~240 statische MP3s (`OmniSolutionsGlobal WEBSEITE/scripts/generate-all-narration.js`) |
| **Pauli BestPrice Thailand** | 6 vollständige UI-Packs | **Unbegrenzt** — dynamisches TTS (`world_language_engine.js`, Web Speech + `/api/tts`) |
