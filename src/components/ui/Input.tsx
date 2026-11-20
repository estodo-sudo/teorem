import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '../AppText';
import { useTheme } from '../useTheme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
}

/** shadcn/ui Input: bordered field, ring colour on focus, optional label / hint / error. */
export function Input({ label, hint, error, onFocus, onBlur, multiline, ...rest }: InputProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: t.space.xs }}>
      {label ? <AppText style={{ ...t.type.small, fontWeight: '600', color: t.tokens.foreground }}>{label}</AppText> : null}
      <TextInput
        accessibilityLabel={label ?? rest.placeholder}
        accessibilityHint={error ?? hint}
        placeholderTextColor={t.tokens.mutedForeground}
        multiline={multiline}
        onFocus={(e) => (setFocused(true), onFocus?.(e))}
        onBlur={(e) => (setFocused(false), onBlur?.(e))}
        style={{
          minHeight: multiline ? 96 : t.touch,
          paddingHorizontal: t.space.md,
          paddingVertical: t.space.sm,
          borderRadius: t.radius.md,
          borderWidth: focused || error ? t.border.thick : t.border.thin,
          borderColor: error ? t.tokens.destructive : focused ? t.tokens.ring : t.tokens.input,
          backgroundColor: t.tokens.background,
          color: t.tokens.foreground,
          fontSize: t.type.body.fontSize,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        {...rest}
      />
      {error || hint ? <AppText style={{ ...t.type.caption, color: error ? t.tokens.destructive : t.tokens.mutedForeground }}>{error ?? hint}</AppText> : null}
    </View>
  );
}

/** Multi-line Input. */
export function Textarea(props: InputProps) {
  return <Input multiline {...props} />;
}
