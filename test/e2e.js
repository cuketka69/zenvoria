#!/usr/bin/env node
'use strict';
/**
 * End-to-end test of the core zenvoria flow, run against a real running
 * server via HTTP — the same requests the frontend makes, not mocks:
 *
 *   register (caregiver + family) → submit verification → approve →
 *   booking conflict/availability checks → accept poptávka →
 *   chat (send/react/reply/edit/delete) → term proposal both directions →
 *   mark order done → review → read receipt → cleanup
 *
 * Usage:
 *   TEST_BASE_URL=https://www.zenvoria.cz \
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node test/e2e.js
 *
 * TEST_BASE_URL defaults to https://www.zenvoria.cz.
 *
 * Verification approval, e-mail verification, and final cleanup all need
 * direct database access (there's no way to log in as admin without a
 * password, and the test has no inbox to read a real verification code
 * from), so they use the Supabase service-role REST API directly — the
 * same credentials the server itself uses (SUPABASE_URL /
 * SUPABASE_SERVICE_ROLE_KEY). Without them the test registers the two
 * accounts and stops there (new accounts can't create orders,
 * verifications, reviews, or chats until their e-mail is verified).
 *
 * Requires Node 18.14+ (needs Response.headers.getSetCookie()).
 */

const assert = require('node:assert/strict');

const BASE_URL = (process.env.TEST_BASE_URL || 'https://www.zenvoria.cz').replace(/\/+$/, '');
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const HAS_DB = !!(SUPABASE_URL && SUPABASE_KEY);

const stamp = Date.now();
const CG_EMAIL = `e2e-cg-${stamp}@example.com`;
const FAM_EMAIL = `e2e-fam-${stamp}@example.com`;
const PASSWORD = 'TestPass123';

let passed = 0, failed = 0;

async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`OK   ${name}`);
  } catch (e) {
    failed++;
    console.error(`FAIL ${name}: ${e.message}`);
  }
}

