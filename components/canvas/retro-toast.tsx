"use client";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./use-language";
import styles from "./retro-toast.module.css";
export function RetroToast({ message }: { message: string }) {
  const { t, language } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!visible || !element) return;
    // A non-modal popover keeps feedback visible above native dialog windows.
    element.showPopover?.();
    return () => {
      if (
        typeof element.hidePopover === "function" &&
        element.matches(":popover-open")
      )
        element.hidePopover();
    };
  }, [visible]);
  useEffect(() => {
    if (!visible || paused) return;
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [visible, paused]);
  if (!visible) return null;
  return (
    <div
      ref={ref}
      popover="manual"
      className={`window ${styles.toast}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="title-bar">
        <div className="title-bar-text">
          {language === "en" ? "Notification" : "提示"}
        </div>
        <div className="title-bar-controls">
          <button
            className="close"
            aria-label={language === "en" ? "Dismiss notification" : "关闭提示"}
            onClick={() => setVisible(false)}
          />
        </div>
      </div>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.message}
      >
        {t(message)}
      </p>
    </div>
  );
}
