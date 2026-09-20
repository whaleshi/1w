"use client";
import { useLanguage } from "./use-language";
import styles from "./canvas.module.css";
export { SwapPanel } from "./swap-panel";
export function SettingsPanel({
  connected,
  onConnect,
  onDisconnect,
}: {
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { language, setLanguage } = useLanguage();
  const label = (zh: string, en: string) => (language === "en" ? en : zh);
  return (
    <div className={styles.utilityPanel}>
      <fieldset>
        <legend>{label("显示语言", "Display language")}</legend>
        <div className="field-row">
          <label htmlFor="display-language">{label("语言", "Language")}</label>
          <select
            id="display-language"
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value === "en" ? "en" : "zh-CN")
            }
          >
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
          </select>
        </div>
        <p>
          {label(
            "立即生效，并保存到当前浏览器。",
            "Applies immediately and is saved in this browser.",
          )}
        </p>
      </fieldset>
      <fieldset>
        <legend>{label("钱包", "Wallet")}</legend>
        <p>
          {connected
            ? label("● 演示钱包已连接", "● Demo wallet connected")
            : label("○ 尚未连接钱包", "○ Wallet disconnected")}
        </p>
        <button onClick={connected ? onDisconnect : onConnect}>
          {connected
            ? label("断开连接", "Disconnect")
            : label("连接演示钱包", "Connect demo wallet")}
        </button>
        <p>
          {label(
            "当前为本地演示，不会连接真实钱包或发起交易。",
            "Local demo only. No real wallet connection or transactions.",
          )}
        </p>
      </fieldset>
    </div>
  );
}
