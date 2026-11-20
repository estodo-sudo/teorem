import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Icon, useTheme } from '@/components';

import { PIN_MAX, PIN_MIN, validPin } from './lock';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/** Numeric PIN entry: dots, a 3×4 keypad (64 pt keys) and a confirm button. */
export function PinPad({ title, hint, error, disabled, onSubmit, submitLabel }: { title: string; hint?: string; error?: string | null; disabled?: boolean; onSubmit: (pin: string) => void; submitLabel: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [pin, setPin] = useState('');
  const press = (k: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (k === 'del') setPin((p) => p.slice(0, -1));
    else if (k) setPin((p) => (p.length < PIN_MAX ? p + k : p));
  };
  const submit = () => {
    if (!validPin(pin)) return;
    const p = pin;
    setPin('');
    onSubmit(p);
  };
  return (
    <View style={{ gap: t.space.lg, alignItems: 'center' }}>
      <AppText variant="h2" center accessibilityRole="header">
        {title}
      </AppText>
      {hint ? (
        <AppText muted center>
          {hint}
        </AppText>
      ) : null}
      <View style={{ flexDirection: 'row', gap: t.space.md, minHeight: 20 }} accessible accessibilityLabel={tr('odak.lock.pinEntered', { count: pin.length })}>
        {Array.from({ length: Math.max(PIN_MIN, pin.length) }, (_, i) => (
          <View key={i} style={{ width: 16, height: 16, borderRadius: t.radius.sm, borderWidth: 2, borderColor: t.colors.primary, backgroundColor: i < pin.length ? t.colors.primary : 'transparent' }} />
        ))}
      </View>
      {error ? (
        <AppText variant="small" weight="700" color={t.colors.danger} center accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 3 * 72 + 2 * 12, gap: t.space.md }}>
        {KEYS.map((k, i) =>
          k === '' ? (
            <View key={i} style={{ width: 72, height: 64 }} />
          ) : (
            <Pressable
              key={i}
              onPress={() => press(k)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={k === 'del' ? tr('odak.lock.delete') : k}
              style={({ pressed }) => ({
                width: 72,
                height: 64,
                borderRadius: t.radius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface,
                borderWidth: 1,
                borderColor: t.colors.border,
                opacity: disabled ? 0.5 : 1,
              })}
            >
              {k === 'del' ? <Icon name="back" color={t.colors.text} size={22} /> : <AppText variant="h2">{k}</AppText>}
            </Pressable>
          ),
        )}
      </View>
      <Button label={submitLabel} onPress={submit} disabled={disabled || !validPin(pin)} />
    </View>
  );
}
