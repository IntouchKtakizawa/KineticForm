import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout } from '@/store/workout-store';
import { WorkoutPlan } from '@/types/workout';
import { extractDocumentText, ParsedWorkout, parseWorkoutText } from '@/utils/import-parser';

const sample = `Monday Push Day
Bench Press — 4 × 8 — 50 kg — 120 sec rest
Incline Dumbbell Press — 3 × 10 — 15 kg — 90 sec rest
Cable Fly — 3 × 12 — 60 sec rest`;

export default function ImportScreen() {
  const { savePlan } = useWorkout();
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ParsedWorkout[]>([]);
  const [busy, setBusy] = useState(false);

  const parse = (source = text) => {
    const result = parseWorkoutText(source);
    if (!result.length) return Alert.alert('Nothing recognised yet', 'Use one exercise per line, for example “Bench Press — 4 × 8”. You can correct everything before saving.');
    setPreview(result);
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'], copyToCacheDirectory: true });
    if (result.canceled) return;
    setBusy(true);
    try {
      const asset = result.assets[0];
      const extracted = await extractDocumentText({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, file: 'file' in asset ? asset.file : undefined });
      setFileName(asset.name);
      setText(extracted);
      const parsed = parseWorkoutText(extracted);
      if (!parsed.length) Alert.alert('Review the extracted text', 'The file opened, but no full exercise lines were detected. Correct the text below, then tap Analyse plan.');
      else setPreview(parsed);
    } catch (error) {
      Alert.alert('Could not read this file', error instanceof Error ? error.message : 'Paste the workout text instead.');
    } finally { setBusy(false); }
  };

  const updateWorkout = (id: string, field: 'name' | 'selected', value: string | boolean) => setPreview((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const updateExercise = (workoutId: string, exerciseId: string, field: 'name' | 'sets' | 'repTarget' | 'suggestedWeight' | 'restSeconds', value: string) => setPreview((items) => items.map((item) => item.id !== workoutId ? item : { ...item, exercises: item.exercises.map((exercise) => exercise.id !== exerciseId ? exercise : { ...exercise, [field]: ['sets', 'suggestedWeight', 'restSeconds'].includes(field) ? Number(value) || 0 : value }) }));
  const removeExercise = (workoutId: string, exerciseId: string) => setPreview((items) => items.map((item) => item.id !== workoutId ? item : { ...item, exercises: item.exercises.filter((exercise) => exercise.id !== exerciseId) }));

  const save = () => {
    const selected = preview.filter((item) => item.selected && item.exercises.length);
    if (!selected.length) return Alert.alert('Choose a workout', 'Select at least one reviewed workout to import.');
    selected.forEach((item) => {
      const plan: WorkoutPlan = { id: `imported-${Date.now()}-${item.id}`, name: item.name, focus: Array.from(new Set(item.exercises.map((exercise) => exercise.muscle))).slice(0, 3).join(' · '), durationMinutes: Math.max(30, Math.round(item.exercises.reduce((sum, exercise) => sum + exercise.sets * (exercise.restSeconds + 45), 0) / 60)), exercises: item.exercises, notes: `Imported from ${fileName || 'pasted text'} and reviewed before saving.`, createdAt: Date.now() };
      savePlan(plan);
    });
    router.replace('/programs' as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable><Text style={styles.headerTitle}>Import workout</Text><View style={styles.back} /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!preview.length ? <>
          <View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="document-text" size={32} color={colors.accent} /></View><Text style={styles.title}>Turn a document into a workout</Text><Text style={styles.subtitle}>Upload a PDF, DOCX or text file—or paste a plan. Nothing is saved until you review it.</Text></View>
          <Pressable disabled={busy} onPress={pickDocument} style={styles.uploadButton}><Ionicons name="cloud-upload-outline" size={22} color={colors.white} /><Text style={styles.uploadText}>{busy ? 'Reading document…' : 'Choose document'}</Text></Pressable>
          <View style={styles.orRow}><View style={styles.line} /><Text style={styles.or}>or paste text</Text><View style={styles.line} /></View>
          <TextInput multiline value={text} onChangeText={setText} placeholder={sample} placeholderTextColor={colors.textMuted} style={styles.textArea} textAlignVertical="top" />
          <Pressable onPress={() => parse()} style={styles.analyseButton}><Text style={styles.analyseText}>Analyse plan</Text><Ionicons name="arrow-forward" size={20} color={colors.white} /></Pressable>
        </> : <>
          <View style={styles.previewHeader}><View><Text style={styles.eyebrow}>Import preview</Text><Text style={styles.title}>Check every detail</Text><Text style={styles.subtitle}>Correct the detection below. Only selected workouts will be saved.</Text></View><Pressable onPress={() => setPreview([])} style={styles.changeFile}><Text style={styles.changeFileText}>Start over</Text></Pressable></View>
          {preview.map((workout) => <View key={workout.id} style={[styles.workoutCard, !workout.selected && styles.unselected]}>
            <View style={styles.workoutTop}><Pressable onPress={() => updateWorkout(workout.id, 'selected', !workout.selected)}><Ionicons name={workout.selected ? 'checkbox' : 'square-outline'} size={25} color={colors.accent} /></Pressable><TextInput value={workout.name} onChangeText={(value) => updateWorkout(workout.id, 'name', value)} style={styles.workoutName} /></View>
            {workout.exercises.map((exercise) => <View key={exercise.id} style={styles.exerciseRow}>
              <View style={styles.exerciseTop}><TextInput value={exercise.name} onChangeText={(value) => updateExercise(workout.id, exercise.id, 'name', value)} style={styles.exerciseName} /><Pressable onPress={() => removeExercise(workout.id, exercise.id)}><Ionicons name="close-circle" size={21} color={colors.danger} /></Pressable></View>
              <View style={styles.configRow}><View style={styles.field}><Text style={styles.fieldLabel}>Sets</Text><TextInput value={String(exercise.sets)} onChangeText={(value) => updateExercise(workout.id, exercise.id, 'sets', value)} keyboardType="number-pad" style={styles.fieldInput} /></View><View style={styles.field}><Text style={styles.fieldLabel}>Reps</Text><TextInput value={exercise.repTarget} onChangeText={(value) => updateExercise(workout.id, exercise.id, 'repTarget', value)} style={styles.fieldInput} /></View><View style={styles.field}><Text style={styles.fieldLabel}>Weight</Text><TextInput value={String(exercise.suggestedWeight || '')} onChangeText={(value) => updateExercise(workout.id, exercise.id, 'suggestedWeight', value)} keyboardType="decimal-pad" style={styles.fieldInput} /></View><View style={styles.field}><Text style={styles.fieldLabel}>Rest</Text><TextInput value={String(exercise.restSeconds)} onChangeText={(value) => updateExercise(workout.id, exercise.id, 'restSeconds', value)} keyboardType="number-pad" style={styles.fieldInput} /></View></View>
            </View>)}
          </View>)}
          <View style={styles.warning}><Ionicons name="information-circle" size={21} color="#A86600" /><Text style={styles.warningText}>Imported exercise names may not exactly match the library. Review them before saving.</Text></View>
          <Pressable onPress={save} style={styles.saveButton}><Text style={styles.saveText}>Save selected workouts</Text></Pressable>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  header: { width: '100%', maxWidth: 760, alignSelf: 'center', height: 66, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: 50 },
  hero: { alignItems: 'center', marginTop: 10 },
  heroIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -1.1, marginTop: 15 },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 6, textAlign: 'center', maxWidth: 480 },
  uploadButton: { height: 58, borderRadius: 17, backgroundColor: colors.accent, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  uploadText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  or: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  textArea: { minHeight: 220, borderRadius: 20, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, color: colors.text, fontSize: 13, lineHeight: 21 },
  analyseButton: { height: 56, borderRadius: 17, backgroundColor: colors.text, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  analyseText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  previewHeader: { alignItems: 'center', marginBottom: spacing.lg },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  changeFile: { marginTop: 10, padding: 8 },
  changeFileText: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  workoutCard: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.accentSoft, padding: 15, marginBottom: 13 },
  unselected: { opacity: 0.5 },
  workoutTop: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
  workoutName: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '900', borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 7 },
  exerciseRow: { paddingVertical: 12, borderTopWidth: 1, borderColor: colors.line },
  exerciseTop: { flexDirection: 'row', alignItems: 'center' },
  exerciseName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '800', paddingVertical: 5 },
  configRow: { flexDirection: 'row', gap: 7, marginTop: 7 },
  field: { flex: 1 },
  fieldLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  fieldInput: { height: 41, minWidth: 0, borderRadius: 11, backgroundColor: colors.ink, color: colors.text, textAlign: 'center', fontSize: 11 },
  warning: { borderRadius: 16, backgroundColor: colors.warmDim, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'center' },
  warningText: { flex: 1, color: '#7B5200', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  saveButton: { height: 58, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  saveText: { color: colors.white, fontSize: 15, fontWeight: '900' },
});
