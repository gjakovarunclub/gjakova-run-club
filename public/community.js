(() => {
  "use strict";
  const zone = "Europe/Belgrade";
  const partsInZone = (date) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).filter((part) => part.type !== "literal").map(({ type, value }) => [type, Number(value)]));

  function nextRunDate(now = new Date()) {
    const p = partsInZone(now);
    const today = new Date(Date.UTC(p.year, p.month - 1, p.day));
    let days = (7 - today.getUTCDay()) % 7;
    if (days === 0 && p.hour >= 11) days = 7;
    const target = new Date(today.getTime() + days * 86400000);
    return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(target.getUTCDate()).padStart(2, "0")}`;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const meeting = document.querySelector("#vrapimi");
  if (!meeting || document.querySelector("#club-weekly")) return;

  const eventDate = nextRunDate();
  const section = element("section", "community-section");
  section.id = "club-weekly";
  section.setAttribute("aria-labelledby", "club-weekly-title");

  const inner = element("div", "community-wrap");
  const heading = element("div", "community-heading");
  heading.append(
    element("p", "community-eyebrow", "KONFIRMO PJESËMARRJEN"),
    element("h2", "", "Vrapon këtë të diel?"),
    element("p", "community-intro", "Shëno emrin dhe mbiemrin, pastaj zgjidh grupin ku dëshiron të vraposh."),
  );
  heading.querySelector("h2").id = "club-weekly-title";

  const form = element("form", "rsvp-form");
  form.id = "attendance-form";
  const names = element("div", "rsvp-name-row");
  for (const [name, labelText, autocomplete, placeholder] of [
    ["firstName", "Emri", "given-name", "Emri yt"],
    ["lastName", "Mbiemri", "family-name", "Mbiemri yt"],
  ]) {
    const label = element("label", "rsvp-field");
    label.append(element("span", "", labelText));
    const input = element("input");
    input.name = name;
    input.autocomplete = autocomplete;
    input.minLength = 2;
    input.maxLength = 80;
    input.required = true;
    input.placeholder = placeholder;
    label.append(input);
    names.append(label);
  }

  const groupLabel = element("p", "rsvp-label", "ZGJIDH GRUPIN");
  const choices = element("div", "distance-choices");
  for (const [distance, pace] of [[3, "Grupi 3 km"], [6, "Grupi 6 km"]]) {
    const label = element("label", "distance-option");
    const radio = element("input");
    radio.type = "radio";
    radio.name = "distance";
    radio.value = String(distance);
    radio.required = true;
    const copy = element("span", "distance-copy");
    copy.append(element("strong", "", `${distance} km`), element("small", "", pace));
    label.append(radio, copy);
    choices.append(label);
  }

  const submit = element("button", "rsvp-submit", "Po marr pjesë");
  submit.type = "submit";
  const status = element("p", "rsvp-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const counts = element("div", "attendance-counts");
  counts.setAttribute("aria-live", "polite");
  const privacy = element("p", "rsvp-privacy", "Emrat nuk shfaqen publikisht. Shiko ");
  const privacyLink = element("a", "", "njoftimin e privatësisë");
  privacyLink.href = "/privacy.html";
  privacy.append(privacyLink, document.createTextNode("."));

  form.append(names, groupLabel, choices, submit, status);
  inner.append(heading, form, counts, privacy);
  section.append(inner);
  meeting.after(section);

  async function refreshCounts() {
    try {
      const response = await fetch(`/api/attendance?date=${encodeURIComponent(eventDate)}`);
      if (!response.ok) throw new Error("counts");
      const data = await response.json();
      counts.replaceChildren();
      for (const distance of [3, 6]) {
        const count = Number(data.counts?.[distance] || 0);
        counts.append(element("span", "count-pill", `${distance} km · ${count} ${count === 1 ? "pjesëmarrës" : "pjesëmarrës"}`));
      }
    } catch {
      counts.textContent = "Numri i pjesëmarrësve nuk mund të ngarkohet tani.";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const submitButton = form.querySelector("button[type=submit]");
    const values = new FormData(form);
    submitButton.disabled = true;
    status.textContent = "Duke regjistruar pjesëmarrjen…";
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: values.get("firstName"),
          lastName: values.get("lastName"),
          distanceKm: values.get("distance"),
          eventDate,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Regjistrimi nuk u krye. Provo përsëri.");
      status.textContent = "U regjistrove me sukses për vrapimin e radhës. Faleminderit!";
      form.reset();
      await refreshCounts();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Nuk u regjistrove. Provo përsëri.";
    } finally {
      submitButton.disabled = false;
    }
  });

  refreshCounts();
})();
