"use client";
import { useState, type ReactNode } from "react";
import { useWindowDrag } from "./use-window-drag";
import { useLanguage } from "./use-language";
import { PixelIcon } from "./pixel-icon";
import styles from "./desktop-app-window.module.css";
export function DesktopAppWindow({
  kind,
  title,
  minimized,
  active,
  onActivate,
  onMinimize,
  onClose,
  children,
}: {
  kind: "swap" | "settings";
  title: string;
  minimized: boolean;
  active: boolean;
  onActivate: () => void;
  onMinimize: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const [maximized, setMaximized] = useState(false);
  const { windowRef, handlers } = useWindowDrag(maximized, minimized);
  return (
    <section
      ref={windowRef}
      role="region"
      aria-label={title}
      aria-hidden={minimized}
      inert={minimized}
      className={`window ${styles.app} ${kind === "settings" ? styles.settings : ""} ${maximized ? styles.maximized : ""}`}
      style={{
        display: minimized ? "none" : undefined,
        zIndex: active ? 3 : 2,
      }}
      onPointerDownCapture={onActivate}
      onFocusCapture={onActivate}
    >
      <header
        className={`title-bar ${!active ? "inactive" : ""} ${styles.title}`}
        {...handlers}
        onDoubleClick={(event) => {
          if (!(event.target as HTMLElement).closest("button"))
            setMaximized((v) => !v);
        }}
      >
        <div className={`title-bar-text ${styles.caption}`}>
          <PixelIcon kind={kind} small />
          {title}
        </div>
        <div className="title-bar-controls">
          <button
            className="minimize"
            aria-label={t("最小化")}
            onClick={onMinimize}
          />
          <button
            className={maximized ? "restore" : "maximize"}
            aria-label={t(maximized ? "还原窗口" : "最大化窗口")}
            onClick={() => setMaximized((v) => !v)}
          />
          <button
            className="close"
            aria-label={t("关闭窗口")}
            onClick={onClose}
          />
        </div>
      </header>
      <div className={styles.body}>{children}</div>
      <footer className="status-bar">
        <p className="status-bar-field">{t("本地演示 · 不发起交易或扣款")}</p>
      </footer>
    </section>
  );
}
