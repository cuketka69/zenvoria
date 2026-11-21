// Testovací účty (@test.zenvoria.cz) nevidí skuteční návštěvníci — jen jiné testovací účty a admin.
const { spawn } = require('child_process');
const path = require('path'), assert = require('assert/strict');
const root = process.argv[2] || require('path').resolve(__dirname, '..', '..'), here = __dirname;
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
  login(email) { return this.req('/api/auth/login', { method: 'POST', body: { email, password: 'Heslo123' } }); }
}
const ok = (m) => console.log('✓', m);
(async () => {
  procs.push(spawn(process.execPath, [path.join(here, 'fake_postgrest.js'), root, '54321'], { stdio: 'ignore' }));
  for (let i = 0; i < 50; i++) { try { await fetch(DB + 'zenvoria_users'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  const hash = require(path.join(root, 'node_modules/bcryptjs')).hashSync('Heslo123', 8);
  await post('zenvoria_users', [
    { id: 'uR', email: 'real@t.cz', password_hash: hash, name: 'Skutečná', role: 'caregiver', status: 'active', email_verified: true },
    { id: 'uT', email: 'jana@test.zenvoria.cz', password_hash: hash, name: 'Testovací', role: 'caregiver', status: 'active', email_verified: true },
    { id: 'uF', email: 'fam@t.cz', password_hash: hash, name: 'Rodina', role: 'family', status: 'active', email_verified: true },
    { id: 'uTF', email: 'rodina@test.zenvoria.cz', password_hash: hash, name: 'Test rodina', role: 'family', status: 'active', email_verified: true },
  ]);
  const base = { verified: true, suspended: false, plan: 'premium', country: 'cz', lat: 50.0, lng: 14.0, services: ['osobni'], rate: 300, loc: 'Praha' };
  await post('zenvoria_caregivers', [
    { id: 1, user_id: 'uR', email: 'real@t.cz', name: 'Skutečná Pečovatelka', slug: 'skutecna-praha', ...base },
    { id: 2, user_id: 'uT', email: 'jana@test.zenvoria.cz', name: 'Testovací Pečovatelka', slug: 'testovaci-praha', ...base },
  ]);
  const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: 'test-secret-1234567890', APP_URL: BASE, RESEND_API_KEY: '' };
  procs.push(spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: 'ignore' }));
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  const ids = (r) => r.data.caregivers.map((c) => c.id).sort();
  try {
    let r = await new Client().req('/api/bootstrap'); assert.deepEqual(ids(r), [1]);
    ok('návštěvník bez přihlášení vidí jen skutečnou pečovatelku');
    const fam = new Client(); await fam.login('fam@t.cz'); r = await fam.req('/api/bootstrap'); assert.deepEqual(ids(r), [1]);
    ok('skutečná rodina testovací pečovatelku nevidí');
    const tf = new Client(); await tf.login('rodina@test.zenvoria.cz'); r = await tf.req('/api/bootstrap'); assert.deepEqual(ids(r), [1, 2]);
    ok('testovací rodina vidí i testovací pečovatelku');
    let h = await (await fetch(BASE + '/hledat-peci')).text(); assert.ok(h.includes('Skutečná') && !h.includes('Testovací Pečovatelka'));
    h = await (await fetch(BASE + '/sitemap.xml')).text(); assert.ok(h.includes('skutecna-praha') && !h.includes('testovaci-praha'));
    h = await (await fetch(BASE + '/pecovatelka/testovaci-praha')).text(); assert.ok(!h.includes('Testovací Pečovatelka'));
    h = await (await fetch(BASE + '/pecovatelka/skutecna-praha')).text(); assert.ok(h.includes('Skutečná Pečovatelka'));
    ok('vyhledávací stránka, sitemap ani profilová adresa testovací pečovatelku neukážou');
    console.log('\nVŠE PROŠLO');
  } catch (e) { console.error('✗', e.message); kill(); process.exit(1); }
  kill(); process.exit(0);
})();
