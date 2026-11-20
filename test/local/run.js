#!/usr/bin/env node
'use strict';
/**
 * Lokální regresní testy ZENVORIA — spouští skutečný server.js proti napodobené
 * databázi (fake_postgrest.js, PostgREST v paměti). Nepotřebuje Supabase ani síť,
 * nic neposílá na ostrý web. Každá sada si pustí vlastní server na portu 3100
 * a databázi na 54321, takže běží jedna po druhé.
 *
 *   npm run test:local            # všechny sady
 *   node test/local/run.js city   # jen sady, jejichž název obsahuje „city“
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const filter = process.argv[2] || '';
const suites = fs.readdirSync(__dirname)
  .filter((f) => f.endsWith('.test.js') && f.includes(filter))
  .sort();

let failed = 0;
for (const f of suites) {
  const started = Date.now();
  console.log(`\n=== ${f} ===`);
  const r = spawnSync(process.execPath, [path.join(__dirname, f), root], { stdio: 'inherit', timeout: 5 * 60 * 1000 });
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${f} (${Math.round((Date.now() - started) / 1000)} s)`);
}
console.log(`\n${suites.length - failed}/${suites.length} sad prošlo`);
process.exit(failed ? 1 : 0);
