import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../core/theme';
import { WorkoutSet } from '../core/types';

interface WorkoutSetRowProps {
    set: WorkoutSet;
    index: number;
    onToggleComplete: (index: number) => void;
    amrapReps: string;
    onAmrapChange: (text: string) => void;
    repsToBeat: number | null;
}

export const WorkoutSetRow = ({
    set,
    index,
    onToggleComplete,
    amrapReps,
    onAmrapChange,
    repsToBeat
}: WorkoutSetRowProps) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.setRow, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity
                style={[styles.setInfo, set.completed && { opacity: 0.5 }]}
                onPress={() => onToggleComplete(index)}
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
                    onChangeText={onAmrapChange}
                />
            ) : (
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
            )}
        </View>
    );
};

const styles = StyleSheet.create({
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
});
