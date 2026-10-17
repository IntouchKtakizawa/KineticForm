import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout } from '@/store/workout-store';
import { ActiveExercise } from '@/types/workout';

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function WorkoutScreen() {
  const { activeWorkout, updateSet, toggleSet, addSet, startRest, skipRest, finishWorkout, discardWorkout } = useWorkout();
  const [now, setNow] = useState(0);
  const [enteredWithWorkout] = useState(activeWorkout !== null);

  useEffect(() => {
    const initialTick = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(initialTick); clearInterval(interval); };
  }, []);

  const progress = useMemo(() => {
    const sets = activeWorkout?.exercises.flatMap((exercise) => exercise.logs) ?? [];
    const complete = sets.filter((set) => set.completed).length;
    return { complete, total: sets.length, percent: sets.length ? complete / sets.length : 0 };
  }, [activeWorkout]);

  if (!activeWorkout && !enteredWithWorkout) return <Redirect href="/" />;
  if (!activeWorkout) return null;

  const currentTime = now || activeWorkout.startedAt;
  const elapsed = Math.floor((currentTime - activeWorkout.startedAt) / 1000);
  const restRemaining = activeWorkout.restEndAt ? Math.max(0, Math.round((activeWorkout.restEndAt - currentTime) / 1000)) : 0;

  const requestDiscard = () => Alert.alert('Leave this workout?', 'Your ticks and numbers from this workout will be removed.', [
    { text: 'Keep going', style: 'cancel' },
    { text: 'Leave', style: 'destructive', onPress: () => { discardWorkout(); router.replace('/'); } },
  ]);
  const finish = () => { finishWorkout(); router.replace('/progress'); };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Leave workout" onPress={requestDiscard} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.live}>Workout time</Text>
            <Text style={styles.timer}>{formatTime(elapsed)}</Text>
          </View>
          <Pressable disabled={progress.complete === 0} onPress={finish} style={[styles.finishButton, progress.complete === 0 && styles.disabled]}>
            <Text style={styles.finishLabel}>Finish</Text>
          </Pressable>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressCopy}>
            <Text style={styles.progressLabel}>{progress.complete} of {progress.total} sets done</Text>
            <Text style={styles.percent}>{Math.round(progress.percent * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress.percent * 100}%` }]} /></View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.workoutTitle}>{activeWorkout.name}</Text>
          <Text style={styles.help}>Type your numbers, then tap Done.</Text>

          {activeWorkout.exercises.map((exercise, index) => (
            <ExerciseLogger
              key={exercise.id}
              exercise={exercise}
              index={index}
              onUpdate={(setId, field, value) => updateSet(exercise.id, setId, field, value)}
              onToggle={(setId, wasCompleted) => {
                toggleSet(exercise.id, setId);
                if (!wasCompleted) startRest(exercise.restSeconds);
              }}
              onAdd={() => addSet(exercise.id)}
            />
          ))}

          <Pressable disabled={progress.complete === 0} style={[styles.completeButton, progress.complete === 0 && styles.disabled]} onPress={finish}>
            <Ionicons name="trophy" size={26} color={colors.white} />
            <View style={styles.completeCopy}>
              <Text style={styles.completeTitle}>Finish workout</Text>
              <Text style={styles.completeSub}>Save my {progress.complete} completed sets</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color={colors.white} />
          </Pressable>
        </ScrollView>

        {restRemaining > 0 ? (
          <View style={styles.restBar}>
            <View style={styles.restIcon}><Ionicons name="timer" size={22} color={colors.accent} /></View>
            <View style={styles.restCopy}>
              <Text style={styles.restLabel}>Take a break</Text>
              <Text style={styles.restTime}>{formatTime(restRemaining)}</Text>
            </View>
            <Pressable onPress={() => startRest(restRemaining + 30)} style={styles.restAction}><Text style={styles.restActionText}>+30 sec</Text></Pressable>
            <Pressable onPress={skipRest} style={[styles.restAction, styles.skipAction]}><Text style={styles.skipText}>Skip</Text></Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ExerciseLogger({ exercise, index, onUpdate, onToggle, onAdd }: {
  exercise: ActiveExercise;
  index: number;
  onUpdate: (setId: string, field: 'reps' | 'weight', value: string) => void;
  onToggle: (setId: string, wasCompleted: boolean) => void;
  onAdd: () => void;
}) {
  const isCardio = exercise.type === 'Cardio';
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={[styles.exerciseIndex, index % 2 === 1 && styles.exerciseIndexWarm]}><Text style={styles.exerciseIndexText}>{index + 1}</Text></View>
        <View style={styles.exerciseCopy}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseTarget}>{isCardio ? `${exercise.durationMinutes ?? 20} min${exercise.distanceKm ? ` · ${exercise.distanceKm} km` : ''}` : `${exercise.sets} sets × ${exercise.repTarget} reps · ${Math.round(exercise.restSeconds / 60)} min break`}</Text>
        </View>
      </View>

      <View style={styles.setHeader}>
        <Text style={[styles.setHeading, styles.setNumber]}>{isCardio ? 'Round' : 'Set'}</Text>
        <Text style={styles.setHeading}>{isCardio ? 'Distance' : 'Weight'}</Text>
        <Text style={styles.setHeading}>{isCardio ? 'Minutes' : 'Reps'}</Text>
        <Text style={styles.doneHeading}>Done</Text>
      </View>

      {exercise.logs.map((set, setIndex) => (
        <View key={set.id} style={[styles.setRow, set.completed && styles.completedRow]}>
          <View style={styles.setBubble}><Text style={styles.setCount}>{setIndex + 1}</Text></View>
          <TextInput
            accessibilityLabel={`Set ${setIndex + 1} ${isCardio ? 'distance' : 'weight'}`}
            value={set.weight}
            onChangeText={(value) => onUpdate(set.id, 'weight', value)}
            style={[styles.input, set.completed && styles.completedInput]}
            keyboardType="decimal-pad"
            selectTextOnFocus
            placeholder={isCardio ? 'km' : '0'}
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            accessibilityLabel={`Set ${setIndex + 1} ${isCardio ? 'minutes' : 'repetitions'}`}
            value={set.reps}
            onChangeText={(value) => onUpdate(set.id, 'reps', value)}
            style={[styles.input, set.completed && styles.completedInput]}
            keyboardType="number-pad"
            selectTextOnFocus
            placeholder={isCardio ? 'min' : exercise.repTarget.split('–')[0]}
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Set ${setIndex + 1} done`}
            accessibilityState={{ checked: set.completed }}
            onPress={() => onToggle(set.id, set.completed)}
            style={[styles.check, set.completed && styles.checked]}>
            <Ionicons name={set.completed ? 'checkmark' : 'ellipse-outline'} size={21} color={set.completed ? colors.white : colors.textMuted} />
          </Pressable>
        </View>
      ))}

      <Pressable accessibilityRole="button" onPress={onAdd} style={styles.addSet}>
        <Ionicons name="add-circle-outline" size={19} color={colors.accent} />
        <Text style={styles.addSetLabel}>Add another set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  flex: { flex: 1 },
  header: { width: '100%', maxWidth: 760, alignSelf: 'center', height: 70, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  headerCenter: { alignItems: 'center' },
  live: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  timer: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 18, marginTop: 2 },
  finishButton: { minWidth: 70, height: 42, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  finishLabel: { color: colors.white, fontSize: 13, fontWeight: '900' },
  progressWrap: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: 12 },
  progressCopy: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  percent: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  progressTrack: { height: 9, borderRadius: radius.pill, backgroundColor: colors.accentDim, overflow: 'hidden' },
  progressFill: { height: 9, borderRadius: radius.pill, backgroundColor: colors.accent },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 140 },
  workoutTitle: { color: colors.text, fontSize: 29, fontWeight: '900', letterSpacing: -1 },
  help: { color: colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: spacing.lg },
  exerciseCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.md, marginBottom: spacing.md },
  exerciseHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  exerciseIndex: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exerciseIndexWarm: { backgroundColor: colors.warmDim },
  exerciseIndexText: { color: colors.text, fontSize: 17, fontWeight: '900' },
  exerciseCopy: { flex: 1 },
  exerciseName: { color: colors.text, fontSize: 17, fontWeight: '900', letterSpacing: -0.2 },
  exerciseTarget: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  setHeader: { height: 32, flexDirection: 'row', alignItems: 'center', gap: 8 },
  setHeading: { flex: 1, color: colors.textMuted, textAlign: 'center', fontSize: 10, fontWeight: '800' },
  setNumber: { flex: 0, width: 38 },
  doneHeading: { width: 50, color: colors.textMuted, textAlign: 'center', fontSize: 10, fontWeight: '800' },
  setRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.line },
  completedRow: { backgroundColor: colors.successDim, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 13, borderTopColor: 'transparent' },
  setBubble: { width: 38, alignItems: 'center' },
  setCount: { color: colors.text, fontSize: 14, fontWeight: '900' },
  input: { flex: 1, minWidth: 0, height: 42, paddingHorizontal: 7, textAlign: 'center', borderRadius: 12, color: colors.text, backgroundColor: colors.ink, fontFamily: 'SpaceMono', fontSize: 15, borderWidth: 1, borderColor: colors.line },
  completedInput: { borderColor: colors.success, backgroundColor: colors.surface },
  check: { width: 50, height: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  checked: { backgroundColor: colors.success, borderColor: colors.success },
  addSet: { height: 46, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  addSetLabel: { color: colors.accent, fontSize: 13, fontWeight: '800' },
  completeButton: { minHeight: 74, backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  completeCopy: { flex: 1, marginLeft: 12 },
  completeTitle: { color: colors.white, fontSize: 17, fontWeight: '900' },
  completeSub: { color: '#E8E1FF', fontSize: 11, marginTop: 3 },
  restBar: { position: 'absolute', alignSelf: 'center', width: '94%', maxWidth: 720, bottom: 9, minHeight: 78, borderRadius: 20, padding: 11, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.accentSoft, flexDirection: 'row', alignItems: 'center', shadowColor: '#392776', shadowOpacity: 0.18, shadowRadius: 20 },
  restIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  restCopy: { flex: 1, marginLeft: 11 },
  restLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800' },
  restTime: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 19, marginTop: 2 },
  restAction: { height: 42, paddingHorizontal: 11, borderRadius: 13, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  restActionText: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  skipAction: { backgroundColor: colors.accent },
  skipText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.35 },
});
