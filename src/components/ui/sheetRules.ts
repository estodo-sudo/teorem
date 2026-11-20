/** Drag the sheet down this far (or flick it) to close. Pure, so it can be tested without Reanimated. */
export const SHEET_CLOSE_DRAG = 100;
export const SHEET_CLOSE_VELOCITY = 0.8;
export const shouldCloseSheet = (dy: number, vy: number) => dy > SHEET_CLOSE_DRAG || vy > SHEET_CLOSE_VELOCITY;
