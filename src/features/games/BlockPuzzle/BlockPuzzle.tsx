import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ComponentRef } from 'react';
import { PanResponder, Pressable, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';
import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, useTheme } from '@/components';
import { fmtClock } from '@/features/breath/patterns';
import { useSettingsStore } from '@/stores/settingsStore';

import { canPlace, cellsOf, newGame, play, SIZE, shapeSize, type GameState, type Shape } from './engine';

export const PUZZLE_SECONDS = 180;
const GAP = 3;
const LIFT = 70;

interface Frame {
  x: number;
  y: number;
}

/**
 * Blok Bulmaca (SPEC_V4 §C.5). Drag a piece onto the 8×8 board — the cells it would take light up
 * before it is let go — or tap a piece and then a cell. Full rows and columns fade out. A thin ring
 * counts 3 minutes; when it runs out the game goes on and only a note appears (`onTimeUp` lets the
 * parent bring its "Bitir" button forward). With no move left half the board clears; there is no
 * "you lost" screen. The score sits small in the corner; no records, badges or ads.
 */
export function BlockPuzzle({ color, onPlayed, onTimeUp }: { color?: string; onPlayed?: () => void; onTimeUp?: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const fill = color ?? t.tone.smokefree.fg;
  const boardW = Math.min(width - 40, 340);
  const cell = Math.floor((boardW - GAP * (SIZE - 1)) / SIZE);
  const step = cell + GAP;
  const mini = Math.floor(cell * 0.55);

  const [game, setGame] = useState<GameState>(() => newGame());
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ slot: number; x: number; y: number; x0: number; y0: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);
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

  const buzz = (kind: 'place' | 'clear') => {
    if (strength === 0) return;
    if (kind === 'clear') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const tryPlay = (slot: number, r: number, c: number) => {
    const res = play(game, slot, r, c);
    if (!res) return false;
    setGame(res.state);
    setSelected(null);
    onPlayed?.();
    buzz(res.lines ? 'clear' : 'place');
    setNote(res.relieved ? tr('puzzle.relief') : null);
    return true;
  };

  const measure = () => {
    boardNode?.measureInWindow((bx: number, by: number) => rootNode?.measureInWindow((rx: number, ry: number) => setFrames({ board: { x: bx, y: by }, root: { x: rx, y: ry } })));
  };

  // Where a dragged piece would land: its top-left cell, from the lifted ghost position.
  const target = (() => {
    if (!drag || !frames) return null;
    const shape = game.pieces[drag.slot]?.shape;
    if (!shape) return null;
    const size = shapeSize(shape);
    const left = drag.x - (size.cols * step) / 2 - frames.board.x;
    const top = drag.y - LIFT - (size.rows * step) / 2 - frames.board.y;
    const r = Math.round(top / step);
    const c = Math.round(left / step);
    return { r, c, ok: canPlace(game.board, shape, r, c), shape };
  })();
  const preview = new Set(target?.ok ? cellsOf(target.shape, target.r, target.c) : []);

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

  return (
    <View ref={setRootNode} style={{ gap: t.space.md, alignItems: 'center' }} onLayout={measure}>
      <View style={{ width: boardW, flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
        <Svg width={ring} height={ring}>
          <Circle cx={ring / 2} cy={ring / 2} r={rr} stroke={t.tokens.border} strokeWidth={3} fill="none" />
          <Circle cx={ring / 2} cy={ring / 2} r={rr} stroke={fill} strokeWidth={3} fill="none" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * Math.max(0, 1 - elapsed / PUZZLE_SECONDS)} strokeLinecap="round" transform={`rotate(-90 ${ring / 2} ${ring / 2})`} />
        </Svg>
        <AppText variant="footnote" muted tabular style={{ flex: 1 }} accessibilityLabel={tr('puzzle.timeA11y', { time: fmtClock(Math.max(0, PUZZLE_SECONDS - elapsed) * 1000) })}>
          {timeUp ? tr('puzzle.timeUpShort') : fmtClock(Math.max(0, PUZZLE_SECONDS - elapsed) * 1000)}
        </AppText>
        <AppText variant="footnote" muted tabular>
          {tr('puzzle.score', { n: game.score })}
        </AppText>
      </View>

      <View ref={setBoardNode} onLayout={measure} style={{ width: boardW, height: boardW, flexDirection: 'row', flexWrap: 'wrap', gap: GAP }} accessibilityLabel={tr('puzzle.boardA11y')}>
        {game.board.map((filled, i) => {
          const r = Math.floor(i / SIZE);
          const c = i % SIZE;
          const lit = preview.has(i);
          return (
            <Pressable
              key={i}
              onPress={selected !== null ? () => tryPlay(selected, r, c) : undefined}
              accessibilityRole={selected !== null ? 'button' : undefined}
              accessibilityLabel={tr('puzzle.cellA11y', { r: r + 1, c: c + 1, state: filled ? tr('puzzle.full') : tr('puzzle.empty') })}
              style={{ width: cell, height: cell, borderRadius: 4, backgroundColor: lit ? `${fill}66` : t.dark ? t.veil.soft : t.tokens.muted, overflow: 'hidden' }}
            >
              {filled ? <Animated.View exiting={reduce ? undefined : FadeOut.duration(280)} style={{ flex: 1, backgroundColor: fill, borderRadius: 4 }} /> : null}
            </Pressable>
          );
        })}
      </View>

      {note || timeUp ? (
        <AppText variant="footnote" muted center accessibilityLiveRegion="polite">
          {note ?? tr('puzzle.timeUp')}
        </AppText>
      ) : null}

      <View style={{ width: boardW, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', minHeight: mini * 5 + 24 }}>
        {game.pieces.map((p, slot) => (
          <View key={p ? p.id : `empty-${slot}`} style={{ width: boardW / 3 - 8, height: mini * 5 + 16, alignItems: 'center', justifyContent: 'center' }}>
            {p ? (
              <View
                {...panFor(slot).panHandlers}
                accessible
                accessibilityRole="button"
                accessibilityLabel={tr('puzzle.pieceA11y', { n: p.shape.length })}
                accessibilityState={{ selected: selected === slot }}
                onAccessibilityTap={() => setSelected((s) => (s === slot ? null : slot))}
                style={{ padding: 6, borderRadius: t.radius.md, borderWidth: 2, borderColor: selected === slot ? fill : 'transparent', opacity: drag?.slot === slot ? 0.25 : 1 }}
              >
                <PieceView shape={p.shape} size={mini} gap={2} color={fill} />
              </View>
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
            opacity: 0.85,
          }}
        >
          <PieceView shape={game.pieces[drag.slot]!.shape} size={cell} gap={GAP} color={fill} />
        </View>
      ) : null}
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
          {Array.from({ length: cols }, (_, c) => (
            <View key={c} style={{ width: size, height: size, borderRadius: 3, backgroundColor: on.has(`${r}-${c}`) ? color : 'transparent' }} />
          ))}
        </View>
      ))}
    </View>
  );
}
