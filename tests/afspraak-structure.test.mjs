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

  assert.match(html, /h1\s*\{[\s\S]*?font-size:\s*clamp\(42px,\s*6vw,\s*96px\);/);
  assert.match(html, /@media \(max-width: 640px\)[\s\S]*?h1\s*\{\s*font-size:\s*clamp\(38px,\s*12vw,\s*58px\);/);
});

test("hero video uses a definite responsive viewport box", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /\.hero\s*\{[\s\S]*?min-height:\s*100svh;[\s\S]*?min-height:\s*100dvh;/);
  assert.match(html, /\.hero-video,\s*\.hero-poster\s*\{[\s\S]*?width:\s*100vw;[\s\S]*?height:\s*100%;[\s\S]*?min-height:\s*100svh;[\s\S]*?min-height:\s*100dvh;[\s\S]*?object-fit:\s*cover;/);
  assert.match(html, /\.hero-inner\s*\{[\s\S]*?min-height:\s*100svh;[\s\S]*?min-height:\s*100dvh;/);
  assert.match(html, /@media \(max-width: 640px\)[\s\S]*?\.hero-video,\s*\.hero-poster\s*\{[\s\S]*?min-height:\s*100dvh;/);
});

test("header logo appears without a surrounding card", async () => {
  const html = await readFile(htmlPath, "utf8");
  const markBlock = html.match(/\.mark\s*\{[^}]+\}/)?.[0] ?? "";
  const mobileMarkBlock = html.match(/@media \(max-width: 640px\)[\s\S]*?\.mark\s*\{[^}]+\}/)?.[0] ?? "";

  assert.match(markBlock, /width:\s*auto;/);
  assert.match(markBlock, /padding:\s*0;/);
  assert.match(markBlock, /background:\s*transparent;/);
  assert.match(markBlock, /box-shadow:\s*none;/);
  assert.doesNotMatch(markBlock, /border-radius:|min-width:|min-height:/);
  assert.match(mobileMarkBlock, /\.mark\s*\{\s*padding:\s*0;\s*\}/);
});

test("footer logo card closely fits the transparent logo", async () => {
  const html = await readFile(htmlPath, "utf8");
  const footerBrandBlock = html.match(/\.footer-brand\s*\{[^}]+\}/)?.[0] ?? "";

  assert.match(footerBrandBlock, /display:\s*inline-flex;/);
  assert.match(footerBrandBlock, /width:\s*fit-content;/);
  assert.match(footerBrandBlock, /padding:\s*6px 8px;/);
  assert.doesNotMatch(footerBrandBlock, /width:\s*min\(260px,\s*100%\);/);
});

test("Bowlby One display type uses a smaller scale across the page", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /\.hero-stat strong\s*\{[\s\S]*?font-size:\s*44px;/);
  assert.match(html, /\.marquee-track\s*\{[\s\S]*?font-size:\s*18px;/);
  assert.match(html, /\.practice-copy h2\s*\{[\s\S]*?font-size:\s*clamp\(38px,\s*3\.4vw,\s*50px\);/);
  assert.match(html, /\.practice-stat strong\s*\{[\s\S]*?font-size:\s*32px;/);
  assert.match(html, /\.practice-quote\s*\{[\s\S]*?font-size:\s*20px;/);
  assert.match(html, /\.info-card h2,\s*\.info-card h3,\s*\.side-title\s*\{[\s\S]*?font-size:\s*24px;/);
  assert.match(html, /\.quick-call strong\s*\{[\s\S]*?font-size:\s*19px;/);
  assert.match(html, /\.hours-row span:last-child\s*\{[\s\S]*?font-size:\s*17px;/);
  assert.match(html, /\.section-head h2\s*\{[\s\S]*?font-size:\s*clamp\(36px,\s*4vw,\s*60px\);/);
  assert.match(html, /\.treat-card h3\s*\{[\s\S]*?font-size:\s*20px;/);
  assert.match(html, /\.method-card h3,\s*\.checklist h3,\s*\.contact-form h3\s*\{[\s\S]*?font-size:\s*24px;/);
  assert.match(html, /\.visit-band h2\s*\{[\s\S]*?font-size:\s*clamp\(30px,\s*3\.2vw,\s*46px\);/);
  assert.match(html, /\.team-card h3\s*\{[\s\S]*?font-size:\s*28px;/);
  assert.match(html, /@media \(max-width: 640px\)[\s\S]*?\.practice-copy h2\s*\{\s*font-size:\s*clamp\(36px,\s*11vw,\s*48px\);/);
  assert.match(html, /@media \(max-width: 640px\)[\s\S]*?\.practice-stat strong\s*\{\s*font-size:\s*30px;\s*\}/);
  assert.match(html, /@media \(max-width: 640px\)[\s\S]*?\.practice-quote\s*\{[\s\S]*?font-size:\s*18px;/);
});

test("booking cards form three square cards above a horizontal checklist", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /\.booking-panel\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
  assert.match(html, /\.methods\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/);
  assert.match(html, /\.method-card\s*\{[\s\S]*?aspect-ratio:\s*1 \/ 1;/);
  assert.match(html, /\.booking-side\s*\{[\s\S]*?grid-column:\s*1 \/ -1;/);
  assert.match(html, /\.checklist,\s*\.contact-form\s*\{[\s\S]*?padding:\s*28px;/);
  assert.match(html, /\.checklist\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*minmax\(220px,\s*\.35fr\)\s*1fr;/);
  assert.match(html, /@media \(max-width: 1080px\)[\s\S]*?\.checklist\s*\{[\s\S]*?grid-template-columns:\s*1fr;/);
});

test("online booking TODO appears above the bottom-aligned button", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /\.todo \+ \.button-row\s*\{[\s\S]*?margin-top:\s*auto;/);
  assert.match(
    html,
    /<h3 data-i18n="booking\.onlineTitle">[\s\S]*?<p data-i18n="booking\.onlineCopy">[\s\S]*?<\/p>\s*<div class="todo" data-i18n="booking\.todo">[\s\S]*?<\/div>\s*<div class="button-row"><a class="btn" href="#" aria-disabled="true" data-i18n="booking\.unavailable">/
  );
});

test("team note text is centered in the dark callout", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /\.team-note p\s*\{[\s\S]*?margin:\s*0 auto;[\s\S]*?text-align:\s*center;/);
});

test("contact address card includes a bottom-aligned Google map", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /<article class="info-card dark card contact-address-card">/);
  assert.match(html, /\.location-map\s*\{[\s\S]*?margin-top:\s*auto;[\s\S]*?overflow:\s*hidden;/);
  assert.match(html, /<div class="location-map" aria-label="Google Maps location">[\s\S]*?<iframe[\s\S]*?title="Google Maps location for BVBA Dedecker-Weyers"[\s\S]*?src="https:\/\/www\.google\.com\/maps\?q=Veldstraat%2024%2C%201800%20Koningslo-Vilvoorde&output=embed"[\s\S]*?loading="lazy"/);
});

test("footer links to the published privacy policy", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(
    html,
    /<a href="https:\/\/www\.freeprivacypolicy\.com\/live\/c68a49fd-b666-49a4-a137-af7cd94de3bb" target="_blank" rel="noopener" data-i18n="footer\.privacyPolicy">/
  );
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
