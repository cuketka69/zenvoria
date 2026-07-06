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
const CSRF_COOKIE = 'zv_csrf';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dní
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minut
const RESET_TOKEN_KEY_PREFIX = 'passwordReset:';
const EMAIL_CHANGE_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minut
const EMAIL_CHANGE_CODE_TTL_MS = 1000 * 60 * 10; // 10 minut
const EMAIL_CHANGE_KEY_PREFIX = 'emailChange:';
const CONVERSATION_ACCESS_KEY_PREFIX = 'conversationAccess:';
const RATE_LIMIT_CLEANUP_MS = 1000 * 60 * 5;
const AUDIT_ENABLED = String(process.env.AUDIT_ENABLED || 'true').toLowerCase() !== 'false';
const RATE_LIMITS = {
  register: {
    windowMs: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW_MS || String(1000 * 60 * 60), 10),
    max: parseInt(process.env.RATE_LIMIT_REGISTER_MAX || '5', 10),
    message: 'Příliš mnoho registrací. Zkuste to prosím později.',
  },
  login: {
    windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || String(1000 * 60 * 15), 10),
    max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '10', 10),
    message: 'Příliš mnoho pokusů o přihlášení. Zkuste to prosím za chvíli.',
  },
  forgotPassword: {
    windowMs: parseInt(process.env.RATE_LIMIT_FORGOT_PASSWORD_WINDOW_MS || String(1000 * 60 * 30), 10),
    max: parseInt(process.env.RATE_LIMIT_FORGOT_PASSWORD_MAX || '5', 10),
    message: 'Příliš mnoho žádostí o obnovu hesla. Zkuste to prosím později.',
  },
  resetPassword: {
    windowMs: parseInt(process.env.RATE_LIMIT_RESET_PASSWORD_WINDOW_MS || String(1000 * 60 * 30), 10),
    max: parseInt(process.env.RATE_LIMIT_RESET_PASSWORD_MAX || '10', 10),
    message: 'Příliš mnoho pokusů o nastavení hesla. Zkuste to prosím později.',
  },
  changePassword: {
    windowMs: parseInt(process.env.RATE_LIMIT_CHANGE_PASSWORD_WINDOW_MS || String(1000 * 60 * 30), 10),
    max: parseInt(process.env.RATE_LIMIT_CHANGE_PASSWORD_MAX || '10', 10),
    message: 'Příliš mnoho pokusů o změnu hesla. Zkuste to prosím později.',
  },
  changeEmailRequest: {
    windowMs: parseInt(process.env.RATE_LIMIT_CHANGE_EMAIL_REQUEST_WINDOW_MS || String(1000 * 60 * 30), 10),
    max: parseInt(process.env.RATE_LIMIT_CHANGE_EMAIL_REQUEST_MAX || '5', 10),
    message: 'Prilis mnoho zadosti o zmenu e-mailu. Zkuste to prosim pozdeji.',
  },
  changeEmailCode: {
    windowMs: parseInt(process.env.RATE_LIMIT_CHANGE_EMAIL_CODE_WINDOW_MS || String(1000 * 60 * 15), 10),
    max: parseInt(process.env.RATE_LIMIT_CHANGE_EMAIL_CODE_MAX || '10', 10),
    message: 'Prilis mnoho pokusu o overeni noveho e-mailu. Zkuste to prosim pozdeji.',
  },
};

const MAIL_ENABLED = String(process.env.MAIL_ENABLED || 'true').toLowerCase() !== 'false';
const MAIL_FROM = process.env.MAIL_FROM || 'ZENVORIA <no-reply@zenvoria.cz>';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const APP_URL = process.env.APP_URL || 'https://www.zenvoria.cz';
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || '';

// --- Stripe (předplatné PREMIUM pro pečovatelky) ---
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''; // whsec_...
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'czk').toLowerCase();
let stripe = null;
if (STRIPE_SECRET_KEY) {
  try { stripe = require('stripe')(STRIPE_SECRET_KEY); }
  catch (e) { console.error('[stripe] knihovna stripe není nainstalovaná (npm i stripe):', e.message); }
}
const STRIPE_ENABLED = !!stripe;

function isStrongPassword(value) {
  const v = String(value || '');
  return v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v);
}

// veřejný náhodný token účtu do URL (bez matoucích znaků 0/o/1/l)
const PUBLIC_ID_ALPHABET = '23456789abcdefghijkmnpqrstuvwxyz';
function genPublicId(len = 10) {
  const bytes = crypto.randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += PUBLIC_ID_ALPHABET[bytes[i] % PUBLIC_ID_ALPHABET.length];
  return s;
}

const PASSWORD_RULE_HINT = 'Heslo musí mít alespoň 8 znaků a obsahovat malé písmeno, velké písmeno a číslo.';
const PUBLIC_SETTINGS_KEYS = ['planPrices', 'socialLinks'];
const ADMIN_UPDATABLE_USER_STATUSES = new Set(['active', 'suspended']);
const ADMIN_UPDATABLE_CAREGIVER_STATUSES = new Set(['pending', 'verified', 'rejected']);
const ADMIN_UPDATABLE_CAREGIVER_PLANS = new Set(['start', 'premium']);
const ADMIN_UPDATABLE_SETTING_KEYS = new Set(PUBLIC_SETTINGS_KEYS);
const rateLimitStore = new Map();

function trimmedString(value, maxLen = 0) {
  const v = String(value == null ? '' : value).trim();
  return maxLen ? v.slice(0, maxLen) : v;
}

function isEmail(value) {
  const v = trimmedString(value, 320).toLowerCase();
  return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizeEmailList(list, { maxItems = 200 } = {}) {
  if (!Array.isArray(list)) return null;
  const out = [];
  const seen = new Set();
  for (const raw of list) {
    const email = trimmedString(raw, 320).toLowerCase();
    if (!email) continue;
    if (!isEmail(email)) return null;
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(email);
    if (out.length > maxItems) return null;
  }
  return out;
}

function sanitizePlanPrices(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const start = Number(value.start);
  const premium = Number(value.premium);
  if (!Number.isFinite(start) || !Number.isFinite(premium)) return null;
  if (start < 0 || premium < 0 || start > 100000 || premium > 100000) return null;
  return { start: Math.round(start), premium: Math.round(premium) };
}

/* URL nebo prázdný řetězec; bez schématu doplní https:// */
function sanitizeUrlOrEmpty(value, maxLen = 300) {
  let v = String(value == null ? '' : value).trim();
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  if (v.length > maxLen) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch (e) {
    return null;
  }
}

function sanitizeSocialLinks(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const facebook = sanitizeUrlOrEmpty(value.facebook);
  const instagram = sanitizeUrlOrEmpty(value.instagram);
  if (facebook === null || instagram === null) return null;
  return { facebook, instagram };
}

function sanitizeSettingValue(key, value) {
  if (key === 'planPrices') return sanitizePlanPrices(value);
  if (key === 'socialLinks') return sanitizeSocialLinks(value);
  return null;
}

/* příloha jako data URL (obrázek / PDF), s limitem velikosti */
function sanitizeFileDataUrl(v, maxLen = 7 * 1024 * 1024) {
  const s = typeof v === 'string' ? v : '';
  if (!s) return null;
  if (!/^data:(image\/|application\/pdf|application\/octet-stream|text\/)/i.test(s)) return null;
  if (s.length > maxLen) return null;
  return s;
}
/* soubory přiložené k žádosti o ověření -> { idfront, idback, selfie, doc, certs:[...] } */
function sanitizeVerificationFiles(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  ['idfront', 'idback', 'selfie', 'doc'].forEach((k) => { const f = sanitizeFileDataUrl(value[k]); if (f) out[k] = f; });
  if (Array.isArray(value.certs)) {
    const certs = value.certs.slice(0, 12).map((c) => sanitizeFileDataUrl(c)).filter(Boolean);
    if (certs.length) out.certs = certs;
  }
  return out;
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

function rateLimitKey(req, scope) {
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const token = String(body.token || '').trim();
  const tokenHash = token ? crypto.createHash('sha256').update(token).digest('hex') : '';
  const userId = req.session && req.session.uid ? String(req.session.uid) : '';
  return [scope, getClientIp(req), email, userId, tokenHash].filter(Boolean).join(':');
}

function rateLimit(scope, cfg) {
  return (req, res, next) => {
    const now = Date.now();
    const key = rateLimitKey(req, scope);
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + cfg.windowMs };
    }
    entry.count += 1;
    rateLimitStore.set(key, entry);
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
    if (entry.count > cfg.max) {
      return res.status(429).json({ error: cfg.message });
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (!entry || entry.resetAt <= now) rateLimitStore.delete(key);
  }
}, RATE_LIMIT_CLEANUP_MS).unref();

let auditWritable = true;
let auditWarned = false;

function auditActor(req, fallback = {}) {
  return {
    id: (req.session && req.session.uid) || fallback.id || null,
    email: (req.session && req.session.email) || fallback.email || null,
    role: (req.session && req.session.role) || fallback.role || null,
  };
}

async function writeAudit(action, { req, actor, targetType = null, targetId = null, status = 'success', metadata = null } = {}) {
  if (!AUDIT_ENABLED || !REST_ENABLED || !auditWritable) return false;
  const who = actor || auditActor(req || {}, {});
  const row = {
    action,
    actor_id: who.id || null,
    actor_email: who.email || null,
    actor_role: who.role || null,
    target_type: targetType,
    target_id: targetId == null ? null : String(targetId),
    status,
    ip: req ? getClientIp(req) : null,
    user_agent: req ? String(req.headers['user-agent'] || '').slice(0, 500) : null,
    metadata: metadata && typeof metadata === 'object' ? metadata : null,
    created_at: new Date().toISOString(),
  };
  try {
    await restInsert(T.auditLogs, row, { prefer: 'return=minimal' });
    return true;
  } catch (err) {
    const msg = String(err && err.message || '');
    if (!auditWarned) {
      console.warn('[audit] audit log write failed:', msg);
      auditWarned = true;
    }
    if (/relation .* does not exist|column .* does not exist|Could not find the table/i.test(msg)) {
      auditWritable = false;
    }
    return false;
  }
}

function fireAudit(action, details) {
  writeAudit(action, details).catch(() => {});
}

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
  auditLogs:     process.env.TBL_AUDIT_LOGS    || 'zenvoria_audit_logs',
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

/* odkazy na sociální sítě pro e-maily — drženo v cache, aktualizováno z DB
   (při startu a po každém admin uložení), ať šablona zůstane synchronní */
let emailSocialLinks = { facebook: '', instagram: '' };
function socialIconSpan(glyph, url, last) {
  const mr = last ? '' : 'margin-right:10px;';
  const span = `<span style="display:inline-block;width:44px;height:44px;border:1px solid #D9A91D;border-radius:50%;color:#D9A91D;font-size:20px;line-height:44px;text-align:center;${mr}">${glyph}</span>`;
  return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block;">${span}</a>` : span;
}
function emailSocialIconsHtml() {
  return socialIconSpan('f', emailSocialLinks.facebook, false) + socialIconSpan('◎', emailSocialLinks.instagram, true);
}
async function loadEmailSocialLinks() {
  try {
    const rows = await restSelect(T.settings, `key=eq.socialLinks&limit=1`);
    const v = rows && rows[0] && rows[0].value;
    if (v && typeof v === 'object') emailSocialLinks = { facebook: v.facebook || '', instagram: v.instagram || '' };
  } catch (e) { /* ponech výchozí prázdné */ }
}

