import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { exerciseFilters, exerciseLibrary } from '@/data/exercises';
import { useWorkout } from '@/store/workout-store';
import { ExerciseDefinition } from '@/types/workout';

const muscleColors: Record<string, string> = { Chest: '#FFE1E6', Back: '#DDEBFF', Shoulders: '#E8E1FF', Biceps: '#FFF0D7', Triceps: '#E5F7EA', Legs: '#DDF7EB', Core: '#F4E4FF', Cardio: '#FFE6D5', 'Full body': '#E6E9FF' };

export default function LibraryScreen() {
  const { customExercises, addCustomExercise } = useWorkout();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [showCustom, setShowCustom] = useState(false);
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('Full body');
  const [equipment, setEquipment] = useState('Bodyweight');

  const allExercises = useMemo(() => [...customExercises, ...exerciseLibrary], [customExercises]);
  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return allExercises.filter((exercise) => {
      const haystack = [exercise.name, ...(exercise.aliases ?? []), exercise.primaryMuscle, exercise.secondaryMuscles.join(' '), exercise.equipment, exercise.type, exercise.movement].join(' ').toLowerCase();
      const matchesQuery = !search || search.split(/\s+/).every((word) => haystack.includes(word));
      const matchesFilter = filter === 'All' || exercise.primaryMuscle === filter || exercise.equipment === filter || exercise.type === filter;
      return matchesQuery && matchesFilter;
    });
  }, [allExercises, query, filter]);

  const saveCustom = () => {
    if (!name.trim()) return;
    const custom: ExerciseDefinition = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      primaryMuscle: muscle,
      secondaryMuscles: [],
      equipment,
      type: 'Strength',
      movement: 'Custom',
      setup: 'Add your preferred setup and safety cues in the exercise notes.',
      instructions: ['Set up in a stable position.', 'Move through a controlled range.', 'Stop the set when form begins to break down.'],
      defaultSets: 3,
      defaultReps: '8–12',
      defaultRest: 60,
      custom: true,
    };
    addCustomExercise(custom);
    setName('');
    setShowCustom(false);
  };

  return (
    <Screen>
      <View style={styles.titleRow}>
        <View><Text style={styles.eyebrow}>Exercise database</Text><Text style={styles.title}>Find a movement</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Create custom exercise" onPress={() => setShowCustom((value) => !value)} style={styles.addButton}><Ionicons name="add" size={25} color={colors.white} /></Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={21} color={colors.textMuted} />
        <TextInput accessibilityLabel="Search exercises" value={query} onChangeText={setQuery} placeholder="Try “chest dumbbell”" placeholderTextColor={colors.textMuted} style={styles.searchInput} />
        {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear exercise search" onPress={() => setQuery('')}><Ionicons name="close-circle" size={20} color={colors.textMuted} /></Pressable> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {exerciseFilters.map((item) => <Pressable accessibilityRole="button" accessibilityState={{ selected: filter === item }} key={item} onPress={() => setFilter(item)} style={[styles.filterChip, filter === item && styles.filterChipActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}
      </ScrollView>

      {showCustom ? (
        <View style={styles.customCard}>
          <Text style={styles.customTitle}>Create custom exercise</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Exercise name" placeholderTextColor={colors.textMuted} style={styles.customInput} />
          <View style={styles.customRow}>
            <TextInput value={muscle} onChangeText={setMuscle} placeholder="Muscle group" placeholderTextColor={colors.textMuted} style={[styles.customInput, styles.half]} />
            <TextInput value={equipment} onChangeText={setEquipment} placeholder="Equipment" placeholderTextColor={colors.textMuted} style={[styles.customInput, styles.half]} />
          </View>
          <Pressable accessibilityRole="button" onPress={saveCustom} style={styles.saveButton}><Text style={styles.saveText}>Save exercise</Text></Pressable>
        </View>
      ) : null}

      <View style={styles.resultsHeader}><Text style={styles.resultsTitle}>{filter === 'All' ? 'All exercises' : filter}</Text><Text style={styles.resultCount}>{results.length} results</Text></View>
      <View style={styles.list}>
        {!results.length ? <View style={styles.empty}><Ionicons name="search-outline" size={28} color={colors.textMuted} /><Text style={styles.emptyTitle}>No matching movement</Text><Text style={styles.emptyText}>Try fewer words, clear the filter, or create a custom exercise.</Text></View> : null}
        {results.map((exercise) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`View ${exercise.name}`} key={exercise.id} onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: exercise.id } } as never)} style={({ pressed }) => [styles.exerciseCard, pressed && styles.pressed]}>
            <View style={[styles.exerciseIcon, { backgroundColor: muscleColors[exercise.primaryMuscle] ?? colors.accentDim }]}><Ionicons name={exercise.type === 'Cardio' ? 'pulse' : 'barbell'} size={22} color={colors.text} /></View>
            <View style={styles.exerciseCopy}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseMeta}>{exercise.primaryMuscle} · {exercise.equipment}</Text>
              <Text style={styles.exerciseType}>{exercise.movement}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.2, marginTop: 5 },
  addButton: { width: 50, height: 50, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  searchBox: { height: 58, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.lg },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, outlineStyle: 'none' } as never,
  filters: { gap: 8, paddingVertical: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  filterChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: colors.white },
  customCard: { padding: 17, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.accentSoft, marginBottom: 10 },
  customTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: 10 },
  customInput: { height: 46, borderRadius: 13, backgroundColor: colors.ink, color: colors.text, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, marginBottom: 8 },
  customRow: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  saveButton: { height: 48, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.white, fontWeight: '900' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 12 },
  resultsTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  resultCount: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  list: { gap: 9 },
  exerciseCard: { minHeight: 82, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 13, flexDirection: 'row', alignItems: 'center' },
  exerciseIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exerciseCopy: { flex: 1 },
  exerciseName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  exerciseMeta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  exerciseType: { color: colors.accent, fontSize: 10, fontWeight: '800', marginTop: 3 },
  pressed: { opacity: 0.7 },
  empty: { padding: 28, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 10 },
  emptyText: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 5 },
});
