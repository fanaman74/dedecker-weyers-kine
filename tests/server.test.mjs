import { test } from "node:test";
import assert from "node:assert/strict";

import { createApp, validateContactPayload } from "../server.js";

const validPayload = {
  name: "Marie Peeters",
  email: "marie@example.com",
  phone: "0499 00 00 00",
  contactMethod: "Telefoon",
  message: "Ik wil graag teruggebeld worden voor een afspraak.",
  consent: true,
  company: ""
};

test("validateContactPayload accepts a practical contact request", () => {
  const result = validateContactPayload(validPayload);

  assert.equal(result.ok, true);
  assert.equal(result.data.name, "Marie Peeters");
  assert.equal(result.data.email, "marie@example.com");
});

test("validateContactPayload rejects missing consent and honeypot spam", () => {
  assert.equal(validateContactPayload({ ...validPayload, consent: false }).ok, false);
  assert.equal(validateContactPayload({ ...validPayload, company: "spam co" }).ok, false);
});

test("POST /api/contact sends mail through Resend", async () => {
  const calls = [];
  const app = createApp({
    env: {
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM: "Dedecker-Weyers <contact@example.com>",
      CONTACT_TO: "eway@skynet.be"
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
    }
  });

  const response = await app.fetch(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload)
    })
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  assert.equal(calls[0].options.headers.Authorization, "Bearer re_test_key");
  assert.match(calls[0].options.body, /Marie Peeters/);
});

test("POST /api/contact fails safely when Resend is not configured", async () => {
  const app = createApp({ env: {}, fetchImpl: async () => new Response("{}", { status: 200 }) });

  const response = await app.fetch(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload)
    })
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { ok: false, error: "Email service is not configured." });
});

test("POST /api/contact rejects malformed Resend sender configuration", async () => {
  let calls = 0;
  const app = createApp({
    env: {
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM: "fredanaman\"gmail.com",
      CONTACT_TO: "eway@skynet.be"
    },
    fetchImpl: async () => {
      calls += 1;
      return new Response("{}", { status: 200 });
    }
  });

  const response = await app.fetch(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload)
    })
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { ok: false, error: "Email sender address is not configured correctly." });
  assert.equal(calls, 0);
});

test("GET /health returns ok for Railway health checks", async () => {
  const app = createApp({ env: {}, fetchImpl: async () => new Response("{}", { status: 200 }) });

  const response = await app.fetch(new Request("http://localhost/health"));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
