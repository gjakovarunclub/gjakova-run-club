# Gjakova Run Club

Website mobile-first dhe backend për aplikimet e anëtarësimit të Gjakova Run Club. Frontend-i është statik; backend-i punon në Cloudflare Workers me D1. Email-et dërgohen përmes Resend.

## Funksionet

- Informacion për takimin javor dhe numërim deri te vrapimi i ardhshëm (e diel, 11:00, Europe/Belgrade).
- Formular anëtarësimi: emër, mbiemër, datëlindje dhe email; aplikimi ruhet në D1.
- Email konfirmimi për aplikuesin dhe email njoftimi për klubin, kur konfigurohen Resend secrets.
- Moti aktual/parashikimi 7-ditor për Gjakovë (Open-Meteo).
- Njoftim privatësie publik në `/privacy.html`, i lidhur pranë kutisë së pëlqimit në formular.

## Aktivizimi i email-it automatik (Resend)

Email-i nuk mund të aktivizohet vetëm me adresën Gmail të klubit. Duhet domen që klubi zotëron dhe mund të verifikojë në Resend; si p.sh. `gjakovarunclub.org` nëse është i juaji. Mos përdor domen që nuk e zotëron. Gmail-i i klubit mund të mbetet marrësi i njoftimeve, por dërguesi duhet të jetë një adresë në domenin e verifikuar.

1. Krijo/kyçu në llogarinë Resend dhe shto domenin tënd në panelin e Resend.
2. Te menaxheri DNS i domenit, shto rekordet që Resend kërkon për verifikim/dërgim. Prit derisa Resend të tregojë se domeni është verifikuar.
3. Krijo një API key në Resend me lejet më të kufizuara që i duhen dërgimit. **Mos e vendos në këtë repo, në kod ose në chat.**
4. Në PowerShell, nga dosja e projektit, vendos sekretin lokalisht në Cloudflare:
   ```powershell
   npx.cmd wrangler secret put RESEND_API_KEY
   ```
   Kur të shfaqet kërkesa për vlerën, ngjite API key në dritaren e terminalit dhe shtyp Enter. Nuk shfaqet karaktere gjatë shkrimit; kjo është normale. Mos dërgo screenshot të sekretit.
5. Vendos adresën e dërguesit të verifikuar. Zëvendëso shembullin me adresën reale që Resend pranon për domenin tënd:
   ```powershell
   npx.cmd wrangler secret put VERIFIED_FROM_EMAIL
   ```
   Shembull vlere: `Gjakova Run Club <vrapo@domeni-juaj.org>`.
6. Publiko ndryshimet dhe secrets:
   ```powershell
   npx.cmd wrangler deploy
   ```
7. Testo me një aplikim tëndin, me pëlqimin tënd. Kontrollo si email-in e aplikuesit ashtu edhe `gjakovarunclub@gmail.com`. Nëse s’arrin email-i, kontrollo statusin e domenit, kufizimet e llogarisë Resend dhe log-et e Worker-it — pa publikuar sekrete.

Nëse ende nuk ke domen, mos e vendos një adresë Gmail si `VERIFIED_FROM_EMAIL`; faqja do të ruajë aplikimet, por nuk do të dërgojë email automatik deri sa të kesh domen dërgues të verifikuar.

## Publikimi në Cloudflare Workers

Këta hapa kërkojnë hyrje në Cloudflare. **Mos ndaj fjalëkalime, kode autorizimi, API keys apo tokenë.**

1. Në kompjuter, klono repo-n dhe instalo Node.js 20+:
   ```powershell
   git clone https://github.com/gjakovarunclub/gjakova-run-club.git
   cd gjakova-run-club
   npm.cmd install
   npx.cmd wrangler login
   ```
2. Krijo D1 databazën (nëse s'është krijuar), vendos ID-në te `wrangler.toml`, pastaj zbato migrimin:
   ```powershell
   npx.cmd wrangler d1 create gjakova-run-club-members
   npx.cmd wrangler d1 migrations apply gjakova-run-club-members --remote
   ```
3. Publiko me `npx.cmd wrangler deploy`. Faqja përdor adresën `*.workers.dev`; mund të lidhësh domenin tënd më vonë në Cloudflare.

## Siguria dhe privatësia

- Secrets ruhen në Cloudflare Workers secrets, jo në kod/depo.
- API kontrollon Origin-in, llojin/madhësinë e kërkesës, të dhënat e formularit dhe datëlindjen; përdor honeypot kundër spam-it të thjeshtë.
- Përgjigjet kanë Content Security Policy dhe header-a të tjerë mbrojtës.
- Databaza nuk ekspozohet në shfletues dhe nuk ka endpoint publik për leximin e aplikimeve.
- Njoftimi i privatësisë është praktika/afati i synuar; klubi duhet ta ndjekë dhe të fshijë të dhënat kur mbaron afati. Përpara përdorimit publik, klubi duhet të verifikojë që përshkrimi i qëllimeve, ruajtjes dhe qasjes përputhet me praktikën reale dhe kërkesat ligjore.
- Aktivizo WAF/rate limiting për `POST /api/membership`, MFA në Cloudflare/Resend dhe qasje vetëm për personat e nevojshëm.
- Nuk ka siguri absolute: përditëso varësitë, monitoro log-et dhe mos ruaj të dhëna më gjatë sesa nevojitet.

## Logo

`public/logo.svg` është shenjë provizore e krijuar për projektin, jo kopje e saktë e imazhit të bashkëngjitur. Imazhi i bashkëngjitur nuk u transferua si skedar në repo. Përpara publikimit, ngarkoje logon origjinale si `public/logo.png` dhe përditëso referencat e logos në `public/index.html`.
