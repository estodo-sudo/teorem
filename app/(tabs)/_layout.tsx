import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName, useTheme } from '@/components';
import { requiredFirstRunRoute } from '@/features/app/gate';
import { useProfileStore } from '@/stores/profileStore';

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
  const gate = useProfileStore((s) => requiredFirstRunRoute(s.profile));
  // Never render the main app before first-run setup is complete.
  if (gate) return <Redirect href={gate} />;
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
