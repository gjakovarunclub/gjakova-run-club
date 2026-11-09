# Gjakova Run Club — aplikacioni për telefon

Aplikacioni është një PWA (Progressive Web App) i instalueshëm, i bazuar në faqen ekzistuese mobile-first. Nuk kërkon publikim në App Store/Google Play ose blerje domaini; punon në adresën HTTPS të Cloudflare Workers.

## Si instalohet

1. Publiko versionin e ri në Cloudflare Workers.
2. Në telefon hape `https://gjakova-run-club.gjakovarunclub.workers.dev/phone.html`.
3. Android/Chrome: zgjidh **Instalo aplikacionin** ose menynë ⋮ → **Install app / Add to Home screen**.
4. iPhone/Safari: **Share** → **Add to Home Screen**.

Aplikacioni paraqet faqen e klubit brenda një kornize të përshtatur për ekranin e telefonit. Service worker-i ruan disa burime bazë për hapje më të shpejtë dhe fallback kur nuk ka lidhje; formularët, moti dhe aplikimet kërkojnë internet.
