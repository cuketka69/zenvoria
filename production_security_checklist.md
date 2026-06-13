# ZENVORIA Production & Security Checklist

Datum: 2026-06-13

Tento checklist shrnuje, co je v aplikaci uz hotove, co je potreba rucne potvrdit v produkcnich sluzbach a co je potreba uklidit pred ostrym provozem.

## 1. Overeno v kodu a nasazene

- Session auth bezi pres podepsanou cookie.
- CSRF ochrana je zapnuta pro session API.
- Reset hesla pouziva one-time token.
- Zmena e-mailu je dvoukrokova:
  - potvrzeni puvodniho e-mailu odkazem
  - overeni noveho e-mailu kodem
- Auth endpointy maji rate limiting:
  - register
  - login
  - forgot password
  - reset password
  - change password
  - change email
- `/api/bootstrap` uz neunika plna data guestum a beznym uzivatelum.
- Ownership checks jsou doplnene pro:
  - orders
  - requests accept/decline
  - caregiver profile update
  - conversations/messages
- Chat rendering byl ztvrzen proti stored XSS.
- Dalsi UI templaty escaped user content.
- Security headery jsou nasazene:
  - `Content-Security-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- Audit logovani je nasazene:
  - auth akce
  - admin akce
  - audit viewer v adminu
  - CSV export
- Admin a broadcast endpointy maji whitelisty a validaci payloadu.
- User create endpointy maji server-side validaci:
  - orders
  - verifications
  - reviews
  - conversations
- Auth a message payloady maji server-side validaci:
  - register
  - login
  - forgot/reset password
  - change email
  - users/me/settings
  - messages

## 2. Potvrdit v Railway

Zkontroluj, ze jsou v produkci skutecne nastavene tyto Variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `RESEND_API_KEY`
- `MAIL_FROM`
- `APP_URL=https://www.zenvoria.cz`
- `NODE_ENV=production`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Doporucene:

- `AUDIT_ENABLED=true`
- explicitne nastavene rate limit promene, pokud chcete jine limity nez default

## 3. Potvrdit v Supabase

- Existuje tabulka `public.zenvoria_audit_logs`.
- Zaloha a obnova:
  - potvrdit, ze vite, jak obnovit data
  - potvrdit, ze projekt ma zapnute odpovidajici backupy podle vaseho planu
- Projit produkcni tabulky a odstranit test data, ktera nechcete drzet:
  - test users
  - test orders
  - test requests
  - test verifications
- Overit, ze service role key neni nikde mimo backend.

## 4. Potvrdit v Resend

- `MAIL_FROM` pouziva overenou domenu.
- Pokud chcete cisty branding, overit `zenvoria.cz` v Resend.
- Zkontrolovat:
  - SPF
  - DKIM
  - idealne DMARC
- Rucne overit doruceni mailu:
  - registrace
  - rezervace
  - forgot password
  - change email
  - verification result

## 5. Potvrdit ve Stripe

- `STRIPE_SECRET_KEY` je live klic, pokud uz jdete do ostreho provozu.
- `STRIPE_WEBHOOK_SECRET` odpovida produkcnimu webhooku.
- Webhook endpoint je aktivni a dorucuje eventy.
- Provest jeden live smoke test:
  - checkout
  - navrat do aplikace
  - aktivace premium
  - zruseni / zmena stavu

## 6. Manualni production smoke test

Projit v realnem browseru:

- Family:
  - registrace
  - login
  - objednavka
  - forgot password
  - reset hesla
  - zmena e-mailu
- Caregiver:
  - registrace
  - login
  - odeslani zadosti o overeni
  - uprava profilu
  - chat
- Admin:
  - login
  - schvaleni / zamitnuti verifikace
  - audit logy
  - broadcast
  - zmena tarifu

## 7. Uklid pred ostrym provozem

V pracovni slozce jsou necommitnute testovaci a pomocne soubory, ktere do produkcniho release procesu nepatri:

- `_*.json`
- `_*.txt`
- `_guest_smoke_cookie.txt`
- `_family_smoke_cookie.txt`
- `_cg_smoke_cookie.txt`
- `_admin_smoke_cookie.txt`
- `security_best_practices_report.md` pokud ho nechcete mit v repu

Rozhodnout:

- bud je smazat
- nebo pridat do `.gitignore`, pokud maji zustat lokalne

## 8. Doporucene dalsi kroky

- Pridat centralni monitoring chyb, napr. Sentry.
- Dodelat formalni release checklist pro kazdy deploy.
- Udelat kratky rollback plan:
  - kdo vraci deploy
  - jak se overi funkcnost po rollbacku
- Projit pravni texty:
  - obchodni podminky
  - ochrana osobnich udaju
  - cookies

## 9. Minimalni stav pro start produkce

Za minimum pro spusteni bych povazoval:

- vsechny Railway variables potvrzene
- Resend sender overeny
- audit log table potvrzena
- live Stripe webhook potvrzeny, pokud uz se spousti premium
- rucni smoke test family/caregiver/admin hotovy
- test data uklizena
