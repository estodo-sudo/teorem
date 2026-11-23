import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ComponentRef } from 'react';
import { PanResponder, Pressable, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';
import Animated, { FadeInDown, FadeOut, useReducedMotion, ZoomIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, useTheme } from '@/components';
import { fmtClock } from '@/features/breath/patterns';
import { useSettingsStore } from '@/stores/settingsStore';

import { canPlace, cellsOf, fitsAnywhere, newGame, place, play, SIZE, shapeSize, TINTS, type GameState, type Shape } from './engine';

export const PUZZLE_SECONDS = 180;
const GAP = 3;
const LIFT = 70;
/** Soft, clear block colours (same in both themes); index = piece tint. */
export const BLOCK_COLORS = ['#3FB8AF', '#5B8DEF', '#F2A65A', '#E5707E', '#9B7FE6', '#6CC070'] as const;

interface Frame {
  x: number;
  y: number;
}

/**
 * Blok Bulmaca (SPEC_V4 §C.5, polished 2026-11-23 — same game, a more finished look): each piece has
 * its own colour and the blocks have a light top edge and a soft bevel; the board sits in a framed
 * panel. While dragging, the cells the piece would take light up in its colour and the rows / columns
 * it would complete glow. Clearing shows "+points" and a combo for several lines; pieces that fit
 * nowhere are dimmed. Drag a piece onto the 8×8 board, or tap a piece and then a cell. A thin ring
 * counts 3 minutes; then only a note appears. With no move left half the board clears; no "you lost".
 */
export function BlockPuzzle({ color, onPlayed, onTimeUp }: { color?: string; onPlayed?: () => void; onTimeUp?: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const accent = color ?? t.tone.smokefree.fg;
  const boardW = Math.min(width - 56, 330);
  const cell = Math.floor((boardW - GAP * (SIZE - 1)) / SIZE);
  const step = cell + GAP;
  const mini = Math.floor(cell * 0.55);

  const [game, setGame] = useState<GameState>(() => newGame());
  // Colour of every board cell (null = empty), kept next to the engine's board.
  const [tints, setTints] = useState<(number | null)[]>(() => Array.from({ length: SIZE * SIZE }, () => null));
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ slot: number; x: number; y: number; x0: number; y0: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [burst, setBurst] = useState<{ key: number; text: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // Host nodes kept in state (not refs) so the drag handlers can measure them.
  const [boardNode, setBoardNode] = useState<ComponentRef<typeof View> | null>(null);
  const [rootNode, setRootNode] = useState<ComponentRef<typeof View> | null>(null);
  const [frames, setFrames] = useState<{ board: Frame; root: Frame } | null>(null);
  const timeUp = elapsed >= PUZZLE_SECONDS;

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (timeUp) onTimeUp?.();
    // Once, when the 3 minutes pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);
  useEffect(() => {
    if (!burst) return;
    const id = setTimeout(() => setBurst(null), 1100);
    return () => clearTimeout(id);
  }, [burst]);

  const buzz = (kind: 'place' | 'clear') => {
    if (strength === 0) return;
    if (kind === 'clear') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  };

  const tryPlay = (slot: number, r: number, c: number) => {
    const piece = game.pieces[slot];
    const res = play(game, slot, r, c);
    if (!piece || !res) return false;
    // Colours: the new cells take the piece colour, cleared cells empty.
    setTints((prev) => {
      const next = [...prev];
      for (const i of cellsOf(piece.shape, r, c)) next[i] = piece.tint;
      for (const i of res.cleared) next[i] = null;
      return next;
    });
    setGame(res.state);
    setSelected(null);
    onPlayed?.();
    buzz(res.lines ? 'clear' : 'place');
    setNote(res.relieved ? tr('puzzle.relief') : null);
    if (res.lines) {
      const points = res.state.score - game.score;
      setBurst({ key: res.state.score, text: res.lines > 1 ? tr('puzzle.combo', { n: res.lines, points }) : tr('puzzle.plus', { points }) });
    }
    return true;
  };

  const measure = () => {
    boardNode?.measureInWindow((bx: number, by: number) => rootNode?.measureInWindow((rx: number, ry: number) => setFrames({ board: { x: bx, y: by }, root: { x: rx, y: ry } })));
  };

  // Where a dragged piece would land: its top-left cell, from the lifted ghost position.
  const target = (() => {
    if (!drag || !frames) return null;
    const piece = game.pieces[drag.slot];
    if (!piece) return null;
    const size = shapeSize(piece.shape);
    const left = drag.x - (size.cols * step) / 2 - frames.board.x;
    const top = drag.y - LIFT - (size.rows * step) / 2 - frames.board.y;
    const r = Math.round(top / step);
    const c = Math.round(left / step);
    return { r, c, ok: canPlace(game.board, piece.shape, r, c), shape: piece.shape, tint: piece.tint };
  })();
  const preview = new Set(target?.ok ? cellsOf(target.shape, target.r, target.c) : []);
  // Rows / columns the drop would complete glow before the piece is let go.
  const willClear = new Set(target?.ok ? place(game.board, target.shape, target.r, target.c).cleared : []);
  const previewColor = target ? BLOCK_COLORS[target.tint % TINTS]! : accent;

  const panFor = (slot: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        measure();
        setDrag({ slot, x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, x0: e.nativeEvent.pageX, y0: e.nativeEvent.pageY });
      },
      onPanResponderMove: (e) => setDrag((d) => ({ slot, x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, x0: d?.x0 ?? e.nativeEvent.pageX, y0: d?.y0 ?? e.nativeEvent.pageY })),
      onPanResponderRelease: () => {
        // Measured from where the finger went down: the handlers are rebuilt on every render, so the
        // responder's own dx / dy would start again from zero.
        const tap = !drag || (Math.abs(drag.x - drag.x0) < 6 && Math.abs(drag.y - drag.y0) < 6);
        if (tap) setSelected((s) => (s === slot ? null : slot));
        else if (target?.ok) tryPlay(slot, target.r, target.c);
        setDrag(null);
      },
      onPanResponderTerminate: () => setDrag(null),
    });

  const ring = 26;
  const rr = (ring - 3) / 2;
  const circ = 2 * Math.PI * rr;
  const emptyCell = t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <View ref={setRootNode} style={{ gap: t.space.md, alignItems: 'center' }} onLayout={measure}>
      <View style={{ width: boardW + 16, flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
        <Svg width={ring} height={ring}>
          <Circle cx={ring / 2} cy={ring / 2} r={rr} stroke={t.tokens.border} strokeWidth={3} fill="none" />
          <Circle cx={ring / 2} cy={ring / 2} r={rr} stroke={accent} strokeWidth={3} fill="none" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * Math.max(0, 1 - elapsed / PUZZLE_SECONDS)} strokeLinecap="round" transform={`rotate(-90 ${ring / 2} ${ring / 2})`} />
        </Svg>
        <AppText variant="footnote" muted tabular style={{ flex: 1 }} accessibilityLabel={tr('puzzle.timeA11y', { time: fmtClock(Math.max(0, PUZZLE_SECONDS - elapsed) * 1000) })}>
          {timeUp ? tr('puzzle.timeUpShort') : fmtClock(Math.max(0, PUZZLE_SECONDS - elapsed) * 1000)}
        </AppText>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="caption" muted>
            {tr('puzzle.scoreLabel')}
          </AppText>
          <AppText variant="title3" tabular weight="800" accessibilityLabel={tr('puzzle.score', { n: game.score })}>
            {game.score}
          </AppText>
        </View>
      </View>

      {/* Framed board. */}
      <View style={{ padding: 8, borderRadius: t.radius.lg, backgroundColor: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: t.tokens.border }}>
        <View ref={setBoardNode} onLayout={measure} style={{ width: boardW, height: boardW, flexDirection: 'row', flexWrap: 'wrap', gap: GAP }} accessibilityLabel={tr('puzzle.boardA11y')}>
          {game.board.map((filled, i) => {
            const r = Math.floor(i / SIZE);
            const c = i % SIZE;
            const lit = preview.has(i);
            const glow = willClear.has(i);
            const tint = tints[i];
            return (
              <Pressable
                key={i}
                onPress={selected !== null ? () => tryPlay(selected, r, c) : undefined}
                accessibilityRole={selected !== null ? 'button' : undefined}
                accessibilityLabel={tr('puzzle.cellA11y', { r: r + 1, c: c + 1, state: filled ? tr('puzzle.full') : tr('puzzle.empty') })}
                style={{ width: cell, height: cell, borderRadius: cell * 0.2, backgroundColor: emptyCell, overflow: 'hidden' }}
              >
                {filled ? (
                  <Animated.View exiting={reduce ? undefined : FadeOut.duration(320)} style={{ flex: 1 }}>
                    <Block size={cell} color={BLOCK_COLORS[(tint ?? 0) % TINTS]!} glow={glow} />
                  </Animated.View>
                ) : lit ? (
                  <View style={{ flex: 1, opacity: 0.55 }}>
                    <Block size={cell} color={previewColor} glow={glow} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {burst ? (
          <Animated.View key={burst.key} entering={reduce ? undefined : ZoomIn.duration(220)} exiting={reduce ? undefined : FadeOut.duration(300)} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '40%', alignItems: 'center' }}>
            <View style={{ paddingHorizontal: t.space.lg, paddingVertical: t.space.sm, borderRadius: t.radius.pill, backgroundColor: 'rgba(15,18,20,0.78)' }}>
              <AppText variant="title3" weight="800" color="#FFFFFF" accessibilityLiveRegion="polite">
                {burst.text}
              </AppText>
            </View>
          </Animated.View>
        ) : null}
      </View>

      {note || timeUp ? (
        <AppText variant="footnote" muted center accessibilityLiveRegion="polite">
          {note ?? tr('puzzle.timeUp')}
        </AppText>
      ) : null}

      {/* The three pieces; one that fits nowhere is dimmed. */}
      <View style={{ width: boardW + 16, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', minHeight: mini * 5 + 28, paddingVertical: t.space.xs, borderRadius: t.radius.lg, backgroundColor: t.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }}>
        {game.pieces.map((p, slot) => (
          <View key={p ? p.id : `empty-${slot}`} style={{ width: boardW / 3 - 4, height: mini * 5 + 16, alignItems: 'center', justifyContent: 'center' }}>
            {p ? (
              <Animated.View entering={reduce ? undefined : FadeInDown.duration(260).delay(slot * 60)}>
                <View
                  {...panFor(slot).panHandlers}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={tr('puzzle.pieceA11y', { n: p.shape.length })}
                  accessibilityState={{ selected: selected === slot }}
                  onAccessibilityTap={() => setSelected((s) => (s === slot ? null : slot))}
                  style={{ padding: 6, borderRadius: t.radius.md, borderWidth: 2, borderColor: selected === slot ? BLOCK_COLORS[p.tint % TINTS] : 'transparent', opacity: drag?.slot === slot ? 0.25 : fitsAnywhere(game.board, p.shape) ? 1 : 0.35 }}
                >
                  <PieceView shape={p.shape} size={mini} gap={2} color={BLOCK_COLORS[p.tint % TINTS]!} />
                </View>
              </Animated.View>
            ) : null}
          </View>
        ))}
      </View>

      {drag && frames && game.pieces[drag.slot] ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: drag.x - frames.root.x - (shapeSize(game.pieces[drag.slot]!.shape).cols * step) / 2,
            top: drag.y - frames.root.y - LIFT - (shapeSize(game.pieces[drag.slot]!.shape).rows * step) / 2,
            opacity: 0.9,
          }}
        >
          <PieceView shape={game.pieces[drag.slot]!.shape} size={cell} gap={GAP} color={BLOCK_COLORS[game.pieces[drag.slot]!.tint % TINTS]!} />
        </View>
      ) : null}
    </View>
  );
}

/** One block: a rounded tile with a light top edge and a darker bottom bevel; `glow` = will clear. */
function Block({ size, color, glow }: { size: number; color: string; glow?: boolean }) {
  const radius = size * 0.2;
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: color, overflow: 'hidden', borderBottomWidth: Math.max(2, size * 0.09), borderBottomColor: 'rgba(0,0,0,0.2)' }}>
      <View style={{ position: 'absolute', left: size * 0.12, right: size * 0.12, top: size * 0.1, height: size * 0.22, borderRadius: size * 0.12, backgroundColor: 'rgba(255,255,255,0.32)' }} />
      {glow ? <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.35)' }} /> : null}
    </View>
  );
}

function PieceView({ shape, size, gap, color }: { shape: Shape; size: number; gap: number; color: string }) {
  const { rows, cols } = shapeSize(shape);
  const on = new Set(shape.map(([r, c]) => `${r}-${c}`));
  return (
    <View style={{ width: cols * size + (cols - 1) * gap, gap }}>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap }}>
          {Array.from({ length: cols }, (_, c) => (on.has(`${r}-${c}`) ? <Block key={c} size={size} color={color} /> : <View key={c} style={{ width: size, height: size }} />))}
        </View>
      ))}
    </View>
  );
}
