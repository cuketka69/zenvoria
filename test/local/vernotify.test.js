// Nová žádost o ověření / doplnění osvědčení → každý admin dostane upozornění (v aplikaci + e-mail přes notifyMail).
const { spawn } = require('child_process');
const path = require('path'), assert = require('assert/strict');
const root = process.argv[2] || path.resolve(__dirname, '..', '..'), here = __dirname;
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
    const txt = await r.text(); let data = txt; try { data = JSON.parse(txt); } catch {}
    return { status: r.status, data };
  }
}
(async () => {
  procs.push(spawn(process.execPath, [path.join(here, 'fake_postgrest.js'), root, '54321'], { stdio: 'ignore' }));
  for (let i = 0; i < 50; i++) { try { await fetch(DB + 'zenvoria_users'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  const hash = require(path.join(root, 'node_modules/bcryptjs')).hashSync('Heslo123', 8);
  await post('zenvoria_users', [
    { id: 'uA1', email: 'admin1@t.cz', password_hash: hash, name: 'Admin Jedna', role: 'admin', status: 'active', email_verified: true },
    { id: 'uA2', email: 'admin2@t.cz', password_hash: hash, name: 'Admin Dva', role: 'admin', status: 'active', email_verified: true },
    { id: 'uC', email: 'cg@t.cz', password_hash: hash, name: 'Eva Pečovatelka', role: 'caregiver', status: 'active', email_verified: true },
  ]);
  await post('zenvoria_verifications', [{ id: 1, email: 'cg@t.cz', name: 'Eva Pečovatelka', loc: 'Brno', status: 'approved', date: '2026-01-01', files: {} }]);
  const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: 'test-secret-1234567890', APP_URL: BASE, RESEND_API_KEY: '' };
  procs.push(spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: 'ignore' }));
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  try {
    const cg = new Client();
    await cg.req('/api/auth/login', { method: 'POST', body: { email: 'cg@t.cz', password: 'Heslo123' } });
    const pdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n%test\n').toString('base64');
    const r = await cg.req('/api/certifications', { method: 'POST', body: { name: 'Kurz první pomoci', issuer: 'Červený kříž', fileName: 'kurz.pdf', fileData: pdf } });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    let notes = [];
    for (let i = 0; i < 20; i++) { notes = await (await fetch(DB + 'zenvoria_notifications')).json(); if (notes.filter((n) => n.type === 'verification').length >= 3) break; await new Promise((res) => setTimeout(res, 150)); }
    const forAdmins = notes.filter((n) => n.type === 'verification');
    const ids = forAdmins.map((n) => n.user_id); assert.ok(ids.includes('uA1') && ids.includes('uA2'), JSON.stringify(ids));
    assert.ok(forAdmins.every((n) => n.link === 'admin-verify' && n.title.includes('Eva Pečovatelka')));
    assert.ok(!notes.some((n) => n.user_id === 'uC'), 'pečovatelka sama upozornění nedostane');
    console.log('✓ nové osvědčení → upozornění oběma adminům (odkaz na Ověření), pečovatelce ne');
    console.log('\nVŠE PROŠLO');
  } catch (e) { console.error('✗', e.message); kill(); process.exit(1); }
  kill(); process.exit(0);
})();
