# Gjakova Run Club

Website mobile-first dhe backend për aplikimet e anëtarësimit të Gjakova Run Club. Frontend-i është statik; backend-i punon në Cloudflare Workers me D1. Email-et dërgohen përmes Resend.

## Funksionet

- Njoftime bazë, vendi/orari i takimit dhe numërim deri te vrapimi i ardhshëm (e diel, 11:00, Europe/Belgrade).
- Formular anëtarësimi: emër, mbiemër, datëlindje dhe email; aplikimi ruhet në D1.
- Email konfirmimi për aplikuesin dhe email njoftimi për klubin (kur konfigurohen Resend secrets).
- Moti aktual/parashikimi 7-ditor për Gjakovë, përfshirë parashikimin e së dielës (Open-Meteo).
- Këshilla të përgjithshme për vrapim dhe dizajn responsive.

## Zhvillim lokal

Kërkohen Node.js 20+ dhe llogari Cloudflare.

1. `npm install`
2. Krijo databazën: `npx wrangler d1 create gjakova-run-club-members`
3. Vendos `database_id` që kthen komanda në `wrangler.toml` (zëvendëso placeholder-in).
4. Zbato migrimin: `npx wrangler d1 migrations apply gjakova-run-club-members --local`
5. Nis faqen: `npm run dev`

## Publikimi në Cloudflare Workers (pa Netlify)

1. Hyr me `npx wrangler login`.
2. Krijo D1 dhe vendos ID-në në `wrangler.toml`.
3. Apliko migrimin në prodhim: `npx wrangler d1 migrations apply gjakova-run-club-members --remote`.
4. Në Cloudflare, konfiguro secrets (mos i vendos në GitHub):
   - `npx wrangler secret put RESEND_API_KEY`
   - `npx wrangler secret put VERIFIED_FROM_EMAIL` (adresë dërguese e verifikuar në Resend, p.sh. `Gjakova Run Club <noreply@domeni-juaj>`).
5. Konfiguro domenin e verifikuar në Resend dhe bëj deploy me `npm run deploy`.

Pa konfigurimin e Resend, aplikimet ruhen, por email-et nuk dërgohen; ndërfaqja e tregon këtë qartë. Email dërgues duhet të jetë domen i verifikuar nga Resend. Mos përdor fjalëkalimin e Gmail-it në kod. `CLUB_EMAIL` është konfigurim publik (adresa e klubit), jo sekret.

## Siguria dhe privatësia

- Çelësat mbahen si Cloudflare secrets, jo në kod/depo.
- Backend-i kontrollon formatin e të dhënave, kufijtë dhe origjinën e kërkesës; përdor honeypot për spam të thjeshtë.
- Databaza nuk ekspozohet në shfletues dhe nuk ka endpoint publik për leximin e aplikimeve.
- Aktivizo Cloudflare WAF/rate limiting për `POST /api/membership` para publikimit; vendos p.sh. kufi të arsyeshëm sipas trafikut real dhe monitoro false positives. Honeypot-i nuk zëvendëson rate limiting ose CAPTCHA.
- Kufizo qasjen te llogaritë Cloudflare/Resend me MFA dhe privilegjet minimale; mbaj secrets jashtë issue-ve, logjeve dhe komiteve.
- Datëlindja është e dhënë personale. Qasja dhe afati i ruajtjes duhet të përcaktohen nga klubi; fshiji aplikimet që nuk nevojiten më. Para përdorimit publik, publiko politikën e privatësisë dhe kushtet përkatëse.
- Mos e paraqit shërbimin si “plotësisht të sigurt”; siguria kërkon konfigurim, përditësime dhe monitorim të vazhdueshëm.

## Logo

`public/logo.svg` është shenjë provizore e krijuar për projektin, jo kopje e saktë e imazhit të bashkëngjitur. Zëvendësoje me logon origjinale të klubit (p.sh. `public/logo.png`) dhe përditëso referencat në `index.html` para publikimit.
