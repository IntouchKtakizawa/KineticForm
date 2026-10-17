import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout } from '@/store/workout-store';

const avatars = ['🏋️', '💪', '⚡', '🔥', '🏃', '🧠', '🎸', '🚀'];
const goals = ['Build strength', 'Build muscle', 'General fitness', 'Improve conditioning', 'Move better', 'Sport performance'];
const experienceLevels = ['New to training', 'Some experience', 'Experienced'];
const activityLevels = ['Mostly seated', 'Lightly active', 'Moderately active', 'Very active'];
const KG_TO_LB = 2.2046226218;

const displayNumber = (value?: number) => value === undefined ? '' : String(Math.round(value * 10) / 10);
const parseOptional = (value: string) => value.trim() ? Number(value) : undefined;

export default function AboutYouScreen() {
  const { displayName, profile, preferences, weightUnit, toggleWeightUnit, updateProfile, completeOnboarding } = useWorkout();
  const [name, setName] = useState(displayName);
  const [avatarEmoji, setAvatarEmoji] = useState(profile.avatarEmoji);
  const [age, setAge] = useState(displayNumber(profile.age));
  const [heightCm, setHeightCm] = useState(displayNumber(profile.heightCm));
  const [bodyWeight, setBodyWeight] = useState(displayNumber(profile.bodyWeightKg === undefined ? undefined : weightUnit === 'kg' ? profile.bodyWeightKg : profile.bodyWeightKg * KG_TO_LB));
  const [targetWeight, setTargetWeight] = useState(displayNumber(profile.targetWeightKg === undefined ? undefined : weightUnit === 'kg' ? profile.targetWeightKg : profile.targetWeightKg * KG_TO_LB));
  const [goal, setGoal] = useState(preferences.goal);
  const [experience, setExperience] = useState(preferences.experience);
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [goalNote, setGoalNote] = useState(profile.goalNote);

  const switchUnit = () => {
    const convert = (value: string) => {
      const number = Number(value);
      if (!value.trim() || Number.isNaN(number)) return value;
      return displayNumber(weightUnit === 'kg' ? number * KG_TO_LB : number / KG_TO_LB);
    };
    setBodyWeight(convert(bodyWeight));
    setTargetWeight(convert(targetWeight));
    toggleWeightUnit();
  };

  const save = () => {
    const parsedAge = parseOptional(age);
    const parsedHeight = parseOptional(heightCm);
    const parsedWeight = parseOptional(bodyWeight);
    const parsedTarget = parseOptional(targetWeight);
    const invalid = [parsedAge, parsedHeight, parsedWeight, parsedTarget].some((value) => value !== undefined && (!Number.isFinite(value) || value <= 0));
    if (invalid) return Alert.alert('Check your details', 'Use positive numbers, or leave optional fields blank.');
    if (parsedAge !== undefined && (parsedAge < 10 || parsedAge > 100)) return Alert.alert('Check your age', 'Enter an age from 10 to 100.');
    if (parsedHeight !== undefined && (parsedHeight < 80 || parsedHeight > 250)) return Alert.alert('Check your height', 'Enter a height from 80 to 250 cm.');
    const toKg = (value?: number) => value === undefined ? undefined : weightUnit === 'kg' ? value : value / KG_TO_LB;
    updateProfile({ avatarEmoji, age: parsedAge, heightCm: parsedHeight, bodyWeightKg: toKg(parsedWeight), targetWeightKg: toKg(parsedTarget), activityLevel, goalNote: goalNote.trim() }, name);
    completeOnboarding({ ...preferences, goal, experience });
    router.back();
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.headerButton}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable>
      <Text style={styles.headerTitle}>Get to know you</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Save your profile" onPress={save} style={styles.saveHeader}><Text style={styles.saveHeaderText}>Save</Text></Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroAvatar}><Text style={styles.heroEmoji}>{avatarEmoji}</Text></View>
        <View style={styles.heroCopy}><Text style={styles.title}>Make KineticForm yours</Text><Text style={styles.body}>These details stay on this device and help keep your training preferences together.</Text></View>
      </View>

      <Text style={styles.section}>Account</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Your name</Text>
        <TextInput accessibilityLabel="Your name" value={name} onChangeText={setName} maxLength={32} placeholder="Athlete" placeholderTextColor={colors.textMuted} style={styles.input} />
        <Text style={styles.label}>Choose an avatar</Text>
        <View style={styles.avatarGrid}>{avatars.map((emoji) => <Pressable accessibilityRole="button" accessibilityLabel={`Use ${emoji} as your avatar`} accessibilityState={{ selected: avatarEmoji === emoji }} key={emoji} onPress={() => setAvatarEmoji(emoji)} style={[styles.avatarChoice, avatarEmoji === emoji && styles.choiceSelected]}><Text style={styles.avatarChoiceText}>{emoji}</Text></Pressable>)}</View>
      </View>

      <Text style={styles.section}>Body details <Text style={styles.optional}>optional</Text></Text>
      <View style={styles.card}>
        <View style={styles.fieldRow}>
          <Field label="Age" value={age} onChange={setAge} placeholder="15" suffix="years" />
          <Field label="Height" value={heightCm} onChange={setHeightCm} placeholder="170" suffix="cm" />
        </View>
        <View style={styles.unitRow}><Text style={styles.label}>Weight unit</Text><Pressable accessibilityRole="button" accessibilityLabel={`Weight unit ${weightUnit}. Tap to change.`} onPress={switchUnit} style={styles.unitButton}><Text style={styles.unitText}>{weightUnit.toUpperCase()}</Text><Ionicons name="swap-horizontal" size={15} color={colors.white} /></Pressable></View>
        <View style={styles.fieldRow}>
          <Field label="Current weight" value={bodyWeight} onChange={setBodyWeight} placeholder={weightUnit === 'kg' ? '65' : '143'} suffix={weightUnit} />
          <Field label="Target weight" value={targetWeight} onChange={setTargetWeight} placeholder={weightUnit === 'kg' ? '70' : '154'} suffix={weightUnit} />
        </View>
      </View>

      <Choice title="Main goal" values={goals} selected={goal} onPress={setGoal} />
      <Choice title="Training experience" values={experienceLevels} selected={experience} onPress={setExperience} />
      <Choice title="Daily activity" values={activityLevels} selected={activityLevel} onPress={setActivityLevel} />

      <Text style={styles.section}>Anything else?</Text>
      <View style={styles.card}><TextInput accessibilityLabel="Personal goals or notes" value={goalNote} onChangeText={setGoalNote} maxLength={240} multiline placeholder="A sport you train for, movement goals, or anything you want to remember…" placeholderTextColor={colors.textMuted} style={[styles.input, styles.notes]} /><Text style={styles.counter}>{goalNote.length}/240</Text></View>

      <View style={styles.notice}><Ionicons name="lock-closed" size={18} color={colors.success} /><Text style={styles.noticeText}>Private and optional. This information is stored locally and is not medical advice.</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Save your profile" onPress={save} style={styles.primary}><Text style={styles.primaryText}>Save profile</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function Field({ label, value, onChange, placeholder, suffix }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; suffix: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.inputShell}><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder={placeholder} placeholderTextColor={colors.textMuted} style={styles.shellInput} /><Text style={styles.suffix}>{suffix}</Text></View></View>;
}

