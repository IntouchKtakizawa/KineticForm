import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';

export function DateStrip() {
  const today = new Date();
  const days = Array.from({ length: 3 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset - 1);
    return date;
  });

  return (
    <View style={styles.row}>
      {days.map((day, index) => {
        const active = index === 1;
        return (
          <View key={day.toISOString()} style={[styles.day, active && styles.activeDay]}>
            <Text style={[styles.weekday, active && styles.activeText]}>{active ? 'Today' : day.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
            <Text style={[styles.date, active && styles.activeText]}>{day.getDate()}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, gap: 10 },
  day: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surface },
  activeDay: { flex: 1.2, backgroundColor: colors.accentDim, borderWidth: 2, borderColor: colors.accent },
  weekday: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  date: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 15, marginTop: 3 },
  activeText: { color: colors.accent },
});
