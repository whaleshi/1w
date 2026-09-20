export type SwapToken = "USDG" | "WANGE";
export const INITIAL_POOL = { USDG: 100000, WANGE: 12500000 };
export function quoteSwap(
  amount: number,
  pay: SwapToken,
  pool: typeof INITIAL_POOL,
  slippage: number,
) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(slippage) ||
    slippage < 0.1 ||
    slippage > 5
  )
    return null;
  const receive = pay === "USDG" ? "WANGE" : "USDG";
  const fee = amount * 0.003;
  const net = amount - fee;
  const output =
    Math.floor(((pool[receive] * net) / (pool[pay] + net)) * 1e6) / 1e6;
  if (output <= 0) return null;
  return {
    receive,
    output,
    minimum: Math.floor(output * (1 - slippage / 100) * 1e6) / 1e6,
    fee,
    impact: (net / (pool[pay] + net)) * 100,
  };
}
