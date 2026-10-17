import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';
import { useWorkout, validateBackup } from '@/store/workout-store';
import { KineticFormBackup } from '@/types/workout';
import { downloadBackup, readBackupFile } from '@/utils/backup';

export default function BackupScreen() {
  const { plans, history, schedule, customExercises, programs, createBackup, restoreBackup } = useWorkout();
  const [pending, setPending] = useState<KineticFormBackup | null>(null);
  const [busy, setBusy] = useState(false);
  const exportData = async () => { setBusy(true); try { await downloadBackup(createBackup()); } catch (error) { Alert.alert('Backup could not be saved', error instanceof Error ? error.message : 'Try again.'); } finally { setBusy(false); } };
  const chooseBackup = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (result.canceled) return;
    try { const asset = result.assets[0]; const backup = validateBackup(JSON.parse(await readBackupFile({ uri: asset.uri, file: 'file' in asset ? asset.file : undefined }))); setPending(backup); }
    catch (error) { Alert.alert('Backup not accepted', error instanceof Error ? error.message : 'The file could not be read.'); }
  };
  const apply = (mode: 'merge' | 'replace') => {
    if (!pending) return;
    const run = () => { restoreBackup(pending, mode); setPending(null); Alert.alert('Restore complete', mode === 'merge' ? 'New and matching records were merged by ID.' : 'Your current data was replaced with the backup.'); };
    if (mode === 'replace') Alert.alert('Replace all local data?', 'A recovery copy will be downloaded first. Keep it somewhere safe.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Back up and replace', style: 'destructive', onPress: async () => { try { await downloadBackup(createBackup()); run(); } catch { Alert.alert('Replace cancelled', 'The recovery backup could not be saved.'); } } }]); else run();
  };
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable><Text style={styles.headerTitle}>Backup & restore</Text><View style={styles.back} /></View><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.hero}><Ionicons name="shield-checkmark" size={34} color={colors.success} /><Text style={styles.title}>Your data, portable</Text><Text style={styles.body}>Download your profile, workouts, history, schedules, programs, custom exercises, preferences, and any active workout. Nothing is uploaded.</Text></View>
    <View style={styles.summary}><Text style={styles.summaryText}>{plans.length} workouts</Text><Text style={styles.summaryText}>{history.length} history records</Text><Text style={styles.summaryText}>{schedule.length} scheduled</Text><Text style={styles.summaryText}>{customExercises.length} custom exercises</Text><Text style={styles.summaryText}>{programs.length} programs</Text></View>
    <Pressable accessibilityRole="button" disabled={busy} onPress={exportData} style={styles.primary}><Ionicons name="download-outline" size={20} color={colors.white} /><Text style={styles.primaryText}>{busy ? 'Preparing…' : 'Download backup'}</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={chooseBackup} style={styles.secondary}><Ionicons name="cloud-upload-outline" size={20} color={colors.accent} /><Text style={styles.secondaryText}>Choose backup to restore</Text></Pressable>
    {pending ? <View style={styles.preview}><Text style={styles.previewTitle}>Ready to restore</Text><Text style={styles.body}>Exported {new Date(pending.exportedAt).toLocaleString()} · {pending.data.plans.length} workouts · {pending.data.history.length} history records</Text><Text style={styles.warning}>Merge keeps current data and matches records by stable ID. Replace removes current local data after creating a recovery backup.</Text><View style={styles.actions}><Pressable accessibilityRole="button" onPress={() => apply('merge')} style={styles.merge}><Text style={styles.mergeText}>Merge safely</Text></Pressable><Pressable accessibilityRole="button" onPress={() => apply('replace')} style={styles.replace}><Text style={styles.replaceText}>Replace</Text></Pressable></View></View> : null}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.ink }, header: { height: 66, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, headerTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.lg, paddingBottom: 60 }, hero: { padding: 22, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line }, title: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 15 }, body: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 7 }, summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 15 }, summaryText: { color: colors.text, fontSize: 11, fontWeight: '800', backgroundColor: colors.accentDim, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12 }, primary: { height: 56, borderRadius: 17, backgroundColor: colors.accent, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: colors.white, fontSize: 15, fontWeight: '900' }, secondary: { height: 56, borderRadius: 17, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accentSoft, marginTop: 9 }, secondaryText: { color: colors.accent, fontSize: 14, fontWeight: '900' }, preview: { marginTop: 18, padding: 18, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.accentSoft }, previewTitle: { color: colors.text, fontSize: 19, fontWeight: '900' }, warning: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 13, padding: 12, borderRadius: 12, backgroundColor: colors.warmDim }, actions: { flexDirection: 'row', gap: 8, marginTop: 13 }, merge: { flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, mergeText: { color: colors.white, fontWeight: '900' }, replace: { width: 100, height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center' }, replaceText: { color: colors.danger, fontWeight: '900' } });
