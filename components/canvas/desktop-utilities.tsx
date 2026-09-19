"use client";
import { useState } from "react";
import { useLanguage } from "./use-language";
import styles from "./canvas.module.css";
export function SwapPanel() {
  const { language } = useLanguage();
  const label = (zh: string, en: string) => (language === "en" ? en : zh);
  const [reverse, setReverse] = useState(false);
  const [amount, setAmount] = useState("");
  return (
    <div className={styles.utilityPanel}>
      <div>
        <h2>{label("兑换代币", "Swap tokens")}</h2>
        <p>
          {label(
            "轻松交换，探索你的链上世界。",
            "A little swap, a new possibility.",
          )}
        </p>
      </div>
      <fieldset>
        <legend>{label("支付", "You pay")}</legend>
        <div className={styles.swapAmount}>
          <input
            aria-label={label("支付金额", "Pay amount")}
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              if (/^\d*\.?\d*$/.test(e.target.value)) setAmount(e.target.value);
            }}
          />
          <strong>{reverse ? "WANGE" : "USDG"}</strong>
        </div>
        <p>{label("余额：—", "Balance: —")}</p>
      </fieldset>
      <button
        className={styles.swapDirection}
        aria-label={label("切换兑换方向", "Reverse swap direction")}
        onClick={() => setReverse((v) => !v)}
      >
        ⇅
      </button>
      <fieldset>
        <legend>{label("接收", "You receive")}</legend>
        <div className={styles.swapAmount}>
          <input
            aria-label={label("接收金额", "Receive amount")}
            value="—"
            readOnly
          />
          <strong>{reverse ? "USDG" : "WANGE"}</strong>
        </div>
        <p>{label("参考价格：暂无报价", "Price: no quote available")}</p>
      </fieldset>
      <div className="sunken-panel">
        <dl className={styles.swapDetails}>
          <dt>{label("滑点容差", "Slippage tolerance")}</dt>
          <dd>0.5%</dd>
          <dt>{label("网络费用", "Network fee")}</dt>
          <dd>—</dd>
          <dt>{label("最低接收", "Minimum received")}</dt>
          <dd>—</dd>
        </dl>
      </div>
      <button className="default" disabled>
        {label("兑换 · 仅样式演示", "Swap · Preview only")}
      </button>
      <p>
        {label(
          "WANGE 为占位币种。暂未接入报价或交易，不会扣款。",
          "WANGE is a placeholder token. No quotes, transactions or charges.",
        )}
      </p>
    </div>
  );
}
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