function renderEmailLayout({ preheader, title, intro, bodyHtml, ctaLabel, ctaUrl, ctaNote, facts, closingTitle, closingSubtitle, footerNote }) {
  const factRows = (facts || []).map((item) =>
    `<tr>
      <td style="padding:0 0 12px 0;color:#5E6C61;font-size:13px;line-height:1.5;">${escapeHtml(item.label)}</td>
      <td style="padding:0 0 12px 16px;color:#0A2F20;font-size:14px;line-height:1.5;font-weight:600;text-align:right;">${escapeHtml(item.value)}</td>
    </tr>`
  ).join('');

  const factsBlock = factRows ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px 0;">
      <tr>
        <td style="padding:0 0 16px 0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F6F1;border:1px solid #E5DCC4;border-radius:16px;">
            <tr>
              <td style="padding:22px 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${factRows}</table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>` : '';

  return `
<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#042617;font-family:Arial,sans-serif;color:#10241A;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || title)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:radial-gradient(circle at top,#0A3C27 0%,#042617 60%,#031D12 100%);">
      <tr>
        <td align="center" style="padding:26px 14px 34px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:900px;">
            <tr>
              <td style="padding:0 6px 16px 6px;color:#D6DED7;font-size:12px;line-height:1.5;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="color:#D6DED7;">${escapeHtml(preheader || '')}</td>
                    <td align="right">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #8F7224;border-radius:28px;overflow:hidden;background:#0A2F20;box-shadow:0 24px 70px rgba(0,0,0,0.28);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:28px 34px;background:linear-gradient(90deg,#072B1C 0%,#0B3C27 100%);">
                      <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;letter-spacing:0.08em;color:#F7F1E5;font-weight:700;">
                        ZENVORIA
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#FCFBF7;padding:54px 48px 36px 48px;">
                      <h1 style="margin:0 0 18px 0;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:64px;line-height:1.02;color:#0A2F20;font-weight:700;">${escapeHtml(title)}</h1>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px 0;">
                        <tr>
                          <td align="center">
                            <div style="display:inline-block;width:150px;height:1px;background:#D9A91D;vertical-align:middle;"></div>
                            <span style="display:inline-block;color:#D9A91D;font-size:24px;line-height:1;padding:0 14px;vertical-align:middle;">♡</span>
                            <div style="display:inline-block;width:150px;height:1px;background:#D9A91D;vertical-align:middle;"></div>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:0 auto 26px auto;max-width:660px;text-align:center;color:#2E3F35;font-size:18px;line-height:1.7;">${escapeHtml(intro)}</p>
                      <div style="margin:0 0 24px 0;color:#31433A;font-size:16px;line-height:1.8;text-align:center;">${bodyHtml || ''}</div>
                      ${ctaLabel ? `
                        <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 26px auto;">
                          <tr>
                            <td align="center" bgcolor="#D9A91D" style="border-radius:18px;background:linear-gradient(180deg,#DEB02B 0%,#C99A12 100%);">
                              <a href="${escapeHtml(ctaUrl || APP_URL)}" style="display:inline-block;padding:24px 44px;color:#0A2F20;font-size:21px;font-weight:800;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">${escapeHtml(ctaLabel)}</a>
                            </td>
                          </tr>
                        </table>` : ''}
                      ${ctaNote ? `<p style="margin:0 auto 28px auto;max-width:680px;text-align:center;color:#516158;font-size:14px;line-height:1.8;">${ctaNote}</p>` : ''}
                      ${factsBlock}
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #E7D9B6;margin:0 0 26px 0;">
                        <tr><td style="height:26px;font-size:0;line-height:0;">&nbsp;</td></tr>
                        <tr>
                          <td>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td width="33.33%" align="center" valign="top" style="padding:0 12px;">
                                  <div style="width:82px;height:82px;border-radius:50%;background:#0A2F20;color:#D9A91D;font-size:34px;line-height:82px;text-align:center;margin:0 auto 16px auto;">✓</div>
                                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.2;color:#10241A;font-weight:700;margin-bottom:8px;">Ověřené pečovatelky</div>
                                  <div style="font-size:14px;line-height:1.6;color:#425046;">Prověřené doklady i reference</div>
                                </td>
                                <td width="33.33%" align="center" valign="top" style="padding:0 12px;border-left:1px solid #E7D9B6;border-right:1px solid #E7D9B6;">
                                  <div style="width:82px;height:82px;border-radius:50%;background:#0A2F20;color:#D9A91D;font-size:34px;line-height:82px;text-align:center;margin:0 auto 16px auto;">♡</div>
                                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.2;color:#10241A;font-weight:700;margin-bottom:8px;">Bezpečná péče</div>
                                  <div style="font-size:14px;line-height:1.6;color:#425046;">Pojištění a bezpečný proces</div>
                                </td>
                                <td width="33.33%" align="center" valign="top" style="padding:0 12px;">
                                  <div style="width:82px;height:82px;border-radius:50%;background:#0A2F20;color:#D9A91D;font-size:34px;line-height:82px;text-align:center;margin:0 auto 16px auto;">⌂</div>
                                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.2;color:#10241A;font-weight:700;margin-bottom:8px;">Klid pro rodiny</div>
                                  <div style="font-size:14px;line-height:1.6;color:#425046;">Přehled a jistota na jednom místě</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 30px 0;border:1px solid #B6C5B8;border-radius:18px;background:linear-gradient(180deg,#F9FAF6 0%,#F1F4EE 100%);">
                        <tr>
                          <td style="padding:24px 26px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td width="72" valign="top" align="center" style="font-size:42px;line-height:1;color:#0A2F20;">🛡</td>
                                <td valign="top" style="color:#26352D;font-size:16px;line-height:1.8;">
                                  <strong>Vaše bezpečí je pro nás prioritou.</strong><br>
                                  Vaše údaje používáme pouze pro účely poskytování našich služeb.
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <div style="text-align:center;margin:0 0 28px 0;">
                        <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:#0A2F20;font-weight:700;margin-bottom:10px;">${escapeHtml(closingTitle || 'Těší nás, že jste s námi.')}</div>
                        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.2;color:#C99A12;font-style:italic;">${escapeHtml(closingSubtitle || 'Tým Zenvoria')}</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0;background:linear-gradient(90deg,#072B1C 0%,#0B3C27 100%);border-top:1px solid #C99A12;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="33.33%" valign="top" style="padding:34px 28px 32px 28px;border-right:1px solid rgba(217,169,29,0.25);">
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.1;color:#F7F1E5;font-weight:700;letter-spacing:0.08em;">ZENVORIA</div>
                            <div style="margin-top:10px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.4;color:#D9A91D;font-style:italic;">Péče s lidskostí</div>
                            <div style="margin-top:16px;width:60px;height:2px;background:#D9A91D;"></div>
                          </td>
                          <td width="33.33%" valign="top" style="padding:34px 28px 32px 28px;border-right:1px solid rgba(217,169,29,0.25);">
                            <div style="font-size:13px;line-height:1.2;color:#D9A91D;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:14px;">Kontakt</div>
                            <div style="color:#E4ECE6;font-size:15px;line-height:2;">✉ miklasova@zenvoria.cz<br>☎ +420 777 625 165<br>⌘ www.zenvoria.cz</div>
                          </td>
                          <td width="33.33%" valign="top" style="padding:34px 28px 32px 28px;">
                            <div style="font-size:13px;line-height:1.2;color:#D9A91D;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:16px;">Sledujte nás</div>
                            <div>${emailSocialIconsHtml()}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 28px 22px 28px;text-align:center;background:#07281A;border-top:1px solid rgba(217,169,29,0.25);color:#D3DDD5;font-size:13px;line-height:1.8;">
                      ${escapeHtml(footerNote)}<br>
                      © 2026 ZENVORIA s.r.o. Všechna práva vyhrazena.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function registrationMail(user) {
  const firstName = (user.name || '').trim().split(/\s+/)[0] || 'zákazníku';
  return {
    subject: 'Vítejte v ZENVORIA',
    text:
      `Dobrý den, ${user.name},\n\n` +
      'děkujeme za registraci do ZENVORIA. Váš účet byl úspěšně vytvořen.\n\n' +
      'Pokud jste se neregistrovali vy, odpovězte prosím na tento e-mail.\n\n' +
      'S pozdravem,\nTým ZENVORIA',
    html: renderEmailLayout({
      preheader: 'Váš účet v ZENVORIA je připraven a můžete začít.',
      title: 'Potvrzení registrace',
      intro: `Děkujeme za registraci do ZENVORIA. ${firstName}, váš účet byl úspěšně vytvořen a můžete pokračovat do aplikace.`,
      bodyHtml:
        '<p style="margin:0 0 14px 0;">Právě jsme pro vás aktivovali přístup do prostředí ZENVORIA, kde propojujeme rodiny s pečovatelkami v duchu důvěry, klidu a lidského přístupu.</p>' +
        '<p style="margin:0;">Pokud jste se neregistrovali vy, odpovězte prosím na tento e-mail a situaci okamžitě prověříme.</p>',
      ctaLabel: 'Přejít do aplikace',
      ctaUrl: `${APP_URL}/`,
      ctaNote: 'Pokud tlačítko nefunguje, otevřete prosím ZENVORIA přímo ve svém prohlížeči na www.zenvoria.cz.',
      facts: [
        { label: 'Jméno', value: user.name || '' },
        { label: 'E-mail', value: user.email || '' },
        { label: 'Role', value: user.role === 'caregiver' ? 'Pečovatelka' : 'Rodina' },
        { label: 'Stav účtu', value: 'Aktivní' },
      ],
      closingTitle: 'Těší nás, že jste s námi.',
      closingSubtitle: 'Tým Zenvoria',
      footerNote: 'Tento e-mail byl odeslán automaticky po vytvoření účtu v ZENVORIA.',
    }),
  };
}

function reservationMail({ user, order, caregiverName }) {
  const firstName = (user.name || '').trim().split(/\s+/)[0] || 'zákazníku';
  const when = [order.date, order.time].filter(Boolean).join(' v ');
  const facts = [
    { label: 'Služba', value: order.service || '' },
    { label: 'Termín', value: when || '' },
    { label: 'Adresa', value: order.addr || '' },
    { label: 'Délka péče', value: `${order.hours} h` },
  ];
  if (caregiverName) facts.push({ label: 'Pečovatelka', value: caregiverName });
  facts.push({ label: 'Stav rezervace', value: order.status || '' });
  if (order.note) facts.push({ label: 'Poznámka', value: order.note });
  return {
    subject: `Potvrzení rezervace péče na ${order.date}`,
    text:
      `Dobrý den, ${user.name},\n\n` +
      'děkujeme za vaši rezervaci v ZENVORIA.\n\n' +
      `Služba: ${order.service}\n` +
      `Termín: ${when}\n` +
      `Adresa: ${order.addr}\n` +
      `Délka: ${order.hours} h\n` +
      (caregiverName ? `Pečovatelka: ${caregiverName}\n` : '') +
      `Stav: ${order.status}\n` +
      (order.note ? `Poznámka: ${order.note}\n` : '') +
      '\nJakmile se stav rezervace změní, dáme vám vědět.\n\n' +
      'S pozdravem,\nTým ZENVORIA',
    html: renderEmailLayout({
      preheader: 'Vaše rezervace v ZENVORIA byla přijata.',
      title: 'Potvrzení rezervace',
      intro: `Děkujeme za vaši rezervaci v ZENVORIA. ${firstName}, objednávku jsme přijali a čeká na další zpracování.`,
      bodyHtml:
        '<p style="margin:0 0 14px 0;">Níže najdete shrnutí rezervace. Jakmile se stav změní, pošleme vám další aktualizaci.</p>' +
        '<p style="margin:0;">Pokud potřebujete cokoli upravit, odpovězte prosím na tento e-mail.</p>',
      ctaLabel: 'Zobrazit ZENVORIA',
      ctaUrl: `${APP_URL}/`,
      ctaNote: 'Přehled rezervací najdete po přihlášení ve svém účtu na ZENVORIA.',
      facts,
      closingTitle: 'Děkujeme za vaši důvěru.',
      closingSubtitle: 'Tým Zenvoria',
      footerNote: 'Tento e-mail slouží jako potvrzení právě vytvořené rezervace v ZENVORIA.',
    }),
  };
}

function forgotPasswordMail({ user, resetUrl }) {
  const firstName = (user.name || '').trim().split(/\s+/)[0] || 'zákazníku';
  return {
    subject: 'Obnova hesla v ZENVORIA',
    text:
      `Dobrý den, ${user.name || firstName},\n\n` +
      'obdrželi jsme žádost o nastavení nového hesla k vašemu účtu ZENVORIA.\n\n' +
      `Pokračujte zde: ${resetUrl}\n\n` +
      'Odkaz je platný 30 minut. Pokud jste o změnu hesla nežádali, tento e-mail ignorujte.\n\n' +
      'S pozdravem,\nTým ZENVORIA',
    html: renderEmailLayout({
      preheader: 'Posíláme vám bezpečný odkaz pro nastavení nového hesla.',
      title: 'Obnova hesla',
      intro: `Děkujeme, ${firstName}. Připravili jsme pro vás bezpečný odkaz pro nastavení nového hesla k účtu ZENVORIA.`,
      bodyHtml:
        '<p style="margin:0 0 14px 0;">Kliknutím na tlačítko níže otevřete stránku, kde zadáte nové heslo dvakrát. Odkaz je časově omezený.</p>' +
        '<p style="margin:0;">Pokud jste o změnu hesla nežádali, tento e-mail můžete bezpečně ignorovat.</p>',
      ctaLabel: 'Nastavit nové heslo',
      ctaUrl: resetUrl,
      ctaNote: `Odkaz je platný 30 minut. Pokud tlačítko nefunguje, otevřete tento odkaz: ${resetUrl}`,
      facts: [
        { label: 'E-mail účtu', value: user.email || '' },
        { label: 'Typ požadavku', value: 'Reset hesla' },
        { label: 'Platnost odkazu', value: '30 minut' },
      ],
      closingTitle: 'Bezpečnost je pro nás priorita.',
      closingSubtitle: 'Tým Zenvoria',
      footerNote: 'Tento e-mail byl odeslán automaticky po žádosti o obnovu hesla v ZENVORIA.',
    }),
  };
}

function changeEmailLinkMail({ user, confirmUrl }) {
  const firstName = (user.name || '').trim().split(/\s+/)[0] || 'zákazníku';
  return {
    subject: 'Potvrzení změny e-mailu v ZENVORIA',
    text:
      `Dobrý den, ${user.name || firstName},\n\n` +
      'obdrželi jsme žádost o změnu e-mailové adresy u vašeho účtu ZENVORIA.\n\n' +
      `Pro pokračování otevřete tento odkaz: ${confirmUrl}\n\n` +
      'Odkaz je platný 30 minut. Pokud jste o změnu e-mailu nežádali, tento e-mail ignorujte.\n\n' +
      'S pozdravem,\nTým ZENVORIA',
    html: renderEmailLayout({
      preheader: 'Potvrďte změnu e-mailu bezpečným odkazem na původní adrese.',
      title: 'Změna e-mailu',
      intro: `Dobrý den, ${firstName}. Pro změnu e-mailové adresy nejdřív potřebujeme potvrdit přístup k vašemu současnému e-mailu.`,
      bodyHtml:
        '<p style="margin:0 0 14px 0;">Kliknutím na tlačítko níže otevřete bezpečnou stránku, kde zadáte nový e-mail. Na něj vám následně pošleme ověřovací kód.</p>' +
        '<p style="margin:0;">Pokud jste o změnu nežádali, nic se nestane a tento e-mail můžete ignorovat.</p>',
      ctaLabel: 'Potvrdit změnu e-mailu',
      ctaUrl: confirmUrl,
      ctaNote: `Odkaz je platný 30 minut. Pokud tlačítko nefunguje, otevřete tento odkaz: ${confirmUrl}`,
      facts: [
        { label: 'Současný e-mail', value: user.email || '' },
        { label: 'Typ požadavku', value: 'Změna e-mailu' },
        { label: 'Platnost odkazu', value: '30 minut' },
      ],
      closingTitle: 'Bezpečnost je pro nás priorita.',
      closingSubtitle: 'Tým Zenvoria',
      footerNote: 'Tento e-mail byl odeslán automaticky po žádosti o změnu e-mailu v ZENVORIA.',
    }),
  };
}

function changeEmailCodeMail({ user, newEmail, code }) {
  const firstName = (user.name || '').trim().split(/\s+/)[0] || 'zákazníku';
  return {
    subject: 'Ověřovací kód pro nový e-mail v ZENVORIA',
    text:
      `Dobrý den, ${user.name || firstName},\n\n` +
      `pro potvrzení nové e-mailové adresy ${newEmail} zadejte tento kód: ${code}\n\n` +
      'Kód je platný 10 minut. Pokud jste o změnu e-mailu nežádali, tento e-mail ignorujte.\n\n' +
      'S pozdravem,\nTým ZENVORIA',
    html: renderEmailLayout({
      preheader: 'Posíláme vám ověřovací kód pro novou e-mailovou adresu.',
      title: 'Ověření nového e-mailu',
      intro: `Dobrý den, ${firstName}. Pro dokončení změny e-mailu zadejte do aplikace tento šestimístný kód.`,
      bodyHtml:
        `<p style="margin:0 0 14px 0;">Nová adresa: <b>${escapeHtml(newEmail)}</b></p>` +
        `<div style="margin:0 auto 16px auto;max-width:260px;padding:18px 22px;border-radius:18px;background:#0A2F20;color:#D9A91D;font-size:34px;letter-spacing:0.22em;font-weight:800;text-align:center;">${escapeHtml(code)}</div>` +
        '<p style="margin:0;">Kód je platný 10 minut. Pokud jste o změnu e-mailu nežádali, tento e-mail ignorujte.</p>',
      ctaLabel: 'Otevřít ZENVORIA',
      ctaUrl: `${APP_URL}/#settings`,
      ctaNote: 'Kód opište do formuláře v aplikaci. Nikdy ho nesdílejte s další osobou.',
      facts: [
        { label: 'Nová e-mailová adresa', value: newEmail || '' },
        { label: 'Ověřovací kód', value: code || '' },
        { label: 'Platnost kódu', value: '10 minut' },
      ],
      closingTitle: 'Děkujeme za potvrzení.',
      closingSubtitle: 'Tým Zenvoria',
      footerNote: 'Tento e-mail byl odeslán automaticky při ověření nové e-mailové adresy v ZENVORIA.',
    }),
  };
}

