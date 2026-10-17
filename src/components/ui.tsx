import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({ children, scroll = true, style }: PropsWithChildren<{ scroll?: boolean; style?: StyleProp<ViewStyle> }>) {
  const content = scroll ? (
    <ScrollView style={styles.flex} contentContainerStyle={[styles.screenContent, style]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : <View style={[styles.screenContent, styles.flex, style]}>{children}</View>;
  return <SafeAreaView style={styles.safe} edges={['top']}>{content}</SafeAreaView>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable hitSlop={10} onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function PrimaryButton({ label, onPress, icon = 'arrow-forward', disabled = false }: { label: string; onPress: () => void; icon?: IconName; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={styles.primaryLabel}>{label}</Text>
      <View style={styles.buttonIcon}><Ionicons name={icon} size={20} color={colors.white} /></View>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, accessibilityLabel }: { icon: IconName; onPress: () => void; accessibilityLabel: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={21} color={colors.text} />
    </Pressable>
  );
}

export function Metric({ value, label, suffix }: { value: string | number; label: string; suffix?: string }) {
  return (
    <View>
      <Text style={styles.metricValue}>{value}<Text style={styles.metricSuffix}>{suffix}</Text></Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function ListRow({ icon, title, detail, trailing }: { icon: IconName; title: string; detail?: string; trailing?: ReactNode }) {
  return (
    <View style={styles.listRow}>
      <View style={styles.listIcon}><Ionicons name={icon} size={19} color={colors.accent} /></View>
      <View style={styles.listCopy}>
        <Text style={styles.listTitle}>{title}</Text>
        {detail ? <Text style={styles.listDetail}>{detail}</Text> : null}
      </View>
      {trailing ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  flex: { flex: 1 },
  screenContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 130 },
  eyebrow: { color: colors.accent, fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  sectionHeader: { marginTop: spacing.xl, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  sectionAction: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  primaryButton: { height: 64, borderRadius: 19, backgroundColor: colors.accent, paddingLeft: 22, paddingRight: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryLabel: { color: colors.white, fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  buttonIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  iconButton: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.35 },
  metricValue: { fontFamily: 'SpaceMono', color: colors.text, fontSize: 24, letterSpacing: -1.2 },
  metricSuffix: { color: colors.textMuted, fontSize: 12, letterSpacing: 0 },
  metricLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  listRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  listIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentDim, marginRight: 13 },
  listCopy: { flex: 1 },
  listTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  listDetail: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
});
