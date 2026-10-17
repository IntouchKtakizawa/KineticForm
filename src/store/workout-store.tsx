import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { starterHistory, workoutPlans } from '@/data/plans';
import { ActiveWorkout, ExerciseDefinition, ScheduledWorkout, WorkoutPlan, WorkoutSession, WorkoutState } from '@/types/workout';

const STORAGE_KEY = '@kineticform/workout-state-v2';

type WorkoutContextValue = WorkoutState & {
  hydrated: boolean;
  startWorkout: (planId?: string) => void;
  updateSet: (exerciseId: string, setId: string, field: 'reps' | 'weight', value: string) => void;
  toggleSet: (exerciseId: string, setId: string) => void;
  addSet: (exerciseId: string) => void;
  startRest: (seconds: number) => void;
  skipRest: () => void;
  finishWorkout: () => WorkoutSession | null;
  discardWorkout: () => void;
  setDisplayName: (name: string) => void;
  toggleWeightUnit: () => void;
  savePlan: (plan: WorkoutPlan) => void;
  removePlan: (id: string) => void;
  duplicatePlan: (id: string) => string | null;
  addCustomExercise: (exercise: ExerciseDefinition) => void;
  saveSchedule: (item: ScheduledWorkout) => void;
  removeSchedule: (id: string) => void;
  markSchedule: (id: string, status: ScheduledWorkout['status']) => void;
};

