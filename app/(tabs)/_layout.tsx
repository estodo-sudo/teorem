import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName, useTheme } from '@/components';

const TABS: { name: string; key: string; icon: IconName }[] = [
  { name: 'index', key: 'today', icon: 'home' },
  { name: 'training', key: 'training', icon: 'pulse' },
  { name: 'progress', key: 'progress', icon: 'chart' },
  { name: 'discover', key: 'discover', icon: 'compass' },
  { name: 'profile', key: 'profile', icon: 'user' },
];

export default function TabsLayout() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.accent,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          minHeight: 60,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tr(`tabs.${tab.key}`),
            tabBarAccessibilityLabel: tr(`tabs.${tab.key}`),
            tabBarIcon: ({ color, size }) => <Icon name={tab.icon} color={String(color)} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
