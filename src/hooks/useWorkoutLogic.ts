import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useUser } from '../core/UserContext';
import { Calculator } from '../core/Calculator';
import { Workout, WorkoutSet, AssistanceExercise, WorkoutHistoryEntry, OneRepMaxes } from '../core/types';

interface UseWorkoutLogicProps {
    route: any;
    navigation: any;
}

export const useWorkoutLogic = ({ route, navigation }: UseWorkoutLogicProps) => {
    const { profile, saveProfile } = useUser();
    const { lift, week, cycle, tm, workoutId, mode, historyId } = route.params || {};

    const [workout, setWorkout] = useState<Workout | null>(null);
    const [sets, setSets] = useState<WorkoutSet[]>([]);
    const [assistanceWork, setAssistanceWork] = useState<AssistanceExercise[]>([]);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [totalTime, setTotalTime] = useState(0);
    const [isMainLiftExpanded, setIsMainLiftExpanded] = useState(true);
    const [isAssistanceExpanded, setIsAssistanceExpanded] = useState(false);
    const [repsToBeat, setRepsToBeat] = useState<number | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const totalTimeRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Workout
    useEffect(() => {
        if (!profile) return;

        const initWorkout = async () => {
            if (mode === 'edit' && historyId) {
                // Load from history
                const historyEntry = profile.history.find(h => h.id === historyId);
                if (historyEntry) {
                    setWorkout({
                        id: historyEntry.workoutId,
                        name: historyEntry.workoutName,
                        lift: historyEntry.lift || lift, // Fallback
                        week: historyEntry.week || week, // Fallback
                        cycle: historyEntry.cycle || cycle, // Fallback
                        sets: historyEntry.sets,
                        assistanceWork: historyEntry.assistanceWork || [],
                        completed: true,
                    });
                    // Ensure actualReps is set for all sets, defaulting to target reps if missing
                    const initializedSets = historyEntry.sets.map(s => ({
                        ...s,
                        actualReps: s.actualReps ?? s.reps
                    }));
                    setSets(initializedSets);

                    // Initialize assistance actualReps
                    const initializedAssistance = (historyEntry.assistanceWork || []).map(ex => ({
                        ...ex,
                        actualReps: ex.actualReps || Array(ex.sets).fill(ex.reps)
                    }));
                    setAssistanceWork(initializedAssistance);

                    setTotalTime(historyEntry.duration || 0);
                }
            } else if (route.params?.workout) {
                // Load from passed workout param (from HomeScreen)
                const paramWorkout = route.params.workout;
                setWorkout(paramWorkout);
                // Initialize actualReps
                const initializedSets = paramWorkout.sets.map((s: WorkoutSet) => ({
                    ...s,
                    actualReps: s.reps
                }));
                setSets(initializedSets);

                // Calculate TM for assistance work
                const liftKey = (lift || paramWorkout.lift).toLowerCase();
                const oneRepMax = profile.oneRepMaxes[liftKey as keyof OneRepMaxes] || 0;
                const calculatedTm = Calculator.roundToNearest(oneRepMax * profile.settings.trainingMaxPercentage, profile.settings.rounding);

                // Generate Assistance Work
                if (profile.assistanceTemplate === 'BoringButBig' || !profile.assistanceTemplate) {
                    const bbbSets = Calculator.generateBBB(lift || paramWorkout.lift, calculatedTm, profile.settings.rounding);
                    // Initialize actualReps for BBB
                    const initializedBBB = bbbSets.map(ex => ({
                        ...ex,
                        actualReps: Array(ex.sets).fill(ex.reps)
                    }));
                    setAssistanceWork(initializedBBB);
                } else {
                    setAssistanceWork([]);
                }

                // Calculate Reps to Beat
                const max = profile.personalRecords?.[liftKey as keyof OneRepMaxes] || profile.oneRepMaxes[liftKey as keyof OneRepMaxes] || 0;
                const targetSet = paramWorkout.sets.find((s: WorkoutSet) => s.isAmrap);
                if (targetSet && max > 0) {
                    const targetWeight = targetSet.weight;
                    const beat = Math.ceil((max - targetWeight) * 30 / targetWeight);
                    setRepsToBeat(beat > 0 ? beat : null);
                }
            } else {
                // New Workout (generated on the fly)
                const generatedWorkout = Calculator.generateWorkout(lift, tm, week, cycle, profile.settings.rounding);
                setWorkout(generatedWorkout);
                // Initialize actualReps
                const initializedSets = generatedWorkout.sets.map(s => ({
                    ...s,
                    actualReps: s.reps
                }));
                setSets(initializedSets);

                // Generate Assistance Work
                const liftKey = lift.toLowerCase();
                if (profile.customAssistance && profile.customAssistance[liftKey] && profile.customAssistance[liftKey].length > 0) {
                    // Load saved custom assistance for this lift
                    const savedAssistance = profile.customAssistance[liftKey].map(ex => ({
                        ...ex,
                        completed: Array.isArray(ex.completed) ? ex.completed : Array(ex.sets).fill(false),
                        actualReps: ex.actualReps || Array(ex.sets).fill(ex.reps)
                    }));
                    setAssistanceWork(savedAssistance);
                } else if (profile.assistanceTemplate === 'BoringButBig' || !profile.assistanceTemplate) {
                    const bbbSets = Calculator.generateBBB(lift, tm, profile.settings.rounding);
                    // Initialize actualReps for BBB
                    const initializedBBB = bbbSets.map(ex => ({
                        ...ex,
                        actualReps: Array(ex.sets).fill(ex.reps)
                    }));
                    setAssistanceWork(initializedBBB);
                } else {
                    setAssistanceWork([]);
                }

                // Calculate Reps to Beat
                const max = profile.personalRecords?.[liftKey as keyof OneRepMaxes] || profile.oneRepMaxes[liftKey as keyof OneRepMaxes] || 0;
                const targetSet = generatedWorkout.sets.find(s => s.isAmrap);
                if (targetSet && max > 0) {
                    const targetWeight = targetSet.weight;
                    const beat = Math.ceil((max - targetWeight) * 30 / targetWeight);
                    setRepsToBeat(beat > 0 ? beat : null);
                }
            }
        };

        initWorkout();
    }, [profile, lift, week, cycle, tm, mode, historyId]);

    // Timer Logic
    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning]);

    useEffect(() => {
        totalTimeRef.current = setInterval(() => {
            setTotalTime(t => t + 1);
        }, 1000);
        return () => {
            if (totalTimeRef.current) clearInterval(totalTimeRef.current);
        };
    }, []);

    const startTimer = () => setIsTimerRunning(true);
    const stopTimer = () => setIsTimerRunning(false);
    const resetTimer = () => {
        setIsTimerRunning(false);
        setTimer(0);
    };

    const toggleSetComplete = (index: number) => {
        const newSets = [...sets];
        newSets[index].completed = !newSets[index].completed;
        setSets(newSets);

        if (newSets[index].completed) {
            resetTimer();
            startTimer();
        }
    };

    const updateSetReps = (index: number, delta: number) => {
        const newSets = [...sets];
        const currentReps = newSets[index].actualReps ?? newSets[index].reps;
        newSets[index].actualReps = Math.max(0, currentReps + delta);
        setSets(newSets);
    };

    const changeSetReps = (index: number, text: string) => {
        const newSets = [...sets];
        const reps = parseInt(text);
        if (!isNaN(reps)) {
            newSets[index].actualReps = reps;
        } else if (text === '') {
            newSets[index].actualReps = 0; // Or handle empty state if preferred
        }
        setSets(newSets);
    };

    const toggleAssistanceSetComplete = (exerciseIndex: number, setIndex: number) => {
        const newAssistance = [...assistanceWork];
        const exercise = newAssistance[exerciseIndex];
        const newCompleted = [...exercise.completed];
        newCompleted[setIndex] = !newCompleted[setIndex];
        exercise.completed = newCompleted;
        setAssistanceWork(newAssistance);
    };

    const addAssistanceExercise = (exerciseName: string) => {
        const newExercise: AssistanceExercise = {
            name: exerciseName,
            sets: 3,
            reps: 10,
            completed: Array(3).fill(false),
            actualReps: Array(3).fill(10)
        };
        setAssistanceWork([...assistanceWork, newExercise]);
    };

    const removeAssistanceExercise = (index: number) => {
        const newAssistance = [...assistanceWork];
        newAssistance.splice(index, 1);
        setAssistanceWork(newAssistance);
    };

    const updateAssistanceSets = (index: number, delta: number) => {
        const newAssistance = [...assistanceWork];
        const currentSets = newAssistance[index].sets;
        const newSets = Math.max(1, currentSets + delta);

        newAssistance[index].sets = newSets;

        // Resize completed array and actualReps array
        if (newSets > currentSets) {
            // Add new sets (default false and default reps)
            newAssistance[index].completed = [
                ...newAssistance[index].completed,
                ...Array(newSets - currentSets).fill(false)
            ];
            newAssistance[index].actualReps = [
                ...(newAssistance[index].actualReps || Array(currentSets).fill(newAssistance[index].reps)),
                ...Array(newSets - currentSets).fill(newAssistance[index].reps)
            ];
        } else if (newSets < currentSets) {
            // Remove sets
            newAssistance[index].completed = newAssistance[index].completed.slice(0, newSets);
            newAssistance[index].actualReps = (newAssistance[index].actualReps || Array(currentSets).fill(newAssistance[index].reps)).slice(0, newSets);
        }

        setAssistanceWork(newAssistance);
    };

    const updateAssistanceSetReps = (exerciseIndex: number, setIndex: number, delta: number) => {
        const newAssistance = [...assistanceWork];
        const exercise = newAssistance[exerciseIndex];
        const currentReps = exercise.actualReps?.[setIndex] ?? exercise.reps;

        if (!exercise.actualReps) {
            exercise.actualReps = Array(exercise.sets).fill(exercise.reps);
        }

        exercise.actualReps[setIndex] = Math.max(0, currentReps + delta);
        setAssistanceWork(newAssistance);
    };

    const changeAssistanceSetReps = (exerciseIndex: number, setIndex: number, text: string) => {
        const newAssistance = [...assistanceWork];
        const exercise = newAssistance[exerciseIndex];
        const reps = parseInt(text);

        if (!exercise.actualReps) {
            exercise.actualReps = Array(exercise.sets).fill(exercise.reps);
        }

        if (!isNaN(reps)) {
            exercise.actualReps[setIndex] = reps;
        } else if (text === '') {
            exercise.actualReps[setIndex] = 0;
        }
        setAssistanceWork(newAssistance);
    };

    const finishWorkout = async () => {
        if (!workout || !profile) return;

        // Finalize sets - ensure actualReps is used
        const finalizedSets = sets.map(s => ({
            ...s,
            reps: s.actualReps ?? s.reps, // Update the main reps field to what was actually done
            completed: true // Mark all as completed on finish? Or just trust the user's checks? 
            // Usually finishing a workout implies completion, but let's stick to the user's checks or just save state.
            // The original code marked AMRAP as completed if valid.
            // Let's mark all as completed for history purposes if that's the desired behavior, 
            // or just save the state as is. The original code had `completed: true` in the history entry.
        }));

        // Validate AMRAP if needed, but now we have defaults. 
        // If actualReps is 0 for AMRAP, maybe warn?
        const amrapSetIndex = finalizedSets.findIndex(s => s.isAmrap);
        if (amrapSetIndex !== -1) {
            if ((finalizedSets[amrapSetIndex].actualReps || 0) === 0) {
                // Optional: Alert if 0 reps?
            }
        }

        const isEditMode = mode === 'edit';
        const newHistoryEntry: WorkoutHistoryEntry = {
            id: isEditMode && historyId ? historyId : Date.now().toString(),
            date: isEditMode && historyId ? (profile.history.find(h => h.id === historyId)?.date || new Date().toISOString()) : new Date().toISOString(),
            workoutName: workout.name,
            lift: lift || workout.lift,
            cycle: cycle || workout.cycle,
            week: week || workout.week,
            sets: finalizedSets,
            assistanceWork: assistanceWork,
            completed: true,
            workoutId: workoutId || workout.id,
            duration: totalTime,
        };

        // Calculate Est 1RM
        if (amrapSetIndex !== -1) {
            const amrapSet = finalizedSets[amrapSetIndex];
            const est1RM = Calculator.calculate1RM(amrapSet.weight, amrapSet.reps); // reps is now actualReps
            newHistoryEntry.estimatedOneRepMaxes = {
                ...newHistoryEntry.estimatedOneRepMaxes,
                [lift.toLowerCase()]: est1RM
            };
        }

        let newHistory = [...profile.history];
        if (isEditMode) {
            const index = newHistory.findIndex(h => h.id === historyId);
            if (index !== -1) {
                newHistory[index] = newHistoryEntry;
            }
        } else {
            newHistory.unshift(newHistoryEntry);
        }

        const newCompletedWorkouts = isEditMode ? profile.completedWorkouts : [...profile.completedWorkouts, workoutId || workout.id];
        const newLiftProgress = { ...profile.liftProgress };
        const newOneRepMaxes = { ...profile.oneRepMaxes };
        const newPersonalRecords = { ...(profile.personalRecords || profile.oneRepMaxes) };

        // Update Personal Records if new PR
        if (amrapSetIndex !== -1) {
            const amrapSet = finalizedSets[amrapSetIndex];
            const est1RM = Calculator.calculate1RM(amrapSet.weight, amrapSet.reps);
            const liftKey = (lift || workout.lift).toLowerCase();
            const currentPR = newPersonalRecords[liftKey as keyof OneRepMaxes] || 0;

            if (est1RM > currentPR) {
                newPersonalRecords[liftKey as keyof OneRepMaxes] = est1RM;
                Alert.alert("New Personal Record!", `You set a new estimated 1RM of ${est1RM} for ${lift || workout.lift}!`);
            }
        }

        // Progression Logic
        if (!isEditMode) {
            const liftKey = (lift || workout.lift).toLowerCase();
            if (!newLiftProgress[liftKey]) {
                newLiftProgress[liftKey] = {
                    cycle: profile.currentCycle || 1,
                    week: profile.currentWeek || 1
                };
            }

            const currentProgress = newLiftProgress[liftKey];
            let nextWeek = currentProgress.week + 1;
            let nextCycle = currentProgress.cycle;

            if (nextWeek > 4) {
                nextWeek = 1;
                nextCycle += 1;

                const isKg = profile.settings.unit === 'kg';
                const upperInc = isKg ? 2.5 : 5;
                const lowerInc = isKg ? 5 : 10;

                const increment = (liftKey === 'bench' || liftKey === 'ohp') ? upperInc : lowerInc;
                newOneRepMaxes[liftKey as keyof OneRepMaxes] = (newOneRepMaxes[liftKey as keyof OneRepMaxes] || 0) + increment;

                Alert.alert(`${lift || workout.lift} Cycle Complete!`, `TM increased for next cycle.`);
            } else if (nextWeek === 4) {
                Alert.alert("Week 3 Complete!", "Next week is a deload week.");
            } else {
                Alert.alert("Workout Complete!", "Great job!");
            }

            newLiftProgress[liftKey] = { cycle: nextCycle, week: nextWeek };
        }

        await saveProfile({
            ...profile,
            history: newHistory,
            completedWorkouts: newCompletedWorkouts,
            liftProgress: newLiftProgress,
            oneRepMaxes: newOneRepMaxes,
            personalRecords: newPersonalRecords,
            currentCycle: profile.currentCycle,
            currentWeek: profile.currentWeek,
            customAssistance: {
                ...profile.customAssistance,
                [(lift || workout.lift).toLowerCase()]: assistanceWork
            }
        });

        navigation.goBack();
    };


    const getPreviousHistory = (exerciseName: string) => {
        if (!profile || !profile.history) return undefined;
        const liftKey = (lift || workout?.lift || '').toLowerCase();
        const historyEntry = profile.history.find(h =>
            h.lift && h.lift.toLowerCase() === liftKey &&
            h.assistanceWork && h.assistanceWork.some(ex => ex.name === exerciseName)
        );

        if (historyEntry && historyEntry.assistanceWork) {
            return historyEntry.assistanceWork.find(ex => ex.name === exerciseName);
        }
        return undefined;
    };

    return {
        workout,
        sets,
        assistanceWork,
        timer,
        isTimerRunning,
        totalTime,
        isMainLiftExpanded,
        setIsMainLiftExpanded,
        isAssistanceExpanded,
        setIsAssistanceExpanded,
        repsToBeat,
        startTimer,
        stopTimer,
        toggleSetComplete,
        toggleAssistanceSetComplete,
        addAssistanceExercise,
        removeAssistanceExercise,
        getPreviousHistory,
        updateAssistanceSets,
        updateSetReps,
        changeSetReps,
        updateAssistanceSetReps,
        changeAssistanceSetReps,
        finishWorkout
    };
};
