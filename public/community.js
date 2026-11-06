(() => {
  "use strict";
  const zone = "Europe/Belgrade";
  const partsInZone = (date) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).filter((part) => part.type !== "literal").map(({ type, value }) => [type, value]));

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/community.css?v=2";
  document.head.append(css);

  function nextRunDate(now = new Date()) {
    const p = partsInZone(now);
    const today = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
    let days = (7 - today.getUTCDay()) % 7;
    if (days === 0 && Number(p.hour) >= 11) days = 7;
    const target = new Date(today.getTime() + days * 86400000);
    return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(target.getUTCDate()).padStart(2, "0")}`;
  }
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function addRsvp() {
    if (document.querySelector("#club-weekly")) return;
    const run = document.querySelector("#vrapimi");
    if (!run) return;
    const date = nextRunDate();
    const section = el("section", "community-section");
    section.id = "club-weekly";
    section.setAttribute("aria-labelledby", "club-weekly-title");
    const wrap = el("div", "community-wrap");
    const heading = el("div", "community-heading");
    heading.append(
      el("p", "community-eyebrow", "E DIEL · ORA 11:00 · PARKU I QYTETIT"),
      el("h2", "", "Bashkohu në vrapimin e radhës"),
      el("p", "community-intro", "Zgjidh distancën dhe regjistro pjesëmarrjen. Na vjen mirë të vrapojmë së bashku.")
    );
    heading.querySelector("h2").id = "club-weekly-title";

    const form = el("form", "rsvp-form");
    form.id = "attendance-form";
    const nameRow = el("div", "rsvp-name-row");
    [["firstName", "Emri", "given-name", "Emri yt"], ["lastName", "Mbiemri", "family-name", "Mbiemri yt"]].forEach(([name, text, autocomplete, placeholder]) => {
      const label = el("label", "rsvp-field");
      label.append(el("span", "", text));
      const input = el("input");
      input.name = name; input.autocomplete = autocomplete; input.minLength = 2; input.maxLength = 80; input.required = true; input.placeholder = placeholder;
      label.append(input); nameRow.append(label);
    });
    const label = el("p", "rsvp-label", "ZGJIDH DISTANCËN");
    const choices = el("div", "distance-choices");
    [[3, "Ritëm i qetë"], [6, "Ritëm i qëndrueshëm"]].forEach(([km, pace]) => {
      const option = el("label", "distance-option");
      const radio = el("input"); radio.type = "radio"; radio.name = "distance"; radio.value = String(km); radio.required = true;
      const copy = el("span", "distance-copy"); copy.append(el("strong", "", `${km} km`), el("small", "", pace));
      option.append(radio, copy); choices.append(option);
    });
    const submit = el("button", "rsvp-submit", "Konfirmo pjesëmarrjen"); submit.type = "submit";
    const status = el("p", "rsvp-status"); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    const counts = el("div", "attendance-counts"); counts.setAttribute("aria-live", "polite");
    const privacy = el("p", "rsvp-privacy", "Emri përdoret vetëm për organizimin e vrapimit. ");
    const privacyLink = el("a", "", "Privatësia"); privacyLink.href = "/privacy.html"; privacy.append(privacyLink, document.createTextNode("."));
    form.append(nameRow, label, choices, submit, status);
    wrap.append(heading, form, counts, privacy); section.append(wrap); run.after(section);

    async function refreshCounts() {
      try {
        const response = await fetch(`/api/attendance?date=${encodeURIComponent(date)}`);
        if (!response.ok) throw new Error("counts");
        const data = await response.json();
        counts.replaceChildren();
        [3, 6].forEach((km) => counts.append(el("span", "count-pill", `${km} km · ${Number(data.counts?.[km] || 0)} pjesëmarrës`)));
      } catch { counts.textContent = "Pjesëmarrësit nuk mund të ngarkohen tani."; }
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form); submit.disabled = true; status.textContent = "Duke regjistruar pjesëmarrjen…";
      try {
        const response = await fetch("/api/attendance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ firstName: values.get("firstName"), lastName: values.get("lastName"), distanceKm: values.get("distance"), eventDate: date }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Regjistrimi nuk u krye. Provo përsëri.");
        status.textContent = "U regjistrove me sukses. Mirë se vjen!"; form.reset(); await refreshCounts();
      } catch (error) { status.textContent = error instanceof Error ? error.message : "Nuk u regjistrua. Provo përsëri."; }
      finally { submit.disabled = false; }
    });
    refreshCounts();
  }

  const weatherInfo = {
    0: ["☀️", "Kthjellët"], 1: ["🌤️", "Kryesisht kthjellët"], 2: ["⛅", "Pjesërisht me re"], 3: ["☁️", "Vranët"],
    45: ["🌫️", "Mjegull"], 48: ["🌫️", "Mjegull me brymë"], 51: ["🌦️", "Shi i imët"], 53: ["🌦️", "Shi i imët"], 55: ["🌧️", "Shi i imët"],
    56: ["🌧️", "Shi i imët ngrirës"], 57: ["🌧️", "Shi i imët ngrirës"], 61: ["🌧️", "Shi i lehtë"], 63: ["🌧️", "Shi"], 65: ["🌧️", "Shi i dendur"],
    66: ["🌧️", "Shi ngrirës"], 67: ["🌧️", "Shi ngrirës"], 71: ["🌨️", "Dëborë e lehtë"], 73: ["🌨️", "Dëborë"], 75: ["❄️", "Dëborë e dendur"], 77: ["🌨️", "Kokrra dëbore"],
    80: ["🌦️", "Reshje të lehta"], 81: ["🌧️", "Reshje"], 82: ["🌧️", "Reshje të dendura"], 85: ["🌨️", "Reshje dëbore"], 86: ["❄️", "Reshje të dendura dëbore"],
    95: ["⛈️", "Stuhi"], 96: ["⛈️", "Stuhi me breshër"], 99: ["⛈️", "Stuhi me breshër të dendur"],
  };
  function decorateWeather(data) {
    const card = document.querySelector("#weather-card");
    if (!card || !data?.current) return;
    card.querySelector(".weather-live-summary")?.remove();
    const current = data.current;
    const info = weatherInfo[current.weather_code] || ["🌡️", "Kushtet aktuale"];
    const summary = el("div", "weather-live-summary");
    const top = el("div", "weather-live-top");
    top.append(el("span", "weather-live-icon", info[0]));
    const copy = el("div", "weather-live-copy");
    copy.append(el("span", "weather-live-label", "TANI NË GJAKOVË"), el("strong", "weather-live-condition", info[1]));
    top.append(copy, el("strong", "weather-live-temp", `${Math.round(current.temperature_2m)}°C`));
    const stats = el("div", "weather-live-stats");
    stats.append(el("span", "", `Ndjesia ${Math.round(current.apparent_temperature)}°`), el("span", "", `Era ${Math.round(current.wind_speed_10m)} km/h`));
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(new Date());
    const dailyIndex = data.daily?.time?.findIndex((day) => new Date(`${day}T12:00:00Z`).getUTCDay() === 0 && day >= today) ?? -1;
    const i = dailyIndex >= 0 ? dailyIndex : Math.min(6, (data.daily?.time?.length || 1) - 1);
    const forecastInfo = weatherInfo[data.daily?.weather_code?.[i]] || ["🌤️", "Parashikimi" ];
    const forecast = el("div", "weather-live-forecast");
    forecast.append(el("span", "weather-forecast-icon", forecastInfo[0]));
    const forecastCopy = el("span", "", `E diel · ${forecastInfo[1]} · ${Math.round(data.daily.temperature_2m_min[i])}°–${Math.round(data.daily.temperature_2m_max[i])}°C · ${data.daily.precipitation_probability_max[i] ?? "—"}% mundësi shiu`);
    forecast.append(forecastCopy);
    summary.append(top, stats, forecast);
    card.prepend(summary);
  }
  async function addWeatherVisuals() {
    const card = document.querySelector("#weather-card");
    if (!card) return;
    try {
      const response = await fetch("/api/weather");
      if (!response.ok) throw new Error("weather");
      const data = await response.json();
      decorateWeather(data);
      new MutationObserver(() => {
        if (!card.querySelector(".weather-live-summary")) decorateWeather(data);
      }).observe(card, { childList: true });
    } catch { /* Leave the existing weather message visible if the forecast is unavailable. */ }
  }
  addRsvp();
  addWeatherVisuals();
})();
