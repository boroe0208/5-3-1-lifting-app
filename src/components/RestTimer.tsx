import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../core/theme';

interface RestTimerProps {
    timer: number;
    totalTime: number;
    isTimerRunning: boolean;
    onToggleTimer: () => void;
}

export const RestTimer = ({ timer, totalTime, isTimerRunning, onToggleTimer }: RestTimerProps) => {
    const { theme } = useTheme();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[styles.timerContainer, { backgroundColor: theme.colors.card }, theme.shadow]}>
            <View>
                <Text style={[styles.timerText, { color: theme.colors.text }]}>Rest: {formatTime(timer)}</Text>
                <Text style={{ color: theme.colors.subtext, fontSize: 14, marginTop: 4 }}>Total: {formatTime(totalTime)}</Text>
            </View>
            <TouchableOpacity
                style={[styles.timerButton, { backgroundColor: isTimerRunning ? theme.colors.danger : theme.colors.primary }]}
                onPress={onToggleTimer}
            >
                <Text style={styles.timerButtonText}>{isTimerRunning ? 'Stop' : 'Start Rest'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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
});
