const { spawn } = require('child_process');
const path = require('path'), assert = require('assert/strict');
const root = process.argv[2] || require('path').resolve(__dirname, '..', '..');
const FAKE = path.join(__dirname, 'fake_postgrest.js');
const procs = []; const kill = () => procs.forEach((p) => { try { p.kill(); } catch {} }); process.on('exit', kill);
const DB = 'http://127.0.0.1:54321/rest/v1/', BASE = 'http://localhost:3100';
const post = (t, body) => fetch(DB + t, { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) });
(async () => {
  procs.push(spawn(process.execPath, [FAKE, root, '54321'], { stdio: 'ignore' }));
  for (let i = 0; i < 50; i++) { try { await fetch(DB + 'zenvoria_users'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  await post('zenvoria_caregivers', [
    { id: 1, slug: 'jana', name: 'Jana Novotná', loc: 'Praha 6', verified: true, suspended: false, country: 'cz', rating: 4.9, rate: 300, services: ['osobni'] },
    { id: 2, slug: 'eva', name: 'Eva Malá', loc: 'Brno', verified: true, suspended: false, country: 'cz', rating: 4.8, rate: 280, services: ['nakupy'] },
    { id: 3, slug: 'olga', name: 'Olga Krátká', loc: 'Brno, Jihomoravský kraj', verified: true, suspended: false, country: 'cz', rating: 4.7, rate: 260, services: ['nocni'] },
    { id: 4, slug: 'tajna', name: 'Neověřená Osoba', loc: 'Ústí nad Labem', verified: false, suspended: false, country: 'cz' },
    { id: 5, slug: 'ondrejka', name: 'Marta Ondřejovská', loc: 'Ondřejov', verified: true, suspended: false, country: 'cz', rating: 5, rate: 250, services: ['osobni'] },
  ]);
  const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'k', SESSION_SECRET: 'x-secret-123456789', APP_URL: BASE, RESEND_API_KEY: '' };
  procs.push(spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: 'ignore' }));
  for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE + '/api/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  try {
    let r = await fetch(BASE + '/pecovatelky/brno'); let h = await r.text();
    assert.equal(r.status, 200); assert.match(h, /<h1>Pečovatelky Brno<\/h1>/); assert.match(h, /Eva Malá/); assert.match(h, /Olga Krátká/); assert.ok(!h.includes('Jana Novotná</'), 'Jana nemá být v seznamu Brna');
    assert.match(h, /<title>Pečovatelka Brno — ověřená péče o seniory \| ZENVORIA<\/title>/); assert.match(h, /rel="canonical" href="[^"]*\/pecovatelky\/brno"/);
    console.log('✓ /pecovatelky/brno: nadpis, title, canonical, 2 pečovatelky z Brna, bez Prahy');
    assert.match(h, /2 ověřené pečovatelky/); console.log('✓ správné skloňování („2 ověřené pečovatelky“)');
    assert.match(h, /href="\/pecovatelky\/praha"|href="\/pecovatelky\/ondrejov"/); console.log('✓ odkazy na další města');
    const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    assert.ok(ld.some((j) => j['@type'] === 'ItemList' && j.itemListElement.length === 2)); console.log('✓ strukturovaná data ItemList (2 položky) platná');
    r = await fetch(BASE + '/pecovatelky/ondrejov'); h = await r.text(); assert.equal(r.status, 200); assert.match(h, /Pečovatelky Ondřejov/); console.log('✓ diakritika: /pecovatelky/ondrejov → „Pečovatelky Ondřejov“');
    r = await fetch(BASE + '/pecovatelky/Brno', { redirect: 'manual' }); assert.equal(r.status, 301); assert.equal(r.headers.get('location'), '/pecovatelky/brno'); console.log('✓ /pecovatelky/Brno → 301 na /pecovatelky/brno');
    r = await fetch(BASE + '/pecovatelky/usti-nad-labem'); assert.equal(r.status, 404); console.log('✓ město jen s neověřenou uchazečkou → 404 (žádná prázdná stránka)');
    r = await fetch(BASE + '/sitemap.xml'); h = await r.text(); assert.match(h, /\/pecovatelky\/brno</); assert.match(h, /\/pecovatelky\/praha</); assert.ok(!h.includes('usti')); console.log('✓ sitemap obsahuje stránky měst');
    r = await fetch(BASE + '/hledat-peci'); h = await r.text(); assert.match(h, /Pečovatelky podle města/); assert.match(h, /href="\/pecovatelky\/brno"/); console.log('✓ /hledat-peci odkazuje na stránky měst');
    console.log('\nVŠE PROŠLO');
  } catch (e) { console.error('✗', e.message); kill(); process.exit(1); }
  kill(); process.exit(0);
})();