const now = new Date();
const nextDate = (days: number, hour: number) => {
  const date = new Date(now);
  date.setDate(now.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const initialSchedule: ScheduledWorkout[] = [
  { id: 'schedule-1', planId: 'upper-strength', title: 'Upper Strength', startISO: nextDate(1, 17), durationMinutes: 60, recurrence: 'none', status: 'upcoming' },
  { id: 'schedule-2', planId: 'upper-strength', title: 'Upper Strength', startISO: nextDate(4, 10), durationMinutes: 60, recurrence: 'weekly', weekdays: [1, 3, 5], status: 'upcoming' },
];

const initialState: WorkoutState = {
  activeWorkout: null,
  history: starterHistory,
  displayName: 'Athlete',
  weightUnit: 'kg',
  plans: workoutPlans,
  customExercises: [],
  schedule: initialSchedule,
};

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

function buildActiveWorkout(plan: WorkoutPlan): ActiveWorkout {
  return {
    id: `workout-${Date.now()}`,
    planId: plan.id,
    name: plan.name,
    startedAt: Date.now(),
    restEndAt: null,
    exercises: plan.exercises.map((exercise) => ({
      ...exercise,
      logs: Array.from({ length: exercise.type === 'Cardio' ? 1 : exercise.sets }, (_, index) => ({
        id: `${exercise.id}-${Date.now()}-${index}`,
        reps: exercise.type === 'Cardio' ? String(exercise.durationMinutes ?? '') : '',
        weight: exercise.type === 'Cardio' ? String(exercise.distanceKm ?? '') : String(exercise.suggestedWeight || ''),
        completed: false,
      })),
    })),
  };
}

export function WorkoutProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<WorkoutState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const saved = JSON.parse(stored) as Partial<WorkoutState>;
        setState({ ...initialState, ...saved, plans: saved.plans?.length ? saved.plans : workoutPlans, schedule: saved.schedule ?? initialSchedule, customExercises: saved.customExercises ?? [] });
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const startWorkout = useCallback((planId = workoutPlans[0].id) => {
    setState((current) => {
      const plan = current.plans.find((item) => item.id === planId) ?? current.plans[0] ?? workoutPlans[0];
      return { ...current, activeWorkout: current.activeWorkout ?? buildActiveWorkout(plan) };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const updateSet = useCallback((exerciseId: string, setId: string, field: 'reps' | 'weight', value: string) => {
    setState((current) => ({ ...current, activeWorkout: current.activeWorkout ? { ...current.activeWorkout, exercises: current.activeWorkout.exercises.map((exercise) => exercise.id !== exerciseId ? exercise : { ...exercise, logs: exercise.logs.map((set) => set.id === setId ? { ...set, [field]: value } : set) }) } : null }));
  }, []);

  const toggleSet = useCallback((exerciseId: string, setId: string) => {
    setState((current) => ({ ...current, activeWorkout: current.activeWorkout ? { ...current.activeWorkout, exercises: current.activeWorkout.exercises.map((exercise) => exercise.id !== exerciseId ? exercise : { ...exercise, logs: exercise.logs.map((set) => set.id === setId ? { ...set, completed: !set.completed, reps: set.reps || (exercise.type === 'Cardio' ? String(exercise.durationMinutes ?? '') : exercise.repTarget.split('–')[0]) } : set) }) } : null }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setState((current) => ({ ...current, activeWorkout: current.activeWorkout ? { ...current.activeWorkout, exercises: current.activeWorkout.exercises.map((exercise) => exercise.id !== exerciseId ? exercise : { ...exercise, logs: [...exercise.logs, { id: `${exerciseId}-${Date.now()}`, reps: exercise.type === 'Cardio' ? String(exercise.durationMinutes ?? '') : '', weight: exercise.type === 'Cardio' ? String(exercise.distanceKm ?? '') : String(exercise.suggestedWeight || ''), completed: false }] }) } : null }));
  }, []);

  const startRest = useCallback((seconds: number) => setState((current) => ({ ...current, activeWorkout: current.activeWorkout ? { ...current.activeWorkout, restEndAt: Date.now() + seconds * 1000 } : null })), []);
  const skipRest = useCallback(() => setState((current) => ({ ...current, activeWorkout: current.activeWorkout ? { ...current.activeWorkout, restEndAt: null } : null })), []);

  const finishWorkout = useCallback(() => {
    let completed: WorkoutSession | null = null;
    setState((current) => {
      if (!current.activeWorkout) return current;
      const active = current.activeWorkout;
      const logs = active.exercises.flatMap((exercise) => exercise.logs);
      const volume = active.exercises.reduce((sum, exercise) => sum + exercise.logs.reduce((exerciseSum, set) => set.completed ? exerciseSum + Number(set.reps || 0) * Number(set.weight || 0) : exerciseSum, 0), 0);
      completed = { ...active, completedAt: Date.now(), durationSeconds: Math.max(60, Math.round((Date.now() - active.startedAt) / 1000)), totalVolume: Math.round(volume), completedSets: logs.filter((set) => set.completed).length };
      const scheduledMatch = current.schedule.filter((item) => item.planId === active.planId && item.status === 'upcoming').sort((a, b) => Math.abs(new Date(a.startISO).getTime() - active.startedAt) - Math.abs(new Date(b.startISO).getTime() - active.startedAt))[0];
      const schedule = current.schedule.map((item) => item.id === scheduledMatch?.id ? { ...item, status: 'completed' as const } : item);
      return { ...current, activeWorkout: null, history: [completed, ...current.history], schedule };
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return completed;
  }, []);

  const savePlan = useCallback((plan: WorkoutPlan) => setState((current) => ({ ...current, plans: current.plans.some((item) => item.id === plan.id) ? current.plans.map((item) => item.id === plan.id ? plan : item) : [plan, ...current.plans] })), []);
  const removePlan = useCallback((id: string) => setState((current) => ({ ...current, plans: current.plans.filter((item) => item.id !== id), schedule: current.schedule.filter((item) => item.planId !== id) })), []);
  const duplicatePlan = useCallback((id: string) => {
    let newId: string | null = null;
    setState((current) => {
      const source = current.plans.find((item) => item.id === id);
      if (!source) return current;
      newId = `${source.id}-copy-${Date.now()}`;
      return { ...current, plans: [{ ...source, id: newId, name: `${source.name} copy`, createdAt: Date.now(), exercises: source.exercises.map((exercise) => ({ ...exercise, id: `${exercise.id}-${Date.now()}` })) }, ...current.plans] };
    });
    return newId;
  }, []);

  const value = useMemo(() => ({
    ...state,
    hydrated,
    startWorkout,
    updateSet,
    toggleSet,
    addSet,
    startRest,
    skipRest,
    finishWorkout,
    savePlan,
    removePlan,
    duplicatePlan,
    discardWorkout: () => setState((current) => ({ ...current, activeWorkout: null })),
    setDisplayName: (displayName: string) => setState((current) => ({ ...current, displayName })),
    toggleWeightUnit: () => setState((current) => ({ ...current, weightUnit: current.weightUnit === 'kg' ? 'lb' : 'kg' })),
    addCustomExercise: (exercise: ExerciseDefinition) => setState((current) => ({ ...current, customExercises: [exercise, ...current.customExercises] })),
    saveSchedule: (item: ScheduledWorkout) => setState((current) => ({ ...current, schedule: current.schedule.some((entry) => entry.id === item.id) ? current.schedule.map((entry) => entry.id === item.id ? item : entry) : [item, ...current.schedule] })),
    removeSchedule: (id: string) => setState((current) => ({ ...current, schedule: current.schedule.filter((item) => item.id !== id) })),
    markSchedule: (id: string, status: ScheduledWorkout['status']) => setState((current) => ({ ...current, schedule: current.schedule.map((item) => item.id === id ? { ...item, status } : item) })),
  }), [state, hydrated, startWorkout, updateSet, toggleSet, addSet, startRest, skipRest, finishWorkout, savePlan, removePlan, duplicatePlan]);

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used inside WorkoutProvider');
  return context;
}
