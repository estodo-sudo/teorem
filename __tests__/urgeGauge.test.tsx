import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import '@/i18n';
import { UrgeGauge } from '@/components/ui/UrgeGauge';
import { clampUrge, gaugeGeometry, needleDegrees, onArc, segmentAngles, stepUrge, urgeWord, valueFromPoint } from '@/components/ui/urgeGaugeLogic';
import { panelContext, recentSlip, triggerCoverage } from '@/features/camps/smoking/engine/panel';

jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  const id = (x: unknown) => x;
  return { __esModule: true, default: { View }, useSharedValue: (v: unknown) => ({ value: v }), useAnimatedStyle: () => ({}), useReducedMotion: () => true, withSpring: id, withTiming: id, withSequence: (...xs: unknown[]) => xs[xs.length - 1] };
});
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(() => Promise.resolve()), impactAsync: jest.fn(() => Promise.resolve()), ImpactFeedbackStyle: { Light: 'light' } }));

const g = gaugeGeometry();

describe('UrgeGauge geometry (SPEC_V4 §C.1)', () => {
  it('10 segments fill the half circle from left (π) to right (0) with gaps', () => {
    const [a0] = segmentAngles(0, g);
    const [, b9] = segmentAngles(9, g);
    expect(a0).toBeCloseTo(Math.PI);
    expect(b9).toBeCloseTo(0);
    // Visible gap between rounded ends ≈ 4 px.
    expect(g.gapAngle * g.r - 14).toBeCloseTo(4);
  });

  it('a touch maps to 1–10 by its angle; below the pivot it snaps to the nearer end', () => {
    expect(valueFromPoint(g.cx - g.r, g.cy - 1, g)).toBe(1);
    expect(valueFromPoint(g.cx + g.r, g.cy - 1, g)).toBe(10);
    expect(valueFromPoint(g.cx, g.cy - g.r, g)).toBe(6);
    expect(valueFromPoint(g.cx - 50, g.cy + 30, g)).toBe(1);
    expect(valueFromPoint(g.cx + 50, g.cy + 30, g)).toBe(10);
  });

  it('only touches on the arc start a drag', () => {
    expect(onArc(g.cx, g.cy - g.r, g)).toBe(true);
    expect(onArc(g.cx, g.cy - 10, g)).toBe(false);
  });

  it('values stay within 1–10 and the needle rests on the left when empty', () => {
    expect(clampUrge(0)).toBe(1);
    expect(clampUrge(14)).toBe(10);
    expect(stepUrge(null, 1)).toBe(1);
    expect(stepUrge(null, -1)).toBe(1);
    expect(stepUrge(10, 1)).toBe(10);
    expect(stepUrge(1, -1)).toBe(1);
    expect(needleDegrees(null, g)).toBe(180);
    expect(needleDegrees(1, g)).toBeLessThan(180);
    expect(needleDegrees(10, g)).toBeGreaterThan(0);
  });

  it('words: 1–3 light, 4–6 medium, 7–8 strong, 9–10 very strong', () => {
    expect([1, 3, 4, 6, 7, 8, 9, 10].map(urgeWord)).toEqual(['low', 'low', 'mid', 'mid', 'strong', 'strong', 'veryStrong', 'veryStrong']);
  });
});

function Harness({ start = null, compareTo }: { start?: number | null; compareTo?: number }) {
  const [v, setV] = useState<number | null>(start);
  return <UrgeGauge value={v} onChange={setV} label="İsteğin ne kadar güçlü?" compareTo={compareTo} />;
}

describe('UrgeGauge component', () => {
  it('starts with a hint instead of a dash, and a number tap selects the value', async () => {
    await render(<Harness />);
    expect(screen.getByText('Dokun ya da sürükle')).toBeTruthy();
    expect(screen.queryByText('—')).toBeNull();
    await fireEvent.press(screen.getByText('7', { includeHiddenElements: true }));
    expect(screen.getByText('Güçlü')).toBeTruthy();
  });

  it('is adjustable for screen readers: increment / decrement within 1–10', async () => {
    await render(<Harness start={9} />);
    const gauge = screen.getByRole('adjustable');
    expect(gauge.props.accessibilityValue.text).toBe('9, Çok güçlü');
    await fireEvent(gauge, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    await fireEvent(gauge, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('10, Çok güçlü');
    await fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('9, Çok güçlü');
  });

  it('comparison mode shows the change (7 → 4)', async () => {
    await render(<Harness start={4} compareTo={7} />);
    expect(screen.getByText('7 → 4 · 3 puan azaldı')).toBeTruthy();
  });
});

describe('Sigarasız Kamp panel logic (SPEC_V4 §C.6)', () => {
  it('trigger coverage counts lived situations and those with a plan', () => {
    expect(triggerCoverage(['stress', 'coffee_tea'], [{ trigger: 'alcohol' }], [{ trigger: 'stress' }, {}], [{ trigger: 'stress' }, { trigger: 'boredom' }])).toEqual({ done: 1, total: 3 });
    expect(triggerCoverage([], [], [], [])).toEqual({ done: 0, total: 0 });
  });

  it('shows at most one situational card, in priority order', () => {
    const base = { safety: false, quitDayToday: false, daysToQuit: null, slipWithinDay: false, graduation: false, nextHealth: false, reason: false };
    expect(panelContext({ ...base, safety: true, slipWithinDay: true, reason: true })).toBe('safety');
    expect(panelContext({ ...base, daysToQuit: 2, nextHealth: true })).toBe('quitSoon');
    expect(panelContext({ ...base, daysToQuit: 9, reason: true })).toBe('reason');
    expect(panelContext({ ...base, slipWithinDay: true, graduation: true })).toBe('slip');
    expect(panelContext(base)).toBeNull();
  });

  it('a slip counts as recent when it was today or yesterday', () => {
    const now = new Date(2026, 10, 20, 9, 0);
    expect(recentSlip([{ at: new Date(2026, 10, 19, 23, 0).toISOString() }], now)).toBe(true);
    expect(recentSlip([{ at: new Date(2026, 10, 18, 12, 0).toISOString() }], now)).toBe(false);
    expect(recentSlip([], now)).toBe(false);
  });
});
