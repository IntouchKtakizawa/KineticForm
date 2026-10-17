import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Eyebrow, ListRow, Screen, SectionHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout } from '@/store/workout-store';

export default function ProfileScreen() {
  const { displayName, history, weightUnit, toggleWeightUnit } = useWorkout();
  return (
    <Screen>
      <Eyebrow>Personal setup</Eyebrow>
      <View style={styles.profileTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          <View style={styles.status} />
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.level}>Building consistency · {history.length} sessions</Text>
        </View>
        <Pressable style={styles.edit}><Ionicons name="pencil" size={16} color={colors.text} /></Pressable>
      </View>

      <View style={styles.goalCard}>
        <View style={styles.goalRing}><Text style={styles.goalCount}>3<Text style={styles.goalUnit}>/4</Text></Text></View>
        <View style={styles.goalCopy}>
          <Text style={styles.goalLabel}>WEEKLY GOAL</Text>
          <Text style={styles.goalTitle}>One more session.</Text>
          <Text style={styles.goalDetail}>You’re 75% there this week.</Text>
        </View>
      </View>

      <SectionHeader title="Training preferences" />
      <View style={styles.group}>
        <ListRow icon="barbell-outline" title="Workout plan" detail="Upper / Lower · 4 days" />
        <ListRow icon="scale-outline" title="Weight unit" detail="Used across workout logs" trailing={
          <Pressable onPress={toggleWeightUnit} style={styles.unitToggle}>
            <Text style={[styles.unit, weightUnit === 'kg' && styles.activeUnit]}>KG</Text>
            <Text style={[styles.unit, weightUnit === 'lb' && styles.activeUnit]}>LB</Text>
          </Pressable>
        } />
        <ListRow icon="timer-outline" title="Rest timer" detail="Starts after each completed set" />
      </View>

      <SectionHeader title="App" />
      <View style={styles.group}>
        <ListRow icon="phone-portrait-outline" title="Appearance" detail="Dark mode" />
        <ListRow icon="notifications-outline" title="Haptics & alerts" detail="Haptics on · Sound off" />
        <ListRow icon="shield-checkmark-outline" title="Your data" detail="Stored privately on this device" />
      </View>
      <Text style={styles.version}>KINETICFORM · VERSION 0.1.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileTop: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  avatar: { width: 68, height: 68, borderRadius: 22, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontSize: 25, fontWeight: '800' },
  status: { position: 'absolute', right: -2, bottom: -2, width: 17, height: 17, borderRadius: 9, backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.ink },
  profileCopy: { flex: 1, marginLeft: 16 },
  name: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.7 },
  level: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  edit: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  goalCard: { marginTop: spacing.xl, minHeight: 132, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 20, flexDirection: 'row', alignItems: 'center' },
  goalRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 7, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  goalCount: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 19 },
  goalUnit: { color: colors.textMuted, fontSize: 10 },
  goalCopy: { flex: 1, marginLeft: 18 },
  goalLabel: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  goalTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 7 },
  goalDetail: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  group: { paddingHorizontal: 17, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  unitToggle: { flexDirection: 'row', padding: 3, borderRadius: 9, backgroundColor: colors.ink },
  unit: { color: colors.textMuted, fontSize: 9, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 7 },
  activeUnit: { color: colors.ink, backgroundColor: colors.accent },
  version: { color: colors.textMuted, textAlign: 'center', fontSize: 9, letterSpacing: 1.3, marginTop: spacing.xl },
});
