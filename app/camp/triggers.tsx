import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Icon, Screen, useTheme } from '@/components';
import type { IconName } from '@/components/Icon';
import { IconTile } from '@/components/ui';
import { PlanEditor } from '@/features/camps/smoking/PlanEditor';
import { CAMP_ONBOARDING as ONB, CAMP_PLANS } from '@/features/camps/smoking/content';
import { triggerCoverage, triggerMapGroups } from '@/features/camps/smoking/engine/panel';
import type { IfThenPlan, TriggerId } from '@/features/camps/smoking/types';
import { InfoToggle } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

/**
 * Trigger map (SPEC_V4 §C.2): the whole catalogue in three groups — with a plan; lived (assessment,
 * diary, SOS) but no plan yet; other situations not met so far — then the user's own situations.
 * Tapping a row opens the plan editor. "Kendi durumunu ekle" is only for situations outside the catalogue.
 */
export default function CampTriggers() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const camp = useCampStore();
  const ev = useCampEventsStore();
  const [editing, setEditing] = useState<TriggerId | null>(null);
  const [addingOwn, setAddingOwn] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const catalog = ONB.triggers.map((x) => x.id);
  const profileTriggers = camp.profile?.triggers ?? [];
  const groups = triggerMapGroups(catalog, profileTriggers, ev.cravings, ev.cigarettes, camp.plans);
  const coverage = triggerCoverage(profileTriggers, ev.cravings, ev.cigarettes, camp.plans);
  const own = camp.plans.filter((p) => p.trigger === 'custom');
  const info = (id: TriggerId) => ONB.triggers.find((o) => o.id === id)!;

  const planLine = (p: IfThenPlan) => (
    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm, paddingLeft: t.space.md, borderRadius: t.radius.md, backgroundColor: t.tokens.muted }}>
      <View style={{ flex: 1, gap: 2, paddingVertical: 10 }}>
        <AppText variant="callout" weight="600">
          {tr('camp.plan.if')} {p.ifText}, {tr('camp.plan.then')} {p.thenText}.
        </AppText>
        {p.usedCount ? (
          <AppText variant="footnote" muted>
            {tr('camp.triggers.used', { count: p.usedCount })}
          </AppText>
        ) : null}
      </View>
      <Pressable onPress={() => setRemoveId(p.id)} accessibilityRole="button" accessibilityLabel={tr('camp.triggers.removePlan')} hitSlop={8} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="trash" color={t.tokens.mutedForeground} size={18} />
      </Pressable>
    </View>
  );

  const row = (id: TriggerId, kind: 'planned' | 'lived' | 'other') => {
    const x = info(id);
    const n = groups.counts.get(id) ?? 0;
    const plans = camp.plans.filter((p) => p.trigger === id);
    const open = editing === id;
    const sub = n ? tr('camp.triggers.count', { count: n }) : profileTriggers.includes(id) ? tr('camp.triggers.fromAssessment') : null;
    return (
      <Card key={id} style={{ gap: t.space.sm, padding: kind === 'other' ? t.space.md : t.space.lg }}>
        <Pressable onPress={() => setEditing(open ? null : id)} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${x.label}${sub ? `, ${sub}` : ''}, ${tr('camp.triggers.addPlan')}`} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 48 }}>
          {kind === 'other' ? <Icon name={x.icon as IconName} size={20} color={t.tokens.mutedForeground} /> : <IconTile icon={x.icon as IconName} tone="smokefree" />}
          <View style={{ flex: 1, gap: 1 }}>
            <AppText variant={kind === 'other' ? 'callout' : 'bodyStrong'}>{x.label}</AppText>
            {sub ? (
              <AppText variant="footnote" muted>
                {sub}
              </AppText>
            ) : null}
          </View>
          {kind === 'other' ? (
            <AppText variant="footnote" weight="600" color={t.tokens.primary}>
              {tr('camp.triggers.addPlanShort')}
            </AppText>
          ) : kind === 'lived' ? (
            <View style={{ paddingHorizontal: t.space.sm, paddingVertical: 3, borderRadius: t.radius.pill, backgroundColor: t.tokens.warningSoft }}>
              <AppText variant="caption" weight="700">
                {tr('camp.triggers.noPlan')}
              </AppText>
            </View>
          ) : (
            <Icon name={open ? 'chevronUp' : 'chevronDown'} size="sm" color={t.tokens.subtle} />
          )}
        </Pressable>
        {plans.map(planLine)}
        {open ? <PlanEditor trigger={id} onDone={() => setEditing(null)} /> : null}
      </Card>
    );
  };

  const section = (title: string, ids: TriggerId[], kind: 'planned' | 'lived' | 'other') =>
    ids.length ? (
      <View style={{ gap: t.space.sm }}>
        <AppText variant="title3" accessibilityRole="header">
          {title}
        </AppText>
        {ids.map((id) => row(id, kind))}
      </View>
    ) : null;

  return (
    <Screen>
      <Header title={tr('camp.triggers.title')} onBack={() => goBack('/camp')} />
      <AppText muted>{tr('camp.triggers.intro')}</AppText>
      <InfoToggle title={tr('camp.plan.plansInfo')} text={CAMP_PLANS.info} />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, backgroundColor: t.tone.smokefree.soft, borderColor: t.tone.smokefree.soft }}>
        <IconTile icon={coverage.total && coverage.done === coverage.total ? 'success' : 'puzzle'} tone="smokefree" size="lg" round />
        <AppText variant="bodyStrong" style={{ flex: 1 }}>
          {coverage.total ? tr('camp.triggers.coverage2', { done: coverage.done, total: coverage.total }) : tr('camp.triggers.coverageEmpty')}
        </AppText>
      </Card>

      {section(tr('camp.triggers.groupPlanned'), groups.planned, 'planned')}
      {section(tr('camp.triggers.groupLived'), groups.livedNoPlan, 'lived')}
      {section(tr('camp.triggers.groupOther'), groups.other, 'other')}

      <View style={{ gap: t.space.sm }}>
        {own.length ? (
          <AppText variant="title3" accessibilityRole="header">
            {tr('camp.triggers.groupOwn')}
          </AppText>
        ) : null}
        {own.map(planLine)}
        {addingOwn ? <OwnPlanEditor onDone={() => setAddingOwn(false)} /> : <Button label={tr('camp.triggers.addOwn')} icon="plus" variant="ghost" onPress={() => setAddingOwn(true)} />}
      </View>

      <Dialog
        visible={removeId !== null}
        title={tr('camp.triggers.removeTitle')}
        onDismiss={() => setRemoveId(null)}
        actions={[
          {
            label: tr('camp.triggers.removeConfirm'),
            variant: 'danger',
            onPress: () => {
              if (removeId) useCampStore.getState().removePlan(removeId);
              setRemoveId(null);
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setRemoveId(null) },
        ]}
      />
    </Screen>
  );
}

/** A situation outside the catalogue: the user writes the situation ("eğer …") and what they will do. */
function OwnPlanEditor({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [ifText, setIfText] = useState('');
  const [thenText, setThenText] = useState('');
  const field = { minHeight: 48, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.tokens.border, backgroundColor: t.tokens.card, paddingHorizontal: t.space.md, color: t.tokens.foreground, fontSize: t.type.body.fontSize } as const;
  return (
    <Card style={{ gap: t.space.sm }}>
      <AppText variant="callout" weight="700">
        {tr('camp.plan.if')}
      </AppText>
      <TextInput maxFontSizeMultiplier={1.3} value={ifText} onChangeText={setIfText} maxLength={80} placeholder={tr('camp.triggers.ownIfPlaceholder')} placeholderTextColor={t.tokens.subtle} accessibilityLabel={tr('camp.plan.if')} style={field} />
      <AppText variant="callout" weight="700">
        {tr('camp.plan.then')}
      </AppText>
      <TextInput maxFontSizeMultiplier={1.3} value={thenText} onChangeText={setThenText} maxLength={120} placeholder={tr('camp.onb.plans.ownPlaceholder')} placeholderTextColor={t.tokens.subtle} accessibilityLabel={tr('camp.plan.then')} style={field} />
      <View style={{ flexDirection: 'row', gap: t.space.sm }}>
        <Button
          label={tr('camp.triggers.savePlan')}
          variant="primary"
          disabled={!ifText.trim() || !thenText.trim()}
          style={{ flex: 1 }}
          onPress={() => {
            useCampStore.getState().addPlan({ trigger: 'custom', ifText: ifText.trim(), thenText: thenText.trim() });
            onDone();
          }}
        />
        <Button label={tr('common.cancel')} variant="ghost" onPress={onDone} />
      </View>
    </Card>
  );
}
