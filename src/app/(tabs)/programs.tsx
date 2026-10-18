import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { kentaWorkoutTemplate } from '@/data/templates';
import { useWorkout } from '@/store/workout-store';
import { downloadHistoryCsv, exportWorkoutPdf } from '@/utils/export-workout';

export default function ProgramsScreen() {
  const { plans, programs, history, schedule, startWorkout, duplicatePlan, removePlan, saveProgram, importTemplate } = useWorkout();
  const [showTemplate, setShowTemplate] = useState(false);
  const [referenceNow] = useState(() => Date.now());
  const scheduledPlans = (days: number) => {
    const end = referenceNow + days * 86400000;
    const ids = schedule.filter((item) => new Date(item.startISO).getTime() <= end).map((item) => item.planId);
    const result = ids.map((id) => plans.find((plan) => plan.id === id)).filter((plan): plan is NonNullable<typeof plan> => Boolean(plan));
    return result.length ? result : plans;
  };
  const remove = (id: string, name: string) => Alert.alert('Delete workout?', `${name} and its scheduled sessions will be removed.`, [{ text: 'Keep', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removePlan(id) }]);

  return (
    <Screen>
      <View style={styles.titleRow}><View><Text style={styles.eyebrow}>Workout studio</Text><Text style={styles.title}>Your programs</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Create workout" onPress={() => router.push('/builder' as never)} style={styles.addButton}><Ionicons name="add" size={25} color={colors.white} /></Pressable></View>

      <View style={styles.tools}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/import' as never)} style={[styles.toolCard, styles.importCard]}><View style={styles.toolIcon}><Ionicons name="document-text" size={22} color={colors.accent} /></View><Text style={styles.toolTitle}>Import plan</Text><Text style={styles.toolText}>PDF, DOCX or text</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => exportWorkoutPdf('Workout Program', plans)} style={[styles.toolCard, styles.exportCard]}><View style={[styles.toolIcon, styles.exportIcon]}><Ionicons name="download" size={22} color={colors.success} /></View><Text style={styles.toolTitle}>Export all</Text><Text style={styles.toolText}>Print or save PDF</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => exportWorkoutPdf('Workout History', [], history)} style={[styles.toolCard, styles.historyCard]}><View style={[styles.toolIcon, styles.historyIcon]}><Ionicons name="time" size={22} color="#C87500" /></View><Text style={styles.toolTitle}>History</Text><Text style={styles.toolText}>Export training log</Text></Pressable>
      </View>
      <View style={styles.planExports}><Pressable accessibilityRole="button" onPress={() => exportWorkoutPdf('Weekly Training Plan', scheduledPlans(7))} style={styles.planExportButton}><Ionicons name="calendar-outline" size={18} color={colors.accent} /><Text style={styles.planExportText}>Weekly PDF</Text></Pressable><Pressable accessibilityRole="button" onPress={() => exportWorkoutPdf('Monthly Training Plan', scheduledPlans(30))} style={styles.planExportButton}><Ionicons name="calendar-number-outline" size={18} color={colors.accent} /><Text style={styles.planExportText}>Monthly PDF</Text></Pressable></View>
      <Pressable accessibilityRole="button" onPress={() => { try { downloadHistoryCsv(history); } catch (error) { Alert.alert('CSV export', error instanceof Error ? error.message : 'Export failed.'); } }} style={[styles.planExportButton, { marginTop: 9 }]}><Ionicons name="grid-outline" size={18} color={colors.accent} /><Text style={styles.planExportText}>Download raw history CSV</Text></Pressable>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Built-in templates</Text><Text style={styles.count}>Ready to import</Text></View>
      <View style={styles.templateCard}>
        <View style={styles.templateTop}><View style={styles.templateIcon}><Ionicons name="sparkles" size={22} color={colors.accent} /></View><View style={styles.templateCopy}><Text style={styles.templateName}>{kentaWorkoutTemplate.name}</Text><Text style={styles.templateMeta}>3 main workouts · 1 optional Flex day · dumbbells</Text></View></View>
        <Text style={styles.templateDescription}>{kentaWorkoutTemplate.description}</Text>
        <View style={styles.templateStats}><View style={styles.templateStat}><Text style={styles.templateStatValue}>3</Text><Text style={styles.templateStatLabel}>weekly goal</Text></View><View style={styles.templateStat}><Text style={styles.templateStatValue}>4</Text><Text style={styles.templateStatLabel}>workouts</Text></View><View style={styles.templateStat}><Text style={styles.templateStatValue}>20–60</Text><Text style={styles.templateStatLabel}>minutes</Text></View></View>
        <View style={styles.templateActions}><Pressable accessibilityRole="button" accessibilityState={{ expanded: showTemplate }} onPress={() => setShowTemplate((value) => !value)} style={styles.previewButton}><Text style={styles.previewButtonText}>{showTemplate ? 'Hide details' : 'Preview plan'}</Text><Ionicons name={showTemplate ? 'chevron-up' : 'chevron-down'} size={17} color={colors.text} /></Pressable><Pressable accessibilityRole="button" onPress={() => { importTemplate(kentaWorkoutTemplate); Alert.alert('Template imported', 'Full Body A, B, C and Optional Flex are saved, with the weekly schedule ready in Plan.'); }} style={styles.importButton}><Ionicons name="download-outline" size={17} color={colors.white} /><Text style={styles.importButtonText}>{programs.some((item) => item.id === kentaWorkoutTemplate.id) ? 'Update import' : 'Import template'}</Text></Pressable></View>
        {showTemplate ? <View style={styles.templateDetails}>
          <Text style={styles.detailHeading}>Weekly schedule</Text>
          {kentaWorkoutTemplate.schedule.map((item) => <View key={item.day} style={styles.scheduleRow}><Text style={styles.scheduleDay}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][item.day]}</Text><Text style={[styles.scheduleWorkout, item.optional && styles.optionalText]}>{item.label}{item.optional ? ' · optional' : ''}</Text><Text style={styles.scheduleDuration}>{item.duration}</Text></View>)}
          <Text style={styles.flexRule}>Choose Tuesday OR Thursday for Flex. Skipping either optional entry never counts as a missed workout.</Text>
          {kentaWorkoutTemplate.plans.map((plan) => <View key={plan.id} style={styles.templateWorkout}><Text style={styles.templateWorkoutName}>{plan.name}</Text><Text style={styles.templateWorkoutMeta}>{plan.durationMinutes} min · {plan.exercises.length} exercises</Text>{plan.exercises.map((exercise) => <View key={exercise.id} style={styles.templateExercise}><Text style={styles.templateExerciseName}>{exercise.name}</Text><Text style={styles.templateExerciseTarget}>{exercise.setTarget ?? exercise.sets} × {exercise.repTarget}</Text></View>)}</View>)}
          <Text style={styles.detailHeading}>Progress safely</Text>{kentaWorkoutTemplate.progression.map((item) => <Text key={item} style={styles.guidance}>• {item}</Text>)}
          <Text style={styles.detailHeading}>Rest guidance</Text>{kentaWorkoutTemplate.restGuidance.map((item) => <Text key={item} style={styles.guidance}>• {item}</Text>)}
        </View> : null}
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Programs</Text><Pressable accessibilityRole="button" onPress={() => saveProgram({ id: `program-${Date.now()}`, name: `My ${plans.length}-workout program`, description: 'A flexible collection of reusable workouts. Schedule individual sessions when ready.', workoutIds: plans.map((plan) => plan.id), createdAt: Date.now() })}><Text style={styles.createProgram}>Create from workouts</Text></Pressable></View>
      {programs.length ? <View style={styles.programList}>{programs.map((program) => <View key={program.id} style={styles.programCard}><Text style={styles.programName}>{program.name}</Text><Text style={styles.toolText}>{program.workoutIds.length} workouts{program.weeklyGoal ? ` · ${program.weeklyGoal} required per week` : ' · flexible schedule'}</Text><Text style={styles.programDescription}>{program.description}</Text></View>)}</View> : <View style={styles.programEmpty}><Text style={styles.toolText}>Group templates into a reusable program without changing completed history.</Text></View>}

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Saved workouts</Text><Text style={styles.count}>{plans.length} templates</Text></View>
      <View style={styles.list}>
        {plans.map((plan, planIndex) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planTop}><View style={[styles.planBadge, planIndex % 2 === 1 && styles.planBadgeWarm]}><Ionicons name="barbell" size={22} color={colors.text} /></View><View style={styles.planCopy}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.planMeta}>{plan.exercises.length} exercises · {plan.durationMinutes} min · {plan.focus}</Text></View></View>
            <View style={styles.preview}>{plan.exercises.slice(0, 4).map((exercise, index) => <View key={`${exercise.id}-${index}`} style={styles.previewRow}><Text style={styles.previewIndex}>{index + 1}</Text><Text style={styles.previewName}>{exercise.name}</Text><Text style={styles.previewSets}>{exercise.setTarget ?? exercise.sets} × {exercise.repTarget}</Text></View>)}{plan.exercises.length > 4 ? <Text style={styles.more}>+ {plan.exercises.length - 4} more exercises</Text> : null}</View>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={() => { startWorkout(plan.id); router.push('/workout'); }} style={styles.startButton}><Ionicons name="play" size={17} color={colors.white} /><Text style={styles.startText}>Start</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/builder', params: { id: plan.id } } as never)} style={styles.actionButton}><Ionicons name="create-outline" size={18} color={colors.text} /><Text style={styles.actionText}>Edit</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Duplicate ${plan.name}`} onPress={() => duplicatePlan(plan.id)} style={styles.iconButton}><Ionicons name="copy-outline" size={19} color={colors.textMuted} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Export ${plan.name}`} onPress={() => exportWorkoutPdf(plan.name, [plan])} style={styles.iconButton}><Ionicons name="download-outline" size={19} color={colors.textMuted} /></Pressable>
              {plans.length > 1 ? <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${plan.name}`} onPress={() => remove(plan.id, plan.name)} style={styles.iconButton}><Ionicons name="trash-outline" size={19} color={colors.danger} /></Pressable> : null}
            </View>
          </View>
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
  tools: { flexDirection: 'row', gap: 9, marginTop: spacing.lg },
  toolCard: { flex: 1, minHeight: 132, borderRadius: 19, padding: 13 },
  importCard: { backgroundColor: colors.accentDim },
  exportCard: { backgroundColor: colors.successDim },
  historyCard: { backgroundColor: colors.warmDim },
  toolIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  exportIcon: { backgroundColor: colors.surface },
  historyIcon: { backgroundColor: colors.surface },
  toolTitle: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 12 },
  toolText: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  planExports: { flexDirection: 'row', gap: 9, marginTop: 9 },
  planExportButton: { flex: 1, height: 47, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  planExportText: { color: colors.text, fontSize: 12, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: 13 },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '900' },
  count: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  list: { gap: 13 },
  planCard: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 16 },
  planTop: { flexDirection: 'row', alignItems: 'center' },
  planBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentDim, marginRight: 12 },
  planBadgeWarm: { backgroundColor: colors.warmDim },
  planCopy: { flex: 1 },
  planName: { color: colors.text, fontSize: 18, fontWeight: '900' },
  planMeta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  preview: { marginTop: 14, borderTopWidth: 1, borderColor: colors.line, paddingTop: 8 },
  previewRow: { height: 35, flexDirection: 'row', alignItems: 'center' },
  previewIndex: { width: 24, color: colors.accent, fontSize: 11, fontWeight: '900' },
  previewName: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '700' },
  previewSets: { color: colors.textMuted, fontSize: 11 },
  more: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  actions: { flexDirection: 'row', gap: 7, marginTop: 15 },
  startButton: { height: 44, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', gap: 6 },
  startText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  actionButton: { height: 44, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  iconButton: { width: 42, height: 44, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  createProgram: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  programList: { gap: 9 },
  programCard: { padding: 15, borderRadius: radius.md, backgroundColor: colors.accentDim },
  programName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  programDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 8 },
  programEmpty: { padding: 15, borderRadius: radius.md, backgroundColor: colors.surface },
  templateCard: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accentSoft, padding: 16 },
  templateTop: { flexDirection: 'row', alignItems: 'center' },
  templateIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  templateCopy: { flex: 1 },
  templateName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  templateMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  templateDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 13 },
  templateStats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  templateStat: { flex: 1, backgroundColor: colors.ink, borderRadius: 13, padding: 10 },
  templateStatValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  templateStatLabel: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
  templateActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  previewButton: { flex: 1, height: 46, borderRadius: 14, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  previewButtonText: { color: colors.text, fontSize: 12, fontWeight: '900' },
  importButton: { flex: 1.25, height: 46, borderRadius: 14, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  importButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  templateDetails: { borderTopWidth: 1, borderColor: colors.line, marginTop: 16, paddingTop: 14 },
  detailHeading: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 11, marginBottom: 7 },
  scheduleRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  scheduleDay: { width: 82, color: colors.textMuted, fontSize: 10, fontWeight: '800' },
  scheduleWorkout: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '800' },
  optionalText: { color: '#C87500' },
  scheduleDuration: { color: colors.textMuted, fontSize: 10 },
  flexRule: { color: colors.textMuted, fontSize: 10, lineHeight: 15, backgroundColor: colors.warmDim, borderRadius: 12, padding: 10, marginTop: 9 },
  templateWorkout: { backgroundColor: colors.ink, borderRadius: 14, padding: 12, marginTop: 9 },
  templateWorkoutName: { color: colors.text, fontSize: 13, fontWeight: '900' },
  templateWorkoutMeta: { color: colors.textMuted, fontSize: 9, marginTop: 3, marginBottom: 6 },
  templateExercise: { minHeight: 28, flexDirection: 'row', alignItems: 'center' },
  templateExerciseName: { flex: 1, color: colors.text, fontSize: 10 },
  templateExerciseTarget: { color: colors.textMuted, fontSize: 10 },
  guidance: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginBottom: 5 },
});
