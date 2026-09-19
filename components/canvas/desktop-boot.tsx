"use client";
import { useCallback, useEffect, useState } from "react";
import { DEMO_REGIONS } from "@/lib/grid";
import { readCells } from "@/lib/cell-store";
import { CanvasDesktop } from "./canvas-desktop";
import { loadCanvasImage } from "./image-cache";
import { PixelIcon } from "./pixel-icon";
import { useLanguage } from "./use-language";
import styles from "./desktop-boot.module.css";
export function DesktopBoot() {
  const { language } = useLanguage();
  const en = language === "en";
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState(0);
  const [prepared, setPrepared] = useState(false);
  const [painted, setPainted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setPainted(true), []);
  useEffect(() => {
    let live = true;
    let done = 0;
    const sources = [
      ...new Set([
        ...DEMO_REGIONS.map((r) => r.image),
        "/art/tile-0.svg",
        ...readCells()
          .map((r) => r.image)
          .filter(Boolean),
      ]),
    ];
    const total = sources.length + 1;
    const tick = () => {
      if (live) setProgress(Math.round((++done / total) * 90));
    };
    const fontTimeout = setTimeout(() => {
      if (live) setFailed(true);
    }, 25000);
    const fonts = Promise.all([
      document.fonts.load('12px "Pixelated MS Sans Serif"'),
      document.fonts.load('bold 12px "Pixelated MS Sans Serif"'),
    ])
      .then(() => document.fonts.ready)
      .then(() => {
        clearTimeout(fontTimeout);
        tick();
      });
    const timers: ReturnType<typeof setTimeout>[] = [];
    const minimum = new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 1200);
      timers.push(timer);
    });
    // Images are decoded and rasterized here, then reused by the canvas.
    Promise.all([
      fonts,
      ...sources.map((src) => loadCanvasImage(src).then(tick)),
      minimum,
    ])
      .then(() => {
        if (live) setPrepared(true);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
      clearTimeout(fontTimeout);
      timers.forEach(clearTimeout);
    };
  }, [attempt]);
  useEffect(() => {
    if (!prepared || !painted || failed) return;
    const frame = requestAnimationFrame(() => {
      setProgress(100);
      timer = setTimeout(() => setVisible(true), 220);
    });
    let timer: ReturnType<typeof setTimeout>;
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [prepared, painted, failed]);
  return (
    <>
      {prepared && (
        <div
          style={{ visibility: visible ? "visible" : "hidden" }}
          inert={!visible}
          aria-hidden={!visible}
        >
          <CanvasDesktop onReady={onReady} />
        </div>
      )}
      {!visible && (
        <div className={styles.screen} aria-busy={!failed}>
          <div className={styles.brand}>
            <PixelIcon kind="computer" />
            <span>
              WANGE<span className={styles.edition}>98</span>
            </span>
          </div>
          <p className={styles.tagline}>
            {en
              ? "A little space, a little you."
              : "一万个格子，一万个小世界。"}
          </p>
          <section
            className={`window ${styles.bootWindow}`}
            aria-label={en ? "Starting desktop" : "正在启动桌面"}
          >
            <div className="title-bar">
              <div className="title-bar-text">
                {en ? "Starting WANGE 98…" : "正在启动万格画布…"}
              </div>
            </div>
            <div className={styles.body}>
              <p role="status">
                {failed
                  ? en
                    ? "Some resources failed to load. Please retry."
                    : "部分资源加载失败，请重试。"
                  : progress === 100
                    ? en
                      ? "Ready. Welcome!"
                      : "启动完成，欢迎回来！"
                    : prepared
                      ? en
                        ? "Preparing your canvas…"
                        : "正在绘制你的画布…"
                      : en
                        ? "Loading artwork, fonts and your saved cells…"
                        : "正在加载作品、字体与本地格子…"}
              </p>
              <div
                className={`progress-indicator segmented ${styles.progress}`}
                role="progressbar"
                aria-label={en ? "Startup progress" : "启动进度"}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <span
                  className="progress-indicator-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={styles.status}>
                <span>LOCAL DEMO · v0.1</span>
                <span>{progress}%</span>
              </div>
              {failed && (
                <button
                  onClick={() => {
                    setFailed(false);
                    setPrepared(false);
                    setPainted(false);
                    setProgress(0);
                    setAttempt((v) => v + 1);
                  }}
                >
                  {en ? "Retry" : "重新加载"}
                </button>
              )}
            </div>
          </section>
          <p className={styles.footer}>THE 10,000 SQUARE PROJECT</p>
        </div>
      )}
    </>
  );
}
