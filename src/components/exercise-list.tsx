import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { Exercise } from '@/types/workout';

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  return (
    <View style={styles.container}>
      {exercises.map((exercise, index) => (
        <View key={exercise.id} style={[styles.row, index === exercises.length - 1 && styles.lastRow]}>
          <View style={[styles.index, index % 2 === 1 && styles.indexWarm]}><Text style={styles.indexText}>{index + 1}</Text></View>
          <View style={styles.copy}>
            <Text style={styles.name}>{exercise.name}</Text>
            <Text style={styles.detail}>{exercise.sets} sets × {exercise.repTarget} reps</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  lastRow: { borderBottomWidth: 0 },
  index: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentDim, marginRight: 12 },
  indexWarm: { backgroundColor: colors.warmDim },
  indexText: { color: colors.text, fontFamily: 'SpaceMono', fontSize: 15, fontWeight: '700' },
  copy: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.15 },
  detail: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
});
