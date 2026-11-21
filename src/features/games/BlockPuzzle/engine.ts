/**
 * Blok Bulmaca engine (SPEC_V4 §C.5): an 8×8 board, three offered pieces of 1–5 cells, full rows and
 * columns clear. It is a placement puzzle (nothing falls) and it never ends: with no move left, half
 * of the board is cleared gently and play goes on. Pure logic; `random` is injectable for tests.
 */
export const SIZE = 8;
export type Board = boolean[];
/** Cells of a piece as [row, col] offsets from its top-left corner. */
export type Shape = readonly (readonly [number, number])[];

export interface Piece {
  id: number;
  shape: Shape;
}

const S = (...cells: [number, number][]): Shape => cells;
export const SHAPES: Shape[] = [
  S([0, 0]),
  S([0, 0], [0, 1]),
  S([0, 0], [1, 0]),
  S([0, 0], [0, 1], [0, 2]),
  S([0, 0], [1, 0], [2, 0]),
  S([0, 0], [1, 0], [1, 1]),
  S([0, 1], [1, 0], [1, 1]),
  S([0, 0], [0, 1], [1, 0]),
  S([0, 0], [0, 1], [1, 1]),
  S([0, 0], [0, 1], [1, 0], [1, 1]),
  S([0, 0], [0, 1], [0, 2], [0, 3]),
  S([0, 0], [1, 0], [2, 0], [3, 0]),
  S([0, 0], [1, 0], [2, 0], [2, 1]),
  S([0, 0], [0, 1], [0, 2], [1, 1]),
  S([0, 0], [0, 1], [0, 2], [0, 3], [0, 4]),
  S([0, 0], [1, 0], [2, 0], [3, 0], [4, 0]),
  S([0, 1], [1, 0], [1, 1], [1, 2], [2, 1]),
];

export const emptyBoard = (): Board => Array.from({ length: SIZE * SIZE }, () => false);
export const at = (r: number, c: number) => r * SIZE + c;

export const shapeSize = (shape: Shape) => ({ rows: Math.max(...shape.map(([r]) => r)) + 1, cols: Math.max(...shape.map(([, c]) => c)) + 1 });

export function canPlace(board: Board, shape: Shape, r: number, c: number): boolean {
  return shape.every(([dr, dc]) => {
    const rr = r + dr;
    const cc = c + dc;
    return rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && !board[at(rr, cc)];
  });
}

/** Cells the piece would take (for the drop preview). */
export const cellsOf = (shape: Shape, r: number, c: number) => shape.map(([dr, dc]) => at(r + dr, c + dc));

export interface PlaceResult {
  board: Board;
  /** Indexes of the cells cleared by full rows / columns (for the fade). */
  cleared: number[];
  lines: number;
  points: number;
}

/** Puts a piece down and clears every full row and column. Points: one per cell, ten per line. */
export function place(board: Board, shape: Shape, r: number, c: number): PlaceResult {
  if (!canPlace(board, shape, r, c)) return { board, cleared: [], lines: 0, points: 0 };
  const next = [...board];
  for (const i of cellsOf(shape, r, c)) next[i] = true;
  const rows = [...Array(SIZE).keys()].filter((rr) => [...Array(SIZE).keys()].every((cc) => next[at(rr, cc)]));
  const cols = [...Array(SIZE).keys()].filter((cc) => [...Array(SIZE).keys()].every((rr) => next[at(rr, cc)]));
  const cleared = new Set<number>();
  for (const rr of rows) for (let cc = 0; cc < SIZE; cc++) cleared.add(at(rr, cc));
  for (const cc of cols) for (let rr = 0; rr < SIZE; rr++) cleared.add(at(rr, cc));
  for (const i of cleared) next[i] = false;
  const lines = rows.length + cols.length;
  return { board: next, cleared: [...cleared], lines, points: shape.length + lines * 10 };
}

export function fitsAnywhere(board: Board, shape: Shape): boolean {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (canPlace(board, shape, r, c)) return true;
  return false;
}

export const hasMove = (board: Board, pieces: Piece[]) => pieces.some((p) => fitsAnywhere(board, p.shape));

let nextId = 1;
export function deal(random: () => number = Math.random): Piece[] {
  return [0, 1, 2].map(() => ({ id: nextId++, shape: SHAPES[Math.floor(random() * SHAPES.length)]! }));
}

/**
 * No move left: clear the fuller half of the board (top or bottom four rows) instead of a "game over".
 * Returns the new board and the cleared cells (for a gentle fade).
 */
export function relief(board: Board): { board: Board; cleared: number[] } {
  const filled = (rows: number[]) => rows.reduce((n, r) => n + [...Array(SIZE).keys()].filter((c) => board[at(r, c)]).length, 0);
  const top = [0, 1, 2, 3];
  const bottom = [4, 5, 6, 7];
  const rows = filled(top) > filled(bottom) ? top : bottom;
  const next = [...board];
  const cleared: number[] = [];
  for (const r of rows)
    for (let c = 0; c < SIZE; c++)
      if (next[at(r, c)]) {
        next[at(r, c)] = false;
        cleared.push(at(r, c));
      }
  return { board: next, cleared };
}

export interface GameState {
  board: Board;
  pieces: (Piece | null)[];
  score: number;
}

export const newGame = (random: () => number = Math.random): GameState => ({ board: emptyBoard(), pieces: deal(random), score: 0 });

/**
 * One move: place piece `slot` at (r, c). When all three are used, three new ones come. When no move is
 * left, half the board is cleared (and if even that is not enough, new pieces are dealt).
 */
export function play(g: GameState, slot: number, r: number, c: number, random: () => number = Math.random): { state: GameState; cleared: number[]; lines: number; relieved: boolean } | null {
  const piece = g.pieces[slot];
  if (!piece || !canPlace(g.board, piece.shape, r, c)) return null;
  const res = place(g.board, piece.shape, r, c);
  let pieces = g.pieces.map((p, i) => (i === slot ? null : p));
  if (pieces.every((p) => !p)) pieces = deal(random);
  let board = res.board;
  let cleared = res.cleared;
  let relieved = false;
  const live = pieces.filter((p): p is Piece => !!p);
  if (!hasMove(board, live)) {
    const rel = relief(board);
    board = rel.board;
    cleared = [...cleared, ...rel.cleared];
    relieved = true;
    if (!hasMove(board, live)) pieces = deal(random);
  }
  return { state: { board, pieces, score: g.score + res.points }, cleared, lines: res.lines, relieved };
}
