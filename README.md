# Kinesitherapie Dedecker-Weyers

Full-stack Node app for the appointment/contact website.

## Run Locally

```bash
cp .env.example .env
node server.js
```

Open `http://localhost:4321`.

## Resend Setup

Create a Resend API key with sending access, verify the sending domain in Resend, then fill `.env`:

```bash
RESEND_API_KEY=re_your_key_here
RESEND_FROM="Dedecker-Weyers <contact@your-verified-domain.be>"
CONTACT_TO=eway@skynet.be
PORT=4321
```

`RESEND_FROM` must use a domain verified in Resend. Personal providers such as `gmail.com`, `skynet.be`, or `outlook.com` generally cannot be used as the sender domain unless that exact domain is verified in your Resend account. In Railway, set the same `RESEND_API_KEY`, `RESEND_FROM`, and `CONTACT_TO` variables on the deployed service.

The browser form posts to `POST /api/contact`. The API key is only read by `server.js` and is never exposed in `Afspraak.html`.

## Tests

```bash
node --test tests/*.test.mjs
```
