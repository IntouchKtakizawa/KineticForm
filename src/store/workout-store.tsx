import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { workoutCatalog } from '@/data/workout-catalog';
import { ActiveWorkout, ExerciseDefinition, KineticFormBackup, Program, ScheduledWorkout, UserProfile, WorkoutPlan, WorkoutSession, WorkoutState, WorkoutTemplate } from '@/types/workout';

const STORAGE_KEY = '@kineticform/workout-state-v3';
const LEGACY_KEY = '@kineticform/workout-state-v2';
type RestoreMode = 'merge' | 'replace';
type WorkoutContextValue = WorkoutState & {
  hydrated: boolean;
  startWorkout: (planId?: string, scheduledWorkoutId?: string) => void;
  updateSet: (exerciseId: string, setId: string, field: 'reps' | 'weight' | 'rpe', value: string) => void;
  updateWorkoutNotes: (value: string) => void;
  toggleSet: (exerciseId: string, setId: string) => void;
  setSetKind: (exerciseId: string, setId: string, kind: 'warmup' | 'working') => void;
  addSet: (exerciseId: string, copyPrevious?: boolean) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  skipExercise: (exerciseId: string) => void;
  substituteExercise: (exerciseId: string, definition: ExerciseDefinition) => void;
  startRest: (seconds: number) => void;
  pauseRest: () => void;
  skipRest: () => void;
  resetRest: (seconds: number) => void;
  finishWorkout: () => WorkoutSession | null;
  discardWorkout: () => void;
  setDisplayName: (name: string) => void;
  updateProfile: (profile: UserProfile, displayName: string) => void;
  toggleWeightUnit: () => void;
  savePlan: (plan: WorkoutPlan) => void;
  removePlan: (id: string) => void;
  duplicatePlan: (id: string) => string | null;
  addCustomExercise: (exercise: ExerciseDefinition) => void;
  saveSchedule: (item: ScheduledWorkout) => void;
  removeSchedule: (id: string) => void;
  markSchedule: (id: string, status: ScheduledWorkout['status']) => void;
  saveProgram: (program: Program) => void;
  importTemplate: (template: WorkoutTemplate) => void;
  completeOnboarding: (preferences: WorkoutState['preferences']) => void;
  createBackup: () => KineticFormBackup;
  restoreBackup: (backup: KineticFormBackup, mode: RestoreMode) => void;
};

const starterPlan = workoutCatalog.find((item) => item.plan.id === 'catalog-dumbbell-full-body')?.plan ?? workoutCatalog[0].plan;
const initialSchedule: ScheduledWorkout[] = [];
const defaultPreferences: WorkoutState['preferences'] = { goal: 'Build strength', experience: 'Some experience', equipment: ['Bodyweight', 'Dumbbells'], trainingDays: [1, 3, 5], sessionMinutes: 45 };
const defaultProfile: UserProfile = { avatarEmoji: '🏋️', activityLevel: 'Moderately active', goalNote: '' };
const initialState: WorkoutState = { schemaVersion: 4, activeWorkout: null, history: [], displayName: 'Athlete', profile: defaultProfile, weightUnit: 'kg', plans: [starterPlan], customExercises: [], schedule: initialSchedule, programs: [], onboardingComplete: false, preferences: defaultPreferences };
const WorkoutContext = createContext<WorkoutContextValue | null>(null);

