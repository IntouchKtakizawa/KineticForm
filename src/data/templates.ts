import { WorkoutTemplate } from '@/types/workout';

const guidance = 'Start light and use the first session to find a controlled working weight. Keep 2–3 good reps in reserve; technique comes before load.';

export const kentaWorkoutTemplate: WorkoutTemplate = {
  id: 'kenta-goated-workout-template',
  name: "Kenta's goated workout template",
  description: 'Three full-body sessions each week, with one optional light Flex day on Tuesday or Thursday.',
  weeklyGoal: 3,
  schedule: [
    { day: 1, label: 'Rest', duration: '—', rest: true },
    { day: 2, label: 'Optional Flex', planId: 'kenta-flex', duration: '25–35 min', optional: true },
    { day: 3, label: 'Full Body A', planId: 'kenta-full-body-a', duration: '45–55 min' },
    { day: 4, label: 'Optional Flex', planId: 'kenta-flex', duration: '25–35 min', optional: true },
    { day: 5, label: 'Full Body B', planId: 'kenta-full-body-b', duration: '45–55 min' },
    { day: 6, label: 'Rest', duration: '—', rest: true },
    { day: 0, label: 'Full Body C', planId: 'kenta-full-body-c', duration: '45–60 min' },
  ],
  progression: [
    'Use the listed rep range with controlled technique; do not train to failure.',
    'When every working set reaches the top of the range with 2–3 good reps still in reserve, add the smallest practical amount of weight next time.',
    'If technique breaks down or the bottom of the range is not comfortable, keep the load the same or reduce it.',
    'No one-rep-max testing is needed. Consistent, gradual progress is the goal.',
  ],
  restGuidance: [
    'Rest about 90–120 seconds after squats, presses, rows, split squats, and Romanian deadlifts.',
    'Rest about 60–90 seconds after raises, curls, triceps work, and core exercises.',
    'Take longer when needed to keep technique controlled; the timer is guidance, not a test.',
  ],
  plans: [
    {
      id: 'kenta-full-body-a',
      name: 'Full Body A',
      focus: 'Full body · Wednesday',
      durationMinutes: 50,
      notes: guidance,
      exercises: [
        { id: 'kenta-a-goblet-squat', name: 'Goblet Squat', muscle: 'Legs', equipment: 'Dumbbell', type: 'Strength', movement: 'Squat', sets: 3, repTarget: '8–12', restSeconds: 120, suggestedWeight: 0 },
        { id: 'kenta-a-db-bench', name: 'Dumbbell Bench Press', muscle: 'Chest', equipment: 'Dumbbells + bench', type: 'Strength', movement: 'Horizontal push', sets: 3, repTarget: '8–12', restSeconds: 120, suggestedWeight: 0 },
        { id: 'kenta-a-one-arm-row', name: 'One-Arm Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell + bench', type: 'Strength', movement: 'Horizontal pull', sets: 3, repTarget: '8–12/side', restSeconds: 90, suggestedWeight: 0 },
        { id: 'kenta-a-rdl', name: 'Dumbbell Romanian Deadlift', muscle: 'Hamstrings', equipment: 'Dumbbells', type: 'Strength', movement: 'Hinge', sets: 3, repTarget: '10–12', restSeconds: 120, suggestedWeight: 0 },
        { id: 'kenta-a-shoulder-press', name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', equipment: 'Dumbbells', type: 'Strength', movement: 'Vertical push', sets: 2, repTarget: '10–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'kenta-a-plank', name: 'Plank', muscle: 'Core', equipment: 'Floor', type: 'Timed', movement: 'Core stability', sets: 3, repTarget: '20–45 sec', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-a-treadmill', name: 'Treadmill', muscle: 'Cardio', equipment: 'Treadmill', type: 'Cardio', movement: 'Cardio', sets: 1, repTarget: '10 min', restSeconds: 0, suggestedWeight: 0, durationMinutes: 10 },
      ],
    },
    {
      id: 'kenta-full-body-b',
      name: 'Full Body B',
      focus: 'Full body · Friday',
      durationMinutes: 50,
      notes: guidance,
      exercises: [
        { id: 'kenta-b-split-squat', name: 'Dumbbell Split Squat', muscle: 'Legs', equipment: 'Dumbbells', type: 'Strength', movement: 'Single-leg squat', sets: 3, repTarget: '8–10/leg', restSeconds: 120, suggestedWeight: 0 },
        { id: 'kenta-b-incline-press', name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbells + bench', type: 'Strength', movement: 'Incline push', sets: 3, repTarget: '8–12', restSeconds: 120, suggestedWeight: 0 },
        { id: 'kenta-b-db-row', name: 'Dumbbell Row', muscle: 'Back', equipment: 'Dumbbells', type: 'Strength', movement: 'Horizontal pull', sets: 3, repTarget: '10–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'kenta-b-rdl', name: 'Dumbbell Romanian Deadlift', muscle: 'Hamstrings', equipment: 'Dumbbells', type: 'Strength', movement: 'Hinge', sets: 3, repTarget: '8–12', restSeconds: 120, suggestedWeight: 0 },
        { id: 'kenta-b-curl', name: 'Dumbbell Bicep Curl', muscle: 'Biceps', equipment: 'Dumbbells', type: 'Strength', movement: 'Elbow flexion', sets: 2, repTarget: '10–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-b-tricep', name: 'Dumbbell Tricep Extension', muscle: 'Triceps', equipment: 'Dumbbell', type: 'Strength', movement: 'Elbow extension', sets: 2, repTarget: '10–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-b-dead-bug', name: 'Dead Bug', muscle: 'Core', equipment: 'Floor', type: 'Strength', movement: 'Core stability', sets: 3, repTarget: '8–12/side', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-b-treadmill', name: 'Treadmill', muscle: 'Cardio', equipment: 'Treadmill', type: 'Cardio', movement: 'Cardio', sets: 1, repTarget: '10–15 min', restSeconds: 0, suggestedWeight: 0, durationMinutes: 10 },
      ],
    },
    {
      id: 'kenta-full-body-c',
      name: 'Full Body C',
      focus: 'Lighter full body · Sunday',
      durationMinutes: 55,
      notes: `${guidance} Keep this session slightly lighter so Monday recovery stays comfortable.`,
      exercises: [
        { id: 'kenta-c-goblet-squat', name: 'Goblet Squat', muscle: 'Legs', equipment: 'Dumbbell', type: 'Strength', movement: 'Squat', sets: 3, repTarget: '10–15', restSeconds: 90, suggestedWeight: 0 },
        { id: 'kenta-c-db-bench', name: 'Dumbbell Bench Press', muscle: 'Chest', equipment: 'Dumbbells + bench', type: 'Strength', movement: 'Horizontal push', sets: 3, repTarget: '10–12', restSeconds: 90, suggestedWeight: 0 },
        { id: 'kenta-c-one-arm-row', name: 'One-Arm Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell + bench', type: 'Strength', movement: 'Horizontal pull', sets: 3, repTarget: '10–12/side', restSeconds: 90, suggestedWeight: 0 },
        { id: 'kenta-c-lateral-raise', name: 'Dumbbell Lateral Raise', muscle: 'Shoulders', equipment: 'Dumbbells', type: 'Strength', movement: 'Abduction', sets: 2, repTarget: '12–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-c-curl', name: 'Dumbbell Curl', muscle: 'Biceps', equipment: 'Dumbbells', type: 'Strength', movement: 'Elbow flexion', sets: 2, repTarget: '10–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-c-plank', name: 'Plank', muscle: 'Core', equipment: 'Floor', type: 'Timed', movement: 'Core stability', sets: 3, setTarget: '2–3', repTarget: '20–45 sec', restSeconds: 60, suggestedWeight: 0, notes: 'Complete two controlled sets; add the third only if technique stays solid.' },
        { id: 'kenta-c-treadmill', name: 'Treadmill', muscle: 'Cardio', equipment: 'Treadmill', type: 'Cardio', movement: 'Cardio', sets: 1, repTarget: '15–20 min', restSeconds: 0, suggestedWeight: 0, durationMinutes: 15 },
      ],
    },
    {
      id: 'kenta-flex',
      name: 'Optional Flex',
      focus: 'Light cardio · Core · Mobility',
      durationMinutes: 30,
      notes: 'Choose Tuesday or Thursday, not necessarily both. Keep this light enough that it does not interfere with the next main workout. Skipping it never counts as a miss.',
      exercises: [
        { id: 'kenta-flex-treadmill', name: 'Treadmill brisk walk / light jog', muscle: 'Cardio', equipment: 'Treadmill', type: 'Cardio', movement: 'Cardio', purpose: 'Cardio', sets: 1, repTarget: '10–15 min', restSeconds: 0, suggestedWeight: 0, durationMinutes: 10 },
        { id: 'kenta-flex-bicep-curls', name: 'Dumbbell Bicep Curls', muscle: 'Biceps', equipment: 'Dumbbells', type: 'Strength', movement: 'Elbow flexion', purpose: 'Arms', sets: 2, repTarget: '10–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-flex-lateral-raises', name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', equipment: 'Dumbbells', type: 'Strength', movement: 'Abduction', purpose: 'Shoulders', sets: 2, repTarget: '10–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-flex-tricep-extensions', name: 'Dumbbell Tricep Extensions', muscle: 'Triceps', equipment: 'Dumbbell', type: 'Strength', movement: 'Elbow extension', purpose: 'Arms', sets: 2, repTarget: '10–15', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-flex-plank', name: 'Plank', muscle: 'Core', equipment: 'Floor', type: 'Timed', movement: 'Core stability', purpose: 'Core', sets: 2, repTarget: '20–45 sec', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-flex-dead-bug', name: 'Dead Bug', muscle: 'Core', equipment: 'Floor', type: 'Strength', movement: 'Core stability', purpose: 'Core', sets: 2, repTarget: '8–12/side', restSeconds: 60, suggestedWeight: 0 },
        { id: 'kenta-flex-stretching', name: 'Light Stretching', muscle: 'Mobility', equipment: 'Floor', type: 'Duration', movement: 'Mobility', purpose: 'Cooldown', sets: 1, repTarget: '3–5 min', restSeconds: 0, suggestedWeight: 0, durationMinutes: 3 },
      ],
    },
  ],
};

export const builtInTemplates = [kentaWorkoutTemplate];
