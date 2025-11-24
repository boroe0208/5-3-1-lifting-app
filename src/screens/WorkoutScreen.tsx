import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../core/theme';
import { useFocusEffect } from '@react-navigation/native';
import { RestTimer } from '../components/RestTimer';
import { WorkoutSetRow } from '../components/WorkoutSetRow';
import { useWorkoutLogic } from '../hooks/useWorkoutLogic';
import { ExerciseLibraryModal } from '../components/ExerciseLibraryModal';
import { AssistanceExerciseCard } from '../components/AssistanceExerciseCard';

export const WorkoutScreen = ({ route, navigation }: any) => {
    const { theme } = useTheme();
    const {
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
        updateAssistanceSets,
        getPreviousHistory,
        updateSetReps,
        changeSetReps,
        updateAssistanceSetReps,
        changeAssistanceSetReps,
        finishWorkout
    } = useWorkoutLogic({ route, navigation });

    const [isLibraryVisible, setIsLibraryVisible] = React.useState(false);

    useFocusEffect(
        React.useCallback(() => {
            if (workout) {
                navigation.setOptions({
                    title: workout.name,
                    headerStyle: { backgroundColor: theme.colors.card },
                    headerTintColor: theme.colors.text,
                });
            }
        }, [theme, workout])
    );

    if (!workout) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, marginTop: 16 }}>Loading Workout...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{workout.name}</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
                        Cycle {workout.cycle} - Week {workout.week}
                    </Text>
                </View>

                {/* Timer */}
                <RestTimer
                    timer={timer}
                    totalTime={totalTime}
                    isTimerRunning={isTimerRunning}
                    onToggleTimer={isTimerRunning ? stopTimer : startTimer}
                />

                {/* Main Lifts */}
                <View style={[styles.section, { backgroundColor: theme.colors.card }, theme.shadow]}>
                    <TouchableOpacity onPress={() => setIsMainLiftExpanded(!isMainLiftExpanded)} style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Main Lift</Text>
                        <Text style={{ color: theme.colors.text, fontSize: 18 }}>{isMainLiftExpanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {isMainLiftExpanded && sets.map((set, index) => (
                        <WorkoutSetRow
                            key={index}
                            set={set}
                            index={index}
                            onToggleComplete={toggleSetComplete}
                            onUpdateReps={updateSetReps}
                            onChangeReps={changeSetReps}
                            repsToBeat={repsToBeat}
                        />
                    ))}
                </View>

                {/* Assistance Work */}
                <View style={[styles.section, { backgroundColor: theme.colors.card }, theme.shadow]}>
                    <TouchableOpacity onPress={() => setIsAssistanceExpanded(!isAssistanceExpanded)} style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Assistance Work</Text>
                        <Text style={{ color: theme.colors.text, fontSize: 18 }}>{isAssistanceExpanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {isAssistanceExpanded && assistanceWork.map((exercise, index) => (
                        <AssistanceExerciseCard
                            key={index}
                            exercise={exercise}
                            onToggleSetComplete={(setIndex) => toggleAssistanceSetComplete(index, setIndex)}
                            onRemove={() => removeAssistanceExercise(index)}
                            onUpdateSets={(delta) => updateAssistanceSets(index, delta)}
                            onUpdateReps={(setIndex, delta) => updateAssistanceSetReps(index, setIndex, delta)}
                            onChangeReps={(setIndex, text) => changeAssistanceSetReps(index, setIndex, text)}
                            previousData={getPreviousHistory(exercise.name)}
                        />
                    ))}

                    {isAssistanceExpanded && (
                        <TouchableOpacity
                            style={[styles.addButton, { borderColor: theme.colors.primary }]}
                            onPress={() => setIsLibraryVisible(true)}
                        >
                            <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>+ Add Exercise</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Exercise Library Modal */}
                <ExerciseLibraryModal
                    visible={isLibraryVisible}
                    onClose={() => setIsLibraryVisible(false)}
                    onSelect={addAssistanceExercise}
                />

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
    setText: {
        fontSize: 20,
        fontWeight: '600',
    },
    setSubtext: {
        fontSize: 14,
        marginTop: 4,
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
    addButton: {
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