function migrate(saved: Partial<WorkoutState>): WorkoutState {
  return { ...initialState, ...saved, schemaVersion: 4, plans: saved.plans?.length ? saved.plans : [starterPlan], schedule: saved.schedule ?? initialSchedule, customExercises: saved.customExercises ?? [], programs: saved.programs ?? [], profile: { ...defaultProfile, ...(saved.profile ?? {}) }, preferences: { ...defaultPreferences, ...(saved.preferences ?? {}) } };
}
function buildActiveWorkout(plan: WorkoutPlan, scheduledWorkoutId?: string): ActiveWorkout {
  const stamp = Date.now();
  return { id: `workout-${stamp}`, planId: plan.id, name: plan.name, startedAt: stamp, restEndAt: null, pausedRestSeconds: null, scheduledWorkoutId, notes: '', exercises: plan.exercises.map((exercise) => ({ ...exercise, logs: Array.from({ length: exercise.type === 'Cardio' ? 1 : exercise.sets }, (_, index) => ({ id: `${exercise.id}-${stamp}-${index}`, reps: exercise.durationMinutes ? String(exercise.durationMinutes) : '', weight: exercise.type === 'Cardio' ? String(exercise.distanceKm ?? '') : String(exercise.suggestedWeight || ''), rpe: '', completed: false, kind: 'working' as const })) })) };
}
const mergeById = <T extends { id: string }>(current: T[], incoming: T[]) => Array.from(new Map([...current, ...incoming].map((item) => [item.id, item])).values());
function advanceRecurringWorkout(item: ScheduledWorkout): ScheduledWorkout {
  if (item.recurrence !== 'weekly') return { ...item, status: 'completed' };
  const currentStart = new Date(item.startISO);
  const weekdays = item.weekdays?.length ? [...item.weekdays].sort((a, b) => a - b) : [currentStart.getDay()];
  const nextStart = new Date(currentStart);
  do {
    const nextDay = weekdays.map((day) => (day - nextStart.getDay() + 7) % 7 || 7).sort((a, b) => a - b)[0];
    nextStart.setDate(nextStart.getDate() + nextDay);
  } while (nextStart.getTime() <= Date.now());
  return { ...item, startISO: nextStart.toISOString(), status: 'upcoming' };
}
export function validateBackup(value: unknown): KineticFormBackup {
  if (!value || typeof value !== 'object') throw new Error('This file is not a KineticForm backup.');
  const backup = value as Partial<KineticFormBackup>;
  if (backup.app !== 'KineticForm' || ![3, 4].includes(backup.schemaVersion ?? 0) || !backup.data || !Array.isArray(backup.data.plans) || !Array.isArray(backup.data.history) || !Array.isArray(backup.data.schedule)) throw new Error('This backup is invalid or uses an unsupported version.');
  return backup as KineticFormBackup;
}

