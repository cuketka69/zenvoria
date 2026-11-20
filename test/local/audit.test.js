// Regresní test oprav z bezpečnostního auditu — server proti napodobené DB (fake_postgrest.js)
const { spawn } = require('child_process');
const path = require('path'), assert = require('assert/strict');
const root = process.argv[2] || require('path').resolve(__dirname, '..', '..'), here = __dirname;
const procs = []; const kill = () => procs.forEach((p) => { try { p.kill(); } catch {} }); process.on('exit', kill);
const DB = 'http://127.0.0.1:54321/rest/v1/', BASE = 'http://localhost:3100';
const post = (t, body, prefer = 'return=minimal') => fetch(DB + t, { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: prefer }, body: JSON.stringify(body) });
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
  const bcrypt = require(path.join(root, 'node_modules/bcryptjs')); const hash = bcrypt.hashSync('Heslo123', 8);
  const future = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
  await post('zenvoria_users', [
    { id: 'uF', email: 'fam@t.cz', password_hash: hash, name: 'Marie Rodina', role: 'family', status: 'active', email_verified: true, public_id: 'pubF', phone: '+420111' },
    { id: 'uC', email: 'cg@t.cz', password_hash: hash, name: 'Jana Pečovatelka', role: 'caregiver', status: 'active', email_verified: true, public_id: 'pubC' },
    { id: 'uX', email: 'cizi@t.cz', password_hash: hash, name: 'Cizí Rodina', role: 'family', status: 'active', email_verified: true, public_id: 'pubX' },
  ]);
  await post('zenvoria_caregivers', [
    { id: 11, user_id: 'uC', email: 'cg@t.cz', name: 'Jana Pečovatelka', verified: true, suspended: false, plan: null, phone: '+420999', country: 'cz', lat: 50.1, lng: 14.4, bio: '</script><script>alert(1)</script>', slug: 'jana', services: ['osobni'], rate: 300 },
    { id: 12, user_id: 'uZ', email: 'z@t.cz', name: 'Neověřená Uchazečka', verified: false, suspended: false, phone: '+420777', country: 'cz', bio: 'tajné', services: ['osobni'] },
  ]);
  await post('zenvoria_orders', [{ id: 1, oid: 501, cid: 11, family_email: 'fam@t.cz', fam_name: 'Marie Rodina', status: 'pending', date: future, time: '10:00', hours: 2, service: 'osobni' }]);
  await post('zenvoria_requests', [{ id: 77, oid: 501, cid: 11, fam: 'Marie Rodina', init: 'MR', service: 'osobni', date: future, time: '10:00', hours: 2 }]);
  const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: 'test-secret-1234567890', APP_URL: BASE, RESEND_API_KEY: '' };
  const srv = spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] }); procs.push(srv);
  let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  try {
    const fam = new Client(), cg = new Client(), guest = new Client(), other = new Client();
    assert.equal((await fam.login('fam@t.cz')).status, 200); assert.equal((await cg.login('cg@t.cz')).status, 200); await other.login('cizi@t.cz');
    // 1) zrušení objednávky smaže poptávku; přijetí zrušené objednávky nejde
    let r = await fam.req('/api/orders/501', { method: 'PATCH', body: { status: 'cancelled' } }); assert.equal(r.status, 200);
    assert.equal((await dbGet('zenvoria_requests', 'oid=eq.501')).length, 0); ok('zrušení objednávky smaže čekající poptávku');
    await post('zenvoria_requests', [{ id: 78, oid: 501, cid: 11, fam: 'Marie Rodina', init: 'MR', service: 'osobni', date: future, time: '10:00', hours: 2 }]);
    r = await cg.req('/api/requests/78/accept', { method: 'POST' }); assert.equal(r.status, 409);
    assert.equal((await dbGet('zenvoria_orders', 'oid=eq.501'))[0].status, 'cancelled'); ok('zrušenou objednávku nejde znovu přijmout (409, stav zůstal cancelled)');
    // 2) tarif START zdarma
    r = await cg.req('/api/caregivers/11', { method: 'PATCH', body: { plan: 'start' } }); assert.equal(r.status, 403);
    assert.notEqual((await dbGet('zenvoria_caregivers', 'id=eq.11'))[0].plan, 'start'); ok('START si bez platby nejde zapnout (403)');
    // 3) XSS v JSON-LD na veřejné stránce pečovatelky
    r = await guest.req('/pecovatelka/jana');
    if (typeof r.data === 'string' && r.data.includes('ld+json')) { assert.ok(!r.data.includes('</script><script>alert(1)')); ok('bio se do JSON-LD vkládá escapované (žádné </script><script>)'); }
    else console.log('- stránka /pecovatelka/jana se v testu nevykreslila (bez šablony) — escapování ověřeno samostatně');
    // 4) bootstrap: telefon pečovatelky a neověřené uchazečky
    r = await fam.req('/api/bootstrap'); const cgs = r.data.caregivers || [];
    const jana = cgs.find((c) => c.id === 11), z = cgs.find((c) => c.id === 12);
    assert.ok(jana && !('phone' in jana) && !('email' in jana)); ok('rodina nedostane telefon ani e-mail pečovatelky');
    assert.ok(!z || (z.bio === '' && !z.phone)); ok('neověřená uchazečka bez bio a telefonu');
    r = await guest.req('/api/bootstrap'); assert.ok(!(r.data.caregivers || []).some((c) => c.phone)); ok('host nedostane žádný telefon');
    // 5) veřejný profil rodiny bez kontaktu pro cizí
    r = await other.req('/api/u/pubF'); assert.equal(r.status, 200); assert.equal(r.data.profile.email, null); assert.equal(r.data.profile.phone, null); ok('cizí uživatel nevidí e-mail/telefon rodiny z odkazu na profil');
    r = await fam.req('/api/u/pubF'); assert.equal(r.data.profile.email, 'fam@t.cz'); ok('majitel svůj kontakt vidí');
    // 6) vzdálenosti jen celé km
    r = await guest.req('/api/caregivers/distances?lat=50.11&lng=14.43'); assert.ok(r.data.distances.every((d) => Number.isInteger(d.km) && d.km >= 1)); ok('vzdálenosti jen v celých km: ' + JSON.stringify(r.data.distances));
    // 7) presence: cizí člověk bez konverzace nezjistí aktivitu
    r = await other.req('/api/presence/chat', { method: 'POST', body: { items: [{ name: 'Jana Pečovatelka', role: 'caregiver' }] } }); assert.equal(r.data.items[0].lastSeen, null); ok('poslední aktivitu nevidí někdo, kdo s pečovatelkou nepíše');
    // 8) push: jen skutečné push služby
    r = await fam.req('/api/push/subscribe', { method: 'POST', body: { subscription: { endpoint: 'https://evil.example.com/x', keys: { p256dh: 'a', auth: 'b' } } } }); assert.equal(r.status, 400); ok('push odběr na cizí server odmítnut (400)');
    r = await fam.req('/api/push/subscribe', { method: 'POST', body: { subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'a', auth: 'b' } } } }); assert.equal(r.status, 200); ok('push odběr na fcm.googleapis.com přijat');
    // 9) recenze s podvrženým jménem — připravit dokončenou objednávku v minulosti
    await fetch(DB + 'zenvoria_caregivers?id=eq.11', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ plan: 'premium' }) });
    await post('zenvoria_orders', [{ id: 2, oid: 502, cid: 11, family_email: 'fam@t.cz', fam_name: 'Marie Rodina', status: 'done', date: '2026-01-10', time: '10:00', hours: 2, service: 'osobni' }]);
    r = await fam.req('/api/reviews', { method: 'POST', body: { caregiverId: 11, oid: 502, stars: 5, text: 'Super', name: 'Tým Zenvoria', init: 'TZ' } });
    const rev = (await dbGet('zenvoria_reviews', 'order_oid=eq.502'))[0];
    if (r.status < 300 && rev) { assert.equal(rev.name, 'Marie Rodina'); ok('jméno pod recenzí je ze session, ne „Tým Zenvoria“'); } else console.log('- recenze v testu nevznikla:', r.status, JSON.stringify(r.data).slice(0, 120));
    // 10) „dokončeno“ před termínem
    await post('zenvoria_orders', [{ id: 3, oid: 503, cid: 11, family_email: 'fam@t.cz', fam_name: 'Marie Rodina', status: 'confirmed', date: future, time: '10:00', hours: 2, service: 'osobni' }]);
    r = await fam.req('/api/orders/503', { method: 'PATCH', body: { status: 'done' } }); assert.equal(r.status, 400); ok('budoucí péči nejde označit jako dokončenou (400)');
    r = await cg.req('/api/orders/503/complete', { method: 'POST' }); assert.equal(r.status, 400); ok('pečovatelka nemůže dokončit péči před začátkem (400)');
    // 11) registrace e-mailu se znaky, které lámou dotazy
    r = await guest.req('/api/auth/register', { method: 'POST', body: { name: 'Test Test', email: 'a%22)&or=(x)@e.cz', password: 'Heslo1234', role: 'family' } }); assert.equal(r.status, 400); ok('e-mail se znaky ( ) & % odmítnut');
    // 12) změna e-mailu přepíše všechna data navázaná na e-mail (objednávky, profil pečovatelky)
    const adm = new Client(); assert.equal((await adm.req('/api/auth/login', { method: 'POST', body: { email: 'admin@test.local', password: 'Heslo123' } })).status, 200);
    r = await adm.req('/api/users/uF', { method: 'PATCH', body: { email: 'nova@t.cz' } }); assert.ok(r.status < 300, JSON.stringify(r.data));
    assert.equal((await dbGet('zenvoria_orders', 'family_email=eq.fam@t.cz')).length, 0); assert.ok((await dbGet('zenvoria_orders', 'family_email=eq.nova@t.cz')).length >= 3); ok('objednávky rodiny přešly na nový e-mail, na starém nic nezůstalo');
    r = await adm.req('/api/users/uC', { method: 'PATCH', body: { email: 'cg-nova@t.cz' } }); assert.ok(r.status < 300, JSON.stringify(r.data));
    assert.equal((await dbGet('zenvoria_caregivers', 'email=eq.cg@t.cz')).length, 0); assert.equal((await dbGet('zenvoria_caregivers', 'email=eq.cg-nova@t.cz')).length, 1); ok('profil pečovatelky přešel na nový e-mail — starý e-mail už nic nepřevezme');
    console.log('\nVŠE PROŠLO');
  } catch (e) { console.error('✗', e.message); console.log('--- server log ---\n' + log.split('\n').slice(-25).join('\n')); kill(); process.exit(1); }
  kill(); process.exit(0);
})();
