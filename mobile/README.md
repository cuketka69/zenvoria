# ZENVORIA — mobilní appka (Android)

Tohle je Capacitor obal kolem živého webu **www.zenvoria.cz** — appka nemá vlastní
zkopírovaný frontend, jen otevře nativní WebView a v něm rovnou načte živý web
(viz `server.url` v `capacitor.config.json`). Jakákoli změna na `www.zenvoria.cz`
se v appce projeví okamžitě, bez nového buildu/publikace.

Slovenská verze (`www.zenvoria.sk`) zatím vlastní appku nemá — přepnout `server.url`
na `.sk`, nebo přidat přepínač země v appce, je otázka pro pozdější fázi.

## Co je potřeba doinstalovat (jen jednou)

1. **[Android Studio](https://developer.android.com/studio)** — instalátor zahrnuje
   Android SDK, emulátor i potřebnou Javu, nic dalšího instalovat nemusíš.
2. Po instalaci ho jednou spusť, ať doinstaluje SDK komponenty (proběhne to
   automaticky při prvním otevření projektu).

## Jak appku spustit v emulátoru / na telefonu (testování, žádný účet v obchodě nepotřebuješ)

1. `cd mobile`
2. `npm install` (pokud jsi ještě needělal)
3. `npm run open:android` — otevře projekt v Android Studiu
   (poprvé to spustí Gradle sync, může to pár minut trvat)
4. V Android Studiu nahoře vyber cílové zařízení:
   - **Emulátor**: Tools → Device Manager → vytvoř si virtuální telefon (stačí výchozí Pixel) → vyber ho v seznamu zařízení
   - **Fyzický telefon**: zapni na telefonu Vývojářský režim → USB ladění, připoj kabelem, telefon se objeví v seznamu
5. Klikni na zelenou šipku ▶ (Run) — appka se nainstaluje a spustí

## Když změníš appId/appName/ikonu

- Ikonu/splash screen generuje `npm run assets` ze souboru `../logo.webp` (viz `make_assets.js`) — spusť znovu, kdykoli se logo změní.
- Po jakékoli změně v `capacitor.config.json` spusť `npm run sync`, ať se projeví v android projektu.

## Až budeš chtít appku opravdu publikovat na Google Play

To už vyžaduje:
1. Google Play Console účet (25 $ jednorázově, https://play.google.com/console)
2. V Android Studiu vytvořit podepsaný build: **Build → Generate Signed Bundle/APK** (poprvé si necháš vygenerovat nový podpisový klíč — ten si pak zálohuj, bez něj appku v budoucnu neaktualizuješ)
3. Nahrát vygenerovaný `.aab` soubor do Play Console, vyplnit popis/screenshoty/ikonu obchodu a odeslat ke schválení

Tohle je krok, který přijde až po otestování — není potřeba řešit, dokud appku neuvidíš fungovat v emulátoru.
