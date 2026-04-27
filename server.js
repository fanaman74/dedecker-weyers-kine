import { createReadStream, existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".webp": "image/webp"
};

export function loadEnv(filePath = join(rootDir, ".env")) {
  if (!existsSync(filePath)) return {};

  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
        return [key.trim(), value];
      })
  );
}

export function validateContactPayload(payload) {
  const data = {
    name: String(payload?.name || "").trim(),
    email: String(payload?.email || "").trim(),
    phone: String(payload?.phone || "").trim(),
    contactMethod: String(payload?.contactMethod || "").trim(),
    message: String(payload?.message || "").trim(),
    company: String(payload?.company || "").trim(),
    consent: payload?.consent === true || payload?.consent === "true" || payload?.consent === "on"
  };

  if (data.company) return { ok: false, error: "Spam check failed." };
  if (!data.consent) return { ok: false, error: "Consent is required." };
  if (data.name.length < 2) return { ok: false, error: "Name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { ok: false, error: "A valid email is required." };
  if (data.message.length < 8) return { ok: false, error: "Message is required." };

  return { ok: true, data };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildEmailHtml(data) {
  return `
    <h1>Nieuwe contactvraag</h1>
    <p><strong>Naam:</strong> ${escapeHtml(data.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
    <p><strong>Telefoon:</strong> ${escapeHtml(data.phone || "Niet ingevuld")}</p>
    <p><strong>Voorkeur contact:</strong> ${escapeHtml(data.contactMethod || "Niet ingevuld")}</p>
    <p><strong>Boodschap:</strong></p>
    <p>${escapeHtml(data.message).replaceAll("\n", "<br>")}</p>
  `;
}

async function sendWithResend({ env, fetchImpl, data }) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM;
  const to = env.CONTACT_TO;

  if (!apiKey || !from || !to) {
    return { ok: false, status: 500, error: "Email service is not configured." };
  }

  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: data.email,
      subject: `Contactvraag van ${data.name}`,
      html: buildEmailHtml(data)
    })
  });

  if (!response.ok) {
    return { ok: false, status: 502, error: "Email could not be sent." };
  }

  return { ok: true };
}

async function handleContact(request, env, fetchImpl) {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON." }, 400);
  }

  const validation = validateContactPayload(payload);
  if (!validation.ok) return json({ ok: false, error: validation.error }, 400);

  const result = await sendWithResend({ env, fetchImpl, data: validation.data });
  if (!result.ok) return json({ ok: false, error: result.error }, result.status);

  return json({ ok: true });
}

async function serveStatic(pathname) {
  const requestedPath = pathname === "/" ? "/Afspraak.html" : pathname;
  const safePath = normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(rootDir, `.${safePath}`);

  if (!filePath.startsWith(rootDir) || !existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const headers = { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" };
  return new Response(createReadStream(filePath), { headers });
}

export function createApp({ env = { ...process.env, ...loadEnv() }, fetchImpl = globalThis.fetch } = {}) {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === "/health") return json({ ok: true });
      if (url.pathname === "/api/contact") return handleContact(request, env, fetchImpl);
      return serveStatic(url.pathname);
    }
  };
}

async function nodeRequestToWebRequest(request) {
  const protocol = request.socket.encrypted ? "https" : "http";
  const url = `${protocol}://${request.headers.host}${request.url}`;
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);

  return new Request(url, {
    method: request.method,
    headers: request.headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined
  });
}

async function writeWebResponse(webResponse, response) {
  response.writeHead(webResponse.status, Object.fromEntries(webResponse.headers));
  if (webResponse.body) {
    for await (const chunk of webResponse.body) response.write(chunk);
  }
  response.end();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = createApp();
  const port = Number(process.env.PORT || loadEnv().PORT || 4321);
  const server = createServer(async (request, response) => {
    try {
      await writeWebResponse(await app.fetch(await nodeRequestToWebRequest(request)), response);
    } catch (error) {
      console.error(error);
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end("Internal server error");
    }
  });

  server.listen(port, () => {
    console.log(`Kinesitherapie app running at http://localhost:${port}`);
  });
}
