// The heist camera: a close view that follows Moth, kept inside the building's bounds.
// Converts between world pixels (the map) and screen pixels (the 1280x720 view).

import { MAP_Y, TILE, MAP_COLS, MAP_ROWS } from './map.js';

export const VIEW_ZOOM = 1.45;
export const SCREEN_W = 1280;
export const SCREEN_H = 576; // the map band between the HUD bars

export function viewFor(run, zoom = VIEW_ZOOM) {
  const worldW = MAP_COLS * TILE, worldH = MAP_ROWS * TILE;
  const vw = SCREEN_W / zoom, vh = SCREEN_H / zoom;
  const focus = run.thief.x > 0 ? run.thief : { x: worldW / 2, y: worldH / 2 };
  const ox = Math.max(0, Math.min(worldW - vw, focus.x - vw / 2));
  const oy = Math.max(0, Math.min(worldH - vh, focus.y - vh / 2));
  return { zoom, ox, oy, vw, vh };
}

/** Screen point (mouse) to world point, under the run's current view. */
export function screenToWorld(run, sx, sy) {
  const v = run.view || viewFor(run);
  return { x: sx / v.zoom + v.ox, y: (sy - MAP_Y) / v.zoom + v.oy };
}

/** World point to screen point, the inverse of screenToWorld. */
export function worldToScreen(run, wx, wy) {
  const v = run.view || viewFor(run);
  return { x: (wx - v.ox) * v.zoom, y: (wy - v.oy) * v.zoom + MAP_Y };
}
