import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Header, ICON_NAMES, Icon, useTheme } from '@/components';
import { Badge, type BadgeVariant, Button, type ButtonSize, type ButtonVariant, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Checkbox, Dialog, Illustration, ILLUSTRATION_NAMES, Input, Label, Progress, RadioGroup, Separator, Sheet, Skeleton, Switch, Tabs, Textarea, ToastProvider, useToast } from '@/components/ui';
import { Medallion } from '@/features/gamification/Medallion';

/**
 * Bileşen Galerisi (developer mode only): every ui-v2 component and variant, in the light and the dark
 * theme one under the other. Strings here are developer-facing samples, not user copy.
 */
export default function GalleryScreen() {
  const t = useTheme();
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.tokens.background }}>
      <ToastProvider>
        <View style={{ paddingHorizontal: t.space.lg }}>
          <Header title="Bileşen Galerisi" />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: t.space.xxl }}>
          <Section title="Bileşenler" />
        </ScrollView>
      </ToastProvider>
    </SafeAreaView>
  );
}

const VARIANTS: ButtonVariant[] = ['default', 'primary', 'secondary', 'outline', 'ghost', 'destructive'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];
const BADGES: BadgeVariant[] = ['default', 'secondary', 'outline', 'destructive', 'success'];

function Section({ title }: { title: string }) {
  const t = useTheme();
  const toast = useToast();
  const [sw, setSw] = useState(true);
  const [cb, setCb] = useState(false);
  const [radio, setRadio] = useState<'a' | 'b' | null>('a');
  const [tab, setTab] = useState<'one' | 'two' | 'three'>('one');
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);
  return (
    <View style={{ backgroundColor: t.tokens.background, padding: t.space.lg, gap: t.space.xl }}>
      <AppText style={{ ...t.type.title, color: t.tokens.foreground }}>{title}</AppText>

      <Group name="Madalyon · kazanılmış / kilitli">
        <View style={{ flexDirection: 'row', gap: t.space.lg }}>
          <Medallion icon="flame" earned progress={1} ribbon="7" />
          <Medallion icon="dumbbell" earned={false} progress={0.4} ribbon="30" />
          <Medallion icon="book" earned={false} progress={0} />
        </View>
      </Group>

      <Group name="İllüstrasyon · yer tutucular">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.md }}>
          {ILLUSTRATION_NAMES.map((n) => (
            <View key={n} style={{ alignItems: 'center', gap: t.space.xs, width: 104 }}>
              <Illustration name={n} size={96} />
              <AppText variant="caption" muted center>
                {n}
              </AppText>
            </View>
          ))}
        </View>
      </Group>

      <Group name="Button · varyantlar">
        {VARIANTS.map((v) => (
          <Button key={v} label={v} variant={v} icon="play" onPress={() => undefined} />
        ))}
      </Group>
      <Group name="Button · boyutlar ve durumlar">
        {SIZES.map((s) => (
          <Button key={s} label={`Boyut ${s}`} size={s} onPress={() => undefined} />
        ))}
        <Button label="Yükleniyor" loading onPress={() => undefined} />
        <Button label="Devre dışı" disabled onPress={() => undefined} />
        <Button label="Sağda ikon" icon="chevron" iconRight variant="outline" onPress={() => undefined} />
      </Group>

      <Group name="Card">
        <Card>
          <CardHeader>
            <CardTitle>Kart başlığı</CardTitle>
            <CardDescription>Kısa bir açıklama metni.</CardDescription>
          </CardHeader>
          <CardContent>
            <AppText style={{ ...t.type.body, color: t.tokens.cardForeground }}>Kartın içeriği burada.</AppText>
          </CardContent>
          <CardFooter>
            <Button label="İptal" variant="outline" size="sm" onPress={() => undefined} />
            <Button label="Kaydet" size="sm" onPress={() => undefined} />
          </CardFooter>
        </Card>
        <Card elevated onPress={() => undefined} accessibilityLabel="Dokunulabilir kart">
          <CardContent style={{ paddingVertical: t.space.lg }}>
            <AppText style={{ ...t.type.body, color: t.tokens.cardForeground }}>Gölgeli, dokunulabilir kart</AppText>
          </CardContent>
        </Card>
      </Group>

      <Group name="Input · Textarea">
        <Input label="Ad" placeholder="Adını yaz" hint="İsteğe bağlı" />
        <Input label="Hatalı alan" placeholder="…" error="Bu alan boş bırakılamaz" />
        <Textarea label="Not" placeholder="Kısa bir not" />
      </Group>

      <Group name="Switch · Checkbox · RadioGroup">
        <Switch label="Hatırlatmalar" description="Günlük bildirim" value={sw} onChange={setSw} />
        <Checkbox label="Koşulları okudum" checked={cb} onChange={setCb} />
        <RadioGroup
          label="Seçim"
          value={radio}
          onChange={setRadio}
          options={[
            { value: 'a', label: 'Birinci seçenek', description: 'Açıklama' },
            { value: 'b', label: 'İkinci seçenek' },
          ]}
        />
      </Group>

      <Group name="Tabs">
        <Tabs
          label="Sekmeler"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'one', label: 'Bir' },
            { value: 'two', label: 'İki' },
            { value: 'three', label: 'Üç' },
          ]}
        />
        <AppText style={{ ...t.type.small, color: t.tokens.mutedForeground }}>Seçili: {tab}</AppText>
      </Group>

      <Group name="Progress · Badge · Separator · Skeleton">
        <Progress value={0.35} label="İlerleme" />
        <Progress value={0.7} tone="accent" label="İlerleme" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
          {BADGES.map((b) => (
            <Badge key={b} label={b} variant={b} />
          ))}
        </View>
        <Separator />
        <Skeleton height={20} />
        <Skeleton width="60%" />
      </Group>

      <Group name="Sheet · Dialog · Toast">
        <Button label="Sheet aç" variant="outline" onPress={() => setSheet(true)} />
        <Button label="Dialog aç" variant="outline" onPress={() => setDialog(true)} />
        <Button label="Toast göster" variant="outline" onPress={() => toast({ title: 'Kaydedildi', description: 'Ayarların güncellendi.', tone: 'success' })} />
      </Group>

      <Group name="Icon (Lucide)">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.md }}>
          {ICON_NAMES.map((n) => (
            <View key={n} style={{ width: 64, alignItems: 'center', gap: t.space.xs }}>
              <Icon name={n} />
              <AppText style={{ ...t.type.caption, color: t.tokens.mutedForeground }} numberOfLines={1}>
                {n}
              </AppText>
            </View>
          ))}
        </View>
      </Group>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Alt sayfa" description="Aşağı sürükleyerek ya da arka plana dokunarak kapat.">
        <Button label="Kapat" onPress={() => setSheet(false)} fullWidth />
      </Sheet>
      <Dialog
        visible={dialog}
        onClose={() => setDialog(false)}
        title="Emin misin?"
        description="Bu bir örnek diyalog."
        actions={[
          { label: 'Onayla', variant: 'default', onPress: () => setDialog(false) },
          { label: 'Vazgeç', onPress: () => setDialog(false) },
        ]}
      />
    </View>
  );
}

function Group({ name, children }: { name: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.md }}>
      <Label>{name.toUpperCase()}</Label>
      {children}
    </View>
  );
}
