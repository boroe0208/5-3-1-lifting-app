import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Storage } from '../core/Storage';
import { UserProfile, WorkoutHistoryEntry } from '../core/types';
import { useTheme } from '../core/theme';

// Simple Line Component using rotated View
const Line = ({ x1, y1, x2, y2, color, thickness = 2 }: { x1: number, y1: number, x2: number, y2: number, color: string, thickness?: number }) => {
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    return (
        <View
            style={{
                position: 'absolute',
                backgroundColor: color,
                width: length,
                height: thickness,
                left: cx - length / 2,
                top: cy - thickness / 2,
                transform: [{ rotate: `${angle}deg` }],
            }}
        />
    );
};

const UnifiedProgressChart = ({ history, unit, theme }: { history: WorkoutHistoryEntry[], unit: string, theme: any }) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    if (!history || history.length === 0) {
        return (
            <View style={[styles.chartContainer, { backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.colors.subtext }}>No history data available</Text>
            </View>
        );
    }

    // 1. Process Data: Group by Cycle/Week and find max 1RM per lift
    const lifts = ['squat', 'bench', 'deadlift', 'ohp'];
    const colors = { squat: '#FF3B30', bench: '#007AFF', deadlift: '#34C759', ohp: '#FF9500' };

    // Map "Cycle X Week Y" to a sortable index and display label
    const dataPoints: Record<string, { label: string, values: Record<string, number>, date: string }> = {};

    history.forEach(entry => {
        let cycle = entry.cycle;
        let week = entry.week;

        // Fallback for old data
        if (!cycle || !week) {
            const match = entry.workoutName.match(/Cycle (\d+) Week (\d+)/);
            if (match) {
                cycle = parseInt(match[1]);
                week = parseInt(match[2]);
            }
        }

        if (cycle && week) {
            const key = `C${cycle}W${week}`;

            if (!dataPoints[key]) {
                dataPoints[key] = { label: `C${cycle}W${week}`, values: {}, date: entry.date };
            }

            if (entry.estimatedOneRepMaxes) {
                lifts.forEach(lift => {
                    const val = entry.estimatedOneRepMaxes![lift as keyof typeof entry.estimatedOneRepMaxes];
                    if (val) {
                        dataPoints[key].values[lift] = Math.max(dataPoints[key].values[lift] || 0, val);
                    }
                });
            }
        }
    });

    // Convert to array and sort
    const sortedData = Object.values(dataPoints).sort((a, b) => {
        const parse = (s: string) => {
            const c = parseInt(s.match(/C(\d+)/)?.[1] || '0');
            const w = parseInt(s.match(/W(\d+)/)?.[1] || '0');
            return c * 100 + w;
        };
        return parse(a.label) - parse(b.label);
    });

    if (sortedData.length === 0) return null;

    // 2. Determine Scales
    const allValues = sortedData.flatMap(d => Object.values(d.values));
    if (allValues.length === 0) return null;

    let minVal = Math.min(...allValues) * 0.9;
    let maxVal = Math.max(...allValues) * 1.1;

    if (minVal === maxVal) {
        minVal = minVal * 0.9;
        maxVal = maxVal * 1.1 || 100;
    }

    const chartHeight = 250;
    const chartWidth = Dimensions.get('window').width - 60;
    const padding = 40;
    const graphHeight = chartHeight - padding * 2;
    const graphWidth = chartWidth - padding * 2;

    const getY = (val: number) => {
        return chartHeight - padding - ((val - minVal) / (maxVal - minVal)) * graphHeight;
    };

    const getX = (index: number) => {
        if (sortedData.length === 1) return padding + graphWidth / 2;
        return padding + (index / (sortedData.length - 1)) * graphWidth;
    };

    return (
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.card }, theme.shadow]}>
            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Estimated 1RM Progress</Text>

            <View style={{ height: chartHeight, width: chartWidth }} onStartShouldSetResponder={() => true} onResponderRelease={() => setSelectedIndex(null)}>
                {/* Y-Axis Lines & Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                    const val = minVal + (maxVal - minVal) * t;
                    const y = getY(val);
                    return (
                        <View key={t} style={{ position: 'absolute', left: padding, top: y, width: graphWidth, flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ position: 'absolute', left: -35, fontSize: 10, color: theme.colors.subtext, width: 30, textAlign: 'right' }}>{Math.round(val)}</Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border, opacity: 0.3 }} />
                        </View>
                    );
                })}

                {/* Lines */}
                {lifts.map(lift => {
                    const points: { x: number, y: number, val: number, index: number }[] = [];
                    sortedData.forEach((d, i) => {
                        const val = d.values[lift];
                        if (val) {
                            points.push({ x: getX(i), y: getY(val), val, index: i });
                        }
                    });

                    return (
                        <React.Fragment key={lift}>
                            {points.map((p, i) => {
                                if (i === 0) return null;
                                const prev = points[i - 1];
                                return <Line key={i} x1={prev.x} y1={prev.y} x2={p.x} y2={p.y} color={colors[lift as keyof typeof colors]} thickness={2} />;
                            })}
                            {points.map((p, i) => {
                                const isSelected = selectedIndex === p.index;
                                return (
                                    <TouchableOpacity
                                        key={`dot-${i}`}
                                        style={{
                                            position: 'absolute',
                                            left: p.x - (isSelected ? 8 : 4),
                                            top: p.y - (isSelected ? 8 : 4),
                                            width: isSelected ? 16 : 8,
                                            height: isSelected ? 16 : 8,
                                            borderRadius: isSelected ? 8 : 4,
                                            backgroundColor: colors[lift as keyof typeof colors],
                                            zIndex: isSelected ? 100 : 10,
                                            borderWidth: isSelected ? 2 : 0,
                                            borderColor: theme.colors.card
                                        }}
                                        onPress={() => setSelectedIndex(p.index)}
                                        activeOpacity={0.8}
                                    />
                                );
                            })}
                        </React.Fragment>
                    );
                })}

                {/* Tooltip */}
                {selectedIndex !== null && sortedData[selectedIndex] && (
                    <View style={{
                        position: 'absolute',
                        left: getX(selectedIndex) - 60,
                        top: 10,
                        width: 120,
                        backgroundColor: theme.colors.card,
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        zIndex: 200,
                        ...theme.shadow
                    }}>
                        <Text style={{ color: theme.colors.text, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>
                            {sortedData[selectedIndex].label}
                        </Text>
                        {lifts.map(lift => {
                            const val = sortedData[selectedIndex].values[lift];
                            if (!val) return null;
                            return (
                                <Text key={lift} style={{ color: colors[lift as keyof typeof colors], fontSize: 12, textAlign: 'center' }}>
                                    {lift.charAt(0).toUpperCase() + lift.slice(1)}: {val} {unit}
                                </Text>
                            );
                        })}
                    </View>
                )}

                {/* X-Axis Labels */}
                {sortedData.map((d, i) => (
                    <Text key={i} style={{
                        position: 'absolute',
                        left: getX(i) - 15,
                        top: chartHeight - padding + 5,
                        width: 30,
                        textAlign: 'center',
                        fontSize: 10,
                        color: theme.colors.subtext
                    }}>
                        {d.label}
                    </Text>
                ))}
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
                {lifts.map(lift => (
                    <View key={lift} style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: colors[lift as keyof typeof colors] }]} />
                        <Text style={[styles.legendText, { color: theme.colors.text }]}>{lift.charAt(0).toUpperCase() + lift.slice(1)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export const HistoryScreen = ({ navigation }: any) => {
    const { theme } = useTheme();
    const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
    const [unit, setUnit] = useState('lb');

    useFocusEffect(
        useCallback(() => {
            loadHistory();
            navigation.setOptions({
                headerStyle: { backgroundColor: theme.colors.card },
                headerTintColor: theme.colors.text,
            });
        }, [theme])
    );

    const loadHistory = async () => {
        const profile = await Storage.getProfile();
        if (profile) {
            // Sort history by date descending
            const sorted = [...(profile.history || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setHistory(sorted);
            setUnit(profile.settings.unit);
        }
    };

    const handleEdit = (entry: WorkoutHistoryEntry) => {
        let lift = entry.lift;
        let cycle = entry.cycle;
        let week = entry.week;

        // Fallback for old data
        if (!lift || !cycle || !week) {
            const match = entry.workoutName.match(/(.*) 5\/3\/1 - Cycle (\d+) Week (\d+)/);
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
            // Fallback or alert
            console.warn("Could not parse workout details for edit");
            // Try to navigate with just workoutId if possible, or show alert
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>

            <UnifiedProgressChart history={history} unit={unit} theme={theme} />

            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>Recent Workouts</Text>
            <Text style={[styles.editHint, { color: theme.colors.subtext }]}>Tap an entry to edit</Text>

            {history.map(entry => (
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
                            <Text style={[styles.historyDate, { color: theme.colors.subtext }]}>{new Date(entry.date).toLocaleDateString()}</Text>
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
            {history.length === 0 && (
                <Text style={[styles.noHistoryText, { color: theme.colors.subtext }]}>No workout history yet.</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    chartContainer: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 16,
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        fontWeight: '500',
    },
    sectionHeader: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
        marginTop: 12,
        letterSpacing: 0.5,
    },
    editHint: {
        fontSize: 14,
        marginBottom: 16,
        fontStyle: 'italic',
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
        marginTop: 40,
        fontSize: 18,
        fontWeight: '500',
    },
});
