import test from "node:test";
import assert from "node:assert/strict";
import { buildProfileUpdatePayload } from "./profile-storage";

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
