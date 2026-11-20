// Druhá vlna oprav: odhlášení po změně hesla, přejmenování ověřené pečovatelky, minimální km, přílohy zvlášť
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
    return { status: r.status, data, type: r.headers.get('content-type') };
  }
  login(email, pw = 'Heslo123') { return this.req('/api/auth/login', { method: 'POST', body: { email, password: pw } }); }
}
const ok = (m) => console.log('✓', m);
(async () => {
  procs.push(spawn(process.execPath, [path.join(here, 'fake_postgrest.js'), root, '54321'], { stdio: 'ignore' }));
  for (let i = 0; i < 50; i++) { try { await fetch(DB + 'zenvoria_users'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  const bcrypt = require(path.join(root, 'node_modules/bcryptjs')); const hash = bcrypt.hashSync('Heslo123', 8);
  const future = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
  await post('zenvoria_users', [
    { id: 'uF', email: 'fam@t.cz', password_hash: hash, name: 'Marie Rodina', role: 'family', status: 'active', email_verified: true },
    { id: 'uC', email: 'cg@t.cz', password_hash: hash, name: 'Jana Pečovatelka', role: 'caregiver', status: 'active', email_verified: true },
  ]);
  await post('zenvoria_caregivers', [{ id: 11, user_id: 'uC', email: 'cg@t.cz', name: 'Jana Pečovatelka', verified: true, suspended: false, plan: 'premium', country: 'cz', lat: 50.0, lng: 14.0, services: ['osobni'], rate: 300, km_price: 10, avail: null }]);
  const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: 'test-secret-1234567890', APP_URL: BASE, RESEND_API_KEY: '' };
  const srv = spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] }); procs.push(srv);
  let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  try {
    // 1) změna hesla odhlásí ostatní zařízení, aktuální zůstane přihlášené
    const a = new Client(), b = new Client();
    await a.login('fam@t.cz'); await b.login('fam@t.cz');
    assert.equal((await b.req('/api/auth/me')).data.user.email, 'fam@t.cz');
    let r = await a.req('/api/auth/change-password', { method: 'POST', body: { current: 'Heslo123', next: 'NoveHeslo9' } }); assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal((await a.req('/api/auth/me')).data.user && (await a.req('/api/auth/me')).data.user.email, 'fam@t.cz'); ok('zařízení, kde se heslo měnilo, zůstalo přihlášené');
    r = await b.req('/api/auth/me'); assert.equal(r.data.user, null); ok('druhé zařízení (stará session) je po změně hesla odhlášené');
    const c = new Client(); assert.equal((await c.login('fam@t.cz', 'NoveHeslo9')).status, 200); ok('přihlášení novým heslem funguje');
    // starší session bez otisku (vytvořená před touto změnou) zůstane platná a otisk se doplní
    // 2) ověřená pečovatelka si nesmí změnit jméno
    const cg = new Client(); await cg.login('cg@t.cz');
    r = await cg.req('/api/users/me/profile', { method: 'PATCH', body: { name: 'MUDr. Někdo Jiný', titul: null } }); assert.equal(r.status, 403); ok('ověřená pečovatelka si nezmění jméno sama (403)');
    r = await cg.req('/api/caregivers/11', { method: 'PATCH', body: { name: 'Někdo Jiný' } }); assert.equal(r.status, 403); ok('ani přes úpravu profilu pečovatelky (403)');
    r = await cg.req('/api/users/me/profile', { method: 'PATCH', body: { name: 'Jana Pečovatelka', titul: null, phone: '+420 777 111 222' } }); assert.equal(r.status, 200); ok('změna telefonu se stejným jménem projde');
    // 3) minimální vzdálenost: rodina zadá 0 km, adresa je ~55 km od pečovatelky
    r = await c.req('/api/orders', { method: 'POST', body: { cid: 11, service: 'osobni', date: future, time: '10:00', hours: 2, addr: 'Kolín 1', note: '', km: 0, lat: 50.03, lng: 14.77 } });
    assert.ok(r.status < 300, JSON.stringify(r.data));
    const ord = (await dbGet('zenvoria_orders', 'family_email=eq.fam@t.cz'))[0];
    assert.ok(ord.km >= 50, 'km=' + ord.km); ok(`zadáno 0 km, uloženo ${ord.km} km (vzdušná čára)`);
    // 4) příloha uložená mimo společný záznam a jde stáhnout
    await fetch(DB + 'zenvoria_orders?oid=eq.' + ord.oid, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'confirmed' }) });
    const png = 'data:image/png;base64,' + require(path.join(root, 'node_modules/sharp')) && (await require(path.join(root, 'node_modules/sharp'))({ create: { width: 4, height: 4, channels: 3, background: '#0a0' } }).png().toBuffer()).toString('base64');
    r = await c.req(`/api/orders/${ord.oid}/care-ops`, { method: 'POST', body: { action: 'attachment', name: 'foto.png', type: 'image/png', data: 'data:image/png;base64,' + png } });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    const opsRow = (await dbGet('zenvoria_settings', 'key=eq.orderCareOpsV1'))[0];
    const att = opsRow.value.find((o) => o.oid === ord.oid).attachments[0];
    assert.ok(att.stored && !att.data); ok('ve společném záznamu je jen popis přílohy, ne její obsah');
    assert.equal((await dbGet('zenvoria_settings', `key=eq.orderCareAttachV1:${ord.oid}:1`)).length, 1); ok('obsah přílohy je ve vlastním záznamu');
    r = await c.req(`/api/orders/${ord.oid}/attachments/1`); assert.equal(r.status, 200); assert.match(r.type || '', /^image\//); ok('příloha jde stáhnout (' + r.type + ')');
    // 5) chybějící poloha nesmí být 0,0 (dřív Number(null) = 0 → „5 735 km“ / dojezd do Afriky)
    const f2 = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
    r = await c.req('/api/orders', { method: 'POST', body: { cid: 11, service: 'osobni', date: f2, time: '10:00', hours: 2, addr: 'Bez mapy 1', note: '', km: 3, lat: null, lng: null } });
    assert.ok(r.status < 300, JSON.stringify(r.data));
    const o2 = (await dbGet('zenvoria_orders', 'date=eq.' + f2))[0];
    assert.equal(o2.lat, null); assert.equal(o2.km, 3); ok('objednávka bez polohy: lat=null, km zůstalo 3 (ne 1000)');
    await fetch(DB + 'zenvoria_caregivers?id=eq.11', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ verified: false }) });
    r = await cg.req('/api/caregivers/11', { method: 'PATCH', body: { loc: 'Kolín', lat: null, lng: null } }); assert.ok(r.status < 300, JSON.stringify(r.data));
    const cgRow = (await dbGet('zenvoria_caregivers', 'id=eq.11'))[0]; assert.equal(cgRow.lat, null); assert.equal(cgRow.lng, null); ok('pečovatelka bez špendlíku: poloha null (ne 0,0) — dohledá ji noční úloha');
    r = await new Client().req('/api/caregivers/distances?lat=50.08&lng=14.42'); assert.ok(!r.data.distances.some((d) => d.km > 4000)); ok('ve vzdálenostech nejsou nesmyslné tisíce km');
    console.log('\nVŠE PROŠLO');
  } catch (e) { console.error('✗', e.message); console.log('--- server log ---\n' + log.split('\n').slice(-25).join('\n')); kill(); process.exit(1); }
  kill(); process.exit(0);
})();
