import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const htmlPath = new URL("../Afspraak.html", import.meta.url);

test("stacked booking cards shrink to their content on responsive layouts", async () => {
  const html = await readFile(htmlPath, "utf8");

  assert.match(html, /\.method-card\s*\{[\s\S]*?aspect-ratio:\s*1 \/ 1;[\s\S]*?min-height:\s*280px;/);
  assert.match(
    html,
    /@media \(max-width: 1080px\)[\s\S]*?\.method-card\s*\{[\s\S]*?aspect-ratio:\s*auto;[\s\S]*?min-height:\s*0;[\s\S]*?\}/
  );
  assert.match(
    html,
    /@media \(max-width: 1080px\)[\s\S]*?\.method-card \.button-row,\s*\.todo \+ \.button-row\s*\{[\s\S]*?margin-top:\s*18px;[\s\S]*?\}/
  );
});
