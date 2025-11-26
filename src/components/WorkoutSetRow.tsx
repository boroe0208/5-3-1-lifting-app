import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../core/theme';
import { WorkoutSet } from '../core/types';
import { PlateDisplay } from './PlateDisplay';

interface WorkoutSetRowProps {
    set: WorkoutSet;
    index: number;
    onToggleComplete: (index: number) => void;
    onUpdateReps: (index: number, delta: number) => void;
    onChangeReps: (index: number, text: string) => void;
    repsToBeat: number | null;
    unit: 'lb' | 'kg';
}

export const WorkoutSetRow = ({
    set,
    index,
    onToggleComplete,
    onUpdateReps,
    onChangeReps,
    repsToBeat,
    unit
}: WorkoutSetRowProps) => {
    const { theme } = useTheme();
    const [showPlates, setShowPlates] = useState(false);

    const actualReps = set.actualReps ?? set.reps;

    return (
        <View style={[styles.setRow, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity
                style={[styles.setInfo, set.completed && { opacity: 0.5 }]}
                onPress={() => onToggleComplete(index)}
            >
                <View style={styles.setMainInfo}>
                    <Text style={[styles.setText, { color: theme.colors.text }]}>
                        {set.weight} {unit === 'lb' ? 'lbs' : unit} X {set.reps} {set.isAmrap ? '+' : ''}
                    </Text>
                    {set.isAmrap && repsToBeat !== null && (
                        <Text style={[styles.repsToBeat, { color: theme.colors.success }]}>
                            Beat {repsToBeat}
                        </Text>
                    )}
                </View>
                <Text style={[styles.setSubtext, { color: theme.colors.subtext }]}>
                    {Math.round((set.percentage || 0) * 100)}% TM
                </Text>
                <TouchableOpacity onPress={() => setShowPlates(!showPlates)}>
                    <Text style={[styles.plateToggle, { color: theme.colors.primary }]}>
                        {showPlates ? 'Hide Plates' : 'Show Plates'}
                    </Text>
                </TouchableOpacity>
                {showPlates && <PlateDisplay weight={set.weight} unit={unit} />}
            </TouchableOpacity>

            <View style={styles.controlsContainer}>
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
            </View>

            <TouchableOpacity
                style={[
                    styles.checkCircle,
                    { borderColor: theme.colors.primary },
                    set.completed && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => onToggleComplete(index)}
            >
                {set.completed && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 8,
    },
    setInfo: {
        flex: 1,
    },
    setMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    setText: {
        fontSize: 18,
        fontWeight: '600',
    },
    setSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
    repsToBeat: {
        fontSize: 12,
        fontWeight: '600',
    },
    plateToggle: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    repButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    repButtonText: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 22,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    input: {
        width: 40,
        height: 32,
        borderWidth: 1,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        padding: 0,
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
});