// ---- e-mail: aktivace předplatného PREMIUM (pečovatelce) ----
function premiumActiveMail({ name, email, priceCzk }) {
  const firstName = (name || '').trim().split(/\s+/)[0] || 'pečovatelko';
  return {
    subject: 'Vaše předplatné PREMIUM je aktivní',
    text:
      `Dobrý den, ${name || firstName},\n\n` +
      'vaše měsíční předplatné ZENVORIA PREMIUM je aktivní. Děkujeme!\n\n' +
      'Od teď máte vyšší zobrazení ve vyhledávání a odznak Premium u profilu.\n\n' +
      'S pozdravem,\nTým ZENVORIA',
    html: renderEmailLayout({
      preheader: 'Předplatné PREMIUM je aktivní — děkujeme.',
      title: 'PREMIUM je aktivní',
      intro: `Děkujeme, ${firstName}. Vaše měsíční předplatné ZENVORIA PREMIUM bylo úspěšně aktivováno.`,
      bodyHtml:
        '<p style="margin:0 0 14px 0;">Od této chvíle máte <b>vyšší zobrazení ve vyhledávání</b> a u profilu <b>odznak Premium</b>, který zvyšuje důvěru rodin.</p>' +
        '<p style="margin:0;">Předplatné se automaticky obnovuje každý měsíc. Spravovat nebo zrušit ho můžete kdykoli ve svém účtu na Ceníku.</p>',
      ctaLabel: 'Spravovat předplatné',
      ctaUrl: `${APP_URL}/#pricing`,
      ctaNote: 'Účtenku k platbě vám zasílá platební brána Stripe samostatně.',
      facts: [
        { label: 'Tarif', value: 'PREMIUM' },
        { label: 'Cena', value: (priceCzk ? `${priceCzk} Kč / měsíc` : '') },
        { label: 'Stav', value: 'Aktivní' },
      ],
      closingTitle: 'Děkujeme za důvěru.',
      closingSubtitle: 'Tým Zenvoria',
      footerNote: 'Tento e-mail byl odeslán automaticky po aktivaci předplatného PREMIUM.',
    }),
  };
}
// ---- e-mail: předplatné PREMIUM ukončeno / zrušeno ----
function premiumEndedMail({ name }) {
  const firstName = (name || '').trim().split(/\s+/)[0] || 'pečovatelko';
  return {
    subject: 'Vaše předplatné PREMIUM bylo ukončeno',
    text:
      `Dobrý den, ${name || firstName},\n\n` +
      'vaše předplatné ZENVORIA PREMIUM bylo ukončeno. Váš profil pokračuje v tarifu START.\n\n' +
      'Kdykoli se můžete vrátit k PREMIUM na Ceníku.\n\n' +
      'S pozdravem,\nTým ZENVORIA',
    html: renderEmailLayout({
      preheader: 'Předplatné PREMIUM bylo ukončeno.',
      title: 'PREMIUM ukončeno',
      intro: `Dobrý den, ${firstName}. Vaše předplatné ZENVORIA PREMIUM bylo ukončeno a váš profil nyní pokračuje v bezplatném tarifu START.`,
      bodyHtml:
        '<p style="margin:0 0 14px 0;">Přicházíte tím o vyšší zobrazení ve vyhledávání a odznak Premium.</p>' +
        '<p style="margin:0;">Kdykoli se můžete k PREMIUM vrátit jediným kliknutím na Ceníku.</p>',
      ctaLabel: 'Obnovit PREMIUM',
      ctaUrl: `${APP_URL}/#pricing`,
      ctaNote: '',
      facts: [{ label: 'Aktuální tarif', value: 'START (zdarma)' }],
      closingTitle: 'Budeme se těšit zpět.',
      closingSubtitle: 'Tým Zenvoria',
      footerNote: 'Tento e-mail byl odeslán automaticky po ukončení předplatného PREMIUM.',
    }),
  };
}
// ---- e-mail: problém s platbou předplatného ----
function premiumPaymentIssueMail({ name }) {
  const firstName = (name || '').trim().split(/\s+/)[0] || 'pečovatelko';
  return {
    subject: 'Problém s platbou předplatného PREMIUM',
    text:
      `Dobrý den, ${name || firstName},\n\n` +
      'platbu za vaše předplatné PREMIUM se nepodařilo zpracovat.\n\n' +
      'Aktualizujte prosím platební údaje ve svém účtu, jinak může být PREMIUM pozastaveno.\n\n' +
      'S pozdravem,\nTým ZENVORIA',
    html: renderEmailLayout({
      preheader: 'Platbu předplatného se nepodařilo zpracovat.',
      title: 'Problém s platbou',
      intro: `Dobrý den, ${firstName}. Platbu za vaše předplatné ZENVORIA PREMIUM se bohužel nepodařilo zpracovat.`,
      bodyHtml:
        '<p style="margin:0 0 14px 0;">Zkontrolujte prosím a aktualizujte své platební údaje, abyste o PREMIUM nepřišli.</p>' +
        '<p style="margin:0;">Stripe se platbu pokusí zopakovat. Pokud potíže přetrvají, předplatné může být pozastaveno.</p>',
      ctaLabel: 'Aktualizovat platbu',
      ctaUrl: `${APP_URL}/#pricing`,
      ctaNote: '',
      facts: [{ label: 'Tarif', value: 'PREMIUM' }, { label: 'Stav platby', value: 'Neúspěšná' }],
      closingTitle: 'Rádi vám pomůžeme.',
      closingSubtitle: 'Tým Zenvoria',
      footerNote: 'Tento e-mail byl odeslán automaticky po neúspěšné platbě předplatného.',
    }),
  };
}
// ---- e-mail: objednávka přijata / odmítnuta (rodině) ----
function orderStatusMail({ familyName, order, caregiverName, accepted }) {
  const firstName = (familyName || '').trim().split(/\s+/)[0] || 'zákazníku';
  const when = [order.date, order.time].filter(Boolean).join(' v ');
  const facts = [
    { label: 'Služba', value: order.service || '' },
    { label: 'Termín', value: when || '' },
  ];
  if (caregiverName) facts.push({ label: 'Pečovatelka', value: caregiverName });
  facts.push({ label: 'Stav', value: accepted ? 'Potvrzeno' : 'Odmítnuto' });
  return {
    subject: accepted ? `Vaše rezervace byla potvrzena (${order.date})` : `Vaše rezervace byla odmítnuta (${order.date})`,
    text:
      `Dobrý den, ${familyName || firstName},\n\n` +
      (accepted
        ? `dobrá zpráva — pečovatelka ${caregiverName || ''} potvrdila vaši rezervaci.\n`
        : `pečovatelka ${caregiverName || ''} bohužel nemůže vaši rezervaci přijmout.\n`) +
      `Služba: ${order.service}\nTermín: ${when}\n\n` +
      (accepted ? 'Těšíme se na vás.\n\n' : 'Zkuste prosím vybrat jinou pečovatelku nebo termín.\n\n') +
      'S pozdravem,\nTým ZENVORIA',
    html: renderEmailLayout({
      preheader: accepted ? 'Vaše rezervace byla potvrzena.' : 'Vaše rezervace byla odmítnuta.',
      title: accepted ? 'Rezervace potvrzena' : 'Rezervace odmítnuta',
      intro: accepted
        ? `Dobrá zpráva, ${firstName}. Pečovatelka ${caregiverName || ''} potvrdila vaši rezervaci.`
        : `Dobrý den, ${firstName}. Pečovatelka ${caregiverName || ''} bohužel nemůže vaši rezervaci přijmout.`,
      bodyHtml: accepted
        ? '<p style="margin:0;">Vše je domluveno. Detaily najdete ve svém účtu v sekci „Moje objednávky".</p>'
        : '<p style="margin:0;">Nevadí — vyberte prosím jinou pečovatelku nebo jiný termín. Rádi vám pomůžeme najít vhodnou péči.</p>',
      ctaLabel: accepted ? 'Zobrazit objednávky' : 'Najít jinou pečovatelku',
      ctaUrl: accepted ? `${APP_URL}/#bookings` : `${APP_URL}/#search`,
      ctaNote: '',
      facts,
      closingTitle: accepted ? 'Děkujeme za vaši důvěru.' : 'Jsme tu pro vás.',
      closingSubtitle: 'Tým Zenvoria',
      footerNote: 'Tento e-mail informuje o změně stavu vaší rezervace v ZENVORIA.',
    }),
  };
}
// ---- e-mail: výsledek ověření (pečovatelce) ----
function verificationResultMail({ name, approved, reason }) {
  const firstName = (name || '').trim().split(/\s+/)[0] || 'pečovatelko';
  return {
    subject: approved ? 'Vaše ověření bylo schváleno' : 'Vaše žádost o ověření byla zamítnuta',
    text:
      `Dobrý den, ${name || firstName},\n\n` +
      (approved
        ? 'gratulujeme — vaše žádost o ověření byla schválena. Váš profil je nyní viditelný rodinám.\n'
        : `vaši žádost o ověření jsme bohužel nemohli schválit.\n${reason ? 'Důvod: ' + reason + '\n' : ''}Upravte prosím údaje a odešlete znovu.\n`) +
      '\nS pozdravem,\nTým ZENVORIA',
    html: renderEmailLayout({
      preheader: approved ? 'Vaše ověření bylo schváleno.' : 'Vaše žádost o ověření byla zamítnuta.',
      title: approved ? 'Ověření schváleno' : 'Žádost zamítnuta',
      intro: approved
        ? `Gratulujeme, ${firstName}. Vaše žádost o ověření byla schválena.`
        : `Dobrý den, ${firstName}. Vaši žádost o ověření jsme bohužel nemohli schválit.`,
      bodyHtml: approved
        ? '<p style="margin:0;">Váš profil je nyní <b>viditelný rodinám</b> ve vyhledávání. Doplňte si nabídku služeb a dostupnost v kalendáři, ať vás osloví co nejvíc rodin.</p>'
        : `<p style="margin:0 0 14px 0;">${reason ? 'Důvod: <b>' + escapeHtml(reason) + '</b>' : 'Některé údaje nebylo možné ověřit.'}</p><p style="margin:0;">Upravte prosím své údaje či doklady a odešlete žádost znovu.</p>`,
      ctaLabel: approved ? 'Otevřít profil' : 'Upravit a odeslat znovu',
      ctaUrl: approved ? `${APP_URL}/#cg-profile` : `${APP_URL}/#cg-verify`,
      ctaNote: '',
      facts: [{ label: 'Stav ověření', value: approved ? 'Schváleno' : 'Zamítnuto' }],
      closingTitle: approved ? 'Vítejte mezi ověřenými pečovatelkami.' : 'Rádi vám pomůžeme.',
      closingSubtitle: 'Tým Zenvoria',
      footerNote: 'Tento e-mail informuje o výsledku vaší žádosti o ověření v ZENVORIA.',
    }),
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
function createCsrfToken() {
  return crypto.randomBytes(24).toString('base64url');
}
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
  const csrf = user.csrf || createCsrfToken();
  const token = signSession({
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    csrf,
    exp: Date.now() + SESSION_TTL_MS,
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
  res.cookie(CSRF_COOKIE, csrf, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}
function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}

function createResetToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function createEmailChangeToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function createEmailVerificationCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function hashVerificationCode(code) {
  return crypto.createHash('sha256').update(String(code || '')).digest('hex');
}

function passwordResetKey(token) {
  return `${RESET_TOKEN_KEY_PREFIX}${hashResetToken(token)}`;
}

function emailChangeKey(token) {
  return `${EMAIL_CHANGE_KEY_PREFIX}${hashResetToken(token)}`;
}
function conversationAccessKey(id) {
  return `${CONVERSATION_ACCESS_KEY_PREFIX}${Number(id)}`;
}

async function saveResetToken(email, token) {
  const value = {
    email: String(email || '').trim().toLowerCase(),
    exp: Date.now() + RESET_TOKEN_TTL_MS,
    createdAt: new Date().toISOString(),
    usedAt: null,
  };
  await supabaseRestRequest('POST', T.settings, {
    body: { key: passwordResetKey(token), value },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
  return value;
}

async function saveEmailChangeToken(user, token) {
  const value = {
    userId: String(user.id || ''),
    currentEmail: String(user.email || '').trim().toLowerCase(),
    exp: Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS,
    createdAt: new Date().toISOString(),
    usedAt: null,
    newEmail: null,
    verifyCodeHash: null,
    verifyCodeExp: null,
    verifySentAt: null,
    verifiedAt: null,
  };
  await supabaseRestRequest('POST', T.settings, {
    body: { key: emailChangeKey(token), value },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
  return value;
}

async function loadResetTokenRecord(token) {
  const raw = String(token || '').trim();
  if (!raw) return null;
  const key = passwordResetKey(raw);
  const rows = await restSelect(T.settings, `key=eq.${encodeURIComponent(key)}&limit=1`);
  const row = rows && rows[0];
  if (!row || !row.value || typeof row.value !== 'object') return null;
  const value = row.value;
  return {
    key,
    value: {
      email: String(value.email || '').trim().toLowerCase(),
      exp: Number(value.exp || 0),
      createdAt: value.createdAt || null,
      usedAt: value.usedAt || null,
    },
  };
}

async function loadEmailChangeRecord(token) {
  const raw = String(token || '').trim();
  if (!raw) return null;
  const key = emailChangeKey(raw);
  const rows = await restSelect(T.settings, `key=eq.${encodeURIComponent(key)}&limit=1`);
  const row = rows && rows[0];
  if (!row || !row.value || typeof row.value !== 'object') return null;
  const value = row.value;
  return {
    key,
    value: {
      userId: String(value.userId || ''),
      currentEmail: String(value.currentEmail || '').trim().toLowerCase(),
      exp: Number(value.exp || 0),
      createdAt: value.createdAt || null,
      usedAt: value.usedAt || null,
      newEmail: value.newEmail ? String(value.newEmail).trim().toLowerCase() : null,
      verifyCodeHash: value.verifyCodeHash || null,
      verifyCodeExp: value.verifyCodeExp ? Number(value.verifyCodeExp) : null,
      verifySentAt: value.verifySentAt || null,
      verifiedAt: value.verifiedAt || null,
    },
  };
}

async function markResetTokenUsed(record) {
  if (!record || !record.key || !record.value) return;
  await restUpdate(T.settings, `key=eq.${encodeURIComponent(record.key)}`, {
    value: {
      ...record.value,
      usedAt: new Date().toISOString(),
    },
  }, { prefer: 'return=minimal' });
}

async function updateEmailChangeRecord(record, patch) {
  if (!record || !record.key || !record.value) return null;
  const value = { ...record.value, ...patch };
  await restUpdate(T.settings, `key=eq.${encodeURIComponent(record.key)}`, { value }, { prefer: 'return=minimal' });
  record.value = value;
  return record;
}
async function saveConversationAccess(id, value) {
  await supabaseRestRequest('POST', T.settings, {
    body: { key: conversationAccessKey(id), value },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
  return value;
}
async function loadConversationAccess(id) {
  const key = conversationAccessKey(id);
  const rows = await restSelect(T.settings, `key=eq.${encodeURIComponent(key)}&limit=1`);
  const row = rows && rows[0];
  if (!row || !row.value || typeof row.value !== 'object') return null;
  const value = row.value;
  return {
    key,
    value: {
      ownerEmail: String(value.ownerEmail || '').trim().toLowerCase(),
      role: String(value.role || ''),
      createdAt: value.createdAt || null,
    },
  };
}

async function getResetTokenState(token) {
  const record = await loadResetTokenRecord(token);
  if (!record) return { ok: false, reason: 'invalid' };
  if (!record.value.email || !record.value.exp) return { ok: false, reason: 'invalid' };
  if (record.value.usedAt) return { ok: false, reason: 'used' };
  if (Date.now() > record.value.exp) return { ok: false, reason: 'expired' };
  return {
    ok: true,
    payload: { email: record.value.email, exp: record.value.exp },
    record,
  };
}

async function getEmailChangeState(token) {
  const record = await loadEmailChangeRecord(token);
  if (!record) return { ok: false, reason: 'invalid' };
  if (!record.value.userId || !record.value.currentEmail || !record.value.exp) return { ok: false, reason: 'invalid' };
  if (record.value.usedAt) return { ok: false, reason: 'used' };
  if (Date.now() > record.value.exp) return { ok: false, reason: 'expired' };
  return { ok: true, record, payload: record.value };
}

async function loadPublicSettings() {
  const queries = PUBLIC_SETTINGS_KEYS.map((key) => restSelect(T.settings, `key=eq.${encodeURIComponent(key)}&limit=1`));
  const rowsList = await Promise.all(queries);
  const settings = {};
  rowsList.forEach((rows) => {
    const row = rows && rows[0];
    if (row && row.key) settings[row.key] = row.value;
  });
  return settings;
}

// middleware: načte přihlášeného uživatele z cookie do req.session
function loadSession(req, _res, next) {
  req.session = verifySession(req.cookies && req.cookies[SESSION_COOKIE]);
  if (req.session && !req.session.csrf) {
    req.session.csrf = createCsrfToken();
    req.sessionRefresh = true;
  }
  next();
}
async function enforceActiveSession(req, res, next) {
  if (!req.session || !req.session.uid) return next();
  try {
    const rows = await restSelect(T.users, `id=eq.${encodeURIComponent(req.session.uid)}&select=id,status&limit=1`);
    const user = rows && rows[0];
    if (!user || user.status === 'suspended') {
      clearSession(res);
      req.session = null;
      return next();
    }
  } catch (e) {
    console.warn('[auth] session status check failed:', e.message);
  }
  next();
}
function refreshSessionCookie(req, res, next) {
  if (req.session && req.sessionRefresh) {
    setSession(res, {
      id: req.session.uid,
      email: req.session.email,
      name: req.session.name,
      role: req.session.role,
      csrf: req.session.csrf,
    });
    req.sessionRefresh = false;
  }
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
function trustedRequestOrigin(req) {
  const raw = String(req.headers.origin || req.headers.referer || '').trim();
  if (!raw) return false;
  try {
    const incoming = new URL(raw).origin;
    return incoming === new URL(APP_URL).origin;
  } catch {
    return false;
  }
}
function requireCsrf(req, res, next) {
  if (!req.session) return next();
  const method = String(req.method || 'GET').toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next();
  if (!req.path.startsWith('/api/')) return next();
  if (req.path === '/api/billing/webhook') return next();
  if (!trustedRequestOrigin(req)) return res.status(403).json({ error: 'Neplatný původ požadavku.' });
  const headerToken = String(req.headers['x-csrf-token'] || '').trim();
  const cookieToken = String((req.cookies && req.cookies[CSRF_COOKIE]) || '').trim();
  if (!headerToken || !cookieToken || headerToken !== cookieToken || headerToken !== String(req.session.csrf || '')) {
    return res.status(403).json({ error: 'Bezpečnostní token požadavku chybí nebo je neplatný.' });
  }
  next();
}
// přístup do konverzace má jen její účastník (user_a / user_b) nebo admin
function requireConversationParticipant(req, res, next) {
  Promise.resolve().then(async () => {
    if (!req.session) return res.status(401).json({ error: 'Nepřihlášen' });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Neplatné ID konverzace.' });
    const rows = await restSelect(T.conversations, `id=eq.${id}&select=id,user_a,user_b,a_read_at,b_read_at&limit=1`);
    const conv = rows && rows[0];
    if (!conv) return res.status(404).json({ error: 'Konverzace nenalezena.' });
    const me = String(req.session.uid || '');
    if (req.session.role !== 'admin' && me !== String(conv.user_a || '') && me !== String(conv.user_b || '')) {
      return res.status(403).json({ error: 'Do této konverzace nemáte přístup.' });
    }
    req.conversation = conv;
    next();
  }).catch(next);
}

/* ----------------------------------------------------------------------
   4) MAPOVÁNÍ DB ŘÁDKŮ → tvar, který čeká frontend (index.html)
   -------------------------------------------------------------------- */
function publicUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role, status: u.status, init: u.init, settings: u.settings, photo: u.photo || null, publicId: u.public_id || null };
}
function mapCaregiver(c) {
  return {
    id: Number(c.id), publicId: c.public_id || null, name: c.name, init: c.init, loc: c.loc, rate: c.rate,
    rating: Number(c.rating), reviews: c.reviews, exp: c.exp, services: c.services || [],
    verified: c.verified, cert: c.cert, bio: c.bio, status: c.status, suspended: c.suspended,
    idVerified: c.id_verified, plan: c.plan, langs: c.langs || ['Čeština'],
    priceType: c.price_type, dayRate: c.day_rate, radius: c.radius, kmPrice: c.km_price,
    photo: c.photo || null, email: c.email || null, avail: c.avail || null,
  };
}
function mapCaregiverForViewer(c, opts = {}) {
  const row = mapCaregiver(c);
  if (opts.viewer === 'admin' || opts.includePrivate) return row;
  delete row.email;
  delete row.avail;
  delete row.idVerified;
  return row;
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
const VERIFY_CERTS_MARKER = '[[CERTS]]';
function decodeVerificationNote(note) {
  const raw = String(note || '');
  const idx = raw.indexOf(VERIFY_CERTS_MARKER);
  if (idx < 0) return { note: raw, certifications: [] };
  let certifications = [];
  try { certifications = JSON.parse(raw.slice(idx + VERIFY_CERTS_MARKER.length)) || []; } catch (e) {}
  return { note: raw.slice(0, idx).trim(), certifications: Array.isArray(certifications) ? certifications : [] };
}
function mapVerification(v) {
  const parsed = decodeVerificationNote(v.note);
  return { id: Number(v.id), name: v.name, email: v.email, init: v.init, loc: v.loc, rate: v.rate, exp: v.exp,
    phone: v.phone, docType: v.doc_type, docNum: v.doc_num, idFront: v.id_front, idBack: v.id_back, selfie: v.selfie,
    services: v.services || [], cert: v.cert, issuer: v.issuer, validUntil: v.valid_until, fileName: v.file_name,
    refs: v.refs, note: parsed.note, certifications: parsed.certifications, bio: v.bio, status: v.status, date: v.date, reason: v.reason };
}

/* ----------------------------------------------------------------------
   5) APP
   -------------------------------------------------------------------- */
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.stripe.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com;");
  next();
});

// --- Stripe webhook (MUSÍ být před express.json — potřebuje surové tělo pro ověření podpisu) ---
app.post('/api/billing/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  if (!STRIPE_ENABLED) return res.status(503).end();
  let event;
  try {
    if (STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString('utf8')); // fallback bez ověření (jen pro lokální testy)
    }
  } catch (err) {
    console.error('[stripe] webhook podpis selhal:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    const o = event.data && event.data.object;
    switch (event.type) {
      case 'checkout.session.completed': {
        const email = (o.client_reference_id || (o.customer_details && o.customer_details.email) || '').toLowerCase();
        const r = await setCaregiverPlan({ email, customerId: o.customer, subscriptionId: o.subscription, plan: 'premium', status: 'active' });
        // e-mail o aktivaci jen při skutečném přechodu na PREMIUM
        if (r && r.prevPlan !== 'premium' && r.row.email) {
          const priceCzk = await premiumPriceCZK();
          await sendMailSafe({ to: r.row.email, ...premiumActiveMail({ name: r.row.name, email: r.row.email, priceCzk }) });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const active = ['active', 'trialing', 'past_due'].includes(o.status);
        const r = await setCaregiverPlan({ customerId: o.customer, subscriptionId: o.id, plan: active ? 'premium' : 'start', status: o.status });
        // upozornění na problém s platbou (jen při přechodu do past_due/unpaid)
        if (r && r.row.email && ['past_due', 'unpaid'].includes(o.status) && !['past_due', 'unpaid'].includes(r.prevStatus || '')) {
          await sendMailSafe({ to: r.row.email, ...premiumPaymentIssueMail({ name: r.row.name }) });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const r = await setCaregiverPlan({ customerId: o.customer, subscriptionId: o.id, plan: 'start', status: 'canceled' });
        if (r && r.prevPlan === 'premium' && r.row.email) {
          await sendMailSafe({ to: r.row.email, ...premiumEndedMail({ name: r.row.name }) });
        }
        break;
      }
      default: break;
    }
  } catch (err) {
    console.error('[stripe] zpracování webhooku selhalo:', err.message);
    // 200 i tak, ať Stripe neopakuje donekonečna kvůli naší chybě v DB
  }
  res.json({ received: true });
});

app.use(express.json({ limit: '30mb' }));
app.use(cookieParser());
app.use(loadSession);
app.use(enforceActiveSession);
app.use(refreshSessionCookie);
app.use(requireCsrf);

const ROOT = __dirname;

// malý wrapper, ať se nemusí všude psát try/catch
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ---------------- HEALTH ---------------- */
app.get('/api/health', (_req, res) => res.json({
  ok: true,
  rest: REST_ENABLED,
  geoapifyConfigured: !!GEOAPIFY_API_KEY,
}));

/* ---------------- VERZE (auto-reload klientů po deployi) ---------------- */
/* Otisk frontendu — mění se s každou změnou kódu, takže ho klient pozná a obnoví stránku. */
const APP_VERSION = (() => {
  try {
    const hash = crypto.createHash('sha1');
    for (const f of ['index.html', 'app.js', 'app.css', 'deferred-views.html']) {
      try { hash.update(fs.readFileSync(path.join(__dirname, f))); } catch (e) { /* soubor může chybět */ }
    }
    return hash.digest('hex').slice(0, 12);
  } catch (e) {
    return String(Date.now());
  }
})();
app.get('/api/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ version: APP_VERSION });
});

/* ---------------- VEŘEJNÝ PROFIL ÚČTU podle náhodného tokenu ---------------- */
/* #u-<token> → pečovatelka (jen ověřená) nebo minimální profil rodiny. */
app.get('/api/u/:token', h(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const token = String(req.params.token || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 40);
  if (!token) return res.status(404).json({ error: 'Profil nenalezen.' });
  // 1) pečovatelka — veřejná jen když je ověřená a nepozastavená
  const cgs = await restSelect(T.caregivers, `public_id=eq.${encodeURIComponent(token)}&limit=1`);
  const c = cgs && cgs[0];
  if (c && c.verified && !c.suspended) {
    return res.json({ kind: 'caregiver', id: Number(c.id) });
  }
  // 2) rodina / uživatelský účet — minimální veřejná vizitka
  const users = await restSelect(T.users, `public_id=eq.${encodeURIComponent(token)}&select=name,init,photo,role,joined,status&limit=1`);
  const u = users && users[0];
  if (u && u.status !== 'suspended' && u.role !== 'admin') {
    return res.json({ kind: 'account', profile: {
      name: u.name || '', init: u.init || '', photo: u.photo || null,
      role: u.role || 'family', memberSince: u.joined || null,
    } });
  }
  return res.status(404).json({ error: 'Profil nenalezen.' });
}));

/* ---------------- PRESENCE (online / naposledy aktivní) ---------------- */
const PRESENCE_ONLINE_MS = 2 * 60 * 1000; // aktivita do 2 minut = online
function presenceOf(lastSeen, live) {
  const t = lastSeen ? Date.parse(lastSeen) : NaN;
  if (!Number.isFinite(t)) return { online: !!live, lastSeen: null, secondsAgo: null };
  const diff = Date.now() - t;
  // živé SSE spojení = online; jinak aktivita do 2 minut. secondsAgo počítá server.
  return { online: !!live || diff <= PRESENCE_ONLINE_MS, lastSeen: new Date(t).toISOString(), secondsAgo: Math.max(0, Math.round(diff / 1000)) };
}
async function lastSeenByUserId(uid) {
  if (!uid) return null;
  const u = await restSelect(T.users, `id=eq.${encodeURIComponent(uid)}&select=last_seen&limit=1`);
  return u && u[0] ? u[0].last_seen : null;
}
async function lastSeenByCaregiverName(name) {
  const cgs = await restSelect(T.caregivers, `name=eq.${encodeURIComponent(name)}&select=user_id&limit=1`);
  return cgs && cgs[0] ? lastSeenByUserId(cgs[0].user_id) : null;
}

// heartbeat — přihlášený klient posílá pravidelně, uloží čas poslední aktivity
app.post('/api/presence/ping', requireAuth, h(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const uid = req.session && req.session.uid;
  if (!uid) return res.status(401).json({ error: 'Nepřihlášeno.' });
  const now = new Date().toISOString();
  try { await restUpdate(T.users, `id=eq.${encodeURIComponent(uid)}`, { last_seen: now }, { prefer: 'return=minimal' }); } catch (e) {}
  res.json({ ok: true, at: now });
}));

// veřejné: stav pečovatelky (podle jejího caregiver id)
app.get('/api/presence/caregiver/:id', h(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.json({ online: false, lastSeen: null });
  const rows = await restSelect(T.caregivers, `id=eq.${id}&select=user_id&limit=1`);
  const uid = rows && rows[0] ? rows[0].user_id : null;
  return res.json(presenceOf(await lastSeenByUserId(uid), uid && userOnline(uid)));
}));

// v chatu: stav protistran konverzací (jen pro přihlášené účastníky)
app.post('/api/presence/chat', requireAuth, h(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const items = Array.isArray(req.body && req.body.items) ? req.body.items.slice(0, 50) : [];
  const out = [];
  for (const it of items) {
    const name = trimmedString(it && it.name, 120);
    const role = trimmedString(it && it.role, 20) || 'caregiver';
    if (!name) { out.push({ name: '', role, online: false, lastSeen: null }); continue; }
    let uid = null;
    if (role === 'caregiver') {
      const cgs = await restSelect(T.caregivers, `name=eq.${encodeURIComponent(name)}&select=user_id&limit=1`);
      uid = cgs && cgs[0] ? cgs[0].user_id : null;
    } else {
      const u = await restSelect(T.users, `name=eq.${encodeURIComponent(name)}&role=eq.${encodeURIComponent(role)}&select=id&limit=1`);
      uid = u && u[0] ? u[0].id : null;
    }
    out.push(Object.assign({ name, role }, presenceOf(await lastSeenByUserId(uid), uid && userOnline(uid))));
  }
  res.json({ items: out });
}));

/* index.html s otiskem verze u app.css / app.js → po deployi vznikne nová URL
   (app.css?v=HASH), takže i agresivní cache prohlížeče (iOS Safari) stáhne čerstvý
   soubor. index.html samotný jede na no-cache, takže se otisk vždy přenačte. */
const INDEX_HTML = (() => {
  try {
    return fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
      .replace(/(href=")app\.css(")/g, `$1app.css?v=${APP_VERSION}$2`)
      .replace(/(src=")app\.js(")/g, `$1app.js?v=${APP_VERSION}$2`);
  } catch (e) {
    return null;
  }
})();
function sendIndex(res) {
  res.setHeader('Cache-Control', 'no-cache');
  if (INDEX_HTML) return res.type('html').send(INDEX_HTML);
  return res.sendFile(path.join(ROOT, 'index.html'));
}

function formatPostalCode(postcode) {
  const digits = String(postcode || '').replace(/\D/g, '');
  return digits.length === 5 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : String(postcode || '').trim();
}
function firstLocationPart(row) {
  return row.city || row.town || row.village || row.hamlet || row.municipality || row.county || row.state || '';
}
app.get('/api/locations/autocomplete', h(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const q = trimmedString(req.query.q, 120);
  if (!q || q.length < 2) return res.json({ items: [], source: 'empty' });
  if (!GEOAPIFY_API_KEY) return res.json({ items: [], source: 'missing-key' });
  const kind = /^[0-9\s]{2,}$/.test(q) ? 'postcode' : 'city';
  const params = new URLSearchParams({
    text: q,
    lang: 'cs',
    limit: '8',
    format: 'json',
    filter: 'countrycode:cz',
    type: kind,
    apiKey: GEOAPIFY_API_KEY,
  });
  const url = `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`;
  const ext = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);
  if (!ext.ok) {
    const body = await ext.text().catch(() => '');
    throw new Error(`Geoapify ${ext.status}: ${body || ext.statusText}`);
  }
  const payload = await ext.json();
  const seen = new Set();
  const items = (Array.isArray(payload?.results) ? payload.results : []).map((row) => {
    const name = firstLocationPart(row);
    const postcode = formatPostalCode(row.postcode);
    const region = row.state || row.county || '';
    const parts = [name, postcode, region].filter(Boolean);
    const label = parts.join(', ');
    const key = label.toLowerCase();
    if (!name || !label || seen.has(key)) return null;
    seen.add(key);
    return {
      label,
      value: label,
      name,
      postcode,
      region,
    };
  }).filter(Boolean);
  res.json({ items, source: 'geoapify' });
}));

/* ---------------- AUTH ------------------ */
async function findUserByEmail(email) {
  const rows = await restSelect(T.users, `email=eq.${encodeURIComponent((email || '').toLowerCase())}&limit=1`);
  return rows && rows[0];
}

app.post('/api/auth/register', rateLimit('register', RATE_LIMITS.register), h(async (req, res) => {
  const { name, email, password, role } = req.body || {};
  const safeName = trimmedString(name, 120);
  const em = trimmedString(email, 320).toLowerCase();
  if (!isStrongPassword(password)) return res.status(400).json({ error: PASSWORD_RULE_HINT });
  if (!safeName || !em || !password) return res.status(400).json({ error: 'Vyplňte jméno, e-mail i heslo.' });
  if (!isEmail(em)) return res.status(400).json({ error: 'Zadejte platný e-mail.' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Heslo musí mít alespoň 6 znaků.' });
  const r = role === 'caregiver' ? 'caregiver' : 'family';
  if (await findUserByEmail(em)) return res.status(409).json({ error: 'Tento e-mail je už zaregistrovaný.' });
  const init = (safeName.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2) || 'Z').toUpperCase();
  const password_hash = bcrypt.hashSync(String(password), 10);
  const user = await restInsert(T.users, { email: em, password_hash, name: safeName, role: r, init, public_id: genPublicId() });
  const welcomeMail = registrationMail(user);
  await sendMailSafe({ to: user.email, ...welcomeMail });
  fireAudit('auth.register', { req, actor: { id: user.id, email: user.email, role: user.role }, targetType: 'user', targetId: user.id, status: 'success' });
  setSession(res, user);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/login', rateLimit('login', RATE_LIMITS.login), h(async (req, res) => {
  const { email, password } = req.body || {};
  const em = trimmedString(email, 320).toLowerCase();
  if (!em || !password) return res.status(400).json({ error: 'Zadejte e-mail a heslo.' });
  if (!isEmail(em)) return res.status(400).json({ error: 'Zadejte platný e-mail.' });
  const user = await findUserByEmail(email);
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    fireAudit('auth.login', { req, actor: { email: em }, targetType: 'user', targetId: em, status: 'failed', metadata: { reason: 'invalid_credentials' } });
    return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });
  }
  if (user.status === 'suspended') {
    fireAudit('auth.login', { req, actor: { id: user.id, email: user.email, role: user.role }, targetType: 'user', targetId: user.id, status: 'failed', metadata: { reason: 'suspended' } });
    return res.status(403).json({ error: 'Účet je pozastavený.' });
  }
  fireAudit('auth.login', { req, actor: { id: user.id, email: user.email, role: user.role }, targetType: 'user', targetId: user.id, status: 'success' });
  setSession(res, user);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/forgot-password', rateLimit('forgot-password', RATE_LIMITS.forgotPassword), h(async (req, res) => {
  const email = trimmedString(req.body && req.body.email, 320).toLowerCase();
  if (!email) return res.status(400).json({ error: 'Zadejte e-mail.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Zadejte platný e-mail.' });
  const user = await findUserByEmail(email);
  if (user) {
    const token = createResetToken();
    await saveResetToken(user.email, token);
    const resetUrl = `${APP_URL}/?reset=${encodeURIComponent(token)}`;
    const mail = forgotPasswordMail({ user, resetUrl });
    await sendMailSafe({ to: user.email, ...mail });
  }
  fireAudit('auth.forgot_password', { req, actor: { email }, targetType: 'user', targetId: email, status: 'success', metadata: { userFound: !!user } });
  res.json({ ok: true });
}));

