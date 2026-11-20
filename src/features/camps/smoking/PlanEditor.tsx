import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, ChoiceCard, useTheme } from '@/components';
import { useCampStore } from '@/stores/campStore';

import { CAMP_PLANS } from './content';
import type { TriggerId } from './types';

/** Inline plan editor: "if" prefilled (editable), "then" from templates or own words. */
export function PlanEditor({ trigger, onDone, saveLabel }: { trigger: TriggerId; onDone: (saved: boolean) => void; saveLabel?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const tpl = CAMP_PLANS.templates[trigger];
  const [ifText, setIfText] = useState(tpl.if);
  const [pick, setPick] = useState<number | 'custom'>(0);
  const [own, setOwn] = useState('');
  const thenText = pick === 'custom' ? own.trim() : tpl.then[pick]!;
  const field = { minHeight: 48, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, paddingHorizontal: t.space.md, color: t.colors.text, fontSize: t.type.body.fontSize } as const;
  return (
    <View style={{ gap: t.space.sm }}>
      <AppText variant="small" weight="800" color={t.colors.accent}>
        {tr('camp.plan.if')}
      </AppText>
      <TextInput value={ifText} onChangeText={setIfText} maxLength={80} accessibilityLabel={tr('camp.plan.if')} style={field} />
      <AppText variant="small" weight="800" color={t.colors.accent}>
        {tr('camp.plan.then')}
      </AppText>
      {tpl.then.map((th, i) => (
        <ChoiceCard key={th} label={th} selected={pick === i} onPress={() => setPick(i)} />
      ))}
      <ChoiceCard label={tr('camp.onb.plans.own')} selected={pick === 'custom'} onPress={() => setPick('custom')} />
      {pick === 'custom' ? (
        <TextInput value={own} onChangeText={setOwn} maxLength={120} placeholder={tr('camp.onb.plans.ownPlaceholder')} placeholderTextColor={t.colors.textMuted} accessibilityLabel={tr('camp.onb.plans.ownPlaceholder')} style={field} />
      ) : null}
      <AppText variant="tiny" muted>
        {tr('camp.triggers.acceptNote')}
      </AppText>
      <View style={{ flexDirection: 'row', gap: t.space.sm }}>
        <Button
          label={saveLabel ?? tr('camp.triggers.savePlan')}
          variant="primary"
          disabled={!ifText.trim() || !thenText}
          style={{ flex: 1 }}
          onPress={() => {
            useCampStore.getState().addPlan({ trigger, ifText: ifText.trim(), thenText });
            onDone(true);
          }}
        />
        <Button label={tr('common.cancel')} variant="ghost" onPress={() => onDone(false)} />
      </View>
    </View>
  );
}
