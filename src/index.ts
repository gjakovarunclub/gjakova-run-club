export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: D1Database;
  CLUB_EMAIL: string;
  RESEND_API_KEY?: string;
  VERIFIED_FROM_EMAIL?: string;
}

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

function validEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  const today = new Date();
  const earliest = new Date(`${today.getUTCFullYear() - 120}-01-01T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= today && date >= earliest;
}

async function sendEmail(env: Env, to: string, subject: string, html: string): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.VERIFIED_FROM_EMAIL) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.VERIFIED_FROM_EMAIL, to: [to], subject, html }),
  });
  return response.ok;
}

async function submitMembership(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Metodë e palejuar." }, 405);
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).origin !== new URL(request.url).origin) return json({ error: "Kërkesë e palejuar." }, 403);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: "Të dhënat nuk janë të vlefshme." }, 400); }

  // Honeypot field: bots often fill hidden inputs; silently accept without storing.
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const birthDate = typeof body.birthDate === "string" ? body.birthDate : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (firstName.length < 2 || firstName.length > 80 || lastName.length < 2 || lastName.length > 80 || !validBirthDate(birthDate) || !validEmail(email) || body.consent !== true) {
    return json({ error: "Kontrollo fushat dhe prano njoftimin e privatësisë." }, 400);
  }

  const id = crypto.randomUUID();
  try {
    await env.DB.prepare("INSERT INTO membership_applications (id, first_name, last_name, birth_date, email) VALUES (?, ?, ?, ?, ?)")
      .bind(id, firstName, lastName, birthDate, email).run();
  } catch {
    return json({ error: "Nuk u ruajt aplikimi. Provo përsëri më vonë." }, 503);
  }

  const safeName = firstName.replace(/[&<>"']/g, "");
  const clubMessage = `<p>Aplikim i ri për anëtarësim në Gjakova Run Club.</p><ul><li>Emri: ${escapeHtml(firstName)} ${escapeHtml(lastName)}</li><li>Datëlindja: ${birthDate}</li><li>Email: ${escapeHtml(email)}</li><li>ID: ${id}</li></ul>`;
  const applicantMessage = `<p>Përshëndetje ${escapeHtml(safeName)},</p><p>E pranuam aplikimin tënd për anëtarësim në Gjakova Run Club. Klubi do ta shqyrtojë dhe do të të kontaktojë.</p><p>Vrapimet tona organizohen të dielave në ora 11:00. Takimi: Parku i Qytetit, Gjakovë.</p><p>Me respekt,<br>Gjakova Run Club</p>`;
  const [clubSent, applicantSent] = await Promise.all([
    sendEmail(env, env.CLUB_EMAIL, "Aplikim i ri – Gjakova Run Club", clubMessage),
    sendEmail(env, email, "E pranuam aplikimin tënd – Gjakova Run Club", applicantMessage),
  ]);
  return json({ ok: true, emailConfigured: clubSent && applicantSent });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

async function weather(): Promise<Response> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: "42.3803", longitude: "20.4308", timezone: "Europe/Belgrade",
    current: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "7",
  }).toString();
  try {
    const upstream = await fetch(url, { cf: { cacheTtl: 900, cacheEverything: true } });
    if (!upstream.ok) return json({ error: "Parashikimi nuk është i disponueshëm tani." }, 502);
    return new Response(await upstream.text(), { headers: { ...JSON_HEADERS, "cache-control": "public, max-age=900" } });
  } catch { return json({ error: "Nuk mund të merret moti tani." }, 502); }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/membership") return submitMembership(request, env);
    if (url.pathname === "/api/weather" && request.method === "GET") return weather();
    if (url.pathname.startsWith("/api/")) return json({ error: "Nuk u gjet." }, 404);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
