const zone = "Europe/Belgrade";
const partsInClubZone = (date) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).filter((part) => part.type !== "literal").map(({ type, value }) => [type, Number(value)]));
function nextRunDate(now = new Date()) {
  const p = partsInClubZone(now);
  const today = new Date(Date.UTC(p.year, p.month - 1, p.day));
  let days = (7 - today.getUTCDay()) % 7;
  if (days === 0 && p.hour >= 11) days = 7;
  const target = new Date(today.getTime() + days * 86400000);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(target.getUTCDate()).padStart(2, "0")}`;
}
const dateLabel = (iso) => new Intl.DateTimeFormat("sq-XK", { timeZone: zone, weekday: "long", day: "numeric", month: "long" }).format(new Date(`${iso}T12:00:00Z`));
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function makeCommunitySection() {
  const section = el("section", "community-section");
  section.id = "club-weekly";
  const wrap = el("div", "community-wrap");
  const head = el("div", "community-heading");
  const eyebrow = el("p", "community-eyebrow", "PLANIFIKO JAVËN TËNDE");
  const title = el("h2", "", "Vrapimi i radhës");
  const intro = el("p", "community-intro", "Zgjidh distancën dhe konfirmo pjesëmarrjen. Takimi i përbashkët është çdo të diel në Parkun e Qytetit.");
  head.append(eyebrow, title, intro);
  const event = el("div", "event-banner");
  const eventIcon = el("div", "event-icon", "↗");
  const eventDetails = el("div", "event-details");
  eventDetails.append(el("span", "event-label", "TAKIMI I ARDHSHËM"), el("strong", "event-date"), el("span", "event-time", "Ora 11:00 · Parku i Qytetit, Gjakovë"));
  event.append(eventIcon, eventDetails);
  const grid = el("div", "community-grid");
  const weather = el("article", "weather-card");
  weather.id = "fresh-weather";
  weather.append(el("div", "card-kicker", "MOTI NË GJAKOVË"), el("h3", "weather-title", "Përgatitu për vrapim"), el("p", "weather-loading", "Po ngarkojmë kushtet e motit…"));
  const rsvp = el("article", "rsvp-card");
  rsvp.append(el("div", "card-kicker", "BASHKOHU ME EKIPIN"), el("h3", "", "A do të vraposh me ne?"), el("p", "rsvp-note", "Zgjidh grupin tënd dhe shkruaj emrin për t'u regjistruar këtë javë."));
  const form = el("form", "rsvp-form");
  form.id = "attendance-form";
  const nameRow = el("div", "rsvp-name-row");
  const firstWrap = el("label", "rsvp-field"); firstWrap.append(el("span", "", "Emri"));
  const first = el("input"); first.name = "firstName"; first.autocomplete = "given-name"; first.required = true; first.minLength = 2; first.maxLength = 80; first.placeholder = "Emri yt";
  firstWrap.append(first);
  const lastWrap = el("label", "rsvp-field"); lastWrap.append(el("span", "", "Mbiemri"));
  const last = el("input"); last.name = "lastName"; last.autocomplete = "family-name"; last.required = true; last.minLength = 2; last.maxLength = 80; last.placeholder = "Mbiemri yt";
  lastWrap.append(last); nameRow.append(firstWrap, lastWrap);
  const groupLabel = el("span", "rsvp-label", "ZGJIDH DISTANCËN");
  const choices = el("div", "distance-choices");
  for (const [km, sub] of [[3, "Ritëm i qetë"], [6, "Ritëm i qëndrueshëm"]]) {
    const label = el("label", "distance-option");
    const radio = el("input"); radio.type = "radio"; radio.name = "distance"; radio.value = String(km); radio.required = true;
    const content = el("span", "distance-copy"); content.append(el("strong", "", `${km} km`), el("small", "", sub));
    label.append(radio, content, el("span", "distance-check", "✓")); choices.append(label);
  }
  const submit = el("button", "rsvp-submit", "Konfirmo pjesëmarrjen"); submit.type = "submit";
  const status = el("p", "rsvp-status"); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
  const counts = el("div", "attendance-counts"); counts.setAttribute("aria-live", "polite");
  form.append(nameRow, groupLabel, choices, submit, status);
  rsvp.append(form, counts, el("p", "rsvp-privacy", "Emri dhe grupi përdoren vetëm për organizimin e këtij vrapimi. Shiko "));
  const privacy = rsvp.querySelector(".rsvp-privacy");
  const privacyLink = el("a", "", "njoftimin e privatësisë"); privacyLink.href = "/privacy.html"; privacy.append(privacyLink, el("span", "", "."));
  grid.append(weather, rsvp);
  wrap.append(head, event, grid); section.append(wrap);
  const existingWeather = document.querySelector("#mot");
  if (existingWeather?.parentNode) existingWeather.after(section);
  else document.querySelector("main")?.append(section);
  return { section, weather, eventDate: eventDetails.querySelector(".event-date"), form, status, counts };
}
const ui = makeCommunitySection();
const eventDate = nextRunDate();
ui.eventDate.textContent = dateLabel(eventDate);

const weatherText = { 0: "Kthjellët", 1: "Kryesisht kthjellët", 2: "Pjesërisht me re", 3: "Vranët", 45: "Mjegull", 48: "Mjegull", 51: "Shi i imët", 53: "Shi i imët", 55: "Shi i imët", 61: "Shi i lehtë", 63: "Shi", 65: "Shi i dendur", 71: "Borë e lehtë", 73: "Borë", 75: "Borë e dendur", 80: "Rrebeshe", 81: "Rrebeshe", 82: "Rrebeshe të dendura", 95: "Mundësi stuhie" };
const weatherIcon = (code) => code === 0 || code === 1 ? "☀" : code === 2 || code === 3 ? "☁" : code >= 51 && code <= 82 ? "☂" : code >= 95 ? "ϟ" : "◌";
async function loadWeather() {
  const card = ui.weather;
  try {
    const response = await fetch("/api/weather");
    if (!response.ok) throw new Error("weather");
    const data = await response.json();
    const current = data.current;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(new Date());
    const sunday = data.daily.time.findIndex((date) => new Date(`${date}T12:00:00Z`).getUTCDay() === 0 && date >= today);
    const i = sunday < 0 ? Math.min(6, data.daily.time.length - 1) : sunday;
    const currentBox = el("div", "weather-current");
    const icon = el("span", "weather-symbol", weatherIcon(current.weather_code));
    const currentInfo = el("div", "weather-current-info"); currentInfo.append(el("span", "weather-caption", "TANI"), el("strong", "weather-temperature", `${Math.round(current.temperature_2m)}°`), el("span", "weather-description", weatherText[current.weather_code] || "Kushtet aktuale"));
    currentBox.append(icon, currentInfo);
    const stats = el("div", "weather-stats");
    const feels = el("div", "weather-stat"); feels.append(el("span", "", "Ndjesia"), el("strong", "", `${Math.round(current.apparent_temperature)}°C`));
    const wind = el("div", "weather-stat"); wind.append(el("span", "", "Era"), el("strong", "", `${Math.round(current.wind_speed_10m)} km/h`));
    const rain = el("div", "weather-stat"); rain.append(el("span", "", "Reshje të dielën"), el("strong", "", `${data.daily.precipitation_probability_max[i] ?? "—"}%`));
    stats.append(feels, wind, rain);
    const forecast = el("div", "sunday-forecast");
    forecast.append(el("span", "forecast-icon", weatherIcon(data.daily.weather_code[i])), el("div", "forecast-copy", `TË DIELËN · ${Math.round(data.daily.temperature_2m_min[i])}° – ${Math.round(data.daily.temperature_2m_max[i])}°C`));
    card.replaceChildren(el("div", "card-kicker", "MOTI NË GJAKOVË"), el("h3", "weather-title", "Kushtet për vrapim"), currentBox, stats, forecast, el("p", "weather-footnote", "Parashikim për Gjakovë · përditësohet automatikisht"));
  } catch {
    card.replaceChildren(el("div", "card-kicker", "MOTI NË GJAKOVË"), el("h3", "weather-title", "Kushtet për vrapim"), el("p", "weather-loading", "Parashikimi nuk është i disponueshëm tani. Provo përsëri më vonë."));
  }
}
async function loadAttendance() {
  try {
    const response = await fetch(`/api/attendance?date=${encodeURIComponent(eventDate)}`);
    if (!response.ok) return;
    const data = await response.json();
    ui.counts.replaceChildren();
    for (const km of [3, 6]) ui.counts.append(el("span", "count-pill", `${km} km · ${data.counts[km] || 0} vrapues`));
  } catch { ui.counts.textContent = ""; }
}
ui.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector("button[type=submit]");
  const values = new FormData(form);
  submit.disabled = true;
  ui.status.textContent = "Duke regjistruar pjesëmarrjen…";
  try {
    const response = await fetch("/api/attendance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ firstName: values.get("firstName"), lastName: values.get("lastName"), distanceKm: values.get("distance"), eventDate }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Regjistrimi nuk u krye. Provo përsëri.");
    ui.status.textContent = `U regjistrove për grupin ${values.get("distance")} km. Mirë se vjen!`;
    form.reset();
    await loadAttendance();
  } catch (error) { ui.status.textContent = error.message || "Nuk u regjistrua. Provo përsëri."; }
  finally { submit.disabled = false; }
});
loadWeather();
loadAttendance();
