// The night-blueprint palette: canal-ink floors, plaster walls, amber lanterns, gold loot.

export const C = {
  ink: '#0e2129',
  floor: '#15303a',
  floorLine: '#1e4350',
  floorLineMajor: '#27576a',
  shadow: '#08151b',
  shadowHatch: '#2d6b5e',
  shadowEdge: '#4f9c86',
  wallTop: '#d9cbb0',
  wallSide: '#7c6c55',
  wallDark: '#4a3f31',
  vent: '#3a4a52',
  door: '#a07a4a',
  doorLocked: '#c9563c',
  lantern: '#ffb648',
  lanternHot: '#ff4a3d',
  camera: '#b58cff',
  cameraHot: '#ff5fd2',
  loot: '#ffd54a',
  lootDeep: '#b8860b',
  laser: '#ff3e7a',
  thief: '#e8f0ff',
  wing: '#8fd3ff',
  guard: '#c2463a',
  guardDark: '#6b221c',
  smoke: '#c8d6dc',
  hud: '#0b1a20',
  hudLine: '#2c5563',
  text: '#f1e8d6',
  textDim: '#9fb5ba',
  calm: '#7fd1b9',
  exit: '#6fe3ff',
};

export const FONT_DISPLAY = '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';
export const FONT_UI = '"Trebuchet MS", "Segoe UI", Tahoma, sans-serif';

export function font(size, weight = 'normal', family = FONT_UI) {
  return `${weight} ${size}px ${family}`;
}
