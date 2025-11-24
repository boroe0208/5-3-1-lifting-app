import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../core/theme';
import { WorkoutHistoryEntry } from '../core/types';

interface CalendarViewProps {
    history: WorkoutHistoryEntry[];
    onSelectDate: (date: string | null) => void;
    selectedDate: string | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ history, onSelectDate, selectedDate }) => {
    const { theme } = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const workoutsByDate = useMemo(() => {
        const map: Record<string, boolean> = {};
        history.forEach(entry => {
            const dateStr = new Date(entry.date).toDateString();
            map[dateStr] = true;
        });
        return map;
    }, [history]);

    const renderCalendarDays = () => {
        const days = [];
        // Empty slots for days before the first of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dateStr = date.toDateString();
            const hasWorkout = workoutsByDate[dateStr];
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toDateString() === dateStr;

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: theme.colors.primary, borderRadius: 20 },
                        isToday && !isSelected && { borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 20 }
                    ]}
                    onPress={() => onSelectDate(dateStr)}
                >
                    <Text style={[
                        styles.dayText,
                        { color: theme.colors.text },
                        isSelected && { color: '#FFFFFF', fontWeight: 'bold' },
                        hasWorkout && !isSelected && { fontWeight: 'bold', color: theme.colors.primary }
                    ]}>
                        {i}
                    </Text>
                    {hasWorkout && (
                        <View style={[
                            styles.workoutIndicator,
                            { backgroundColor: theme.colors.primary },
                            isSelected && { backgroundColor: '#FFFFFF' }
                        ]} />
                    )}
                </TouchableOpacity>
            );
        }
        return days;
    };

    const changeMonth = (increment: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                    <Text style={[styles.navButtonText, { color: theme.colors.primary }]}>{"<"}</Text>
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                    <Text style={[styles.navButtonText, { color: theme.colors.primary }]}>{">"}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.weekDays}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Text key={day} style={[styles.weekDayText, { color: theme.colors.subtext }]}>{day}</Text>
                ))}
            </View>
            <View style={styles.daysGrid}>
                {renderCalendarDays()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginBottom: 16,
        marginHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    navButton: {
        padding: 8,
    },
    navButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    weekDays: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '600',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    dayText: {
        fontSize: 12,
    },
    workoutIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 1,
    },
});
