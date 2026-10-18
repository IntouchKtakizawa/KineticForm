import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Screen, SectionHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout } from '@/store/workout-store';

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProgressScreen() {
  const { history, schedule, weightUnit } = useWorkout();
  const totalSets = history.reduce((sum, session) => sum + session.completedSets, 0);
  const totalMinutes = Math.round(history.reduce((sum, session) => sum + session.durationSeconds, 0) / 60);
  const recent = history.slice(0, 8).reverse();
  const maxVolume = Math.max(1, ...recent.map((session) => session.totalVolume));
  const planned = schedule.filter((item) => !item.optional && item.status !== 'missed').length;
  const completedPlanned = schedule.filter((item) => !item.optional && item.status === 'completed').length;
  const bestSet = history.flatMap((session) => session.exercises).flatMap((exercise) => exercise.logs.map((set) => ({ name: exercise.name, weight: Number(set.weight) || 0, reps: Number(set.reps) || 0 }))).sort((a, b) => b.weight - a.weight)[0];

  return (
    <Screen>
      <View style={styles.titleIcon}><Text style={styles.trophy}>🏆</Text></View>
      <Text style={styles.title}>Your wins</Text>
      <Text style={styles.subtitle}>Every workout counts. Look what you’ve done!</Text>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, styles.purpleCard]}>
          <Ionicons name="checkmark-circle" size={25} color={colors.accent} />
          <Text style={styles.summaryValue}>{history.length}</Text>
          <Text style={styles.summaryLabel}>workouts</Text>
        </View>
        <View style={[styles.summaryCard, styles.greenCard]}>
          <Ionicons name="fitness" size={25} color={colors.success} />
          <Text style={styles.summaryValue}>{totalSets}</Text>
          <Text style={styles.summaryLabel}>sets done</Text>
        </View>
        <View style={[styles.summaryCard, styles.orangeCard]}>
          <Ionicons name="time" size={25} color="#C87500" />
          <Text style={styles.summaryValue}>{totalMinutes}</Text>
          <Text style={styles.summaryLabel}>minutes</Text>
        </View>
      </View>

      <SectionHeader title="Training volume" action={`Last ${recent.length} workouts`} />
      <View style={styles.chartCard} accessibilityLabel={`Training volume for the last ${recent.length} workouts. Highest ${maxVolume} ${weightUnit} repetitions.`}>
        {recent.length ? <View style={styles.chart}>{recent.map((session) => <View key={session.id} style={styles.barColumn}><View style={[styles.bar, { height: Math.max(8, (session.totalVolume / maxVolume) * 100) }]} /><Text style={styles.barLabel}>{formatDate(session.completedAt)}</Text></View>)}</View> : <Text style={styles.empty}>Complete a workout to see a traceable volume trend.</Text>}
        <Text style={styles.chartNote}>Volume = completed working-set weight × reps. Bodyweight, timed, and distance work are excluded from this comparison.</Text>
      </View>

      <View style={styles.insightRow}><View style={styles.insight}><Text style={styles.insightValue}>{completedPlanned}/{planned}</Text><Text style={styles.insightLabel}>planned sessions completed</Text></View><View style={styles.insight}><Text style={styles.insightValue}>{bestSet?.weight ? `${bestSet.weight} ${weightUnit}` : '—'}</Text><Text style={styles.insightLabel}>{bestSet?.name ?? 'No loaded sets yet'}{bestSet?.reps ? ` × ${bestSet.reps}` : ''}</Text></View></View>

      <SectionHeader title="Past workouts" />
      <View style={styles.historyList}>
        {history.map((session, index) => (
          <View key={session.id} style={styles.historyRow}>
            <View style={[styles.historyIcon, index === 0 && styles.latestIcon]}>
              <Ionicons name={index === 0 ? 'star' : 'checkmark'} size={21} color={index === 0 ? colors.accent : colors.success} />
            </View>
            <View style={styles.historyCopy}>
              <Text style={styles.historyName}>{session.name}</Text>
              <Text style={styles.historyDate}>{formatDate(session.completedAt)} · {Math.round(session.durationSeconds / 60)} min · {session.completedSets} sets</Text>
              {session.notes ? <Text numberOfLines={2} style={styles.historyNote}>{session.notes}</Text> : null}
            </View>
            {index === 0 ? <Text style={styles.latest}>Newest</Text> : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.warmDim, alignItems: 'center', justifyContent: 'center' },
  trophy: { fontSize: 29 },
  title: { color: colors.text, fontSize: 36, fontWeight: '900', letterSpacing: -1.4, marginTop: 16 },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 5 },
  summaryGrid: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  summaryCard: { flex: 1, minHeight: 134, borderRadius: radius.md, padding: 14, justifyContent: 'space-between' },
  purpleCard: { backgroundColor: colors.accentDim },
  greenCard: { backgroundColor: colors.successDim },
  orangeCard: { backgroundColor: colors.warmDim },
  summaryValue: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 12 },
  summaryLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  historyList: { gap: 10 },
  historyRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18 },
  historyIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successDim, marginRight: 12 },
  latestIcon: { backgroundColor: colors.accentDim },
  historyCopy: { flex: 1 },
  historyName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  historyDate: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  historyNote: { color: colors.textMuted, fontSize: 10, lineHeight: 14, marginTop: 5 },
  latest: { color: colors.accent, fontSize: 10, fontWeight: '900' },
  chartCard: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  chart: { height: 142, flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '72%', maxWidth: 40, borderRadius: 8, backgroundColor: colors.accent },
  barLabel: { color: colors.textMuted, fontSize: 8, marginTop: 6 },
  chartNote: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 13 },
  empty: { color: colors.textMuted, fontSize: 12, paddingVertical: 30, textAlign: 'center' },
  insightRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  insight: { flex: 1, minHeight: 85, borderRadius: radius.md, backgroundColor: colors.surface, padding: 13, justifyContent: 'center' },
  insightValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  insightLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 14, marginTop: 5 },
});
