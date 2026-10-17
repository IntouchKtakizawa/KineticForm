import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';
import { exerciseLibrary } from '@/data/exercises';
import { useWorkout } from '@/store/workout-store';
import { Exercise, ExerciseDefinition, WorkoutPlan } from '@/types/workout';

const fromDefinition = (exercise: ExerciseDefinition): Exercise => ({ id: `${exercise.id}-${Date.now()}`, name: exercise.name, muscle: exercise.primaryMuscle, equipment: exercise.equipment, type: exercise.type, movement: exercise.movement, sets: exercise.defaultSets, repTarget: exercise.defaultReps, restSeconds: exercise.defaultRest, suggestedWeight: 0, durationMinutes: exercise.type === 'Cardio' ? 20 : undefined, distanceKm: exercise.type === 'Cardio' ? 0 : undefined, notes: '' });

export default function BuilderScreen() {
  const params = useLocalSearchParams<{ id?: string; add?: string }>();
  const { plans, customExercises, savePlan } = useWorkout();
  const existing = plans.find((plan) => plan.id === params.id);
  const requestedExercise = [...customExercises, ...exerciseLibrary].find((item) => item.id === params.add);
  const [name, setName] = useState(existing?.name ?? (requestedExercise ? `${requestedExercise.primaryMuscle} Workout` : 'New Workout'));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [duration, setDuration] = useState(String(existing?.durationMinutes ?? 45));
  const [exercises, setExercises] = useState<Exercise[]>(existing?.exercises.map((item) => ({ ...item })) ?? (requestedExercise ? [fromDefinition(requestedExercise)] : []));
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(exercises.length === 0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [removed, setRemoved] = useState<{ exercise: Exercise; index: number } | null>(null);
  const allExercises = useMemo(() => [...customExercises, ...exerciseLibrary], [customExercises]);
  const searchResults = allExercises.filter((exercise) => !search || [exercise.name, exercise.primaryMuscle, exercise.equipment].join(' ').toLowerCase().includes(search.toLowerCase())).slice(0, 12);

  const updateExercise = (id: string, field: keyof Exercise, value: string | number) => setExercises((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const move = (index: number, direction: -1 | 1) => setExercises((items) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const moveTo = (from: number, to: number) => setExercises((items) => {
    if (from === to) return items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  });
  const duplicate = (exercise: Exercise) => setExercises((items) => [...items, { ...exercise, id: `${exercise.id}-copy-${Date.now()}` }]);
  const addExercise = (exercise: ExerciseDefinition) => { setExercises((items) => [...items, fromDefinition(exercise)]); setShowSearch(false); setSearch(''); };

  useEffect(() => {
    if (existing || requestedExercise) return;
    AsyncStorage.getItem('@kineticform/builder-draft').then((raw) => { if (!raw) return; try { const draft = JSON.parse(raw) as { name?: string; notes?: string; duration?: string; exercises?: Exercise[] }; if (draft.name) setName(draft.name); if (draft.notes) setNotes(draft.notes); if (draft.duration) setDuration(draft.duration); if (draft.exercises?.length) { setExercises(draft.exercises); setShowSearch(false); } } catch { /* Ignore an invalid draft. */ } });
  }, [existing, requestedExercise]);
  useEffect(() => { if (!existing) AsyncStorage.setItem('@kineticform/builder-draft', JSON.stringify({ name, notes, duration, exercises })); }, [existing, name, notes, duration, exercises]);

  const save = (scheduleAfter = false) => {
    if (!name.trim() || !exercises.length) return Alert.alert('Workout needs a little more', 'Add a name and at least one exercise.');
    const plan: WorkoutPlan = { id: existing?.id ?? `plan-${Date.now()}`, name: name.trim(), focus: Array.from(new Set(exercises.map((item) => item.muscle))).slice(0, 3).join(' · '), durationMinutes: Math.max(10, Number(duration) || 45), exercises, notes: notes.trim(), createdAt: existing?.createdAt ?? Date.now() };
    savePlan(plan);
    AsyncStorage.removeItem('@kineticform/builder-draft');
    router.replace((scheduleAfter ? '/schedule' : '/programs') as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.headerButton}><Ionicons name="close" size={23} color={colors.text} /></Pressable><Text style={styles.headerTitle}>{existing ? 'Edit workout' : 'Build workout'}</Text><Pressable onPress={() => save(false)} style={styles.saveTop}><Text style={styles.saveTopText}>Save</Text></Pressable></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Workout name</Text><TextInput value={name} onChangeText={setName} placeholder="Push Day" placeholderTextColor={colors.textMuted} style={styles.nameInput} />
        <View style={styles.metaRow}><View style={styles.durationGroup}><Text style={styles.label}>Minutes</Text><TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" style={styles.metaInput} /></View><View style={styles.notesGroup}><Text style={styles.label}>Workout notes</Text><TextInput value={notes} onChangeText={setNotes} placeholder="Goal, tempo, warm-up…" placeholderTextColor={colors.textMuted} style={styles.metaInput} /></View></View>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Exercises</Text><Text style={styles.sectionSub}>Drag or use arrows to reorder; settings save with the template.</Text></View><Pressable onPress={() => setShowSearch((value) => !value)} style={styles.addExercise}><Ionicons name="add" size={20} color={colors.white} /><Text style={styles.addExerciseText}>Add</Text></Pressable></View>

        {showSearch ? <View style={styles.searchPanel}><View style={styles.searchBox}><Ionicons name="search" size={20} color={colors.textMuted} /><TextInput value={search} onChangeText={setSearch} autoFocus placeholder="Search exercise, muscle or equipment" placeholderTextColor={colors.textMuted} style={styles.searchInput} /></View>{searchResults.map((exercise) => <Pressable key={exercise.id} onPress={() => addExercise(exercise)} style={styles.searchResult}><View><Text style={styles.searchName}>{exercise.name}</Text><Text style={styles.searchMeta}>{exercise.primaryMuscle} · {exercise.equipment}</Text></View><Ionicons name="add-circle" size={23} color={colors.accent} /></Pressable>)}</View> : null}

        <View style={styles.exerciseList}>{exercises.map((exercise, index) => <View key={exercise.id} {...(Platform.OS === 'web' ? { draggable: true, onDragStart: () => setDraggedIndex(index), onDragOver: (event: { preventDefault: () => void }) => event.preventDefault(), onDrop: () => { if (draggedIndex !== null) moveTo(draggedIndex, index); setDraggedIndex(null); }, onDragEnd: () => setDraggedIndex(null) } : {})} style={[styles.exerciseCard, draggedIndex === index && styles.dragging]}>
          <View style={styles.exerciseTop}><View style={styles.dragHandle}><Ionicons name="reorder-three" size={22} color={colors.textMuted} /></View><View style={styles.exerciseCopy}><Text style={styles.exerciseName}>{exercise.name}</Text><Text style={styles.exerciseMeta}>{exercise.muscle} · {exercise.equipment ?? 'Equipment'}</Text></View><View style={styles.reorder}><Pressable disabled={index === 0} onPress={() => move(index, -1)} style={styles.miniButton}><Ionicons name="chevron-up" size={18} color={colors.textMuted} /></Pressable><Pressable disabled={index === exercises.length - 1} onPress={() => move(index, 1)} style={styles.miniButton}><Ionicons name="chevron-down" size={18} color={colors.textMuted} /></Pressable></View></View>
          {exercise.type === 'Cardio' ? <View style={styles.configRow}><View style={styles.configGroup}><Text style={styles.configLabel}>Minutes</Text><TextInput value={String(exercise.durationMinutes ?? 20)} onChangeText={(value) => updateExercise(exercise.id, 'durationMinutes', Number(value) || 0)} keyboardType="number-pad" style={styles.configInput} /></View><View style={styles.configGroup}><Text style={styles.configLabel}>Distance km</Text><TextInput value={String(exercise.distanceKm || '')} onChangeText={(value) => updateExercise(exercise.id, 'distanceKm', Number(value) || 0)} keyboardType="decimal-pad" style={styles.configInput} /></View><View style={styles.configGroup}><Text style={styles.configLabel}>Rest sec</Text><TextInput value={String(exercise.restSeconds)} onChangeText={(value) => updateExercise(exercise.id, 'restSeconds', Number(value) || 0)} keyboardType="number-pad" style={styles.configInput} /></View></View> : <View style={styles.configRow}><View style={styles.configGroup}><Text style={styles.configLabel}>Sets</Text><TextInput value={String(exercise.sets)} onChangeText={(value) => updateExercise(exercise.id, 'sets', Number(value) || 0)} keyboardType="number-pad" style={styles.configInput} /></View><View style={styles.configGroup}><Text style={styles.configLabel}>Reps</Text><TextInput value={exercise.repTarget} onChangeText={(value) => updateExercise(exercise.id, 'repTarget', value)} style={styles.configInput} /></View><View style={styles.configGroup}><Text style={styles.configLabel}>Weight</Text><TextInput value={String(exercise.suggestedWeight || '')} onChangeText={(value) => updateExercise(exercise.id, 'suggestedWeight', Number(value) || 0)} keyboardType="decimal-pad" style={styles.configInput} /></View><View style={styles.configGroup}><Text style={styles.configLabel}>Rest sec</Text><TextInput value={String(exercise.restSeconds)} onChangeText={(value) => updateExercise(exercise.id, 'restSeconds', Number(value) || 0)} keyboardType="number-pad" style={styles.configInput} /></View></View>}
          <TextInput value={exercise.notes ?? ''} onChangeText={(value) => updateExercise(exercise.id, 'notes', value)} placeholder="Exercise notes (optional)" placeholderTextColor={colors.textMuted} style={styles.noteInput} />
          <View style={styles.cardActions}><Pressable onPress={() => duplicate(exercise)} style={styles.cardAction}><Ionicons name="copy-outline" size={17} color={colors.textMuted} /><Text style={styles.cardActionText}>Duplicate</Text></Pressable><Pressable onPress={() => { setRemoved({ exercise, index }); setExercises((items) => items.filter((item) => item.id !== exercise.id)); }} style={styles.cardAction}><Ionicons name="trash-outline" size={17} color={colors.danger} /><Text style={[styles.cardActionText, styles.deleteText]}>Remove</Text></Pressable></View>
        </View>)}</View>
        {removed ? <View style={styles.undoBar}><Text style={styles.undoText}>{removed.exercise.name} removed</Text><Pressable onPress={() => { setExercises((items) => { const next = [...items]; next.splice(removed.index, 0, removed.exercise); return next; }); setRemoved(null); }}><Text style={styles.undoAction}>Undo</Text></Pressable></View> : null}
        <Pressable onPress={() => save(false)} style={styles.primaryButton}><Text style={styles.primaryText}>Save workout</Text></Pressable>
        <Pressable onPress={() => save(true)} style={styles.secondaryButton}><Ionicons name="calendar-outline" size={19} color={colors.accent} /><Text style={styles.secondaryText}>Save and schedule</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  header: { width: '100%', maxWidth: 760, alignSelf: 'center', height: 66, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  saveTop: { height: 42, minWidth: 65, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  saveTopText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.lg, paddingTop: 8, paddingBottom: 60 },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '900', marginBottom: 6 },
  nameInput: { height: 60, borderRadius: 18, paddingHorizontal: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, color: colors.text, fontSize: 21, fontWeight: '900' },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 13 },
  durationGroup: { width: 90 },
  notesGroup: { flex: 1 },
  metaInput: { height: 48, borderRadius: 14, paddingHorizontal: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, color: colors.text, fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '900' },
  sectionSub: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  addExercise: { height: 43, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.accent, flexDirection: 'row', gap: 5, alignItems: 'center' },
  addExerciseText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  searchPanel: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.accentSoft, padding: 12, marginBottom: 13 },
  searchBox: { height: 48, borderRadius: 14, paddingHorizontal: 12, backgroundColor: colors.ink, flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  searchResult: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.line, paddingHorizontal: 5 },
  searchName: { color: colors.text, fontSize: 13, fontWeight: '800' },
  searchMeta: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  exerciseList: { gap: 11 },
  exerciseCard: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 14 },
  dragging: { opacity: 0.55, borderColor: colors.accent },
  exerciseTop: { flexDirection: 'row', alignItems: 'center' },
  dragHandle: { width: 34 },
  exerciseCopy: { flex: 1 },
  exerciseName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  exerciseMeta: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  reorder: { flexDirection: 'row' },
  miniButton: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
  configRow: { flexDirection: 'row', gap: 7, marginTop: 13 },
  configGroup: { flex: 1 },
  configLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', textAlign: 'center', marginBottom: 5 },
  configInput: { height: 43, minWidth: 0, borderRadius: 12, backgroundColor: colors.ink, color: colors.text, textAlign: 'center', borderWidth: 1, borderColor: colors.line, fontSize: 12 },
  noteInput: { height: 43, borderRadius: 12, backgroundColor: colors.ink, color: colors.text, paddingHorizontal: 11, marginTop: 9, fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 18, marginTop: 12 },
  cardAction: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  cardActionText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  deleteText: { color: colors.danger },
  primaryButton: { height: 58, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  secondaryButton: { height: 54, borderRadius: 17, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', marginTop: 8, borderWidth: 1, borderColor: colors.accentSoft },
  secondaryText: { color: colors.accent, fontSize: 14, fontWeight: '900' },
  undoBar: { minHeight: 48, borderRadius: 14, backgroundColor: colors.warmDim, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: 10 },
  undoText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  undoAction: { color: colors.accent, fontSize: 12, fontWeight: '900' },
});
