"use client";
import { useLanguage } from "./use-language";
import { useEffect, useRef, useState } from "react";
import {
  CELL_PRICE,
  occupiedCount,
  areaSize,
  cellId,
  validPoint,
} from "@/lib/grid";
import { SwapPanel, SettingsPanel } from "./desktop-utilities";
import { RegionImage } from "./region-image";
import { GridBoard, MiniMap } from "./grid-board";
import { PixelIcon } from "./pixel-icon";
import { RetroDialog } from "./retro-dialog";
import { useCanvasState } from "./use-canvas-state";
import { useWindowDrag } from "./use-window-drag";
import styles from "./canvas.module.css";
type Dialog =
  "swap" | "settings" | "wallet" | "help" | "mine" | "purchase" | null;
export function CanvasDesktop({ onReady }: { onReady?: () => void }) {
  const { t, language } = useLanguage();
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const s = useCanvasState();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [multiSelect, setMultiSelect] = useState(true);
  const [zoom, setZoom] = useState(32);
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const { windowRef, handlers: windowDragHandlers } = useWindowDrag(
    maximized,
    minimized,
  );
  const [time, setTime] = useState("--:--");
  const [tab, setTab] = useState<"upload" | "details">("upload");
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  const works = s.owned.filter((r) => r.image);
  const canEdit = onlyMine && s.uploadCells.length > 0 && !s.current?.image;
  const occupied = occupiedCount(s.owned);
  const show = (d: Dialog) => {
    setMinimized(false);
    setDialog(d);
  };
  const pickSample = () => {
    s.setImage("/art/tile-0.svg");
    s.setFileName("pixel-cat.svg");
    s.setNotice("已选择示例像素猫。也可以上传你自己的图片。");
  };
  return (
    <div className={styles.desktop}>
      <aside className={styles.desktopIcons} aria-label={t("桌面快捷方式")}>
        <button onClick={() => setMinimized(false)}>
          <PixelIcon kind="computer" />
          <span>{t("万格画布")}</span>
        </button>
        <button onClick={() => show("mine")}>
          <PixelIcon kind="folder" />
          <span>{t("我的作品")}</span>
        </button>
        <button onClick={() => show("help")}>
          <PixelIcon kind="help" />
          <span>{t("使用说明")}</span>
        </button>
        <button onClick={() => show("swap")}>
          <PixelIcon kind="swap" />
          <span>{t("交易")}</span>
        </button>
        <button onClick={() => show("settings")}>
          <PixelIcon kind="settings" />
          <span>{t("设置")}</span>
        </button>
      </aside>
      <div className={styles.desktopSignature}>
        a little space,
        <br />a little you.<span>EST. 2026 / THE INTERNET IS OUR CANVAS</span>
      </div>
      {!minimized && (
        <main
          ref={windowRef}
          className={`window ${styles.appWindow} ${maximized ? styles.maximized : ""}`}
        >
          <header
            className={`title-bar ${styles.titleBar}`}
            {...windowDragHandlers}
            title={
              maximized
                ? t("双击还原窗口")
                : t("拖动标题栏移动窗口，双击最大化")
            }
            onDoubleClick={(event) => {
              if (!(event.target as HTMLElement).closest("button"))
                setMaximized((value) => !value);
            }}
          >
            <div className={`title-bar-text ${styles.titleText}`}>
              <PixelIcon small /> {t("万格画布.exe")}
              <span>{t("— 在互联网留下一小格")}</span>
            </div>
            <div className="title-bar-controls">
              <button
                className="minimize"
                aria-label={t("最小化")}
                onClick={() => setMinimized(true)}
              />
              <button
                className={maximized ? "restore" : "maximize"}
                aria-label={maximized ? t("还原窗口") : t("最大化窗口")}
                title={t("切换窗口大小")}
                onClick={() => setMaximized(!maximized)}
              />
              <button
                className="close"
                aria-label={t("关闭窗口")}
                onClick={() => setMinimized(true)}
              />
            </div>
          </header>
          <nav className={styles.menuBar} aria-label={t("应用菜单")}>
            <button disabled={!canEdit} onClick={() => file.current?.click()}>
              {t("文件(F)")}
            </button>
            <button onClick={() => setZoom(zoom === 32 ? 48 : 32)}>
              {t("查看(V)")}
            </button>
            <button onClick={() => show("help")}>{t("帮助(H)")}</button>
            <span>LOCAL DEMO · v0.1</span>
          </nav>
          <div className={styles.toolbar}>
            <menu
              role="tablist"
              aria-label={t("画布视图")}
              className={styles.tabs}
            >
              <li role="tab" aria-selected={!onlyMine && dialog !== "mine"}>
                <button
                  onClick={() => {
                    setOnlyAvailable(false);
                    setOnlyMine(false);
                    setMultiSelect(true);
                    s.resumeSelection();
                    s.setNotice("正在浏览所有格子。");
                  }}
                >
                  <PixelIcon small />
                  {t("探索画布")}
                </button>
              </li>
              <li role="tab" aria-selected={onlyMine && dialog !== "mine"}>
                <button
                  onClick={() => {
                    setOnlyMine(true);
                    setOnlyAvailable(false);
                    setMultiSelect(false);
                    s.enterMine();
                  }}
                >
                  <PixelIcon kind="folder" small />
                  {t("我的格子")}
                </button>
              </li>
              <li role="tab" aria-selected={dialog === "mine"}>
                <button onClick={() => show("mine")}>
                  <PixelIcon kind="folder" small />
                  {t("我的作品")}
                  <span className={`status-field-border ${styles.countBadge}`}>
                    {works.length}
                  </span>
                </button>
              </li>
            </menu>
            <div className={styles.toolbarGroup}>
              <button onClick={() => show("wallet")}>
                <PixelIcon kind="wallet" small />
                {s.connected ? t("演示钱包已连接") : t("连接钱包")}
              </button>
              <span className={`status-field-border ${styles.demoTag}`}>
                {t("演示模式")}
              </span>
            </div>
          </div>
          <div className={styles.workspace}>
            <section className={styles.canvasColumn} aria-label={t("探索画布")}>
              <div className={styles.mapToolbar}>
                <div className={styles.mapTitle}>
                  <PixelIcon small />
                  <strong>{t("世界画布")}</strong>
                  <span>100 × 100</span>
                </div>
                <div className={styles.mapActions}>
                  <input
                    id="available"
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => {
                      setOnlyAvailable(e.target.checked);
                      setOnlyMine(false);
                      s.resumeSelection();
                      setMultiSelect(true);
                    }}
                  />
                  <label htmlFor="available">{t("只看空位")}</label>
                  <span className={styles.separator} />
                  <button
                    aria-label={t("缩小画布")}
                    disabled={zoom === 20}
                    onClick={() => setZoom((z) => (z === 48 ? 32 : 20))}
                  >
                    −
                  </button>
                  <span className={styles.zoomLabel}>
                    {Math.round((zoom / 32) * 100)}%
                  </span>
                  <button
                    aria-label={t("放大画布")}
                    disabled={zoom === 48}
                    onClick={() => setZoom((z) => (z === 20 ? 32 : 48))}
                  >
                    +
                  </button>
                </div>
              </div>
              {onlyMine ? (
                <div className={styles.selectionToolbar}>
                  <strong>{t("选择未上传格子")}</strong>
                  <span>
                    {s.uploadCells.length} {t("格已选")}
                  </span>
                  <button onClick={s.enterMine}>{t("取消全部")}</button>
                  <span>{t("图片保存后不可修改")}</span>
                </div>
              ) : (
                <div
                  className={styles.selectionToolbar}
                  role="group"
                  aria-label={t("画布操作模式")}
                >
                  <button
                    aria-pressed={multiSelect}
                    onClick={() => {
                      setOnlyMine(false);
                      setMultiSelect(true);
                      s.resumeSelection();
                    }}
                  >
                    {t("多选购买")}
                  </button>
                  <button
                    aria-pressed={!multiSelect}
                    onClick={() => {
                      setMultiSelect(false);
                      s.viewRegion(s.selected);
                    }}
                  >
                    {t("查看作品")}
                  </button>
                  <span>
                    {s.selectionCells.length} {t("格已选 ·")}{" "}
                    {s.selectionCells.length * CELL_PRICE} USDG
                  </span>
                  <button
                    disabled={!s.selectionCells.length}
                    onClick={s.clearSelection}
                  >
                    {t("取消全部")}
                  </button>
                </div>
              )}
              <GridBoard
                onReady={onReady}
                area={s.area}
                previewImage={canEdit ? s.image : ""}
                invalid={Boolean(s.conflict) && !s.current}
                selected={s.selected}
                onSelect={
                  onlyMine
                    ? s.toggleOwned
                    : multiSelect
                      ? s.toggleCell
                      : s.viewRegion
                }
                onNavigate={s.setSelected}
                multiSelect={onlyMine || multiSelect}
                owned={s.owned}
                zoom={zoom}
                onlyAvailable={onlyAvailable}
                onlyMine={onlyMine}
              />
              <div className={styles.mapBottom}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    const p = {
                      x: Number(data.get("x")),
                      y: Number(data.get("y")),
                    };
                    if (validPoint(p)) s.setSelected(p);
                  }}
                >
                  <span>{t("定位到")}</span>
                  <label>
                    X{" "}
                    <input
                      aria-label={t("横坐标 X")}
                      name="x"
                      type="number"
                      min="0"
                      max="99"
                      required
                      defaultValue="42"
                    />
                  </label>
                  <label>
                    Y{" "}
                    <input
                      aria-label={t("纵坐标 Y")}
                      name="y"
                      type="number"
                      min="0"
                      max="99"
                      required
                      defaultValue="68"
                    />
                  </label>
                  <button type="submit">{t("前往 →")}</button>
                </form>
                <button onClick={() => s.setSelected({ x: 42, y: 68 })}>
                  {t("⌖ 回到起点")}
                </button>
              </div>
            </section>
            <aside className={styles.inspector} aria-label={t("格子详情")}>
              <div className={styles.inspectorHeading}>
                <strong>{onlyMine ? t("管理我的格子") : t("购买格子")}</strong>
                <span>
                  NO. {String(cellId(s.selected) + 1).padStart(5, "0")}
                </span>
              </div>
              <div className={`field-border-disabled ${styles.coordinateCard}`}>
                <div>
                  <span>
                    {s.current ? t("作品范围起点") : t("选区范围起点")}
                  </span>
                  <strong>
                    X: {String(s.area.x).padStart(2, "0")}{" "}
                    <b>Y: {String(s.area.y).padStart(2, "0")}</b>
                  </strong>
                </div>
                <span
                  className={`status-field-border ${s.occupied ? styles.occupiedBadge : styles.availableBadge}`}
                >
                  {s.current
                    ? t("属于你")
                    : !s.count
                      ? t("待选格")
                      : s.conflict
                        ? t("选区不可用")
                        : t("● 可购买")}
                </span>
              </div>
              <fieldset className={styles.regionControls}>
                <legend>{s.current ? t("作品占用格子") : t("已选格子")}</legend>
                <div className="field-row">
                  <strong>
                    {onlyMine
                      ? t(`${s.count} 格`)
                      : t(`${s.count} 格 · ${s.total} USDG`)}
                  </strong>
                  <button
                    disabled={!s.count && !s.current}
                    onClick={() => {
                      if (onlyMine) s.enterMine();
                      else {
                        s.clearSelection();
                        setMultiSelect(true);
                      }
                    }}
                  >
                    {t("清空选区")}
                  </button>
                </div>
                <p className={styles.selectionHint}>
                  {onlyMine
                    ? t("点选未上传格子，可不连续；已上传作品不可修改。")
                    : t("直接点选，可不连续；再次点击取消。")}
                </p>
                {s.conflict && !s.current && s.count > 0 && (
                  <p role="status">{t(s.conflict)}</p>
                )}
              </fieldset>
              {s.current && (
                <>
                  <menu role="tablist" className={styles.tabs}>
                    <li role="tab" aria-selected={tab === "upload"}>
                      <button onClick={() => setTab("upload")}>
                        {t("图片预览")}
                      </button>
                    </li>
                    <li role="tab" aria-selected={tab === "details"}>
                      <button onClick={() => setTab("details")}>
                        {t("格子信息")}
                      </button>
                    </li>
                  </menu>
                  <input
                    ref={file}
                    className={styles.hiddenInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    aria-label={t("上传格子图片")}
                    disabled={!canEdit}
                    onChange={(e) => {
                      if (e.target.files?.[0]) void s.upload(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                  <div className={`window ${styles.tabPanel}`} role="tabpanel">
                    {tab === "upload" ? (
                      <>
                        <div
                          className={`field-border ${styles.preview}`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (canEdit && e.dataTransfer.files[0])
                              void s.upload(e.dataTransfer.files[0]);
                          }}
                        >
                          {s.image || s.occupied ? (
                            <RegionImage
                              image={s.image || s.occupied || ""}
                              region={s.area}
                              label={
                                s.occupied
                                  ? t("已购买区域完整图片")
                                  : t("跨格图片预览")
                              }
                            />
                          ) : (
                            <div className={styles.previewEmpty}>
                              <img
                                src="/art/tile-0.svg"
                                alt={t("示例像素猫")}
                              />
                              <span>{t("这里，留给你的奇思妙想。")}</span>
                              <button disabled={!canEdit} onClick={pickSample}>
                                {t("试试这只像素猫 ↗")}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className={styles.uploadRow}>
                          <button
                            disabled={!canEdit}
                            onClick={() => file.current?.click()}
                          >
                            {t("↑ 上传图片…")}
                          </button>
                          <span title={s.fileName}>
                            {s.fileName ||
                              s.current?.name ||
                              (s.occupied
                                ? t("社区作品")
                                : s.fileName || t("尚未选择文件"))}
                          </span>
                        </div>
                        <p className={styles.uploadHint}>
                          {t("JPG / PNG / WebP / GIF · 最大 5 MB")}
                          <br />
                          {t("仅显示在所选格子，空位不填充 · GIF 使用静态帧")}
                        </p>
                      </>
                    ) : (
                      <dl className={styles.details}>
                        <dt>{t("格子编号")}</dt>
                        <dd>#{cellId(s.selected) + 1}</dd>
                        <dt>{t("坐标")}</dt>
                        <dd>
                          {s.selected.x}, {s.selected.y}
                        </dd>
                        <dt>{t("状态")}</dt>
                        <dd>
                          {s.current
                            ? t("你的演示作品")
                            : s.occupied
                              ? t("社区示例作品")
                              : t("等待第一位创作者")}
                        </dd>
                        <dt>{t("尺寸")}</dt>
                        <dd>
                          {s.area.width} × {s.area.height} · {s.count} {t("格")}
                        </dd>
                        <dt>{t("单价")}</dt>
                        <dd>2 USDG</dd>
                      </dl>
                    )}
                  </div>
                  {canEdit ? (
                    <button
                      className="default"
                      disabled={!s.image}
                      onClick={s.saveArtwork}
                    >
                      {t("确认上传并锁定作品")}
                    </button>
                  ) : s.current.image ? (
                    <p>{t("✓ 作品已锁定，不允许重新上传或修改。")}</p>
                  ) : (
                    <button
                      onClick={() => {
                        s.enterMine();
                        setMultiSelect(false);
                        setOnlyMine(true);
                        setOnlyAvailable(false);
                      }}
                    >
                      {t("到我的格子上传图片")}
                    </button>
                  )}
                </>
              )}
              {!s.current && (
                <p>
                  {onlyMine
                    ? t("点击蓝色未上传格子，选择要共用一张图片的位置。")
                    : t("先购买格子，再到「我的格子」上传一张图片。")}
                </p>
              )}
              {!onlyMine && (
                <div className={styles.checkout}>
                  <div>
                    <span>
                      {s.count} {t("格 ×")}
                      {CELL_PRICE} USDG
                    </span>
                    <strong>
                      {s.total.toFixed(2)} <small>USDG</small>
                    </strong>
                  </div>
                  <button
                    className={`default ${styles.purchaseButton}`}
                    disabled={!s.ready || Boolean(s.conflict)}
                    onClick={() => {
                      show(s.connected ? "purchase" : "wallet");
                    }}
                  >
                    {s.current
                      ? t("✓ 已购买此区域")
                      : s.conflict
                        ? s.count
                          ? t("请重新选择格子")
                          : t("请先点击画布选格")
                        : t(`购买全部 ${s.count} 格 — ${s.total} USDG`)}{" "}
                    <span>→</span>
                  </button>
                  <p>{t("本地演示 · 不发起交易或扣款")}</p>
                </div>
              )}
              <fieldset className={styles.overview}>
                <legend>{t("全局地图")}</legend>
                <div className={styles.overviewRow}>
                  <MiniMap
                    selected={s.selected}
                    owned={s.owned}
                    onSelect={s.setSelected}
                  />
                  <div>
                    <strong>
                      {occupied.toLocaleString("en-US")} <small>/ 10,000</small>
                    </strong>
                    <span>{t("格子已有了自己的故事")}</span>
                    <div
                      className={`progress-indicator segmented ${styles.progress}`}
                      role="progressbar"
                      aria-label={t("画布占用进度")}
                      aria-valuemin={0}
                      aria-valuemax={10000}
                      aria-valuenow={occupied}
                    >
                      <span
                        className="progress-indicator-bar"
                        style={{ width: `${occupied / 100}%` }}
                      />
                    </div>
                    <span>
                      {t("还有")}
                      <b>{(10000 - occupied).toLocaleString("en-US")}</b>{" "}
                      {t("个位置")}
                    </span>
                    <p>{t("点击小地图，去别处逛逛 ↖")}</p>
                  </div>
                </div>
              </fieldset>
            </aside>
          </div>
          <footer className={`status-bar ${styles.statusBar}`}>
            <p className="status-bar-field" role="status">
              {t(s.notice)}
            </p>
            <p className="status-bar-field">
              X: {s.selected.x} &nbsp; Y: {s.selected.y}
            </p>
            <p className="status-bar-field">{t("10,000 格")}</p>
          </footer>
        </main>
      )}
      <footer className={styles.taskbar}>
        <button className={styles.startButton} onClick={() => show("help")}>
          <PixelIcon small kind="computer" />
          <strong>{t("开始")}</strong>
        </button>
        <span className={styles.taskDivider} />
        <button
          className={styles.taskButton}
          onClick={() => setMinimized(!minimized)}
          aria-pressed={!minimized}
        >
          <PixelIcon small />
          {t("万格画布.exe")}
        </button>
        <span className={styles.taskbarHint}>
          {t("小小的格子，大大的互联网。")}
        </span>
        <div className={`status-field-border ${styles.clock}`}>
          <span aria-hidden="true">◖))</span>
          <span>{time}</span>
        </div>
      </footer>
      {dialog && (
        <RetroDialog
          title={
            dialog === "swap"
              ? t("交易")
              : dialog === "settings"
                ? t("设置")
                : dialog === "wallet"
                  ? t("连接钱包")
                  : dialog === "mine"
                    ? t("我的作品")
                    : dialog === "purchase"
                      ? t("确认演示购买")
                      : t("关于万格画布")
          }
          onClose={() => setDialog(null)}
        >
          {dialog === "swap" && <SwapPanel />}
          {dialog === "settings" && (
            <SettingsPanel
              connected={s.connected}
              onConnect={() => s.setConnected(true)}
              onDisconnect={() => s.setConnected(false)}
            />
          )}
          {dialog === "wallet" && (
            <>
              <div className={styles.dialogLead}>
                <PixelIcon kind="wallet" />
                <div>
                  <h2>{t("先用演示钱包体验一下。")}</h2>
                  <p>
                    {t("这一版展示完整选格流程。真实链上支付将在后续接入。")}
                  </p>
                </div>
              </div>
              <p>
                {t(
                  "演示作品只保存在当前浏览器，不会连接真实钱包，也不会扣除 USDG。",
                )}
              </p>
              <div className={styles.dialogActions}>
                <button onClick={() => setDialog(null)}>{t("取消")}</button>
                <button
                  onClick={() => {
                    s.setConnected(true);
                    s.setNotice("演示钱包已连接，可以购买选中的格子。");
                    setDialog(!s.conflict && !s.current ? "purchase" : null);
                  }}
                >
                  {s.connected ? t("继续体验") : t("连接演示钱包")}
                </button>
              </div>
            </>
          )}
          {dialog === "purchase" && (
            <>
              <div className={styles.confirmPreview}>
                <div>
                  <h2>{t("确认购买所选格子")}</h2>
                  <p>{t("购买完成后，在「我的格子」上传图片。")}</p>
                  <p>
                    {t("选区范围起点 X:")}
                    {s.area.x} · Y: {s.area.y}
                  </p>
                  <p>
                    {t("已选")}
                    {s.count} {t("格，每格 2 USDG")}
                  </p>
                  <strong>
                    {t("合计")}
                    {s.total} USDG
                  </strong>
                  <p>{t("演示支付，不产生真实交易。")}</p>
                </div>
              </div>
              <div className={styles.dialogActions}>
                <button onClick={() => setDialog(null)}>{t("再想一想")}</button>
                <button
                  onClick={() => {
                    if (s.purchase()) {
                      setOnlyMine(true);
                      setOnlyAvailable(false);
                      setMultiSelect(false);
                      setDialog(null);
                    }
                  }}
                >
                  {t("确认演示购买")}
                </button>
              </div>
            </>
          )}
          {dialog === "help" && (
            <>
              <div className={styles.dialogLead}>
                <PixelIcon />
                <div>
                  <h2>{t("一万个格子，一起完成。")}</h2>
                  <p>{t("万格画布 / THE 10,000 SQUARE PROJECT")}</p>
                </div>
              </div>
              <ol className={styles.steps}>
                <li>
                  {t(
                    "使用「多选购买」逐个点击空白格，再次点击取消；支持不连续位置。",
                  )}
                </li>
                <li>{t("先连接演示钱包购买格子，无需提前上传图片。")}</li>
                <li>
                  {t(
                    "购买后打开「我的格子」，多选未上传格子，上传图片并锁定作品；保存后不可修改。每格 2 USDG。",
                  )}
                </li>
              </ol>
              <p>
                {t(
                  "滚动探索地图，使用 + / − 缩放；聚焦画布后可用方向键选格。作品记录保存在本机浏览器，清理浏览器数据后将消失。",
                )}
              </p>
              <div className={styles.dialogActions}>
                <a
                  href="https://jdan.github.io/98.css/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Made with 98.css ↗
                </a>
                <button onClick={() => setDialog(null)}>{t("开始探索")}</button>
              </div>
            </>
          )}
          {dialog === "mine" && (
            <>
              <h2>{t("我的小小收藏夹")}</h2>
              <p>
                {works.length
                  ? t(`你已经在画布上留下了 ${works.length} 份表达。`)
                  : t("你的第一个小世界，还在等你。")}
              </p>
              <div className={styles.ownedList}>
                {works.map((c) => (
                  <button
                    key={cellId(c)}
                    onClick={() => {
                      s.viewRegion(c.cells?.[0] ?? c);
                      setOnlyMine(true);
                      setOnlyAvailable(false);
                      setMultiSelect(false);
                      setDialog(null);
                    }}
                  >
                    <div className={styles.ownedRegion}>
                      <RegionImage
                        image={c.image}
                        region={c}
                        label={t(c.name)}
                      />
                    </div>
                    <span>
                      X: {c.x} · Y: {c.y} · {c.width} × {c.height} /{" "}
                      {areaSize(c)} {t("格")}
                      <small>{t(c.name)}</small>
                    </span>
                  </button>
                ))}
              </div>
              <div className={styles.dialogActions}>
                <button onClick={() => setDialog(null)}>{t("返回画布")}</button>
              </div>
            </>
          )}
        </RetroDialog>
      )}
    </div>
  );
}
