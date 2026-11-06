(() => {
  "use strict";
  const TOKEN_KEY = "grc-admin-token";
  const loginPanel = document.querySelector("#login-panel");
  const applicationsPanel = document.querySelector("#applications-panel");
  const list = document.querySelector("#application-list");
  const dialog = document.querySelector("#application-dialog");
  const panelMessage = document.querySelector("#panel-message");
  const statusLabels = { pending: "Në pritje", approved: "Aprovuar", rejected: "Refuzuar" };
  let applications = [];
  let activeApplication = null;
  const escapeText = (value) => String(value ?? "");
  const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };

  async function api(path, options = {}) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const response = await fetch(path, { ...options, headers: { authorization: `Bearer ${token}`, ...(options.body ? { "content-type": "application/json" } : {}), ...options.headers } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Kërkesa dështoi (${response.status}).`);
    return result;
  }
  function showLogin() { loginPanel.hidden = false; applicationsPanel.hidden = true; document.querySelector("#logout").hidden = true; }
  function showPanel() { loginPanel.hidden = true; applicationsPanel.hidden = false; document.querySelector("#logout").hidden = false; }

  async function loadApplications() {
    panelMessage.textContent = "Duke ngarkuar aplikimet…";
    try {
      const data = await api("/api/admin/applications");
      applications = Array.isArray(data.applications) ? data.applications : [];
      showPanel(); renderList(); panelMessage.textContent = "";
    } catch (error) {
      panelMessage.textContent = error.message;
      if (/401|403|token/i.test(error.message)) { sessionStorage.removeItem(TOKEN_KEY); showLogin(); document.querySelector("#login-error").textContent = "Token-i nuk u pranua. Kontrollo konfigurimin në Cloudflare."; }
    }
  }

  function renderList() {
    const filter = document.querySelector("#status-filter").value;
    const rows = applications.filter((app) => filter === "all" || app.status === filter);
    document.querySelector("#result-count").textContent = `${rows.length} aplikim${rows.length === 1 ? "" : "e"}`;
    list.replaceChildren();
    if (!rows.length) { list.append(element("p", "empty-state", "Nuk ka aplikime në këtë filtër.")); return; }
    rows.forEach((app) => {
      const card = element("article", "application-card");
      const info = element("div", "application-info");
      const title = element("h2", "", `${escapeText(app.first_name)} ${escapeText(app.last_name)}`);
      const meta = element("p", "application-meta", `${escapeText(app.email)} · ${new Date(`${app.created_at.replace(" ", "T")}Z`).toLocaleString("sq-XK")}`);
      const badge = element("span", `status-badge status-${app.status}`, statusLabels[app.status] || "Në pritje");
      info.append(title, meta); const actions = element("div", "application-actions"); actions.append(badge);
      const view = element("button", "view-button", "Shiko detajet →"); view.type = "button"; view.addEventListener("click", () => openDetails(app.id)); actions.append(view);
      card.append(info, actions); list.append(card);
    });
  }

  function draftFor(app, status) {
    const hello = `Përshëndetje ${app.first_name},`;
    if (status === "approved") return `${hello}\n\nKemi kënaqësinë të të njoftojmë se aplikimi yt për anëtarësim në Gjakova Run Club është aprovuar. Do të të kontaktojmë së shpejti me informatat e radhës.\n\nMirë se vjen në ekip!\nGjakova Run Club`;
    if (status === "rejected") return `${hello}\n\nFaleminderit për interesimin dhe aplikimin për anëtarësim në Gjakova Run Club. Pas shqyrtimit, këtë herë nuk mund ta aprovojmë aplikimin. Të falënderojmë për mirëkuptimin dhe të urojmë suksese.\n\nMe respekt,\nGjakova Run Club`;
    return `${hello}\n\nFaleminderit për aplikimin për anëtarësim në Gjakova Run Club. E kemi pranuar dhe do ta shqyrtojmë; do të të kontaktojmë sapo të kemi një përgjigje.\n\nMe respekt,\nGjakova Run Club`;
  }

  function openDetails(id) {
    activeApplication = applications.find((app) => app.id === id);
    if (!activeApplication) return;
    const app = activeApplication;
    document.querySelector("#detail-name").textContent = `${app.first_name} ${app.last_name}`;
    document.querySelector("#detail-date").textContent = `Aplikimi u dërgua: ${new Date(`${app.created_at.replace(" ", "T")}Z`).toLocaleString("sq-XK")}`;
    const fields = document.querySelector("#detail-fields"); fields.replaceChildren();
    [["Email", app.email], ["Datëlindja", app.birth_date], ["Statusi", statusLabels[app.status] || "Në pritje"]].forEach(([label, value]) => { fields.append(element("dt", "", label), element("dd", "", value)); });
    const status = document.querySelector("#detail-status");
    if (status) status.remove();
    const selectLabel = element("label", "status-select-label", "Ndrysho statusin"); selectLabel.htmlFor = "detail-status";
    const select = element("select"); select.id = "detail-status";
    Object.entries(statusLabels).forEach(([value, text]) => { const option = element("option", "", text); option.value = value; option.selected = app.status === value; select.append(option); });
    fields.after(selectLabel, select);
    const textarea = document.querySelector("#email-draft"); textarea.value = draftFor(app, select.value);
    select.addEventListener("change", () => { textarea.value = draftFor(app, select.value); updateGmailLink(); });
    textarea.addEventListener("input", updateGmailLink);
    document.querySelector("#detail-message").textContent = "";
    updateGmailLink(); dialog.showModal();
  }

  function updateGmailLink() {
    if (!activeApplication) return;
    const status = document.querySelector("#detail-status").value;
    const subject = status === "approved" ? "Aplikimi yt u aprovua – Gjakova Run Club" : status === "rejected" ? "Përgjigje për aplikimin – Gjakova Run Club" : "Aplikimi yt u pranua për shqyrtim – Gjakova Run Club";
    const url = new URL("https://mail.google.com/mail/");
    url.search = new URLSearchParams({ view: "cm", fs: "1", to: activeApplication.email, su: subject, body: document.querySelector("#email-draft").value }).toString();
    document.querySelector("#gmail-link").href = url.toString();
  }

  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#admin-token"), error = document.querySelector("#login-error");
    sessionStorage.setItem(TOKEN_KEY, input.value); input.value = ""; error.textContent = "";
    await loadApplications();
  });
  document.querySelector("#logout").addEventListener("click", () => { sessionStorage.removeItem(TOKEN_KEY); applications = []; showLogin(); });
  document.querySelector("#refresh").addEventListener("click", loadApplications);
  document.querySelector("#status-filter").addEventListener("change", renderList);
  document.querySelector("#save-status").addEventListener("click", async () => {
    if (!activeApplication) return;
    const message = document.querySelector("#detail-message"), status = document.querySelector("#detail-status").value;
    try {
      await api("/api/admin/applications", { method: "PATCH", body: JSON.stringify({ id: activeApplication.id, status }) });
      activeApplication.status = status;
      const index = applications.findIndex((app) => app.id === activeApplication.id);
      if (index >= 0) applications[index].status = status;
      message.textContent = "Statusi u ruajt. Nëse po i dërgon email, hape draftin në Gmail dhe shtype Dërgo.";
      renderList();
      const dt = document.querySelector("#detail-fields").querySelectorAll("dd")[2]; if (dt) dt.textContent = statusLabels[status];
    } catch (error) { message.textContent = error.message; }
  });

  const savedToken = sessionStorage.getItem(TOKEN_KEY);
  if (savedToken) loadApplications(); else showLogin();
})();