export function WorkoutProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<WorkoutState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const finishing = useRef(false);
  useEffect(() => { (async () => { try { const stored = await AsyncStorage.getItem(STORAGE_KEY) ?? await AsyncStorage.getItem(LEGACY_KEY); if (stored) setState(migrate(JSON.parse(stored))); } finally { setHydrated(true); } })(); }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [hydrated, state]);
  const startWorkout = useCallback((planId = starterPlan.id, scheduledWorkoutId?: string) => { setState((current) => { const plan = current.plans.find((item) => item.id === planId) ?? current.plans[0] ?? starterPlan; return { ...current, activeWorkout: current.activeWorkout ?? buildActiveWorkout(plan, scheduledWorkoutId) }; }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }, []);
  const patchActive = useCallback((recipe: (active: ActiveWorkout) => ActiveWorkout) => setState((current) => ({ ...current, activeWorkout: current.activeWorkout ? recipe(current.activeWorkout) : null })), []);
  const patchExercise = useCallback((exerciseId: string, recipe: (exercise: ActiveWorkout['exercises'][number]) => ActiveWorkout['exercises'][number]) => patchActive((active) => ({ ...active, exercises: active.exercises.map((exercise) => exercise.id === exerciseId ? recipe(exercise) : exercise) })), [patchActive]);
  const updateSet = useCallback((exerciseId: string, setId: string, field: 'reps' | 'weight' | 'rpe', value: string) => patchExercise(exerciseId, (exercise) => ({ ...exercise, logs: exercise.logs.map((set) => set.id === setId ? { ...set, [field]: value } : set) })), [patchExercise]);
  const updateWorkoutNotes = useCallback((notes: string) => patchActive((active) => ({ ...active, notes })), [patchActive]);
  const toggleSet = useCallback((exerciseId: string, setId: string) => { patchExercise(exerciseId, (exercise) => ({ ...exercise, logs: exercise.logs.map((set) => set.id === setId ? { ...set, completed: !set.completed, reps: set.reps || (exercise.type === 'Cardio' ? String(exercise.durationMinutes ?? '') : exercise.repTarget.split('–')[0]) } : set) })); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, [patchExercise]);
  const setSetKind = useCallback((exerciseId: string, setId: string, kind: 'warmup' | 'working') => patchExercise(exerciseId, (exercise) => ({ ...exercise, logs: exercise.logs.map((set) => set.id === setId ? { ...set, kind } : set) })), [patchExercise]);
  const addSet = useCallback((exerciseId: string, copyPrevious = false) => patchExercise(exerciseId, (exercise) => { const previous = exercise.logs.at(-1); return { ...exercise, logs: [...exercise.logs, { id: `${exerciseId}-${Date.now()}`, reps: copyPrevious ? previous?.reps ?? '' : '', weight: copyPrevious ? previous?.weight ?? '' : '', rpe: copyPrevious ? previous?.rpe ?? '' : '', completed: false, kind: previous?.kind ?? 'working' }] }; }), [patchExercise]);
  const removeSet = useCallback((exerciseId: string, setId: string) => patchExercise(exerciseId, (exercise) => ({ ...exercise, logs: exercise.logs.length > 1 ? exercise.logs.filter((set) => set.id !== setId) : exercise.logs })), [patchExercise]);
  const skipExercise = useCallback((exerciseId: string) => patchActive((active) => ({ ...active, exercises: active.exercises.filter((exercise) => exercise.id !== exerciseId) })), [patchActive]);
  const substituteExercise = useCallback((exerciseId: string, definition: ExerciseDefinition) => patchExercise(exerciseId, (exercise) => ({ ...exercise, name: definition.name, muscle: definition.primaryMuscle, equipment: definition.equipment, type: definition.type, movement: definition.movement, notes: `Substituted for ${exercise.name}.`, logs: exercise.logs.map((set) => ({ ...set, weight: '' })) })), [patchExercise]);
  const startRest = useCallback((seconds: number) => patchActive((active) => ({ ...active, restEndAt: Date.now() + seconds * 1000, pausedRestSeconds: null })), [patchActive]);
  const pauseRest = useCallback(() => patchActive((active) => active.restEndAt ? { ...active, pausedRestSeconds: Math.max(1, Math.ceil((active.restEndAt - Date.now()) / 1000)), restEndAt: null } : active.pausedRestSeconds ? { ...active, restEndAt: Date.now() + active.pausedRestSeconds * 1000, pausedRestSeconds: null } : active), [patchActive]);
  const skipRest = useCallback(() => patchActive((active) => ({ ...active, restEndAt: null, pausedRestSeconds: null })), [patchActive]);
  const resetRest = useCallback((seconds: number) => patchActive((active) => ({ ...active, restEndAt: Date.now() + seconds * 1000, pausedRestSeconds: null })), [patchActive]);
  const finishWorkout = useCallback(() => { if (finishing.current) return null; finishing.current = true; let completed: WorkoutSession | null = null; setState((current) => { if (!current.activeWorkout) return current; const active = current.activeWorkout; const logs = active.exercises.flatMap((exercise) => exercise.logs); const volume = active.exercises.reduce((sum, exercise) => sum + exercise.logs.reduce((exerciseSum, set) => set.completed && set.kind !== 'warmup' ? exerciseSum + Number(set.reps || 0) * Number(set.weight || 0) : exerciseSum, 0), 0); completed = { ...active, completedAt: Date.now(), durationSeconds: Math.max(60, Math.round((Date.now() - active.startedAt) / 1000)), totalVolume: Math.round(volume), completedSets: logs.filter((set) => set.completed).length }; const scheduledId = active.scheduledWorkoutId ?? current.schedule.filter((item) => item.planId === active.planId && item.status === 'upcoming').sort((a, b) => Math.abs(new Date(a.startISO).getTime() - active.startedAt) - Math.abs(new Date(b.startISO).getTime() - active.startedAt))[0]?.id; return { ...current, activeWorkout: null, history: [completed, ...current.history.filter((item) => item.id !== completed?.id)], schedule: current.schedule.map((item) => item.id === scheduledId ? advanceRecurringWorkout(item) : item) }; }); queueMicrotask(() => { finishing.current = false; }); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); return completed; }, []);
  const savePlan = useCallback((plan: WorkoutPlan) => setState((current) => ({ ...current, plans: current.plans.some((item) => item.id === plan.id) ? current.plans.map((item) => item.id === plan.id ? plan : item) : [plan, ...current.plans] })), []);
  const removePlan = useCallback((id: string) => setState((current) => ({ ...current, plans: current.plans.filter((item) => item.id !== id), schedule: current.schedule.filter((item) => item.planId !== id), programs: current.programs.map((program) => ({ ...program, workoutIds: program.workoutIds.filter((item) => item !== id) })) })), []);
  const duplicatePlan = useCallback((id: string) => { let newId: string | null = null; setState((current) => { const source = current.plans.find((item) => item.id === id); if (!source) return current; newId = `${source.id}-copy-${Date.now()}`; return { ...current, plans: [{ ...source, id: newId, name: `${source.name} copy`, createdAt: Date.now(), exercises: source.exercises.map((exercise) => ({ ...exercise, id: `${exercise.id}-${Date.now()}` })) }, ...current.plans] }; }); return newId; }, []);
  const importTemplate = useCallback((template: WorkoutTemplate) => setState((current) => {
    const importedAt = Date.now();
    const nextOccurrence = (weekday: number) => { const now = new Date(); const date = new Date(now); let days = (weekday - date.getDay() + 7) % 7; date.setDate(date.getDate() + days); date.setHours(weekday === 0 ? 10 : 17, 0, 0, 0); if (days === 0 && date.getTime() <= now.getTime()) { days = 7; date.setDate(date.getDate() + days); } return date.toISOString(); };
    const plans = mergeById(current.plans, template.plans.map((plan) => ({ ...plan, createdAt: importedAt })));
    const scheduleItems: ScheduledWorkout[] = template.schedule.filter((item) => item.planId).map((item) => ({ id: `${template.id}-day-${item.day}`, planId: item.planId!, title: item.label, startISO: nextOccurrence(item.day), durationMinutes: Number(item.duration.match(/\d+/)?.[0]) || 30, recurrence: 'weekly', weekdays: [item.day], status: 'upcoming', optional: item.optional }));
    const schedule = [
      ...current.schedule.map((item) => {
        const update = scheduleItems.find((candidate) => candidate.id === item.id);
        return update ? { ...item, planId: update.planId, title: update.title, durationMinutes: update.durationMinutes, recurrence: update.recurrence, weekdays: update.weekdays, optional: update.optional } : item;
      }),
      ...scheduleItems.filter((item) => !current.schedule.some((existing) => existing.id === item.id)),
    ];
    const trainingDays = template.schedule.filter((item) => item.planId && !item.optional).map((item) => item.day);
    const program: Program = { id: template.id, name: template.name, description: template.description, workoutIds: template.plans.map((plan) => plan.id), trainingDays, weeklyGoal: template.weeklyGoal, notes: [...template.progression, ...template.restGuidance], createdAt: importedAt };
    return { ...current, plans, schedule, programs: mergeById(current.programs, [program]) };
  }), []);
  const createBackup = useCallback((): KineticFormBackup => ({ app: 'KineticForm', schemaVersion: 4, exportedAt: new Date().toISOString(), data: state }), [state]);
  const restoreBackup = useCallback((raw: KineticFormBackup, mode: RestoreMode) => { const backup = validateBackup(raw); setState((current) => mode === 'replace' ? migrate(backup.data) : ({ ...current, displayName: backup.data.displayName || current.displayName, profile: { ...current.profile, ...(backup.data.profile ?? {}) }, plans: mergeById(current.plans, backup.data.plans), history: mergeById(current.history, backup.data.history), customExercises: mergeById(current.customExercises, backup.data.customExercises), schedule: mergeById(current.schedule, backup.data.schedule), programs: mergeById(current.programs, backup.data.programs), preferences: { ...current.preferences, ...backup.data.preferences } })); }, []);
  const value = useMemo<WorkoutContextValue>(() => ({ ...state, hydrated, startWorkout, updateSet, updateWorkoutNotes, toggleSet, setSetKind, addSet, removeSet, skipExercise, substituteExercise, startRest, pauseRest, skipRest, resetRest, finishWorkout, savePlan, removePlan, duplicatePlan, importTemplate, createBackup, restoreBackup, discardWorkout: () => setState((current) => ({ ...current, activeWorkout: null })), setDisplayName: (displayName) => setState((current) => ({ ...current, displayName })), updateProfile: (profile, displayName) => setState((current) => ({ ...current, displayName: displayName.trim() || 'Athlete', profile })), toggleWeightUnit: () => setState((current) => ({ ...current, weightUnit: current.weightUnit === 'kg' ? 'lb' : 'kg' })), addCustomExercise: (exercise) => setState((current) => ({ ...current, customExercises: [exercise, ...current.customExercises.filter((item) => item.id !== exercise.id)] })), saveSchedule: (item) => setState((current) => {
    const matchingId = current.schedule.find((entry) => entry.id === item.id || Boolean(item.googleEventId && entry.googleEventId === item.googleEventId))?.id;
    return { ...current, schedule: matchingId ? current.schedule.map((entry) => entry.id === matchingId ? { ...item, id: matchingId } : entry) : [item, ...current.schedule] };
  }), removeSchedule: (id) => setState((current) => ({ ...current, schedule: current.schedule.filter((item) => item.id !== id) })), markSchedule: (id, status) => setState((current) => ({ ...current, schedule: current.schedule.map((item) => item.id === id ? (status === 'completed' ? advanceRecurringWorkout(item) : { ...item, status }) : item) })), saveProgram: (program) => setState((current) => ({ ...current, programs: current.programs.some((item) => item.id === program.id) ? current.programs.map((item) => item.id === program.id ? program : item) : [program, ...current.programs] })), completeOnboarding: (preferences) => setState((current) => ({ ...current, onboardingComplete: true, preferences })) }), [state, hydrated, startWorkout, updateSet, updateWorkoutNotes, toggleSet, setSetKind, addSet, removeSet, skipExercise, substituteExercise, startRest, pauseRest, skipRest, resetRest, finishWorkout, savePlan, removePlan, duplicatePlan, importTemplate, createBackup, restoreBackup]);
  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}
export function useWorkout() { const context = useContext(WorkoutContext); if (!context) throw new Error('useWorkout must be used inside WorkoutProvider'); return context; }
