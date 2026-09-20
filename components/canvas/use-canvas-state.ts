"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  readCells,
  serverCells,
  subscribeCells,
  saveCells,
  clientReady,
  serverReady,
} from "@/lib/cell-store";
import {
  contains,
  publishArtwork,
  cellId,
  demoArt,
  selectedRegion,
  regionConflict,
  areaSize,
  CELL_PRICE,
  type Point,
  type Region,
} from "@/lib/grid";
export function useCanvasState() {
  const uploadVersion = useRef(0);
  const [selected, setSelected] = useState<Point>({ x: 42, y: 68 });
  const [selectionCells, setSelectionCells] = useState<Point[]>([]);
  const [uploadCells, setUploadCells] = useState<Point[]>([]);
  const [editing, setEditing] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const owned = useSyncExternalStore(subscribeCells, readCells, serverCells);
  const ready = useSyncExternalStore(subscribeCells, clientReady, serverReady);
  const [connected, setConnected] = useState(false);
  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [noticeEvent, setNoticeEvent] = useState({
    id: 0,
    message: "点击空白格加入选区，再点取消；可跨位置多选后一次购买。",
  });
  const notice = noticeEvent.message;
  function setNotice(message: string) {
    setNoticeEvent((previous) => ({ id: previous.id + 1, message }));
  }
  const current = editing
    ? uploadCells.length
      ? {
          ...selectedRegion(uploadCells),
          image: "",
          name: "待上传图片",
          purchasedAt: 0,
        }
      : undefined
    : inspecting
      ? owned.find((r) => contains(r, selected))
      : undefined;
  const area: Region =
    current ?? selectedRegion(editing ? uploadCells : selectionCells, selected);
  const count = areaSize(area),
    total = count * CELL_PRICE;
  const conflict = count
    ? regionConflict(area, owned)
    : "请直接点击画布上的空白格进行多选。";
  const occupied = current?.image || null;
  function enterMine() {
    uploadVersion.current++;
    setImage("");
    setFileName("");
    setEditing(true);
    setInspecting(false);
    setUploadCells([]);
    setNotice("点击蓝色未上传格子进行多选；已上传图片只能查看，不可修改。");
  }
  function toggleOwned(point: Point) {
    const target = readCells().find((r) => contains(r, point));
    if (!target) {
      setNotice("只能选择属于你的未上传格子。");
      return;
    }
    if (target.image) {
      viewRegion(point);
      setNotice("该作品已锁定，不允许修改。");
      return;
    }
    uploadVersion.current++;
    setImage("");
    setFileName("");
    setSelected(point);
    setEditing(true);
    setInspecting(false);
    setUploadCells((previous) =>
      previous.some((p) => cellId(p) === cellId(point))
        ? previous.filter((p) => cellId(p) !== cellId(point))
        : [...previous, point],
    );
  }
  function toggleCell(point: Point) {
    setEditing(false);
    if (demoArt(point) || readCells().some((r) => contains(r, point))) {
      setNotice("该格已被占用，未加入选区。切换「查看作品」可查看详情。");
      return;
    }
    setInspecting(false);
    setSelected(point);
    setSelectionCells((previous) =>
      previous.some((p) => cellId(p) === cellId(point))
        ? previous.filter((p) => cellId(p) !== cellId(point))
        : [...previous, point],
    );
  }
  function clearSelection() {
    uploadVersion.current++;
    setImage("");
    setFileName("");
    setUploadCells([]);
    setSelectionCells([]);
    setInspecting(false);
    setNotice("选区已清空，请点击空白格重新多选。");
  }
  function viewRegion(point: Point) {
    setEditing(false);
    setUploadCells([]);
    uploadVersion.current++;
    setImage("");
    setFileName("");
    setSelected(point);
    setInspecting(true);
  }
  function resumeSelection() {
    setEditing(false);
    setUploadCells([]);
    uploadVersion.current++;
    setImage("");
    setFileName("");
    setInspecting(false);
  }
  function purchase() {
    if (!ready || !connected || current || !count) return false;
    // Re-read immediately before committing: reject overlapping purchases from another tab.
    const latest = readCells();
    const error = regionConflict(area, latest);
    if (error) {
      setNotice(error);
      return false;
    }
    try {
      saveCells([
        ...latest,
        {
          ...area,
          image: "",
          name: "待上传图片",
          purchasedAt: Date.now(),
        },
      ]);
      setSelectionCells([]);
      setSelected(area.cells?.[0] ?? area);
      setInspecting(false);
      setEditing(true);
      setUploadCells([]);
      setImage("");
      setFileName("");
      setNotice(
        `已一次购买 ${count} 个格子，共 ${total} USDG，请在「我的格子」上传图片（演示）。`,
      );
      return true;
    } catch {
      setNotice("浏览器存储空间不足，未完成购买，请尝试更小的图片。");
      return false;
    }
  }
  function saveArtwork() {
    if (!editing || !uploadCells.length || !image) return;
    try {
      saveCells(
        publishArtwork(readCells(), uploadCells, image, fileName || "我的作品"),
      );
      const point = uploadCells[0];
      viewRegion(point);
      setNotice(
        "作品已保存并锁定，无法再次上传或修改。其余未上传格子可继续创作。",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "保存失败，请重试。");
    }
  }
  async function upload(file: File) {
    if (!editing || !uploadCells.length || current?.image) {
      setNotice("请先购买格子，再到「我的格子」上传图片。");
      return;
    }
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setNotice("请选择 PNG、JPG、WebP 或 GIF 图片。");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice("图片超过 5 MB，请选择较小的图片。");
      return;
    }
    const version = ++uploadVersion.current;
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      if (version !== uploadVersion.current) return;
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setImage(canvas.toDataURL("image/jpeg", 0.88));
      setFileName(file.name);
      setNotice(
        "图片铺满选区整体范围，只显示在选中的格子内，未选位置保持原样。",
      );
    } catch {
      setNotice("图片无法读取，请尝试其他图片。");
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return {
    selected,
    setSelected: (point: Point) => {
      uploadVersion.current++;
      setImage("");
      setFileName("");
      setSelected(point);
    },
    selectionCells,
    uploadCells,
    enterMine,
    toggleOwned,
    toggleCell,
    clearSelection,
    viewRegion,
    resumeSelection,
    area,
    count,
    total,
    conflict,
    owned,
    ready,
    connected,
    setConnected,
    image,
    setImage,
    fileName,
    setFileName,
    notice,
    noticeEvent,
    setNotice,
    current,
    occupied,
    purchase,
    upload,
    saveArtwork,
  };
}
