(() => {
  "use strict";
  const zone = "Europe/Belgrade";
  const partsInZone = (date) => Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map(({ type, value }) => [type, value])
  );

  function nextRunDate(now = new Date()) {
    const p = partsInZone(now);
    const today = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
    let days = (7 - today.getUTCDay()) % 7;
    if (days === 0 && Number(p.hour) >= 11) days = 7;
    const target = new Date(today.getTime() + days * 86400000);
    return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(target.getUTCDate()).padStart(2, "0")}`;
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function ensureCommunitySection() {
    const existing = document.querySelector("#club-weekly");
    if (existing) return null;
    const target = document.querySelector("#vrapimi");
    if (!target) return null;
    const date = nextRunDate();
    const section = createElement("section", "community-section");
    section.id = "club-weekly";

    const wrap = createElement("div", "community-wrap");
    const heading = createElement("div", "community-heading");
    heading.append(
      createElement("p", "community-eyebrow", "PLANIFIKO JAVËN TËNDE"),
      createElement("h2", "", "Vrapon këtë të diel?"),
      createElement("p", "community-intro", "Zgjidh grupin dhe konfirmo pjesëmarrjen për këtë javë.")
    );

    const form = createElement("form", "rsvp-form");
    form.id = "attendance-form";

    const nameRow = createElement("div", "rsvp-name-row");
    [
      ["firstName", "Emri", "given-name", "Emri yt"],
      ["lastName", "Mbiemri", "family-name", "Mbiemri yt"]
    ].forEach(([name, labelText, autoComplete, placeholder]) => {
      const label = createElement("label", "rsvp-field");
      label.append(createElement("span", "", labelText));
      const input = createElement("input");
      input.name = name;
      input.autocomplete = autoComplete;
      input.required = true;
      input.minLength = 2;
      input.maxLength = 80;
      input.placeholder = placeholder;
      label.append(input);
      nameRow.append(label);
    });

    const groupLabel = createElement("p", "rsvp-label", "ZGJIDH DISTANCËN");
    const choices = createElement("div", "distance-choices");
    [
      [3, "Ritëm i qetë"],
      [6, "Ritëm i qëndrueshëm"]
    ].forEach(([value, note]) => {
      const option = createElement("label", "distance-option");
      const radio = createElement("input");
      radio.type = "radio";
      radio.name = "distance";
      radio.value = String(value);
      radio.required = true;
      const copy = createElement("span", "distance-copy");
      copy.append(createElement("strong", "", `${value} km`), createElement("small", "", note));
      option.append(radio, copy);
      choices.append(option);
    });

    const submit = createElement("button", "rsvp-submit", "Po marr pjesë");
    submit.type = "submit";
    const status = createElement("p", "rsvp-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const counts = createElement("div", "attendance-counts");
    counts.setAttribute("aria-live", "polite");

    const privacy = createElement("p", "rsvp-privacy", "Emri dhe grupi përdoren vetëm për organizimin e këtij vrapimi. ");
    const privacyLink = createElement("a", "", "njoftimin e privatësisë");
    privacyLink.href = "/privacy.html";
    privacy.append(privacyLink, document.createTextNode("."));

    form.append(nameRow, groupLabel, choices, submit, status);
    wrap.append(heading, form, counts, privacy);
    section.append(wrap);
    target.after(section);

    async function refreshCounts() {
      try {
        const response = await fetch(`/api/attendance?date=${encodeURIComponent(date)}`);
        if (!response.ok) throw new Error("fetch");
        const data = await response.json();
        counts.replaceChildren();
        [3, 6].forEach((distance) => {
          const value = Number(data?.counts?.[distance] || 0);
          counts.append(createElement("span", "count-pill", `${distance} km · ${value}`));
        });
      } catch {
        counts.textContent = "Numri i pjesëmarrësve nuk mund të ngarkohet tani.";
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      submit.disabled = true;
      status.textContent = "Duke regjistruar pjesëmarrjen…";
      try {
        const response = await fetch("/api/attendance", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            firstName: values.get("firstName"),
            lastName: values.get("lastName"),
            distanceKm: values.get("distance"),
            eventDate: date,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Regjistrimi nuk u krye.");
        status.textContent = "U regjistrove për grupin e zgjedhur. Faleminderit!";
        form.reset();
        await refreshCounts();
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : "Nuk u regjistrua. Provo përsëri.";
      } finally {
        submit.disabled = false;
      }
    });

    refreshCounts();
    return section;
  }

  ensureCommunitySection();
})();