app.post('/api/auth/reset-password', rateLimit('reset-password', RATE_LIMITS.resetPassword), h(async (req, res) => {
  const token = trimmedString(req.body && req.body.token, 512);
  const next = String((req.body && req.body.next) || '');
  if (!token) return res.status(400).json({ error: 'Chybí reset token.' });
  if (!isStrongPassword(next)) return res.status(400).json({ error: PASSWORD_RULE_HINT });
  if (!next || next.length < 6) return res.status(400).json({ error: 'Nové heslo musí mít alespoň 6 znaků.' });
  const state = await getResetTokenState(token);
  if (!state.ok) {
    fireAudit('auth.reset_password', { req, actor: { email: null }, targetType: 'reset-token', targetId: 'password-reset', status: 'failed', metadata: { reason: state.reason } });
    const error =
      state.reason === 'expired' ? 'Odkaz pro obnovu hesla vypršel.' :
      state.reason === 'used' ? 'Odkaz pro obnovu hesla už byl použitý.' :
      'Odkaz pro obnovu hesla je neplatný.';
    return res.status(400).json({ error, reason: state.reason });
  }
  const user = await findUserByEmail(state.payload.email);
  if (!user) {
    await markResetTokenUsed(state.record);
    fireAudit('auth.reset_password', { req, actor: { email: state.payload.email }, targetType: 'user', targetId: state.payload.email, status: 'success', metadata: { userFound: false } });
    return res.json({ ok: true });
  }
  await restUpdate(T.users, `id=eq.${user.id}`, { password_hash: bcrypt.hashSync(next, 10) }, { prefer: 'return=minimal' });
  await markResetTokenUsed(state.record);
  fireAudit('auth.reset_password', { req, actor: { id: user.id, email: user.email, role: user.role }, targetType: 'user', targetId: user.id, status: 'success' });
  res.json({ ok: true });
}));

