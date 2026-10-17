import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateStrip } from '@/components/date-strip';
import { ExerciseList } from '@/components/exercise-list';
import { Eyebrow, IconButton, PrimaryButton, Screen, SectionHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { workoutPlans } from '@/data/plans';
import { useWorkout } from '@/store/workout-store';

export function generateMetadata(): Metadata {
  return {
    title: 'KineticForm — Workout Tracker',
    description: 'A fast, focused workout tracker for planning sessions, logging sets, timing rest, and seeing progress.',
  };
}

export default function TodayScreen() {
  const plan = workoutPlans[0];
  const { activeWorkout, displayName, startWorkout, history } = useWorkout();
  const lastSession = history[0];
  const completedSets = activeWorkout?.exercises.flatMap((exercise) => exercise.logs).filter((set) => set.completed).length ?? 0;
  const totalSets = activeWorkout?.exercises.reduce((sum, exercise) => sum + exercise.logs.length, 0) ?? 0;

  const openWorkout = () => {
    if (!activeWorkout) startWorkout(plan.id);
    router.push('/workout');
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <View>
          <Eyebrow>Ready to train</Eyebrow>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>{displayName}.</Text>
        </View>
        <IconButton icon="notifications-outline" onPress={() => {}} accessibilityLabel="Notifications" />
      </View>

      <DateStrip />

      <View style={styles.workoutCard}>
        <View style={styles.cardAccent} />
        <View style={styles.cardTop}>
          <View style={styles.planBadge}><Text style={styles.planBadgeText}>{activeWorkout ? 'IN PROGRESS' : 'TODAY · PLAN A'}</Text></View>
          <View style={styles.duration}><Ionicons name="time-outline" size={14} color={colors.textMuted} /><Text style={styles.durationText}> {plan.durationMinutes} min</Text></View>
        </View>
        <Text style={styles.workoutTitle}>{plan.name}</Text>
        <Text style={styles.focus}>{plan.focus}</Text>

        <View style={styles.visual}>
          <View style={[styles.track, { width: '86%' }]}><View style={[styles.fill, { width: '70%' }]} /></View>
          <View style={[styles.track, { width: '68%' }]}><View style={[styles.fill, { width: '52%', opacity: 0.65 }]} /></View>
          <View style={[styles.track, { width: '46%' }]}><View style={[styles.fill, { width: '34%', opacity: 0.35 }]} /></View>
          <Text style={styles.exerciseCount}>{plan.exercises.length}<Text style={styles.exerciseUnit}> exercises</Text></Text>
        </View>

        {activeWorkout ? (
          <View style={styles.resumeMeta}>
            <Text style={styles.resumeText}>{completedSets} of {totalSets} sets logged</Text>
            <Text style={styles.resumePercent}>{Math.round((completedSets / Math.max(totalSets, 1)) * 100)}%</Text>
          </View>
        ) : null}
        <PrimaryButton label={activeWorkout ? 'Resume workout' : 'Start workout'} icon={activeWorkout ? 'play' : 'arrow-forward'} onPress={openWorkout} />
      </View>

      <SectionHeader title="Workout outline" action={`${plan.exercises.length} exercises`} />
      <ExerciseList exercises={plan.exercises} />

      {lastSession ? (
        <>
          <SectionHeader title="Last session" />
          <Pressable style={styles.lastSession} onPress={() => router.push('/progress')}>
            <View>
              <Text style={styles.lastLabel}>TOTAL VOLUME</Text>
              <Text style={styles.lastValue}>{(lastSession.totalVolume / 1000).toFixed(1)}k <Text style={styles.lastUnit}>kg</Text></Text>
            </View>
            <View style={styles.up}><Ionicons name="trending-up" size={17} color={colors.accent} /><Text style={styles.upText}> +5.7%</Text></View>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: colors.textMuted, fontSize: 27, fontWeight: '600', marginTop: 9, letterSpacing: -1 },
  name: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -1.4, lineHeight: 38 },
  workoutCard: { backgroundColor: colors.surface, marginTop: spacing.xl, padding: 22, paddingTop: 21, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  cardAccent: { position: 'absolute', top: 0, left: 22, right: 22, height: 2, backgroundColor: colors.accent },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planBadge: { backgroundColor: colors.accentDim, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  planBadgeText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  duration: { flexDirection: 'row', alignItems: 'center' },
  durationText: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 11 },
  workoutTitle: { color: colors.text, fontSize: 29, lineHeight: 34, fontWeight: '800', letterSpacing: -1.1, marginTop: 24 },
  focus: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  visual: { height: 112, justifyContent: 'center', marginVertical: 12 },
  track: { height: 2, backgroundColor: colors.line, marginVertical: 8 },
  fill: { height: 2, backgroundColor: colors.accent },
  exerciseCount: { position: 'absolute', right: 0, top: 41, color: colors.text, fontFamily: 'SpaceMono', fontSize: 28 },
  exerciseUnit: { color: colors.textMuted, fontSize: 10 },
  resumeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  resumeText: { color: colors.textMuted, fontSize: 12 },
  resumePercent: { color: colors.accent, fontFamily: 'SpaceMono', fontSize: 12 },
  lastSession: { height: 92, paddingHorizontal: 18, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  lastValue: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 23, marginTop: 5 },
  lastUnit: { color: colors.textMuted, fontSize: 11 },
  up: { flexDirection: 'row', backgroundColor: colors.accentDim, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill },
  upText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
});
