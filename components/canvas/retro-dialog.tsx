"use client";
import { useLanguage } from "./use-language";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./canvas.module.css";
export function RetroDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className={`window ${styles.dialog}`}
      ref={ref}
      onCancel={onClose}
      aria-labelledby="dialog-title"
    >
      <div className="title-bar">
        <div className="title-bar-text" id="dialog-title">
          {title}
        </div>
        <div className="title-bar-controls">
          <button
            className="close"
            aria-label={t("关闭对话框")}
            onClick={onClose}
          />
        </div>
      </div>
      <div className={styles.dialogBody}>{children}</div>
    </dialog>
  );
}