app.post('/api/auth/reset-password/validate', rateLimit('reset-password-validate', RATE_LIMITS.resetPassword), h(async (req, res) => {
  const token = trimmedString(req.body && req.body.token, 512);
  if (!token) return res.status(400).json({ error: 'Chybí reset token.', reason: 'invalid' });
  const state = await getResetTokenState(token);
  if (!state.ok) return res.status(400).json({
    error:
      state.reason === 'expired' ? 'Odkaz pro obnovu hesla vypršel.' :
      state.reason === 'used' ? 'Odkaz pro obnovu hesla už byl použitý.' :
      'Odkaz pro obnovu hesla je neplatný.',
    reason: state.reason,
  });
  res.json({ ok: true });
}));

app.post('/api/auth/logout', (req, res) => {
  if (req.session) fireAudit('auth.logout', { req, actor: auditActor(req), targetType: 'user', targetId: req.session.uid, status: 'success' });
  clearSession(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', h(async (req, res) => {
  if (!req.session) return res.json({ user: null });
  const rows = await restSelect(T.users, `id=eq.${req.session.uid}&limit=1`);
  res.json({ user: publicUser(rows && rows[0]) });
}));

app.post('/api/auth/change-password', requireAuth, rateLimit('change-password', RATE_LIMITS.changePassword), h(async (req, res) => {
  const { current, next } = req.body || {};
  if (!trimmedString(current, 200)) return res.status(400).json({ error: 'Zadejte současné heslo.' });
  if (!isStrongPassword(next)) return res.status(400).json({ error: PASSWORD_RULE_HINT });
  if (!next || String(next).length < 6) return res.status(400).json({ error: 'Nové heslo musí mít alespoň 6 znaků.' });
  const rows = await restSelect(T.users, `id=eq.${req.session.uid}&limit=1`);
  const user = rows && rows[0];
  if (!user || !bcrypt.compareSync(String(current || ''), user.password_hash)) {
    fireAudit('auth.change_password', { req, actor: auditActor(req), targetType: 'user', targetId: req.session.uid, status: 'failed', metadata: { reason: 'invalid_current_password' } });
    return res.status(400).json({ error: 'Současné heslo není správné.' });
  }
  await restUpdate(T.users, `id=eq.${user.id}`, { password_hash: bcrypt.hashSync(String(next), 10) }, { prefer: 'return=minimal' });
  fireAudit('auth.change_password', { req, actor: auditActor(req), targetType: 'user', targetId: user.id, status: 'success' });
  res.json({ ok: true });
}));

app.post('/api/auth/change-email/request', requireAuth, rateLimit('change-email-request', RATE_LIMITS.changeEmailRequest), h(async (req, res) => {
  const rows = await restSelect(T.users, `id=eq.${req.session.uid}&limit=1`);
  const user = rows && rows[0];
  if (!user) return res.status(404).json({ error: 'Ucet nebyl nalezen.' });
  const token = createEmailChangeToken();
  await saveEmailChangeToken(user, token);
  const confirmUrl = `${APP_URL}/?changeEmail=${encodeURIComponent(token)}`;
  await sendMailSafe({ to: user.email, ...changeEmailLinkMail({ user, confirmUrl }) });
  fireAudit('auth.change_email.request', { req, actor: auditActor(req), targetType: 'user', targetId: user.id, status: 'success' });
  res.json({ ok: true });
}));

app.post('/api/auth/change-email/validate', rateLimit('change-email-code', RATE_LIMITS.changeEmailCode), h(async (req, res) => {
  const token = trimmedString(req.body && req.body.token, 512);
  if (!token) return res.status(400).json({ error: 'Chybí token změny e-mailu.', reason: 'invalid' });
  const state = await getEmailChangeState(token);
  if (!state.ok) return res.status(400).json({
    error:
      state.reason === 'expired' ? 'Odkaz pro zmenu e-mailu vyprsel.' :
      state.reason === 'used' ? 'Odkaz pro zmenu e-mailu uz byl pouzity.' :
      'Odkaz pro zmenu e-mailu je neplatny.',
    reason: state.reason,
  });
  res.json({
    ok: true,
    currentEmail: state.payload.currentEmail,
    newEmail: state.payload.newEmail || null,
    codeSent: !!(state.payload.verifyCodeHash && state.payload.verifyCodeExp && state.payload.newEmail),
  });
}));

app.post('/api/auth/change-email/send-code', rateLimit('change-email-code', RATE_LIMITS.changeEmailCode), h(async (req, res) => {
  const token = trimmedString(req.body && req.body.token, 512);
  const newEmail = trimmedString(req.body && req.body.newEmail, 320).toLowerCase();
  if (!token) return res.status(400).json({ error: 'Chybí token změny e-mailu.' });
  if (!newEmail) return res.status(400).json({ error: 'Zadejte novy e-mail.' });
  if (!isEmail(newEmail)) return res.status(400).json({ error: 'Zadejte platny e-mail.' });
  const state = await getEmailChangeState(token);
  if (!state.ok) return res.status(400).json({
    error:
      state.reason === 'expired' ? 'Odkaz pro zmenu e-mailu vyprsel.' :
      state.reason === 'used' ? 'Odkaz pro zmenu e-mailu uz byl pouzity.' :
      'Odkaz pro zmenu e-mailu je neplatny.',
    reason: state.reason,
  });
  if (newEmail === state.payload.currentEmail) return res.status(400).json({ error: 'Novy e-mail se musi lisit od puvodniho.' });
  const existingUser = await findUserByEmail(newEmail);
  if (existingUser && String(existingUser.id) !== String(state.payload.userId)) {
    return res.status(409).json({ error: 'Tento e-mail uz je registrovany.' });
  }
  const rows = await restSelect(T.users, `id=eq.${encodeURIComponent(state.payload.userId)}&limit=1`);
  const user = rows && rows[0];
  if (!user) return res.status(404).json({ error: 'Ucet nebyl nalezen.' });
  const code = createEmailVerificationCode();
  await updateEmailChangeRecord(state.record, {
    newEmail,
    verifyCodeHash: hashVerificationCode(code),
    verifyCodeExp: Date.now() + EMAIL_CHANGE_CODE_TTL_MS,
    verifySentAt: new Date().toISOString(),
    verifiedAt: null,
  });
  await sendMailSafe({ to: newEmail, ...changeEmailCodeMail({ user, newEmail, code }) });
  fireAudit('auth.change_email.code_sent', {
    req,
    actor: { id: user.id, email: user.email, role: user.role },
    targetType: 'user',
    targetId: user.id,
    status: 'success',
    metadata: { newEmail },
  });
  res.json({ ok: true });
}));

app.post('/api/auth/change-email/confirm', rateLimit('change-email-code', RATE_LIMITS.changeEmailCode), h(async (req, res) => {
  const token = trimmedString(req.body && req.body.token, 512);
  const code = trimmedString(req.body && req.body.code, 12);
  if (!token) return res.status(400).json({ error: 'Chybí token změny e-mailu.', reason: 'invalid' });
  if (!code) return res.status(400).json({ error: 'Zadejte ověřovací kód.', reason: 'invalid_code' });
  const state = await getEmailChangeState(token);
  if (!state.ok) {
    fireAudit('auth.change_email.confirm', { req, actor: { email: null }, targetType: 'email-change', targetId: 'email-change', status: 'failed', metadata: { reason: state.reason } });
    return res.status(400).json({
      error:
        state.reason === 'expired' ? 'Odkaz pro zmenu e-mailu vyprsel.' :
        state.reason === 'used' ? 'Odkaz pro zmenu e-mailu uz byl pouzity.' :
        'Odkaz pro zmenu e-mailu je neplatny.',
      reason: state.reason,
    });
  }
  const payload = state.payload;
  if (!payload.newEmail || !payload.verifyCodeHash || !payload.verifyCodeExp) {
    return res.status(400).json({ error: 'Nejdrive zadejte novy e-mail a vyzadejte si overovaci kod.' });
  }
  if (Date.now() > payload.verifyCodeExp) {
    return res.status(400).json({ error: 'Overovaci kod vyprsel. Zadejte si prosim novy.', reason: 'code_expired' });
  }
  if (!code || hashVerificationCode(code) !== payload.verifyCodeHash) {
    fireAudit('auth.change_email.confirm', {
      req,
      actor: { id: payload.userId, email: payload.currentEmail },
      targetType: 'user',
      targetId: payload.userId,
      status: 'failed',
      metadata: { reason: 'invalid_code', newEmail: payload.newEmail },
    });
    return res.status(400).json({ error: 'Overovaci kod neni spravny.', reason: 'invalid_code' });
  }
  const rows = await restSelect(T.users, `id=eq.${encodeURIComponent(payload.userId)}&limit=1`);
  const user = rows && rows[0];
  if (!user) {
    await updateEmailChangeRecord(state.record, { usedAt: new Date().toISOString() });
    return res.json({ ok: true });
  }
  const existingUser = await findUserByEmail(payload.newEmail);
  if (existingUser && String(existingUser.id) !== String(user.id)) {
    return res.status(409).json({ error: 'Tento e-mail uz je registrovany.' });
  }
  await restUpdate(T.users, `id=eq.${user.id}`, { email: payload.newEmail }, { prefer: 'return=minimal' });
  await updateEmailChangeRecord(state.record, {
    usedAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
  });
  const updatedUser = { ...user, email: payload.newEmail };
  setSession(res, updatedUser);
  fireAudit('auth.change_email.confirm', {
    req,
    actor: { id: user.id, email: payload.currentEmail, role: user.role },
    targetType: 'user',
    targetId: user.id,
    status: 'success',
    metadata: { previousEmail: payload.currentEmail, newEmail: payload.newEmail },
  });
  res.json({ ok: true, user: publicUser(updatedUser) });
}));

app.patch('/api/users/me/settings', requireAuth, h(async (req, res) => {
  const settings = req.body && req.body.settings;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return res.status(400).json({ error: 'Chybí settings.' });
  const normalized = {
    chat: !!settings.chat,
    email: !!settings.email,
    requests: !!settings.requests,
    reminders: !!settings.reminders,
  };
  await restUpdate(T.users, `id=eq.${req.session.uid}`, { settings: normalized }, { prefer: 'return=minimal' });
  res.json({ ok: true });
}));

/* profilová fotka uživatele (data URL nebo null pro odebrání) */
app.patch('/api/users/me/photo', requireAuth, h(async (req, res) => {
  let photo = req.body && req.body.photo;
  if (photo === null || photo === '' || photo === undefined) {
    photo = null;
  } else if (typeof photo !== 'string' || !/^data:image\//.test(photo) || photo.length > 3 * 1024 * 1024) {
    return res.status(400).json({ error: 'Neplatná fotka.' });
  }
  await restUpdate(T.users, `id=eq.${req.session.uid}`, { photo }, { prefer: 'return=minimal' });
  // pečovatelce propíšeme fotku i do její veřejné karty (aby ji viděly rodiny ve vyhledávání)
  if (req.session.role === 'caregiver' && req.session.email) {
    try { await restUpdate(T.caregivers, `email=eq.${encodeURIComponent(req.session.email)}`, { photo }, { prefer: 'return=minimal' }); } catch (e) { /* nekritické */ }
  }
  res.json({ ok: true, photo });
}));

/* ---------------- BOOTSTRAP (vše pro render) ---------------- */
app.get('/api/bootstrap', h(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const viewer = !req.session
    ? 'guest'
    : (req.session.role === 'admin' ? 'admin' : (req.session.role === 'caregiver' ? 'caregiver' : 'family'));
  const ownCaregiver = viewer === 'caregiver' ? await currentCaregiverRow(req) : null;
  const [caregivers, orders, requests, schedule, verifications, usersRows, reviews, broadcasts, settings] =
    await Promise.all([
      viewer === 'guest'
        ? restSelect(T.caregivers, 'select=*&verified=eq.true&suspended=eq.false&order=id.asc')
        : restSelect(T.caregivers, 'select=*&order=id.asc'),
      viewer === 'admin'
        ? restSelect(T.orders, 'select=*&order=oid.desc')
        : (viewer === 'family'
          ? restSelect(T.orders, `family_email=eq.${encodeURIComponent(req.session.email)}&order=oid.desc`)
          : []),
      viewer === 'admin'
        ? restSelect(T.requests, 'select=*&order=id.desc')
        : (viewer === 'caregiver' && ownCaregiver
          ? restSelect(T.requests, `cid=eq.${Number(ownCaregiver.id)}&order=id.desc`)
          : []),
      viewer === 'admin'
        ? restSelect(T.schedule, 'select=*&order=date.asc')
        : (viewer === 'caregiver' && ownCaregiver
          ? restSelect(T.schedule, `cid=eq.${Number(ownCaregiver.id)}&order=date.asc`)
          : []),
      viewer === 'admin'
        ? restSelect(T.verifications, 'select=*&order=id.asc')
        : (viewer === 'caregiver'
          ? restSelect(T.verifications, `email=eq.${encodeURIComponent(req.session.email)}&order=id.asc`)
          : []),
      viewer === 'admin'
        ? restSelect(T.users, 'select=id,email,name,role,status,init,joined,orders_count,photo&order=joined.asc')
        : [],
      restSelect(T.reviews, 'select=*&order=id.asc'),
      viewer === 'admin'
        ? restSelect(T.broadcasts, 'select=*&order=id.asc')
        : (req.session
          ? restSelect(T.broadcasts, 'select=*&order=id.asc')
          : []),
      loadPublicSettings(),
    ]);

  // cgReviews: { [caregiverId]: [{init,name,stars,text}] } + obecné recenze (caregiver_id null)
  const cgReviews = {};
  const generalReviews = [];
  (reviews || []).forEach((r) => {
    const row = { init: r.init, name: r.name, stars: r.stars, text: r.text };
    if (r.caregiver_id == null) generalReviews.push(row);
    else (cgReviews[r.caregiver_id] = cgReviews[r.caregiver_id] || []).push(row);
  });

  const caregiversForViewer = (caregivers || []).map((c) => {
    const includePrivate = viewer === 'caregiver' && ownCaregiver && Number(c.id) === Number(ownCaregiver.id);
    return mapCaregiverForViewer(c, { viewer, includePrivate });
  });
  const broadcastsForViewer = (broadcasts || []).filter((b) => {
    if (viewer === 'admin') return true;
    if (!req.session) return false;
    if (b.audience === 'all') return true;
    if (b.audience === 'caregivers') return req.session.role === 'caregiver';
    if (b.audience === 'families') return req.session.role === 'family';
    return b.audience === 'specific' && Array.isArray(b.emails) && b.emails.includes(req.session.email);
  });

  // --- fotky protistran do záznamů (pro avatary v objednávkách/poptávkách/rozvrhu) ---
  const cgPhotoById = {};
  (caregivers || []).forEach((c) => { if (c && c.photo) cgPhotoById[c.id] = c.photo; });
  const famPhotoByEmail = {};
  const oidToEmail = {};
  if (viewer === 'admin') {
    (usersRows || []).forEach((u) => { if (u.photo) famPhotoByEmail[u.email] = u.photo; });
  } else {
    const emails = new Set();
    (orders || []).forEach((o) => { if (o.family_email) { emails.add(o.family_email); oidToEmail[o.oid] = o.family_email; } });
    const reqOids = (requests || []).map((r) => r.oid).filter((x) => x != null && oidToEmail[x] === undefined);
    if (reqOids.length) {
      try {
        const reqOrders = await restSelect(T.orders, `oid=in.(${reqOids.join(',')})&select=oid,family_email`);
        (reqOrders || []).forEach((o) => { if (o.family_email) { emails.add(o.family_email); oidToEmail[o.oid] = o.family_email; } });
      } catch (e) { /* fotky nejsou kritické */ }
    }
    if (emails.size) {
      const list = [...emails].map((e) => `"${e}"`).join(',');
      try {
        const rows = await restSelect(T.users, `email=in.(${list})&select=email,photo`);
        (rows || []).forEach((u) => { if (u.photo) famPhotoByEmail[u.email] = u.photo; });
      } catch (e) { /* fotky nejsou kritické */ }
    }
  }
  const famPhotoByName = {};
  (orders || []).forEach((o) => { const p = o.family_email && famPhotoByEmail[o.family_email]; if (p && o.fam_name) famPhotoByName[o.fam_name] = p; });

  res.json({
    caregivers: caregiversForViewer,
    orders: (orders || []).map((o) => ({ ...mapOrder(o), cgPhoto: cgPhotoById[o.cid] || null, famPhoto: famPhotoByEmail[o.family_email] || null })),
    requests: (requests || []).map((r) => ({ ...mapRequest(r), photo: (oidToEmail[r.oid] && famPhotoByEmail[oidToEmail[r.oid]]) || famPhotoByName[r.fam] || null })),
    schedule: (schedule || []).map((s) => ({ id: s.id, cid: s.cid, fam: s.fam, init: s.init, service: s.service, date: s.date, time: s.time, hours: s.hours, photo: famPhotoByName[s.fam] || null })),
    verifications: (verifications || []).map(mapVerification),
    users: (usersRows || []).map((u) => ({ id: u.id, name: u.name, email: u.email, init: u.init, joined: u.joined, orders: u.orders_count, status: u.status, role: u.role, photo: u.photo || null })),
    cgReviews, generalReviews,
    conversations: [],
    broadcasts: broadcastsForViewer.map((b) => ({ id: b.id, audience: b.audience, emails: viewer === 'admin' ? (b.emails || []) : [], text: b.text, date: b.date, t: b.t })),
    planPrices: settings.planPrices || { start: 190, premium: 390 },
    socialLinks: settings.socialLinks || { facebook: '', instagram: '' },
    settings,
  });
}));

