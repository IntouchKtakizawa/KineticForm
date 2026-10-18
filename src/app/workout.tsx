import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';
import { exerciseLibrary } from '@/data/exercises';
import { useWorkout } from '@/store/workout-store';
import { ActiveExercise } from '@/types/workout';

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function WorkoutScreen() {
  const { hydrated, activeWorkout, history, updateSet, updateWorkoutNotes, toggleSet, setSetKind, addSet, removeSet, skipExercise, substituteExercise, startRest, pauseRest, skipRest, resetRest, finishWorkout, discardWorkout } = useWorkout();
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

  if (!hydrated) return <SafeAreaView style={styles.safe} />;
  if (!activeWorkout && !enteredWithWorkout) return <Redirect href="/" />;
  if (!activeWorkout) return null;

  const currentTime = now || activeWorkout.startedAt;
  const elapsed = Math.floor((currentTime - activeWorkout.startedAt) / 1000);
  const restRemaining = activeWorkout.restEndAt ? Math.max(0, Math.round((activeWorkout.restEndAt - currentTime) / 1000)) : 0;

  const requestDiscard = () => Alert.alert('Leave this workout?', 'Your ticks and numbers from this workout will be removed.', [
    { text: 'Keep going', style: 'cancel' },
    { text: 'Leave', style: 'destructive', onPress: () => { discardWorkout(); router.replace('/'); } },
  ]);
  const finish = () => Alert.alert('Finish this workout?', `${progress.complete} completed sets will be saved. You can undo set ticks before continuing.`, [{ text: 'Keep logging', style: 'cancel' }, { text: 'Finish and save', onPress: () => { finishWorkout(); router.replace('/progress'); } }]);

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
          <Pressable accessibilityRole="button" accessibilityLabel="Finish workout" disabled={progress.complete === 0} onPress={finish} style={[styles.finishButton, progress.complete === 0 && styles.disabled]}>
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
              previous={history.find((session) => session.exercises.some((item) => item.name === exercise.name))?.exercises.find((item) => item.name === exercise.name)}
              onUpdate={(setId, field, value) => updateSet(exercise.id, setId, field, value)}
              onToggle={(setId, wasCompleted) => {
                toggleSet(exercise.id, setId);
                if (!wasCompleted) startRest(exercise.restSeconds);
              }}
              onKind={(setId, kind) => setSetKind(exercise.id, setId, kind)}
              onRemove={(setId) => removeSet(exercise.id, setId)}
              onAdd={(copy) => addSet(exercise.id, copy)}
              onSkip={() => Alert.alert('Skip this exercise?', 'It will be removed from this active workout only.', [{ text: 'Keep', style: 'cancel' }, { text: 'Skip', onPress: () => skipExercise(exercise.id) }])}
              onSubstitute={() => {
                const choices = exerciseLibrary.filter((item) => item.movement === exercise.movement && item.name !== exercise.name);
                const replacement = choices[0];
                if (replacement) Alert.alert('Use a similar movement?', `${replacement.name} trains a similar pattern, but it is not identical.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Substitute', onPress: () => substituteExercise(exercise.id, replacement) }]);
                else Alert.alert('No close substitute found', 'Use Skip, then add a different movement to the reusable workout later.');
              }}
            />
          ))}

          <View style={styles.notesCard}><Text style={styles.notesTitle}>Workout notes</Text><Text style={styles.notesHelp}>Record technique cues, how you felt, or what to adjust next time.</Text><TextInput accessibilityLabel="Workout notes" value={activeWorkout.notes ?? ''} onChangeText={updateWorkoutNotes} multiline maxLength={500} placeholder="Optional notes…" placeholderTextColor={colors.textMuted} style={styles.notesInput} /></View>

          <Pressable accessibilityRole="button" accessibilityLabel="Finish workout and save completed sets" disabled={progress.complete === 0} style={[styles.completeButton, progress.complete === 0 && styles.disabled]} onPress={finish}>
            <Ionicons name="trophy" size={26} color={colors.white} />
            <View style={styles.completeCopy}>
              <Text style={styles.completeTitle}>Finish workout</Text>
              <Text style={styles.completeSub}>Save my {progress.complete} completed sets</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color={colors.white} />
          </Pressable>
        </ScrollView>

        {restRemaining > 0 || activeWorkout.pausedRestSeconds ? (
          <View style={styles.restBar}>
            <View style={styles.restIcon}><Ionicons name="timer" size={22} color={colors.accent} /></View>
            <View style={styles.restCopy}>
              <Text style={styles.restLabel}>{activeWorkout.pausedRestSeconds ? 'Timer paused' : 'Take a break'}</Text>
              <Text style={styles.restTime}>{formatTime(activeWorkout.pausedRestSeconds ?? restRemaining)}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={pauseRest} style={styles.restAction}><Text style={styles.restActionText}>{activeWorkout.pausedRestSeconds ? 'Resume' : 'Pause'}</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Add 30 seconds to rest" onPress={() => activeWorkout.pausedRestSeconds ? resetRest(activeWorkout.pausedRestSeconds + 30) : startRest(restRemaining + 30)} style={styles.restAction}><Text style={styles.restActionText}>+30 sec</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Skip rest timer" onPress={skipRest} style={[styles.restAction, styles.skipAction]}><Text style={styles.skipText}>Skip</Text></Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ExerciseLogger({ exercise, index, previous, onUpdate, onToggle, onKind, onRemove, onAdd, onSkip, onSubstitute }: {
  exercise: ActiveExercise;
  index: number;
  onUpdate: (setId: string, field: 'reps' | 'weight' | 'rpe', value: string) => void;
  onToggle: (setId: string, wasCompleted: boolean) => void;
  previous?: ActiveExercise;
  onKind: (setId: string, kind: 'warmup' | 'working') => void;
  onRemove: (setId: string) => void;
  onAdd: (copyPrevious?: boolean) => void;
  onSkip: () => void;
  onSubstitute: () => void;
}) {
  const isCardio = exercise.type === 'Cardio';
  const isTimed = exercise.type === 'Timed';
  const isDuration = exercise.type === 'Duration';
  const previousSets = previous?.logs.filter((set) => set.completed && set.kind !== 'warmup') ?? [];
  const previousBestSet = previousSets.slice().sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0) || (Number(b.reps) || 0) - (Number(a.reps) || 0))[0];
  const previousBestWeight = Number(previousBestSet?.weight) || 0;
  const previousBestReps = Number(previousBestSet?.reps) || 0;
  const findStartingWeight = !previous && exercise.type === 'Strength' && exercise.equipment !== 'Floor' && exercise.suggestedWeight === 0;
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={[styles.exerciseIndex, index % 2 === 1 && styles.exerciseIndexWarm]}><Text style={styles.exerciseIndexText}>{index + 1}</Text></View>
        <View style={styles.exerciseCopy}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseTarget}>{isCardio || isDuration ? `${exercise.repTarget}${isCardio && exercise.distanceKm ? ` · ${exercise.distanceKm} km` : ''}` : isTimed ? `${exercise.setTarget ?? exercise.sets} sets × ${exercise.repTarget} · ${exercise.restSeconds} sec break` : `${exercise.setTarget ?? exercise.sets} sets × ${exercise.repTarget} reps · ${exercise.restSeconds >= 120 ? `${exercise.restSeconds / 60} min` : `${exercise.restSeconds} sec`} break`}</Text>
        </View>
      </View>
      {exercise.notes ? <Text style={styles.exerciseNote}>{exercise.notes}</Text> : null}
      {previousBestSet ? <Text style={styles.previous}>Previous best: {previousBestWeight ? `${previousBestWeight} × ` : ''}{previousBestReps}{isTimed ? ' sec' : ' reps'}{previousBestSet.rpe ? ` · RPE ${previousBestSet.rpe}` : ''}</Text> : null}
      {findStartingWeight ? <View style={styles.startingWeight}><Text style={styles.startingWeightTitle}>Find Starting Weight</Text><Text style={styles.startingWeightText}>1. Begin light.  2. Perform controlled reps.  3. Add a small amount only if technique stays solid and you could still do 2–3 good reps. Save that load—no max test or failure set needed.</Text></View> : null}

      <View style={styles.setHeader}>
        <Text style={[styles.setHeading, styles.setNumber]}>{isCardio ? 'Round' : 'Set'}</Text>
        <Text style={styles.setHeading}>{isCardio ? 'Distance' : isTimed || isDuration ? 'Load' : 'Weight'}</Text>
        <Text style={styles.setHeading}>{isCardio || isDuration ? 'Minutes' : isTimed ? 'Seconds' : 'Reps'}</Text>
        <Text style={[styles.setHeading, styles.rpeHeading]}>RPE</Text>
        <Text style={styles.doneHeading}>Done</Text>
      </View>

      {exercise.logs.map((set, setIndex) => {
        const isPb = set.completed && set.kind !== 'warmup' && ((Number(set.weight) || 0) > previousBestWeight || ((Number(set.weight) || 0) === previousBestWeight && (Number(set.reps) || 0) > previousBestReps));
        return <View key={set.id} style={[styles.setRow, set.completed && styles.completedRow]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Set ${setIndex + 1} type ${set.kind ?? 'working'}. Tap to change; hold to remove.`} onPress={() => onKind(set.id, set.kind === 'warmup' ? 'working' : 'warmup')} onLongPress={() => onRemove(set.id)} style={[styles.setBubble, set.kind === 'warmup' && styles.warmupBubble]}><Text style={styles.setCount}>{set.kind === 'warmup' ? 'W' : setIndex + 1}</Text></Pressable>
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
          <TextInput
            accessibilityLabel={`Set ${setIndex + 1} RPE`}
            value={set.rpe ?? ''}
            onChangeText={(value) => onUpdate(set.id, 'rpe', value)}
            style={[styles.input, styles.rpeInput, set.completed && styles.completedInput]}
            keyboardType="decimal-pad"
            selectTextOnFocus
            maxLength={4}
            placeholder="—"
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Set ${setIndex + 1} done`}
            accessibilityState={{ checked: set.completed }}
            onPress={() => onToggle(set.id, set.completed)}
            style={[styles.check, set.completed && styles.checked]}>
            <Ionicons name={isPb ? 'trophy' : set.completed ? 'checkmark' : 'ellipse-outline'} size={isPb ? 17 : 21} color={set.completed ? colors.white : colors.textMuted} />
          </Pressable>
        </View>;
      })}

      <View style={styles.quickActions}><Pressable accessibilityRole="button" onPress={() => onAdd(false)} style={styles.addSet}>
        <Ionicons name="add-circle-outline" size={19} color={colors.accent} />
        <Text style={styles.addSetLabel}>Add set</Text>
      </Pressable><Pressable accessibilityRole="button" onPress={() => onAdd(true)} style={styles.addSet}><Ionicons name="copy-outline" size={17} color={colors.accent} /><Text style={styles.addSetLabel}>Repeat last</Text></Pressable></View>
      <View style={styles.exerciseActions}><Pressable accessibilityRole="button" onPress={onSubstitute}><Text style={styles.exerciseActionText}>Substitute</Text></Pressable><Pressable accessibilityRole="button" onPress={onSkip}><Text style={[styles.exerciseActionText, styles.skipExercise]}>Skip exercise</Text></Pressable></View>
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
  previous: { color: colors.success, fontSize: 11, fontWeight: '800', marginBottom: 7 },
  exerciseNote: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 7 },
  startingWeight: { backgroundColor: colors.accentDim, borderRadius: 13, padding: 11, marginBottom: 9 },
  startingWeightTitle: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  startingWeightText: { color: colors.text, fontSize: 10, lineHeight: 15, marginTop: 4 },
  setHeader: { height: 32, flexDirection: 'row', alignItems: 'center', gap: 8 },
  setHeading: { flex: 1, color: colors.textMuted, textAlign: 'center', fontSize: 10, fontWeight: '800' },
  setNumber: { flex: 0, width: 38 },
  doneHeading: { width: 50, color: colors.textMuted, textAlign: 'center', fontSize: 10, fontWeight: '800' },
  rpeHeading: { flex: 0, width: 43 },
  setRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.line },
  completedRow: { backgroundColor: colors.successDim, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 13, borderTopColor: 'transparent' },
  setBubble: { width: 38, alignItems: 'center' },
  warmupBubble: { backgroundColor: colors.warmDim, borderRadius: 10, paddingVertical: 6 },
  setCount: { color: colors.text, fontSize: 14, fontWeight: '900' },
  input: { flex: 1, minWidth: 0, height: 42, paddingHorizontal: 7, textAlign: 'center', borderRadius: 12, color: colors.text, backgroundColor: colors.ink, fontFamily: 'SpaceMono', fontSize: 15, borderWidth: 1, borderColor: colors.line },
  completedInput: { borderColor: colors.success, backgroundColor: colors.surface },
  rpeInput: { flex: 0, width: 43 },
  check: { width: 50, height: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  checked: { backgroundColor: colors.success, borderColor: colors.success },
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  addSet: { height: 46, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  addSetLabel: { color: colors.accent, fontSize: 13, fontWeight: '800' },
  exerciseActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  exerciseActionText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  skipExercise: { color: colors.danger },
  completeButton: { minHeight: 74, backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  completeCopy: { flex: 1, marginLeft: 12 },
  completeTitle: { color: colors.white, fontSize: 17, fontWeight: '900' },
  completeSub: { color: '#E8E1FF', fontSize: 11, marginTop: 3 },
  notesCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.md, marginBottom: spacing.md },
  notesTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  notesHelp: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  notesInput: { minHeight: 88, borderRadius: 13, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.line, color: colors.text, fontSize: 13, lineHeight: 19, padding: 12, marginTop: 10, textAlignVertical: 'top' },
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
