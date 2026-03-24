export type ExerciseInfo = {
  name: string;
  muscle: string;
  isCompound: boolean;
  bennyFavors?: boolean;
  bennyHates?: boolean;
};

export const EXERCISE_LIBRARY: ExerciseInfo[] = [
  { name: "Bench Press", muscle: "Chest", isCompound: true },
  { name: "Incline Bench Press", muscle: "Chest", isCompound: true },
  { name: "Dumbbell Flyes", muscle: "Chest", isCompound: false },
  { name: "Cable Crossovers", muscle: "Chest", isCompound: false },
  { name: "Push-ups", muscle: "Chest", isCompound: false },
  { name: "Dips", muscle: "Chest/Triceps", isCompound: true },
  { name: "Decline Bench Press", muscle: "Chest", isCompound: true },
  { name: "Machine Chest Press", muscle: "Chest", isCompound: false },
  { name: "Pec Deck / Machine Flyes", muscle: "Chest", isCompound: false },
  { name: "Deadlift", muscle: "Back/Full Body", isCompound: true, bennyFavors: true },
  { name: "Pull-ups", muscle: "Back", isCompound: true },
  { name: "Barbell Rows", muscle: "Back", isCompound: true },
  { name: "T-Bar Rows", muscle: "Back", isCompound: true },
  { name: "Lat Pulldowns", muscle: "Back", isCompound: false },
  { name: "Seated Cable Rows", muscle: "Back", isCompound: false },
  { name: "Single Arm Dumbbell Rows", muscle: "Back", isCompound: false },
  { name: "Face Pulls", muscle: "Rear Delts/Upper Back", isCompound: false },
  { name: "Rack Pulls", muscle: "Back", isCompound: true },
  { name: "Hyperextensions", muscle: "Lower Back", isCompound: false },
  { name: "Chest-Supported Rows", muscle: "Back", isCompound: false },
  { name: "Overhead Press", muscle: "Shoulders", isCompound: true },
  { name: "Arnold Press", muscle: "Shoulders", isCompound: true },
  { name: "Lateral Raises", muscle: "Side Delts", isCompound: false },
  { name: "Front Raises", muscle: "Front Delts", isCompound: false },
  { name: "Rear Delt Flyes", muscle: "Rear Delts", isCompound: false },
  { name: "Upright Rows", muscle: "Shoulders/Traps", isCompound: false },
  { name: "Shrugs", muscle: "Traps", isCompound: false },
  { name: "Cable Lateral Raises", muscle: "Side Delts", isCompound: false },
  { name: "Barbell Curls", muscle: "Biceps", isCompound: false },
  { name: "Dumbbell Curls", muscle: "Biceps", isCompound: false },
  { name: "Hammer Curls", muscle: "Biceps/Brachialis", isCompound: false },
  { name: "Preacher Curls", muscle: "Biceps", isCompound: false },
  { name: "Incline Dumbbell Curls", muscle: "Biceps", isCompound: false },
  { name: "Cable Curls", muscle: "Biceps", isCompound: false },
  { name: "Concentration Curls", muscle: "Biceps", isCompound: false },
  { name: "Skull Crushers", muscle: "Triceps", isCompound: false },
  { name: "Close-Grip Bench Press", muscle: "Triceps", isCompound: true },
  { name: "Tricep Pushdowns", muscle: "Triceps", isCompound: false },
  { name: "Overhead Tricep Extension", muscle: "Triceps", isCompound: false },
  { name: "Diamond Push-ups", muscle: "Triceps", isCompound: false },
  { name: "Squat", muscle: "Legs/Full Body", isCompound: true },
  { name: "Hack Squat", muscle: "Quads", isCompound: true },
  { name: "Leg Press", muscle: "Quads/Glutes", isCompound: true },
  { name: "Romanian Deadlift", muscle: "Hamstrings/Glutes", isCompound: true },
  { name: "Lunges", muscle: "Legs", isCompound: true },
  { name: "Walking Lunges", muscle: "Legs", isCompound: true },
  { name: "Leg Extension", muscle: "Quads", isCompound: false },
  { name: "Leg Curl", muscle: "Hamstrings", isCompound: false },
  { name: "Calf Raises", muscle: "Calves", isCompound: false },
  { name: "Hip Thrust", muscle: "Glutes", isCompound: true },
  { name: "Step-ups", muscle: "Legs", isCompound: true },
  { name: "Bulgarian Split Squat", muscle: "Legs", isCompound: true },
  { name: "Goblet Squat", muscle: "Legs", isCompound: true },
  { name: "Plank", muscle: "Core", isCompound: false },
  { name: "Crunches", muscle: "Core", isCompound: false },
  { name: "Russian Twist", muscle: "Core/Obliques", isCompound: false },
  { name: "Hanging Leg Raises", muscle: "Core", isCompound: false },
  { name: "Cable Crunches", muscle: "Core", isCompound: false },
  { name: "Ab Wheel Rollout", muscle: "Core", isCompound: false },
  { name: "Dead Bug", muscle: "Core", isCompound: false },
  { name: "Side Plank", muscle: "Core/Obliques", isCompound: false },
  { name: "Burpees", muscle: "Full Body", isCompound: true, bennyHates: true },
  { name: "Box Jumps", muscle: "Full Body/Plyometric", isCompound: true },
  { name: "Kettlebell Swings", muscle: "Full Body/Posterior Chain", isCompound: true },
  { name: "Battle Ropes", muscle: "Full Body/Cardio", isCompound: false },
  { name: "Sled Push", muscle: "Full Body/Legs", isCompound: true },
  { name: "Farmer's Walk", muscle: "Full Body/Grip", isCompound: true },
  { name: "Clean and Press", muscle: "Full Body", isCompound: true },
];

