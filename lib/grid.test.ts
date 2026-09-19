import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cellId,
  validPoint,
  parseSavedCells,
  demoArt,
  DEMO_OCCUPIED,
} from "./grid.ts";
test("coordinates cover exactly 10,000 unique cells", () => {
  const ids = new Set<number>();
  for (let y = 0; y < 100; y++)
    for (let x = 0; x < 100; x++) ids.add(cellId({ x, y }));
  assert.equal(ids.size, 10000);
  assert.equal(validPoint({ x: 100, y: 0 }), false);
  assert.equal(validPoint({ x: 1.5, y: 0 }), false);
});
test("initial selected cell is available and demo map is populated", () => {
  assert.equal(demoArt({ x: 42, y: 68 }), null);
  assert.ok(DEMO_OCCUPIED > 2000 && DEMO_OCCUPIED < 4000);
});
test("saved cells reject invalid, unsafe and duplicate entries", () => {
  const c = {
    x: 42,
    y: 68,
    image: "/art/tile-0.svg",
    name: "test",
    purchasedAt: 1,
  };
  assert.equal(
    parseSavedCells(
      JSON.stringify([
        c,
        c,
        { ...c, x: -1 },
        { ...c, image: "javascript:alert(1)" },
      ]),
    ).length,
    1,
  );
});

import {
  validRegion,
  regionConflict,
  overlaps,
  areaSize,
  coverCrop,
  type Region,
} from "./grid.ts";
function emptyRegion(width: number, height: number): Region {
  for (let y = 0; y <= 100 - height; y++)
    for (let x = 0; x <= 100 - width; x++) {
      const r = { x, y, width, height };
      if (!regionConflict(r, [])) return r;
    }
  throw new Error("No empty test region");
}
test("multi-cell regions charge per cell and reject boundary overflow", () => {
  assert.equal(areaSize({ x: 0, y: 0, width: 3, height: 2 }) * 2, 12);
  assert.equal(validRegion({ x: 99, y: 99, width: 2, height: 1 }), false);
  assert.equal(validRegion({ x: 0, y: 0, width: 0, height: 1 }), false);
  assert.equal(validRegion({ x: 0, y: 0, width: 2.5, height: 1 }), false);
});
test("overlaps reject partial intersections but permit adjacent regions", () => {
  const a = { x: 10, y: 10, width: 3, height: 2 };
  assert.equal(overlaps(a, { x: 12, y: 11, width: 2, height: 2 }), true);
  assert.equal(overlaps(a, { x: 13, y: 10, width: 2, height: 2 }), false);
  const r = emptyRegion(3, 2);
  const owned = {
    ...r,
    image: "/art/tile-0.svg",
    name: "wide",
    purchasedAt: 1,
  };
  assert.ok(regionConflict({ ...r, x: r.x + 1, width: 1, height: 1 }, [owned]));
  assert.equal(
    parseSavedCells(JSON.stringify([owned, { ...owned, x: r.x + 1, width: 1 }]))
      .length,
    1,
  );
});
test("legacy purchases migrate; multi-cell image persists once with dimensions", () => {
  const legacy = {
    x: 42,
    y: 68,
    image: "/art/tile-0.svg",
    name: "old",
    purchasedAt: 1,
  };
  assert.equal(parseSavedCells(JSON.stringify([legacy]))[0].width, 1);
  const r = emptyRegion(3, 2),
    saved = { ...r, image: "/art/tile-0.svg", name: "new", purchasedAt: 2 };
  assert.deepEqual(parseSavedCells(JSON.stringify([saved])), [saved]);
});
test("cover crop preserves aspect ratio for wide and tall regions", () => {
  const wide = coverCrop(400, 400, 300, 200);
  assert.equal(wide.sx, 0);
  assert.equal(wide.sw, 400);
  assert.ok(Math.abs(wide.sy - 200 / 3) < 1e-9);
  assert.ok(Math.abs(wide.sh - 800 / 3) < 1e-9);
  const crop = coverCrop(600, 300, 100, 200);
  assert.equal(crop.sw / crop.sh, 0.5);
  assert.equal(crop.sx, 225);
  assert.equal(crop.sy, 0);
});

