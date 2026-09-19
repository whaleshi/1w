import { parseSavedCells, type OwnedCell } from "./grid";
const KEY = "wange:cells:v1";
const EMPTY: OwnedCell[] = [];
let previous: string | null = null;
let snapshot: OwnedCell[] = EMPTY;
const listeners = new Set<() => void>();
export function readCells() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== previous) {
      snapshot = parseSavedCells(raw);
      previous = raw;
    }
  } catch {
    return snapshot;
  }
  return snapshot;
}
export const serverCells = () => EMPTY;
export function subscribeCells(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
export function saveCells(cells: OwnedCell[]) {
  localStorage.setItem(KEY, JSON.stringify(cells));
  listeners.forEach((listener) => listener());
}
export const clientReady = () => true;
export const serverReady = () => false;
