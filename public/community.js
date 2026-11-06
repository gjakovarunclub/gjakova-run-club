(() => {
  "use strict";
  const zone = "Europe/Belgrade";
  const partsInZone = (date) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).filter((part) => part.type !== "literal").map(({ type, value }) => [type, value]));
  const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/community.css?v=5"; document.head.append(css);
  const premiumCss = document.createElement("link"); premiumCss.rel = "stylesheet"; premiumCss.href = "/premium.css?v=1"; document.head.append(premiumCss);

  function nextRunDate(now = new Date()) {
    const p = partsInZone(now), today = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
    let days = (7 - today.getUTCDay()) % 7;
    if (days === 0 && Number(p.hour) >= 11) days = 7;
    const target = new Date(today.getTime() + days * 86400000);
    return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(target.getUTCDate()).padStart(2, "0")}`;
  }
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const externalLink = (href, className, label) => { const a = el("a", className, label); a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; return a; };

  function addNavLinks() {
    const nav = document.querySelector(".topbar nav");
    if (!nav || nav.querySelector('[href="#njoftime"]')) return;
    const join = nav.querySelector(".nav-join");
    const notices = el("a", "", "Njoftime"); notices.href = "#njoftime";
    const about = el("a", "", "Kush jemi?"); about.href = "#kush-jemi";
    nav.insertBefore(notices, join); nav.insertBefore(about, join);
  }

  function addClubInfo() {
    if (document.querySelector("#njoftime")) return;
    const weather = document.querySelector("#mot"), footer = document.querySelector("footer");
    if (!weather || !footer) return;
    const notices = el("section", "notices-section section"); notices.id = "njoftime"; notices.setAttribute("aria-labelledby", "notices-title");
    const noticeHead = el("div", "section-heading"), noticeTitle = el("div");
    noticeTitle.append(el("p", "eyebrow", "INFORMACION PËR KLUBIN"), el("h2", "", "Njoftime"));
    noticeTitle.querySelector("h2").id = "notices-title";
    noticeHead.append(noticeTitle, el("p", "muted", "Gjërat kryesore para se të bashkohesh në vrapimin tonë."));
    const noticeGrid = el("div", "notice-grid");
    [["01", "Takimi javor", "Çdo të diel, ora 11:00 · Parku i Qytetit, Gjakovë."], ["02", "Zgjidh ritmin tënd", "Regjistrohu për grupin 3 km ose 6 km; të gjitha nivelet janë të mirëseardhura."], ["03", "Kontrollo motin", "Parashikimi mund të ndryshojë. Kontrolloje përsëri para nisjes dhe vishu sipas kushteve."]].forEach(([number, title, copy]) => {
      const card = el("article", "notice-card"); card.append(el("span", "notice-number", number), el("h3", "", title), el("p", "", copy)); noticeGrid.append(card);
    });
    notices.append(noticeHead, noticeGrid);
    const about = el("section", "about-section section"); about.id = "kush-jemi"; about.setAttribute("aria-labelledby", "about-title");
    const aboutCopy = el("div", "about-copy");
    aboutCopy.append(el("p", "eyebrow", "GJAKOVA RUN CLUB"), el("h2", "", "Kush jemi?"), el("p", "", "Jemi një komunitet vrapimi në Gjakovë që bashkon njerëz me përvoja dhe ritme të ndryshme. Qëllimi ynë është i thjeshtë: të lëvizim së bashku, të mbështesim njëri-tjetrin dhe ta shijojmë qytetin në çdo hap."));
    aboutCopy.querySelector("h2").id = "about-title";
    const team = el("div", "about-team"); team.append(el("p", "about-team-kicker", "SI ORGANIZOHEMI"), el("h3", "", "Një klub. Një ekip organizues."));
    const roles = el("div", "role-list");
    [["Koordinimi", "Organizon takimet javore dhe komunikon njoftimet e klubit."], ["Rrugët dhe ritmi", "Ndihmon pjesëmarrësit të zgjedhin distancën dhe të vrapojnë në grupin e duhur."], ["Komuniteti", "Kujdeset që vrapuesit e rinj dhe me përvojë të ndihen të mirëpritur."]].forEach(([title, copy]) => {
      const row = el("article", "role-item"), content = el("div"); row.append(el("span", "role-dot", "")); content.append(el("h4", "", title), el("p", "", copy)); row.append(content); roles.append(row);
    });
    team.append(roles); about.append(aboutCopy, team); weather.before(notices, about);
  }

  function addSocialGallery() {
    if (document.querySelector("#club-social")) return;
    const footer = document.querySelector("footer"); if (!footer) return;
    const section = el("section", "social-section"); section.id = "club-social"; section.setAttribute("aria-labelledby", "club-social-title");
    const wrap = el("div", "social-wrap"), heading = el("div", "social-heading"), text = el("div", "social-heading-copy");
    text.append(el("p", "social-kicker", "NA GJEN NË RRUGË"), el("h2", "", "Jeta e klubit, në lëvizje"), el("p", "social-intro", "Ndiq vrapimet, aktivitetet dhe momentet tona nga Gjakova në rrjetet sociale."));
    text.querySelector("h2").id = "club-social-title";
    const links = el("div", "social-links"); links.append(externalLink("https://www.instagram.com/gjakovarunclub/", "social-link social-instagram", "Instagram ↗"), externalLink("https://www.facebook.com/profile.php?id=61594135364983", "social-link social-facebook", "Facebook ↗")); heading.append(text, links);
    const gallery = el("div", "social-gallery");
    [["social-tile-run", "01", "Vrapojmë së bashku", "Takimi ynë i së dielës"], ["social-tile-team", "02", "Një ekip, shumë ritme", "Të gjithë janë të mirëseardhur"], ["social-tile-city", "03", "Gjakova në çdo hap", "Rrugët dhe energjia e qytetit"]].forEach(([style, number, title, caption]) => {
      const tile = el("article", `social-tile ${style}`); tile.append(el("span", "social-tile-number", number), el("span", "social-tile-mark", "GRC")); const copy = el("div", "social-tile-copy"); copy.append(el("strong", "", title), el("span", "", caption)); tile.append(copy); gallery.append(tile);
    });
    wrap.append(heading, gallery, el("p", "social-note", "Këto janë ilustrime të përkohshme, jo postime të drejtpërdrejta. Për fotografi dhe postimet e fundit, vizito Instagramin ose Facebook-un tonë."));
    section.append(wrap); footer.before(section);
  }

  function addRsvp() {
    if (document.querySelector("#club-weekly")) return;
    const run = document.querySelector("#vrapimi"); if (!run) return;
    const date = nextRunDate(), section = el("section", "community-section"); section.id = "club-weekly"; section.setAttribute("aria-labelledby", "club-weekly-title");
    const wrap = el("div", "community-wrap"), heading = el("div", "community-heading");
    heading.append(el("p", "community-eyebrow", "E DIEL · ORA 11:00 · PARKU I QYTETIT"), el("h2", "", "Bashkohu në vrapimin e radhës"), el("p", "community-intro", "Zgjidh distancën dhe regjistro pjesëmarrjen. Na vjen mirë të vrapojmë së bashku.")); heading.querySelector("h2").id = "club-weekly-title";
    const form = el("form", "rsvp-form"); form.id = "attendance-form"; const nameRow = el("div", "rsvp-name-row");
    [["firstName", "Emri", "given-name", "Emri yt"], ["lastName", "Mbiemri", "family-name", "Mbiemri yt"]].forEach(([name, text, autocomplete, placeholder]) => {
      const label = el("label", "rsvp-field"); label.append(el("span", "", text)); const input = el("input"); input.name = name; input.autocomplete = autocomplete; input.minLength = 2; input.maxLength = 80; input.required = true; input.placeholder = placeholder; label.append(input); nameRow.append(label);
    });
    const label = el("p", "rsvp-label", "ZGJIDH DISTANCËN"), choices = el("div", "distance-choices");
    [[3, "Ritëm i qetë"], [6, "Ritëm i qëndrueshëm"]].forEach(([km, pace]) => { const option = el("label", "distance-option"), radio = el("input"); radio.type = "radio"; radio.name = "distance"; radio.value = String(km); radio.required = true; const copy = el("span", "distance-copy"); copy.append(el("strong", "", `${km} km`), el("small", "", pace)); option.append(radio, copy); choices.append(option); });
    const submit = el("button", "rsvp-submit", "Konfirmo pjesëmarrjen"); submit.type = "submit"; const status = el("p", "rsvp-status"); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); const counts = el("div", "attendance-counts"); counts.setAttribute("aria-live", "polite"); const privacy = el("p", "rsvp-privacy", "Emri përdoret vetëm për organizimin e vrapimit. "); const privacyLink = el("a", "", "Privatësia"); privacyLink.href = "/privacy.html"; privacy.append(privacyLink, document.createTextNode("."));
    form.append(nameRow, label, choices, submit, status); wrap.append(heading, form, counts, privacy); section.append(wrap); run.after(section);
    async function refreshCounts() { try { const response = await fetch(`/api/attendance?date=${encodeURIComponent(date)}`); if (!response.ok) throw new Error("counts"); const data = await response.json(); counts.replaceChildren(); [3, 6].forEach((km) => counts.append(el("span", "count-pill", `${km} km · ${Number(data.counts?.[km] || 0)} pjesëmarrës`))); } catch { counts.textContent = "Pjesëmarrësit nuk mund të ngarkohen tani."; } }
    form.addEventListener("submit", async (event) => { event.preventDefault(); if (!form.reportValidity()) return; const values = new FormData(form); submit.disabled = true; status.textContent = "Duke regjistruar pjesëmarrjen…"; try { const response = await fetch("/api/attendance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ firstName: values.get("firstName"), lastName: values.get("lastName"), distanceKm: values.get("distance"), eventDate: date }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Regjistrimi nuk u krye. Provo përsëri."); status.textContent = "U regjistrove me sukses. Mirë se vjen!"; form.reset(); await refreshCounts(); } catch (error) { status.textContent = error instanceof Error ? error.message : "Nuk u regjistrua. Provo përsëri."; } finally { submit.disabled = false; } });
    refreshCounts();
  }

  const weatherInfo = { 0:["☀️","Kthjellët"],1:["🌤️","Kryesisht kthjellët"],2:["⛅","Pjesërisht me re"],3:["☁️","Vranët"],45:["🌫️","Mjegull"],48:["🌫️","Mjegull me brymë"],51:["🌦️","Shi i imët"],53:["🌦️","Shi i imët"],55:["🌧️","Shi i imët"],56:["🌧️","Shi ngrirës"],57:["🌧️","Shi ngrirës"],61:["🌧️","Shi i lehtë"],63:["🌧️","Shi"],65:["🌧️","Shi i dendur"],66:["🌧️","Shi ngrirës"],67:["🌧️","Shi ngrirës"],71:["🌨️","Dëborë e lehtë"],73:["🌨️","Dëborë"],75:["❄️","Dëborë e dendur"],77:["🌨️","Kokrra dëbore"],80:["🌦️","Reshje të lehta"],81:["🌧️","Reshje"],82:["🌧️","Reshje të dendura"],85:["🌨️","Reshje dëbore"],86:["❄️","Reshje të dendura dëbore"],95:["⛈️","Stuhi"],96:["⛈️","Stuhi me breshër"],99:["⛈️","Stuhi me breshër të dendur"] };
  function decorateWeather(data) {
    const card = document.querySelector("#weather-card"), days = data?.daily?.time;
    if (!card || !data?.current || !Array.isArray(days) || !days.length) return;
    const runDate = nextRunDate();
    let index = days.indexOf(runDate);
    if (index < 0) index = Math.min(days.length - 1, Math.max(0, days.findIndex((day) => day >= runDate)));
    const currentInfo = weatherInfo[data.current.weather_code] || ["🌡️", "Kushtet aktuale"];
    const sundayInfo = weatherInfo[data.daily.weather_code?.[index]] || ["🌤️", "Parashikimi"];
    const summary = el("div", "weather-live-summary");
    const now = el("article", "weather-panel weather-now"); now.append(el("span", "weather-live-icon", currentInfo[0]));
    const nowCopy = el("div", "weather-live-copy"); nowCopy.append(el("span", "weather-live-label", "TANI NË GJAKOVË"), el("strong", "weather-live-condition", currentInfo[1]));
    now.append(nowCopy, el("strong", "weather-live-temp", `${Math.round(data.current.temperature_2m)}°C`));
    const stats = el("div", "weather-live-stats"); stats.append(el("span", "", `Ndjesia ${Math.round(data.current.apparent_temperature)}°C`), el("span", "", `Era ${Math.round(data.current.wind_speed_10m)} km/h`));
    const sunday = el("article", "weather-panel weather-sunday"); sunday.append(el("span", "weather-live-icon", sundayInfo[0]));
    const sundayCopy = el("div", "weather-live-copy"); sundayCopy.append(el("span", "weather-live-label", `PARASHIKIMI · E DIEL · 11:00`), el("strong", "weather-live-condition", sundayInfo[1]));
    const min = data.daily.temperature_2m_min?.[index], max = data.daily.temperature_2m_max?.[index];
    sunday.append(sundayCopy, el("strong", "weather-live-temp", `${Math.round(min)}°–${Math.round(max)}°C`));
    const rain = el("div", "weather-rain-probability", `💧 Mundësi reshjesh: ${data.daily.precipitation_probability_max?.[index] ?? "—"}%`);
    summary.append(now, stats, sunday, rain, el("p", "weather-disclaimer", "Parashikimi mund të ndryshojë; kontrolloje përsëri para vrapimit."));
    card.replaceChildren(summary);
  }
  async function addWeatherVisuals() {
    const card = document.querySelector("#weather-card"); if (!card) return;
    try { const response = await fetch("/api/weather"); if (!response.ok) throw new Error("weather"); const data = await response.json(); decorateWeather(data); new MutationObserver(() => { if (!card.querySelector(".weather-live-summary")) decorateWeather(data); }).observe(card, { childList: true }); }
    catch { /* Keep the localized forecast error visible when the weather service is unavailable. */ }
  }
  addNavLinks(); addClubInfo(); addRsvp(); addWeatherVisuals(); addSocialGallery();
})();
