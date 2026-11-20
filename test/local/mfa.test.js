// spustí napodobenou DB + server na portu 3100 a pak E2E test 2FA
const { spawn } = require('child_process');
const path = require('path');
const root = process.argv[2] || require('path').resolve(__dirname, '..', '..');
const here = __dirname;
const procs = [];
const kill = () => procs.forEach((p) => { try { p.kill(); } catch {} });
process.on('exit', kill);
const fake = spawn(process.execPath, [path.join(here, 'fake_postgrest.js'), root, '54321'], { stdio: 'inherit' });
procs.push(fake);
const env = { ...process.env, PORT: '3100', SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key', SESSION_SECRET: 'test-session-secret-0123456789', APP_URL: 'http://localhost:3100', RESEND_API_KEY: '', MAIL_ENABLED: 'false', STRIPE_SECRET_KEY: '', OPENAI_API_KEY: '' };
const srv = spawn(process.execPath, [path.join(root, 'server.js')], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
procs.push(srv);
let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
(async () => {
  for (let i = 0; i < 100; i++) { try { const r = await fetch('http://localhost:3100/api/health'); if (r.ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
  const t = spawn(process.execPath, [path.join(here, 'mfa.e2e.js'), 'http://localhost:3100'], { stdio: 'inherit' });
  t.on('exit', (code) => { if (code) console.log('\n--- server log (tail) ---\n' + log.split('\n').slice(-40).join('\n')); kill(); process.exit(code); });
})();
