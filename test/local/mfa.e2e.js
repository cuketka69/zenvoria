// E2E test 2FA proti běžícímu serveru (s napodobenou databází). Kódy TOTP počítá nezávislá implementace.
const assert = require('assert/strict');
const crypto = require('crypto');
const BASE = process.argv[2] || 'http://localhost:3100';
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32dec(s) { s = s.toUpperCase().replace(/[^A-Z2-7]/g, ''); let bits = '', out = []; for (const c of s) bits += B32.indexOf(c).toString(2).padStart(5, '0'); for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(out); }
function totp(secret, offset = 0) { const step = Math.floor(Date.now() / 30000) + offset; const msg = Buffer.alloc(8); msg.writeUInt32BE(Math.floor(step / 2 ** 32), 0); msg.writeUInt32BE(step >>> 0, 4); const h = crypto.createHmac('sha1', b32dec(secret)).update(msg).digest(); const o = h[19] & 15; return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0'); }
// RFC 6238 vektor (SHA1, T=59 → 94287082 → posledních 6 číslic 287082) přes naši referenci
{ const key = Buffer.from('12345678901234567890'); const msg = Buffer.alloc(8); msg.writeUInt32BE(1, 4); const h = crypto.createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15; assert.equal(String((h.readUInt32BE(o) & 0x7fffffff) % 1e8), '94287082'); }

class Client {
  constructor() { this.jar = {}; }
  async req(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json', Origin: BASE, Cookie: Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join('; ') };
    if (this.jar.zv_csrf) headers['X-CSRF-Token'] = decodeURIComponent(this.jar.zv_csrf);
    const r = await fetch(BASE + '/api' + path, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
    for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); this.jar[kv.slice(0, i)] = kv.slice(i + 1); }
    let data = null; try { data = await r.json(); } catch {}
    return { status: r.status, data };
  }
}
const step = (m) => console.log('✓', m);
(async () => {
  // 1) admin bez 2FA → normální přihlášení
  const a = new Client();
  let r = await a.req('/auth/login', { method: 'POST', body: { email: 'admin@test.local', password: 'Heslo123' } });
  assert.equal(r.status, 200); assert.ok(r.data.user, 'session hned'); step('admin bez 2FA se přihlásí rovnou');
  r = await a.req('/auth/2fa'); assert.equal(r.data.enabled, false); step('stav 2FA: vypnuto');
  // rodina nesmí na 2FA endpointy
  const f = new Client(); await f.req('/auth/login', { method: 'POST', body: { email: 'fam@test.local', password: 'Heslo123' } });
  r = await f.req('/auth/2fa/setup', { method: 'POST' }); assert.equal(r.status, 403); step('rodina nemá přístup k nastavení 2FA');
  // 2) zapnutí
  r = await a.req('/auth/2fa/setup', { method: 'POST' }); assert.equal(r.status, 200); assert.match(r.data.qr, /^data:image\/png;base64,/); assert.match(r.data.otpauth, /^otpauth:\/\/totp\/ZENVORIA/);
  const secret = r.data.secret.replace(/\s/g, ''); step('setup vrací QR a klíč');
  r = await a.req('/auth/2fa/enable', { method: 'POST', body: { code: '000000' } }); assert.equal(r.status, 400); step('špatný kód 2FA nezapne');
  r = await a.req('/auth/2fa/enable', { method: 'POST', body: { code: totp(secret) } }); assert.equal(r.status, 200); assert.equal(r.data.backupCodes.length, 10);
  const backup = r.data.backupCodes; step('2FA zapnuto, 10 záložních kódů');
  // 3) přihlášení: heslo → mfaRequired, bez session cookie
  const b = new Client();
  r = await b.req('/auth/login', { method: 'POST', body: { email: 'admin@test.local', password: 'Heslo123' } });
  assert.equal(r.data.mfaRequired, true); assert.ok(!r.data.user); assert.ok(!b.jar.zv_session && !Object.keys(b.jar).some((k) => /sess/i.test(k)), 'žádná session cookie: ' + Object.keys(b.jar));
  const token = r.data.mfaToken; step('po hesle chce kód a nevydá session');
  r = await b.req('/auth/me'); assert.ok(!(r.data && r.data.user && r.data.user.role === 'admin')); step('/auth/me bez kódu → nepřihlášen');
  // mfaToken podstrčený jako session cookie nesmí fungovat
  const evil = new Client(); for (const name of ['zv_session', 'zv_sess', 'session']) evil.jar[name] = token;
  r = await evil.req('/auth/2fa'); assert.equal(r.status, 403); step('mfaToken nejde použít jako session cookie');
  r = await b.req('/auth/login/mfa', { method: 'POST', body: { mfaToken: token, code: '123456' } }); assert.equal(r.status, 401); step('špatný kód → 401');
  r = await b.req('/auth/login/mfa', { method: 'POST', body: { mfaToken: token + 'x', code: totp(secret) } }); assert.equal(r.status, 401); step('upravený token → 401');
  // kód použitý při zapnutí už nejde použít znovu (ochrana proti přehrání) → zkusíme další časový krok
  r = await b.req('/auth/login/mfa', { method: 'POST', body: { mfaToken: token, code: totp(secret) } });
  if (r.status === 401) { step('stejný kód jako při zapnutí odmítnut (replay) — čekám na další kód'); await new Promise((res) => setTimeout(res, 30500 - (Date.now() % 30000))); r = await b.req('/auth/login/mfa', { method: 'POST', body: { mfaToken: token, code: totp(secret) } }); }
  assert.equal(r.status, 200, JSON.stringify(r.data)); assert.equal(r.data.user.role, 'admin'); step('správný kód → přihlášen');
  r = await b.req('/auth/2fa'); assert.equal(r.data.enabled, true); step('session funguje');
  const usedCode = totp(secret);
  // 4) přehrání téhož kódu jiným přihlášením
  const c = new Client(); r = await c.req('/auth/login', { method: 'POST', body: { email: 'admin@test.local', password: 'Heslo123' } });
  r = await c.req('/auth/login/mfa', { method: 'POST', body: { mfaToken: r.data.mfaToken, code: usedCode } }); assert.equal(r.status, 401); step('už použitý kód nejde znovu (replay)');
  // 5) záložní kód
  const d = new Client(); r = await d.req('/auth/login', { method: 'POST', body: { email: 'admin@test.local', password: 'Heslo123' } });
  const t2 = r.data.mfaToken;
  r = await d.req('/auth/login/mfa', { method: 'POST', body: { mfaToken: t2, code: backup[0].toLowerCase() } }); assert.equal(r.status, 200); assert.equal(r.data.backupLeft, 9); step('záložní kód funguje (i malými písmeny), zbývá 9');
  const e = new Client(); r = await e.req('/auth/login', { method: 'POST', body: { email: 'admin@test.local', password: 'Heslo123' } });
  r = await e.req('/auth/login/mfa', { method: 'POST', body: { mfaToken: r.data.mfaToken, code: backup[0] } }); assert.equal(r.status, 401); step('záložní kód podruhé nejde');
  // 6) max pokusů
  const g = new Client(); r = await g.req('/auth/login', { method: 'POST', body: { email: 'admin@test.local', password: 'Heslo123' } }); const t3 = r.data.mfaToken;
  for (let i = 0; i < 5; i++) await g.req('/auth/login/mfa', { method: 'POST', body: { mfaToken: t3, code: '00000' + i } });
  r = await g.req('/auth/login/mfa', { method: 'POST', body: { mfaToken: t3, code: backup[1] } }); assert.ok([401, 429].includes(r.status)); step('po 5 chybách token zablokován (i pro správný kód) → ' + r.status);
  // 7) rodina se přihlašuje beze změny
  const h = new Client(); r = await h.req('/auth/login', { method: 'POST', body: { email: 'fam@test.local', password: 'Heslo123' } }); assert.ok(r.data.user && !r.data.mfaRequired); step('rodina se přihlásí bez 2FA');
  // 8) vypnutí: špatné heslo, pak správně se záložním kódem
  r = await b.req('/auth/2fa/disable', { method: 'POST', body: { password: 'spatne', code: backup[2] } }); assert.equal(r.status, 401); step('vypnutí se špatným heslem odmítnuto');
  r = await b.req('/auth/2fa/disable', { method: 'POST', body: { password: 'Heslo123', code: backup[2] } }); assert.equal(r.status, 200);
  const k = new Client(); r = await k.req('/auth/login', { method: 'POST', body: { email: 'admin@test.local', password: 'Heslo123' } }); assert.ok(r.data.user && !r.data.mfaRequired); step('po vypnutí se admin přihlásí jen heslem');
  console.log('\nVŠECHNY TESTY PROŠLY');
})().catch((e) => { console.error('✗ TEST SELHAL:', e); process.exit(1); });
