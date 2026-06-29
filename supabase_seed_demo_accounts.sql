-- ZENVORIA demo účty
-- Heslo pro všechny: Demo1234
-- Spusť v Supabase SQL editoru (project ref xnouphqbepljogztwgxj).
-- bcrypt hashe vygenerované přes bcryptjs (cost 10), shodné s tím, co používá server.js při loginu.

insert into public.zenvoria_users (email, password_hash, name, role, init, status)
values
  ('admin@zenvoria.cz',        '$2a$10$Ezd0Nfv.3Z5M03MFViXo.eUzmkr.1lcbTbYo9CbyYM5oSaDURVCnW', 'Admin Demo',       'admin',     'AD', 'active'),
  ('rodina@zenvoria.cz',       '$2a$10$FHGP7wcT/qv0MieZK5FlY.oq9gQpNWaGmhFUHk0ayJOlEWLrUY1qO', 'Rodina Demo',      'family',    'RD', 'active'),
  ('pecovatelka@zenvoria.cz',  '$2a$10$2BuIWH7ncPtMidQ6awsdLuXDaYPBKT6HYeQdL0Q93btPyF/mDtRSm', 'Pečovatelka Demo', 'caregiver', 'PD', 'active')
on conflict (email) do update
  set password_hash = excluded.password_hash,
      name          = excluded.name,
      role          = excluded.role,
      init          = excluded.init,
      status        = 'active';

-- kontrola:
-- select id, email, name, role, status from public.zenvoria_users order by id;
