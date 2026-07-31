// Pure gesture math for swipe-to-shuffle. Thresholds are evaluated against
// RAW pointer deltas; the visual curves below only shape what the finger sees.

export const SWIPE_THRESHOLD = 60;
export const AXIS_DOMINANCE = 2;
export const TAP_SLOP = 10;

// The card follows the finger 1:1 up to this distance, then keeps moving with
// gentle resistance - it must feel held, never pinned.
export const FOLLOW_LIMIT = 140;
export const OVERDRAG_FACTOR = 0.35;

// Drag distance at which the under-card has fully risen into the top slot.
export const PROMOTE_DISTANCE = 120;

// Degrees of tilt per pixel of visual offset.
export const ROTATION_FACTOR = 0.06;

export function evaluateSwipe(dx: number, dy: number): "shuffle" | "none" {
  if (Math.abs(dx) < SWIPE_THRESHOLD) return "none";
  if (Math.abs(dx) <= AXIS_DOMINANCE * Math.abs(dy)) return "none";
  return "shuffle";
}

/** Visual x-offset of the dragged card: 1:1, then resisted past FOLLOW_LIMIT. */
export function dragOffset(dx: number): number {
  const magnitude = Math.abs(dx);
  const followed =
    magnitude <= FOLLOW_LIMIT
      ? magnitude
      : FOLLOW_LIMIT + (magnitude - FOLLOW_LIMIT) * OVERDRAG_FACTOR;
  return Math.sign(dx) * followed;
}

/** How far the under-card has risen toward the top slot, 0..1. */
export function dragProgress(dx: number): number {
  return Math.min(1, Math.abs(dx) / PROMOTE_DISTANCE);
}

/** Tilt of the dragged card, in degrees. */
export function dragRotation(dx: number): number {
  return dragOffset(dx) * ROTATION_FACTOR;
}
