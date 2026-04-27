import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const teamPath = new URL("../Team.html", import.meta.url);
const afspraakPath = new URL("../Afspraak.html", import.meta.url);

const expectedTeam = [
  ["Yves Dedecker", "0472/499574"],
  ["Valentino Coppolaro", "0491/492962"],
  ["Aurélie Myaux", "0472/892105"],
  ["Annick Weyers", "0486/961077"],
  ["Antoon Goegebeur", "0470/203086"],
  ["Jeanne Vignette", "0491/493007"],
];

test("appointment page includes real team information and images", async () => {
  const html = await readFile(afspraakPath, "utf8");

  for (const [name, phone] of expectedTeam) {
    assert.match(html, new RegExp(name));
    assert.match(html, new RegExp(phone.replace("/", "\\/")));
  }

  assert.equal((html.match(/class="[^"]*team-card[^"]*"/g) ?? []).length, 6);
  assert.equal((html.match(/<img src="assets\/team\//g) ?? []).length, 6);
  assert.equal((html.match(/class="badge defense" data-i18n="team\.defenseBadge"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /Celine Hoste/);
});

test("appointment page links to the in-page team section", async () => {
  const html = await readFile(afspraakPath, "utf8");

  assert.match(html, /<a href="#team" data-i18n="nav\.team">Team<\/a>/);
  assert.doesNotMatch(html, /Team\.html/);
});

test("standalone team page has been removed", async () => {
  await assert.rejects(readFile(teamPath, "utf8"), { code: "ENOENT" });
});
