import { writeFileSync } from "node:fs";
const colors = [
  "#91bb9b",
  "#f7b4bc",
  "#96b8d6",
  "#e4c178",
  "#a59cc9",
  "#80bbc1",
  "#e7b496",
  "#9dab83",
];
for (let i = 0; i < 32; i++) {
  let content = "";
  const c = colors[i % 8];
  switch (i % 8) {
    case 0:
      content = `<path fill="#303039" d="M16 17V7h8l8 9 8-9h8v30H16z"/><path fill="#fff3d9" d="M20 20h24v20H20zM24 38h16v15H24z"/><path fill="#303039" d="M21 27h5v5h-5zm17 0h5v5h-5zM29 35h6v4h-6zM18 43h6v12h-6zm22 0h6v12h-6z"/><path fill="#ed8f9e" d="M19 12h4v7h-4zm22 0h4v7h-4z"/>`;
      break;
    case 1:
      content = `<rect y="38" width="64" height="26" fill="#407b6c"/><circle cx="46" cy="17" r="9" fill="#ffecc5"/><path fill="#dae5df" d="M-8 43 17 13 43 43z"/><path fill="#6b8fa3" d="M16 44 40 23 69 44z"/><path fill="#faf4dd" d="m17 13-8 10 10-3 7 4z"/>`;
      break;
    case 2:
      content = `<rect width="64" height="64" fill="#1e2949"/><path stroke="#eddfa7" stroke-width="2" d="M9 12h4m-2-2v4m37 31h6m-3-3v6M21 49h4m-2-2v4"/><ellipse cx="33" cy="30" rx="23" ry="7" fill="none" stroke="#ae9ed1" stroke-width="4" transform="rotate(-25 33 30)"/><circle cx="33" cy="30" r="13" fill="${c}"/><path d="m23 24 20 8" stroke="#f2d6b8" stroke-width="4"/>`;
      break;
    case 3:
      content = `<path fill="#e64f65" d="M12 18h8v-6h10v7h5v-7h10v6h8v18h-8v8h-8v8H27v-8h-8v-8h-7z"/><path fill="#ffc2c8" d="M18 20h9v5h-9z"/>`;
      break;
    case 4:
      content = `<rect y="44" width="64" height="20" fill="#5f8768"/><path stroke="#3d7352" stroke-width="4" d="M32 47V26m0 12-10-8m10 3 9-7"/><g fill="#f6d365"><circle cx="32" cy="15" r="8"/><circle cx="22" cy="23" r="8"/><circle cx="42" cy="23" r="8"/><circle cx="26" cy="32" r="8"/><circle cx="38" cy="32" r="8"/></g><circle cx="32" cy="24" r="8" fill="#745236"/>`;
      break;
    case 5:
      content = `<rect width="64" height="64" fill="#dfe9ef"/><path fill="#f0b347" d="M12 51V24h7v-9h26v9h7v27z"/><path fill="#4d4144" d="M20 29h6v7h-6zm20 0h6v7h-6zM29 39h8v5h-8z"/><path fill="#fff8e6" d="M15 38h12v10H15zm25 0h9v10h-9z"/><path fill="#c68536" d="M19 15V5h9v13zm17 0V5h9v13z"/>`;
      break;
    case 6:
      content = `<rect width="64" height="64" fill="#7cabb9"/><circle cx="47" cy="15" r="8" fill="#ffdc9d"/><path fill="#42664e" d="M0 50 18 30 32 44 52 22 64 35V64H0z"/><path fill="#d2ddd1" d="m20 64 20-26 5 3-12 23z"/>`;
      break;
    case 7:
      content = `<path fill="#ede0c6" d="M13 30h38v21H13z"/><path fill="#b75547" d="m7 32 25-22 25 22z"/><path fill="#769aaa" d="M19 36h9v9h-9zm19 0h7v15h-7z"/><rect y="51" width="64" height="13" fill="#759563"/>`;
      break;
  }
  writeFileSync(
    `public/art/tile-${i}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${colors[Math.floor(i / 4) % 8]}"/>${content}</svg>`,
  );
}
