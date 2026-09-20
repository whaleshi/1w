"use client";
import { useEffect, useRef, useState } from "react";
import { INITIAL_POOL, quoteSwap, type SwapToken } from "@/lib/swap";
import { useLanguage } from "./use-language";
import styles from "./swap-panel.module.css";
export function SwapPanel({
  connected,
  onConnect,
  onNotice,
}: {
  connected: boolean;
  onConnect: () => void;
  onNotice: (message: string) => void;
}) {
  const { language } = useLanguage();
  const l = (zh: string, en: string) => (language === "en" ? en : zh);
  const [pay, setPay] = useState<SwapToken>("USDG");
  const [amount, setAmount] = useState("100");
  const [slippage, setSlippage] = useState("0.5");
  const [settings, setSettings] = useState(false);
  const [balances, setBalances] = useState({ USDG: 1250, WANGE: 8000 });
  const [pool, setPool] = useState(INITIAL_POOL);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState<{
    amount: string;
    pay: string;
    output: number;
    receive: string;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lock = useRef(false);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const receive: SwapToken = pay === "USDG" ? "WANGE" : "USDG";
  const value = Number(amount),
    slip = Number(slippage);
  const invalidSlip = !Number.isFinite(slip) || slip < 0.1 || slip > 5;
  const quote = quoteSwap(value, pay, pool, slip);
  const insufficient = value > balances[pay];
  const format = (n: number, digits = 4) =>
    n.toLocaleString("en-US", { maximumFractionDigits: digits });
  const changeAmount = (v: string) => {
    if (/^\d*\.?\d{0,6}$/.test(v) && v.length <= 18) {
      setAmount(v);
      setCompleted(null);
    }
  };
  function execute() {
    if (lock.current) return;
    if (!connected) {
      onConnect();
      return;
    }
    if (!quote || insufficient || invalidSlip) return;
    lock.current = true;
    setBusy(true);
    setCompleted(null);
    timer.current = setTimeout(() => {
      setBalances((b) => ({
        ...b,
        [pay]: Math.round((b[pay] - value) * 1e6) / 1e6,
        [receive]: Math.round((b[receive] + quote.output) * 1e6) / 1e6,
      }));
      setPool((p) => ({
        ...p,
        [pay]: p[pay] + value,
        [receive]: p[receive] - quote.output,
      }));
      setCompleted({ amount, pay, output: quote.output, receive });
      setAmount("");
      setBusy(false);
      lock.current = false;
      onNotice(
        l(
          "模拟兑换成功，演示余额已更新。",
          "Demo swap completed. Simulated balances updated.",
        ),
      );
    }, 900);
  }
  return (
    <div className={styles.panel}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>WANGE EXCHANGE</span>
          <h2>{l("代币兑换", "Swap tokens")}</h2>
        </div>
        <span className="status-field-border">
          {l("● 模拟市场", "● Demo market")}
        </span>
      </header>
      <div className={styles.market}>
        <span>1 WANGE ≈ {format(pool.USDG / pool.WANGE, 6)} USDG</span>
        <button
          disabled={busy}
          aria-expanded={settings}
          onClick={() => setSettings((v) => !v)}
        >
          ⚙ {l("滑点", "Slippage")} {invalidSlip ? "—" : `${slippage}%`}
        </button>
      </div>
      {settings && (
        <fieldset className={styles.slippage}>
          <legend>{l("滑点设置", "Slippage settings")}</legend>
          <div className={styles.presets}>
            {["0.1", "0.5", "1"].map((v) => (
              <button
                key={v}
                disabled={busy}
                aria-pressed={slippage === v}
                onClick={() => setSlippage(v)}
              >
                {v}%
              </button>
            ))}
            <label>
              <span>{l("自定义", "Custom")}</span>
              <input
                aria-label={l("自定义滑点百分比", "Custom slippage percent")}
                disabled={busy}
                inputMode="decimal"
                value={slippage}
                onChange={(e) => {
                  if (
                    /^\d*\.?\d{0,2}$/.test(e.target.value) &&
                    e.target.value.length <= 5
                  )
                    setSlippage(e.target.value);
                }}
              />
              %
            </label>
          </div>
          <p role="status">
            {invalidSlip
              ? l(
                  "请输入 0.1%～5% 的滑点。",
                  "Enter slippage between 0.1% and 5%.",
                )
              : slip > 1
                ? l(
                    "滑点较高，最低到账金额会更低。",
                    "Higher slippage lowers the minimum received.",
                  )
                : l(
                    "最低到账随滑点调整；模拟成交采用当前报价。",
                    "Slippage sets the minimum received; demo fills use the quote.",
                  )}
          </p>
        </fieldset>
      )}
      <fieldset className={styles.card} disabled={busy}>
        <legend>{l("支付", "You pay")}</legend>
        <div className={styles.amountRow}>
          <input
            aria-label={l("支付金额", "Pay amount")}
            inputMode="decimal"
            value={amount}
            placeholder="0.00"
            onChange={(e) => changeAmount(e.target.value)}
          />
          <div className={styles.token}>
            <i>{pay === "USDG" ? "$" : "W"}</i>
            <strong>{pay}</strong>
          </div>
        </div>
        <div className={styles.balance}>
          <span>
            {l("模拟余额", "Demo balance")}: {format(balances[pay], 6)}
          </span>
          <div>
            <button
              onClick={() =>
                changeAmount(
                  String(Math.floor(balances[pay] * 0.5 * 1e6) / 1e6),
                )
              }
            >
              50%
            </button>
            <button onClick={() => changeAmount(String(balances[pay]))}>
              MAX
            </button>
          </div>
        </div>
      </fieldset>
      <div className={styles.direction}>
        <span />
        <button
          disabled={busy}
          aria-label={l("切换兑换方向", "Reverse direction")}
          onClick={() => {
            setPay(receive);
            setAmount("");
            setCompleted(null);
          }}
        >
          ⇅
        </button>
        <span />
      </div>
      <fieldset className={`${styles.card} ${styles.receive}`}>
        <legend>{l("预计接收", "You receive")}</legend>
        <div className={styles.amountRow}>
          <output aria-label={l("预计接收金额", "Estimated received")}>
            {quote ? format(quote.output) : "0.00"}
          </output>
          <div className={styles.token}>
            <i>{receive === "USDG" ? "$" : "W"}</i>
            <strong>{receive}</strong>
          </div>
        </div>
        <div className={styles.balance}>
          <span>
            {l("模拟余额", "Demo balance")}: {format(balances[receive], 6)}
          </span>
          <span>{l("含 0.3% 手续费", "Includes 0.3% fee")}</span>
        </div>
      </fieldset>
      <dl className={styles.details}>
        <dt>{l("最低到账", "Minimum received")}</dt>
        <dd>
          {quote ? format(quote.minimum, 6) : "—"} {receive}
        </dd>
        <dt>{l("价格影响", "Price impact")}</dt>
        <dd>{quote ? `${format(quote.impact, 3)}%` : "—"}</dd>
        <dt>{l("交易手续费", "Trading fee")}</dt>
        <dd>
          {quote ? format(quote.fee, 6) : "—"} {pay}
        </dd>
        <dt>{l("网络费用（模拟）", "Network fee (demo)")}</dt>
        <dd>0 USDG</dd>
      </dl>
      {completed && (
        <div className={`sunken-panel ${styles.success}`} role="status">
          ✓ {l("兑换完成", "Swap completed")}
          <br />
          {completed.amount} {completed.pay} → {format(completed.output, 6)}{" "}
          {completed.receive}
        </div>
      )}
      <button
        className={`default ${styles.submit}`}
        disabled={
          busy || (connected && (!quote || insufficient || invalidSlip))
        }
        onClick={execute}
      >
        {busy
          ? l("正在模拟兑换…", "Simulating swap…")
          : !connected
            ? l("连接演示钱包", "Connect demo wallet")
            : invalidSlip
              ? l("请检查滑点设置", "Check slippage settings")
              : insufficient
                ? l("模拟余额不足", "Insufficient demo balance")
                : !quote
                  ? l("请输入兑换金额", "Enter an amount")
                  : l("确认模拟兑换 →", "Confirm demo swap →")}
      </button>
      <p className={styles.note}>
        {l(
          "模拟数据 · 无真实交易 · 关闭窗口后余额重置",
          "Simulated data · No real trades · Closing resets balances",
        )}
      </p>
    </div>
  );
}
