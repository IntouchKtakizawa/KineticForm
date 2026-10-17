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
  equipment?: string;
  type?: string;
  movement?: string;
  notes?: string;
  durationMinutes?: number;
  distanceKm?: number;
};

export type ExerciseDefinition = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  type: string;
  movement: string;
  instructions: string[];
  setup: string;
  defaultSets: number;
  defaultReps: string;
  defaultRest: number;
  custom?: boolean;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  focus: string;
  durationMinutes: number;
  exercises: Exercise[];
  notes?: string;
  createdAt?: number;
};

export type ScheduleStatus = 'upcoming' | 'completed' | 'missed';

export type ScheduledWorkout = {
  id: string;
  planId: string;
  title: string;
  startISO: string;
  durationMinutes: number;
  recurrence: 'none' | 'weekly';
  weekdays?: number[];
  status: ScheduleStatus;
  googleEventId?: string;
  googleEventUrl?: string;
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
  plans: WorkoutPlan[];
  customExercises: ExerciseDefinition[];
  schedule: ScheduledWorkout[];
};
