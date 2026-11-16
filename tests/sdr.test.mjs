import assert from "node:assert/strict";
import test from "node:test";
import { getSdrMediaQuery, isHdrVideoConfiguration } from "../src/lib/ythd-sdr.ts";

test("HDR display probes are disabled without changing other media conditions", () => {
  assert.equal(getSdrMediaQuery("(dynamic-range: high)"), "(width < 0px)");
  assert.equal(getSdrMediaQuery("( VIDEO-DYNAMIC-RANGE : HIGH )"), "(width < 0px)");
  assert.equal(
    getSdrMediaQuery("screen and (dynamic-range: high), (min-width: 1280px)"),
    "screen and (width < 0px), (min-width: 1280px)"
  );
  assert.equal(getSdrMediaQuery("not (dynamic-range: high)"), "not (width < 0px)");
  const standardQuery = "(dynamic-range: standard) and (color-gamut: rec2020)";
  assert.equal(getSdrMediaQuery(standardQuery), standardQuery);
});

test("explicit HDR requests are rejected without classifying SDR by codec or bit depth", () => {
  assert.equal(isHdrVideoConfiguration({ transferFunction: "pq" }), true);
  assert.equal(isHdrVideoConfiguration({ transferFunction: "hlg" }), true);
  for (const hdrMetadataType of ["smpteSt2086", "smpteSt2094-10", "smpteSt2094-40"]) {
    assert.equal(isHdrVideoConfiguration({ hdrMetadataType }), true);
  }
  assert.equal(isHdrVideoConfiguration(), false);
  assert.equal(isHdrVideoConfiguration({ transferFunction: "srgb", colorGamut: "rec2020" }), false);
  assert.equal(isHdrVideoConfiguration({ contentType: 'video/webm; codecs="vp09.02.51.10"' }), false);
  assert.equal(isHdrVideoConfiguration({ contentType: 'video/mp4; codecs="av01.0.12M.10"' }), false);
});
