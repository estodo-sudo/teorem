import { useCallback, useRef, useState, type ReactElement } from 'react';
import { FlatList, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { AppText, useTheme } from '@/components';
import { PREVIEW_SPEED, useAutoScroll, usePremiumPreview } from '@/components/PremiumLock';

/** Scroll offsets kept for the session, so a strip is where you left it when you come back (§6). */
const offsets = new Map<string, number>();

/**
 * Horizontal strip (SPEC_KESFET_V2 §6): 20 px edges, 12 px gaps, snapping to one card (or one column
 * in the two-row grid), no scroll bar, equal card heights, a labelled list for screen readers.
 */
export function HorizontalSection<T>({ id, title, hint, right, items, itemWidth, rows = 1, listLabel, keyOf, render }: {
  id: string;
  title: string;
  hint?: string;
  right?: string;
  items: T[];
  itemWidth: number;
  /** 2 → a two-row grid that scrolls column by column. */
  rows?: 1 | 2;
  listLabel: string;
  keyOf: (item: T) => string;
  render: (item: T) => ReactElement;
}) {
  const t = useTheme();
  const gap = t.space.md;
  const columns: T[][] = [];
  for (let i = 0; i < items.length; i += rows) columns.push(items.slice(i, i + rows));
  const [startAt] = useState(() => offsets.get(id) ?? 0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!locked) offsets.set(id, e.nativeEvent.contentOffset.x);
  };
  // Locked premium preview (2026-11-26): the strip drifts left on its own, then glides back.
  const locked = usePremiumPreview();
  const list = useRef<FlatList<T[]>>(null);
  const [width, setWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const scrollTo = useCallback((x: number, animated: boolean) => list.current?.scrollToOffset({ offset: x, animated }), []);
  useAutoScroll(locked, Math.max(0, contentWidth - width), PREVIEW_SPEED.along, scrollTo);

  return (
    <View style={{ gap: t.space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: t.space.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title2" accessibilityRole="header">
            {title}
          </AppText>
          {hint ? (
            <AppText variant="footnote" muted>
              {hint}
            </AppText>
          ) : null}
        </View>
        {right ? (
          <AppText variant="footnote" muted tabular>
            {right}
          </AppText>
        ) : null}
      </View>
      <FlatList
        ref={list}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentWidth(w)}
        scrollEnabled={!locked}
        horizontal
        data={columns}
        keyExtractor={(col) => col.map(keyOf).join('|')}
        renderItem={({ item: col }) => (
          <View style={{ width: itemWidth, gap }}>
            {col.map((it) => (
              <View key={keyOf(it)} style={{ flex: rows === 1 ? 1 : undefined }}>
                {render(it)}
              </View>
            ))}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ width: gap }} />}
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth + gap}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: itemWidth + gap, offset: (itemWidth + gap) * index, index })}
        // Strips are short (≤ 20 columns): the first cards render at once, the rest fill in afterwards in
        // small batches and then stay mounted. Unmounting and remounting cards mid-scroll froze the strip
        // for up to ~0.7 s on a 6× slowed CPU.
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={21}
        contentOffset={{ x: startAt, y: 0 }}
        onScroll={onScroll}
        scrollEventThrottle={64}
        style={{ marginHorizontal: -t.space.gutter }}
        contentContainerStyle={{ paddingHorizontal: t.space.gutter, alignItems: 'stretch' }}
        accessibilityRole="list"
        accessibilityLabel={listLabel}
      />
    </View>
  );
}
