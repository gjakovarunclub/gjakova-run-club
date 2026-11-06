# Gjakova Run Club

Website mobile-first dhe backend për aplikimet e anëtarësimit të Gjakova Run Club. Frontend-i është statik; backend-i punon në Cloudflare Workers me D1. Email-et dërgohen përmes Resend.

## Funksionet

- Informacion për takimin javor dhe numërim deri te vrapimi i ardhshëm (e diel, 11:00, Europe/Belgrade).
- Formular anëtarësimi: emër, mbiemër, datëlindje dhe email; aplikimi ruhet në D1.
- Email konfirmimi për aplikuesin dhe email njoftimi për klubin (kur konfigurohen Resend secrets).
- Moti aktual/parashikimi 7-ditor për Gjakovë (Open-Meteo).
- Këshilla të përgjithshme për vrapim dhe dizajn responsive.

## Publikimi në Cloudflare Workers (pa Netlify)

Këta hapa kërkojnë hyrje në llogarinë Cloudflare të klubit dhe në Resend. **Unë nuk kam qasje në ato llogari, prandaj nuk mund ta krijoj databazën, vendos secrets ose ta publikoj faqen nga këtu.** Mos dërgo këtu fjalëkalime, API keys apo tokenë.

1. Në kompjuter, klono repo-n dhe instalo Node.js 20+:
   ```bash
   git clone https://github.com/gjakovarunclub/gjakova-run-club.git
   cd gjakova-run-club
   npm install
   npx wrangler login
   ```
2. Krijo D1 databazën:
   ```bash
   npx wrangler d1 create gjakova-run-club-members
   ```
   Kopjo `database_id` që kthen komanda te `wrangler.toml`, duke zëvendësuar `REPLACE_WITH_D1_DATABASE_ID`.
3. Krijo tabelën në D1:
   ```bash
   npx wrangler d1 migrations apply gjakova-run-club-members --remote
   ```
4. Për email, krijo llogari Resend, verifiko një domen dërgues sipas udhëzimeve të Resend dhe konfiguro secrets në Worker:
   ```bash
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put VERIFIED_FROM_EMAIL
   ```
   `VERIFIED_FROM_EMAIL` duhet të jetë adresa/identiteti i verifikuar i dërguesit në Resend. Njoftimet e klubit shkojnë te `gjakovarunclub@gmail.com`. Mos përdor fjalëkalimin e Gmail-it në kod. Pa secrets, formulari ruan aplikimet por nuk dërgon email.
5. Kontrollo konfigurimin për `wrangler.toml`, pastaj publiko:
   ```bash
   npm run deploy
   ```
   Faqja publikohet në adresën `*.workers.dev` që raporton Wrangler. Mund të lidhësh domenin tënd më vonë në Cloudflare.
6. Në Cloudflare dashboard aktivizo WAF/rate limiting për `POST /api/membership`, monitoro kërkesat dhe vendos kufi të përshtatshëm për përdorimin e klubit. Honeypot-i dhe verifikimi i Origin-it nuk zëvendësojnë kufizimin e kërkesave. Aktivizo MFA në Cloudflare/Resend dhe jep qasje vetëm personave të nevojshëm.

## Testim lokal

Pas lidhjes së D1, mund të ekzekutosh `npm run dev`. Për databazë lokale, përdor `npx wrangler d1 migrations apply gjakova-run-club-members --local`. Kontrollo `npm run typecheck` para publikimit. Email-i real kërkon konfigurim të secrets në Cloudflare.

## Siguria dhe privatësia

- Çelësat mbahen si Cloudflare secrets, jo në kod/depo.
- API kontrollon Origin-in, llojin dhe madhësinë e kërkesës, të dhënat e formularit dhe datëlindjen; përdor honeypot kundër spam-it të thjeshtë.
- Përgjigjet kanë Content Security Policy dhe header-a të tjerë mbrojtës.
- Databaza nuk ekspozohet në shfletues dhe nuk ka endpoint publik për leximin e aplikimeve.
- Para publikimit të formularit, klubi duhet të përcaktojë afatin e ruajtjes, personat me qasje dhe procesin e fshirjes së aplikimeve; publiko një njoftim privatësie që shpjegon këto. Datëlindja është e dhënë personale.
- Nuk ka siguri absolute: përditëso varësitë, kufizo qasjet, monitoro log-et dhe mos ruaj të dhëna më gjatë sesa nevojitet.

## Logo

`public/logo.svg` është shenjë provizore e krijuar për projektin, jo kopje e saktë e imazhit të bashkëngjitur. Imazhi i bashkëngjitur nuk u transferua si skedar në repo. Përpara publikimit, ngarkoje logon origjinale si `public/logo.png` dhe përditëso referencat e logos në `public/index.html`.
