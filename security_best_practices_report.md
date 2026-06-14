# Security Best Practices Report

## Executive Summary

ZENVORIA je blízko produkčnímu provozu funkčně, ale v aktuálním stavu má několik vážných aplikačních zranitelností. Nejzávažnější jsou neomezený export produkčních dat přes `GET /api/bootstrap`, chybějící ownership checks na více write endpoint ech a chybějící CSRF ochrana při cookie-based autentizaci. Tyto tři oblasti je potřeba opravit před ostrým provozem.

## Critical Findings

### SBP-001
- Rule ID: EXPRESS-INPUT-001 / data exposure
- Severity: Critical
- Location: [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:1405)
- Evidence:

```js
app.get('/api/bootstrap', h(async (req, res) => {
  const [caregivers, orders, requests, schedule, verifications, usersRows, reviews, convs, msgs, broadcasts, settings] =
    await Promise.all([
      restSelect(T.caregivers, 'select=*&order=id.asc'),
      restSelect(T.orders, 'select=*&order=oid.desc'),
      restSelect(T.requests, 'select=*&order=id.desc'),
      restSelect(T.schedule, 'select=*&order=date.asc'),
      restSelect(T.verifications, 'select=*&order=id.asc'),
      restSelect(T.users, 'select=id,email,name,role,status,init,joined,orders_count&order=joined.asc'),
      restSelect(T.reviews, 'select=*&order=id.asc'),
      restSelect(T.conversations, 'select=*&order=id.asc'),
      restSelect(T.messages, 'select=*&order=id.asc'),
      restSelect(T.broadcasts, 'select=*&order=id.asc'),
```

- Impact: Neautentizovaný návštěvník nebo libovolný přihlášený uživatel může stáhnout kompletní produkční data včetně uživatelů, objednávek, poptávek, auditovatelných konverzací a verifikačních dokladů.
- Fix: Rozdělit bootstrap podle role a vracet jen minimum nutné pro konkrétní session. Guest nesmí dostat interní tabulky vůbec. Family/Caregiver/Admin musí dostat filtrované view, ne raw export.
- Mitigation: Dočasně endpoint zavřít za `requireAuth` a omezit response jen na veřejná data.
- False positive notes: Žádná ochrana role ani session zde v app kódu není vidět.

### SBP-002
- Rule ID: EXPRESS-INPUT-001 / IDOR
- Severity: Critical
- Location: [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:1481), [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:1507), [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:1520), [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:1621)
- Evidence:

```js
app.patch('/api/orders/:oid', requireAuth, h(async (req, res) => {
  const rows = await restUpdate(T.orders, `oid=eq.${Number(req.params.oid)}`, { status });
```

```js
app.post('/api/requests/:id/accept', requireRole('caregiver', 'admin'), h(async (req, res) => {
  const rows = await restSelect(T.requests, `id=eq.${id}&limit=1`);
```

```js
app.post('/api/requests/:id/decline', requireRole('caregiver', 'admin'), h(async (req, res) => {
  const rows = await restSelect(T.requests, `id=eq.${id}&limit=1`);
```

```js
app.patch('/api/caregivers/:id', requireAuth, h(async (req, res) => {
  const rows = await restUpdate(T.caregivers, `id=eq.${id}`, patch);
```

- Impact: Přihlášený uživatel může měnit cizí objednávky; libovolná pečovatelka může přijmout/odmítnout cizí poptávku; libovolný přihlášený uživatel může přepisovat cizí caregiver profil. To je přímý zásah do cizích dat a workflow.
- Fix: Na každém endpointu před write akcí načíst cílový záznam a ověřit ownership nebo admin roli. Např. order musí patřit `req.session.email`, request musí patřit caregiver účtu navázanému na `req.session.email`, caregiver profil smí měnit jen vlastník nebo admin.
- Mitigation: Dočasně vypnout problematické endpointy nebo je omezit jen na admina.
- False positive notes: V app kódu nejsou vidět žádné následné ownership kontroly.

## High Findings

### SBP-003
- Rule ID: EXPRESS-CSRF-001
- Severity: High
- Location: [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:847), [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:1129), [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:1150)
- Evidence:

