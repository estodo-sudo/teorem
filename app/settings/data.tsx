import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, RowGroup, Screen, SwitchRow, useTheme } from '@/components';
import { restoreApp, wipeApp } from '@/features/data/appData';
import type { AppSnapshot } from '@/features/data/exportImport';
import { exportToShareSheet, pickImportFile } from '@/features/data/fileTransfer';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';

type DialogState = null | { kind: 'importConfirm'; data: AppSnapshot } | { kind: 'wipe1' } | { kind: 'wipe2' } | { kind: 'info'; text: string };

export default function DataSettings() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const notes = useHistoryStore((s) => s.notes);
  const unloadNotes = useMemo(() => notes.filter((n) => n.kind === 'unload'), [notes]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const r = await exportToShareSheet();
      if (r === 'unavailable') setDialog({ kind: 'info', text: tr('settings.data.shareUnavailable') });
    } catch {
      setDialog({ kind: 'info', text: tr('settings.data.exportError') });
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    try {
      const r = await pickImportFile();
      if (!r) return;
      if (!r.ok) setDialog({ kind: 'info', text: tr(`settings.data.importErrors.${r.error}`) });
      else setDialog({ kind: 'importConfirm', data: r.data });
    } catch {
      setDialog({ kind: 'info', text: tr('settings.data.importErrors.invalidJson') });
    }
  };

  return (
    <Screen>
      <Header title={tr('settings.data.title')} />
      <Card style={{ gap: 6 }}>
        <AppText weight="700">{tr('settings.data.privacyTitle')}</AppText>
        <AppText muted>{tr('settings.data.privacyBody')}</AppText>
      </Card>
      <Card style={{ gap: 10 }}>
        <AppText variant="h3">{tr('settings.data.backup')}</AppText>
        <AppText variant="small" muted>
          {tr('settings.data.backupHint')}
        </AppText>
        <Button label={tr('settings.data.export')} icon="shield" variant="primary" loading={busy} onPress={() => void doExport()} />
        <Button label={tr('settings.data.import')} variant="secondary" onPress={() => void doImport()} />
      </Card>
      <RowGroup>
        <SwitchRow label={tr('settings.data.saveUnload')} description={tr('settings.data.saveUnloadHint')} value={settings.saveUnloadNotes} onChange={(v) => update({ saveUnloadNotes: v })} />
        {unloadNotes.length ? (
          <Button
            style={{ marginVertical: t.space.sm }}
            label={tr('settings.data.deleteUnload', { count: unloadNotes.length })}
            variant="ghost"
            onPress={() => unloadNotes.forEach((n) => useHistoryStore.getState().deleteNote(n.id))}
          />
        ) : null}
      </RowGroup>
      <Card style={{ gap: 10, borderColor: t.colors.danger }}>
        <AppText variant="h3" color={t.colors.danger}>
          {tr('settings.data.dangerTitle')}
        </AppText>
        <AppText variant="small" muted>
          {tr('settings.data.wipeHint')}
        </AppText>
        <Button label={tr('settings.data.wipe')} variant="danger" onPress={() => setDialog({ kind: 'wipe1' })} />
      </Card>

      <Dialog
        visible={dialog?.kind === 'importConfirm'}
        title={tr('settings.data.importTitle')}
        message={tr('settings.data.importBody')}
        onDismiss={() => setDialog(null)}
        actions={[
          {
            label: tr('settings.data.importConfirm'),
            variant: 'accent',
            onPress: () => {
              if (dialog?.kind === 'importConfirm') restoreApp(dialog.data);
              setDialog({ kind: 'info', text: tr('settings.data.importDone') });
            },
          },
          { label: tr('common.cancel'), onPress: () => setDialog(null) },
        ]}
      />
      <Dialog
        visible={dialog?.kind === 'wipe1'}
        title={tr('settings.data.wipeTitle1')}
        message={tr('settings.data.wipeBody1')}
        onDismiss={() => setDialog(null)}
        actions={[
          { label: tr('common.continue'), variant: 'danger', onPress: () => setDialog({ kind: 'wipe2' }) },
          { label: tr('common.cancel'), onPress: () => setDialog(null) },
        ]}
      />
      <Dialog
        visible={dialog?.kind === 'wipe2'}
        title={tr('settings.data.wipeTitle2')}
        message={tr('settings.data.wipeBody2')}
        onDismiss={() => setDialog(null)}
        actions={[
          {
            label: tr('settings.data.wipeConfirm'),
            variant: 'danger',
            onPress: () => {
              setDialog(null);
              // The first-run gate in the root layout takes the user back to consent.
              wipeApp();
            },
          },
          { label: tr('common.cancel'), onPress: () => setDialog(null) },
        ]}
      />
      <Dialog
        visible={dialog?.kind === 'info'}
        title={tr('settings.data.title')}
        message={dialog?.kind === 'info' ? dialog.text : ''}
        onDismiss={() => setDialog(null)}
        actions={[{ label: tr('common.done'), variant: 'primary', onPress: () => setDialog(null) }]}
      />
    </Screen>
  );
}
