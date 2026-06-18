PAULI BEST PRICE THAILAND — VIP-QR-CODES MASTER (56 Slots)
==========================================================
Stand: 2026-05-30
Tresor: 05_Dokumentation/VIP_QR_Codes_Master/
Quelle der Codes: 03_Datenbank_und_Preise/data/vip_codes.json
SVG-Master (editierbar): dieser Ordner (*.svg)
PNG-Arbeitskopien (Druck/Share): VIP Zugang/ (*.png, nach npm run vip:qr)
Regenerierung: scripts/generate-vip-qr-only.mjs

ZWECK
-----
Jeder der 56 QR-Codes öffnet die App mit ?osg_vip=CODE und aktiviert den
Pauli-Friends-VIP-Zugang (Lifetime, unabhängig vom 7-Tage-Trial).
Die Rollen steuern Einladungsrechte, Geschenk-THB beim ersten Scan,
Provisions-Sätze und UI-Farben (Bronze / Silber / Gold / Grün / Lila).

ROLLEN-ÜBERSICHT (5 Gruppen + Inhaber)
--------------------------------------
| Slots   | Gruppe (Datei-Key) | Anzeige-Rolle        | Techn. role      | Farbe   |
|---------|--------------------|----------------------|------------------|---------|
| 01–30   | friends_core       | Pauli-Friends        | vip_core         | Bronze  |
| 31–40   | influencer         | Influencer           | influencer       | Silber  |
| 41–50   | vip_influencer     | Gold-Ticket          | vip_influencer   | Gold    |
| 51–54   | family_special     | Familie              | family_special   | Grün    |
| 55      | owners             | Wii (Inhaberin)      | wii_owner        | Lila    |
| 56      | owners             | Pauli (Admin)        | pauli_owner      | Lila    |

Hinweise zu Begriffen:
  · „Gold-Ticket“ = VIP-Influencer-Stufe (Slots 41–50), goldene QR-Prägung.
  · „Admin“ = Slot 56 (Pauli): canViewAllStats = true, unbegrenzte Einladungen.
  · „Familie“ = Slots 51–54 mit benannten Labels (Mama, Schwester, Bruder, FREUND-in).

RECHTE & GESCHENK (server.js — vipBuildProfiles / vipGiftFromProfile)
---------------------------------------------------------------------
| Slots   | Einladungen              | Geschenk beim Scan | Provision/Kauf |
|---------|--------------------------|---------------------|----------------|
| 01–30   | 1 Freund gratis          | 59 THB              | —              |
| 31–40   | —                        | kein Overlay        | 1,00 THB       |
| 41–50   | —                        | kein Overlay        | 5,00 THB       |
| 51–54   | 3 Freunde gratis         | 177 THB (3×59)      | —              |
| 55      | unbegrenzt, Kaskade 2    | 118 THB (2×59), Absender „Wii“   | — |
| 56      | unbegrenzt, Kaskade 2    | 118 THB (2×59), Absender „Pauli“ | — |

DATEINAMEN-KONVENTION
---------------------
vip-qr-{NN}-{CODE}.svg
  NN   = Slot 01–56 (zweistellig)
  CODE = Eintrag aus vip_codes.json (z. B. PF-7RQNT6ZG)

