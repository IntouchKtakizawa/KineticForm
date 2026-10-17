import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout } from '@/store/workout-store';

const goals = ['Build strength', 'Build muscle', 'General fitness', 'Improve conditioning'];
const experience = ['New to training', 'Some experience', 'Experienced'];
const equipment = ['Bodyweight', 'Dumbbells', 'Barbell', 'Machines', 'Cables'];
const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export default function OnboardingScreen() {
  const { preferences, weightUnit, toggleWeightUnit, completeOnboarding } = useWorkout();
  const [goal, setGoal] = useState(preferences.goal);
  const [level, setLevel] = useState(preferences.experience);
  const [gear, setGear] = useState(preferences.equipment);
  const [trainingDays, setDays] = useState(preferences.trainingDays);
  const [minutes, setMinutes] = useState(preferences.sessionMinutes);
  const finish = () => { completeOnboarding({ goal, experience: level, equipment: gear, trainingDays, sessionMinutes: minutes }); router.replace('/'); };
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.icon}><Ionicons name="flash" size={30} color={colors.accent} /></View><Text style={styles.title}>Set up KineticForm</Text><Text style={styles.subtitle}>A few practical choices shape starter suggestions. You can skip or change these later; this is not medical advice or a uniquely personalised plan.</Text>
    <Choice title="Main goal" values={goals} selected={[goal]} onPress={(value) => setGoal(value)} />
    <Choice title="Experience" values={experience} selected={[level]} onPress={(value) => setLevel(value)} />
    <Choice title="Available equipment" values={equipment} selected={gear} onPress={(value) => setGear((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} />
    <Text style={styles.section}>Preferred training days</Text><View style={styles.dayRow}>{days.map((day, index) => <Pressable accessibilityRole="button" accessibilityLabel={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]} accessibilityState={{ selected: trainingDays.includes(index) }} key={`${day}-${index}`} onPress={() => setDays((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} style={[styles.day, trainingDays.includes(index) && styles.selected]}><Text style={[styles.chipText, trainingDays.includes(index) && styles.selectedText]}>{day}</Text></Pressable>)}</View>
    <Text style={styles.section}>Typical session</Text><View style={styles.row}>{[30, 45, 60, 75].map((value) => <Pressable accessibilityRole="button" accessibilityState={{ selected: minutes === value }} key={value} onPress={() => setMinutes(value)} style={[styles.time, minutes === value && styles.selected]}><Text style={[styles.chipText, minutes === value && styles.selectedText]}>{value} min</Text></Pressable>)}</View>
    <Text style={styles.section}>Weight unit</Text><Pressable accessibilityRole="button" accessibilityLabel={`Weight unit ${weightUnit}. Tap to change.`} onPress={toggleWeightUnit} style={styles.unit}><Text style={styles.unitText}>{weightUnit.toUpperCase()}</Text><Ionicons name="swap-horizontal" size={18} color={colors.white} /></Pressable>
    <Pressable accessibilityRole="button" onPress={finish} style={styles.primary}><Text style={styles.primaryText}>Save preferences</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.skip}><Text style={styles.skipText}>Skip for now</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
function Choice({ title, values, selected, onPress }: { title: string; values: string[]; selected: string[]; onPress: (value: string) => void }) { return <><Text style={styles.section}>{title}</Text><View style={styles.row}>{values.map((value) => <Pressable accessibilityRole="button" accessibilityState={{ selected: selected.includes(value) }} key={value} onPress={() => onPress(value)} style={[styles.chip, selected.includes(value) && styles.selected]}><Text style={[styles.chipText, selected.includes(value) && styles.selectedText]}>{value}</Text></Pressable>)}</View></>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.ink }, content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.lg, paddingBottom: 60 }, icon: { width: 58, height: 58, borderRadius: 19, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.1, marginTop: 17 }, subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 6 }, section: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 24, marginBottom: 10 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' }, selected: { backgroundColor: colors.accent, borderColor: colors.accent }, chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' }, selectedText: { color: colors.white }, dayRow: { flexDirection: 'row', gap: 6 }, day: { flex: 1, height: 44, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, time: { flex: 1, minWidth: 70, height: 45, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, unit: { width: 96, height: 46, borderRadius: 14, backgroundColor: colors.accent, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, unitText: { color: colors.white, fontWeight: '900' }, primary: { height: 58, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 30 }, primaryText: { color: colors.white, fontSize: 16, fontWeight: '900' }, skip: { height: 50, alignItems: 'center', justifyContent: 'center' }, skipText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' } });
