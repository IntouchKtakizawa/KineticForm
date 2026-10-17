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
    return () => {
      clearTimeout(initialTick);
      clearInterval(interval);
    };
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
  const restRemaining = activeWorkout.restEndAt ? Math.max(0, Math.ceil((activeWorkout.restEndAt - currentTime) / 1000)) : 0;

  const requestDiscard = () => Alert.alert('Discard workout?', 'Your logged sets from this session will be removed.', [
    { text: 'Keep training', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: () => { discardWorkout(); router.replace('/'); } },
  ]);

  const finish = () => {
    finishWorkout();
    router.replace('/progress');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={requestDiscard} style={styles.closeButton}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.live}>● LIVE WORKOUT</Text>
            <Text style={styles.timer}>{formatTime(elapsed)}</Text>
          </View>
          <Pressable disabled={progress.complete === 0} onPress={finish} style={[styles.finishButton, progress.complete === 0 && styles.disabled]}><Text style={styles.finishLabel}>Finish</Text></Pressable>
        </View>

        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress.percent * 100}%` }]} /></View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.workoutHeading}>
            <View>
              <Text style={styles.workoutTitle}>{activeWorkout.name}</Text>
              <Text style={styles.workoutMeta}>{progress.complete} of {progress.total} sets complete</Text>
            </View>
            <Text style={styles.percent}>{Math.round(progress.percent * 100)}%</Text>
          </View>

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
            <View>
              <Text style={styles.completeTitle}>Finish workout</Text>
              <Text style={styles.completeSub}>{progress.complete} sets · {formatTime(elapsed)}</Text>
            </View>
            <View style={styles.completeIcon}><Ionicons name="checkmark" size={23} color={colors.ink} /></View>
          </Pressable>
        </ScrollView>

        {restRemaining > 0 ? (
          <View style={styles.restBar}>
            <View style={styles.restIcon}><Ionicons name="timer-outline" size={20} color={colors.accent} /></View>
            <View style={styles.restCopy}>
              <Text style={styles.restLabel}>RESTING</Text>
              <Text style={styles.restTime}>{formatTime(restRemaining)}</Text>
            </View>
            <Pressable onPress={() => startRest(restRemaining + 30)} style={styles.restAction}><Text style={styles.restActionText}>+30</Text></Pressable>
            <Pressable onPress={skipRest} style={styles.restAction}><Text style={styles.restActionText}>Skip</Text></Pressable>
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
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseIndex}><Text style={styles.exerciseIndexText}>{String(index + 1).padStart(2, '0')}</Text></View>
        <View style={styles.exerciseCopy}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseTarget}>{exercise.muscle} · {exercise.repTarget} reps · {Math.round(exercise.restSeconds / 60)} min rest</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
      </View>

      <View style={styles.setHeader}>
        <Text style={[styles.setHeading, styles.setNumber]}>SET</Text>
        <Text style={styles.setHeading}>KG</Text>
        <Text style={styles.setHeading}>REPS</Text>
        <View style={styles.checkSpace} />
      </View>

      {exercise.logs.map((set, setIndex) => (
        <View key={set.id} style={[styles.setRow, set.completed && styles.completedRow]}>
          <Text style={[styles.setCount, set.completed && styles.completedCopy]}>{setIndex + 1}</Text>
          <TextInput
            value={set.weight}
            onChangeText={(value) => onUpdate(set.id, 'weight', value)}
            style={[styles.input, set.completed && styles.completedInput]}
            keyboardType="decimal-pad"
            selectTextOnFocus
            placeholder="—"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            value={set.reps}
            onChangeText={(value) => onUpdate(set.id, 'reps', value)}
            style={[styles.input, set.completed && styles.completedInput]}
            keyboardType="number-pad"
            selectTextOnFocus
            placeholder={exercise.repTarget.split('–')[0]}
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: set.completed }}
            onPress={() => onToggle(set.id, set.completed)}
            style={[styles.check, set.completed && styles.checked]}>
            {set.completed ? <Ionicons name="checkmark" size={20} color={colors.ink} /> : null}
          </Pressable>
        </View>
      ))}

      <Pressable onPress={onAdd} style={styles.addSet}><Ionicons name="add" size={17} color={colors.textMuted} /><Text style={styles.addSetLabel}> Add set</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  flex: { flex: 1 },
  header: { height: 64, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { width: 44, height: 44, justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  live: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  timer: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 15, marginTop: 4 },
  finishButton: { minWidth: 62, height: 38, borderRadius: 12, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  finishLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 2, backgroundColor: colors.line },
  progressFill: { height: 2, backgroundColor: colors.accent },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: 130 },
  workoutHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: spacing.xl },
  workoutTitle: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.9 },
  workoutMeta: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  percent: { color: colors.accent, fontFamily: 'SpaceMono', fontSize: 18 },
  exerciseCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.md, marginBottom: spacing.md },
  exerciseHeader: { minHeight: 56, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exerciseIndex: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exerciseIndexText: { color: colors.accent, fontFamily: 'SpaceMono', fontSize: 10 },
  exerciseCopy: { flex: 1 },
  exerciseName: { color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  exerciseTarget: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  setHeader: { height: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3 },
  setHeading: { flex: 1, color: colors.textMuted, textAlign: 'center', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  setNumber: { flex: 0, width: 34, textAlign: 'left' },
  checkSpace: { width: 45 },
  setRow: { height: 55, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, gap: 9 },
  completedRow: { opacity: 0.82 },
  setCount: { width: 25, color: colors.textMuted, textAlign: 'center', fontFamily: 'SpaceMono', fontSize: 12 },
  completedCopy: { color: colors.accent },
  input: { flex: 1, minWidth: 0, height: 38, paddingHorizontal: 7, textAlign: 'center', borderRadius: 9, color: colors.text, backgroundColor: colors.ink, fontFamily: 'SpaceMono', fontSize: 14, borderWidth: 1, borderColor: colors.line },
  completedInput: { borderColor: colors.accentDim, color: colors.text },
  check: { width: 42, height: 38, borderRadius: 11, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.accent, borderColor: colors.accent },
  addSet: { height: 39, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  addSetLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  completeButton: { minHeight: 74, backgroundColor: colors.accent, borderRadius: radius.md, paddingLeft: 21, paddingRight: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  completeTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  completeSub: { color: '#576529', fontSize: 10, marginTop: 4, fontFamily: 'SpaceMono' },
  completeIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(10,12,11,.1)', alignItems: 'center', justifyContent: 'center' },
  restBar: { position: 'absolute', left: 12, right: 12, bottom: 9, minHeight: 72, borderRadius: radius.md, padding: 11, backgroundColor: '#20251D', borderWidth: 1, borderColor: '#3D4829', flexDirection: 'row', alignItems: 'center' },
  restIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  restCopy: { flex: 1, marginLeft: 12 },
  restLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  restTime: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 17, marginTop: 3 },
  restAction: { height: 40, minWidth: 48, borderRadius: 11, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginLeft: 7 },
  restActionText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  disabled: { opacity: 0.35 },
});
