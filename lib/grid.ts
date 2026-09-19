export const GRID_SIZE = 100;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
export const CELL_PRICE = 2;
export type Point = { x: number; y: number };
export type Region = Point & { width: number; height: number; cells?: Point[] };
export type OwnedCell = Region & {
  image: string;
  name: string;
  purchasedAt: number;
};
export const cellId = ({ x, y }: Point) => y * GRID_SIZE + x;
export const validPoint = ({ x, y }: Point) =>
  Number.isInteger(x) &&
  Number.isInteger(y) &&
  x >= 0 &&
  y >= 0 &&
  x < GRID_SIZE &&
  y < GRID_SIZE;
const inBounds = (r: Region, p: Point) =>
  p.x >= r.x && p.y >= r.y && p.x < r.x + r.width && p.y < r.y + r.height;
export function validRegion(r: Region): boolean {
  if (
    !validPoint(r) ||
    !Number.isInteger(r.width) ||
    !Number.isInteger(r.height) ||
    r.width < 1 ||
    r.height < 1 ||
    r.x + r.width > 100 ||
    r.y + r.height > 100
  )
    return false;
  if (r.cells === undefined) return true;
  return (
    Array.isArray(r.cells) &&
    r.cells.length > 0 &&
    r.cells.length <= 10000 &&
    r.cells.every((p) => p && validPoint(p) && inBounds(r, p)) &&
    new Set(r.cells.map(cellId)).size === r.cells.length
  );
}
export const areaSize = (r: Region) =>
  r.cells ? r.cells.length : r.width * r.height;
export const contains = (r: Region, p: Point) =>
  inBounds(r, p) && (!r.cells || r.cells.some((c) => cellId(c) === cellId(p)));
export function regionPoints(r: Region): Point[] {
  return (
    r.cells ??
    Array.from({ length: r.width * r.height }, (_, i) => ({
      x: r.x + (i % r.width),
      y: r.y + Math.floor(i / r.width),
    }))
  );
}
export function selectedRegion(
  cells: Point[],
  fallback: Point = { x: 0, y: 0 },
): Region {
  if (!cells.length) return { ...fallback, width: 1, height: 1, cells: [] };
  const x = Math.min(...cells.map((p) => p.x)),
    y = Math.min(...cells.map((p) => p.y));
  return {
    x,
    y,
    width: Math.max(...cells.map((p) => p.x)) - x + 1,
    height: Math.max(...cells.map((p) => p.y)) - y + 1,
    cells,
  };
}
export function overlaps(a: Region, b: Region) {
  if (!(
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  ))
    return false;
  if (!a.cells && !b.cells) return true;
  const occupied = new Set(regionPoints(b).map(cellId));
  return regionPoints(a).some((p) => occupied.has(cellId(p)));
}
export function seedAt(id: number) {
  let v = Math.imul(id + 97, 2654435761);
  v ^= v >>> 16;
  return v >>> 0;
}
// Stable pseudo-random layout: refreshes never move a sold demo area.
export const DEMO_REGIONS: (Region & { image: string })[] = [];
for (let row = 0; row < 10; row++) {
  for (let col = 0; col < 10; col++) {
    const index = row * 10 + col;
    const seed = seedAt(index + 60000);
    if (seed % 5 === 0) continue;
    const width = 4 + (seed % 6);
    const height = 4 + ((seed >>> 5) % 5);
    const region = {
      x: col * 10 + ((seed >>> 10) % (11 - width)),
      y: row * 10 + ((seed >>> 15) % (11 - height)),
      width,
      height,
      image: `/art/generated/art-${(index % 10) + 1}.png`,
    };
    if (!contains(region, { x: 42, y: 68 })) DEMO_REGIONS.push(region);
  }
}
const demoIndex = new Map(
  DEMO_REGIONS.flatMap((r) =>
    regionPoints(r).map((p) => [cellId(p), r.image] as const),
  ),
);
export function demoArt(point: Point): string | null {
  return demoIndex.get(cellId(point)) ?? null;
}
export const DEMO_OCCUPIED = demoIndex.size;
export function demoRegionsFor(
  owned: OwnedCell[],
): (Region & { image: string })[] {
  const mine = new Set(owned.flatMap(regionPoints).map(cellId));
  return DEMO_REGIONS.map((r) => ({
    ...r,
    cells: regionPoints(r).filter((p) => !mine.has(cellId(p))),
  })).filter((r) => r.cells.length);
}
export function occupiedCount(owned: OwnedCell[]): number {
  return new Set([
    ...demoIndex.keys(),
    ...owned.flatMap(regionPoints).map(cellId),
  ]).size;
}
export function regionConflict(r: Region, owned: OwnedCell[]): string | null {
  if (!validRegion(r)) return "请选择有效的空白格子。";
  if (owned.some((o) => overlaps(r, o)))
    return "选区包含已购买的区域，请重新选择。";
  for (const p of regionPoints(r))
    if (demoArt(p)) return "选中的格子已被占用，请取消该格后重试。";
  return null;
}
export function parseSavedCells(value: string | null): OwnedCell[] {
  if (!value) return [];
  const data: unknown = JSON.parse(value);
  if (!Array.isArray(data)) return [];
  const regions: OwnedCell[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    // Older purchases had no dimensions: migrate each to a 1 × 1 region.
    const v = { ...entry, width: entry.width ?? 1, height: entry.height ?? 1 };
    if (
      !validRegion(v) ||
      typeof v.image !== "string" ||
      !(
        v.image === "" ||
        /^data:image\/(png|jpeg|webp);base64,/.test(v.image) ||
        /^\/art\/tile-\d+\.svg$/.test(v.image)
      ) ||
      typeof v.name !== "string" ||
      !Number.isFinite(v.purchasedAt) ||
      regions.some((r) => overlaps(v, r))
    )
      continue;
    regions.push(v);
  }
  return regions;
}
/** Source crop used to cover a rectangle without stretching the image. */
export function coverCrop(
  imageWidth: number,
  imageHeight: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const sw = width / scale,
    sh = height / scale;
  return { sx: (imageWidth - sw) / 2, sy: (imageHeight - sh) / 2, sw, sh };
}

/** Publish once to any subset of owned, unpublished cells. */
export function publishArtwork(
  owned: OwnedCell[],
  cells: Point[],
  image: string,
  name: string,
): OwnedCell[] {
  const area = selectedRegion(cells);
  if (!validRegion(area) || !image)
    throw new Error("请选择未上传的格子和图片。");
  const targets = new Set(cells.map(cellId));
  const available = new Set(
    owned
      .filter((r) => !r.image)
      .flatMap(regionPoints)
      .map(cellId),
  );
  if (cells.some((p) => !available.has(cellId(p))))
    throw new Error(
      "部分格子已上传图片或不属于你，请重新选择。已上传作品不可修改。",
    );
  const remaining = owned.flatMap((r) => {
    if (r.image) return [r];
    const points = regionPoints(r).filter((p) => !targets.has(cellId(p)));
    return points.length ? [{ ...r, ...selectedRegion(points) }] : [];
  });
  const purchasedAt = Math.min(
    ...owned
      .filter((r) => cells.some((p) => contains(r, p)))
      .map((r) => r.purchasedAt),
  );
  return [...remaining, { ...area, image, name, purchasedAt }];
}