function Choice({ title, values, selected, onPress }: { title: string; values: string[]; selected: string; onPress: (value: string) => void }) {
  return <><Text style={styles.section}>{title}</Text><View style={styles.choiceRow}>{values.map((value) => <Pressable accessibilityRole="button" accessibilityState={{ selected: selected === value }} key={value} onPress={() => onPress(value)} style={[styles.choice, selected === value && styles.choiceSelected]}><Text style={[styles.choiceText, selected === value && styles.choiceTextSelected]}>{value}</Text></Pressable>)}</View></>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  header: { height: 66, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  saveHeader: { minWidth: 58, height: 42, paddingHorizontal: 13, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  saveHeaderText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.lg, paddingBottom: 60 },
  hero: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: radius.lg, backgroundColor: colors.accentDim },
  heroAvatar: { width: 66, height: 66, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 32 },
  heroCopy: { flex: 1, minWidth: 0, marginLeft: 14 },
  title: { color: colors.text, fontSize: 21, fontWeight: '900' },
  body: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  section: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 23, marginBottom: 10 },
  optional: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '900', marginBottom: 7 },
  input: { minHeight: 48, borderRadius: 14, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 13, fontSize: 14, marginBottom: 16 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatarChoice: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.ink, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  avatarChoiceText: { fontSize: 23 },
  choiceSelected: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  fieldRow: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, minWidth: 0 },
  inputShell: { height: 48, borderRadius: 14, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center' },
  shellInput: { flex: 1, minWidth: 0, height: '100%', color: colors.text, paddingHorizontal: 12, fontSize: 14 },
  suffix: { color: colors.textMuted, fontSize: 10, fontWeight: '800', marginRight: 11 },
  unitRow: { marginTop: 16, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unitButton: { minWidth: 76, height: 38, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.accent, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  unitText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 44, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  choiceText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  choiceTextSelected: { color: colors.accent },
  notes: { minHeight: 104, marginBottom: 5, paddingTop: 13, textAlignVertical: 'top' },
  counter: { color: colors.textMuted, fontSize: 10, textAlign: 'right' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 18, padding: 13, borderRadius: 14, backgroundColor: colors.successDim },
  noticeText: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  primary: { height: 56, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: '900' },
});
