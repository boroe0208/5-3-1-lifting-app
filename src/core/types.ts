export interface Settings {
    trainingMaxPercentage: number;
    rounding: number;
    unit: 'lb' | 'kg';
    theme: string;
}

export interface OneRepMaxes {
    squat: number;
    bench: number;
    deadlift: number;
    ohp: number;
}

export interface LiftProgress {
    cycle: number;
    week: number;
}

export interface WorkoutSet {
    weight: number;
    reps: number;
    completed: boolean;
    isAmrap?: boolean; // As Many Reps As Possible
    actualReps?: number; // Actual reps performed (for AMRAP)
    percentage?: number; // Target percentage of TM
}

export interface AssistanceExercise {
    name: string;
    sets: number;
    reps: number;
    weight?: number;
    completed?: boolean;
}

export type AssistanceTemplate = 'None' | 'BoringButBig' | 'Custom';

export interface WorkoutHistoryEntry {
    id: string;
    date: string;
    workoutId: string;
    workoutName: string;
    lift: string;
    cycle: number;
    week: number;
    sets: WorkoutSet[];
    assistanceWork?: AssistanceExercise[];
    estimatedOneRepMaxes?: Partial<OneRepMaxes>;
    duration?: number; // Duration in seconds
}

export interface UserProfile {
    oneRepMaxes: OneRepMaxes;
    currentCycle: number; // Deprecated, kept for migration
    currentWeek: number; // Deprecated, kept for migration
    liftProgress: Record<string, LiftProgress>; // Key: 'squat', 'bench', etc.
    completedWorkouts: string[]; // List of workout IDs (e.g., "week1_squat") completed in the current cycle
    settings: Settings;
    history: WorkoutHistoryEntry[];
    assistanceTemplate?: AssistanceTemplate;
    customAssistance?: Record<string, AssistanceExercise[]>; // Key: 'squat', 'bench', etc.
}

export interface Workout {
    id: string;
    name: string; // e.g., "Squat 5/3/1"
    lift: string;
    cycle: number;
    week: number;
    sets: WorkoutSet[];
    completed: boolean;
    date?: string;
}
