// Pure gesture math for swipe-to-shuffle. Thresholds are evaluated against
// RAW pointer deltas; the resistance curve is visual-only.

export const SWIPE_THRESHOLD = 60;
export const AXIS_DOMINANCE = 2;
export const DRAG_CAP = 90;
export const DRAG_FACTOR = 0.85;
export const TAP_SLOP = 10;

export function evaluateSwipe(dx: number, dy: number): "shuffle" | "none" {
  if (Math.abs(dx) < SWIPE_THRESHOLD) return "none";
  if (Math.abs(dx) <= AXIS_DOMINANCE * Math.abs(dy)) return "none";
  return "shuffle";
}

export function dragOffset(dx: number): number {
  return Math.sign(dx) * Math.min(Math.abs(dx), DRAG_CAP) * DRAG_FACTOR;
}
