import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../core/theme';
import { AssistanceExercise } from '../core/types';
import { useUser } from '../core/UserContext';
import { PlateDisplay } from './PlateDisplay';
import { EXERCISE_LIBRARY } from '../core/exerciseLibrary';

interface AssistanceExerciseCardProps {
    exercise: AssistanceExercise;
    onToggleSetComplete: (setIndex: number) => void;
    onRemove: () => void;
    onUpdateSets: (delta: number) => void;
    onUpdateReps: (setIndex: number, delta: number) => void;
    onChangeReps: (setIndex: number, text: string) => void;
    onChangeWeight: (text: string) => void;
    onChangeSetWeight: (setIndex: number, text: string) => void;
    previousData?: AssistanceExercise;
}

export const AssistanceExerciseCard = ({
    exercise,
    onToggleSetComplete,
    onRemove,
    onUpdateSets,
    onUpdateReps,
    onChangeReps,
    onChangeWeight,
    onChangeSetWeight,
    previousData
}: AssistanceExerciseCardProps) => {
    const { theme } = useTheme();
    const { profile } = useUser();
    const unit = profile?.settings.unit || 'lb';
    const unitLabel = unit === 'lb' ? 'lbs' : unit;
    const [showPlates, setShowPlates] = React.useState(false);

    // Determine if it's a barbell exercise
    const isBarbell = React.useMemo(() => {
        const libEntry = EXERCISE_LIBRARY.find(e => e.name === exercise.name);
        if (libEntry?.equipment === 'Barbell') return true;

        // Check for BBB or main lifts
        const lowerName = exercise.name.toLowerCase();
        if (lowerName.includes('(bbb)')) return true;
        if (['squat', 'bench', 'deadlift', 'ohp', 'press'].some(lift => lowerName.includes(lift))) return true;

        return false;
    }, [exercise.name]);

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.colors.text }]}>{exercise.name}</Text>
                    {previousData && (
                        <Text style={[styles.history, { color: theme.colors.subtext }]}>
                            Last: {previousData.sets} sets of {previousData.weight ? `${previousData.weight} ${unitLabel} X ` : ''}{previousData.reps}
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ color: theme.colors.danger, fontSize: 20, fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.controls}>
                <View style={styles.weightContainer}>
                    <Text style={[styles.label, { color: theme.colors.text, marginRight: 8 }]}>Target Weight:</Text>
                    <TextInput
                        style={[styles.weightInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                        keyboardType="numeric"
                        value={exercise.weight?.toString() || ''}
                        onChangeText={onChangeWeight}
                        placeholder="0"
                        placeholderTextColor={theme.colors.subtext}
                    />
                    <Text style={[styles.unitLabel, { color: theme.colors.subtext }]}>{unitLabel}</Text>
                </View>

                {isBarbell && exercise.weight && exercise.weight > 0 && (
                    <TouchableOpacity onPress={() => setShowPlates(!showPlates)}>
                        <Text style={[styles.plateToggle, { color: theme.colors.primary }]}>
                            {showPlates ? 'Hide Plates' : 'Show Plates'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {showPlates && exercise.weight && (
                <View style={{ marginBottom: 16 }}>
                    <PlateDisplay weight={exercise.weight} unit={unit} />
                </View>
            )}

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
                                    {/* Weight Input per Set */}
                                    <TextInput
                                        style={[styles.input, { width: 50, color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                        keyboardType="numeric"
                                        value={(exercise.actualWeights?.[index] ?? exercise.weight ?? 0).toString()}
                                        onChangeText={(text) => onChangeSetWeight(index, text)}
                                        selectTextOnFocus
                                        placeholder="lbs"
                                        placeholderTextColor={theme.colors.subtext}
                                    />
                                    <Text style={[styles.repsLabel, { color: theme.colors.subtext, marginRight: 8 }]}>{unitLabel}</Text>

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

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.addSetButton, { borderColor: theme.colors.primary }]}
                    onPress={() => onUpdateSets(1)}
                >
                    <Text style={[styles.addSetButtonText, { color: theme.colors.primary }]}>+ Add Set</Text>
                </TouchableOpacity>
                {exercise.sets > 1 && (
                    <TouchableOpacity
                        style={[styles.removeSetButton]}
                        onPress={() => onUpdateSets(-1)}
                    >
                        <Text style={[styles.removeSetButtonText, { color: theme.colors.danger }]}>Remove Set</Text>
                    </TouchableOpacity>
                )}
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
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        lineHeight: 20,
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
    weightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weightInput: {
        width: 60,
        height: 36,
        borderWidth: 1,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 16,
        padding: 0,
    },
    unitLabel: {
        marginLeft: 8,
        fontSize: 14,
    },
    plateToggle: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 16,
    },
    addSetButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    addSetButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    removeSetButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    removeSetButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
