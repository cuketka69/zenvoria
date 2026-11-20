const { spawn } = require('child_process');
const path = require('path');
const root = process.argv[2] || require('path').resolve(__dirname, '..', '..'), here = __dirname;
const procs = []; const kill = () => procs.forEach((p) => { try { p.kill(); } catch {} }); process.on('exit', kill);
procs.push(spawn(process.execPath, [path.join(here, 'fake_postgrest.js'), root, '54321'], { stdio: 'ignore' }));
const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: 'test-secret-1234567890', APP_URL: 'http://localhost:3100', RESEND_API_KEY: '' };
procs.push(spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: 'ignore' }));
const setSeen = (iso) => fetch('http://127.0.0.1:54321/rest/v1/zenvoria_users?id=eq.u-cg', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ last_seen: iso }) });
const get = async () => (await fetch('http://localhost:3100/api/presence/caregiver/1')).json();
(async () => {
  for (let i = 0; i < 100; i++) { try { if ((await fetch('http://localhost:3100/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  const H = 3600e3, now = Date.now();
  const pragueMidnight = (() => { const d = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' }); for (let h = -3; h <= 3; h++) { const t = Date.parse(d + 'T00:00:00Z') - h * H; if (new Date(t).toLocaleString('en-GB', { timeZone: 'Europe/Prague', hour: '2-digit', hour12: false }) === '00' && new Date(t).toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' }) === d) return t; } })();
  const cases = [
    ['nikdy', null, null],
    ['před 30 s', new Date(now - 30e3).toISOString(), 'online'],
    ['před 20 min', new Date(now - 20 * 60e3).toISOString(), 'recent'],
    ['dnes ráno (po půlnoci, >1 h)', now - pragueMidnight > 2 * H ? new Date(pragueMidnight + 5 * 60e3).toISOString() : null, now - pragueMidnight > 2 * H ? 'today' : null],
    ['včera večer', new Date(pragueMidnight - 2 * H).toISOString(), now - (pragueMidnight - 2 * H) < H ? 'recent' : 'yesterday'],
    ['před 3 dny', new Date(now - 3 * 24 * H).toISOString(), 'week'],
    ['před 10 dny', new Date(now - 10 * 24 * H).toISOString(), null],
  ];
  let fail = 0;
  for (const [label, iso, expect] of cases) {
    if (label.startsWith('dnes') && !iso) { console.log('- přeskočeno (je krátce po půlnoci):', label); continue; }
    await setSeen(iso); const r = await get();
    const ok = r.activity === expect; if (!ok) fail++;
    console.log(ok ? '✓' : '✗', label.padEnd(30), '→', JSON.stringify(r));
  }
  console.log('lastSeen v odpovědi?', 'lastSeen' in (await get()) ? 'ANO (chyba)' : 'ne (dobře)');
  console.log(fail ? `\n${fail} SELHALO` : '\nVŠE PROŠLO');
  kill(); process.exit(fail ? 1 : 0);
})();