/* ---------------- OBJEDNÁVKY / POPTÁVKY ---------------- */
// rodina vytvoří objednávku + propojenou poptávku pro pečovatelku
app.post('/api/orders', requireRole('family', 'admin'), h(async (req, res) => {
  const b = req.body || {};
  const cid = Number(b.cid);
  const service = trimmedString(b.service, 40);
  const date = trimmedString(b.date, 10);
  const time = trimmedString(b.time, 5);
  const addr = trimmedString(b.addr, 250);
  const note = trimmedString(b.note, 2000);
  const hours = Number(b.hours == null ? 1 : b.hours);
  const km = Number(b.km == null ? 0 : b.km);
  if (!Number.isInteger(cid) || cid <= 0 || !service || !date || !time || !addr) {
    return res.status(400).json({ error: 'Neúplná objednávka.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Neplatné datum objednávky.' });
  if (!/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ error: 'Neplatný čas objednávky.' });
  if (!Number.isInteger(hours) || hours < 1 || hours > 24) return res.status(400).json({ error: 'Neplatná délka péče.' });
  if (!Number.isFinite(km) || km < 0 || km > 1000) return res.status(400).json({ error: 'Neplatná vzdálenost.' });
  const oid = await nextId(T.orders, 'oid');
  const famName = trimmedString(req.session.name || b.famName || 'Rodina', 120) || 'Rodina';
  let caregiverName = '';
  const caregiverRows = await restSelect(T.caregivers, `id=eq.${cid}&select=id,name,verified,suspended&limit=1`);
  if (caregiverRows && caregiverRows[0]) caregiverName = caregiverRows[0].name || '';
  const caregiver = caregiverRows && caregiverRows[0];
  if (!caregiver) return res.status(404).json({ error: 'Pečovatelka nebyla nalezena.' });
  if (caregiver.suspended || caregiver.verified === false) return res.status(400).json({ error: 'Pečovatelka není aktuálně dostupná.' });
  const order = await restInsert(T.orders, {
    oid, cid, family_email: req.session.email, fam_name: famName,
    service, hours, date, time, addr,
    note, km, status: 'pending',
  });
  const reqId = await nextId(T.requests, 'id');
  const init = (famName.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2) || 'Z').toUpperCase();
  await restInsert(T.requests, {
    id: reqId, oid, cid, fam: famName, init,
    service, date, time, hours, addr,
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
  const current = await restSelect(T.orders, `oid=eq.${Number(req.params.oid)}&limit=1`);
  const order = current && current[0];
  if (!order) return res.status(404).json({ error: 'Objednávka nenalezena.' });
  const isAdmin = req.session && req.session.role === 'admin';
  if (!isAdmin && String(order.family_email || '').toLowerCase() !== String(req.session.email || '').toLowerCase()) {
    return res.status(403).json({ error: 'Tuto objednávku nemůžete upravit.' });
  }
  const rows = await restUpdate(T.orders, `oid=eq.${Number(req.params.oid)}`, { status });
  res.json({ order: rows && rows[0] ? mapOrder(rows[0]) : null });
}));

// pošle rodině e-mail o přijetí/odmítnutí objednávky (podle poptávky r)
async function notifyOrderStatus(r, accepted) {
  try {
    if (!r || r.oid == null) return;
    const orders = await restSelect(T.orders, `oid=eq.${r.oid}&select=family_email,fam_name,service,date,time&limit=1`);
    const ord = orders && orders[0];
    if (!ord || !ord.family_email) return;
    let caregiverName = '';
    if (r.cid != null) {
      const cgs = await restSelect(T.caregivers, `id=eq.${r.cid}&select=name&limit=1`);
      caregiverName = (cgs && cgs[0] && cgs[0].name) || '';
    }
    const order = { service: r.service || ord.service, date: r.date || ord.date, time: r.time || ord.time };
    await sendMailSafe({ to: ord.family_email, ...orderStatusMail({ familyName: ord.fam_name, order, caregiverName, accepted }) });
  } catch (e) { console.error('[mail] notifyOrderStatus:', e.message); }
}

// pečovatelka přijme poptávku → objednávka confirmed, vznikne schedule, poptávka zmizí
app.post('/api/requests/:id/accept', requireRole('caregiver', 'admin'), h(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await restSelect(T.requests, `id=eq.${id}&limit=1`);
  const r = rows && rows[0];
  if (!r) return res.status(404).json({ error: 'Poptávka nenalezena.' });
  if (req.session.role !== 'admin') {
    const ownCaregiver = await currentCaregiverRow(req);
    if (!ownCaregiver || Number(r.cid) !== Number(ownCaregiver.id)) {
      return res.status(403).json({ error: 'Tuto poptávku nemůžete přijmout.' });
    }
  }
  if (r.oid != null) await restUpdate(T.orders, `oid=eq.${r.oid}`, { status: 'confirmed' }, { prefer: 'return=minimal' });
  await restInsert(T.schedule, { cid: r.cid, fam: r.fam, init: r.init, service: r.service, date: r.date, time: r.time, hours: r.hours }, { prefer: 'return=minimal' });
  await restDelete(T.requests, `id=eq.${id}`);
  await notifyOrderStatus(r, true);
  res.json({ ok: true });
}));

// pečovatelka odmítne poptávku → objednávka declined, poptávka zmizí
app.post('/api/requests/:id/decline', requireRole('caregiver', 'admin'), h(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await restSelect(T.requests, `id=eq.${id}&limit=1`);
  const r = rows && rows[0];
  if (!r) return res.status(404).json({ error: 'Poptávka nenalezena.' });
  if (req.session.role !== 'admin') {
    const ownCaregiver = await currentCaregiverRow(req);
    if (!ownCaregiver || Number(r.cid) !== Number(ownCaregiver.id)) {
      return res.status(403).json({ error: 'Tuto poptávku nemůžete odmítnout.' });
    }
  }
  if (r.oid != null) await restUpdate(T.orders, `oid=eq.${r.oid}`, { status: 'declined' }, { prefer: 'return=minimal' });
  await restDelete(T.requests, `id=eq.${id}`);
  await notifyOrderStatus(r, false);
  res.json({ ok: true });
}));

/* ---------------- OVĚŘENÍ ---------------- */
// pečovatelka podá žádost o ověření
app.post('/api/verifications', requireRole('caregiver', 'admin'), h(async (req, res) => {
  const b = req.body || {};
  const name = trimmedString(b.name, 120);
  const email = trimmedString(req.session.role === 'admin' ? (b.email || req.session.email) : req.session.email, 320).toLowerCase();
  const init = trimmedString(b.init, 4).toUpperCase();
  const loc = trimmedString(b.loc, 120);
  const rate = Number(b.rate);
  const exp = Number(b.exp);
  const phone = trimmedString(b.phone, 40);
  const docType = trimmedString(b.docType, 40);
  const docNum = trimmedString(b.docNum, 80);
  const idFront = trimmedString(b.idFront, 2 * 1024 * 1024);
  const idBack = trimmedString(b.idBack, 2 * 1024 * 1024);
  const selfie = trimmedString(b.selfie, 2 * 1024 * 1024);
  const services = Array.isArray(b.services) ? b.services.map((item) => trimmedString(item, 40)).filter(Boolean) : [];
  const rawCertifications = Array.isArray(b.certifications) ? b.certifications : [];
  const certifications = rawCertifications.map((item) => ({
    name: trimmedString(item && item.name, 120),
    issuer: trimmedString(item && item.issuer, 120),
    validUntil: trimmedString(item && item.validUntil, 10),
    fileName: trimmedString(item && item.fileName, 180),
  })).filter((item) => item.name || item.issuer || item.validUntil);
  const firstCert = certifications[0] || null;
  const cert = trimmedString(b.cert, 120) || (firstCert ? firstCert.name : '');
  const issuer = trimmedString(b.issuer, 120) || (firstCert ? firstCert.issuer : '');
  const validUntil = trimmedString(b.validUntil, 10) || (firstCert ? firstCert.validUntil : '');
  const fileName = trimmedString(b.fileName, 180);
  const refs = trimmedString(b.refs, 1000);
  const note = trimmedString(b.note, 1600);
  const bio = trimmedString(b.bio, 4000);
  if (!name || name.split(/\s+/).filter(Boolean).length < 2) return res.status(400).json({ error: 'Zadejte celé jméno a příjmení.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Neplatný e-mail pečovatelky.' });
  if (!loc) return res.status(400).json({ error: 'Chybí lokalita pečovatelky.' });
  if (!Number.isFinite(rate) || rate < 0 || rate > 100000) return res.status(400).json({ error: 'Neplatná hodinová sazba.' });
  if (!Number.isInteger(exp) || exp < 0 || exp > 80) return res.status(400).json({ error: 'Neplatná délka praxe.' });
  if (!phone) return res.status(400).json({ error: 'Chybí telefonní číslo.' });
  if (!docType || !docNum) return res.status(400).json({ error: 'Chybí údaje o dokladu totožnosti.' });
  if (!idFront || !idBack || !selfie) return res.status(400).json({ error: 'Chybí ověřovací fotografie.' });
  if (!services.length || services.length > 20) return res.status(400).json({ error: 'Vyberte alespoň jednu službu.' });
  if (!certifications.length && (!cert || !issuer)) return res.status(400).json({ error: 'Chybí údaje o osvědčení.' });
  if (certifications.some((item) => !item.name || !item.issuer)) return res.status(400).json({ error: 'Každé osvědčení musí mít název i instituci.' });
  if (certifications.some((item) => item.validUntil && !/^\d{4}-\d{2}-\d{2}$/.test(item.validUntil))) return res.status(400).json({ error: 'Neplatná platnost osvědčení.' });
  if (validUntil && !/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) return res.status(400).json({ error: 'Neplatná platnost osvědčení.' });
  if ((!certifications.length && !fileName) || certifications.some((item) => !item.fileName)) return res.status(400).json({ error: 'Chybí název nahraného dokladu.' });
  const storedNote = certifications.length > 1
    ? `${note}${note ? `\n${VERIFY_CERTS_MARKER}` : VERIFY_CERTS_MARKER}${JSON.stringify(certifications)}`
    : note;
  const files = sanitizeVerificationFiles(b.files);
  const id = await nextId(T.verifications, 'id');
  const row = await restInsert(T.verifications, {
    id, name, email, init, loc, rate, exp,
    phone, doc_type: docType, doc_num: docNum, id_front: idFront, id_back: idBack, selfie,
    services, cert, issuer, valid_until: validUntil, file_name: fileName,
    refs, note: storedNote, bio, files, status: 'submitted', date: new Date().toISOString().slice(0, 10),
  });
  res.json({ verification: mapVerification(row) });
}));

/* ověřená pečovatelka přidá další osvědčení → nová žádost ke schválení (identita převzata z poslední žádosti) */
app.post('/api/certifications', requireRole('caregiver', 'admin'), h(async (req, res) => {
  const email = trimmedString(req.session.role === 'admin' ? (req.body && req.body.email) || req.session.email : req.session.email, 320).toLowerCase();
  const b = req.body || {};
  const name = trimmedString(b.name, 120);
  const issuer = trimmedString(b.issuer, 120);
  const validUntil = trimmedString(b.validUntil, 10);
  const fileName = trimmedString(b.fileName, 180);
  const fileData = sanitizeFileDataUrl(b.fileData);
  if (!name) return res.status(400).json({ error: 'Zadejte název osvědčení.' });
  if (!issuer) return res.status(400).json({ error: 'Zadejte instituci, která osvědčení vystavila.' });
  if (validUntil && !/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) return res.status(400).json({ error: 'Neplatná platnost osvědčení.' });
  if (!fileName || !fileData) return res.status(400).json({ error: 'Nahrajte doklad k osvědčení.' });
  const pend = await restSelect(T.verifications, `email=eq.${encodeURIComponent(email)}&status=eq.submitted&limit=1`);
  if (pend && pend[0]) return res.status(409).json({ error: 'Už máte žádost čekající na schválení.' });
  const baseRows = await restSelect(T.verifications, `email=eq.${encodeURIComponent(email)}&order=id.desc&limit=1`);
  const base = (baseRows && baseRows[0]) || {};
  const baseFiles = (base.files && typeof base.files === 'object' && !Array.isArray(base.files)) ? base.files : {};
  const files = {};
  ['idfront', 'idback', 'selfie'].forEach((k) => { if (baseFiles[k]) files[k] = baseFiles[k]; });
  files.doc = fileData;
  const id = await nextId(T.verifications, 'id');
  const row = await restInsert(T.verifications, {
    id, email,
    name: base.name || '', init: base.init || '', loc: base.loc || '', rate: base.rate || 0, exp: base.exp || 0,
    phone: base.phone || '', doc_type: base.doc_type || '', doc_num: base.doc_num || '',
    id_front: base.id_front || '', id_back: base.id_back || '', selfie: base.selfie || '',
    services: base.services || [], cert: name, issuer, valid_until: validUntil, file_name: fileName,
    refs: '', note: 'Doplnění osvědčení', bio: base.bio || '', files, status: 'submitted',
    date: new Date().toISOString().slice(0, 10),
  });
  res.json({ verification: mapVerification(row) });
}));

/* admin si stáhne přílohy žádosti (data URL) — nedávají se do bootstrapu kvůli velikosti */
app.get('/api/verifications/:id/files', requireAuth, h(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await restSelect(T.verifications, `id=eq.${id}&select=files,email&limit=1`);
  const row = rows && rows[0];
  if (!row) return res.status(404).json({ error: 'Žádost nenalezena.' });
  // přístup má admin, nebo pečovatelka ke svým vlastním přílohám
  const isOwner = req.session.role === 'caregiver' && (row.email || '').toLowerCase() === (req.session.email || '').toLowerCase();
  if (req.session.role !== 'admin' && !isOwner) return res.status(403).json({ error: 'Nemáte oprávnění.' });
  res.setHeader('Cache-Control', 'no-store');
  res.json({ files: row.files || {} });
}));

/* lehký seznam žádostí pro admin (bez příloh) — pro automatické obnovení stránky */
app.get('/api/verifications', requireRole('admin'), h(async (req, res) => {
  const cols = 'id,name,email,init,loc,rate,exp,phone,doc_type,doc_num,id_front,id_back,selfie,services,cert,issuer,valid_until,file_name,refs,note,bio,status,date,reason';
  const rows = await restSelect(T.verifications, `select=${cols}&order=id.asc`);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ verifications: (rows || []).map(mapVerification) });
}));

// admin schválí žádost → vytvoří/aktualizuje pečovatelku (verified), žádost approved
app.post('/api/verifications/:id/approve', requireRole('admin'), h(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await restSelect(T.verifications, `id=eq.${id}&limit=1`);
  const v = rows && rows[0];
  if (!v) return res.status(404).json({ error: 'Žádost nenalezena.' });
  // existuje už pečovatelka s tímto e-mailem? + profilová fotka z uživatele
  let cg = null;
  if (v.email) { const ex = await restSelect(T.caregivers, `email=eq.${encodeURIComponent(v.email)}&limit=1`); cg = ex && ex[0]; }
  let userId = null, userPhoto = null;
  if (v.email) { const uref = await restSelect(T.users, `email=eq.${encodeURIComponent(v.email)}&limit=1`); if (uref && uref[0]) { userId = uref[0].id; userPhoto = uref[0].photo || null; } }
  const data = {
    email: v.email, name: v.name, init: v.init, loc: v.loc, rate: v.rate, exp: v.exp,
    services: v.services || [], verified: true, id_verified: true, status: 'verified', suspended: false,
    bio: v.bio, cert: !!v.cert,
    ...(userPhoto ? { photo: userPhoto } : {}),
  };
  if (cg) {
    await restUpdate(T.caregivers, `id=eq.${cg.id}`, data, { prefer: 'return=minimal' });
  } else {
    const newId = await nextId(T.caregivers, 'id');
    await restInsert(T.caregivers, { id: newId, user_id: userId, public_id: genPublicId(), ...data, rating: 0, reviews: 0, plan: 'start', langs: ['Čeština'], price_type: 'hod', day_rate: (v.rate || 0) * 8, radius: 10, km_price: 0 }, { prefer: 'return=minimal' });
  }
  await restUpdate(T.verifications, `id=eq.${id}`, { status: 'approved' }, { prefer: 'return=minimal' });
  if (v.email) await sendMailSafe({ to: v.email, ...verificationResultMail({ name: v.name, approved: true }) });
  fireAudit('admin.verification.approve', { req, actor: auditActor(req), targetType: 'verification', targetId: id, status: 'success', metadata: { email: v.email || null, caregiverExists: !!cg } });
  res.json({ ok: true });
}));

