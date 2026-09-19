"use client";
import { useSyncExternalStore } from "react";
import { english } from "./translations";
export type Language = "zh-CN" | "en";
const listeners = new Set<() => void>();
function read(): Language {
  try {
    return localStorage.getItem("wange:language") === "en" ? "en" : "zh-CN";
  } catch {
    return "zh-CN";
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
export function useLanguage() {
  const language = useSyncExternalStore(
    subscribe,
    read,
    () => "zh-CN" as Language,
  );
  const t = (text: string) => {
    if (language === "zh-CN") return text;
    const normalized = text.trim().replace(/\s+/g, " ");
    if (english[normalized]) return english[normalized];
    return normalized
      .replace(/^购买全部 (\d+) 格 — (\d+) USDG$/, "Buy all $1 cells — $2 USDG")
      .replace(
        /^你已经在画布上留下了 (\d+) 份表达。$/,
        "$1 artworks on your canvas.",
      )
      .replace(
        /^已一次购买 (\d+) 个格子，共 (\d+) USDG，请在「我的格子」上传图片（演示）。$/,
        "Purchased $1 cells for $2 USDG. Upload in My cells (demo).",
      )
      .replace(/^(\d+) 格(.*)$/, "$1 cells$2");
  };
  function setLanguage(next: Language) {
    try {
      localStorage.setItem("wange:language", next);
    } catch {
      return;
    }
    document.documentElement.lang = next;
    listeners.forEach((fn) => fn());
  }
  return { language, setLanguage, t };
}
