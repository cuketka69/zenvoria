const { spawn } = require('child_process');
const path = require('path'), assert = require('assert/strict');
const root = process.argv[2] || require('path').resolve(__dirname, '..', '..');
const FAKE = path.join(__dirname, 'fake_postgrest.js');
const procs = []; const kill = () => procs.forEach((p) => { try { p.kill(); } catch {} }); process.on('exit', kill);
const DB = 'http://127.0.0.1:54321/rest/v1/', BASE = 'http://localhost:3100';
const post = (t, body) => fetch(DB + t, { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) });
class Client {
  constructor() { this.jar = {}; }
  async req(p, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json', Origin: BASE, Cookie: Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join('; ') };
    if (this.jar.zv_csrf) headers['X-CSRF-Token'] = decodeURIComponent(this.jar.zv_csrf);
    const r = await fetch(BASE + p, { method, headers, body: body ? JSON.stringify(body) : undefined });
    for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); this.jar[kv.slice(0, i)] = kv.slice(i + 1); }
    let data = null; try { data = await r.json(); } catch {} return { status: r.status, data };
  }
}
(async () => {
  procs.push(spawn(process.execPath, [FAKE, root, '54321'], { stdio: 'ignore' }));
  for (let i = 0; i < 50; i++) { try { await fetch(DB + 'zenvoria_users'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  const bcrypt = require(path.join(root, 'node_modules/bcryptjs')); const hash = bcrypt.hashSync('Heslo123', 8);
  const fam = Array.from({ length: 5 }, (_, i) => ({ id: 'm' + i, email: `m${i}@t.cz`, password_hash: hash, name: 'Člen ' + i + ' X', role: 'family', status: 'active', email_verified: true }));
  await post('zenvoria_users', [{ id: 'uF', email: 'fam@t.cz', password_hash: hash, name: 'Marie Rodina', role: 'family', status: 'active', email_verified: true }, ...fam]);
  await post('zenvoria_orders', [{ id: 1, oid: 901, cid: 11, family_email: 'fam@t.cz', status: 'confirmed', date: '2026-12-01', time: '10:00', hours: 2 }]);
  await post('zenvoria_caregivers', [{ id: 11, user_id: 'uC', name: 'Jana' }]);
  const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: 'x-secret-123456789', APP_URL: BASE, RESEND_API_KEY: '' };
  procs.push(spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: 'ignore' }));
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  try {
    const c = new Client(); assert.equal((await c.req('/api/auth/login', { method: 'POST', body: { email: 'fam@t.cz', password: 'Heslo123' } })).status, 200);
    const res = await Promise.all(Array.from({ length: 15 }, (_, i) => c.req('/api/orders/901/care-notes', { method: 'POST', body: { text: 'Souběžný záznam č. ' + i } })));
    assert.ok(res.every((r) => r.status === 201), res.map((r) => r.status).join(','));
    const notes = (await (await fetch(DB + 'zenvoria_settings?key=eq.orderCareNotesV1')).json())[0].value;
    assert.equal(notes.length, 15, 'uloženo ' + notes.length); console.log('✓ 15 souběžných záznamů péče → uloženo všech 15');
    assert.equal(new Set(notes.map((n) => n.id)).size, 15); console.log('✓ žádná dvě se stejným ID');
    const inv = await Promise.all(fam.map((m) => c.req('/api/family-care-team/invite', { method: 'POST', body: { email: m.email } })));
    const teams = (await (await fetch(DB + 'zenvoria_settings?key=eq.familyCareTeamsV1')).json())[0].value;
    const members = (teams.find((t) => t.ownerEmail === 'fam@t.cz') || { members: [] }).members.length;
    assert.equal(members, 5, 'členů ' + members + ' / odpovědi ' + inv.map((r) => r.status).join(',')); console.log('✓ 5 souběžných pozvánek do sdílené péče → 5 členů');
    console.log('\nVŠE PROŠLO');
  } catch (e) { console.error('✗', e.message); kill(); process.exit(1); }
  kill(); process.exit(0);
})();
