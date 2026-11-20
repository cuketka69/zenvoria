// Rozpis léků: rodina zadá léky v plánu péče, pečovatelka při návštěvě potvrdí podání / odmítnutí,
// rodina dostane upozornění při odmítnutí a při odchodu s neoznačeným lékem.
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
  const day = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  await post('zenvoria_users', [
    { id: 'uF', email: 'fam@t.cz', password_hash: hash, name: 'Marie Rodina', role: 'family', status: 'active', email_verified: true },
    { id: 'uC', email: 'cg@t.cz', password_hash: hash, name: 'Jana Pečovatelka', role: 'caregiver', status: 'active', email_verified: true },
    { id: 'uX', email: 'cg2@t.cz', password_hash: hash, name: 'Cizí Pečovatelka', role: 'caregiver', status: 'active', email_verified: true },
  ]);
  await post('zenvoria_caregivers', [
    { id: 11, user_id: 'uC', email: 'cg@t.cz', name: 'Jana Pečovatelka', verified: true, suspended: false, plan: 'premium' },
    { id: 12, user_id: 'uX', email: 'cg2@t.cz', name: 'Cizí Pečovatelka', verified: true, suspended: false, plan: 'premium' },
  ]);
  await post('zenvoria_orders', [{ id: 1, oid: 501, cid: 11, family_email: 'fam@t.cz', status: 'confirmed', date: day, time: '07:30', hours: 3 }]);
  const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: 'test-secret-1234567890', APP_URL: BASE, RESEND_API_KEY: '' };
  procs.push(spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: 'ignore' }));
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  try {
    const fam = new Client(); await fam.login('fam@t.cz');
    let r = await fam.req('/api/family-care-profile', { method: 'POST', body: { client: 'Babička', meds: [
      { name: 'Prestarium', dose: '5 mg', times: ['8:00', '20:00', 'blbost'] },
      { name: 'Godasal', dose: '100 mg', times: ['10.15'] },
      { name: 'Bez času', times: [] },
    ] } });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    const meds = r.data.profile.meds;
    assert.equal(meds.length, 2); assert.deepEqual(meds[0].times, ['08:00', '20:00']); assert.deepEqual(meds[1].times, ['10:15']); assert.ok(meds[0].id && meds[1].id && meds[0].id !== meds[1].id);
    ok('plán péče: časy normalizované (8:00 → 08:00, 10.15 → 10:15), neplatné a lék bez času zahozeny, id přidělena');
    const [pres] = meds;
    const cg = new Client(); await cg.login('cg@t.cz');
    const op = (b) => cg.req('/api/orders/501/care-ops', { method: 'POST', body: b });
    r = await op({ action: 'med', medId: pres.id, time: '20:00', status: 'given' }); assert.equal(r.status, 400); ok('lék mimo čas návštěvy (20:00 při 7:30–10:30) odmítnut');
    r = await fam.req('/api/orders/501/care-ops', { method: 'POST', body: { action: 'med', medId: pres.id, time: '08:00', status: 'given' } }); assert.equal(r.status, 403); ok('rodina podání léku nezaznamená (403)');
    const cg2 = new Client(); await cg2.login('cg2@t.cz');
    r = await cg2.req('/api/orders/501/care-ops', { method: 'POST', body: { action: 'med', medId: pres.id, time: '08:00', status: 'given' } }); assert.equal(r.status, 403); ok('cizí pečovatelka nemá přístup (403)');
    r = await op({ action: 'med', medId: pres.id, time: '08:00', status: 'refused' }); assert.equal(r.status, 200, JSON.stringify(r.data));
    let notes = (await fam.req('/api/notifications')).data.notifications.filter((n) => n.type === 'meds');
    assert.equal(notes.length, 1); assert.match(notes[0].title, /odmítl/); assert.match(notes[0].body, /Prestarium 5 mg \(08:00\)/); assert.equal(notes[0].link, 'order-detail:501');
    ok('odmítnutý lék → upozornění rodině: ' + notes[0].body);
    r = await op({ action: 'med', medId: pres.id, time: '08:00', status: 'given' }); assert.equal(r.status, 200);
    const log = r.data.operation.medsLog;
    assert.equal(log.length, 1); assert.equal(log[0].status, 'given'); ok('opravený záznam (Podáno) přepíše odmítnutí, žádný duplikát');
    // příchod / odchod: Godasal 10:15 zůstal neoznačený → upozornění
    const pin = (await fam.req('/api/orders/501/care-ops', { method: 'POST', body: { action: 'generate-pin' } })).data.generatedPin; assert.ok(/^\d{4}$/.test(pin), 'pin');
    assert.equal((await op({ action: 'check-in', pin })).status, 200);
    assert.equal((await op({ action: 'check-out', pin })).status, 200);
    notes = (await fam.req('/api/notifications')).data.notifications.filter((n) => n.type === 'meds');
    assert.equal(notes.length, 2); const miss = notes.find((n) => /označen/.test(n.title));
    assert.ok(miss && /Godasal 100 mg \(10:15\)/.test(miss.body) && !/Prestarium/.test(miss.body), JSON.stringify(notes));
    ok('odchod s neoznačeným lékem → upozornění jen na Godasal');
    console.log('\nVŠE PROŠLO');
  } catch (e) { console.error('✗', e.message); kill(); process.exit(1); }
  kill(); process.exit(0);
})();