VOLLSTÄNDIGE LISTE — 56 QR-CODES
--------------------------------
Nr | Code          | Gruppe         | Rolle (Anzeige)     | Label / Besonderes        | SVG-Datei
---|---------------|----------------|---------------------|---------------------------|----------------------------------
01 | PF-7RQNT6ZG   | friends_core   | Pauli-Friends       | VIP-01                    | vip-qr-01-PF-7RQNT6ZG.svg
02 | PF-FZVRU9XB   | friends_core   | Pauli-Friends       | VIP-02                    | vip-qr-02-PF-FZVRU9XB.svg
03 | PF-4T9TS827   | friends_core   | Pauli-Friends       | VIP-03                    | vip-qr-03-PF-4T9TS827.svg
04 | PF-JP6W3ZY8   | friends_core   | Pauli-Friends       | VIP-04                    | vip-qr-04-PF-JP6W3ZY8.svg
05 | PF-XHBBQY35   | friends_core   | Pauli-Friends       | VIP-05                    | vip-qr-05-PF-XHBBQY35.svg
06 | PF-Z7TBKNG6   | friends_core   | Pauli-Friends       | VIP-06                    | vip-qr-06-PF-Z7TBKNG6.svg
07 | PF-PNDDA5TY   | friends_core   | Pauli-Friends       | VIP-07                    | vip-qr-07-PF-PNDDA5TY.svg
08 | PF-6R8DJENF   | friends_core   | Pauli-Friends       | VIP-08                    | vip-qr-08-PF-6R8DJENF.svg
09 | PF-4AP84FK3   | friends_core   | Pauli-Friends       | VIP-09                    | vip-qr-09-PF-4AP84FK3.svg
10 | PF-S27C6WYW   | friends_core   | Pauli-Friends       | VIP-10                    | vip-qr-10-PF-S27C6WYW.svg
11 | PF-NHH4JZ8X   | friends_core   | Pauli-Friends       | VIP-11                    | vip-qr-11-PF-NHH4JZ8X.svg
12 | PF-AZZNZ7VH   | friends_core   | Pauli-Friends       | VIP-12                    | vip-qr-12-PF-AZZNZ7VH.svg
13 | PF-UFZUB6BZ   | friends_core   | Pauli-Friends       | VIP-13                    | vip-qr-13-PF-UFZUB6BZ.svg
14 | PF-63DZL5VP   | friends_core   | Pauli-Friends       | VIP-14                    | vip-qr-14-PF-63DZL5VP.svg
15 | PF-33K334Z9   | friends_core   | Pauli-Friends       | VIP-15                    | vip-qr-15-PF-33K334Z9.svg
16 | PF-U8Z9XFEB   | friends_core   | Pauli-Friends       | VIP-16                    | vip-qr-16-PF-U8Z9XFEB.svg
17 | PF-6CPZ6C22   | friends_core   | Pauli-Friends       | VIP-17                    | vip-qr-17-PF-6CPZ6C22.svg
18 | PF-SGX2EMZX   | friends_core   | Pauli-Friends       | VIP-18                    | vip-qr-18-PF-SGX2EMZX.svg
19 | PF-4PSYL7LF   | friends_core   | Pauli-Friends       | VIP-19                    | vip-qr-19-PF-4PSYL7LF.svg
20 | PF-L353FAM6   | friends_core   | Pauli-Friends       | VIP-20                    | vip-qr-20-PF-L353FAM6.svg
21 | PF-NVXYEBFG   | friends_core   | Pauli-Friends       | VIP-21                    | vip-qr-21-PF-NVXYEBFG.svg
22 | PF-B5W5VHLB   | friends_core   | Pauli-Friends       | VIP-22                    | vip-qr-22-PF-B5W5VHLB.svg
23 | PF-NVAN44UV   | friends_core   | Pauli-Friends       | VIP-23                    | vip-qr-23-PF-NVAN44UV.svg
24 | PF-YKNQXBA7   | friends_core   | Pauli-Friends       | VIP-24                    | vip-qr-24-PF-YKNQXBA7.svg
25 | PF-JJRNWEG9   | friends_core   | Pauli-Friends       | VIP-25                    | vip-qr-25-PF-JJRNWEG9.svg
26 | PF-3BVA2G3R   | friends_core   | Pauli-Friends       | VIP-26                    | vip-qr-26-PF-3BVA2G3R.svg
27 | PF-TDV72KKC   | friends_core   | Pauli-Friends       | VIP-27                    | vip-qr-27-PF-TDV72KKC.svg
28 | PF-FRZLUGSE   | friends_core   | Pauli-Friends       | VIP-28                    | vip-qr-28-PF-FRZLUGSE.svg
29 | PF-K59D7YCB   | friends_core   | Pauli-Friends       | VIP-29                    | vip-qr-29-PF-K59D7YCB.svg
30 | PF-ELK2AP9D   | friends_core   | Pauli-Friends       | VIP-30                    | vip-qr-30-PF-ELK2AP9D.svg
31 | PF-PW4GKWWP   | influencer     | Influencer          | VIP-31                    | vip-qr-31-PF-PW4GKWWP.svg
32 | PF-RN595VTS   | influencer     | Influencer          | VIP-32                    | vip-qr-32-PF-RN595VTS.svg
33 | PF-LPXPDS3L   | influencer     | Influencer          | VIP-33                    | vip-qr-33-PF-LPXPDS3L.svg
34 | PF-LRCT964T   | influencer     | Influencer          | VIP-34                    | vip-qr-34-PF-LRCT964T.svg
35 | PF-SKVAMGZU   | influencer     | Influencer          | VIP-35                    | vip-qr-35-PF-SKVAMGZU.svg
36 | PF-Z9H494K3   | influencer     | Influencer          | VIP-36                    | vip-qr-36-PF-Z9H494K3.svg
37 | PF-JPZQUT56   | influencer     | Influencer          | VIP-37                    | vip-qr-37-PF-JPZQUT56.svg
38 | PF-QFQGPW28   | influencer     | Influencer          | VIP-38                    | vip-qr-38-PF-QFQGPW28.svg
39 | PF-RX9D829Y   | influencer     | Influencer          | VIP-39                    | vip-qr-39-PF-RX9D829Y.svg
40 | PF-7JA5XJH4   | influencer     | Influencer          | VIP-40                    | vip-qr-40-PF-7JA5XJH4.svg
41 | PF-GESVSXUB   | vip_influencer | Gold-Ticket         | VIP-41                    | vip-qr-41-PF-GESVSXUB.svg
42 | PF-7VHQSAGB   | vip_influencer | Gold-Ticket         | VIP-42                    | vip-qr-42-PF-7VHQSAGB.svg
43 | PF-UM7LPSDW   | vip_influencer | Gold-Ticket         | VIP-43                    | vip-qr-43-PF-UM7LPSDW.svg
44 | PF-ZJF68QHE   | vip_influencer | Gold-Ticket         | VIP-44                    | vip-qr-44-PF-ZJF68QHE.svg
45 | PF-2YDTG69F   | vip_influencer | Gold-Ticket         | VIP-45                    | vip-qr-45-PF-2YDTG69F.svg
46 | PF-HG7C2DVV   | vip_influencer | Gold-Ticket         | VIP-46                    | vip-qr-46-PF-HG7C2DVV.svg
47 | PF-L7NAC3FN   | vip_influencer | Gold-Ticket         | VIP-47                    | vip-qr-47-PF-L7NAC3FN.svg
48 | PF-3XT6U5H5   | vip_influencer | Gold-Ticket         | VIP-48                    | vip-qr-48-PF-3XT6U5H5.svg
49 | PF-JTEDPJGE   | vip_influencer | Gold-Ticket         | VIP-49                    | vip-qr-49-PF-JTEDPJGE.svg
50 | PF-83F29VYK   | vip_influencer | Gold-Ticket         | VIP-50                    | vip-qr-50-PF-83F29VYK.svg
51 | PF-GKHXNE5D   | family_special | Familie             | Mama                      | vip-qr-51-PF-GKHXNE5D.svg
52 | PF-ANL9WG6C   | family_special | Familie             | Schwester                 | vip-qr-52-PF-ANL9WG6C.svg
53 | PF-NH2MPGGB   | family_special | Familie             | Bruder                    | vip-qr-53-PF-NH2MPGGB.svg
54 | PF-8MAMYEZY   | family_special | Familie             | FREUND-in                 | vip-qr-54-PF-8MAMYEZY.svg
55 | PF-6LZ7NYE4   | owners         | Wii (Inhaberin)     | Wii                       | vip-qr-55-PF-6LZ7NYE4.svg
56 | PF-ET97JKNE   | owners         | Pauli (Admin)       | PAULI                     | vip-qr-56-PF-ET97JKNE.svg

