import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WorkoutHistoryEntry } from '../core/types';
import { useTheme } from '../core/theme';
import { useUser } from '../core/UserContext';
import { ProgressChart } from '../components/ProgressChart';
import { CalendarView } from '../components/CalendarView';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { Ionicons } from '@expo/vector-icons';

export const HistoryScreen = ({ navigation }: any) => {
    const { theme } = useTheme();
    const { profile } = useUser();
    const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
    const [unit, setUnit] = useState('lb');
    const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toDateString());

    const handleExport = async () => {
        try {
            if (history.length === 0) {
                Alert.alert("No Data", "There is no workout history to export.");
                return;
            }

            const data = history.map(entry => {
                const row: any = {
                    Date: new Date(entry.date).toLocaleDateString(),
                    Time: new Date(entry.date).toLocaleTimeString(),
                    Workout: entry.workoutName,
                    Lift: entry.lift || '',
                    Cycle: entry.cycle || '',
                    Week: entry.week || '',
                    Duration_Minutes: entry.duration ? Math.floor(entry.duration / 60) : '',
                };

                // Add Est 1RM columns
                if (entry.estimatedOneRepMaxes) {
                    Object.entries(entry.estimatedOneRepMaxes).forEach(([lift, weight]) => {
                        row[`Est_1RM_${lift}`] = weight;
                    });
                }

                return row;
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "History");

            if (Platform.OS === 'web') {
                const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
                const blob = new Blob([wbout], { type: "application/octet-stream" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "workout_history.xlsx";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return;
            }

            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            // @ts-ignore
            const uri = FileSystem.cacheDirectory + 'workout_history.xlsx';

            await FileSystem.writeAsStringAsync(uri, wbout, {
                // @ts-ignore
                encoding: FileSystem.EncodingType.Base64
            });

            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Workout History',
                UTI: 'com.microsoft.excel.xlsx'
            });

        } catch (error) {
            console.error("Export failed:", error);
            Alert.alert("Export Failed", "An error occurred while exporting data.");
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (profile) {
                // Sort history by date descending
                const sorted = [...(profile.history || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setHistory(sorted);
                setUnit(profile.settings.unit);
            }
        }, [profile])
    );

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerStyle: { backgroundColor: theme.colors.card },
            headerTintColor: theme.colors.text,
            headerRight: () => (
                <TouchableOpacity onPress={handleExport} style={{ marginRight: 10 }}>
                    <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme, history]); // Re-run when history changes to update the closure

    const handleEdit = (entry: WorkoutHistoryEntry) => {
        let lift = entry.lift;
        let cycle = entry.cycle;
        let week = entry.week;

        // Fallback for old data
        if (!lift || !cycle || !week) {
            const match = entry.workoutName.match(/(.*)(?: 5\/3\/1)? - Cycle (\d+) Week (\d+)/);
            if (match) {
                lift = match[1];
                cycle = parseInt(match[2]);
                week = parseInt(match[3]);
            }
        }

        if (lift && cycle && week) {
            navigation.navigate('Workout', {
                lift,
                week,
                cycle,
                tm: 0,
                workoutId: entry.workoutId,
                mode: 'edit',
                historyId: entry.id
            });
        } else {
            console.warn("Could not parse workout details for edit");
        }
    };

    const filteredHistory = useMemo(() => {
        if (!selectedDate) return [];
        return history.filter(entry => new Date(entry.date).toDateString() === selectedDate);
    }, [history, selectedDate]);

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>

            <ProgressChart history={history} unit={unit} theme={theme} />

            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>Calendar</Text>
            <CalendarView
                history={history}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />

            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
                {selectedDate ? `Workouts on ${selectedDate}` : 'Select a date'}
            </Text>

            {selectedDate && filteredHistory.length === 0 && (
                <Text style={[styles.noHistoryText, { color: theme.colors.subtext }]}>No workouts on this day.</Text>
            )}

            {filteredHistory.map(entry => (
                <TouchableOpacity
                    key={entry.id}
                    style={[
                        styles.historyItem,
                        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                        theme.shadow
                    ]}
                    onPress={() => handleEdit(entry)}
                >
                    <View style={styles.historyHeader}>
                        <View>
                            <Text style={[styles.historyTitle, { color: theme.colors.text }]}>{entry.workoutName}</Text>
                            <Text style={[styles.historyDate, { color: theme.colors.subtext }]}>{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        {entry.duration && (
                            <Text style={[styles.historyDuration, { color: theme.colors.subtext }]}>
                                {Math.floor(entry.duration / 60)}m {entry.duration % 60}s
                            </Text>
                        )}
                    </View>
                    {entry.estimatedOneRepMaxes && Object.keys(entry.estimatedOneRepMaxes).length > 0 && (
                        <Text style={[styles.historyEst1RM, { color: theme.colors.primary }]}>
                            Est. 1RM: {Object.entries(entry.estimatedOneRepMaxes).map(([k, v]) => `${k} ${v}${unit}`).join(', ')}
                        </Text>
                    )}
                    {entry.assistanceWork && entry.assistanceWork.length > 0 && (
                        <View style={[styles.assistanceContainer, { borderTopColor: theme.colors.border }]}>
                            <Text style={[styles.assistanceHeader, { color: theme.colors.text }]}>Assistance Work:</Text>
                            {entry.assistanceWork.filter(ex => ex.completed).map((ex, i) => (
                                <Text key={i} style={[styles.assistanceText, { color: theme.colors.subtext }]}>
                                    • {ex.name}: {ex.sets}x{ex.reps} {ex.weight ? `@ ${ex.weight}${unit}` : ''}
                                </Text>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>
            ))}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    sectionHeader: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        marginTop: 12,
        letterSpacing: 0.5,
    },
    historyItem: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    historyDate: {
        fontSize: 14,
        fontWeight: '500',
    },
    historyDuration: {
        fontSize: 14,
        fontWeight: '600',
    },
    historyEst1RM: {
        fontSize: 16,
        fontWeight: '600',
    },
    assistanceContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    assistanceHeader: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    assistanceText: {
        fontSize: 13,
        marginBottom: 2,
    },
    noHistoryText: {
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
        fontSize: 16,
        fontWeight: '500',
        fontStyle: 'italic',
    },
});
