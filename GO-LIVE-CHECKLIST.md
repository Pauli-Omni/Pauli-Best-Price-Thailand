# PAULI BEST PRICE THAILAND — Go-Live Checkliste

Technische Basis ist vorbereitet. Vor dem öffentlichen Start diese Punkte abhaken.

---

## 1. Hosting & Domain (Pflicht)

**Sofort-Fix wenn Partner „HTTPS nicht erreichbar“ melden:** `deploy-omni-solutions/URGENT-HTTPS-FIX.txt`  
(Domain `omnisolutionsglobal.com` nutzt **Cloudflare-Nameserver** — DNS-Records dort setzen, nicht nur Namecheap.)

- [ ] **HTTPS** auf Hauptdomain (z. B. `https://omnisolutionsglobal.com`)
- [ ] **Node-Server** läuft dauerhaft (`node server.js` oder Render/cPanel Node)
- [ ] **`GET /api/health`** → `{"ok":true}`
- [ ] Ordner **`data/`** ist beschreibbar und bleibt bei Deploy erhalten

### Gleiche Domain (einfach)

- App und API auf **einer** Origin → `osg-runtime-config.js` **nicht** nötig (relative `/api/…`-Aufrufe).

### Getrennte API (`api.*`)

1. `cp osg-runtime-config.example.js osg-runtime-config.js`
2. In `osg-runtime-config.js` setzen:
   ```js
   window.OSG_API_BASE = "https://api.omnisolutionsglobal.com";
   ```
3. Datei **vor** `index.html`-Skripten laden (bereits im `<head>` vorgesehen).

---

## 2. Server `.env` (Pflicht — nur auf dem Host, nie Git)

Kopie von `.env.example` → `.env` und ausfüllen:

| Variable | Pflicht | Zweck |
|---|---|---|
| `OSG_INSTALL_FP_SALT` | **Ja** | Langer Zufallsstring (32+ Zeichen) |
| `OSG_CORS_ORIGINS` | **Ja** | Deine Live-Domain(s), kommagetrennt |
| `OSG_API_ALLOWED_ORIGINS` | **Ja** | Meist identisch mit CORS |
| `ELEVENLABS_API_KEY` | **Ja** (Pauli spricht) | TTS / Intro / Münze |
| `ELEVENLABS_VOICE_ID` | **Ja** | Stimme in ElevenLabs |
| `OPENAI_API_KEY` | Empfohlen | Safari/Firefox „Hallo Pauli“ (Whisper STT) |
| `DISABLE_HTTPS` | `1` hinter Reverse-Proxy | Render/nginx macht TLS |

Smoke-Test nach Deploy:

```bash
curl -sS https://api.DEINE-DOMAIN.de/api/health
curl -sI https://api.DEINE-DOMAIN.de/.env   # muss 404 sein
```

---

## 3. Render.com (falls genutzt)

In der Render-Web-UI unter **Environment** eintragen (Secrets mit „Sync: false“):

- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- `OPENAI_API_KEY` (für Voice-Wake auf Safari/Firefox)
- `OSG_INSTALL_FP_SALT` (wird in `render.yaml` bereits generiert)

`render.yaml` im Repo ist die Vorlage — fehlende Keys manuell im Dashboard ergänzen.

---

## 4. Admin-Dashboard absichern (Pflicht Live)

- [ ] **Nicht** mit Demo-Passwort live gehen (ist auf Produktion deaktiviert).
- [ ] `cp deploy-omni-solutions/osg-admin-secret.example.js osg-admin-secret.prod.js`
- [ ] Starkes Passwort setzen: `window.__OSG_ADMIN_SECRET__ = "…";`
- [ ] **Vor** dem großen Inline-Script in `index.html` einbinden:
  ```html
  <script src="osg-admin-secret.prod.js"></script>
  ```
- [ ] `osg-admin-secret.prod.js` in `.gitignore` (bereits vorgesehen)

Ohne diese Datei: Dreifach-Tipp auf „Omni Solutions Global“ tut auf Live **nichts** (gewollt).

---

## 5. Rechtstexte (Pflicht vor Marketing/Stores)

In `legal-pages.js` ersetzen (siehe `deploy-omni-solutions/LEGAL-PLACEHOLDERS.txt`):

- [ ] `[DBD_REGISTRATION_NUMBER]`
- [ ] `[REGISTERED_OFFICE_ADDRESS_TH]`
- [ ] Anwalt/Kanzlei hat Impressum, AGB, Affiliate geprüft

---

## 6. Assets

- [ ] `public/Frontseite02.png` (Münz-Vorderseite)
- [ ] `public/hinterseite.jpg` (Münz-Rückseite)

---

## 7. Handy-Test (5 Minuten)

| Gerät | Test |
|---|---|
| iPhone Safari | Seite öffnen → **einmal tippen** → Intro hörbar? |
| iPhone Safari | Wake-Button → Mikro erlauben → „Hallo Pauli“ oder Button |
| Android Chrome | Intro + Münze + Sprach-Wake |
| Desktop | `Cmd+Shift+R`, Münze, Sprachwahl DE/EN/TH |

Ohne `OPENAI_API_KEY`: Wake-**Button** aktiviert Pauli trotzdem (Push-to-Talk).

---

## 8. Nach Go-Live (optional, später)

- VIP/Premium serverseitig statt nur `localStorage`
- Echter Kauf-/Abo-Nachweis (59 THB) an API anbinden
- Redis für Rate-Limits bei hohem Traffic

---

**Stand:** Automatisch generiert für Omni Solutions Global / PAULI BEST PRICE THAILAND.
