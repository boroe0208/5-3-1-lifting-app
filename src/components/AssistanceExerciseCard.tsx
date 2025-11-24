import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../core/theme';
import { AssistanceExercise } from '../core/types';

interface AssistanceExerciseCardProps {
    exercise: AssistanceExercise;
    onToggleSetComplete: (setIndex: number) => void;
    onRemove: () => void;
    onUpdateSets: (delta: number) => void;
    onUpdateReps: (setIndex: number, delta: number) => void;
    onChangeReps: (setIndex: number, text: string) => void;
    previousData?: AssistanceExercise;
}

export const AssistanceExerciseCard = ({
    exercise,
    onToggleSetComplete,
    onRemove,
    onUpdateSets,
    onUpdateReps,
    onChangeReps,
    previousData
}: AssistanceExerciseCardProps) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.name, { color: theme.colors.text }]}>{exercise.name}</Text>
                    {previousData && (
                        <Text style={[styles.history, { color: theme.colors.subtext }]}>
                            Last: {previousData.sets} x {previousData.reps} {previousData.weight ? `@ ${previousData.weight}` : ''}
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ color: theme.colors.danger, fontSize: 20, fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.controls}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Sets:</Text>
                <View style={styles.setsContainer}>
                    <TouchableOpacity onPress={() => onUpdateSets(-1)} style={styles.setButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={[styles.setButtonText, { color: theme.colors.primary }]}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.setCount, { color: theme.colors.text }]}>{exercise.sets}</Text>
                    <TouchableOpacity onPress={() => onUpdateSets(1)} style={styles.setButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={[styles.setButtonText, { color: theme.colors.primary }]}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.setList}>
                {exercise.completed.map((isCompleted, index) => {
                    const actualReps = exercise.actualReps?.[index] ?? exercise.reps;
                    return (
                        <View key={index} style={[styles.setRow, { borderBottomColor: theme.colors.border }]}>
                            <View style={styles.setInfo}>
                                <Text style={[styles.setLabel, { color: theme.colors.text }]}>
                                    Set {index + 1}
                                </Text>
                                <View style={styles.repsContainer}>
                                    <TouchableOpacity
                                        style={[styles.repButton, { borderColor: theme.colors.border }]}
                                        onPress={() => onUpdateReps(index, -1)}
                                    >
                                        <Text style={[styles.repButtonText, { color: theme.colors.text }]}>-</Text>
                                    </TouchableOpacity>

                                    <TextInput
                                        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                        keyboardType="numeric"
                                        value={actualReps.toString()}
                                        onChangeText={(text) => onChangeReps(index, text)}
                                        selectTextOnFocus
                                    />

                                    <TouchableOpacity
                                        style={[styles.repButton, { borderColor: theme.colors.border }]}
                                        onPress={() => onUpdateReps(index, 1)}
                                    >
                                        <Text style={[styles.repButtonText, { color: theme.colors.text }]}>+</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.repsLabel, { color: theme.colors.subtext }]}>reps</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.checkCircle,
                                    { borderColor: theme.colors.primary },
                                    isCompleted && { backgroundColor: theme.colors.primary }
                                ]}
                                onPress={() => onToggleSetComplete(index)}
                            >
                                {isCompleted && <Text style={styles.checkMark}>✓</Text>}
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
    },
    history: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    checkCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    checkMark: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    setsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    setButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    setButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    setCount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 8,
    },
    setList: {
        marginTop: 8,
    },
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    setInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    setLabel: {
        fontSize: 16,
        marginRight: 16,
        width: 50,
    },
    repsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    repButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    repButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    input: {
        width: 40,
        height: 30,
        borderWidth: 1,
        borderRadius: 4,
        textAlign: 'center',
        marginHorizontal: 4,
        padding: 0,
    },
    repsLabel: {
        marginLeft: 8,
        fontSize: 14,
    },
});
