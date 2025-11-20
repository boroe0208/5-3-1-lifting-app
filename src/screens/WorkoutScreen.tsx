import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../core/theme';
import { Storage } from '../core/Storage';
import { Calculator } from '../core/Calculator';
import { Workout, WorkoutSet, WorkoutHistoryEntry, AssistanceExercise, UserProfile } from '../core/types';
import { useFocusEffect } from '@react-navigation/native';

export const WorkoutScreen = ({ route, navigation }: any) => {
    const { theme } = useTheme();
    const { workout, lift, cycle, week } = route.params;

    // State
    const [sets, setSets] = useState<WorkoutSet[]>([]);
    const [amrapReps, setAmrapReps] = useState('');
    const [repsToBeat, setRepsToBeat] = useState<number | null>(null);
    const [assistanceWork, setAssistanceWork] = useState<AssistanceExercise[]>([]);

    // Timer State
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Total Workout Timer
    const [totalTime, setTotalTime] = useState(0);
    const totalTimeRef = useRef<NodeJS.Timeout | null>(null);

    const currentWorkout = workout as Workout;

    useFocusEffect(
        React.useCallback(() => {
            navigation.setOptions({
                title: currentWorkout.name,
                headerStyle: { backgroundColor: theme.colors.card },
                headerTintColor: theme.colors.text,
            });
        }, [theme, currentWorkout.name])
    );

    useEffect(() => {
        initializeWorkout();
        // Start total timer
        totalTimeRef.current = setInterval(() => {
            setTotalTime(t => t + 1);
        }, 1000);

        return () => {
            stopTimer();
            if (totalTimeRef.current) clearInterval(totalTimeRef.current);
        };
    }, []);

    const initializeWorkout = async () => {
        const profile = await Storage.getProfile();
        if (!profile) return;

        if (route.params.mode === 'edit' && route.params.historyId) {
            // Load existing history entry
            const entry = profile.history.find(h => h.id === route.params.historyId);
            if (entry) {
                setSets(entry.sets);
                const amrapSet = entry.sets.find(s => s.isAmrap);
                if (amrapSet) {
                    setAmrapReps(amrapSet.actualReps?.toString() || '');
                }
                if (entry.assistanceWork) {
                    setAssistanceWork(entry.assistanceWork);
                }
            }
        } else {
            // New Workout
            setSets(currentWorkout.sets);

            // Calculate Reps to Beat
            const liftKey = (currentWorkout.lift || lift).toLowerCase();
            const current1RM = profile.oneRepMaxes[liftKey as keyof typeof profile.oneRepMaxes] || 0;
            const amrapSet = currentWorkout.sets.find(s => s.isAmrap);
            if (amrapSet) {
                const target = Calculator.calculateRepsToBeat1RM(amrapSet.weight, current1RM);
                setRepsToBeat(target);
            }

            // Generate Assistance Work
            if (profile.assistanceTemplate === 'BoringButBig') {
                const bbbSets: AssistanceExercise[] = Array(5).fill(null).map((_, i) => ({
                    name: `${lift} (BBB)`,
                    sets: 1,
                    reps: 10,
                    weight: Math.round((current1RM * 0.9 * 0.5) / 5) * 5, // 50% of TM
                    completed: false
                }));
                setAssistanceWork(bbbSets);
            } else if (profile.assistanceTemplate === 'Custom' && profile.customAssistance) {
                const customExercises = profile.customAssistance[liftKey] || [];
                setAssistanceWork(customExercises.map(ex => ({ ...ex, completed: false })));
            }
        }
    };

    const toggleSetComplete = (index: number) => {
        const newSets = [...sets];
        const wasCompleted = newSets[index].completed;
        newSets[index].completed = !wasCompleted;
        setSets(newSets);

        // Auto-start rest timer if completing a set
        if (!wasCompleted) {
            setTimer(0);
            if (!isTimerRunning) {
                startTimer();
            }
        }
    };

    const toggleAssistanceComplete = (index: number) => {
        const newAssistance = [...assistanceWork];
        newAssistance[index].completed = !newAssistance[index].completed;
        setAssistanceWork(newAssistance);
    };

    const startTimer = () => {
        if (isTimerRunning) return;
        setIsTimerRunning(true);
        timerRef.current = setInterval(() => {
            setTimer(t => t + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsTimerRunning(false);
        setTimer(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const finishWorkout = async () => {
        // Validate AMRAP
        const amrapSetIndex = sets.findIndex(s => s.isAmrap);
        if (amrapSetIndex !== -1 && sets[amrapSetIndex].completed && !amrapReps) {
            Alert.alert('Missing Info', 'Please enter reps for the AMRAP set.');
            return;
        }

        // Update sets with actual reps
        const updatedSets = sets.map(s => {
            if (s.isAmrap) {
                return { ...s, actualReps: parseInt(amrapReps) || s.reps };
            }
            return { ...s, actualReps: s.reps };
        });

        // Calculate Estimated 1RM
        let estimated1RM = undefined;
        if (amrapSetIndex !== -1 && amrapReps) {
            const weight = sets[amrapSetIndex].weight;
            const reps = parseInt(amrapReps);
            estimated1RM = Calculator.calculateEstimated1RM(weight, reps);
        }

        const profile = await Storage.getProfile();
        if (!profile) {
            Alert.alert('Error', 'Could not load profile.');
            return;
        }

        const liftKey = (currentWorkout.lift || lift).toLowerCase();
        const isEditMode = route.params.mode === 'edit';
        const historyId = route.params.historyId;

        let newHistory = [...(profile.history || [])];
        let newCompletedWorkouts = [...profile.completedWorkouts];
        let newLiftProgress = { ...profile.liftProgress };
        let newOneRepMaxes = { ...profile.oneRepMaxes };

        if (isEditMode && historyId) {
            // Update existing entry
            newHistory = newHistory.map(entry => {
                if (entry.id === historyId) {
                    return {
                        ...entry,
                        sets: updatedSets,
                        assistanceWork: assistanceWork,
                        estimatedOneRepMaxes: estimated1RM ? {
                            ...entry.estimatedOneRepMaxes,
                            [liftKey]: estimated1RM
                        } : entry.estimatedOneRepMaxes,
                        duration: totalTime
                    };
                }
                return entry;
            });
        } else {
            // Create new entry
            const newEntry: WorkoutHistoryEntry = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                workoutId: currentWorkout.id,
                workoutName: currentWorkout.name,
                lift: liftKey,
                cycle: cycle,
                week: week,
                sets: updatedSets,
                assistanceWork: assistanceWork,
                estimatedOneRepMaxes: estimated1RM ? { [liftKey]: estimated1RM } : undefined,
                duration: totalTime
            };
            newHistory.unshift(newEntry);
            newCompletedWorkouts.push(currentWorkout.id);
        }

        // Update Maxes if new record (only for new workouts or if logic permits)
        // For simplicity, we'll just track progress. 
        // Real 1RM updates usually happen at end of cycle, but we can track e1RM.
        if (estimated1RM) {
            const currentProgress = newLiftProgress[liftKey] || { estimated1RM: [] };
            // Add to progress if it's a new entry or update if editing? 
            // For now, let's just append to history which drives the chart.
        }

        await Storage.saveProfile({
            ...profile,
            history: newHistory,
            completedWorkouts: newCompletedWorkouts,
            liftProgress: newLiftProgress,
            oneRepMaxes: newOneRepMaxes
        });

        navigation.goBack();
    };

    const [isMainLiftExpanded, setIsMainLiftExpanded] = useState(true);
    const [isAssistanceExpanded, setIsAssistanceExpanded] = useState(true);

    // ... (existing code)

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{currentWorkout.name}</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
                        Cycle {cycle} - Week {week}
                    </Text>
                </View>

                {/* Timer */}
                <View style={[styles.timerContainer, { backgroundColor: theme.colors.card }, theme.shadow]}>
                    <View>
                        <Text style={[styles.timerText, { color: theme.colors.text }]}>Rest: {formatTime(timer)}</Text>
                        <Text style={{ color: theme.colors.subtext, fontSize: 14, marginTop: 4 }}>Total: {formatTime(totalTime)}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.timerButton, { backgroundColor: isTimerRunning ? theme.colors.danger : theme.colors.primary }]}
                        onPress={isTimerRunning ? stopTimer : startTimer}
                    >
                        <Text style={styles.timerButtonText}>{isTimerRunning ? 'Stop' : 'Start Rest'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Lifts */}
                <View style={[styles.section, { backgroundColor: theme.colors.card }, theme.shadow]}>
                    <TouchableOpacity onPress={() => setIsMainLiftExpanded(!isMainLiftExpanded)} style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Main Lift</Text>
                        <Text style={{ color: theme.colors.text, fontSize: 18 }}>{isMainLiftExpanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {isMainLiftExpanded && sets.map((set, index) => (
                        <View key={index} style={[styles.setRow, { borderBottomColor: theme.colors.border }]}>
                            <TouchableOpacity
                                style={[styles.setInfo, set.completed && { opacity: 0.5 }]}
                                onPress={() => toggleSetComplete(index)}
                            >
                                <View style={styles.setMainInfo}>
                                    <Text style={[styles.setText, { color: theme.colors.text }]}>
                                        {set.reps} reps @ {set.weight} {set.isAmrap ? '+' : ''}
                                    </Text>
                                    {set.isAmrap && repsToBeat !== null && (
                                        <Text style={[styles.repsToBeat, { color: theme.colors.success }]}>
                                            Beat {repsToBeat} reps for PR
                                        </Text>
                                    )}
                                </View>
                                <Text style={[styles.setSubtext, { color: theme.colors.subtext }]}>
                                    {Math.round((set.percentage || 0) * 100)}% TM
                                </Text>
                            </TouchableOpacity>

                            {set.isAmrap ? (
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                    keyboardType="numeric"
                                    placeholder="Reps"
                                    placeholderTextColor={theme.colors.subtext}
                                    value={amrapReps}
                                    onChangeText={setAmrapReps}
                                />
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        styles.checkCircle,
                                        { borderColor: theme.colors.primary },
                                        set.completed && { backgroundColor: theme.colors.primary }
                                    ]}
                                    onPress={() => toggleSetComplete(index)}
                                >
                                    {set.completed && <Text style={styles.checkMark}>✓</Text>}
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>

                {/* Assistance Work */}
                {assistanceWork.length > 0 && (
                    <View style={[styles.section, { backgroundColor: theme.colors.card }, theme.shadow]}>
                        <TouchableOpacity onPress={() => setIsAssistanceExpanded(!isAssistanceExpanded)} style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Assistance Work</Text>
                            <Text style={{ color: theme.colors.text, fontSize: 18 }}>{isAssistanceExpanded ? '▲' : '▼'}</Text>
                        </TouchableOpacity>

                        {isAssistanceExpanded && assistanceWork.map((exercise, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.setRow, { borderBottomColor: theme.colors.border }]}
                                onPress={() => toggleAssistanceComplete(index)}
                            >
                                <View style={styles.setInfo}>
                                    <Text style={[styles.setText, { color: theme.colors.text, fontSize: 18 }]}>
                                        {exercise.name}
                                    </Text>
                                    <Text style={[styles.setSubtext, { color: theme.colors.subtext }]}>
                                        {exercise.sets} x {exercise.reps} {exercise.weight ? `@ ${exercise.weight}` : ''}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.checkCircle,
                                    { borderColor: theme.colors.primary },
                                    exercise.completed && { backgroundColor: theme.colors.primary }
                                ]}>
                                    {exercise.completed && <Text style={styles.checkMark}>✓</Text>}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.finishButton, { backgroundColor: theme.colors.success }]}
                    onPress={finishWorkout}
                >
                    <Text style={styles.finishButtonText}>Finish Workout</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 18,
        marginTop: 4,
        fontWeight: '500',
    },
    timerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    timerText: {
        fontSize: 24,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    timerButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    timerButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    section: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    setInfo: {
        flex: 1,
    },
    setMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    setText: {
        fontSize: 20,
        fontWeight: '600',
    },
    setSubtext: {
        fontSize: 14,
        marginTop: 4,
    },
    repsToBeat: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        width: 80,
        height: 44,
        borderWidth: 1,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
    checkCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMark: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    finishButton: {
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    finishButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
});
