// Fotky se neposílají uvnitř úvodních dat (bootstrap), ale jako samostatná adresa s otiskem → menší a rychlejší start.
const { spawn } = require('child_process');
const path = require('path'), assert = require('assert/strict');
const root = process.argv[2] || require('path').resolve(__dirname, '..', '..'), here = __dirname;
const procs = []; const kill = () => procs.forEach((p) => { try { p.kill(); } catch {} }); process.on('exit', kill);
const DB = 'http://127.0.0.1:54321/rest/v1/', BASE = 'http://localhost:3100';
const post = (t, body) => fetch(DB + t, { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) });
const dbGet = async (t, q) => (await fetch(DB + t + '?' + q)).json();
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
  const sharp = require(path.join(root, 'node_modules/sharp'));
  const img = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#2a5' } }).webp().toBuffer();
  const photo = 'data:image/webp;base64,' + img.toString('base64');
  await post('zenvoria_users', [{ id: 'uC', email: 'cg@t.cz', password_hash: hash, name: 'Jana Pečovatelka', role: 'caregiver', status: 'active', email_verified: true }]);
  await post('zenvoria_caregivers', [{ id: 11, user_id: 'uC', email: 'cg@t.cz', name: 'Jana Pečovatelka', verified: true, suspended: false, plan: 'premium', country: 'cz', lat: 50.0, lng: 14.0, services: ['osobni'], rate: 300, photo }]);
  const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: 'test-secret-1234567890', APP_URL: BASE, RESEND_API_KEY: '' };
  procs.push(spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: 'ignore' }));
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  try {
    const anon = new Client();
    let r = await anon.req('/api/bootstrap'); assert.equal(r.status, 200);
    const cg = r.data.caregivers.find((c) => c.id === 11); assert.ok(cg, 'pečovatelka v datech');
    assert.match(cg.photo, /^\/api\/photo\/cg\/11\?v=[0-9a-f]{16}$/); assert.ok(!JSON.stringify(r.data).includes('base64'));
    ok('úvodní data obsahují jen adresu fotky, žádný base64: ' + cg.photo);
    let f = await fetch(BASE + cg.photo); assert.equal(f.status, 200); assert.equal(f.headers.get('content-type'), 'image/webp');
    assert.match(f.headers.get('cache-control'), /immutable/); assert.deepEqual(Buffer.from(await f.arrayBuffer()), img);
    ok('fotka se stáhne jako obrázek s trvalou mezipamětí (stejné bajty)');
    f = await fetch(BASE + '/api/photo/cg/11?v=0000000000000000'); assert.equal(f.status, 404);
    f = await fetch(BASE + '/api/photo/cg/11'); assert.equal(f.status, 404);
    f = await fetch(BASE + '/api/photo/x/11?v=' + cg.photo.slice(-16)); assert.equal(f.status, 404);
    ok('bez správného otisku nebo s neznámým typem → 404');
    const me = new Client(); await me.login('cg@t.cz');
    r = await me.req('/api/caregivers/11', { method: 'PATCH', body: { photo: cg.photo, bio: 'Ahoj' } }); assert.equal(r.status, 200, JSON.stringify(r.data));
    const row = (await dbGet('zenvoria_caregivers', 'id=eq.11'))[0]; assert.equal(row.photo, photo); assert.equal(row.bio, 'Ahoj');
    ok('poslaná zpět adresa fotky nepřepíše uložený obrázek');
    console.log('\nVŠE PROŠLO');
  } catch (e) { console.error('✗', e.message); kill(); process.exit(1); }
  kill(); process.exit(0);
})();