class Session {
  constructor() { this.cookies = new Map(); }
  applySetCookie(headers) {
    const raw = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
    for (const line of raw) {
      const pair = line.split(';')[0];
      const idx = pair.indexOf('=');
      if (idx > 0) this.cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
    }
  }
  cookieHeader() { return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '); }
  get csrf() { return this.cookies.get('zv_csrf') || ''; }
  async api(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json', Cookie: this.cookieHeader() };
    if (method !== 'GET') { headers.Origin = BASE_URL; headers['X-CSRF-Token'] = this.csrf; }
    const res = await fetch(BASE_URL + '/api' + path, {
      method, headers, body: body != null ? JSON.stringify(body) : undefined,
    });
    this.applySetCookie(res.headers);
    let data = null;
    try { data = await res.json(); } catch (_) { /* no body */ }
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${(data && data.error) || res.statusText}`);
    return data;
  }
}

async function supabaseRest(method, table, { query = '', body, prefer } = {}) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`, {
    method, headers, body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${table} -> ${res.status}: ${await res.text()}`);
  try { return await res.json(); } catch (_) { return null; }
}

function futureMonday(weeksAhead) {
  const d = new Date();
  d.setDate(d.getDate() + 7 * weeksAhead);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function printSummary() {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
}

(async () => {
  console.log(`Testing against ${BASE_URL} ${HAS_DB ? '(DB access available for approval/cleanup)' : '(no DB access — will stop after verification submit)'}\n`);

  const cg = new Session();
  const fam = new Session();
  let caregiverId = null, verificationId = null, conversationId = null, orderId1 = null;
  let msgIdA = null, msgIdB = null, msgIdTermA = null, msgIdTermB = null;

  await step('register caregiver', async () => {
    const r = await cg.api('/auth/register', { method: 'POST', body: { name: 'E2E Caregiver', email: CG_EMAIL, password: PASSWORD, role: 'caregiver' } });
    assert.equal(r.user.role, 'caregiver');
  });

  await step('register family', async () => {
    const r = await fam.api('/auth/register', { method: 'POST', body: { name: 'E2E Family', email: FAM_EMAIL, password: PASSWORD, role: 'family' } });
    assert.equal(r.user.role, 'family');
  });

  if (!HAS_DB) {
    console.log('\nSkipping the rest: set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to run the full flow ' +
      '(new accounts need e-mail verification, direct DB only, before they can do anything else).');
    printSummary();
    return;
  }

  await step('verify e-mails (direct DB — mirrors clicking the code from the inbox)', async () => {
    await supabaseRest('PATCH', 'zenvoria_users', { query: `email=eq.${encodeURIComponent(CG_EMAIL)}`, body: { email_verified: true }, prefer: 'return=minimal' });
    await supabaseRest('PATCH', 'zenvoria_users', { query: `email=eq.${encodeURIComponent(FAM_EMAIL)}`, body: { email_verified: true }, prefer: 'return=minimal' });
  });

  await step('submit verification', async () => {
    const r = await cg.api('/verifications', {
      method: 'POST',
      body: {
        name: 'E2E Caregiver', loc: 'Praha 6', rate: 250, exp: 5, phone: '777123456',
        docType: 'obcansky', docNum: '123456789',
        idFront: 'data:image/png;base64,x', idBack: 'data:image/png;base64,x', selfie: 'data:image/png;base64,x',
        services: ['domaci-pece'],
        certifications: [{ name: 'Kurz', issuer: 'CK', validUntil: '2027-01-01', fileName: 'c.pdf' }],
        bio: 'E2E test caregiver.',
      },
    });
    assert.equal(r.verification.status, 'submitted');
    verificationId = r.verification.id;
  });

  await step('approve verification (direct DB — mirrors the admin "Schválit" button)', async () => {
    const users = await supabaseRest('GET', 'zenvoria_users', { query: `email=eq.${encodeURIComponent(CG_EMAIL)}&select=id` });
    const userId = users[0].id;
    const existing = await supabaseRest('GET', 'zenvoria_caregivers', { query: 'select=id&order=id.desc&limit=1' });
    const nextId = (existing[0] ? existing[0].id : 0) + 1;
    const avail = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ r: i < 5, o: i < 5, v: false })); // Po-Pá 08-18
    const rows = await supabaseRest('POST', 'zenvoria_caregivers', {
      body: {
        id: nextId, user_id: userId, public_id: `e2etest${stamp}`, email: CG_EMAIL, name: 'E2E Caregiver', init: 'EC',
        loc: 'Praha 6', rate: 250, exp: 5, services: ['domaci-pece'], verified: true, id_verified: true,
        status: 'verified', suspended: false, bio: 'E2E test caregiver.', cert: true, rating: 0, reviews: 0,
        plan: 'start', plan_status: 'active', trial_until: null, langs: ['Čeština'], price_type: 'hod',
        day_rate: 2000, radius: 10, km_price: 0, avail,
      },
      prefer: 'return=representation',
    });
    caregiverId = rows[0].id;
    await supabaseRest('PATCH', 'zenvoria_verifications', { query: `id=eq.${verificationId}`, body: { status: 'approved' }, prefer: 'return=minimal' });
  });

  await step('booking succeeds within availability', async () => {
    const r = await fam.api('/orders', { method: 'POST', body: { cid: caregiverId, service: 'domaci-pece', hours: 4, date: futureMonday(1), time: '10:00', addr: 'Testovaci 1', note: 'e2e', km: 0 } });
    assert.equal(r.order.status, 'pending');
    orderId1 = r.order.oid;
  });

  await step('booking rejected outside caregiver availability', async () => {
    await assert.rejects(
      fam.api('/orders', { method: 'POST', body: { cid: caregiverId, service: 'domaci-pece', hours: 2, date: futureMonday(1), time: '23:00', addr: 'Testovaci 1', km: 0 } }),
      /dostupnost/i,
    );
  });

  await step('caregiver accepts request -> order confirmed', async () => {
    const data = await cg.api('/bootstrap');
    const reqRow = data.requests.find((r) => r.oid === orderId1);
    assert.ok(reqRow, 'request for order not found');
    await cg.api(`/requests/${reqRow.id}/accept`, { method: 'POST' });
    const check = await fam.api('/bootstrap');
    assert.equal(check.orders.find((o) => o.oid === orderId1).status, 'confirmed');
  });

  await step('double-booking on the same slot is rejected', async () => {
    await assert.rejects(
      fam.api('/orders', { method: 'POST', body: { cid: caregiverId, service: 'domaci-pece', hours: 2, date: futureMonday(1), time: '11:00', addr: 'X', km: 0 } }),
      /potvrzenou/i,
    );
  });

  await step('chat: send, react, reply, edit, delete', async () => {
    const conv = await fam.api('/conversations', { method: 'POST', body: { caregiverId } });
    conversationId = conv.conversation.id;
    const m1 = await fam.api(`/conversations/${conversationId}/messages`, { method: 'POST', body: { text: 'Hello', t: '12:00' } });
    msgIdA = m1.message.id;
    await cg.api(`/conversations/${conversationId}/messages/${msgIdA}/react`, { method: 'POST', body: { emoji: '👍' } });
    const m2 = await cg.api(`/conversations/${conversationId}/messages`, { method: 'POST', body: { text: 'Hi', t: '12:01', replyTo: msgIdA } });
    msgIdB = m2.message.id;
    assert.equal(m2.message.replyTo.id, msgIdA);
    await cg.api(`/conversations/${conversationId}/messages/${msgIdB}`, { method: 'PATCH', body: { text: 'Hi there' } });
    await fam.api(`/conversations/${conversationId}/messages/${msgIdA}`, { method: 'DELETE' });
    const msgs = await cg.api(`/conversations/${conversationId}/messages`);
    assert.ok(msgs.messages.find((m) => m.id === msgIdA).deletedAt, 'message should be soft-deleted');
  });

  await step('caregiver-proposed term -> family accepts -> pending order', async () => {
    const t = await cg.api(`/conversations/${conversationId}/messages`, { method: 'POST', body: { t: '12:10', term: { service: 'domaci-pece', date: futureMonday(2), time: '09:00', hours: 3, addr: 'X' } } });
    msgIdTermA = t.message.id;
    const acc = await fam.api(`/conversations/${conversationId}/messages/${msgIdTermA}/term/accept`, { method: 'POST' });
    assert.equal(acc.term.status, 'accepted');
    assert.equal(acc.immediatelyConfirmed, false);
  });

  await step('family-proposed term -> caregiver accepts -> immediately confirmed', async () => {
    const t = await fam.api(`/conversations/${conversationId}/messages`, { method: 'POST', body: { t: '12:20', term: { service: 'domaci-pece', date: futureMonday(3), time: '14:00', hours: 2, addr: 'Y' } } });
    msgIdTermB = t.message.id;
    const acc = await cg.api(`/conversations/${conversationId}/messages/${msgIdTermB}/term/accept`, { method: 'POST' });
    assert.equal(acc.term.status, 'accepted');
    assert.equal(acc.immediatelyConfirmed, true);
  });

  await step('caregiver cannot mark order done; family can; review works', async () => {
    await assert.rejects(cg.api(`/orders/${orderId1}`, { method: 'PATCH', body: { status: 'done' } }));
    const r = await fam.api(`/orders/${orderId1}`, { method: 'PATCH', body: { status: 'done' } });
    assert.equal(r.order.status, 'done');
    await fam.api('/reviews', { method: 'POST', body: { caregiverId, oid: orderId1, stars: 5, name: 'E2E Family', init: 'EF', text: 'Great e2e care.' } });
  });

  await step('read receipt updates after the other side reads', async () => {
    await cg.api(`/conversations/${conversationId}/messages`);
    const convs = await fam.api('/conversations');
    const c = convs.conversations.find((x) => x.id === conversationId);
    assert.ok(c && c.otherReadAt, 'otherReadAt should be set after caregiver read the messages');
  });

  await step('cleanup test data', async () => {
    await supabaseRest('DELETE', 'zenvoria_messages', { query: `conversation_id=eq.${conversationId}` });
    await supabaseRest('DELETE', 'zenvoria_conversations', { query: `id=eq.${conversationId}` });
    await supabaseRest('DELETE', 'zenvoria_reviews', { query: `caregiver_id=eq.${caregiverId}` });
    await supabaseRest('DELETE', 'zenvoria_schedule', { query: `cid=eq.${caregiverId}` });
    await supabaseRest('DELETE', 'zenvoria_requests', { query: `cid=eq.${caregiverId}` });
    await supabaseRest('DELETE', 'zenvoria_orders', { query: `cid=eq.${caregiverId}` });
    await supabaseRest('DELETE', 'zenvoria_verifications', { query: `email=eq.${encodeURIComponent(CG_EMAIL)}` });
    await supabaseRest('DELETE', 'zenvoria_caregivers', { query: `id=eq.${caregiverId}` });
    await supabaseRest('DELETE', 'zenvoria_users', { query: `email=in.(${encodeURIComponent(CG_EMAIL)},${encodeURIComponent(FAM_EMAIL)})` });
  });

  printSummary();
})().catch((e) => {
  console.error('Fatal error running e2e test:', e);
  process.exitCode = 1;
});
