export type SetLog = {
  id: string;
  reps: string;
  weight: string;
  rpe?: string;
  completed: boolean;
  kind?: 'warmup' | 'working';
};

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  setTarget?: string;
  repTarget: string;
  restSeconds: number;
  suggestedWeight: number;
  equipment?: string;
  type?: string;
  movement?: string;
  purpose?: string;
  notes?: string;
  durationMinutes?: number;
  distanceKm?: number;
  importConfidence?: 'matched' | 'unmatched';
  originalText?: string;
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
  aliases?: string[];
  commonMistakes?: string[];
  substitutions?: string[];
};

export type Program = {
  id: string;
  name: string;
  description: string;
  workoutIds: string[];
  trainingDays?: number[];
  weeklyGoal?: number;
  notes?: string[];
  createdAt: number;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  description: string;
  weeklyGoal: number;
  plans: WorkoutPlan[];
  schedule: { day: number; label: string; planId?: string; duration: string; optional?: boolean; rest?: boolean }[];
  progression: string[];
  restGuidance: string[];
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
  optional?: boolean;
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
  pausedRestSeconds?: number | null;
  scheduledWorkoutId?: string;
  notes?: string;
  exercises: ActiveExercise[];
};

export type WorkoutSession = {
  id: string;
  planId: string;
  scheduledWorkoutId?: string;
  name: string;
  completedAt: number;
  durationSeconds: number;
  totalVolume: number;
  completedSets: number;
  notes?: string;
  exercises: ActiveExercise[];
};

export type UserProfile = {
  avatarEmoji: string;
  age?: number;
  heightCm?: number;
  bodyWeightKg?: number;
  targetWeightKg?: number;
  activityLevel: string;
  goalNote: string;
};

export type WorkoutState = {
  schemaVersion: 4;
  activeWorkout: ActiveWorkout | null;
  history: WorkoutSession[];
  displayName: string;
  profile: UserProfile;
  weightUnit: 'kg' | 'lb';
  plans: WorkoutPlan[];
  customExercises: ExerciseDefinition[];
  schedule: ScheduledWorkout[];
  programs: Program[];
  onboardingComplete: boolean;
  preferences: {
    goal: string;
    experience: string;
    equipment: string[];
    trainingDays: number[];
    sessionMinutes: number;
  };
};

export type KineticFormBackup = {
  app: 'KineticForm';
  schemaVersion: 3 | 4;
  exportedAt: string;
  data: WorkoutState;
};