```js
function setSession(res, user) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
```

```js
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());
app.use(loadSession);
```

State-changing routes then follow, for example:

```js
app.post('/api/orders', requireAuth, ...)
app.patch('/api/orders/:oid', requireAuth, ...)
app.post('/api/auth/change-email/request', requireAuth, ...)
app.post('/api/conversations/:id/messages', requireAuth, ...)
```

- Impact: Aplikace používá cookie-based session, ale neviditelně chybí CSRF token, kontrola `Origin`/`Referer` nebo jiná server-side obrana. Útočník může přinutit přihlášeného uživatele provést nechtěné state-changing požadavky.
- Fix: Přidat CSRF ochranu pro všechny cookie-authenticated POST/PATCH/DELETE endpointy. Praktické minimum je synchronizer token nebo double-submit token + ověření `Origin`.
- Mitigation: Dočasně přidejte striktní `Origin` allowlist check na všech state-changing API routách.
- False positive notes: `SameSite=Lax` pomáhá jen částečně a není plná CSRF ochrana.

### SBP-004
- Rule ID: JS-XSS-001
- Severity: High
- Location: [index.html](C:\Users\radec\Documents\web\zenvoria\index.html:5199), [index.html](C:\Users\radec\Documents\web\zenvoria\index.html:5200), [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:1603)
- Evidence:

```js
app.post('/api/conversations/:id/messages', requireAuth, h(async (req, res) => {
  const row = await restInsert(T.messages, { conversation_id: Number(req.params.id), mine: b.me !== false, text: b.text, t: b.t || '' });
```

```js
head.innerHTML=`<div class="ava">${c.init}</div><div><b>${c.name}</b><span>${c.readonly?'Oznámení od ZENVORIA':'Online'}</span></div>`;
body.innerHTML=c.msgs.map(m=>`<div class="msg ${m.me?'me':'them'}">${m.text}<span class="mt">${m.t}</span></div>`).join('');
```

- Impact: Stačí uložit HTML/JS payload do zprávy nebo jména konverzace a po otevření chatu se provede stored XSS v prohlížeči jiného uživatele nebo admina.
- Fix: Nikdy nestrkat `m.text`, `c.name`, `c.init` do `innerHTML`. Přepsat chat render na `textContent` / `createElement`. Na serveru navíc validovat a limitovat délku textových polí.
- Mitigation: CSP pomůže jako defense-in-depth, ale neopraví samotný sink.
- False positive notes: Tady je flow user input → DB → `innerHTML` přímo viditelné.

## Medium Findings

### SBP-005
- Rule ID: EXPRESS-HEADERS-001 / EXPRESS-ERROR-001
- Severity: Medium
- Location: [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:1074), [server.js](C:\Users\radec\Documents\web\zenvoria\server.js:1136), [index.html](C:\Users\radec\Documents\web\zenvoria\index.html:1)
- Evidence:

```js
const app = express();
```

No visible `helmet()`, no `app.disable('x-powered-by')`, and the error wrapper returns raw messages:

```js
const h = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((err) => {
  console.error('[api]', err.message);
  res.status(err.status && err.status < 500 ? err.status : 500).json({ error: err.message || 'Chyba serveru' });
});
```

- Impact: Aplikace postrádá základní bezpečnostní HTTP headery a může vracet interní chybové zprávy klientovi. To zvyšuje riziko clickjackingu, MIME sniffingu a informačního leakage při chybách.
- Fix: Přidat `helmet()`, vypnout `x-powered-by`, zavést centrální production-safe error handler s generickými zprávami, a CSP ideálně přes header.
- Mitigation: Pokud to nastavuje reverse proxy/CDN, ověřit to runtime testem a zdokumentovat.
- False positive notes: V repu nejsou headery vidět; edge konfigurace zde není.

## Recommended Remediation Order

1. Opravit `GET /api/bootstrap` na role-based minimální response.
2. Zavést ownership checks pro `orders`, `requests`, `caregivers` a další write endpointy.
3. Přidat CSRF ochranu na všechny cookie-auth API akce.
4. Přepsat chat a další user-content render z `innerHTML` na bezpečné DOM API.
5. Přidat security headers a production-safe error handling.
