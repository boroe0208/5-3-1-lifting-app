import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../core/theme';
import { useFocusEffect } from '@react-navigation/native';
import { RestTimer } from '../components/RestTimer';
import { WorkoutSetRow } from '../components/WorkoutSetRow';
import { useWorkoutLogic } from '../hooks/useWorkoutLogic';

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
        amrapReps,
        setAmrapReps,
        repsToBeat,
        startTimer,
        stopTimer,
        toggleSetComplete,
        toggleAssistanceComplete,
        finishWorkout
    } = useWorkoutLogic({ route, navigation });

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
                            amrapReps={amrapReps}
                            onAmrapChange={setAmrapReps}
                            repsToBeat={repsToBeat}
                        />
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
});
