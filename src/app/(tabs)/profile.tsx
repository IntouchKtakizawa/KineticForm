import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ListRow, Screen, SectionHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout } from '@/store/workout-store';

export default function ProfileScreen() {
  const { displayName, profile, preferences, history, plans, programs, weightUnit, toggleWeightUnit } = useWorkout();
  return (
    <Screen>
      <View style={styles.profileTop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit your profile" onPress={() => router.push('/about-you' as never)} style={styles.avatar}><Text style={styles.avatarText}>{profile.avatarEmoji || displayName.slice(0, 1).toUpperCase()}</Text></Pressable>
        <View style={styles.profileCopy}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>{displayName} · {history.length} workouts</Text>
        </View>
      </View>

      <View style={styles.privacyCard}>
        <View style={styles.privacyIcon}><Ionicons name="shield-checkmark" size={24} color={colors.success} /></View>
        <View style={styles.privacyCopy}>
          <Text style={styles.privacyTitle}>Private by default</Text>
          <Text style={styles.privacyText}>Workout data stays on this device. Calendar events sync only when you choose Google.</Text>
        </View>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="View your progress" onPress={() => router.push('/progress')} style={styles.winsCard}>
        <View style={styles.winsIcon}><Ionicons name="trophy" size={23} color="#C87500" /></View>
        <View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Your progress</Text><Text style={styles.privacyText}>{history.length} workouts completed · View your wins</Text></View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      <SectionHeader title="Personal profile" />
      <View style={styles.group}>
        <Pressable accessibilityRole="button" accessibilityLabel="Get to know you" onPress={() => router.push('/about-you' as never)}><ListRow icon="person-circle-outline" title="Get to know you" detail="Name, avatar, body details, and personal goals" /></Pressable>
        <ListRow icon="flag-outline" title="Current focus" detail={preferences.goal} />
      </View>

      <SectionHeader title="Workout settings" />
      <View style={styles.group}>
        <Pressable accessibilityRole="button" accessibilityLabel="Training preferences" onPress={() => router.push('/onboarding' as never)}><ListRow icon="options-outline" title="Training preferences" detail="Goal, equipment, days, and session length" /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="View workout programs" onPress={() => router.push('/programs' as never)}><ListRow icon="calendar-outline" title="Workout plan" detail={programs[0]?.name ?? `${plans.length} saved workout${plans.length === 1 ? '' : 's'}`} /></Pressable>
        <ListRow icon="scale-outline" title="Weight unit" detail="Choose kilograms or pounds" trailing={
          <Pressable accessibilityRole="button" accessibilityLabel={`Weight unit: ${weightUnit}. Tap to change.`} onPress={toggleWeightUnit} style={styles.unitToggle}>
            <Text style={styles.unitText}>{weightUnit.toUpperCase()}</Text>
            <Ionicons name="swap-horizontal" size={16} color={colors.white} />
          </Pressable>
        } />
        <ListRow icon="timer-outline" title="Rest timer" detail="Starts when you finish a set" />
      </View>

      <SectionHeader title="Your data" />
      <View style={styles.group}>
        <Pressable accessibilityRole="button" accessibilityLabel="Backup and restore" onPress={() => router.push('/backup' as never)}><ListRow icon="shield-checkmark-outline" title="Backup & restore" detail="Download or safely restore your local data" /></Pressable>
      </View>

      <SectionHeader title="About" />
      <View style={styles.group}>
        <ListRow icon="phone-portrait-outline" title="Works offline" detail="Use it anywhere" />
        <ListRow icon="heart-outline" title="KineticForm" detail="Version 1.3.0" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 27, fontWeight: '900' },
  profileCopy: { flex: 1, marginLeft: 15 },
  title: { color: colors.text, fontSize: 31, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  privacyCard: { marginTop: spacing.lg, minHeight: 92, borderRadius: radius.lg, backgroundColor: colors.successDim, padding: 17, flexDirection: 'row', alignItems: 'center' },
  privacyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  privacyCopy: { flex: 1, marginLeft: 13 },
  privacyTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  privacyText: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  winsCard: { marginTop: 10, minHeight: 82, borderRadius: radius.lg, backgroundColor: colors.warmDim, padding: 14, flexDirection: 'row', alignItems: 'center' },
  winsIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  group: { paddingHorizontal: 17, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  unitToggle: { minWidth: 76, height: 38, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.accent, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  unitText: { color: colors.white, fontSize: 11, fontWeight: '900' },
});
