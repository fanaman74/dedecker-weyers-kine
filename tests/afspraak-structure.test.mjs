import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const htmlPath = new URL("../Afspraak.html", import.meta.url);

test("appointment page implements the requested sections and practice details", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /<html lang="nl"/);
  assert.match(html, /Maak een afspraak/);
  assert.match(html, /<video[^>]+class="hero-video"/);
  assert.match(html, /assets\/dedecker-weyers-logo\.png/);
  assert.match(html, /02 267 72 88/);
  assert.match(html, /eway@skynet\.be/);
  assert.match(html, /Veldstraat 24/);
  assert.match(html, /Behandelingen worden uitsluitend op afspraak uitgevoerd/);
  assert.match(html, /Nieuwe afspraak\? Bel ons of gebruik het online reservatiesysteem zodra beschikbaar/);
  assert.match(html, /Wat brengt u mee/);
  assert.match(html, /Huisbezoeken/);
  assert.match(html, /Vermeld geen gevoelige medische informatie/);
  assert.match(html, /Ik ga akkoord dat mijn gegevens gebruikt worden om mijn vraag te beantwoorden/);

  const treatmentCards = html.match(/class="[^"]*treat-card[^"]*"/g) ?? [];
  assert.ok(treatmentCards.length >= 9, "expected at least 9 treatment cards");

  for (const name of [
    "Yves Dedecker",
    "Aurélie Myaux",
    "Annick Weyers",
    "Antoon Goegebeur",
    "Jeanne Vignette",
    "Valentino Coppolaro",
  ]) {
    assert.match(html, new RegExp(name));
  }
});

test("appointment page avoids pretending a real booking or medical intake exists", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.doesNotMatch(html, /Aanvraag verstuurd/);
  assert.doesNotMatch(html, /Plan uw afspraak/);
  assert.doesNotMatch(html, /name="diagnosis"|name="symptoms"|name="medical/i);
});

test("contact form posts to the full-stack contact endpoint", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /fetch\("\/api\/contact"/);
  assert.match(html, /new FormData\(form\)/);
  assert.match(html, /form\.dataset\.state = "submitting"/);
  assert.match(html, /form\.dataset\.state = "success"/);
  assert.match(html, /form\.dataset\.state = "error"/);
});

test("hero appointment button appears directly below the appointment text", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(
    html,
    /<div class="hero-copy">\s*<p[^>]*>Behandelingen worden uitsluitend op afspraak uitgevoerd[\s\S]*?<\/p>\s*<a class="hero-appointment-link" href="#afspraak"[^>]*>By appointment<\/a>\s*<\/div>/
  );
});

test("hero headline uses a restrained responsive font scale", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /h1\s*\{[\s\S]*?font-size:\s*clamp\(48px,\s*7vw,\s*112px\);/);
  assert.match(html, /@media \(max-width: 640px\)[\s\S]*?h1\s*\{\s*font-size:\s*clamp\(44px,\s*15vw,\s*68px\);/);
});

test("old blue about section has been removed", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.doesNotMatch(html, /<section class="about-us"/);
  assert.doesNotMatch(html, /<div class="about-panel"/);
  assert.doesNotMatch(html, /<h2 id="about-title">About us<\/h2>/);
  assert.doesNotMatch(html, /BVBA Dedecker-Weyers physiotherapy offers since 35 years/);
});

test("practice intro section appears above the three practical cards", async () => {
  const html = await readFile(htmlPath, "utf8");
  const sectionMatch = html.match(
    /<section class="practice-intro" aria-labelledby="practice-title">[\s\S]*?<\/section>\s*<section class="info-row"/
  );

  assert.ok(sectionMatch, "expected practice intro section directly before practical card row");
  const section = sectionMatch[0];
  for (const text of [
    "Ruim 35 jaar gespecialiseerde",
    "kinesitherapie",
    "Koningslo-Vilvoorde",
    "SINDS 1989",
    "35",
    "Jaar ervaring",
    "9",
    "Behandelvormen",
    "4",
    "Therapeuten",
  ]) {
    assert.match(section, new RegExp(text));
  }
});

test("page has EN FR PL NL language toggle with persistent translation support", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /<div class="language-switcher" role="group" aria-label="Language"/);
  for (const lang of ["NL", "EN", "FR", "PL"]) {
    assert.match(html, new RegExp(`<button type="button" class="lang-option[\\s\\S]*?data-lang="${lang.toLowerCase()}"[\\s\\S]*?>${lang}</button>`));
  }
  assert.match(html, /const translations = \{/);
  assert.match(html, /nl: \{/);
  assert.match(html, /en: \{/);
  assert.match(html, /fr: \{/);
  assert.match(html, /pl: \{/);
  assert.match(html, /localStorage\.setItem\("preferredLanguage", lang\)/);
  assert.match(html, /new URLSearchParams\(window\.location\.search\)\.get\("lang"\)/);
  assert.match(html, /document\.documentElement\.lang = lang;/);
  assert.match(html, /querySelectorAll\("\[data-i18n\]"\)/);
});

test("language coverage includes all visible content sections", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /id="marquee"[\s\S]*data-i18n-html="marquee.text"/);
  assert.match(html, /data-i18n="nav.team"/);
  assert.match(html, /data-i18n="nav.contact"/);
  assert.match(html, /data-i18n="booking.todo"/);
  assert.match(html, /data-i18n="footer.country"/);

  const treatmentCards = html.match(/<article class="treat-card card">[\s\S]*?<\/article>/g) ?? [];
  assert.ok(treatmentCards.length >= 9, "expected treatment cards to audit");
  for (const card of treatmentCards) {
    assert.match(card, /<h3 data-i18n="treatment\.[^"]+Title"/);
    assert.match(card, /<p data-i18n="treatment\.[^"]+Copy"/);
    assert.match(card, /<span class="tag" data-i18n="treatment\.[^"]+Tag"/);
  }

  const checklistItems = html.match(/<li data-i18n="checklist\.[^"]+"/g) ?? [];
  assert.equal(checklistItems.length, 5);

  const teamRoles = html.match(/<p class="role" data-i18n="team\.role">/g) ?? [];
  assert.equal(teamRoles.length, 6);
  assert.match(html, /data-i18n="team\.note"/);

  const translationKeys = new Set(
    [...html.matchAll(/data-i18n(?:-html|-placeholder)?="([^"]+)"/g)].map((match) => match[1])
  );
  for (const key of translationKeys) {
    const dictionaryEntries = html.match(new RegExp(`"${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}":`, "g")) ?? [];
    assert.equal(dictionaryEntries.length, 4, `${key} should have NL, EN, FR and PL translations`);
  }
});

test("practice visual uses a care icon instead of the old therapy table illustration", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.doesNotMatch(html, /class="therapy-scene"/);
  assert.doesNotMatch(html, /\.therapy-head|\.therapy-body|\.therapy-table|\.therapy-line/);
  assert.match(html, /<svg class="practice-icon"[^>]+aria-label="Care and movement icon"/);
  assert.doesNotMatch(html, /class="practice-icon-leaf"/);
  assert.match(html, /class="practice-icon-hands"/);
});

test("hero omits the direct call block", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.doesNotMatch(html, /class="hero-direct"/);
  assert.doesNotMatch(html, /data-i18n="hero\.call"/);
});
