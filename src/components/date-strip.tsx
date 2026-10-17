import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';

export function DateStrip() {
  const today = new Date();
  const days = Array.from({ length: 5 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset - 2);
    return date;
  });

  return (
    <View style={styles.row}>
      {days.map((day, index) => {
        const active = index === 2;
        return (
          <View key={day.toISOString()} style={[styles.day, active && styles.activeDay]}>
            <Text style={[styles.weekday, active && styles.activeText]}>{day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</Text>
            <Text style={[styles.date, active && styles.activeText]}>{day.getDate()}</Text>
            <View style={[styles.dot, active && styles.activeDot]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, gap: 8 },
  day: { flex: 1, height: 74, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  activeDay: { backgroundColor: colors.text },
  weekday: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  date: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 16, marginTop: 5 },
  activeText: { color: colors.ink },
  dot: { width: 3, height: 3, borderRadius: 2, marginTop: 6, backgroundColor: 'transparent' },
  activeDot: { backgroundColor: colors.ink },
});
