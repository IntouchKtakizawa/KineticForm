import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { starterHistory, workoutPlans } from '@/data/plans';
import { ActiveWorkout, WorkoutSession, WorkoutState } from '@/types/workout';

const STORAGE_KEY = '@kineticform/workout-state-v1';

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
};

const initialState: WorkoutState = {
  activeWorkout: null,
  history: starterHistory,
  displayName: 'Athlete',
  weightUnit: 'kg',
};

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

function buildActiveWorkout(planId: string): ActiveWorkout {
  const plan = workoutPlans.find((item) => item.id === planId) ?? workoutPlans[0];
  return {
    id: `workout-${Date.now()}`,
    planId: plan.id,
    name: plan.name,
    startedAt: Date.now(),
    restEndAt: null,
    exercises: plan.exercises.map((exercise) => ({
      ...exercise,
      logs: Array.from({ length: exercise.sets }, (_, index) => ({
        id: `${exercise.id}-${Date.now()}-${index}`,
        reps: '',
        weight: String(exercise.suggestedWeight),
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
      .then((stored) => stored && setState(JSON.parse(stored) as WorkoutState))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const startWorkout = useCallback((planId = workoutPlans[0].id) => {
    setState((current) => ({ ...current, activeWorkout: current.activeWorkout ?? buildActiveWorkout(planId) }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const updateSet = useCallback((exerciseId: string, setId: string, field: 'reps' | 'weight', value: string) => {
    setState((current) => ({
      ...current,
      activeWorkout: current.activeWorkout ? {
        ...current.activeWorkout,
        exercises: current.activeWorkout.exercises.map((exercise) => exercise.id !== exerciseId ? exercise : {
          ...exercise,
          logs: exercise.logs.map((set) => set.id === setId ? { ...set, [field]: value } : set),
        }),
      } : null,
    }));
  }, []);

  const toggleSet = useCallback((exerciseId: string, setId: string) => {
    setState((current) => ({
      ...current,
      activeWorkout: current.activeWorkout ? {
        ...current.activeWorkout,
        exercises: current.activeWorkout.exercises.map((exercise) => exercise.id !== exerciseId ? exercise : {
          ...exercise,
          logs: exercise.logs.map((set) => set.id === setId ? { ...set, completed: !set.completed, reps: set.reps || exercise.repTarget.split('–')[0] } : set),
        }),
      } : null,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setState((current) => ({
      ...current,
      activeWorkout: current.activeWorkout ? {
        ...current.activeWorkout,
        exercises: current.activeWorkout.exercises.map((exercise) => exercise.id !== exerciseId ? exercise : {
          ...exercise,
          logs: [...exercise.logs, { id: `${exerciseId}-${Date.now()}`, reps: '', weight: String(exercise.suggestedWeight), completed: false }],
        }),
      } : null,
    }));
  }, []);

  const startRest = useCallback((seconds: number) => {
    setState((current) => ({ ...current, activeWorkout: current.activeWorkout ? { ...current.activeWorkout, restEndAt: Date.now() + seconds * 1000 } : null }));
  }, []);

  const skipRest = useCallback(() => setState((current) => ({ ...current, activeWorkout: current.activeWorkout ? { ...current.activeWorkout, restEndAt: null } : null })), []);

  const finishWorkout = useCallback(() => {
    let completed: WorkoutSession | null = null;
    setState((current) => {
      if (!current.activeWorkout) return current;
      const active = current.activeWorkout;
      const logs = active.exercises.flatMap((exercise) => exercise.logs);
      const volume = active.exercises.reduce((sum, exercise) => sum + exercise.logs.reduce((exerciseSum, set) => set.completed ? exerciseSum + Number(set.reps || 0) * Number(set.weight || 0) : exerciseSum, 0), 0);
      completed = { ...active, completedAt: Date.now(), durationSeconds: Math.max(60, Math.round((Date.now() - active.startedAt) / 1000)), totalVolume: Math.round(volume), completedSets: logs.filter((set) => set.completed).length };
      return { ...current, activeWorkout: null, history: [completed, ...current.history] };
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return completed;
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
    discardWorkout: () => setState((current) => ({ ...current, activeWorkout: null })),
    setDisplayName: (displayName: string) => setState((current) => ({ ...current, displayName })),
    toggleWeightUnit: () => setState((current) => ({ ...current, weightUnit: current.weightUnit === 'kg' ? 'lb' : 'kg' })),
  }), [state, hydrated, startWorkout, updateSet, toggleSet, addSet, startRest, skipRest, finishWorkout]);

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used inside WorkoutProvider');
  return context;
}
