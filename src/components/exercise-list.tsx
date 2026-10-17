import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { Exercise } from '@/types/workout';

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  return (
    <View style={styles.container}>
      {exercises.map((exercise, index) => (
        <View key={exercise.id} style={[styles.row, index === exercises.length - 1 && styles.lastRow]}>
          <Text style={styles.index}>{String(index + 1).padStart(2, '0')}</Text>
          <View style={styles.copy}>
            <Text style={styles.name}>{exercise.name}</Text>
            <Text style={styles.detail}>{exercise.sets} sets  ·  {exercise.repTarget} reps</Text>
          </View>
          <View style={styles.muscle}><Text style={styles.muscleText}>{exercise.muscle}</Text></View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderColor: colors.line },
  row: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.line },
  lastRow: { borderBottomWidth: 0 },
  index: { width: 31, color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 11 },
  copy: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.15 },
  detail: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  muscle: { paddingHorizontal: 9, height: 24, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, marginRight: 9 },
  muscleText: { color: colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
