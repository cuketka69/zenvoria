const { spawn } = require('child_process');
const path = require('path'), assert = require('assert/strict');
const root = process.argv[2] || require('path').resolve(__dirname, '..', '..');
const FAKE = path.join(__dirname, 'fake_postgrest.js');
const procs = []; const kill = () => procs.forEach((p) => { try { p.kill(); } catch {} }); process.on('exit', kill);
const DB = 'http://127.0.0.1:54321/rest/v1/', BASE = 'http://localhost:3100';
const post = (t, body) => fetch(DB + t, { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) });
const pragueDate = (off) => { const d = new Date(Date.now() + off * 864e5); return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' }); };
const dow = (key) => (new Date(key + 'T12:00:00Z').getUTCDay() + 6) % 7; // 0 = pondělí
(async () => {
  procs.push(spawn(process.execPath, [FAKE, root, '54321'], { stdio: 'ignore' }));
  for (let i = 0; i < 50; i++) { try { await fetch(DB + 'zenvoria_users'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  // pečovatelka 21: jen ve dny, kdy je ZÍTRA, 8–12 h; zítřek 8–10 obsazený objednávkou → čekáme zítra 10:00
  const tomorrow = pragueDate(1), dayAfter = pragueDate(2);
  const avail = Array.from({ length: 7 }, (_, i) => (i === dow(tomorrow) ? { on: true, from: '08:00', to: '12:00' } : { on: false, from: '08:00', to: '16:00' }));
  // pečovatelka 22: každý den 9–17, ale zítra i dnes dovolená → nejbližší pozítří 9:00
  const all = Array.from({ length: 7 }, () => ({ on: true, from: '09:00', to: '17:00' }));
  await post('zenvoria_caregivers', [
    { id: 21, name: 'A', verified: true, suspended: false, avail, blocked_dates: [], avail_overrides: {} },
    { id: 22, name: 'B', verified: true, suspended: false, avail: all, blocked_dates: [pragueDate(0), tomorrow], avail_overrides: {} },
    { id: 23, name: 'C', verified: true, suspended: false, avail: null, blocked_dates: [], avail_overrides: {} },
    { id: 24, name: 'D', verified: false, suspended: false, avail: all },
  ]);
  await post('zenvoria_orders', [{ id: 1, oid: 1, cid: 21, status: 'confirmed', date: tomorrow, time: '08:00', hours: 2 }]);
  const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: 'x-secret-123456789', APP_URL: BASE, RESEND_API_KEY: '' };
  procs.push(spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: 'ignore' }));
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  const get = async (id) => { const r = await fetch(BASE + `/api/caregivers/${id}/next-slot`); return { status: r.status, data: await r.json() }; };
  try {
    let r = await get(21); assert.deepEqual(r.data.slot, { date: tomorrow, time: '10:00' }); console.log('✓ obsazený 8–10 přeskočen → zítra 10:00', JSON.stringify(r.data));
    r = await get(22); assert.deepEqual(r.data.slot, { date: dayAfter, time: '09:00' }); console.log('✓ dovolená dnes i zítra → pozítří 9:00');
    r = await get(23); assert.equal(r.data.slot, null); assert.equal(r.data.byArrangement, true); console.log('✓ bez rozvrhu → „domluvou“ (nic nevymýšlí)');
    r = await get(24); assert.equal(r.status, 404); console.log('✓ neověřená pečovatelka → 404');
    const body = JSON.stringify((await get(21)).data); assert.ok(!body.includes('avail') && !body.includes('08:00')); console.log('✓ rozvrh ani obsazené časy se ven neposílají');
    console.log('\nVŠE PROŠLO');
  } catch (e) { console.error('✗', e.message); kill(); process.exit(1); }
  kill(); process.exit(0);
})();
