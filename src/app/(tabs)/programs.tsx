import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout } from '@/store/workout-store';
import { exportWorkoutPdf } from '@/utils/export-workout';

export default function ProgramsScreen() {
  const { plans, history, schedule, startWorkout, duplicatePlan, removePlan } = useWorkout();
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
      <View style={styles.titleRow}><View><Text style={styles.eyebrow}>Workout studio</Text><Text style={styles.title}>Your programs</Text></View><Pressable accessibilityLabel="Create workout" onPress={() => router.push('/builder' as never)} style={styles.addButton}><Ionicons name="add" size={25} color={colors.white} /></Pressable></View>

      <View style={styles.tools}>
        <Pressable onPress={() => router.push('/import' as never)} style={[styles.toolCard, styles.importCard]}><View style={styles.toolIcon}><Ionicons name="document-text" size={22} color={colors.accent} /></View><Text style={styles.toolTitle}>Import plan</Text><Text style={styles.toolText}>PDF, DOCX or text</Text></Pressable>
        <Pressable onPress={() => exportWorkoutPdf('Workout Program', plans)} style={[styles.toolCard, styles.exportCard]}><View style={[styles.toolIcon, styles.exportIcon]}><Ionicons name="download" size={22} color={colors.success} /></View><Text style={styles.toolTitle}>Export all</Text><Text style={styles.toolText}>Print or save PDF</Text></Pressable>
        <Pressable onPress={() => exportWorkoutPdf('Workout History', [], history)} style={[styles.toolCard, styles.historyCard]}><View style={[styles.toolIcon, styles.historyIcon]}><Ionicons name="time" size={22} color="#C87500" /></View><Text style={styles.toolTitle}>History</Text><Text style={styles.toolText}>Export training log</Text></Pressable>
      </View>
      <View style={styles.planExports}><Pressable onPress={() => exportWorkoutPdf('Weekly Training Plan', scheduledPlans(7))} style={styles.planExportButton}><Ionicons name="calendar-outline" size={18} color={colors.accent} /><Text style={styles.planExportText}>Weekly PDF</Text></Pressable><Pressable onPress={() => exportWorkoutPdf('Monthly Training Plan', scheduledPlans(30))} style={styles.planExportButton}><Ionicons name="calendar-number-outline" size={18} color={colors.accent} /><Text style={styles.planExportText}>Monthly PDF</Text></Pressable></View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Saved workouts</Text><Text style={styles.count}>{plans.length} templates</Text></View>
      <View style={styles.list}>
        {plans.map((plan, planIndex) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planTop}><View style={[styles.planBadge, planIndex % 2 === 1 && styles.planBadgeWarm]}><Ionicons name="barbell" size={22} color={colors.text} /></View><View style={styles.planCopy}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.planMeta}>{plan.exercises.length} exercises · {plan.durationMinutes} min · {plan.focus}</Text></View></View>
            <View style={styles.preview}>{plan.exercises.slice(0, 4).map((exercise, index) => <View key={`${exercise.id}-${index}`} style={styles.previewRow}><Text style={styles.previewIndex}>{index + 1}</Text><Text style={styles.previewName}>{exercise.name}</Text><Text style={styles.previewSets}>{exercise.sets} × {exercise.repTarget}</Text></View>)}{plan.exercises.length > 4 ? <Text style={styles.more}>+ {plan.exercises.length - 4} more exercises</Text> : null}</View>
            <View style={styles.actions}>
              <Pressable onPress={() => { startWorkout(plan.id); router.push('/workout'); }} style={styles.startButton}><Ionicons name="play" size={17} color={colors.white} /><Text style={styles.startText}>Start</Text></Pressable>
              <Pressable onPress={() => router.push({ pathname: '/builder', params: { id: plan.id } } as never)} style={styles.actionButton}><Ionicons name="create-outline" size={18} color={colors.text} /><Text style={styles.actionText}>Edit</Text></Pressable>
              <Pressable accessibilityLabel={`Duplicate ${plan.name}`} onPress={() => duplicatePlan(plan.id)} style={styles.iconButton}><Ionicons name="copy-outline" size={19} color={colors.textMuted} /></Pressable>
              <Pressable accessibilityLabel={`Export ${plan.name}`} onPress={() => exportWorkoutPdf(plan.name, [plan])} style={styles.iconButton}><Ionicons name="download-outline" size={19} color={colors.textMuted} /></Pressable>
              {plans.length > 1 ? <Pressable accessibilityLabel={`Delete ${plan.name}`} onPress={() => remove(plan.id, plan.name)} style={styles.iconButton}><Ionicons name="trash-outline" size={19} color={colors.danger} /></Pressable> : null}
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
});