export const MUSCLES = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Core",
  "Full Body",
];

export function filterExercises(query: string, muscle: string): ExerciseInfo[] {
  return EXERCISE_LIBRARY.filter((e) => {
    const matchMuscle =
      muscle === "All" ||
      e.muscle.toLowerCase().includes(muscle.toLowerCase()) ||
      (muscle === "Legs" && (e.muscle.includes("Quad") || e.muscle.includes("Glute") || e.muscle.includes("Hamstring") || e.muscle.includes("Leg") || e.muscle.includes("Calf")));
    const matchQuery =
      !query ||
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.muscle.toLowerCase().includes(query.toLowerCase());
    return matchMuscle && matchQuery;
  });
}

export const BENNY_EXERCISE_REACTIONS: Record<string, string> = {
  Deadlift: "*Benny starts vibrating with excitement* FINALLY. My favorite child exercise. You better not embarrass me.",
  Squat: "The king of all movements. Don't skip depth. I'm watching your knees.",
  "Bench Press": "Classic. Respectable. Don't forget to actually press instead of just lowering the bar onto your chest and praying.",
  "Pull-ups": "Bodyweight excellence. Unless you're doing two ugly half-reps and calling it a set. Are you?",
  Burpees: "*lies face down on the floor* I cannot believe you did this. We had something good here. You ruined it.",
  "Cable Crunches": "Oh NOW you care about abs. Interesting timing. Welcome to the party.",
  "Hip Thrust": "Your glutes deserve this. Benny approves. Don't make it weird.",
  "Bulgarian Split Squat": "You chose violence. I respect that.",
  "Romanian Deadlift": "A sophisticated hamstring choice. You're growing as a person.",
  Lunges: "Fine. Acceptable. Not thrilling, but acceptable.",
  "Walking Lunges": "The floor is your enemy and your teacher. Good luck.",
  "Skull Crushers": "The name alone is enough for Benny to nod in approval.",
  "Lateral Raises": "Shoulder width is the goal. Cap those delts. Become a triangle.",
  "Face Pulls": "You actually care about shoulder health. This is character development.",
  Shrugs: "Traps don't grow themselves. Unless they're Gerald's — his are enormous from all that laziness.",
};
