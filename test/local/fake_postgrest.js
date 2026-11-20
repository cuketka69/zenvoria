// Minimální napodobenina Supabase PostgREST v paměti — jen pro lokální test 2FA toku.
const http = require('http');
const bcrypt = require(require('path').join(process.argv[2], 'node_modules/bcryptjs'));
const port = Number(process.argv[3] || 54321);
const db = {
  zenvoria_users: [
    { id: 'u-admin', email: 'admin@test.local', password_hash: bcrypt.hashSync('Heslo123', 8), name: 'Test Admin', role: 'admin', status: 'active', email_verified: true, init: 'TA', public_id: 'p1' },
    { id: 'u-fam', email: 'fam@test.local', password_hash: bcrypt.hashSync('Heslo123', 8), name: 'Test Rodina', role: 'family', status: 'active', email_verified: true, init: 'TR', public_id: 'p2' },
  ],
  zenvoria_settings: [],
  zenvoria_caregivers: [{ id: 1, user_id: 'u-cg', name: 'Test Pečovatelka', verified: true }],
  zenvoria_conversations: [{ id: 1, user_a: 'u-fam', user_b: 'u-cg' }, { id: 2, user_a: 'u-cg', user_b: 'u-x' }],
  zenvoria_messages: (() => { const out = []; const base = Date.now() - 5 * 24 * 3600e3; let id = 1;
    [[1, 40], [1, 25], [2, 55], [1, 35], [2, 70]].forEach(([cid, mins], i) => { const t = base + i * 6 * 3600e3; out.push({ id: id++, conversation_id: cid, sender_id: cid === 1 ? 'u-fam' : 'u-x', created_at: new Date(t).toISOString() }); out.push({ id: id++, conversation_id: cid, sender_id: cid === 1 ? 'u-fam' : 'u-x', created_at: new Date(t + 5 * 60e3).toISOString() }); out.push({ id: id++, conversation_id: cid, sender_id: 'u-cg', created_at: new Date(t + mins * 60e3).toISOString() }); });
    return out; })(),
};
db.zenvoria_users.push({ id: 'u-cg', email: 'cg@test.local', password_hash: 'x', name: 'Test Pečovatelka', role: 'caregiver', status: 'active', last_seen: null });
let seq = 1000;
function parse(q) {
  const filters = []; let limit = null;
  for (const part of q.split('&').filter(Boolean)) {
    const i = part.indexOf('='); const k = decodeURIComponent(part.slice(0, i)); const v = decodeURIComponent(part.slice(i + 1));
    if (k === 'limit') limit = Number(v);
    else if (['select', 'order', 'offset', 'on_conflict'].includes(k)) continue;
    else if (k === 'or') { const m = v.match(/^\((.*)\)$/); const alts = m[1].split(',').map((x) => { const [col, op, ...rest] = x.split('.'); return [col, op + '.' + rest.join('.')]; }); filters.push(['__or', alts]); }
    else filters.push([k, v]);
  }
  return { filters, limit };
}
function match(row, filters) {
  return filters.every(([k, v]) => {
    if (k === '__or') return v.some((f) => match(row, [f]));
    if (v.startsWith('eq.')) return String(row[k]) === v.slice(3);
    if (v.startsWith('ilike.')) return String(row[k] || '').toLowerCase() === v.slice(6).toLowerCase();
    if (v === 'is.null') return row[k] == null;
    if (v.startsWith('gte.')) return String(row[k]) >= v.slice(4);
    if (v.startsWith('lte.')) return String(row[k]) <= v.slice(4);
    if (v.startsWith('in.(')) return v.slice(4, -1).split(',').includes(String(row[k]));
    return true;
  });
}
http.createServer((req, res) => {
  const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => {
    const [p, q = ''] = req.url.split('?'); const table = p.replace('/rest/v1/', '');
    const rows = db[table] || (db[table] = []);
    const { filters, limit } = parse(q); const prefer = String(req.headers.prefer || '');
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null;
    const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(data === undefined ? '' : JSON.stringify(data)); };
    if (req.method === 'GET') { let out = rows.filter((r) => match(r, filters)); if (limit) out = out.slice(0, limit); return send(200, out); }
    if (req.method === 'POST') {
      const items = Array.isArray(body) ? body : [body]; const out = [];
      for (const it of items) {
        const pk = table === 'zenvoria_settings' ? 'key' : 'id';
        const ex = it[pk] != null && rows.find((r) => r[pk] === it[pk]);
        if (ex) { if (prefer.includes('ignore-duplicates')) { continue; } Object.assign(ex, it); out.push(ex); }
        else { const row = { id: it.id || ++seq, created_at: new Date().toISOString(), ...it }; rows.push(row); out.push(row); }
      }
      return prefer.includes('return=minimal') ? send(201) : send(201, out);
    }
    if (req.method === 'PATCH') { const out = rows.filter((r) => match(r, filters)); out.forEach((r) => Object.assign(r, body)); return prefer.includes('return=minimal') ? send(204) : send(200, out); }
    if (req.method === 'DELETE') { db[table] = rows.filter((r) => !match(r, filters)); return send(204); }
    send(405, { message: 'nope' });
  });
}).listen(port, () => console.log('fake postgrest on', port));
