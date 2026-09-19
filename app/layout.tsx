import type { Metadata, Viewport } from "next";
import "98.css/dist/98.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "万格画布 — 在互联网留下一小格",
  description:
    "一万个格子，一万个小世界。选择你的格子，上传图片，一起完成这张画布。",
};
export const viewport: Viewport = { themeColor: "#008080" };
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