// admin zamítne žádost
app.post('/api/verifications/:id/reject', requireRole('admin'), h(async (req, res) => {
  const id = Number(req.params.id);
  const reason = trimmedString(req.body && req.body.reason, 1000);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Neplatné ID žádosti.' });
  const rows = await restSelect(T.verifications, `id=eq.${id}&select=email,name&limit=1`);
  const v = rows && rows[0];
  if (!v) return res.status(404).json({ error: 'Žádost nenalezena.' });
  await restUpdate(T.verifications, `id=eq.${id}`, { status: 'rejected', reason: reason || null }, { prefer: 'return=minimal' });
  if (v && v.email) await sendMailSafe({ to: v.email, ...verificationResultMail({ name: v.name, approved: false, reason }) });
  fireAudit('admin.verification.reject', { req, actor: auditActor(req), targetType: 'verification', targetId: id, status: 'success', metadata: { email: v && v.email || null, reason: reason ? 'provided' : 'empty' } });
  res.json({ ok: true });
}));

/* ---------------- RECENZE ---------------- */
app.post('/api/reviews', requireAuth, h(async (req, res) => {
  const b = req.body || {};
  const caregiverId = Number(b.caregiverId);
  const stars = Number(b.stars);
  const init = trimmedString(b.init || (req.session.name || '').split(/\s+/).map((p) => p[0]).join('').slice(0, 2), 4).toUpperCase();
  const name = trimmedString(b.name || req.session.name, 120);
  const text = trimmedString(b.text, 2000);
  if (!Number.isInteger(caregiverId) || caregiverId <= 0 || !Number.isInteger(stars)) return res.status(400).json({ error: 'Neúplná recenze.' });
  if (stars < 1 || stars > 5) return res.status(400).json({ error: 'Neplatné hodnocení.' });
  if (!name || text.length < 3) return res.status(400).json({ error: 'Recenze je příliš krátká.' });
  const caregiverRows = await restSelect(T.caregivers, `id=eq.${caregiverId}&select=id&limit=1`);
  if (!caregiverRows || !caregiverRows[0]) return res.status(404).json({ error: 'Pečovatelka nebyla nalezena.' });
  await restInsert(T.reviews, { caregiver_id: caregiverId, init, name, stars, text }, { prefer: 'return=minimal' });
  res.json({ ok: true });
}));

/* ---------------- CHAT (reálný oboustranný) ---------------- */
function conversationPairKey(a, b) { return [String(a), String(b)].sort().join('|'); }

// obrázek v chatu jako data URL (jen obrázky, s limitem velikosti)
function sanitizeChatImage(v) {
  const s = typeof v === 'string' ? v : '';
  if (!s) return null;
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)) return null;
  if (s.length > 8 * 1024 * 1024) return null; // ~6 MB obrázek
  return s;
}
async function loadConversationMessages(convId, me) {
  const rows = await restSelect(T.messages, `conversation_id=eq.${Number(convId)}&order=created_at.asc&select=id,sender_id,text,image,t,created_at`);
  return (rows || []).map((m) => ({
    id: Number(m.id), me: String(m.sender_id || '') === String(me),
    text: m.text, image: m.image || null, t: m.t || '', createdAt: m.created_at,
  }));
}
async function countConversationUnread(convId, me, readAt) {
  let q = `conversation_id=eq.${Number(convId)}&sender_id=neq.${encodeURIComponent(me)}&select=id&limit=500`;
  if (readAt) q += `&created_at=gt.${encodeURIComponent(readAt)}`;
  const rows = await restSelect(T.messages, q);
  return rows ? rows.length : 0;
}
// konverzace z pohledu daného uživatele — zobrazí druhou stranu
async function mapConversationForViewer(conv, me) {
  const otherId = String(conv.user_a) === String(me) ? conv.user_b : conv.user_a;
  const u = (await restSelect(T.users, `id=eq.${encodeURIComponent(otherId)}&select=name,init,photo,role,public_id&limit=1`))[0] || {};
  // token pro veřejný profil: u pečovatelky ten z její karty (→ plný profil), jinak účtový
  let profileToken = u.public_id || null;
  if ((u.role || '') === 'caregiver') {
    const cg = (await restSelect(T.caregivers, `user_id=eq.${encodeURIComponent(otherId)}&select=public_id&limit=1`))[0];
    if (cg && cg.public_id) profileToken = cg.public_id;
  }
  const myReadAt = String(conv.user_a) === String(me) ? conv.a_read_at : conv.b_read_at;
  return {
    id: Number(conv.id), name: u.name || 'Uživatel', init: u.init || '', photo: u.photo || null,
    role: u.role || 'family', profileToken, last: conv.last_text || '', lastAt: conv.last_at || null,
    unread: await countConversationUnread(conv.id, me, myReadAt),
  };
}
async function resolveCounterpartUserId(b) {
  if (b.caregiverId != null) {
    const cgs = await restSelect(T.caregivers, `id=eq.${Number(b.caregiverId)}&select=user_id&limit=1`);
    return cgs && cgs[0] ? cgs[0].user_id : null;
  }
  if (b.email) { const u = await findUserByEmail(b.email); return u ? u.id : null; }
  if (b.name) {
    const name = trimmedString(b.name, 120);
    const role = trimmedString(b.role, 20) || 'caregiver';
    if (role === 'caregiver') {
      const cgs = await restSelect(T.caregivers, `name=eq.${encodeURIComponent(name)}&select=user_id&limit=1`);
      return cgs && cgs[0] ? cgs[0].user_id : null;
    }
    const u = await restSelect(T.users, `name=eq.${encodeURIComponent(name)}&role=eq.${encodeURIComponent(role)}&select=id&limit=1`);
    return u && u[0] ? u[0].id : null;
  }
  return null;
}

// seznam konverzací přihlášeného uživatele
app.get('/api/conversations', requireAuth, h(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const me = String(req.session.uid || '');
  if (!me) return res.json({ conversations: [] });
  const rows = await restSelect(T.conversations, `or=(user_a.eq.${encodeURIComponent(me)},user_b.eq.${encodeURIComponent(me)})&order=last_at.desc.nullslast&select=*`);
  const out = [];
  for (const conv of rows || []) out.push(await mapConversationForViewer(conv, me));
  res.json({ conversations: out });
}));

// založ (nebo najdi) konverzaci s protistranou
app.post('/api/conversations', requireAuth, h(async (req, res) => {
  const b = req.body || {};
  const me = String(req.session.uid || '');
  if (!me) return res.status(401).json({ error: 'Nepřihlášeno.' });
  const other = await resolveCounterpartUserId(b);
  if (!other) return res.status(404).json({ error: 'Protistrana nebyla nalezena.' });
  if (String(other) === me) return res.status(400).json({ error: 'Nelze psát sám sobě.' });
  const key = conversationPairKey(me, other);
  let rows = await restSelect(T.conversations, `pair_key=eq.${encodeURIComponent(key)}&select=*&limit=1`);
  let conv = rows && rows[0];
  if (!conv) {
    const id = await nextId(T.conversations, 'id');
    conv = await restInsert(T.conversations, { id, user_a: me, user_b: String(other), pair_key: key, created_at: new Date().toISOString() });
  }
  const mapped = await mapConversationForViewer(conv, me);
  mapped.msgs = await loadConversationMessages(conv.id, me);
  res.json({ conversation: mapped });
}));

// zprávy konverzace + označení jako přečtené
app.get('/api/conversations/:id/messages', requireAuth, requireConversationParticipant, h(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const me = String(req.session.uid || '');
  const conv = req.conversation;
  const msgs = await loadConversationMessages(conv.id, me);
  const col = String(conv.user_a) === me ? 'a_read_at' : 'b_read_at';
  await restUpdate(T.conversations, `id=eq.${conv.id}`, { [col]: new Date().toISOString() }, { prefer: 'return=minimal' }).catch(() => {});
  res.json({ messages: msgs });
}));

// odeslání zprávy
app.post('/api/conversations/:id/messages', requireAuth, requireConversationParticipant, h(async (req, res) => {
  const b = req.body || {};
  const me = String(req.session.uid || '');
  const conv = req.conversation;
  const text = String(b.text || '').trim();
  const image = sanitizeChatImage(b.image);
  if (b.image && !image) return res.status(400).json({ error: 'Neplatný nebo příliš velký obrázek.' });
  if (!text && !image) return res.status(400).json({ error: 'Chybí text zprávy.' });
  if (text.length > 2000) return res.status(400).json({ error: 'Zpráva je příliš dlouhá.' });
  const t = trimmedString(b.t, 20);
  const now = new Date().toISOString();
  const row = await restInsert(T.messages, { conversation_id: conv.id, sender_id: me, mine: true, text, image, t: t || '', created_at: now });
  const preview = text || (image ? '📷 Obrázek' : '');
  const col = String(conv.user_a) === me ? 'a_read_at' : 'b_read_at';
  await restUpdate(T.conversations, `id=eq.${conv.id}`, { last_text: preview, last_at: now, [col]: now }, { prefer: 'return=minimal' }).catch(() => {});
  const msgOut = { id: Number(row.id), me: true, text, image: image || null, t: t || '', createdAt: now };
  // realtime: pushni zprávu protistraně (pro ni me:false)
  const other = String(conv.user_a) === me ? conv.user_b : conv.user_a;
  emitToUser(other, { type: 'message', conversationId: Number(conv.id), message: Object.assign({}, msgOut, { me: false }) });
  res.json({ message: msgOut });
}));

/* ---------------- REALTIME (SSE) ---------------- */
// registr živých spojení: userId -> Set<res>
const sseClients = new Map();
function userOnline(userId) { const s = sseClients.get(String(userId)); return !!(s && s.size); }
function sseSend(userId, payload) {
  const set = sseClients.get(String(userId));
  if (!set || !set.size) return;
  const data = 'data: ' + JSON.stringify(payload) + '\n\n';
  for (const res of set) { try { res.write(data); } catch (e) { /* mrtvé spojení */ } }
}
function bumpLastSeen(userId) {
  restUpdate(T.users, `id=eq.${encodeURIComponent(userId)}`, { last_seen: new Date().toISOString() }, { prefer: 'return=minimal' }).catch(() => {});
}

// --- cross-replika fan-out přes Supabase Realtime Broadcast ---
// Na jedné replice doručuje jen lokálně; při víc replikách si přes sdílený
// kanál řeknou navzájem, ať doručí i spojení připojená na jiné replice.
const INSTANCE_ID = crypto.randomBytes(8).toString('hex');
let rtChannel = null, rtReady = false;
(function initRealtimeBus() {
  let createClient = null;
  try { ({ createClient } = require('@supabase/supabase-js')); }
  catch (e) { console.warn('[realtime] @supabase/supabase-js není nainstalováno — fan-out jede jen v rámci jedné instance.'); return; }
  if (!REST_ENABLED) return;
  try {
    const rt = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    rtChannel = rt.channel('zv-fanout', { config: { broadcast: { self: false, ack: false } } });
    rtChannel.on('broadcast', { event: 'fanout' }, (msg) => {
      const p = msg && msg.payload;
      if (!p || p.instance === INSTANCE_ID) return; // vlastní ozvěnu ignoruj
      sseSend(p.userId, p.data); // doruč spojením na TÉTO replice
    });
    rtChannel.subscribe((status) => {
      rtReady = status === 'SUBSCRIBED';
      if (rtReady) console.log('[realtime] fan-out kanál připojen (instance ' + INSTANCE_ID + ')');
    });
  } catch (e) { console.error('[realtime] init selhal:', e.message); rtChannel = null; rtReady = false; }
})();
// doruč událost uživateli: lokálně + (je-li víc replik) ostatním replikám
function emitToUser(userId, payload) {
  sseSend(userId, payload);
  if (rtChannel && rtReady) {
    try { rtChannel.send({ type: 'broadcast', event: 'fanout', payload: { instance: INSTANCE_ID, userId: String(userId), data: payload } }); } catch (e) {}
  }
}

// oznam protistranám konverzací, že userId je online/offline
async function broadcastPresence(userId, online) {
  let rows;
  try { rows = await restSelect(T.conversations, `or=(user_a.eq.${encodeURIComponent(userId)},user_b.eq.${encodeURIComponent(userId)})&select=id,user_a,user_b`); } catch (e) { return; }
  const now = new Date().toISOString();
  for (const conv of rows || []) {
    const other = String(conv.user_a) === String(userId) ? conv.user_b : conv.user_a;
    emitToUser(other, { type: 'presence', conversationId: Number(conv.id), online, lastSeen: online ? null : now, secondsAgo: 0 });
  }
}
// stream událostí pro přihlášeného uživatele
app.get('/api/stream', requireAuth, (req, res) => {
  const uid = String(req.session.uid || '');
  if (!uid) return res.status(401).end();
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(':ok\n\n');
  let set = sseClients.get(uid);
  const wasOffline = !set || set.size === 0;
  if (!set) { set = new Set(); sseClients.set(uid, set); }
  set.add(res);
  const hb = setInterval(() => { try { res.write(':hb\n\n'); } catch (e) {} }, 25000);
  bumpLastSeen(uid);
  if (wasOffline) broadcastPresence(uid, true);
  req.on('close', () => {
    clearInterval(hb);
    const s = sseClients.get(uid);
    if (!s) return;
    s.delete(res);
    if (s.size === 0) { sseClients.delete(uid); bumpLastSeen(uid); broadcastPresence(uid, false); }
  });
});
// indikátor psaní → protistraně
app.post('/api/conversations/:id/typing', requireAuth, requireConversationParticipant, h(async (req, res) => {
  const me = String(req.session.uid || '');
  const conv = req.conversation;
  const other = String(conv.user_a) === me ? conv.user_b : conv.user_a;
  emitToUser(other, { type: 'typing', conversationId: Number(conv.id), on: !!(req.body && req.body.on) });
  res.json({ ok: true });
}));
// označ konverzaci jako přečtenou
app.post('/api/conversations/:id/read', requireAuth, requireConversationParticipant, h(async (req, res) => {
  const me = String(req.session.uid || '');
  const conv = req.conversation;
  const col = String(conv.user_a) === me ? 'a_read_at' : 'b_read_at';
  await restUpdate(T.conversations, `id=eq.${conv.id}`, { [col]: new Date().toISOString() }, { prefer: 'return=minimal' }).catch(() => {});
  res.json({ ok: true });
}));

/* ---------------- BROADCAST (admin) ---------------- */
app.post('/api/broadcasts', requireRole('admin'), h(async (req, res) => {
  const b = req.body || {};
  const audience = trimmedString(b.audience, 20);
  if (!['all', 'caregivers', 'families', 'specific'].includes(audience)) {
    return res.status(400).json({ error: 'Neplatná cílová skupina broadcastu.' });
  }
  const text = trimmedString(b.text, 5000);
  if (!text) return res.status(400).json({ error: 'Chybí text zprávy.' });
  const emails = audience === 'specific' ? normalizeEmailList(b.emails, { maxItems: 500 }) : [];
  if (audience === 'specific' && (!emails || !emails.length)) {
    return res.status(400).json({ error: 'Vyberte alespoň jednoho příjemce.' });
  }
  if (audience !== 'specific' && Array.isArray(b.emails) && b.emails.length) {
    return res.status(400).json({ error: 'Seznam příjemců lze zadat jen pro konkrétní adresy.' });
  }
  const sentAt = trimmedString(b.t, 20);
  const row = await restInsert(T.broadcasts, {
    audience, emails, text,
    date: new Date().toISOString().slice(0, 10), t: sentAt || '',
  });
  fireAudit('admin.broadcast.create', { req, actor: auditActor(req), targetType: 'broadcast', targetId: row.id, status: 'success', metadata: { audience: row.audience, emailsCount: Array.isArray(row.emails) ? row.emails.length : 0 } });
  res.json({ broadcast: { id: row.id, audience: row.audience, emails: row.emails || [], text: row.text, date: row.date, t: row.t } });
}));

