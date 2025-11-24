import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Button, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Storage } from '../core/Storage';
import { UserProfile, Workout } from '../core/types';
import { Calculator } from '../core/Calculator';
import { useTheme } from '../core/theme';
import { useUser } from '../core/UserContext';

const LIFT_IMAGES: Record<string, any> = {
    squat: require('../../assets/lifts/squat.png'),
    bench: require('../../assets/lifts/bench.png'),
    deadlift: require('../../assets/lifts/deadlift.png'),
    ohp: require('../../assets/lifts/ohp.png'),
};

export const HomeScreen = ({ navigation }: any) => {
    const { theme } = useTheme();
    const { profile, isLoading, clearProfile } = useUser();
    const [workouts, setWorkouts] = useState<Workout[]>([]);

    useFocusEffect(
        useCallback(() => {
            if (profile) {
                const lifts = ['Squat', 'Bench', 'Deadlift', 'OHP'];
                const newWorkouts: Workout[] = [];

                lifts.forEach(lift => {
                    const liftKey = lift.toLowerCase();
                    const progress = profile.liftProgress?.[liftKey] || {
                        cycle: profile.currentCycle || 1,
                        week: profile.currentWeek || 1
                    };

                    const oneRepMax = profile.oneRepMaxes[liftKey as keyof typeof profile.oneRepMaxes] || 0;
                    const trainingMax = Calculator.roundToNearest(
                        oneRepMax * profile.settings.trainingMaxPercentage,
                        profile.settings.rounding
                    );

                    const workout = Calculator.generateWorkout(
                        lift,
                        trainingMax,
                        progress.week,
                        progress.cycle,
                        profile.settings.rounding
                    );
                    newWorkouts.push(workout);
                });

                setWorkouts(newWorkouts);
            }

            navigation.setOptions({
                headerStyle: { backgroundColor: theme.colors.card },
                headerTintColor: theme.colors.text,
                headerRight: () => (
                    <View style={{ flexDirection: 'row', marginRight: 10 }}>
                        <TouchableOpacity onPress={() => navigation.navigate('History')} style={{ marginRight: 20 }}>
                            <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                            <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                ),
            });
        }, [theme, profile])
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.colors.text }}>Loading...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.colors.text, marginBottom: 20, fontSize: 18 }}>Welcome to 5/3/1 Tracker</Text>
                <Button title="Setup Profile" onPress={() => navigation.navigate('Onboarding')} color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        >
            <View style={[styles.header, { alignItems: 'center' }]}>
                <Text style={[styles.title, { color: theme.colors.text, textAlign: 'center' }]}>Ed's 5/3/1</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                style={{ marginHorizontal: -20, paddingHorizontal: 20, flexGrow: 0 }}
            >
                {workouts.map((workout, index) => {
                    const isCompleted = profile.completedWorkouts.includes(workout.id);
                    const liftKey = workout.name.split(' ')[0].toLowerCase();
                    const liftProgress = profile.liftProgress?.[liftKey];
                    const liftSubtitle = liftProgress
                        ? `Cycle ${liftProgress.cycle} Week ${liftProgress.week}`
                        : `Cycle ${profile.currentCycle || 1} Week ${profile.currentWeek || 1}`;
                    const oneRepMax = profile.oneRepMaxes[liftKey as keyof typeof profile.oneRepMaxes] || 0;

                    return (
                        <TouchableOpacity
                            key={workout.id}
                            style={[
                                styles.card,
                                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                                theme.shadow,
                                index === workouts.length - 1 && { marginRight: 40 } // Extra margin for last item
                            ]}
                            onPress={() => navigation.navigate('Workout', { workout, lift: workout.name.split(' ')[0] })}
                        >
                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Image source={LIFT_IMAGES[liftKey]} style={styles.liftImage} resizeMode="contain" />
                                    <View>
                                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{workout.name}</Text>
                                        <Text style={[styles.cardSubtitle, { color: theme.colors.subtext }]}>{liftSubtitle}</Text>
                                        <Text style={[styles.oneRepMax, { color: theme.colors.primary }]}>
                                            Est. 1RM: {oneRepMax}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    horizontalList: {
        paddingRight: 20,
        paddingBottom: 20, // For shadow
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 0, // No bottom margin needed for horizontal
        marginRight: 16,
        borderWidth: 1,
        width: 330, // Fixed width for horizontal scroll
    },
    cardContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardHeader: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    liftImage: {
        width: 116,
        height: 116,
        marginBottom: 12,
        borderRadius: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
    completedText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    resetButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 60,
    },
    resetButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    oneRepMax: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    },
});
