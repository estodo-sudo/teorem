import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { useTheme } from './useTheme';

interface Props {
  title?: string;
  onBack?: () => void;
  /** Show a close (X) icon instead of back arrow. */
  close?: boolean;
  right?: ReactNode;
}

export function Header({ title, onBack, close, right }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={styles.row}>
      <Pressable
        onPress={back}
        accessibilityRole="button"
        accessibilityLabel={close ? tr('common.close') : tr('common.back')}
        hitSlop={8}
        style={[styles.btn, { width: t.touch, height: t.touch }]}
      >
        <Icon name={close ? 'close' : 'back'} color={t.colors.text} size={26} />
      </Pressable>
      <View style={styles.title}>
        {title ? (
          <AppText variant="h3" numberOfLines={1} center accessibilityRole="header">
            {title}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.btn, { minWidth: t.touch, height: t.touch }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -8 },
  btn: { alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
});
