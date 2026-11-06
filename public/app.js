const zone = "Europe/Belgrade";
const dateParts = (date) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date).filter((part) => part.type !== "literal").map(({ type, value }) => [type, Number(value)]));
function nextRunDate(now = new Date()) {
  const p = dateParts(now);
  const localToday = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const weekday = localToday.getUTCDay();
  let daysUntil = (7 - weekday) % 7;
  if (daysUntil === 0 && (p.hour > 11 || (p.hour === 11 && p.minute >= 0))) daysUntil = 7;
  const targetDay = new Date(localToday.getTime() + daysUntil * 86400000);
  const y = targetDay.getUTCFullYear(), m = targetDay.getUTCMonth() + 1, d = targetDay.getUTCDate();
  // Convert the target Gjakova wall-clock time to UTC, accounting for seasonal timezone offset.
  let utc = new Date(Date.UTC(y, m - 1, d, 11));
  for (let i = 0; i < 2; i++) {
    const q = dateParts(utc);
    const represented = Date.UTC(q.year, q.month - 1, q.day, q.hour, q.minute, q.second);
    utc = new Date(utc.getTime() + (Date.UTC(y, m - 1, d, 11) - represented));
  }
  return utc;
}
function updateCountdown() {
  const now = new Date(), target = nextRunDate(now), seconds = Math.max(0, Math.floor((target - now) / 1000));
  document.querySelector("#days").textContent = String(Math.floor(seconds / 86400)).padStart(2, "0");
  document.querySelector("#hours").textContent = String(Math.floor((seconds % 86400) / 3600)).padStart(2, "0");
  document.querySelector("#minutes").textContent = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  document.querySelector("#run-date").textContent = new Intl.DateTimeFormat("sq-XK", { timeZone: zone, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(target) + " · ora lokale";
}
const descriptions = { 0: "Kthjellët", 1: "Kryesisht kthjellët", 2: "Pjesërisht me re", 3: "Vranët", 45: "Mjegull", 48: "Mjegull me brymë", 51: "Shi i imët", 53: "Shi i imët", 55: "Shi i imët", 61: "Shi i lehtë", 63: "Shi", 65: "Shi i dendur", 71: "Borë e lehtë", 73: "Borë", 75: "Borë e dendur", 80: "Rrebeshe të lehta", 81: "Rrebeshe", 82: "Rrebeshe të dendura", 95: "Stuhi" };
async function loadWeather() {
  const card = document.querySelector("#weather-card");
  try {
    const response = await fetch("/api/weather"); if (!response.ok) throw new Error("weather");
    const data = await response.json(); const current = data.current;
    const sundayIndex = data.daily.time.findIndex((date) => new Date(`${date}T12:00:00`).getDay() === 0 && date >= new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(new Date()));
    const idx = sundayIndex >= 0 ? sundayIndex : Math.min(6, data.daily.time.length - 1);
    const sundayCode = data.daily.weather_code[idx];
    card.innerHTML = `<div class="current-weather"><span class="weather-icon">${Number(current.temperature_2m) > 24 ? "☀" : "◌"}</span><div><small>TANI NË GJAKOVË</small><strong>${Math.round(current.temperature_2m)}°C</strong><span>${descriptions[current.weather_code] || "Kushtet aktuale"}</span></div></div><div class="sunday-weather"><small>PARASHIKIMI PËR TË DIELËN · ${new Intl.DateTimeFormat("sq-XK", { day: "numeric", month: "long", timeZone: zone }).format(new Date(`${data.daily.time[idx]}T12:00:00`))}</small><strong>${descriptions[sundayCode] || "Parashikimi"}</strong><span>${Math.round(data.daily.temperature_2m_min[idx])}° – ${Math.round(data.daily.temperature_2m_max[idx])}°C</span><span>Mundësi reshjesh: ${data.daily.precipitation_probability_max[idx] ?? "—"}%</span><p>Parashikimi mund të ndryshojë; kontrolloje përsëri para vrapimit.</p></div>`;
  } catch { card.innerHTML = `<p class="weather-error">Parashikimi i motit nuk mund të ngarkohet tani. Provo përsëri më vonë.</p>`; }
}
document.querySelector("#membership-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const form = event.currentTarget, button = form.querySelector("button"), status = document.querySelector("#form-status");
  button.disabled = true; status.textContent = "Duke dërguar aplikimin…";
  const fields = new FormData(form);
  const payload = { firstName: fields.get("firstName"), lastName: fields.get("lastName"), birthDate: fields.get("birthDate"), email: fields.get("email"), consent: fields.get("consent") === "on", website: fields.get("website") };
  try {
    const response = await fetch("/api/membership", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Ndodhi një gabim.");
    status.textContent = result.emailConfigured ? "Faleminderit! Aplikimi u dërgua; kontrollo email-in për konfirmim." : "Faleminderit! Aplikimi u ruajt. Konfirmimi me email do të aktivizohet së shpejti.";
    form.reset();
  } catch (error) { status.textContent = error.message || "Nuk u dërgua. Provo përsëri."; }
  finally { button.disabled = false; }
});
document.querySelector("#year").textContent = new Date().getFullYear();
updateCountdown(); setInterval(updateCountdown, 1000); loadWeather();