import { selectedRegion, contains, regionPoints } from "./grid.ts";
test("disconnected selections charge only selected cells and preserve holes", () => {
  const r = emptyRegion(3, 2);
  const sparse = selectedRegion([
    { x: r.x, y: r.y },
    { x: r.x + 2, y: r.y + 1 },
  ]);
  assert.equal(areaSize(sparse), 2);
  assert.equal(areaSize(sparse) * 2, 4);
  assert.equal(sparse.width, 3);
  assert.equal(sparse.height, 2);
  assert.equal(contains(sparse, { x: r.x + 1, y: r.y }), false);
  const hole = { x: r.x + 1, y: r.y, width: 1, height: 1 };
  assert.equal(overlaps(sparse, hole), false);
  const saved = {
    ...sparse,
    image: "/art/tile-0.svg",
    name: "sparse",
    purchasedAt: 3,
  };
  const other = {
    ...hole,
    image: "/art/tile-1.svg",
    name: "hole",
    purchasedAt: 4,
  };
  assert.equal(regionConflict(hole, [saved]), null);
  assert.deepEqual(parseSavedCells(JSON.stringify([saved, other])), [
    saved,
    other,
  ]);
  assert.equal(regionPoints(saved).length, 2);
});
test("sparse selections reject empty, duplicate and out-of-bounds masks", () => {
  assert.equal(validRegion(selectedRegion([])), false);
  assert.equal(
    validRegion({
      x: 1,
      y: 1,
      width: 2,
      height: 2,
      cells: [
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ],
    }),
    false,
  );
  assert.equal(
    validRegion({ x: 1, y: 1, width: 2, height: 2, cells: [{ x: 4, y: 1 }] }),
    false,
  );
});

test("purchased cells persist without an image, stay occupied, and later accept artwork", () => {
  const r = emptyRegion(3, 2);
  const purchase = {
    ...selectedRegion([
      { x: r.x, y: r.y },
      { x: r.x + 2, y: r.y + 1 },
    ]),
    image: "",
    name: "待上传图片",
    purchasedAt: 99,
  };
  const restored = parseSavedCells(JSON.stringify([purchase]));
  assert.deepEqual(restored, [purchase]);
  assert.ok(regionConflict(purchase, restored));
  assert.equal(areaSize(restored[0]), 2);
  const published = {
    ...restored[0],
    image: "/art/tile-0.svg",
    name: "我的作品",
  };
  assert.deepEqual(parseSavedCells(JSON.stringify([published])), [published]);
  assert.equal(
    regionConflict({ x: r.x + 1, y: r.y, width: 1, height: 1 }, restored),
    null,
  );
});

import { DEMO_REGIONS, demoRegionsFor, occupiedCount } from "./grid.ts";
test("demo art uses ten local images across non-overlapping varied regions", () => {
  assert.equal(new Set(DEMO_REGIONS.map((r) => r.image)).size, 10);
  assert.ok(
    new Set(DEMO_REGIONS.map((r) => `${r.width}x${r.height}`)).size > 5,
  );
  for (const [i, r] of DEMO_REGIONS.entries()) {
    assert.ok(validRegion(r));
    assert.ok(areaSize(r) > 1);
    assert.ok(DEMO_REGIONS.slice(i + 1).every((other) => !overlaps(r, other)));
  }
});
test("new demo layout preserves old purchases and does not double-count or cover them", () => {
  const r = DEMO_REGIONS[0];
  const saved = {
    x: r.x,
    y: r.y,
    width: 1,
    height: 1,
    image: "",
    name: "existing",
    purchasedAt: 1,
  };
  assert.deepEqual(parseSavedCells(JSON.stringify([saved])), [saved]);
  assert.ok(
    demoRegionsFor([saved]).every((region) => !contains(region, saved)),
  );
  assert.equal(occupiedCount([saved]), DEMO_OCCUPIED);
});

import { publishArtwork } from "./grid.ts";
test("publish a subset across purchases once, preserving unselected cells", () => {
  const r = emptyRegion(3, 2);
  const first = {
    ...r,
    width: 2,
    height: 1,
    image: "",
    name: "pending",
    purchasedAt: 1,
  };
  const second = {
    ...r,
    y: r.y + 1,
    width: 2,
    height: 1,
    image: "",
    name: "pending",
    purchasedAt: 2,
  };
  const points = [
    { x: r.x, y: r.y },
    { x: r.x + 1, y: r.y + 1 },
  ];
  const published = publishArtwork(
    [first, second],
    points,
    "/art/tile-0.svg",
    "art",
  );
  assert.equal(
    published.reduce((n, a) => n + areaSize(a), 0),
    4,
  );
  assert.equal(published.filter((a) => a.image).length, 1);
  assert.equal(areaSize(published.find((a) => a.image)!), 2);
  assert.equal(
    published.filter((a) => !a.image).reduce((n, a) => n + areaSize(a), 0),
    2,
  );
  assert.deepEqual(parseSavedCells(JSON.stringify(published)), published);
  assert.throws(() =>
    publishArtwork(published, points, "/art/tile-1.svg", "replace"),
  );
  assert.throws(() =>
    publishArtwork(
      published,
      [{ x: r.x + 2, y: r.y }],
      "/art/tile-1.svg",
      "not mine",
    ),
  );
  const next = publishArtwork(
    published,
    [{ x: r.x + 1, y: r.y }],
    "/art/tile-1.svg",
    "next",
  );
  assert.deepEqual(
    next.find((a) => a.name === "art"),
    published.find((a) => a.name === "art"),
  );
  assert.throws(() =>
    publishArtwork(published, [], "/art/tile-1.svg", "empty"),
  );
});
