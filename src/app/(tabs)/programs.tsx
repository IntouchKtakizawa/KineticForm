import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { builtInTemplates } from '@/data/templates';
import { WorkoutCategory, workoutCatalog, workoutCategories } from '@/data/workout-catalog';
import { useWorkout } from '@/store/workout-store';
import { WorkoutPlan, WorkoutTemplate } from '@/types/workout';
import { confirmAction, showMessage } from '@/utils/alerts';
import { downloadHistoryCsv, exportWorkoutPdf } from '@/utils/export-workout';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ProgramsScreen() {
  const { plans, programs, history, schedule, preferences, onboardingComplete, activeWorkout, startWorkout, savePlan, duplicatePlan, removePlan, importTemplate } = useWorkout();
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [category, setCategory] = useState<WorkoutCategory>('All');
  const [showTools, setShowTools] = useState(false);
  const [referenceNow] = useState(() => Date.now());
  const savedIds = useMemo(() => new Set(plans.map((plan) => plan.id)), [plans]);
  const catalog = useMemo(() => workoutCatalog
    .filter((item) => category === 'All' || item.category === category)
    .sort((a, b) => {
      if (!onboardingComplete) return 0;
      const score = (item: typeof a) => {
        const equipmentMatch = preferences.equipment.some((equipment) => item.equipment.toLowerCase().includes(equipment.toLowerCase()));
        const timeMatch = item.plan.durationMinutes <= preferences.sessionMinutes + 5;
        const goalMatch = preferences.goal.toLowerCase().includes('strength') ? item.category !== 'Cardio' : true;
        return Number(equipmentMatch) * 3 + Number(timeMatch) * 2 + Number(goalMatch);
      };
      return score(b) - score(a);
    }), [category, onboardingComplete, preferences.equipment, preferences.goal, preferences.sessionMinutes]);

  const scheduledPlans = (days: number) => {
    const end = referenceNow + days * 86400000;
    const ids = schedule.filter((item) => new Date(item.startISO).getTime() <= end).map((item) => item.planId);
    const result = ids.map((id) => plans.find((plan) => plan.id === id)).filter((plan): plan is WorkoutPlan => Boolean(plan));
    return result.length ? result : plans;
  };
  const remove = async (id: string, name: string) => {
    const confirmed = await confirmAction({ title: 'Delete workout?', message: `${name} and its scheduled sessions will be removed.`, confirmText: 'Delete', cancelText: 'Keep', destructive: true });
    if (confirmed) removePlan(id);
  };
  const addWorkout = (plan: WorkoutPlan) => {
    savePlan({ ...plan, createdAt: referenceNow, exercises: plan.exercises.map((exercise) => ({ ...exercise })) });
    showMessage('Workout added', `${plan.name} is now in My workouts, ready to start or edit.`);
  };
  const addProgram = (template: WorkoutTemplate) => {
    importTemplate(template);
    showMessage('Program ready', `${template.name} and its weekly schedule are ready. You can change any workout or date.`);
  };
  const launchWorkout = (plan: WorkoutPlan) => {
    if (activeWorkout && activeWorkout.planId !== plan.id) {
      confirmAction({ title: 'Workout already in progress', message: `${activeWorkout.name} is still open. Finish or leave it before starting ${plan.name}.`, confirmText: 'Continue current', cancelText: 'Stay here' }).then((confirmed) => { if (confirmed) router.push('/workout'); });
      return;
    }
    startWorkout(plan.id);
    router.push('/workout');
  };

  return (
    <Screen>
      <View style={styles.titleRow}><View style={styles.titleCopy}><Text style={styles.eyebrow}>Workout studio</Text><Text style={styles.title}>Choose. Train. Repeat.</Text><Text style={styles.subtitle}>Start with a full program or add one workout at a time.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Create workout" onPress={() => router.push('/builder' as never)} style={styles.addButton}><Ionicons name="add" size={25} color={colors.white} /></Pressable></View>

      <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Programs</Text><Text style={styles.sectionHint}>A complete week, already organized</Text></View><Text style={styles.count}>{builtInTemplates.length} choices</Text></View>
      <View style={styles.templateList}>{builtInTemplates.map((template, index) => {
        const isExpanded = expandedTemplate === template.id;
        const imported = programs.some((item) => item.id === template.id);
        const durationValues = template.plans.map((plan) => plan.durationMinutes);
        return (
          <View key={template.id} style={[styles.templateCard, index === 1 && styles.templateCardGreen, index === 2 && styles.templateCardWarm]}>
            <View style={styles.templateTop}><View style={styles.templateIcon}><Ionicons name={index === 0 ? 'sparkles' : index === 1 ? 'leaf' : 'barbell'} size={22} color={colors.accent} /></View><View style={styles.templateCopy}><Text style={styles.templateName}>{template.name}</Text><Text style={styles.templateMeta}>{template.weeklyGoal} days/week · {Math.min(...durationValues)}–{Math.max(...durationValues)} min</Text></View>{imported ? <View style={styles.savedPill}><Ionicons name="checkmark" size={13} color={colors.success} /><Text style={styles.savedPillText}>Added</Text></View> : null}</View>
            <Text style={styles.templateDescription}>{template.description}</Text>
            <View style={styles.templateActions}><Pressable accessibilityRole="button" accessibilityState={{ expanded: isExpanded }} onPress={() => setExpandedTemplate(isExpanded ? null : template.id)} style={styles.previewButton}><Text style={styles.previewButtonText}>{isExpanded ? 'Hide week' : 'See the week'}</Text><Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={17} color={colors.text} /></Pressable><Pressable accessibilityRole="button" onPress={() => addProgram(template)} style={styles.importButton}><Text style={styles.importButtonText}>{imported ? 'Refresh program' : 'Add program'}</Text></Pressable></View>
            {isExpanded ? <View style={styles.templateDetails}>
              {template.schedule.map((item) => {
                const optionalPlan = item.optional ? template.plans.find((plan) => plan.id === item.planId) : undefined;
                return <View key={`${template.id}-${item.day}`}><View style={styles.scheduleRow}><Text style={styles.scheduleDay}>{dayNames[item.day]}</Text><Text style={[styles.scheduleWorkout, (item.optional || item.rest) && styles.mutedWorkout]}>{item.label}{item.optional ? ' · optional' : ''}</Text><Text style={styles.scheduleDuration}>{item.duration}</Text></View>{optionalPlan ? <View style={styles.optionalRoutine}>{optionalPlan.exercises.map((exercise) => <View key={`${item.day}-${exercise.id}`} style={styles.optionalExercise}><Text numberOfLines={1} style={styles.optionalExerciseName}>{exercise.name}</Text><Text style={styles.optionalExerciseAmount}>{exercise.type === 'Cardio' || exercise.type === 'Duration' ? exercise.repTarget : `${exercise.setTarget ?? exercise.sets} × ${exercise.repTarget}`}</Text></View>)}</View> : null}</View>;
              })}
              <Text style={styles.detailHeading}>How to progress</Text>{template.progression.map((item) => <Text key={item} style={styles.guidance}>• {item}</Text>)}
            </View> : null}
          </View>
        );
      })}</View>

      <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Workout library</Text><Text style={styles.sectionHint}>Add only what you want</Text></View><Text style={styles.count}>{workoutCatalog.length} workouts</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{workoutCategories.map((item) => <Pressable accessibilityRole="button" accessibilityState={{ selected: category === item }} key={item} onPress={() => setCategory(item)} style={[styles.filterChip, category === item && styles.filterChipActive]}><Text style={[styles.filterText, category === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>
      <View style={styles.catalogList}>{catalog.map(({ plan, equipment, level, color }, catalogIndex) => {
        const saved = savedIds.has(plan.id);
        return <View key={plan.id} style={styles.catalogCard}><View style={[styles.catalogAccent, color === 'green' && styles.catalogAccentGreen, color === 'warm' && styles.catalogAccentWarm]} /><View style={styles.catalogBody}><View style={styles.catalogTop}><View style={styles.catalogCopy}><View style={styles.catalogNameRow}><Text style={styles.catalogName}>{plan.name}</Text>{onboardingComplete && catalogIndex === 0 ? <Text style={styles.matchBadge}>BEST MATCH</Text> : null}</View><Text style={styles.catalogMeta}>{plan.durationMinutes} min · {plan.exercises.length} moves</Text></View><View style={styles.levelPill}><Text style={styles.levelText}>{level}</Text></View></View><Text style={styles.catalogFocus}>{plan.focus}</Text><View style={styles.catalogFooter}><Text style={styles.equipment}>{equipment}</Text>{saved ? <Pressable accessibilityRole="button" accessibilityLabel={`${activeWorkout?.planId === plan.id ? 'Continue' : 'Start'} ${plan.name}`} onPress={() => launchWorkout(plan)} style={styles.startSmall}><Ionicons name="play" size={15} color={colors.white} /><Text style={styles.startSmallText}>{activeWorkout?.planId === plan.id ? 'Continue' : 'Start'}</Text></Pressable> : <Pressable accessibilityRole="button" accessibilityLabel={`Add ${plan.name} to my workouts`} onPress={() => addWorkout(plan)} style={styles.addSmall}><Ionicons name="add" size={17} color={colors.accent} /><Text style={styles.addSmallText}>Add</Text></Pressable>}</View></View></View>;
      })}</View>

      <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>My workouts</Text><Text style={styles.sectionHint}>Your saved and editable sessions</Text></View><Text style={styles.count}>{plans.length}</Text></View>
      <View style={styles.list}>{plans.map((plan, planIndex) => (
        <View key={plan.id} style={styles.planCard}>
          <View style={styles.planTop}><View style={[styles.planBadge, planIndex % 2 === 1 && styles.planBadgeWarm]}><Ionicons name="barbell" size={22} color={colors.text} /></View><View style={styles.planCopy}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.planMeta}>{plan.exercises.length} moves · {plan.durationMinutes} min · {plan.focus}</Text></View></View>
          <View style={styles.preview}>{plan.exercises.slice(0, 3).map((exercise, index) => <View key={`${exercise.id}-${index}`} style={styles.previewRow}><Text style={styles.previewIndex}>{index + 1}</Text><Text numberOfLines={1} style={styles.previewName}>{exercise.name}</Text><Text style={styles.previewSets}>{exercise.setTarget ?? exercise.sets} × {exercise.repTarget}</Text></View>)}{plan.exercises.length > 3 ? <Text style={styles.more}>+ {plan.exercises.length - 3} more</Text> : null}</View>
          <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={`${activeWorkout?.planId === plan.id ? 'Continue' : 'Start'} ${plan.name}`} onPress={() => launchWorkout(plan)} style={styles.startButton}><Ionicons name="play" size={17} color={colors.white} /><Text style={styles.startText}>{activeWorkout?.planId === plan.id ? 'Continue' : 'Start'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Edit ${plan.name}`} onPress={() => router.push({ pathname: '/builder', params: { id: plan.id } } as never)} style={styles.actionButton}><Ionicons name="create-outline" size={18} color={colors.text} /><Text style={styles.actionText}>Edit</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Duplicate ${plan.name}`} onPress={() => duplicatePlan(plan.id)} style={styles.iconButton}><Ionicons name="copy-outline" size={19} color={colors.textMuted} /></Pressable>{plans.length > 1 ? <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${plan.name}`} onPress={() => remove(plan.id, plan.name)} style={styles.iconButton}><Ionicons name="trash-outline" size={19} color={colors.danger} /></Pressable> : null}</View>
        </View>
      ))}</View>

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showTools }} onPress={() => setShowTools((value) => !value)} style={styles.toolsToggle}><View style={styles.toolsToggleIcon}><Ionicons name="folder-open-outline" size={20} color={colors.accent} /></View><View style={styles.toolsToggleCopy}><Text style={styles.toolsToggleTitle}>Import, export & tools</Text><Text style={styles.toolsToggleText}>PDFs and training history</Text></View><Ionicons name={showTools ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} /></Pressable>
      {showTools ? <View style={styles.toolsPanel}>
        <ToolRow icon="document-text-outline" label="Import a plan from PDF, DOCX or text" onPress={() => router.push('/import' as never)} />
        <ToolRow icon="download-outline" label="Export all workouts as PDF" onPress={() => exportWorkoutPdf('Workout Program', plans)} />
        <ToolRow icon="calendar-outline" label="Export this week as PDF" onPress={() => exportWorkoutPdf('Weekly Training Plan', scheduledPlans(7))} />
        <ToolRow icon="calendar-number-outline" label="Export this month as PDF" onPress={() => exportWorkoutPdf('Monthly Training Plan', scheduledPlans(30))} />
        <ToolRow icon="time-outline" label="Export training history as PDF" onPress={() => exportWorkoutPdf('Workout History', [], history)} />
        <ToolRow icon="grid-outline" label="Download raw history CSV" onPress={() => { try { downloadHistoryCsv(history); } catch (error) { showMessage('CSV export', error instanceof Error ? error.message : 'Export failed.'); } }} />
      </View> : null}
    </Screen>
  );
}

function ToolRow({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.toolRow}><Ionicons name={icon} size={20} color={colors.accent} /><Text style={styles.toolRowText}>{label}</Text><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>;
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  titleCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 31, lineHeight: 35, fontWeight: '900', letterSpacing: -1.1, marginTop: 5 },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 7 },
  addButton: { width: 50, height: 50, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.xl, marginBottom: 13 },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '900' }, sectionHint: { color: colors.textMuted, fontSize: 10, marginTop: 3 }, count: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  templateList: { gap: 11 }, templateCard: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accentSoft, padding: 16 }, templateCardGreen: { borderColor: '#BDE8D2' }, templateCardWarm: { borderColor: '#F4D9A8' },
  templateTop: { flexDirection: 'row', alignItems: 'center' }, templateIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, templateCopy: { flex: 1, minWidth: 0 }, templateName: { color: colors.text, fontSize: 17, fontWeight: '900' }, templateMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  savedPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.successDim }, savedPillText: { color: colors.success, fontSize: 9, fontWeight: '900' }, templateDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 12 },
  templateActions: { flexDirection: 'row', gap: 8, marginTop: 14 }, previewButton: { flex: 1, height: 46, borderRadius: 14, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, previewButtonText: { color: colors.text, fontSize: 12, fontWeight: '900' }, importButton: { flex: 1.15, height: 46, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, importButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  templateDetails: { borderTopWidth: 1, borderColor: colors.line, marginTop: 16, paddingTop: 8 }, scheduleRow: { minHeight: 37, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line }, scheduleDay: { width: 78, color: colors.textMuted, fontSize: 10, fontWeight: '800' }, scheduleWorkout: { flex: 1, color: colors.text, fontSize: 10, fontWeight: '800' }, mutedWorkout: { color: colors.textMuted }, scheduleDuration: { color: colors.textMuted, fontSize: 9 },
  optionalRoutine: { backgroundColor: colors.warmDim, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 }, optionalExercise: { minHeight: 26, flexDirection: 'row', alignItems: 'center', gap: 6 }, optionalExerciseName: { flex: 1, color: colors.text, fontSize: 9, fontWeight: '700' }, optionalExerciseAmount: { color: colors.textMuted, fontSize: 8 }, detailHeading: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 13, marginBottom: 7 }, guidance: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginBottom: 5 },
  filters: { gap: 8, paddingBottom: 13 }, filterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }, filterChipActive: { backgroundColor: colors.accent, borderColor: colors.accent }, filterText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' }, filterTextActive: { color: colors.white },
  catalogList: { gap: 9 }, catalogCard: { minHeight: 124, flexDirection: 'row', overflow: 'hidden', borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }, catalogAccent: { width: 6, backgroundColor: colors.accent }, catalogAccentGreen: { backgroundColor: colors.success }, catalogAccentWarm: { backgroundColor: colors.warm }, catalogBody: { flex: 1, minWidth: 0, padding: 14 }, catalogTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, catalogCopy: { flex: 1, minWidth: 0 }, catalogNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, catalogName: { flexShrink: 1, color: colors.text, fontSize: 16, fontWeight: '900' }, matchBadge: { color: colors.success, backgroundColor: colors.successDim, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 3, fontSize: 7, fontWeight: '900' }, catalogMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 }, levelPill: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 5 }, levelText: { color: colors.textMuted, fontSize: 8, fontWeight: '800' }, catalogFocus: { color: colors.textMuted, fontSize: 11, marginTop: 9 }, catalogFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, equipment: { color: colors.text, fontSize: 10, fontWeight: '800' },
  addSmall: { height: 34, paddingHorizontal: 12, borderRadius: 11, backgroundColor: colors.accentDim, flexDirection: 'row', alignItems: 'center', gap: 3 }, addSmallText: { color: colors.accent, fontSize: 11, fontWeight: '900' }, startSmall: { height: 34, paddingHorizontal: 12, borderRadius: 11, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', gap: 4 }, startSmallText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  list: { gap: 11 }, planCard: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 15 }, planTop: { flexDirection: 'row', alignItems: 'center' }, planBadge: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentDim, marginRight: 11 }, planBadgeWarm: { backgroundColor: colors.warmDim }, planCopy: { flex: 1, minWidth: 0 }, planName: { color: colors.text, fontSize: 17, fontWeight: '900' }, planMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  preview: { marginTop: 13, borderTopWidth: 1, borderColor: colors.line, paddingTop: 7 }, previewRow: { height: 33, flexDirection: 'row', alignItems: 'center' }, previewIndex: { width: 22, color: colors.accent, fontSize: 10, fontWeight: '900' }, previewName: { flex: 1, minWidth: 0, color: colors.text, fontSize: 11, fontWeight: '700' }, previewSets: { color: colors.textMuted, fontSize: 9, marginLeft: 6 }, more: { color: colors.textMuted, fontSize: 9, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 7, marginTop: 13 }, startButton: { height: 43, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', gap: 6 }, startText: { color: colors.white, fontSize: 12, fontWeight: '900' }, actionButton: { height: 43, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 5 }, actionText: { color: colors.text, fontSize: 12, fontWeight: '800' }, iconButton: { width: 42, height: 43, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  toolsToggle: { minHeight: 72, marginTop: spacing.xl, borderRadius: 18, paddingHorizontal: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center' }, toolsToggleIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, toolsToggleCopy: { flex: 1 }, toolsToggleTitle: { color: colors.text, fontSize: 13, fontWeight: '900' }, toolsToggleText: { color: colors.textMuted, fontSize: 10, marginTop: 3 }, toolsPanel: { marginTop: 8, borderRadius: 18, paddingHorizontal: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }, toolRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line }, toolRowText: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '800' },
});
