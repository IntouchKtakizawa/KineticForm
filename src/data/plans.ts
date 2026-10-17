import { WorkoutPlan, WorkoutSession } from '@/types/workout';

export const workoutPlans: WorkoutPlan[] = [
  {
    id: 'upper-strength',
    name: 'Upper Strength',
    focus: 'Chest · Back · Shoulders',
    durationMinutes: 52,
    exercises: [
      { id: 'bench', name: 'Barbell Bench Press', muscle: 'Chest', sets: 4, repTarget: '6–8', restSeconds: 120, suggestedWeight: 45 },
      { id: 'row', name: 'Chest-Supported Row', muscle: 'Back', sets: 4, repTarget: '8–10', restSeconds: 90, suggestedWeight: 32.5 },
      { id: 'press', name: 'Seated DB Press', muscle: 'Shoulders', sets: 3, repTarget: '8–10', restSeconds: 90, suggestedWeight: 14 },
      { id: 'pulldown', name: 'Lat Pulldown', muscle: 'Back', sets: 3, repTarget: '10–12', restSeconds: 75, suggestedWeight: 40 },
      { id: 'raise', name: 'Cable Lateral Raise', muscle: 'Shoulders', sets: 3, repTarget: '12–15', restSeconds: 60, suggestedWeight: 7.5 },
    ],
  },
];

const completedExercise = workoutPlans[0].exercises.map((exercise) => ({
  ...exercise,
  logs: Array.from({ length: exercise.sets }, (_, index) => ({
    id: `${exercise.id}-${index}`,
    reps: String(index === exercise.sets - 1 ? 7 : 8),
    weight: String(exercise.suggestedWeight),
    completed: true,
  })),
}));

export const starterHistory: WorkoutSession[] = [
  { id: 'seed-1', planId: 'upper-strength', name: 'Upper Strength', completedAt: Date.now() - 3 * 86400000, durationSeconds: 3180, totalVolume: 6320, completedSets: 17, exercises: completedExercise },
  { id: 'seed-2', planId: 'upper-strength', name: 'Upper Strength', completedAt: Date.now() - 8 * 86400000, durationSeconds: 3300, totalVolume: 5980, completedSets: 17, exercises: completedExercise },
  { id: 'seed-3', planId: 'upper-strength', name: 'Upper Strength', completedAt: Date.now() - 13 * 86400000, durationSeconds: 3420, totalVolume: 5650, completedSets: 16, exercises: completedExercise },
];
