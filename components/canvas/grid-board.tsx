"use client";
import { cachedImage, loadCanvasImage } from "./image-cache";
import { useLanguage } from "./use-language";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  demoArt,
  DEMO_REGIONS,
  demoRegionsFor,
  cellId,
  regionPoints,
  coverCrop,
  type Region,
  type OwnedCell,
  type Point,
} from "@/lib/grid";
import styles from "./canvas.module.css";
import { useCanvasPan } from "./use-canvas-pan";
export function GridBoard({
  onReady,
  selected,
  area,
  onSelect,
  onNavigate,
  owned,
  zoom,
  onlyAvailable,
  onlyMine,
  previewImage,
  invalid,
  multiSelect,
}: {
  onReady?: () => void;
  selected: Point;
  area: Region;
  onSelect: (p: Point) => void;
  onNavigate: (p: Point) => void;
  owned: OwnedCell[];
  zoom: number;
  onlyAvailable: boolean;
  onlyMine: boolean;
  previewImage: string;
  invalid: boolean;
  multiSelect: boolean;
}) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const clickedSelection = useRef<Point | null>(null);
  const pan = useCanvasPan(scrollRef);

  const [revision, setRevision] = useState(0);
  const cell = zoom;
  const size = 100 * cell;
  useEffect(() => {
    let live = true;
    const sources = [
      ...new Set(DEMO_REGIONS.map((r) => r.image)),
      ...owned.map((o) => o.image).filter(Boolean),
      ...(previewImage ? [previewImage] : []),
    ];
    Promise.all(sources.map(loadCanvasImage))
      .then(() => {
        if (live) setRevision((r) => r + 1);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [owned, previewImage]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f5f4ed";
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    const mine = new Set(owned.flatMap(regionPoints).map(cellId));
    const pending = new Set(
      owned
        .filter((r) => !r.image)
        .flatMap(regionPoints)
        .map(cellId),
    );
    for (let y = 0; y < 100; y++)
      for (let x = 0; x < 100; x++) {
        const art = demoArt({ x, y });

        const isMine = mine.has(cellId({ x, y }));
        if (onlyAvailable || onlyMine || pending.has(cellId({ x, y }))) {
          ctx.fillStyle = onlyAvailable
            ? art || isMine
              ? "#efd0ce"
              : "#d5ead1"
            : onlyMine
              ? isMine
                ? "#cbdcf5"
                : "#e8e7e2"
              : "#cbdcf5";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    ctx.strokeStyle = "#c9c8c0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      ctx.moveTo(i * cell + 0.5, 0);
      ctx.lineTo(i * cell + 0.5, size);
      ctx.moveTo(0, i * cell + 0.5);
      ctx.lineTo(size, i * cell + 0.5);
    }
    ctx.stroke();
    // Draw each purchased image once across its entire region, above internal grid lines.
    for (const region of [
      ...(onlyMine ? [] : demoRegionsFor(owned)),
      ...owned,
    ]) {
      const img = cachedImage(region.image);
      if (!img || onlyAvailable) continue;
      const w = region.width * cell,
        h = region.height * cell;
      const crop = coverCrop(img.width, img.height, w, h);
      ctx.save();
      ctx.beginPath();
      regionPoints(region).forEach((p) =>
        ctx.rect(p.x * cell, p.y * cell, cell, cell),
      );
      ctx.clip();

      ctx.drawImage(
        img,
        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,
        region.x * cell,
        region.y * cell,
        w,
        h,
      );
      ctx.restore();
    }
    const preview = previewImage && cachedImage(previewImage);
    if (preview && !invalid) {
      const w = area.width * cell,
        h = area.height * cell;
      const crop = coverCrop(preview.width, preview.height, w, h);
      ctx.save();
      ctx.beginPath();
      regionPoints(area).forEach((p) =>
        ctx.rect(p.x * cell, p.y * cell, cell, cell),
      );
      ctx.clip();
      ctx.drawImage(
        preview,
        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,
        area.x * cell,
        area.y * cell,
        w,
        h,
      );
      ctx.restore();
    }
    ctx.fillStyle = invalid ? "rgba(128,0,0,0.15)" : "rgba(0,0,128,0.12)";
    ctx.strokeStyle = invalid ? "#800000" : "#000080";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    for (const p of regionPoints(area)) {
      ctx.fillRect(p.x * cell, p.y * cell, cell, cell);
      ctx.strokeRect(p.x * cell + 2, p.y * cell + 2, cell - 4, cell - 4);
    }
    ctx.setLineDash([]);
    if (revision > 0 && onReady) {
      const frame = requestAnimationFrame(onReady);
      return () => cancelAnimationFrame(frame);
    }
  }, [
    onReady,
    owned,
    area,
    cell,
    size,
    onlyAvailable,
    onlyMine,
    revision,
    previewImage,
    invalid,
  ]);
  const reveal = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = selected.x * cell - el.clientWidth / 2 + cell / 2;
    el.scrollTop = selected.y * cell - el.clientHeight / 2 + cell / 2;
  }, [selected, cell]);
  useEffect(() => {
    // A direct click changes selection in place; explicit navigation still reveals it.
    const fromClick = clickedSelection.current === selected;
    clickedSelection.current = null;
    if (!fromClick) reveal();
  }, [reveal, selected]);
  return (
    <div className={`sunken-panel ${styles.boardFrame}`}>
      <div className={styles.boardLabel}>
        <span>{t("▧ 画布视图")}</span>
        <span>
          {multiSelect
            ? t("点击加入 / 再点取消 · 拖拽移动")
            : t("点击查看作品 · 拖拽移动")}
        </span>
      </div>
      <div className={styles.boardScroll} ref={scrollRef}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className={`${styles.gridCanvas} ${pan.dragging ? styles.gridDragging : ""}`}
          {...pan.handlers}
          tabIndex={0}
          role="application"
          aria-label={`Canvas X ${selected.x} Y ${selected.y}. ${multiSelect ? t("单击多选或取消，空格切换当前格子。") : t("单击查看作品。")}`}
          onClick={(e) => {
            if (pan.consumeDragClick()) return;
            const r = e.currentTarget.getBoundingClientRect();
            const x = Math.floor((e.clientX - r.left) / cell),
              y = Math.floor((e.clientY - r.top) / cell);
            if (x >= 0 && y >= 0 && x < 100 && y < 100) {
              const point = { x, y };
              clickedSelection.current = point;
              onSelect(point);
            }
          }}
          onKeyDown={(e) => {
            if (multiSelect && (e.key === " " || e.key === "Enter")) {
              e.preventDefault();
              clickedSelection.current = selected;
              onSelect(selected);
              return;
            }
            const delta: Record<string, Point> = {
              ArrowLeft: { x: -1, y: 0 },
              ArrowRight: { x: 1, y: 0 },
              ArrowUp: { x: 0, y: -1 },
              ArrowDown: { x: 0, y: 1 },
            };
            const d = delta[e.key];
            if (d) {
              e.preventDefault();
              onNavigate({
                x: Math.max(0, Math.min(99, selected.x + d.x)),
                y: Math.max(0, Math.min(99, selected.y + d.y)),
              });
            }
          }}
        />
      </div>
      <div className={styles.gridLegend}>
        <span>
          <i
            className={styles.emptySwatch}
            style={{
              background: onlyAvailable
                ? "#d5ead1"
                : onlyMine
                  ? "#cbdcf5"
                  : undefined,
            }}
          />{" "}
          {onlyMine ? t("我的格子") : t("可购买")}
        </span>
        <span>
          <i
            className={styles.filledSwatch}
            style={{
              background: onlyAvailable
                ? "#efd0ce"
                : onlyMine
                  ? "#e8e7e2"
                  : undefined,
            }}
          />{" "}
          {onlyMine ? t("其他格子") : t("已出售")}
        </span>
        <span>
          <i className={styles.selectedSwatch} /> {t("已选中")}
        </span>
        <span className={styles.legendHint}>
          {t("每一个小格子，都是一个人的世界。")}
        </span>
      </div>
    </div>
  );
}
export function MiniMap({
  selected,
  onSelect,
  owned,
}: {
  selected: Point;
  onSelect: (p: Point) => void;
  owned: OwnedCell[];
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    c.fillStyle = "#f1f0e8";
    c.fillRect(0, 0, 200, 200);
    for (let y = 0; y < 100; y++)
      for (let x = 0; x < 100; x++)
        if (demoArt({ x, y })) {
          c.fillStyle = ["#6d91ac", "#d1b57e", "#86a091", "#b0a1bc"][
            (x + y) % 4
          ];
          c.fillRect(x * 2, y * 2, 2, 2);
        }
    c.fillStyle = "#000080";
    owned.forEach((o) =>
      regionPoints(o).forEach((p) => c.fillRect(p.x * 2, p.y * 2, 2, 2)),
    );
    c.strokeStyle = "white";
    c.lineWidth = 4;
    c.strokeRect(
      Math.max(0, selected.x * 2 - 15),
      Math.max(0, selected.y * 2 - 12),
      30,
      24,
    );
    c.strokeStyle = "#000080";
    c.lineWidth = 2;
    c.strokeRect(
      Math.max(0, selected.x * 2 - 15),
      Math.max(0, selected.y * 2 - 12),
      30,
      24,
    );
  }, [selected, owned]);
  return (
    <canvas
      width={200}
      height={200}
      ref={ref}
      className={styles.minimap}
      role="img"
      aria-label={t("全局地图，点击可跳转，或使用坐标输入定位")}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSelect({
          x: Math.min(99, Math.floor(((e.clientX - r.left) / r.width) * 100)),
          y: Math.min(99, Math.floor(((e.clientY - r.top) / r.height) * 100)),
        });
      }}
    />
  );
}
