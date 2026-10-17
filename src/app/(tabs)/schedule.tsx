import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { connectGoogleCalendar, createGoogleEvent, deleteGoogleEvent, googleCalendarConfigured, googleCalendarFallbackUrl, listGoogleWorkoutEvents, updateGoogleEvent } from '@/services/google-calendar';
import { useWorkout } from '@/store/workout-store';
import { ScheduledWorkout } from '@/types/workout';

const pad = (value: number) => String(value).padStart(2, '0');
const toDateValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toTimeValue = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export default function ScheduleScreen() {
  const { plans, schedule, saveSchedule, removeSchedule, markSchedule, startWorkout } = useWorkout();
  const [referenceNow] = useState(() => Date.now());
  const firstDate = new Date(referenceNow + 86400000);
  firstDate.setHours(17, 0, 0, 0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');
  const [date, setDate] = useState(toDateValue(firstDate));
  const [time, setTime] = useState(toTimeValue(firstDate));
  const [duration, setDuration] = useState('60');
  const [repeat, setRepeat] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(() => schedule.slice().sort((a, b) => a.startISO.localeCompare(b.startISO)), [schedule]);

  const resetForm = () => {
    setEditing(null);
    setPlanId(plans[0]?.id ?? '');
    setDate(toDateValue(firstDate));
    setTime(toTimeValue(firstDate));
    setDuration('60');
    setRepeat(false);
    setWeekdays([1, 3, 5]);
  };

  const editItem = (item: ScheduledWorkout) => {
    const start = new Date(item.startISO);
    setEditing(item.id);
    setPlanId(item.planId);
    setDate(toDateValue(start));
    setTime(toTimeValue(start));
    setDuration(String(item.durationMinutes));
    setRepeat(item.recurrence === 'weekly');
    setWeekdays(item.weekdays ?? [start.getDay()]);
    setShowForm(true);
  };

  const save = async () => {
    const plan = plans.find((item) => item.id === planId);
    const start = new Date(`${date}T${time}:00`);
    if (!plan || Number.isNaN(start.getTime())) return Alert.alert('Check the schedule', 'Choose a workout, date, and time.');
    const previous = schedule.find((item) => item.id === editing);
    let item: ScheduledWorkout = {
      id: editing ?? `schedule-${Date.now()}`,
      planId: plan.id,
      title: plan.name,
      startISO: start.toISOString(),
      durationMinutes: Math.max(10, Number(duration) || plan.durationMinutes),
      recurrence: repeat ? 'weekly' : 'none',
      weekdays: repeat ? weekdays : undefined,
      status: previous?.status ?? 'upcoming',
      googleEventId: previous?.googleEventId,
      googleEventUrl: previous?.googleEventUrl,
    };
    if (connected) {
      setBusy(true);
      try {
        const event = item.googleEventId ? await updateGoogleEvent(item, plan) : await createGoogleEvent(item, plan);
        item = { ...item, googleEventId: event.id, googleEventUrl: event.htmlLink };
      } catch (error) {
        setBusy(false);
        return Alert.alert('Google Calendar could not be updated', error instanceof Error ? error.message : 'Try reconnecting.');
      }
      setBusy(false);
    }
    saveSchedule(item);
    setShowForm(false);
    resetForm();
  };

  const remove = (item: ScheduledWorkout) => Alert.alert('Remove this workout?', `${item.title} will be removed from your schedule.`, [
    { text: 'Keep', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      if (item.googleEventId && connected) await deleteGoogleEvent(item.googleEventId).catch(() => undefined);
      removeSchedule(item.id);
    } },
  ]);

  const connect = async () => {
    setBusy(true);
    try {
      await connectGoogleCalendar();
      setConnected(true);
      const remote = await listGoogleWorkoutEvents();
      remote.items?.forEach((event) => {
        const matched = plans.find((plan) => event.summary.toLowerCase().includes(plan.name.toLowerCase()));
        const start = event.start.dateTime ?? event.start.date;
        const end = event.end.dateTime ?? event.end.date;
        if (!matched || !start || !end) return;
        saveSchedule({ id: `google-${event.id}`, planId: matched.id, title: matched.name, startISO: new Date(start).toISOString(), durationMinutes: Math.max(10, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)), recurrence: 'none', status: 'upcoming', googleEventId: event.id, googleEventUrl: event.htmlLink });
      });
    }
    catch (error) { Alert.alert('Google Calendar setup', error instanceof Error ? error.message : 'Connection failed.'); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <View style={styles.titleRow}>
        <View><Text style={styles.eyebrow}>Training schedule</Text><Text style={styles.title}>Plan your week</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Add scheduled workout" onPress={() => { resetForm(); setShowForm(true); }} style={styles.addButton}><Ionicons name="add" size={25} color={colors.white} /></Pressable>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.googleIcon}><Text style={styles.googleLetter}>G</Text></View>
        <View style={styles.calendarCopy}>
          <Text style={styles.calendarTitle}>{connected ? 'Google Calendar connected' : 'Connect Google Calendar'}</Text>
          <Text style={styles.calendarText}>{connected ? 'New workouts can sync automatically.' : googleCalendarConfigured ? 'See workouts beside school, work, and life.' : 'OAuth setup is required for direct sync. You can still add events with one tap.'}</Text>
        </View>
        {googleCalendarConfigured ? <Pressable disabled={busy || connected} onPress={connect} style={[styles.connectButton, connected && styles.connectedButton]}><Text style={styles.connectText}>{connected ? 'Connected' : 'Connect'}</Text></Pressable> : null}
      </View>

      {showForm ? (
        <View style={styles.formCard}>
          <View style={styles.formTop}><Text style={styles.formTitle}>{editing ? 'Edit workout' : 'Schedule workout'}</Text><Pressable onPress={() => setShowForm(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable></View>
          <Text style={styles.label}>Workout</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planPicker}>
            {plans.map((plan) => <Pressable key={plan.id} onPress={() => setPlanId(plan.id)} style={[styles.planChip, planId === plan.id && styles.planChipActive]}><Text style={[styles.planChipText, planId === plan.id && styles.planChipTextActive]}>{plan.name}</Text></Pressable>)}
          </ScrollView>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}><Text style={styles.label}>Date</Text><TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" style={styles.input} /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>Start</Text><TextInput value={time} onChangeText={setTime} placeholder="17:00" style={styles.input} /></View>
            <View style={styles.smallGroup}><Text style={styles.label}>Minutes</Text><TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" style={styles.input} /></View>
          </View>
          <Pressable onPress={() => setRepeat((value) => !value)} style={styles.repeatRow}><Ionicons name={repeat ? 'checkbox' : 'square-outline'} size={23} color={colors.accent} /><Text style={styles.repeatText}>Repeat every week</Text></Pressable>
          {repeat ? <View style={styles.weekdayRow}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => <Pressable key={`${label}-${index}`} onPress={() => setWeekdays((days) => days.includes(index) ? days.filter((day) => day !== index) : [...days, index].sort())} style={[styles.weekday, weekdays.includes(index) && styles.weekdayActive]}><Text style={[styles.weekdayText, weekdays.includes(index) && styles.weekdayTextActive]}>{label}</Text></Pressable>)}</View> : null}
          <Pressable disabled={busy} onPress={save} style={styles.saveButton}><Text style={styles.saveText}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add to schedule'}</Text></Pressable>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Upcoming workouts</Text>
      <View style={styles.list}>
        {sorted.map((item) => {
          const plan = plans.find((entry) => entry.id === item.planId);
          const start = new Date(item.startISO);
          const isMissed = item.status === 'upcoming' && start.getTime() < referenceNow;
          const status = isMissed ? 'missed' : item.status;
          return (
            <View key={item.id} style={styles.eventCard}>
              <View style={styles.dateBlock}><Text style={styles.day}>{start.toLocaleDateString('en-US', { weekday: 'short' })}</Text><Text style={styles.dateNumber}>{start.getDate()}</Text></View>
              <View style={styles.eventCopy}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>{start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}–{new Date(start.getTime() + item.durationMinutes * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
                <View style={styles.statusRow}><View style={[styles.statusDot, status === 'completed' && styles.completedDot, status === 'missed' && styles.missedDot]} /><Text style={styles.statusText}>{status}{item.recurrence === 'weekly' ? ' · repeats weekly' : ''}</Text></View>
              </View>
              <View style={styles.eventActions}>
                {status === 'upcoming' ? <Pressable onPress={() => { if (plan) { startWorkout(plan.id); router.push('/workout'); } }} style={styles.playButton}><Ionicons name="play" size={18} color={colors.white} /></Pressable> : null}
                <Pressable onPress={() => editItem(item)} style={styles.iconAction}><Ionicons name="create-outline" size={18} color={colors.textMuted} /></Pressable>
                <Pressable onPress={() => remove(item)} style={styles.iconAction}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
              </View>
              {plan && !item.googleEventId ? <Pressable onPress={() => Linking.openURL(googleCalendarFallbackUrl(item, plan))} style={styles.googleLink}><Ionicons name="calendar-outline" size={15} color={colors.accent} /><Text style={styles.googleLinkText}>Add to Google Calendar</Text></Pressable> : null}
              {status === 'missed' ? <Pressable onPress={() => markSchedule(item.id, 'completed')} style={styles.markDone}><Text style={styles.markDoneText}>Mark completed</Text></Pressable> : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.2, marginTop: 5 },
  addButton: { width: 50, height: 50, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  calendarCard: { marginTop: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 16, flexDirection: 'row', alignItems: 'center' },
  googleIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  googleLetter: { color: '#4285F4', fontSize: 22, fontWeight: '900' },
  calendarCopy: { flex: 1, marginHorizontal: 12 },
  calendarTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  calendarText: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  connectButton: { paddingHorizontal: 13, paddingVertical: 10, backgroundColor: colors.accent, borderRadius: 12 },
  connectedButton: { backgroundColor: colors.success },
  connectText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  formCard: { marginTop: 14, padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.accentSoft },
  formTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '900', marginTop: 14, marginBottom: 6 },
  planPicker: { gap: 8 },
  planChip: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.ink },
  planChipActive: { backgroundColor: colors.accent },
  planChipText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  planChipTextActive: { color: colors.white },
  inputRow: { flexDirection: 'row', gap: 8 },
  inputGroup: { flex: 1 },
  smallGroup: { width: 76 },
  input: { height: 45, borderRadius: 12, backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.line, color: colors.text, paddingHorizontal: 11, fontSize: 13 },
  repeatRow: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  repeatText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  weekdayRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  weekday: { flex: 1, height: 38, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  weekdayActive: { backgroundColor: colors.accent },
  weekdayText: { color: colors.textMuted, fontSize: 11, fontWeight: '900' },
  weekdayTextActive: { color: colors.white },
  saveButton: { height: 52, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: spacing.xl, marginBottom: 13 },
  list: { gap: 11 },
  eventCard: { minHeight: 112, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 14, flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' },
  dateBlock: { width: 54, height: 64, borderRadius: 16, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  day: { color: colors.accent, fontSize: 10, fontWeight: '900' },
  dateNumber: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 2 },
  eventCopy: { flex: 1, marginLeft: 12 },
  eventTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  eventTime: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginRight: 5 },
  completedDot: { backgroundColor: colors.success },
  missedDot: { backgroundColor: colors.danger },
  statusText: { color: colors.textMuted, fontSize: 10, textTransform: 'capitalize' },
  eventActions: { flexDirection: 'row', gap: 5 },
  playButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  iconAction: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  googleLink: { marginLeft: 66, marginTop: 10, flexDirection: 'row', gap: 5, alignItems: 'center' },
  googleLinkText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  markDone: { marginLeft: 12, marginTop: 8 },
  markDoneText: { color: colors.success, fontSize: 11, fontWeight: '900' },
});
