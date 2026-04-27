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

The browser form posts to `POST /api/contact`. The API key is only read by `server.js` and is never exposed in `Afspraak.html`.

## Tests

```bash
node --test tests/*.test.mjs
```
