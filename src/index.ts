export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: D1Database;
  CLUB_EMAIL: string;
  RESEND_API_KEY?: string;
  VERIFIED_FROM_EMAIL?: string;
}

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const MAX_REQUEST_BYTES = 8 * 1024;
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

function validEmail(value: string): boolean { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function validBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`), today = new Date();
  const earliest = new Date(`${today.getUTCFullYear() - 120}-01-01T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= today && date >= earliest;
}
async function sendEmail(env: Env, to: string, subject: string, html: string): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.VERIFIED_FROM_EMAIL) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ from: env.VERIFIED_FROM_EMAIL, to: [to], subject, html }) });
    return response.ok;
  } catch { return false; }
}
async function readBoundedJson(request: Request): Promise<Record<string, unknown> | null> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES || !request.body) return null;
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; length += value.byteLength; if (length > MAX_REQUEST_BYTES) { await reader.cancel(); return null; } chunks.push(value); }
  } catch { return null; }
  try {
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch { return null; }
}
function sameOrigin(request: Request): boolean {
  try { const origin = request.headers.get("Origin"); return Boolean(origin && new URL(origin).origin === new URL(request.url).origin); }
  catch { return false; }
}
async function submitMembership(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Metodë e palejuar." }, 405);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return json({ error: "Formati i kërkesës nuk është i vlefshëm." }, 415);
  if (!sameOrigin(request)) return json({ error: "Kërkesë e palejuar." }, 403);
  const body = await readBoundedJson(request);
  if (!body) return json({ error: "Të dhënat nuk janë të vlefshme ose janë tepër të mëdha." }, 400);
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const birthDate = typeof body.birthDate === "string" ? body.birthDate : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (firstName.length < 2 || firstName.length > 80 || lastName.length < 2 || lastName.length > 80 || !validBirthDate(birthDate) || !validEmail(email) || body.consent !== true) return json({ error: "Kontrollo fushat dhe prano njoftimin e privatësisë." }, 400);
  try { await env.DB.prepare("INSERT INTO membership_applications (id, first_name, last_name, birth_date, email) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), firstName, lastName, birthDate, email).run(); }
  catch { return json({ error: "Nuk u ruajt aplikimi. Provo përsëri më vonë." }, 503); }
  const clubMessage = `<p>Aplikim i ri për anëtarësim në Gjakova Run Club.</p><ul><li>Emri: ${escapeHtml(firstName)} ${escapeHtml(lastName)}</li><li>Datëlindja: ${birthDate}</li><li>Email: ${escapeHtml(email)}</li></ul>`;
  const applicantMessage = `<p>Përshëndetje ${escapeHtml(firstName)},</p><p>E pranuam aplikimin tënd për anëtarësim në Gjakova Run Club. Klubi do ta shqyrtojë dhe do të të kontaktojë.</p>`;
  const [clubSent, applicantSent] = await Promise.all([sendEmail(env, env.CLUB_EMAIL, "Aplikim i ri – Gjakova Run Club", clubMessage), sendEmail(env, email, "E pranuam aplikimin tënd – Gjakova Run Club", applicantMessage)]);
  return json({ ok: true, emailConfigured: clubSent && applicantSent });
}
function validEventDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`), today = new Date();
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || date.getUTCDay() !== 0) return false;
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysAhead = (date.getTime() - todayUtc) / 86400000;
  return daysAhead >= 0 && daysAhead <= 7;
}
async function attendance(request: Request, env: Env): Promise<Response> {
  if (request.method === "GET") {
    const eventDate = new URL(request.url).searchParams.get("date");
    if (!validEventDate(eventDate)) return json({ error: "Data e vrapimit nuk është e vlefshme." }, 400);
    try {
      await env.DB.prepare("DELETE FROM run_attendance WHERE event_date < date('now', '-30 days')").run();
      const result = await env.DB.prepare("SELECT distance_km, COUNT(*) AS count FROM run_attendance WHERE event_date = ? GROUP BY distance_km").bind(eventDate).all<{ distance_km: number; count: number }>();
      const counts: Record<number, number> = { 3: 0, 6: 0 };
      for (const row of result.results || []) counts[row.distance_km] = row.count;
      return json({ eventDate, counts });
    } catch { return json({ error: "Pjesëmarrjet nuk mund të ngarkohen tani." }, 503); }
  }
  if (request.method !== "POST") return json({ error: "Metodë e palejuar." }, 405);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return json({ error: "Formati i kërkesës nuk është i vlefshëm." }, 415);
  if (!sameOrigin(request)) return json({ error: "Kërkesë e palejuar." }, 403);
  const body = await readBoundedJson(request);
  if (!body) return json({ error: "Të dhënat nuk janë të vlefshme ose janë tepër të mëdha." }, 400);
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const distance = Number(body.distanceKm);
  if (firstName.length < 2 || firstName.length > 80 || lastName.length < 2 || lastName.length > 80 || ![3, 6].includes(distance) || !validEventDate(body.eventDate)) return json({ error: "Plotëso emrin, mbiemrin dhe zgjidh grupin 3 km ose 6 km." }, 400);
  try {
    await env.DB.prepare("DELETE FROM run_attendance WHERE event_date < date('now', '-30 days')").run();
    await env.DB.prepare("INSERT INTO run_attendance (id, event_date, first_name, last_name, distance_km) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), body.eventDate, firstName, lastName, distance).run();
    return json({ ok: true });
  } catch { return json({ error: "Regjistrimi nuk u ruajt. Provo përsëri më vonë." }, 503); }
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!); }
function secure(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff"); headers.set("X-Frame-Options", "DENY"); headers.set("Referrer-Policy", "strict-origin-when-cross-origin"); headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()"); headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  if (new URL(request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
async function weather(): Promise<Response> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({ latitude: "42.3803", longitude: "20.4308", timezone: "Europe/Belgrade", current: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m", daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max", forecast_days: "7" }).toString();
  try {
    const upstream = await fetch(url, { cf: { cacheTtl: 900, cacheEverything: true } });
    if (!upstream.ok) return json({ error: "Parashikimi nuk është i disponueshëm tani." }, 502);
    return new Response(await upstream.text(), { headers: { ...JSON_HEADERS, "cache-control": "public, max-age=900" } });
  } catch { return json({ error: "Nuk mund të merret moti tani." }, 502); }
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url); let response: Response;
    if (url.pathname === "/api/membership") response = await submitMembership(request, env);
    else if (url.pathname === "/api/attendance") response = await attendance(request, env);
    else if (url.pathname === "/api/weather" && request.method === "GET") response = await weather();
    else if (url.pathname.startsWith("/api/")) response = json({ error: "Nuk u gjet." }, 404);
    else response = await env.ASSETS.fetch(request);
    return secure(response, request);
  },
} satisfies ExportedHandler<Env>;