/* ---------------- PEČOVATELKA: profil / tarif / pozastavení ---------------- */
app.patch('/api/caregivers/:id', requireAuth, h(async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const isAdmin = req.session && req.session.role === 'admin';
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Neplatné ID pečovatelky.' });
  if (!isAdmin) {
    const ownCaregiver = await currentCaregiverRow(req);
    if (!ownCaregiver || Number(ownCaregiver.id) !== id) {
      return res.status(403).json({ error: 'Tento profil nemůžete upravit.' });
    }
  }
  const patch = {};
  // jen povolená pole
  const map = { name: 'name', loc: 'loc', rate: 'rate', exp: 'exp', bio: 'bio', services: 'services', langs: 'langs',
    plan: 'plan', priceType: 'price_type', dayRate: 'day_rate', radius: 'radius', kmPrice: 'km_price',
    photo: 'photo', avail: 'avail', suspended: 'suspended', status: 'status' };
  for (const k in map) if (b[k] !== undefined) patch[map[k]] = b[k];
  // pozastavení / mazání smí jen admin
  if ((b.suspended !== undefined || b.status !== undefined) && !isAdmin) {
    return res.status(403).json({ error: 'Pozastavení smí jen správce.' });
  }
  // PREMIUM smí nastavit jen správce (jinak přes platbu); pečovatelka smí max. downgrade na START
  if (b.plan !== undefined && !isAdmin && String(b.plan) !== 'start') {
    return res.status(403).json({ error: 'PREMIUM lze aktivovat jen přes platbu.' });
  }
  if (patch.name !== undefined) patch.name = trimmedString(patch.name, 120);
  if (patch.loc !== undefined) patch.loc = trimmedString(patch.loc, 120);
  if (patch.bio !== undefined) patch.bio = trimmedString(patch.bio, 4000);
  if (patch.photo !== undefined) patch.photo = patch.photo == null ? null : trimmedString(patch.photo, 2 * 1024 * 1024);
  if (patch.price_type !== undefined && !['hod', 'den', 'indiv'].includes(String(patch.price_type))) {
    return res.status(400).json({ error: 'Neplatný typ ceny.' });
  }
  if (patch.plan !== undefined && !ADMIN_UPDATABLE_CAREGIVER_PLANS.has(String(patch.plan))) {
    return res.status(400).json({ error: 'Neplatný tarif pečovatelky.' });
  }
  // změna tarifu → odpovídající stav předplatného
  if (patch.plan !== undefined) patch.plan_status = patch.plan === 'premium' ? 'active' : 'canceled';
  if (patch.status !== undefined && !ADMIN_UPDATABLE_CAREGIVER_STATUSES.has(String(patch.status))) {
    return res.status(400).json({ error: 'Neplatný stav pečovatelky.' });
  }
  if (patch.suspended !== undefined && typeof patch.suspended !== 'boolean') {
    return res.status(400).json({ error: 'Neplatná hodnota pozastavení.' });
  }
  if (patch.rate !== undefined) {
    patch.rate = Number(patch.rate);
    if (!Number.isFinite(patch.rate) || patch.rate < 0 || patch.rate > 100000) return res.status(400).json({ error: 'Neplatná hodinová sazba.' });
  }
  if (patch.exp !== undefined) {
    patch.exp = Number(patch.exp);
    if (!Number.isInteger(patch.exp) || patch.exp < 0 || patch.exp > 80) return res.status(400).json({ error: 'Neplatná délka praxe.' });
  }
  if (patch.day_rate !== undefined) {
    patch.day_rate = Number(patch.day_rate);
    if (!Number.isFinite(patch.day_rate) || patch.day_rate < 0 || patch.day_rate > 1000000) return res.status(400).json({ error: 'Neplatná denní sazba.' });
  }
  if (patch.radius !== undefined) {
    patch.radius = Number(patch.radius);
    if (!Number.isFinite(patch.radius) || patch.radius < 0 || patch.radius > 5000) return res.status(400).json({ error: 'Neplatný dojezd.' });
  }
  if (patch.km_price !== undefined) {
    patch.km_price = Number(patch.km_price);
    if (!Number.isFinite(patch.km_price) || patch.km_price < 0 || patch.km_price > 10000) return res.status(400).json({ error: 'Neplatná cena dopravy.' });
  }
  if (patch.services !== undefined) {
    if (!Array.isArray(patch.services) || patch.services.length > 20 || patch.services.some((item) => !trimmedString(item, 40))) {
      return res.status(400).json({ error: 'Neplatný seznam služeb.' });
    }
    patch.services = patch.services.map((item) => trimmedString(item, 40));
  }
  if (patch.langs !== undefined) {
    if (!Array.isArray(patch.langs) || patch.langs.length > 10 || patch.langs.some((item) => !trimmedString(item, 40))) {
      return res.status(400).json({ error: 'Neplatný seznam jazyků.' });
    }
    patch.langs = patch.langs.map((item) => trimmedString(item, 40));
  }
  if (patch.avail !== undefined) {
    if (!Array.isArray(patch.avail) || patch.avail.length > 7 || patch.avail.some((item) => !trimmedString(item, 40))) {
      return res.status(400).json({ error: 'Neplatná dostupnost.' });
    }
    patch.avail = patch.avail.map((item) => trimmedString(item, 40));
  }
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nic k aktualizaci.' });
  const currentRows = await restSelect(T.caregivers, `id=eq.${id}&select=id,email&limit=1`);
  const currentCaregiver = currentRows && currentRows[0];
  const rows = await restUpdate(T.caregivers, `id=eq.${id}`, patch);
  if (isAdmin && currentCaregiver && currentCaregiver.email && patch.suspended !== undefined) {
    const nextUserStatus = patch.suspended ? 'suspended' : 'active';
    await restUpdate(T.users, `email=eq.${encodeURIComponent(String(currentCaregiver.email).toLowerCase())}`, { status: nextUserStatus }, { prefer: 'return=minimal' });
  }
  if (isAdmin && (b.suspended !== undefined || b.status !== undefined || b.plan !== undefined)) {
    fireAudit('admin.caregiver.update', { req, actor: auditActor(req), targetType: 'caregiver', targetId: id, status: 'success', metadata: { suspended: b.suspended, status: b.status, plan: b.plan } });
  }
  res.json({ caregiver: rows && rows[0] ? mapCaregiver(rows[0]) : null });
}));

/* ---------------- STRIPE: předplatné PREMIUM ---------------- */
// najde řádek pečovatelky podle e-mailu přihlášeného uživatele
async function caregiverByEmail(email) {
  if (!email) return null;
  const rows = await restSelect(T.caregivers, `email=eq.${encodeURIComponent(String(email).toLowerCase())}&limit=1`);
  return (rows && rows[0]) || null;
}
async function currentCaregiverRow(req) {
  if (!req.session || !req.session.email) return null;
  return caregiverByEmail(req.session.email);
}
// zapíše tarif (a Stripe id) do DB — hledá pečovatelku podle e-mailu nebo stripe_customer_id
async function setCaregiverPlan({ email, customerId, subscriptionId, plan, status }) {
  let row = null;
  if (email) row = await caregiverByEmail(email);
  if (!row && customerId) {
    const rows = await restSelect(T.caregivers, `stripe_customer_id=eq.${encodeURIComponent(customerId)}&limit=1`);
    row = (rows && rows[0]) || null;
  }
  if (!row) { console.warn('[stripe] pečovatelka nenalezena pro plán', { email, customerId }); return null; }
  const prevPlan = row.plan;
  const prevStatus = row.plan_status;
  const patch = {};
  if (plan !== undefined) patch.plan = plan;
  if (status !== undefined) patch.plan_status = status;
  if (customerId) patch.stripe_customer_id = customerId;
  if (subscriptionId !== undefined) patch.stripe_subscription_id = subscriptionId;
  await restUpdate(T.caregivers, `id=eq.${row.id}`, patch, { prefer: 'return=minimal' });
  console.log('[stripe] tarif aktualizován', { id: row.id, plan, status });
  return { row, prevPlan, prevStatus };
}

// cena PREMIUM (Kč/měsíc) ze serverových nastavení — nikdy se nevěří částce z prohlížeče
async function premiumPriceCZK() {
  try {
    const rows = await restSelect(T.settings, `key=eq.planPrices&limit=1`);
    const v = rows && rows[0] && rows[0].value;
    const p = v && Number(v.premium);
    if (p && p > 0) return Math.round(p);
  } catch (e) { console.warn('[stripe] nelze načíst cenu z nastavení:', e.message); }
  return 390; // fallback
}

// 1) Vytvoří Stripe Checkout Session (předplatné) a vrátí URL k přesměrování
app.post('/api/billing/checkout', requireRole('caregiver'), h(async (req, res) => {
  if (!STRIPE_ENABLED) return res.status(503).json({ error: 'Platby nejsou nakonfigurované.' });
  const email = req.session.email;
  const cg = await caregiverByEmail(email);
  if (!cg) return res.status(404).json({ error: 'Profil pečovatelky nenalezen.' });

  // znovupoužij Stripe zákazníka, jinak vytvoř nového
  let customerId = cg.stripe_customer_id || null;
  if (!customerId) {
    const customer = await stripe.customers.create({ email, name: cg.name || undefined, metadata: { caregiver_id: String(cg.id) } });
    customerId = customer.id;
    await restUpdate(T.caregivers, `id=eq.${cg.id}`, { stripe_customer_id: customerId }, { prefer: 'return=minimal' });
  }

  // dynamická cena z aplikace (admin → Tarify) — žádný předem vytvořený produkt ve Stripe není potřeba
  const priceCzk = await premiumPriceCZK();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: email,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: STRIPE_CURRENCY,
        unit_amount: priceCzk * 100, // v haléřích
        recurring: { interval: 'month' },
        product_data: { name: 'ZENVORIA PREMIUM', description: 'Měsíční předplatné pro pečovatelky — vyšší zobrazení a odznak Premium.' },
      },
    }],
    allow_promotion_codes: true,
    success_url: `${APP_URL}/#pricing?paid=1`,
    cancel_url: `${APP_URL}/#pricing?canceled=1`,
    metadata: { caregiver_id: String(cg.id), email },
    subscription_data: { metadata: { caregiver_id: String(cg.id), email } },
  });
  res.json({ url: session.url });
}));

// 2) Stripe Customer Portal — správa / zrušení předplatného
app.post('/api/billing/portal', requireRole('caregiver'), h(async (req, res) => {
  if (!STRIPE_ENABLED) return res.status(503).json({ error: 'Platby nejsou nakonfigurované.' });
  const cg = await caregiverByEmail(req.session.email);
  if (!cg || !cg.stripe_customer_id) return res.status(400).json({ error: 'Žádné aktivní předplatné.' });
  const session = await stripe.billingPortal.sessions.create({
    customer: cg.stripe_customer_id,
    return_url: `${APP_URL}/#pricing`,
  });
  res.json({ url: session.url });
}));

/* ---------------- ADMIN: uživatelé / tarify ---------------- */
async function cleanupUserRelations(user) {
  if (!user) return;
  const email = String(user.email || '').trim().toLowerCase();

  if (user.role === 'family') {
    const orders = await restSelect(T.orders, `family_email=eq.${encodeURIComponent(email)}&select=oid&limit=500`);
    for (const order of (orders || [])) {
      if (order && order.oid != null) await restDelete(T.requests, `oid=eq.${Number(order.oid)}`, { prefer: 'return=minimal' });
    }
    await restDelete(T.orders, `family_email=eq.${encodeURIComponent(email)}`, { prefer: 'return=minimal' });
  }

  const caregiverRows = await restSelect(
    T.caregivers,
    `or=(user_id.eq.${encodeURIComponent(String(user.id))},email.eq.${encodeURIComponent(email)})&select=id&limit=50`
  );
  for (const caregiver of (caregiverRows || [])) {
    const caregiverId = Number(caregiver.id);
    if (!Number.isInteger(caregiverId) || caregiverId <= 0) continue;
    await restDelete(T.requests, `cid=eq.${caregiverId}`, { prefer: 'return=minimal' });
    await restDelete(T.schedule, `cid=eq.${caregiverId}`, { prefer: 'return=minimal' });
    await restDelete(T.reviews, `caregiver_id=eq.${caregiverId}`, { prefer: 'return=minimal' });
    await restDelete(T.orders, `cid=eq.${caregiverId}`, { prefer: 'return=minimal' });
    await restDelete(T.caregivers, `id=eq.${caregiverId}`, { prefer: 'return=minimal' });
  }

  await restDelete(T.verifications, `email=eq.${encodeURIComponent(email)}`, { prefer: 'return=minimal' });
}

app.patch('/api/users/:id', requireRole('admin'), h(async (req, res) => {
  const b = req.body || {};
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Neplatné ID uživatele.' });
  const patch = {};
  if (b.status !== undefined) {
    const status = trimmedString(b.status, 20);
    if (!ADMIN_UPDATABLE_USER_STATUSES.has(status)) return res.status(400).json({ error: 'Neplatný stav uživatele.' });
    patch.status = status;
  }
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nic k aktualizaci.' });
  await restUpdate(T.users, `id=eq.${id}`, patch, { prefer: 'return=minimal' });
  fireAudit('admin.user.update', { req, actor: auditActor(req), targetType: 'user', targetId: id, status: 'success', metadata: { fields: Object.keys(patch) } });
  res.json({ ok: true });
}));

app.delete('/api/users/:id', requireRole('admin'), h(async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Neplatné ID uživatele.' });
  const rows = await restSelect(T.users, `id=eq.${encodeURIComponent(id)}&limit=1`);
  const user = rows && rows[0];
  if (!user) return res.status(404).json({ error: 'Uživatel nebyl nalezen.' });
  await cleanupUserRelations(user);
  await restDelete(T.users, `id=eq.${encodeURIComponent(id)}`, { prefer: 'return=minimal' });
  const verify = await restSelect(T.users, `id=eq.${encodeURIComponent(id)}&limit=1`);
  if (verify && verify[0]) {
    return res.status(409).json({ error: 'Uživatele se nepodařilo odstranit.', detail: 'user_still_exists' });
  }
  fireAudit('admin.user.delete', { req, actor: auditActor(req), targetType: 'user', targetId: id, status: 'success', metadata: { email: user.email || null, role: user.role || null } });
  res.json({ ok: true });
}));

app.delete('/api/caregivers/:id', requireRole('admin'), h(async (req, res) => {
  const caregiverId = Number(req.params.id);
  if (!Number.isInteger(caregiverId) || caregiverId <= 0) return res.status(400).json({ error: 'Neplatné ID pečovatelky.' });
  await restDelete(T.requests, `cid=eq.${caregiverId}`, { prefer: 'return=minimal' });
  await restDelete(T.schedule, `cid=eq.${caregiverId}`, { prefer: 'return=minimal' });
  await restDelete(T.reviews, `caregiver_id=eq.${caregiverId}`, { prefer: 'return=minimal' });
  await restDelete(T.orders, `cid=eq.${caregiverId}`, { prefer: 'return=minimal' });
  await restDelete(T.caregivers, `id=eq.${caregiverId}`, { prefer: 'return=minimal' });
  const verify = await restSelect(T.caregivers, `id=eq.${caregiverId}&limit=1`);
  if (verify && verify[0]) {
    return res.status(409).json({ error: 'Pečovatelku se nepodařilo odstranit.', detail: 'caregiver_still_exists' });
  }
  fireAudit('admin.caregiver.delete', { req, actor: auditActor(req), targetType: 'caregiver', targetId: caregiverId, status: 'success' });
  res.json({ ok: true });
}));

app.put('/api/settings/:key', requireRole('admin'), h(async (req, res) => {
  const key = String(req.params.key || '').trim();
  if (!ADMIN_UPDATABLE_SETTING_KEYS.has(key)) return res.status(400).json({ error: 'Tento klíč nastavení nelze upravit.' });
  const value = sanitizeSettingValue(key, (req.body || {}).value);
  if (value == null) return res.status(400).json({ error: 'Neplatná hodnota nastavení.' });
  await supabaseRestRequest('POST', T.settings, { body: { key, value }, prefer: 'resolution=merge-duplicates,return=minimal' });
  if (key === 'socialLinks') emailSocialLinks = { facebook: value.facebook || '', instagram: value.instagram || '' };
  fireAudit('admin.settings.update', { req, actor: auditActor(req), targetType: 'setting', targetId: key, status: 'success' });
  res.json({ ok: true });
}));

app.get('/api/admin/audit-logs', requireRole('admin'), h(async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 80)));
  const rows = await restSelect(
    T.auditLogs,
    `select=id,action,actor_id,actor_email,actor_role,target_type,target_id,status,ip,user_agent,metadata,created_at&order=created_at.desc&limit=${limit}`
  );
  res.json({
    logs: (rows || []).map((row) => ({
      id: row.id,
      action: row.action,
      actorId: row.actor_id,
      actorEmail: row.actor_email,
      actorRole: row.actor_role,
      targetType: row.target_type,
      targetId: row.target_id,
      status: row.status,
      ip: row.ip,
      userAgent: row.user_agent,
      metadata: row.metadata || null,
      createdAt: row.created_at,
    })),
  });
}));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint nebyl nalezen.' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err && err.status && err.status < 500 ? err.status : 500;
  console.error('[api]', req.method, req.path, err && err.stack ? err.stack : err && err.message ? err.message : err);
  const message = status >= 500 ? 'Chyba serveru.' : (err.message || 'Požadavek se nezdařil.');
  res.status(status).json({ error: message });
});

/* ----------------------------------------------------------------------
   6) STATIKA (frontend) — až po /api
   -------------------------------------------------------------------- */
const IMMUTABLE_ASSET_RE = /\.(?:png|jpe?g|webp|gif|svg|ico|woff2?)$/i;
/* aplikační kód (app.js/app.css/*.html) se musí revalidovat, aby po deployi
   reload stáhl novou verzi; statická média (obrázky/fonty) zůstanou immutable. */
const REVALIDATE_ASSET_RE = /(?:\.html?|app\.js|app\.css|deferred-views\.html)$/i;
/* index.html vždy s otiskem verze (musí být PŘED express.static) */
app.get(['/', '/index.html'], (_req, res) => sendIndex(res));
app.use(express.static(ROOT, {
  extensions: ['html'],
  index: 'index.html',
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    if (REVALIDATE_ASSET_RE.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }
    if (IMMUTABLE_ASSET_RE.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  sendIndex(res);
});

app.listen(PORT, () => {
  console.log(`[zenvoria] 🚀 server běží na portu ${PORT}`);
  loadEmailSocialLinks();
});
