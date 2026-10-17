import { StyleSheet, Text, View } from 'react-native';

import { Eyebrow, Metric, Screen, SectionHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout } from '@/store/workout-store';

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProgressScreen() {
  const { history } = useWorkout();
  const maxVolume = Math.max(...history.slice(0, 6).map((item) => item.totalVolume), 1);
  const totalSets = history.reduce((sum, session) => sum + session.completedSets, 0);
  const totalMinutes = Math.round(history.reduce((sum, session) => sum + session.durationSeconds, 0) / 60);
  const change = history.length > 1 ? ((history[0].totalVolume - history[1].totalVolume) / Math.max(history[1].totalVolume, 1)) * 100 : 0;

  return (
    <Screen>
      <Eyebrow>Your training</Eyebrow>
      <Text style={styles.title}>Progress that{`\n`}you can feel.</Text>

      <View style={styles.summaryRow}>
        <Metric value={history.length} label="Workouts" />
        <View style={styles.divider} />
        <Metric value={totalSets} label="Working sets" />
        <View style={styles.divider} />
        <Metric value={totalMinutes} label="Minutes" />
      </View>

      <SectionHeader title="Training volume" action="Last 6 sessions" />
      <View style={styles.chartCard}>
        <View style={styles.chartMeta}>
          <View>
            <Text style={styles.chartLabel}>LATEST</Text>
            <Text style={styles.chartValue}>{history[0] ? (history[0].totalVolume / 1000).toFixed(1) : '0.0'}k <Text style={styles.chartUnit}>kg</Text></Text>
          </View>
          <Text style={styles.change}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</Text>
        </View>
        <View style={styles.chart}>
          {history.slice(0, 6).reverse().map((session, index, items) => (
            <View key={session.id} style={styles.barSlot}>
              <View style={[styles.bar, { height: Math.max(12, (session.totalVolume / maxVolume) * 112) }, index === items.length - 1 && styles.activeBar]} />
              <Text style={styles.barLabel}>{formatDate(session.completedAt).split(' ')[1]}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionHeader title="Workout history" />
      {history.map((session, index) => (
        <View key={session.id} style={styles.historyRow}>
          <View style={[styles.historyMarker, index === 0 && styles.latestMarker]} />
          <View style={styles.historyCopy}>
            <Text style={styles.historyName}>{session.name}</Text>
            <Text style={styles.historyDate}>{formatDate(session.completedAt)} · {Math.round(session.durationSeconds / 60)} min</Text>
          </View>
          <View style={styles.historyMetric}>
            <Text style={styles.historyValue}>{(session.totalVolume / 1000).toFixed(1)}k</Text>
            <Text style={styles.historyUnit}>kg</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -1.5, marginTop: 11 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 27, marginTop: spacing.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  divider: { width: 1, height: 42, backgroundColor: colors.line },
  chartCard: { minHeight: 252, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 20 },
  chartMeta: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  chartLabel: { color: colors.textMuted, fontSize: 9, letterSpacing: 1.1, fontWeight: '800' },
  chartValue: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 25, marginTop: 5 },
  chartUnit: { color: colors.textMuted, fontSize: 11 },
  change: { color: colors.accent, fontSize: 12, fontWeight: '800', backgroundColor: colors.accentDim, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7 },
  chart: { height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 13, paddingTop: 20 },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', maxWidth: 30, backgroundColor: '#434940', borderRadius: 5 },
  activeBar: { backgroundColor: colors.accent },
  barLabel: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 9, marginTop: 8 },
  historyRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.line },
  historyMarker: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line, marginRight: 15 },
  latestMarker: { backgroundColor: colors.accent },
  historyCopy: { flex: 1 },
  historyName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  historyDate: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  historyMetric: { alignItems: 'flex-end' },
  historyValue: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 15 },
  historyUnit: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
});
