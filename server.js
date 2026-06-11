'use strict';
/* =====================================================================
   ZENVORIA — backend server (Webilio-style)
   - servíruje statický frontend (index.html + obrázky)
   - mluví se Supabase přes REST API (PostgREST), NE přes DB driver
   - autentizace service rolí (obchází RLS, plný přístup) — server je gatekeeper
   - server-side auth: login proti zenvoria_users, bcrypt, podepsaná session cookie
   ===================================================================== */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

// --- minimální načtení .env (bez závislosti); na Railway se env injektuje samo ---
(function loadDotEnv() {
  try {
    const file = path.join(__dirname, '.env');
    if (!fs.existsSync(file)) return;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2].replace(/^["']|["']$/g, '');
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch { /* ignore */ }
})();

/* ----------------------------------------------------------------------
   1) KONFIGURACE (z env proměnných — na Railway nastavíš ve Variables)
   -------------------------------------------------------------------- */
const PORT = parseInt(process.env.PORT || '3000', 10);

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
// tajný service_role klíč — NIKDY se neposílá do prohlížeče
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY ||
  '';

const SUPABASE_REST_TIMEOUT_MS = parseInt(process.env.SUPABASE_REST_TIMEOUT_MS || '10000', 10);

// REST je aktivní jen když máme URL i klíč (jinak server běží, ale data se nezapíšou)
const REST_ENABLED = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

// session secret pro podpis cookie (na produkci nastav vlastní; jinak náhodný za běhu)
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_COOKIE = 'zv_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dní

const MAIL_ENABLED = String(process.env.MAIL_ENABLED || 'true').toLowerCase() !== 'false';
const MAIL_FROM = process.env.MAIL_FROM || 'ZENVORIA <no-reply@zenvoria.cz>';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// názvy tabulek s fallbackem (Webilio-style — lze přepsat env proměnnou)
const T = {
  users:         process.env.TBL_USERS         || 'zenvoria_users',
  caregivers:    process.env.TBL_CAREGIVERS    || 'zenvoria_caregivers',
  verifications: process.env.TBL_VERIFICATIONS || 'zenvoria_verifications',
  orders:        process.env.TBL_ORDERS        || 'zenvoria_orders',
  requests:      process.env.TBL_REQUESTS      || 'zenvoria_requests',
  schedule:      process.env.TBL_SCHEDULE      || 'zenvoria_schedule',
  reviews:       process.env.TBL_REVIEWS       || 'zenvoria_reviews',
  conversations: process.env.TBL_CONVERSATIONS || 'zenvoria_conversations',
  messages:      process.env.TBL_MESSAGES      || 'zenvoria_messages',
  broadcasts:    process.env.TBL_BROADCASTS    || 'zenvoria_broadcasts',
  settings:      process.env.TBL_SETTINGS      || 'zenvoria_settings',
};

if (!REST_ENABLED) {
  console.warn('[zenvoria] ⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY nejsou nastavené — REST zápis je VYPNUTÝ. Nastav je v Railway Variables.');
} else {
  console.log('[zenvoria] ✅ Supabase REST aktivní:', SUPABASE_URL);
}

/* ----------------------------------------------------------------------
   2) JÁDRO KOMUNIKACE SE SUPABASE (PostgREST)
   -------------------------------------------------------------------- */
if (MAIL_ENABLED && !RESEND_API_KEY) {
  console.warn('[zenvoria] Email notifications are disabled because RESEND_API_KEY is missing.');
}

function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms || SUPABASE_REST_TIMEOUT_MS);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// univerzální REST požadavek na ${SUPABASE_URL}/rest/v1/<table><?query>
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendMailSafe({ to, subject, text, html }) {
  if (!MAIL_ENABLED || !RESEND_API_KEY || !to) return false;
  try {
    const res = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
      }),
    }, SUPABASE_REST_TIMEOUT_MS);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend ${res.status}: ${body || res.statusText}`);
    }
    return true;
  } catch (err) {
    console.error('[mail]', err.message);
    return false;
  }
}

function registrationMail(user) {
  const firstName = (user.name || '').trim().split(/\s+/)[0] || 'zakazniku';
  return {
    subject: 'Vitejte v ZENVORIA',
    text:
      `Dobry den, ${user.name},\n\n` +
      'dekujeme za registraci do ZENVORIA. Vas ucet byl uspesne vytvoren.\n\n' +
      'Pokud jste se neregistrovali vy, odpovezte prosim na tento e-mail.\n\n' +
      'S pozdravem,\nTym ZENVORIA',
    html:
      `<p>Dobry den, ${escapeHtml(firstName)},</p>` +
      '<p>dekujeme za registraci do <b>ZENVORIA</b>. Vas ucet byl uspesne vytvoren.</p>' +
      '<p>Pokud jste se neregistrovali vy, odpovezte prosim na tento e-mail.</p>' +
      '<p>S pozdravem,<br>Tym ZENVORIA</p>',
  };
}

function reservationMail({ user, order, caregiverName }) {
  const firstName = (user.name || '').trim().split(/\s+/)[0] || 'zakazniku';
  const when = [order.date, order.time].filter(Boolean).join(' v ');
  return {
    subject: `Potvrzeni rezervace pece na ${order.date}`,
    text:
      `Dobry den, ${user.name},\n\n` +
      'dekujeme za vasi rezervaci v ZENVORIA.\n\n' +
      `Sluzba: ${order.service}\n` +
      `Termin: ${when}\n` +
      `Adresa: ${order.addr}\n` +
      `Delka: ${order.hours} h\n` +
      (caregiverName ? `Pecovatelka: ${caregiverName}\n` : '') +
      `Stav: ${order.status}\n` +
      (order.note ? `Poznamka: ${order.note}\n` : '') +
      '\nJakmile se stav rezervace zmeni, dame vam vedet.\n\n' +
      'S pozdravem,\nTym ZENVORIA',
    html:
      `<p>Dobry den, ${escapeHtml(firstName)},</p>` +
      '<p>dekujeme za vasi rezervaci v <b>ZENVORIA</b>.</p>' +
      '<p>' +
      `Sluzba: <b>${escapeHtml(order.service)}</b><br>` +
      `Termin: <b>${escapeHtml(when)}</b><br>` +
      `Adresa: ${escapeHtml(order.addr)}<br>` +
      `Delka: ${escapeHtml(order.hours)} h<br>` +
      (caregiverName ? `Pecovatelka: ${escapeHtml(caregiverName)}<br>` : '') +
      `Stav: ${escapeHtml(order.status)}` +
      (order.note ? `<br>Poznamka: ${escapeHtml(order.note)}` : '') +
      '</p>' +
      '<p>Jakmile se stav rezervace zmeni, dame vam vedet.</p>' +
      '<p>S pozdravem,<br>Tym ZENVORIA</p>',
  };
}

async function supabaseRestRequest(method, table, { query = '', body = null, prefer = '' } = {}) {
  if (!REST_ENABLED) throw new Error('Supabase REST není nakonfigurováno (chybí URL nebo service_role klíč).');
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetchWithTimeout(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  let data = null;
  if (txt) { try { data = JSON.parse(txt); } catch { data = txt; } }
  if (!res.ok) {
    const msg = (data && data.message) || (typeof data === 'string' ? data : res.statusText);
    const err = new Error(`Supabase REST ${method} ${table} → ${res.status}: ${msg}`);
    err.status = res.status; err.body = data;
    throw err;
  }
  return data;
}

// ---- pomocné obaly ----
function restSelect(table, query = 'select=*') {
  return supabaseRestRequest('GET', table, { query });
}
async function restInsert(table, body, { prefer = 'return=representation' } = {}) {
  const rows = await supabaseRestRequest('POST', table, { body, prefer });
  return Array.isArray(rows) ? rows[0] : rows;
}
function restUpdate(table, query, body, { prefer = 'return=representation' } = {}) {
  return supabaseRestRequest('PATCH', table, { query, body, prefer });
}
function restDelete(table, query, { prefer = 'return=minimal' } = {}) {
  return supabaseRestRequest('DELETE', table, { query, prefer });
}
// další bigint id = max(col)+1 (tabulky s ručně definovaným id)
async function nextId(table, col = 'id') {
  const rows = await supabaseRestRequest('GET', table, { query: `select=${col}&order=${col}.desc&limit=1` });
  const max = rows && rows[0] ? Number(rows[0][col]) : 0;
  return (Number.isFinite(max) ? max : 0) + 1;
}

/* ----------------------------------------------------------------------
   3) SESSION (podepsaná cookie, stateless)
   -------------------------------------------------------------------- */
function b64url(buf) { return Buffer.from(buf).toString('base64url'); }
function signSession(payload) {
  const data = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}
function verifySession(token) {
  if (!token || token.indexOf('.') < 0) return null;
  const [data, sig] = token.split('.');
  const expect = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}
function setSession(res, user) {
  const token = signSession({
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}
function clearSession(res) { res.clearCookie(SESSION_COOKIE, { path: '/' }); }

// middleware: načte přihlášeného uživatele z cookie do req.session
function loadSession(req, _res, next) {
  req.session = verifySession(req.cookies && req.cookies[SESSION_COOKIE]);
  next();
}
function requireAuth(req, res, next) {
  if (!req.session) return res.status(401).json({ error: 'Nepřihlášen' });
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !roles.includes(req.session.role)) return res.status(403).json({ error: 'Nedostatečné oprávnění' });
    next();
  };
}

/* ----------------------------------------------------------------------
   4) MAPOVÁNÍ DB ŘÁDKŮ → tvar, který čeká frontend (index.html)
   -------------------------------------------------------------------- */
function publicUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role, status: u.status, init: u.init, settings: u.settings };
}
function mapCaregiver(c) {
  return {
    id: Number(c.id), name: c.name, init: c.init, loc: c.loc, rate: c.rate,
    rating: Number(c.rating), reviews: c.reviews, exp: c.exp, services: c.services || [],
    verified: c.verified, cert: c.cert, bio: c.bio, status: c.status, suspended: c.suspended,
    idVerified: c.id_verified, plan: c.plan, langs: c.langs || ['Čeština'],
    priceType: c.price_type, dayRate: c.day_rate, radius: c.radius, kmPrice: c.km_price,
    photo: c.photo || null, email: c.email || null, avail: c.avail || null,
  };
}
function mapOrder(o) {
  return { oid: Number(o.oid), cid: o.cid != null ? Number(o.cid) : null, service: o.service, hours: o.hours,
    date: o.date, time: o.time, addr: o.addr, note: o.note, km: o.km || 0, status: o.status,
    familyEmail: o.family_email, famName: o.fam_name };
}
function mapRequest(r) {
  return { id: Number(r.id), oid: r.oid != null ? Number(r.oid) : null, cid: r.cid != null ? Number(r.cid) : null,
    fam: r.fam, init: r.init, service: r.service, date: r.date, time: r.time, hours: r.hours, addr: r.addr };
}
function mapVerification(v) {
  return { id: Number(v.id), name: v.name, email: v.email, init: v.init, loc: v.loc, rate: v.rate, exp: v.exp,
    phone: v.phone, docType: v.doc_type, docNum: v.doc_num, idFront: v.id_front, idBack: v.id_back, selfie: v.selfie,
    services: v.services || [], cert: v.cert, issuer: v.issuer, validUntil: v.valid_until, fileName: v.file_name,
    refs: v.refs, note: v.note, bio: v.bio, status: v.status, date: v.date };
}

/* ----------------------------------------------------------------------
   5) APP
   -------------------------------------------------------------------- */
const app = express();
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());
app.use(loadSession);

const ROOT = __dirname;

// malý wrapper, ať se nemusí všude psát try/catch
const h = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((err) => {
  console.error('[api]', err.message);
  res.status(err.status && err.status < 500 ? err.status : 500).json({ error: err.message || 'Chyba serveru' });
});

/* ---------------- HEALTH ---------------- */
app.get('/api/health', (_req, res) => res.json({ ok: true, rest: REST_ENABLED }));

/* ---------------- AUTH ------------------ */
async function findUserByEmail(email) {
  const rows = await restSelect(T.users, `email=eq.${encodeURIComponent((email || '').toLowerCase())}&limit=1`);
  return rows && rows[0];
}

app.post('/api/auth/register', h(async (req, res) => {
  const { name, email, password, role } = req.body || {};
  const em = (email || '').trim().toLowerCase();
  if (!name || !em || !password) return res.status(400).json({ error: 'Vyplňte jméno, e-mail i heslo.' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Heslo musí mít alespoň 6 znaků.' });
  const r = role === 'caregiver' ? 'caregiver' : 'family';
  if (await findUserByEmail(em)) return res.status(409).json({ error: 'Tento e-mail je už zaregistrovaný.' });
  const init = (name.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2) || 'Z').toUpperCase();
  const password_hash = bcrypt.hashSync(String(password), 10);
  const user = await restInsert(T.users, { email: em, password_hash, name: name.trim(), role: r, init });
  const welcomeMail = registrationMail(user);
  await sendMailSafe({ to: user.email, ...welcomeMail });
  setSession(res, user);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/login', h(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await findUserByEmail(email);
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });
  }
  if (user.status === 'suspended') return res.status(403).json({ error: 'Účet je pozastavený.' });
  setSession(res, user);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/logout', (req, res) => { clearSession(res); res.json({ ok: true }); });

app.get('/api/auth/me', h(async (req, res) => {
  if (!req.session) return res.json({ user: null });
  const rows = await restSelect(T.users, `id=eq.${req.session.uid}&limit=1`);
  res.json({ user: publicUser(rows && rows[0]) });
}));

app.post('/api/auth/change-password', requireAuth, h(async (req, res) => {
  const { current, next } = req.body || {};
  if (!next || String(next).length < 6) return res.status(400).json({ error: 'Nové heslo musí mít alespoň 6 znaků.' });
  const rows = await restSelect(T.users, `id=eq.${req.session.uid}&limit=1`);
  const user = rows && rows[0];
  if (!user || !bcrypt.compareSync(String(current || ''), user.password_hash)) {
    return res.status(400).json({ error: 'Současné heslo není správné.' });
  }
  await restUpdate(T.users, `id=eq.${user.id}`, { password_hash: bcrypt.hashSync(String(next), 10) }, { prefer: 'return=minimal' });
  res.json({ ok: true });
}));

app.patch('/api/users/me/settings', requireAuth, h(async (req, res) => {
  const settings = req.body && req.body.settings;
  if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Chybí settings.' });
  await restUpdate(T.users, `id=eq.${req.session.uid}`, { settings }, { prefer: 'return=minimal' });
  res.json({ ok: true });
}));

/* ---------------- BOOTSTRAP (vše pro render) ---------------- */
app.get('/api/bootstrap', h(async (req, res) => {
  const [caregivers, orders, requests, schedule, verifications, usersRows, reviews, convs, msgs, broadcasts, settingsRows] =
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
      restSelect(T.settings, 'select=*'),
    ]);

  // cgReviews: { [caregiverId]: [{init,name,stars,text}] } + obecné recenze (caregiver_id null)
  const cgReviews = {};
  const generalReviews = [];
  (reviews || []).forEach((r) => {
    const row = { init: r.init, name: r.name, stars: r.stars, text: r.text };
    if (r.caregiver_id == null) generalReviews.push(row);
    else (cgReviews[r.caregiver_id] = cgReviews[r.caregiver_id] || []).push(row);
  });

  // konverzace s vnořenými zprávami
  const byConv = {};
  (msgs || []).forEach((m) => { (byConv[m.conversation_id] = byConv[m.conversation_id] || []).push({ me: m.mine, text: m.text, t: m.t }); });
  const conversations = (convs || []).map((c) => ({
    id: Number(c.id), name: c.name, init: c.init, role: c.role, readonly: c.readonly, unread: c.unread || 0,
    msgs: byConv[c.id] || [],
  }));

  // settings → plochý objekt
  const settings = {};
  (settingsRows || []).forEach((s) => { settings[s.key] = s.value; });

  res.json({
    caregivers: (caregivers || []).map(mapCaregiver),
    orders: (orders || []).map(mapOrder),
    requests: (requests || []).map(mapRequest),
    schedule: (schedule || []).map((s) => ({ id: s.id, cid: s.cid, fam: s.fam, init: s.init, service: s.service, date: s.date, time: s.time, hours: s.hours })),
    verifications: (verifications || []).map(mapVerification),
    users: (usersRows || []).map((u) => ({ id: u.id, name: u.name, email: u.email, init: u.init, joined: u.joined, orders: u.orders_count, status: u.status, role: u.role })),
    cgReviews, generalReviews,
    conversations,
    broadcasts: (broadcasts || []).map((b) => ({ id: b.id, audience: b.audience, emails: b.emails || [], text: b.text, date: b.date, t: b.t })),
    planPrices: settings.planPrices || { start: 0, premium: 390 },
    settings,
  });
}));

/* ---------------- OBJEDNÁVKY / POPTÁVKY ---------------- */
// rodina vytvoří objednávku + propojenou poptávku pro pečovatelku
app.post('/api/orders', requireAuth, h(async (req, res) => {
  const b = req.body || {};
  if (b.cid == null || !b.service || !b.date || !b.time || !b.addr) return res.status(400).json({ error: 'Neúplná objednávka.' });
  const oid = await nextId(T.orders, 'oid');
  const famName = req.session.name || b.famName || 'Rodina';
  let caregiverName = '';
  const caregiverRows = await restSelect(T.caregivers, `id=eq.${Number(b.cid)}&select=id,name&limit=1`);
  if (caregiverRows && caregiverRows[0]) caregiverName = caregiverRows[0].name || '';
  const order = await restInsert(T.orders, {
    oid, cid: Number(b.cid), family_email: req.session.email, fam_name: famName,
    service: b.service, hours: b.hours || 1, date: b.date, time: b.time, addr: b.addr,
    note: b.note || '', km: b.km || 0, status: 'pending',
  });
  const reqId = await nextId(T.requests, 'id');
  const init = (famName.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2) || 'Z').toUpperCase();
  await restInsert(T.requests, {
    id: reqId, oid, cid: Number(b.cid), fam: famName, init,
    service: b.service, date: b.date, time: b.time, hours: b.hours || 1, addr: b.addr,
  }, { prefer: 'return=minimal' });
  const orderView = mapOrder(order);
  const confirmationMail = reservationMail({ user: req.session, order: orderView, caregiverName });
  await sendMailSafe({ to: req.session.email, ...confirmationMail });
  res.json({ order: orderView });
}));

// změna stavu objednávky (rodina ruší / obecná aktualizace stavu)
app.patch('/api/orders/:oid', requireAuth, h(async (req, res) => {
  const status = (req.body || {}).status;
  const allowed = ['pending', 'confirmed', 'done', 'declined', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Neplatný stav.' });
  const rows = await restUpdate(T.orders, `oid=eq.${Number(req.params.oid)}`, { status });
  res.json({ order: rows && rows[0] ? mapOrder(rows[0]) : null });
}));

// pečovatelka přijme poptávku → objednávka confirmed, vznikne schedule, poptávka zmizí
app.post('/api/requests/:id/accept', requireRole('caregiver', 'admin'), h(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await restSelect(T.requests, `id=eq.${id}&limit=1`);
  const r = rows && rows[0];
  if (!r) return res.status(404).json({ error: 'Poptávka nenalezena.' });
  if (r.oid != null) await restUpdate(T.orders, `oid=eq.${r.oid}`, { status: 'confirmed' }, { prefer: 'return=minimal' });
  await restInsert(T.schedule, { cid: r.cid, fam: r.fam, init: r.init, service: r.service, date: r.date, time: r.time, hours: r.hours }, { prefer: 'return=minimal' });
  await restDelete(T.requests, `id=eq.${id}`);
  res.json({ ok: true });
}));

// pečovatelka odmítne poptávku → objednávka declined, poptávka zmizí
app.post('/api/requests/:id/decline', requireRole('caregiver', 'admin'), h(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await restSelect(T.requests, `id=eq.${id}&limit=1`);
  const r = rows && rows[0];
  if (!r) return res.status(404).json({ error: 'Poptávka nenalezena.' });
  if (r.oid != null) await restUpdate(T.orders, `oid=eq.${r.oid}`, { status: 'declined' }, { prefer: 'return=minimal' });
  await restDelete(T.requests, `id=eq.${id}`);
  res.json({ ok: true });
}));

/* ---------------- OVĚŘENÍ ---------------- */
// pečovatelka podá žádost o ověření
app.post('/api/verifications', requireRole('caregiver', 'admin'), h(async (req, res) => {
  const b = req.body || {};
  const id = await nextId(T.verifications, 'id');
  const row = await restInsert(T.verifications, {
    id, name: b.name, email: b.email || req.session.email, init: b.init, loc: b.loc, rate: b.rate, exp: b.exp,
    phone: b.phone, doc_type: b.docType, doc_num: b.docNum, id_front: b.idFront, id_back: b.idBack, selfie: b.selfie,
    services: b.services || [], cert: b.cert, issuer: b.issuer, valid_until: b.validUntil, file_name: b.fileName,
    refs: b.refs, note: b.note, bio: b.bio, status: 'submitted', date: new Date().toISOString().slice(0, 10),
  });
  res.json({ verification: mapVerification(row) });
}));

// admin schválí žádost → vytvoří/aktualizuje pečovatelku (verified), žádost approved
app.post('/api/verifications/:id/approve', requireRole('admin'), h(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await restSelect(T.verifications, `id=eq.${id}&limit=1`);
  const v = rows && rows[0];
  if (!v) return res.status(404).json({ error: 'Žádost nenalezena.' });
  // existuje už pečovatelka s tímto e-mailem?
  let cg = null;
  if (v.email) { const ex = await restSelect(T.caregivers, `email=eq.${encodeURIComponent(v.email)}&limit=1`); cg = ex && ex[0]; }
  const data = {
    email: v.email, name: v.name, init: v.init, loc: v.loc, rate: v.rate, exp: v.exp,
    services: v.services || [], verified: true, id_verified: true, status: 'verified', suspended: false,
    bio: v.bio, cert: !!v.cert,
  };
  if (cg) {
    await restUpdate(T.caregivers, `id=eq.${cg.id}`, data, { prefer: 'return=minimal' });
  } else {
    const newId = await nextId(T.caregivers, 'id');
    const uref = await restSelect(T.users, `email=eq.${encodeURIComponent(v.email || '')}&limit=1`);
    await restInsert(T.caregivers, { id: newId, user_id: (uref && uref[0] && uref[0].id) || null, ...data, rating: 0, reviews: 0, plan: 'start', langs: ['Čeština'], price_type: 'hod', day_rate: (v.rate || 0) * 8, radius: 10, km_price: 0 }, { prefer: 'return=minimal' });
  }
  await restUpdate(T.verifications, `id=eq.${id}`, { status: 'approved' }, { prefer: 'return=minimal' });
  res.json({ ok: true });
}));

// admin zamítne žádost
app.post('/api/verifications/:id/reject', requireRole('admin'), h(async (req, res) => {
  await restUpdate(T.verifications, `id=eq.${Number(req.params.id)}`, { status: 'rejected' }, { prefer: 'return=minimal' });
  res.json({ ok: true });
}));

/* ---------------- RECENZE ---------------- */
app.post('/api/reviews', requireAuth, h(async (req, res) => {
  const b = req.body || {};
  if (b.caregiverId == null || !b.stars) return res.status(400).json({ error: 'Neúplná recenze.' });
  await restInsert(T.reviews, { caregiver_id: Number(b.caregiverId), init: b.init, name: b.name, stars: b.stars, text: b.text }, { prefer: 'return=minimal' });
  res.json({ ok: true });
}));

/* ---------------- CHAT ---------------- */
app.post('/api/conversations', requireAuth, h(async (req, res) => {
  const b = req.body || {};
  // konverzace dle jména (najdi nebo vytvoř)
  const ex = await restSelect(T.conversations, `name=eq.${encodeURIComponent(b.name || '')}&limit=1`);
  if (ex && ex[0]) return res.json({ conversation: { id: Number(ex[0].id), name: ex[0].name, init: ex[0].init, role: ex[0].role, msgs: [] } });
  const id = await nextId(T.conversations, 'id');
  const row = await restInsert(T.conversations, { id, name: b.name, init: b.init, role: b.role || 'caregiver', unread: 0 });
  res.json({ conversation: { id: Number(row.id), name: row.name, init: row.init, role: row.role, msgs: [] } });
}));

app.post('/api/conversations/:id/messages', requireAuth, h(async (req, res) => {
  const b = req.body || {};
  const row = await restInsert(T.messages, { conversation_id: Number(req.params.id), mine: b.me !== false, text: b.text, t: b.t || '' });
  res.json({ message: { me: row.mine, text: row.text, t: row.t } });
}));

/* ---------------- BROADCAST (admin) ---------------- */
app.post('/api/broadcasts', requireRole('admin'), h(async (req, res) => {
  const b = req.body || {};
  const row = await restInsert(T.broadcasts, {
    audience: b.audience, emails: b.emails || [], text: b.text,
    date: new Date().toISOString().slice(0, 10), t: b.t || '',
  });
  res.json({ broadcast: { id: row.id, audience: row.audience, emails: row.emails || [], text: row.text, date: row.date, t: row.t } });
}));

/* ---------------- PEČOVATELKA: profil / tarif / pozastavení ---------------- */
app.patch('/api/caregivers/:id', requireAuth, h(async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const patch = {};
  // jen povolená pole
  const map = { name: 'name', loc: 'loc', rate: 'rate', exp: 'exp', bio: 'bio', services: 'services', langs: 'langs',
    plan: 'plan', priceType: 'price_type', dayRate: 'day_rate', radius: 'radius', kmPrice: 'km_price',
    photo: 'photo', avail: 'avail', suspended: 'suspended', status: 'status' };
  for (const k in map) if (b[k] !== undefined) patch[map[k]] = b[k];
  // pozastavení / mazání smí jen admin
  if ((b.suspended !== undefined || b.status !== undefined) && req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Pozastavení smí jen správce.' });
  }
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nic k aktualizaci.' });
  const rows = await restUpdate(T.caregivers, `id=eq.${id}`, patch);
  res.json({ caregiver: rows && rows[0] ? mapCaregiver(rows[0]) : null });
}));

/* ---------------- ADMIN: uživatelé / tarify ---------------- */
app.patch('/api/users/:id', requireRole('admin'), h(async (req, res) => {
  const b = req.body || {};
  const patch = {};
  if (b.status !== undefined) patch.status = b.status;
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nic k aktualizaci.' });
  await restUpdate(T.users, `id=eq.${req.params.id}`, patch, { prefer: 'return=minimal' });
  res.json({ ok: true });
}));

app.delete('/api/users/:id', requireRole('admin'), h(async (req, res) => {
  await restDelete(T.users, `id=eq.${req.params.id}`);
  res.json({ ok: true });
}));

app.delete('/api/caregivers/:id', requireRole('admin'), h(async (req, res) => {
  await restDelete(T.caregivers, `id=eq.${Number(req.params.id)}`);
  res.json({ ok: true });
}));

app.put('/api/settings/:key', requireRole('admin'), h(async (req, res) => {
  const key = req.params.key;
  const value = (req.body || {}).value;
  await supabaseRestRequest('POST', T.settings, { body: { key, value }, prefer: 'resolution=merge-duplicates,return=minimal' });
  res.json({ ok: true });
}));

/* ----------------------------------------------------------------------
   6) STATIKA (frontend) — až po /api
   -------------------------------------------------------------------- */
app.use(express.static(ROOT, { extensions: ['html'], index: 'index.html' }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => console.log(`[zenvoria] 🚀 server běží na portu ${PORT}`));
