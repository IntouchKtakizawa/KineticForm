import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Screen, SectionHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout } from '@/store/workout-store';

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProgressScreen() {
  const { history } = useWorkout();
  const totalSets = history.reduce((sum, session) => sum + session.completedSets, 0);
  const totalMinutes = Math.round(history.reduce((sum, session) => sum + session.durationSeconds, 0) / 60);

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
  latest: { color: colors.accent, fontSize: 10, fontWeight: '900' },
});
