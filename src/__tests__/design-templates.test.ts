import assert from "node:assert/strict";
import test from "node:test";
import {
  DESIGN_TEMPLATES,
  getDesignTemplate,
  DEFAULT_TEMPLATE_ID,
} from "../lib/design-templates";

test("Design Templates Registry contains all 6 curated templates", () => {
  assert.equal(DESIGN_TEMPLATES.length, 6);
  const ids = DESIGN_TEMPLATES.map((t) => t.id);
  assert.deepEqual(ids, [
    "warm-sanctuary",
    "neo-brutalism",
    "glassmorphism",
    "editorial-zen",
    "claymorphism",
    "midnight-serenity",
  ]);
});

test("Default template is Warm Sanctuary", () => {
  assert.equal(DEFAULT_TEMPLATE_ID, "warm-sanctuary");
  const defaultTemplate = getDesignTemplate();
  assert.equal(defaultTemplate.id, "warm-sanctuary");
  assert.equal(defaultTemplate.name, "Warm Sanctuary");
});

test("getDesignTemplate returns correct template for valid IDs", () => {
  const neo = getDesignTemplate("neo-brutalism");
  assert.equal(neo.id, "neo-brutalism");
  assert.equal(neo.name, "Neo-Brutalism Editorial");

  const glass = getDesignTemplate("glassmorphism");
  assert.equal(glass.id, "glassmorphism");
  assert.equal(glass.name, "Aetheric Glass");

  const zen = getDesignTemplate("editorial-zen");
  assert.equal(zen.id, "editorial-zen");

  const clay = getDesignTemplate("claymorphism");
  assert.equal(clay.id, "claymorphism");
  assert.equal(clay.accentColor, "#B8A9F0");

  const dark = getDesignTemplate("midnight-serenity");
  assert.equal(dark.id, "midnight-serenity");
});

test("getDesignTemplate falls back gracefully for invalid or unknown IDs", () => {
  const fallbackNull = getDesignTemplate(undefined as unknown as string);
  assert.equal(fallbackNull.id, "warm-sanctuary");

  const fallbackUnknown = getDesignTemplate("unknown-template-xyz");
  assert.equal(fallbackUnknown.id, "warm-sanctuary");
});

test("Each template has complete previewClass definitions", () => {
  for (const t of DESIGN_TEMPLATES) {
    assert.ok(t.previewClass.container, `${t.id} must have container class`);
    assert.ok(t.previewClass.title, `${t.id} must have title class`);
    assert.ok(t.previewClass.content, `${t.id} must have content class`);
    assert.ok(t.previewClass.tag, `${t.id} must have tag class`);
    assert.ok(t.previewClass.badge, `${t.id} must have badge class`);
    assert.ok(t.previewClass.mediaCard, `${t.id} must have mediaCard class`);
    assert.ok(t.previewClass.literaCard, `${t.id} must have literaCard class`);
    assert.ok(t.previewClass.authorAvatar, `${t.id} must have authorAvatar class`);
  }
});