FARBPALETTEN (QR-Prägung / VIP-Relief in SVG)
---------------------------------------------
friends_core   (01–30): QR #cd7f32 (Bronze),  Rahmen #8e5a20
influencer     (31–40): QR #a8adb4 (Silber),  Rahmen #727980
vip_influencer (41–50): QR #96732e (Gold),    Rahmen #7b5b1d  ← Gold-Ticket
family_special (51–54): QR #2f9e44 (Grün),    Rahmen #1d6f31
owners         (55–56): QR #7b5cff (Lila),    Rahmen #4d35c7

REDEMPTION-URL (Beispiel Live)
------------------------------
https://{DOMAIN}/index.html?osg_vip={CODE}

PRÄSENTATION BEIM VERSCHENKEN
-----------------------------
3D-Geschenk-Vorlage (nur Design, kein App-Code):
  01_Design_und_Branding/vip-qr-geschenk-3d-vorlage.html
  Aufruf z. B.: ?slot=55&from=Wii&to=Vorname

GOLD-MÜNZ-PLAN (DRUCK, HOCHAUFLÖSEND)
-------------------------------------
3D-Münz-Druckvorlage mit QR, Slot-ID und Ring-Schriftzug „Pauli Best Price Thailand“:
  01_Design_und_Branding/vip-coin-druckvorlage.html
  Aufruf z. B.: ?slot=01&label=VIP-01
  · Format 1417×1417 px — für Druck optimiert
  · QR aus diesem Ordner (VIP_QR_Codes_Master/*.svg) einbetten
  · Keine App-Logik — reines Design-Asset

WAW!-EFFEKT (APP BEIM VIP-SCAN)
-------------------------------
Nach erfolgreichem Scan eines Geschenk-Codes (Slots 1–30, 51–56):
  1. Overlay mit dynamischem Geschenkwert (59 / 118 / 177 THB je nach Slot)
  2. Betrag poppt mit Gold-Glow-Animation (CSS: .is-waw / .is-waw-glow)
  3. Nach „Weiter“: Avatar spricht Begrüßung aus assets/locales/{lang}.json

SPRACH-PAKETE (assets/locales/)
-------------------------------
Beim App-Start: navigator.language → passende JSON laden und in T[lang] mergen.
Schlüssel welcome_greeting (Avatar nach VIP-Scan):
  de.json, en.json, th.json, pl.json, zh.json, ru.json
Polnisch zusätzlich: welcome_greeting_pl (Kompatibilität)

PROVISION (Stand Implementierung)
---------------------------------
Standard-Influencer (Slots 31–40): 1,00 THB pro Kauf-Event
VIP-Influencer     (Slots 41–50): 5,00 THB pro Kauf-Event
Details: Pauli_Best_Price_Thailand_VIP_Provision.txt

PROFIL — AUSZAHLUNG
-------------------
„Mein Profil“: Feld Kontonummer (Banküberweisung) — localStorage osg-payout-account

SICHERHEIT
----------
· Master-SVGs nur intern — nicht öffentlich deployen ohne Freigabe.
· Codes sind geheim; bei Verlust einzelner Drucke Code rotieren (vip_codes.json + Regenerierung).
