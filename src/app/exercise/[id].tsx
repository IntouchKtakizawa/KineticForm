import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';
import { exerciseLibrary } from '@/data/exercises';
import { useWorkout } from '@/store/workout-store';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customExercises, history } = useWorkout();
  const exercise = [...customExercises, ...exerciseLibrary].find((item) => item.id === id);
  if (!exercise) return null;
  const previous = history.flatMap((session) => session.exercises.map((item) => ({ ...item, date: session.completedAt }))).filter((item) => item.name === exercise.name).slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable><Text style={styles.headerTitle}>Exercise details</Text><View style={styles.back} /></View>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name={exercise.type === 'Cardio' ? 'pulse' : 'barbell'} size={35} color={colors.accent} /></View>
          <Text style={styles.title}>{exercise.name}</Text>
          <Text style={styles.subtitle}>{exercise.primaryMuscle} · {exercise.equipment} · {exercise.movement}</Text>
          <View style={styles.defaults}>
            <View><Text style={styles.defaultValue}>{exercise.defaultSets}</Text><Text style={styles.defaultLabel}>sets</Text></View>
            <View style={styles.divider} />
            <View><Text style={styles.defaultValue}>{exercise.defaultReps}</Text><Text style={styles.defaultLabel}>reps</Text></View>
            <View style={styles.divider} />
            <View><Text style={styles.defaultValue}>{exercise.defaultRest}s</Text><Text style={styles.defaultLabel}>rest</Text></View>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Setup and form</Text>
        <View style={styles.infoCard}><Text style={styles.setup}>{exercise.setup}</Text>{exercise.instructions.map((step, index) => <View key={step} style={styles.step}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={styles.stepText}>{step}</Text></View>)}</View>
        <Text style={styles.sectionTitle}>Muscles</Text>
        <View style={styles.tags}><View style={styles.primaryTag}><Text style={styles.primaryTagText}>{exercise.primaryMuscle} · primary</Text></View>{exercise.secondaryMuscles.map((muscle) => <View key={muscle} style={styles.tag}><Text style={styles.tagText}>{muscle}</Text></View>)}</View>
        <Text style={styles.sectionTitle}>Common mistakes</Text>
        <View style={styles.infoCard}>{(exercise.commonMistakes ?? ['Rushing the movement']).map((mistake) => <View key={mistake} style={styles.step}><Ionicons name="alert-circle-outline" size={20} color={colors.danger} /><Text style={styles.stepText}>{mistake}</Text></View>)}</View>
        {exercise.substitutions?.length ? <><Text style={styles.sectionTitle}>Similar movement options</Text><View style={styles.infoCard}>{exercise.substitutions.map((subId) => { const item = exerciseLibrary.find((entry) => entry.id === subId); return item ? <Pressable key={subId} onPress={() => router.replace({ pathname: '/exercise/[id]', params: { id: subId } } as never)} style={styles.historyRow}><Text style={styles.historyValue}>{item.name}</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable> : null; })}<Text style={styles.empty}>Alternatives can train a similar pattern without being identical.</Text></View></> : null}
        <Text style={styles.sectionTitle}>Previous performance</Text>
        <View style={styles.infoCard}>{previous.length ? previous.map((item) => <View key={`${item.date}-${item.id}`} style={styles.historyRow}><Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text><Text style={styles.historyValue}>{item.logs.filter((set) => set.completed).length} sets · best {Math.max(...item.logs.map((set) => Number(set.weight) || 0))} kg</Text></View>) : <Text style={styles.empty}>Complete this exercise to build your history.</Text>}</View>
        <Pressable onPress={() => router.push({ pathname: '/builder', params: { add: exercise.id } } as never)} style={styles.addToWorkout}><Ionicons name="add" size={21} color={colors.white} /><Text style={styles.addText}>Add to a workout</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: 50 },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  hero: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 24, borderWidth: 1, borderColor: colors.line },
  heroIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -1, textAlign: 'center', marginTop: 15 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },
  defaults: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderColor: colors.line },
  defaultValue: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  defaultLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  divider: { width: 1, height: 34, backgroundColor: colors.line },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: spacing.xl, marginBottom: 11 },
  infoCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 17 },
  setup: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 11 },
  stepNumber: { width: 28, height: 28, borderRadius: 10, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepNumberText: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  stepText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryTag: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.accent },
  primaryTagText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  tag: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.surface },
  tagText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  historyRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.line },
  historyDate: { color: colors.textMuted, fontSize: 12 },
  historyValue: { color: colors.text, fontSize: 12, fontWeight: '800' },
  empty: { color: colors.textMuted, fontSize: 13 },
  addToWorkout: { height: 58, marginTop: spacing.lg, borderRadius: 17, backgroundColor: colors.accent, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.white, fontSize: 16, fontWeight: '900' },
});
