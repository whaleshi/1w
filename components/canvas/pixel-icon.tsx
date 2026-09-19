export function PixelIcon({
  kind = "canvas",
  small = false,
}: {
  kind?:
    "canvas" | "folder" | "wallet" | "help" | "computer" | "swap" | "settings";
  small?: boolean;
}) {
  return (
    <svg
      width={small ? 18 : 32}
      height={small ? 18 : 32}
      viewBox="0 0 32 32"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {kind === "swap" ? (
        <>
          <path
            fill="#222"
            d="M3 7h19V3l8 8-8 8v-5H3zM29 20H10v-5l-8 8 8 8v-5h19z"
          />
          <path fill="#63d8c0" d="M4 8h19V6l5 5-5 5v-3H4z" />
          <path fill="#ffe279" d="M28 21H9v-3l-5 5 5 5v-3h19z" />
        </>
      ) : kind === "settings" ? (
        <>
          <path
            fill="#222"
            d="M12 1h8v5l4-3 5 5-3 4h5v8h-5l3 4-5 5-4-3v5h-8v-5l-4 3-5-5 3-4H1v-8h5L3 8l5-5 4 3z"
          />
          <path
            fill="#bfc4ca"
            d="M13 3h6v5l5-3 3 3-3 5h5v6h-5l3 5-3 3-5-3v5h-6v-5l-5 3-3-3 3-5H3v-6h5L5 8l3-3 5 3z"
          />
          <path fill="#fff" d="M11 10h10v11H10V11z" />
          <path fill="#666" d="M12 12h8v8h-8z" />
          <path fill="#008080" d="M14 14h5v5h-5z" />
        </>
      ) : kind === "canvas" ? (
        <>
          <path fill="#222" d="M4 3h22v24H4z" />
          <path fill="#fff" d="M6 5h18v20H6z" />
          <path fill="#347ab3" d="M7 6h16v10H7z" />
          <path fill="#f0d662" d="M17 7h4v4h-4z" />
          <path fill="#508948" d="m7 21 5-9 5 6 3-3 3 8H7z" />
          <path fill="#b17e44" d="m22 15 4 2-8 13-4-2z" />
        </>
      ) : kind === "folder" ? (
        <>
          <path fill="#333" d="M2 7h12l3 4h13v17H2z" />
          <path fill="#ffe279" d="M3 8h10l3 4h13v14H3z" />
          <path fill="#bd923b" d="M3 16h26v2H3z" />
          <path fill="#fff3b0" d="M4 14h24v3H4z" />
        </>
      ) : kind === "wallet" ? (
        <>
          <path fill="#333" d="M3 8h25v20H3z" />
          <path fill="#9d6f38" d="M5 10h21v16H5z" />
          <path fill="#e4c18a" d="M6 5h18v7H6z" />
          <path fill="#387751" d="M10 3h11v9H10z" />
          <path fill="#d7b377" d="M19 16h10v7H19z" />
          <path fill="#444" d="M21 18h3v3h-3z" />
        </>
      ) : kind === "computer" ? (
        <>
          <path fill="#222" d="M3 2h25v22H3z" />
          <path fill="#ddd" d="M4 3h23v20H4zM11 24h10v3H11zM4 27h24v3H4z" />
          <path fill="#000080" d="M6 5h19v15H6z" />
          <path fill="#00aaaa" d="M7 6h17v13H7z" />
        </>
      ) : (
        <>
          <path fill="#222" d="M8 2h16v3h4v22h-4v3H8v-3H4V5h4z" />
          <path fill="#f5eeb8" d="M9 3h14v3h4v20h-4v3H9v-3H5V6h4z" />
          <path
            fill="#000080"
            d="M12 8h9v3h3v6h-6v4h-4v-7h6v-3h-8zm2 16h4v3h-4z"
          />
        </>
      )}
    </svg>
  );
}
