import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProfileUpdatePayload,
  parseBannerParams,
  formatBannerUrl,
} from "./profile-storage";

test("buildProfileUpdatePayload: sets avatar_url to null when avatarUrl is null", () => {
  const payload = buildProfileUpdatePayload({ avatarUrl: null });
  assert.equal(payload.avatar_url, null);
});

test("buildProfileUpdatePayload: sets avatar_url to null when avatarUrl is empty or whitespace", () => {
  assert.equal(buildProfileUpdatePayload({ avatarUrl: "" }).avatar_url, null);
  assert.equal(buildProfileUpdatePayload({ avatarUrl: "   " }).avatar_url, null);
});

test("buildProfileUpdatePayload: sets avatar_url to null when snake_case avatar_url is null", () => {
  const payload = buildProfileUpdatePayload({ avatar_url: null });
  assert.equal(payload.avatar_url, null);
});

test("buildProfileUpdatePayload: sets banner_url to null when bannerUrl is null", () => {
  const payload = buildProfileUpdatePayload({ bannerUrl: null });
  assert.equal(payload.banner_url, null);
});

test("buildProfileUpdatePayload: sets banner_url to null when bannerUrl is empty or whitespace", () => {
  assert.equal(buildProfileUpdatePayload({ bannerUrl: "" }).banner_url, null);
  assert.equal(buildProfileUpdatePayload({ bannerUrl: "   " }).banner_url, null);
});

test("buildProfileUpdatePayload: sets banner_url to null when snake_case banner_url is null", () => {
  const payload = buildProfileUpdatePayload({ banner_url: null });
  assert.equal(payload.banner_url, null);
});

test("buildProfileUpdatePayload: does not include avatar_url or banner_url if omitted", () => {
  const payload = buildProfileUpdatePayload({ displayName: "Axa" });
  assert.equal(Object.prototype.hasOwnProperty.call(payload, "avatar_url"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(payload, "banner_url"), false);
  assert.equal(payload.display_name, "Axa");
});

test("buildProfileUpdatePayload: trims valid avatar and banner urls", () => {
  const payload = buildProfileUpdatePayload({
    avatarUrl: "  https://example.com/avatar.png  ",
    bannerUrl: "  https://example.com/banner.png#fit=contain  ",
  });
  assert.equal(payload.avatar_url, "https://example.com/avatar.png");
  assert.equal(payload.banner_url, "https://example.com/banner.png#fit=contain");
});

test("parseBannerParams: returns default cover at y=50 for undefined or legacy URLs", () => {
  assert.deepEqual(parseBannerParams(null), { fit: "cover", y: 50 });
  assert.deepEqual(parseBannerParams(""), { fit: "cover", y: 50 });
  assert.deepEqual(parseBannerParams("https://example.com/banner.png"), {
    fit: "cover",
    y: 50,
  });
});

test("parseBannerParams: correctly parses fit=contain", () => {
  assert.deepEqual(
    parseBannerParams("https://example.com/banner.png#fit=contain"),
    { fit: "contain", y: 50 }
  );
});

test("parseBannerParams: parses y position from hash parameter", () => {
  assert.deepEqual(parseBannerParams("https://example.com/banner.png#y=15"), {
    fit: "cover",
    y: 15,
  });
  assert.deepEqual(parseBannerParams("https://example.com/banner.png#y=80"), {
    fit: "cover",
    y: 80,
  });
  // Clamps or ignores invalid y
  assert.deepEqual(
    parseBannerParams("https://example.com/banner.png#y=invalid"),
    { fit: "cover", y: 50 }
  );
  assert.deepEqual(parseBannerParams("https://example.com/banner.png#y=150"), {
    fit: "cover",
    y: 50,
  });
});

test("formatBannerUrl: formats cover and contain with y position", () => {
  const base = "https://example.com/banner.png";
  assert.equal(formatBannerUrl(base, "cover", 50), base);
  assert.equal(formatBannerUrl(base, "cover", 15), `${base}#y=15`);
  assert.equal(formatBannerUrl(base, "contain", 50), `${base}#fit=contain`);
  assert.equal(formatBannerUrl("", "cover", 20), "");
});
