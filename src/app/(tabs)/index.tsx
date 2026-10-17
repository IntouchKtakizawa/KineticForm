import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { StyleSheet, Text, View } from 'react-native';

import { DateStrip } from '@/components/date-strip';
import { ExerciseList } from '@/components/exercise-list';
import { PrimaryButton, Screen, SectionHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { workoutPlans } from '@/data/plans';
import { useWorkout } from '@/store/workout-store';

export function generateMetadata(): Metadata {
  return {
    title: 'KineticForm — Simple Workout Tracker',
    description: 'Start a workout, log each set, and celebrate your progress.',
  };
}

export default function TodayScreen() {
  const plan = workoutPlans[0];
  const { activeWorkout, displayName, startWorkout } = useWorkout();
  const completedSets = activeWorkout?.exercises.flatMap((exercise) => exercise.logs).filter((set) => set.completed).length ?? 0;
  const totalSets = activeWorkout?.exercises.reduce((sum, exercise) => sum + exercise.logs.length, 0) ?? 0;

  const openWorkout = () => {
    if (!activeWorkout) startWorkout(plan.id);
    router.push('/workout');
  };

  return (
    <Screen>
      <View style={styles.helloRow}>
        <View style={styles.helloIcon}><Text style={styles.wave}>👋</Text></View>
        <View>
          <Text style={styles.greeting}>Hi, {displayName}!</Text>
          <Text style={styles.prompt}>Ready to move?</Text>
        </View>
      </View>

      <DateStrip />

      <View style={styles.workoutCard}>
        <View style={styles.cardTop}>
          <View style={styles.planIcon}><Ionicons name="barbell" size={26} color={colors.accent} /></View>
          <View style={styles.todayPill}><Text style={styles.todayPillText}>{activeWorkout ? 'Keep going!' : 'Today'}</Text></View>
        </View>

        <Text style={styles.workoutTitle}>{plan.name}</Text>
        <Text style={styles.focus}>{plan.focus}</Text>

        <View style={styles.quickFacts}>
          <View style={styles.fact}>
            <Ionicons name="footsteps-outline" size={20} color={colors.accent} />
            <Text style={styles.factBig}>{plan.exercises.length}</Text>
            <Text style={styles.factSmall}>moves</Text>
          </View>
          <View style={styles.factDivider} />
          <View style={styles.fact}>
            <Ionicons name="time-outline" size={20} color={colors.accent} />
            <Text style={styles.factBig}>{plan.durationMinutes}</Text>
            <Text style={styles.factSmall}>minutes</Text>
          </View>
        </View>

        {activeWorkout ? (
          <View style={styles.resumeBox}>
            <View style={styles.resumeTop}>
              <Text style={styles.resumeText}>{completedSets} of {totalSets} sets done</Text>
              <Text style={styles.resumePercent}>{Math.round((completedSets / Math.max(totalSets, 1)) * 100)}%</Text>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: `${(completedSets / Math.max(totalSets, 1)) * 100}%` }]} /></View>
          </View>
        ) : (
          <View style={styles.howTo}>
            <Text style={styles.howToText}>Tap Start, then tick each set when you finish it.</Text>
          </View>
        )}

        <PrimaryButton label={activeWorkout ? 'Continue workout' : 'Start workout'} icon="play" onPress={openWorkout} />
      </View>

      <SectionHeader title="What you’ll do" action={`${plan.exercises.length} moves`} />
      <ExerciseList exercises={plan.exercises} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  helloRow: { flexDirection: 'row', alignItems: 'center' },
  helloIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warmDim, marginRight: 13 },
  wave: { fontSize: 26 },
  greeting: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  prompt: { color: colors.textMuted, fontSize: 15, marginTop: 2 },
  workoutCard: { backgroundColor: colors.surface, marginTop: spacing.lg, padding: 22, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, shadowColor: '#392776', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentDim },
  todayPill: { backgroundColor: colors.successDim, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 8 },
  todayPillText: { color: colors.success, fontSize: 12, fontWeight: '900' },
  workoutTitle: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -1.1, marginTop: 20 },
  focus: { color: colors.textMuted, fontSize: 15, marginTop: 5 },
  quickFacts: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ink, borderRadius: 18, paddingVertical: 15, paddingHorizontal: 16, marginTop: 20, marginBottom: 16 },
  fact: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  factBig: { color: colors.text, fontSize: 20, fontWeight: '900' },
  factSmall: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  factDivider: { width: 1, height: 28, backgroundColor: colors.line },
  howTo: { padding: 13, borderRadius: 14, backgroundColor: colors.warmDim, marginBottom: 13 },
  howToText: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  resumeBox: { marginBottom: 14 },
  resumeTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resumeText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  resumePercent: { color: colors.accent, fontSize: 13, fontWeight: '900' },
  track: { height: 8, backgroundColor: colors.accentDim, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.accent, borderRadius: radius.pill },
});
