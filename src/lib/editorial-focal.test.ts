import test from "node:test";
import assert from "node:assert/strict";
import {
  EDITORIAL_PORTRAIT_FOCAL,
  applyAdaptiveFocal,
  tryNativeFaceDetector,
} from "./editorial-focal";

test("EDITORIAL_PORTRAIT_FOCAL: conforms to editorial 38% eye-level focal point", () => {
  assert.equal(EDITORIAL_PORTRAIT_FOCAL, "50% 38%");
});

test("tryNativeFaceDetector: safely returns null in non-browser or detectorless environments", async () => {
  const dummyImg = {} as HTMLImageElement;
  const result = await tryNativeFaceDetector(dummyImg);
  assert.equal(result, null);
});

test("applyAdaptiveFocal: does nothing for null, zero-width, or landscape images", () => {
  assert.doesNotThrow(() => applyAdaptiveFocal(null));

  const zeroImg = { naturalWidth: 0, naturalHeight: 100, style: {} } as unknown as HTMLImageElement;
  applyAdaptiveFocal(zeroImg);
  assert.equal(zeroImg.style.objectPosition, undefined);

  const landscapeImg = { naturalWidth: 1600, naturalHeight: 900, style: {} } as unknown as HTMLImageElement;
  applyAdaptiveFocal(landscapeImg);
  assert.equal(landscapeImg.style.objectPosition, undefined);
});

test("applyAdaptiveFocal: applies EDITORIAL_PORTRAIT_FOCAL to portrait images", () => {
  const portraitImg = { naturalWidth: 900, naturalHeight: 1600, style: {} } as unknown as HTMLImageElement;
  applyAdaptiveFocal(portraitImg);
  assert.equal(portraitImg.style.objectPosition, EDITORIAL_PORTRAIT_FOCAL);
});
