import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useUser } from '../core/UserContext';
import { UserProfile } from '../core/types';

export const OnboardingScreen = ({ navigation }: any) => {
    const { saveProfile } = useUser();
    const [squat, setSquat] = useState('');
    const [bench, setBench] = useState('');
    const [deadlift, setDeadlift] = useState('');
    const [ohp, setOhp] = useState('');

    const handleSave = async () => {
        if (!squat || !bench || !deadlift || !ohp) {
            Alert.alert('Error', 'Please enter all 1RMs');
            return;
        }

        const profile: UserProfile = {
            oneRepMaxes: {
                squat: parseFloat(squat),
                bench: parseFloat(bench),
                deadlift: parseFloat(deadlift),
                ohp: parseFloat(ohp),
            },
            currentCycle: 1,
            currentWeek: 1,
            completedWorkouts: [],
            settings: {
                trainingMaxPercentage: 0.9,
                rounding: 5,
                unit: 'lb',
                theme: 'system'
            },
            history: [],
            liftProgress: {
                squat: { cycle: 1, week: 1 },
                bench: { cycle: 1, week: 1 },
                deadlift: { cycle: 1, week: 1 },
                ohp: { cycle: 1, week: 1 },
            }
        };

        await saveProfile(profile);
        // Reset the navigation stack to Home to ensure reload
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Enter your 1 Rep Maxes</Text>

                <View style={styles.inputContainer}>
                    <Text>Squat (kg/lbs)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={squat}
                        onChangeText={setSquat}
                        placeholder="e.g. 140"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text>Bench Press</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={bench}
                        onChangeText={setBench}
                        placeholder="e.g. 100"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text>Deadlift</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={deadlift}
                        onChangeText={setDeadlift}
                        placeholder="e.g. 180"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text>Overhead Press</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={ohp}
                        onChangeText={setOhp}
                        placeholder="e.g. 60"
                    />
                </View>

                <Button title="Start Program" onPress={handleSave} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginTop: 5,
    },
});
