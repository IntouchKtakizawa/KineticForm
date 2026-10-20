import { WorkoutPlan } from '@/types/workout';

export type WorkoutCategory = 'All' | 'Quick' | 'Full body' | 'Upper' | 'Lower' | 'Cardio';

export type CatalogWorkout = {
  plan: WorkoutPlan;
  category: Exclude<WorkoutCategory, 'All'>;
  equipment: string;
  level: string;
  color: 'purple' | 'green' | 'warm';
};

const safeStart = 'Begin with an easy warm-up. Use a controlled range, leave 2–3 good reps in reserve, and stop if you feel sharp pain.';

export const workoutCatalog: CatalogWorkout[] = [
  {
    category: 'Quick', equipment: 'Bodyweight', level: 'All levels', color: 'warm',
    plan: {
      id: 'catalog-quick-reset', name: '20-Minute Reset', focus: 'Full body · No equipment', durationMinutes: 20, notes: `${safeStart} Move steadily rather than racing the clock.`,
      exercises: [
        { id: 'reset-squat', name: 'Bodyweight Squat', muscle: 'Legs', equipment: 'Bodyweight', type: 'Strength', movement: 'Squat', sets: 3, repTarget: '10–15', restSeconds: 45, suggestedWeight: 0 },
        { id: 'reset-push-up', name: 'Push-Up', muscle: 'Chest', equipment: 'Bodyweight', type: 'Strength', movement: 'Push', sets: 3, repTarget: '6–15', restSeconds: 60, suggestedWeight: 0, notes: 'Use a bench or wall if floor push-ups are not controlled yet.' },
        { id: 'reset-glute-bridge', name: 'Glute Bridge', muscle: 'Legs', equipment: 'Bodyweight', type: 'Strength', movement: 'Hinge', sets: 3, repTarget: '12–20', restSeconds: 45, suggestedWeight: 0 },
        { id: 'reset-dead-bug', name: 'Dead Bug', muscle: 'Core', equipment: 'Bodyweight', type: 'Strength', movement: 'Core stability', sets: 2, repTarget: '8–10/side', restSeconds: 45, suggestedWeight: 0 },
        { id: 'reset-walk', name: 'Brisk Walking', muscle: 'Cardio', equipment: 'Bodyweight', type: 'Cardio', movement: 'Walk', sets: 1, repTarget: '5 min', restSeconds: 0, suggestedWeight: 0, durationMinutes: 5 },
      ],
    },
  },
  {
    category: 'Full body', equipment: 'Dumbbells', level: 'Beginner friendly', color: 'purple',
    plan: {
      id: 'catalog-dumbbell-full-body', name: 'Dumbbell Full Body', focus: 'Strength · Balanced', durationMinutes: 35, notes: safeStart,
      exercises: [
        { id: 'dbfb-goblet', name: 'Goblet Squat', muscle: 'Legs', equipment: 'Dumbbell', type: 'Strength', movement: 'Squat', sets: 3, repTarget: '8–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'dbfb-bench', name: 'Dumbbell Bench Press', muscle: 'Chest', equipment: 'Dumbbells + bench', type: 'Strength', movement: 'Horizontal push', sets: 3, repTarget: '8–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'dbfb-row', name: 'One-Arm Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell + bench', type: 'Strength', movement: 'Horizontal pull', sets: 3, repTarget: '8–12/side', restSeconds: 75, suggestedWeight: 0 },
        { id: 'dbfb-rdl', name: 'Dumbbell Romanian Deadlift', muscle: 'Legs', equipment: 'Dumbbells', type: 'Strength', movement: 'Hinge', sets: 3, repTarget: '8–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'dbfb-plank', name: 'Plank', muscle: 'Core', equipment: 'Bodyweight', type: 'Timed', movement: 'Core stability', sets: 2, repTarget: '20–45 sec', restSeconds: 45, suggestedWeight: 0 },
      ],
    },
  },
  {
    category: 'Upper', equipment: 'Dumbbells', level: 'All levels', color: 'purple',
    plan: {
      id: 'catalog-dumbbell-upper', name: 'Dumbbell Upper', focus: 'Chest · Back · Shoulders', durationMinutes: 40, notes: safeStart,
      exercises: [
        { id: 'dbupper-incline', name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbells + bench', type: 'Strength', movement: 'Incline push', sets: 3, repTarget: '8–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'dbupper-row', name: 'One-Arm Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell + bench', type: 'Strength', movement: 'Horizontal pull', sets: 3, repTarget: '8–12/side', restSeconds: 90, suggestedWeight: 0 },
        { id: 'dbupper-press', name: 'Seated Dumbbell Press', muscle: 'Shoulders', equipment: 'Dumbbells', type: 'Strength', movement: 'Vertical push', sets: 3, repTarget: '8–12', restSeconds: 75, suggestedWeight: 0 },
        { id: 'dbupper-raise', name: 'Dumbbell Lateral Raise', muscle: 'Shoulders', equipment: 'Dumbbells', type: 'Strength', movement: 'Abduction', sets: 2, repTarget: '12–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'dbupper-curl', name: 'Hammer Curl', muscle: 'Biceps', equipment: 'Dumbbells', type: 'Strength', movement: 'Elbow flexion', sets: 2, repTarget: '10–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'dbupper-triceps', name: 'Overhead Triceps Extension', muscle: 'Triceps', equipment: 'Dumbbell', type: 'Strength', movement: 'Elbow extension', sets: 2, repTarget: '10–15', restSeconds: 60, suggestedWeight: 0 },
      ],
    },
  },
  {
    category: 'Lower', equipment: 'Dumbbells', level: 'All levels', color: 'green',
    plan: {
      id: 'catalog-dumbbell-lower', name: 'Dumbbell Lower + Core', focus: 'Legs · Glutes · Core', durationMinutes: 40, notes: safeStart,
      exercises: [
        { id: 'dblower-goblet', name: 'Goblet Squat', muscle: 'Legs', equipment: 'Dumbbell', type: 'Strength', movement: 'Squat', sets: 3, repTarget: '8–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'dblower-rdl', name: 'Dumbbell Romanian Deadlift', muscle: 'Legs', equipment: 'Dumbbells', type: 'Strength', movement: 'Hinge', sets: 3, repTarget: '8–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'dblower-split', name: 'Dumbbell Split Squat', muscle: 'Legs', equipment: 'Dumbbells', type: 'Strength', movement: 'Single-leg squat', sets: 3, repTarget: '8–10/leg', restSeconds: 90, suggestedWeight: 0 },
        { id: 'dblower-calf', name: 'Standing Calf Raise', muscle: 'Legs', equipment: 'Bodyweight or dumbbells', type: 'Strength', movement: 'Plantar flexion', sets: 3, repTarget: '12–20', restSeconds: 45, suggestedWeight: 0 },
        { id: 'dblower-side-plank', name: 'Side Plank', muscle: 'Core', equipment: 'Bodyweight', type: 'Timed', movement: 'Core stability', sets: 2, repTarget: '20–40 sec/side', restSeconds: 45, suggestedWeight: 0 },
      ],
    },
  },
  {
    category: 'Upper', equipment: 'Full gym', level: 'Some experience', color: 'purple',
    plan: {
      id: 'catalog-push', name: 'Push Strength', focus: 'Chest · Shoulders · Triceps', durationMinutes: 45, notes: safeStart,
      exercises: [
        { id: 'push-bench', name: 'Barbell Bench Press', muscle: 'Chest', equipment: 'Barbell', type: 'Strength', movement: 'Horizontal push', sets: 4, repTarget: '6–10', restSeconds: 120, suggestedWeight: 0 },
        { id: 'push-incline', name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbells + bench', type: 'Strength', movement: 'Incline push', sets: 3, repTarget: '8–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'push-shoulder', name: 'Seated Dumbbell Press', muscle: 'Shoulders', equipment: 'Dumbbells', type: 'Strength', movement: 'Vertical push', sets: 3, repTarget: '8–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'push-lateral', name: 'Cable Lateral Raise', muscle: 'Shoulders', equipment: 'Cables', type: 'Strength', movement: 'Abduction', sets: 3, repTarget: '12–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'push-triceps', name: 'Triceps Pushdown', muscle: 'Triceps', equipment: 'Cables', type: 'Strength', movement: 'Elbow extension', sets: 3, repTarget: '10–15', restSeconds: 60, suggestedWeight: 0 },
      ],
    },
  },
  {
    category: 'Upper', equipment: 'Full gym', level: 'Some experience', color: 'green',
    plan: {
      id: 'catalog-pull', name: 'Pull Strength', focus: 'Back · Biceps · Rear delts', durationMinutes: 45, notes: safeStart,
      exercises: [
        { id: 'pull-pulldown', name: 'Lat Pulldown', muscle: 'Back', equipment: 'Cables', type: 'Strength', movement: 'Vertical pull', sets: 4, repTarget: '8–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'pull-row', name: 'Chest-Supported Row', muscle: 'Back', equipment: 'Machines', type: 'Strength', movement: 'Horizontal pull', sets: 4, repTarget: '8–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'pull-face', name: 'Face Pull', muscle: 'Shoulders', equipment: 'Cables', type: 'Strength', movement: 'Horizontal pull', sets: 3, repTarget: '12–20', restSeconds: 60, suggestedWeight: 0 },
        { id: 'pull-curl', name: 'Hammer Curl', muscle: 'Biceps', equipment: 'Dumbbells', type: 'Strength', movement: 'Elbow flexion', sets: 3, repTarget: '10–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'pull-dead-bug', name: 'Dead Bug', muscle: 'Core', equipment: 'Bodyweight', type: 'Strength', movement: 'Core stability', sets: 2, repTarget: '8–12/side', restSeconds: 45, suggestedWeight: 0 },
      ],
    },
  },
  {
    category: 'Lower', equipment: 'Full gym', level: 'Some experience', color: 'warm',
    plan: {
      id: 'catalog-legs', name: 'Legs + Core', focus: 'Quads · Hamstrings · Core', durationMinutes: 50, notes: safeStart,
      exercises: [
        { id: 'legs-squat', name: 'Barbell Back Squat', muscle: 'Legs', equipment: 'Barbell', type: 'Strength', movement: 'Squat', sets: 4, repTarget: '6–10', restSeconds: 150, suggestedWeight: 0 },
        { id: 'legs-rdl', name: 'Romanian Deadlift', muscle: 'Legs', equipment: 'Barbell', type: 'Strength', movement: 'Hinge', sets: 3, repTarget: '8–10', restSeconds: 120, suggestedWeight: 0 },
        { id: 'legs-lunge', name: 'Walking Lunge', muscle: 'Legs', equipment: 'Dumbbells', type: 'Strength', movement: 'Lunge', sets: 3, repTarget: '8–12/leg', restSeconds: 90, suggestedWeight: 0 },
        { id: 'legs-curl', name: 'Lying Leg Curl', muscle: 'Legs', equipment: 'Machines', type: 'Strength', movement: 'Knee flexion', sets: 3, repTarget: '10–15', restSeconds: 75, suggestedWeight: 0 },
        { id: 'legs-plank', name: 'Plank', muscle: 'Core', equipment: 'Bodyweight', type: 'Timed', movement: 'Core stability', sets: 3, repTarget: '30–60 sec', restSeconds: 45, suggestedWeight: 0 },
      ],
    },
  },
  {
    category: 'Cardio', equipment: 'No gym needed', level: 'Easy day', color: 'green',
    plan: {
      id: 'catalog-cardio-mobility', name: 'Cardio + Mobility', focus: 'Recovery · Movement quality', durationMinutes: 25, notes: 'Keep the cardio conversational and every stretch comfortable. This should help recovery, not create more fatigue.',
      exercises: [
        { id: 'cardio-walk', name: 'Brisk Walking', muscle: 'Cardio', equipment: 'Bodyweight', type: 'Cardio', movement: 'Walk', sets: 1, repTarget: '15 min', restSeconds: 0, suggestedWeight: 0, durationMinutes: 15 },
        { id: 'cardio-cat-cow', name: 'Cat-Cow', muscle: 'Mobility', equipment: 'Floor', type: 'Duration', movement: 'Mobility', sets: 1, repTarget: '60 sec', restSeconds: 0, suggestedWeight: 0, durationMinutes: 1 },
        { id: 'cardio-hip-flexor', name: 'Hip Flexor Stretch', muscle: 'Mobility', equipment: 'Floor', type: 'Duration', movement: 'Mobility', sets: 2, repTarget: '30 sec/side', restSeconds: 15, suggestedWeight: 0 },
        { id: 'cardio-thoracic', name: 'Open Book Rotation', muscle: 'Mobility', equipment: 'Floor', type: 'Duration', movement: 'Mobility', sets: 2, repTarget: '6/side', restSeconds: 15, suggestedWeight: 0 },
        { id: 'cardio-breathing', name: 'Easy Breathing', muscle: 'Recovery', equipment: 'Floor', type: 'Duration', movement: 'Recovery', sets: 1, repTarget: '2 min', restSeconds: 0, suggestedWeight: 0, durationMinutes: 2 },
      ],
    },
  },
];

export const workoutCategories: WorkoutCategory[] = ['All', 'Quick', 'Full body', 'Upper', 'Lower', 'Cardio'];
