import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Storage } from '../core/Storage';
import { Workout, WorkoutSet } from '../core/types';
import { Calculator } from '../core/Calculator';
import { useTheme } from '../core/theme';

export const WorkoutScreen = ({ route, navigation }: any) => {
    const { theme } = useTheme();
    const { workout, lift } = route.params;
    const [currentWorkout, setCurrentWorkout] = useState<Workout>(workout);
    const [sets, setSets] = useState<WorkoutSet[]>(workout.sets);
    const [amrapReps, setAmrapReps] = useState('');
    const [repsToBeat, setRepsToBeat] = useState<number | null>(null);

    useEffect(() => {
        const initialize = async () => {
            // If editing, pre-fill sets from history if available
            if (route.params.mode === 'edit' && route.params.historyId) {
                const profile = await Storage.getProfile();
                const historyEntry = profile?.history?.find(h => h.id === route.params.historyId);
                if (historyEntry && historyEntry.sets) {
                    setSets(historyEntry.sets);
                    const amrapSet = historyEntry.sets.find(s => s.isAmrap);
                    if (amrapSet && amrapSet.actualReps) {
                        setAmrapReps(amrapSet.actualReps.toString());
                    }
                }
            }

            const amrapSet = sets.find(s => s.isAmrap);
            if (amrapSet) {
                if (!amrapReps) setAmrapReps(amrapSet.reps.toString());

                const profile = await Storage.getProfile();
                if (profile) {
                    const liftKey = (currentWorkout.lift || lift).toLowerCase();
                    const current1RM = profile.oneRepMaxes[liftKey as keyof typeof profile.oneRepMaxes] || 0;
                    const target = Calculator.calculateRepsToBeat1RM(amrapSet.weight, current1RM);
                    setRepsToBeat(target);
                }
            }
        };
        initialize();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            navigation.setOptions({
                title: currentWorkout.name,
                headerStyle: { backgroundColor: theme.colors.card },
                headerTintColor: theme.colors.text,
            });
        }, [theme, currentWorkout.name])
    );

    const toggleSetComplete = (index: number) => {
        const newSets = [...sets];
        newSets[index].completed = !newSets[index].completed;
        setSets(newSets);
    };

    const finishWorkout = async () => {
        try {
            // Validate AMRAP if applicable
            const amrapSetIndex = sets.findIndex((s: WorkoutSet) => s.isAmrap);
            if (amrapSetIndex !== -1 && sets[amrapSetIndex].completed && !amrapReps) {
                Alert.alert('Missing Info', 'Please enter reps for the AMRAP set.');
                return;
            }

            // Update sets with actual reps
            const updatedSets = sets.map((s: WorkoutSet, index: number) => {
                if (s.isAmrap) {
                    return { ...s, actualReps: parseInt(amrapReps) || s.reps };
                }
                return { ...s, actualReps: s.reps };
            });

            // Calculate estimated 1RM if AMRAP was done
            let estimated1RM = undefined;
            if (amrapSetIndex !== -1 && amrapReps) {
                const weight = sets[amrapSetIndex].weight;
                const reps = parseInt(amrapReps);
                estimated1RM = Calculator.calculateEstimated1RM(weight, reps);
            }

            // Save to history
            const profile = await Storage.getProfile();
            if (!profile) {
                Alert.alert('Error', 'Could not load profile. Please try again.');
                return;
            }

            const liftKey = (currentWorkout.lift || lift).toLowerCase();

            // CHECK FOR EDIT MODE
            const isEditMode = route.params.mode === 'edit';
            const historyId = route.params.historyId;

            let newHistory = [...(profile.history || [])];
            let newCompletedWorkouts = [...profile.completedWorkouts];
            let newLiftProgress = { ...profile.liftProgress };
            let newOneRepMaxes = { ...profile.oneRepMaxes };

            if (isEditMode && historyId) {
                // Update existing history entry
                newHistory = newHistory.map(entry => {
                    if (entry.id === historyId) {
                        return {
                            ...entry,
                            sets: updatedSets,
                            estimatedOneRepMaxes: estimated1RM ? { ...entry.estimatedOneRepMaxes, [liftKey]: estimated1RM } : entry.estimatedOneRepMaxes
                        };
                    }
                    return entry;
                });
                // Do NOT update progress or TMs when editing past workouts
            } else {
                // Create new history entry
                const historyEntry = {
                    id: Date.now().toString(),
                    date: new Date().toISOString(),
                    workoutId: currentWorkout.id,
                    workoutName: currentWorkout.name,
                    lift: liftKey,
                    cycle: currentWorkout.cycle || profile.currentCycle || 1,
                    week: currentWorkout.week,
                    sets: updatedSets,
                    estimatedOneRepMaxes: estimated1RM ? { [liftKey]: estimated1RM } : {},
                };

                newHistory.push(historyEntry);
                newCompletedWorkouts.push(currentWorkout.id);

                // Update Progress ONLY if not editing
                const currentProgress = profile.liftProgress?.[liftKey] || { cycle: 1, week: 1 };
                let nextCycle = currentProgress.cycle;
                let nextWeek = currentProgress.week;

                if (currentWorkout.week === 3) {
                    // Finish Cycle: Increase TM (via 1RM) and reset to Week 1 of next Cycle
                    nextWeek = 1;
                    nextCycle += 1;

                    const isLower = ['squat', 'deadlift'].includes(liftKey);
                    const increase = isLower
                        ? (profile.settings.unit === 'kg' ? 5 : 10)
                        : (profile.settings.unit === 'kg' ? 2.5 : 5);

                    if (newOneRepMaxes[liftKey as keyof typeof newOneRepMaxes]) {
                        newOneRepMaxes[liftKey as keyof typeof newOneRepMaxes] += increase;
                    }
                } else if (currentWorkout.week < 3) {
                    // Advance to next week
                    nextWeek += 1;
                }
                // Week 4 (Deload) logic:
                // If user does Week 4, we should probably also advance to Next Cycle Week 1
                // but NOT increase TM again (assuming TM increased after W3).
                // For simplicity, let's treat Week 4 completion as moving to Cycle + 1, Week 1
                // WITHOUT TM increase.
                else if (currentWorkout.week === 4) {
                    nextWeek = 1;
                    nextCycle += 1;
                }

                newLiftProgress = {
                    ...profile.liftProgress,
                    [liftKey]: { cycle: nextCycle, week: nextWeek }
                };
            }

            await Storage.saveProfile({
                ...profile,
                history: newHistory,
                completedWorkouts: newCompletedWorkouts,
                liftProgress: newLiftProgress,
                oneRepMaxes: newOneRepMaxes
            });

            navigation.goBack();
        } catch (error) {
            console.error('Error finishing workout:', error);
            Alert.alert('Error', 'An error occurred while saving the workout.');
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Week {currentWorkout.week}</Text>
                <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>{currentWorkout.name}</Text>
            </View>

            {sets.map((set: WorkoutSet, index: number) => (
                <View key={index} style={[styles.setRow, { borderBottomColor: theme.colors.border }]}>
                    <View style={styles.setInfo}>
                        <Text style={[styles.setText, { color: theme.colors.text }]}>Set {index + 1}</Text>
                        <Text style={[styles.setDetails, { color: theme.colors.subtext }]}>
                            {set.weight} x {set.isAmrap ? 'AMRAP (3+)' : set.reps}
                        </Text>
                        {set.isAmrap && (
                            <View>
                                <View style={styles.amrapContainer}>
                                    <Text style={[styles.amrapLabel, { color: theme.colors.text }]}>Reps:</Text>
                                    <TextInput
                                        style={[styles.amrapInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                                        keyboardType="numeric"
                                        value={amrapReps}
                                        onChangeText={setAmrapReps}
                                        placeholder="0"
                                        placeholderTextColor={theme.colors.subtext}
                                    />
                                </View>
                                {repsToBeat !== null && (
                                    <Text style={{ color: theme.colors.subtext, fontSize: 14, marginTop: 4, fontStyle: 'italic' }}>
                                        To beat PR: {repsToBeat} reps
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.checkButton,
                            set.completed ? { backgroundColor: theme.colors.success } : { borderColor: theme.colors.subtext, borderWidth: 1 }
                        ]}
                        onPress={() => toggleSetComplete(index)}
                    >
                        {set.completed && <Text style={styles.checkText}>✓</Text>}
                    </TouchableOpacity>
                </View>
            ))}

            <TouchableOpacity
                style={[
                    styles.finishButton,
                    { backgroundColor: theme.colors.primary },
                    theme.shadow
                ]}
                onPress={finishWorkout}
            >
                <Text style={styles.finishButtonText}>{route.params.mode === 'edit' ? 'Update Workout' : 'Finish Workout'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
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
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    setInfo: {
        flex: 1,
    },
    setText: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    setDetails: {
        fontSize: 18,
    },
    checkButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    finishButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 60,
    },
    finishButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    amrapContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    amrapLabel: {
        fontSize: 18,
        marginRight: 12,
        fontWeight: '600',
    },
    amrapInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        width: 80,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
});
