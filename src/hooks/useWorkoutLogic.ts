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
    const [amrapReps, setAmrapReps] = useState('');
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
                    setSets(historyEntry.sets);
                    setAssistanceWork(historyEntry.assistanceWork || []);
                    setTotalTime(historyEntry.duration || 0);

                    // Set AMRAP reps if exists
                    const amrapSet = historyEntry.sets.find(s => s.isAmrap);
                    if (amrapSet) {
                        setAmrapReps(amrapSet.reps.toString());
                    }
                }
            } else if (route.params?.workout) {
                // Load from passed workout param (from HomeScreen)
                const paramWorkout = route.params.workout;
                setWorkout(paramWorkout);
                setSets(paramWorkout.sets);

                // Calculate TM for assistance work
                const liftKey = (lift || paramWorkout.lift).toLowerCase();
                const oneRepMax = profile.oneRepMaxes[liftKey as keyof OneRepMaxes] || 0;
                const calculatedTm = Calculator.roundToNearest(oneRepMax * profile.settings.trainingMaxPercentage, profile.settings.rounding);

                // Generate Assistance Work
                if (profile.assistanceTemplate === 'BoringButBig') {
                    const bbbSets = Calculator.generateBBB(lift || paramWorkout.lift, calculatedTm, profile.settings.rounding);
                    setAssistanceWork(bbbSets);
                } else {
                    setAssistanceWork([]);
                }

                // Calculate Reps to Beat
                // liftKey is already defined above
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
                setSets(generatedWorkout.sets);

                // Generate Assistance Work
                if (profile.assistanceTemplate === 'BoringButBig') {
                    const bbbSets = Calculator.generateBBB(lift, tm, profile.settings.rounding);
                    setAssistanceWork(bbbSets);
                } else {
                    setAssistanceWork([]);
                }

                // Calculate Reps to Beat
                const liftKey = lift.toLowerCase();
                const max = profile.personalRecords?.[liftKey as keyof OneRepMaxes] || profile.oneRepMaxes[liftKey as keyof OneRepMaxes] || 0;
                const targetSet = generatedWorkout.sets.find(s => s.isAmrap);
                if (targetSet && max > 0) {
                    const targetWeight = targetSet.weight;
                    // Formula: Weight * (1 + Reps/30) > Max
                    // Weight + Weight*Reps/30 > Max
                    // Weight*Reps/30 > Max - Weight
                    // Reps > (Max - Weight) * 30 / Weight
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

    const toggleAssistanceComplete = (index: number) => {
        const newAssistance = [...assistanceWork];
        newAssistance[index].completed = !newAssistance[index].completed;
        setAssistanceWork(newAssistance);
    };

    const finishWorkout = async () => {
        if (!workout || !profile) return;

        // Validate AMRAP
        const amrapSetIndex = sets.findIndex(s => s.isAmrap);
        if (amrapSetIndex !== -1) {
            const reps = parseInt(amrapReps);
            if (isNaN(reps)) {
                Alert.alert("Missing AMRAP", "Please enter reps for the AMRAP set.");
                return;
            }
            sets[amrapSetIndex].reps = reps;
            sets[amrapSetIndex].completed = true;
        }

        const isEditMode = mode === 'edit';
        const newHistoryEntry: WorkoutHistoryEntry = {
            id: isEditMode && historyId ? historyId : Date.now().toString(),
            date: isEditMode && historyId ? (profile.history.find(h => h.id === historyId)?.date || new Date().toISOString()) : new Date().toISOString(),
            workoutName: workout.name,
            lift: lift || workout.lift,
            cycle: cycle || workout.cycle,
            week: week || workout.week,
            sets: sets,
            assistanceWork: assistanceWork,
            completed: true,
            workoutId: workoutId || workout.id,
            duration: totalTime,
        };

        // Calculate Est 1RM
        if (amrapSetIndex !== -1) {
            const amrapSet = sets[amrapSetIndex];
            const est1RM = Calculator.calculate1RM(amrapSet.weight, amrapSet.reps);
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
        const newLiftProgress = { ...profile.liftProgress }; // Update if needed
        const newOneRepMaxes = { ...profile.oneRepMaxes };
        const newPersonalRecords = { ...(profile.personalRecords || profile.oneRepMaxes) };

        // Update Personal Records if new PR
        if (amrapSetIndex !== -1) {
            const amrapSet = sets[amrapSetIndex];
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
            // Ensure liftProgress object exists
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

                // Increase TM for this lift
                const isKg = profile.settings.unit === 'kg';
                const upperInc = isKg ? 2.5 : 5; // Bench/OHP
                const lowerInc = isKg ? 5 : 10;  // Squat/Deadlift

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
            currentWeek: profile.currentWeek
        });

        navigation.goBack();
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
        amrapReps,
        setAmrapReps,
        repsToBeat,
        startTimer,
        stopTimer,
        toggleSetComplete,
        toggleAssistanceComplete,
        finishWorkout
    };
};
