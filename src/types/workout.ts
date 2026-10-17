export type SetLog = {
  id: string;
  reps: string;
  weight: string;
  completed: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  repTarget: string;
  restSeconds: number;
  suggestedWeight: number;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  focus: string;
  durationMinutes: number;
  exercises: Exercise[];
};

export type ActiveExercise = Exercise & { logs: SetLog[] };

export type ActiveWorkout = {
  id: string;
  planId: string;
  name: string;
  startedAt: number;
  restEndAt: number | null;
  exercises: ActiveExercise[];
};

export type WorkoutSession = {
  id: string;
  planId: string;
  name: string;
  completedAt: number;
  durationSeconds: number;
  totalVolume: number;
  completedSets: number;
  exercises: ActiveExercise[];
};

export type WorkoutState = {
  activeWorkout: ActiveWorkout | null;
  history: WorkoutSession[];
  displayName: string;
  weightUnit: 'kg' | 'lb';
};
