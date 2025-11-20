import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { Storage } from '../core/Storage';
import { UserProfile, WorkoutHistoryEntry } from '../core/types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import XLSX from 'xlsx';
import { useTheme, THEMES } from '../core/theme';

export const SettingsScreen = ({ navigation }: any) => {
    const { theme, setTheme } = useTheme();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [tmPercentage, setTmPercentage] = useState('90');
    const [rounding, setRounding] = useState('2.5');

    useEffect(() => {
        loadSettings();
        navigation.setOptions({
            headerStyle: { backgroundColor: theme.colors.card },
            headerTintColor: theme.colors.text,
        });
    }, [theme]);

    const loadSettings = async () => {
        const p = await Storage.getProfile();
        if (p) {
            setProfile(p);
            setTmPercentage(p.settings.trainingMaxPercentage.toString());
            setRounding(p.settings.rounding.toString());
        }
    };

    const saveSettings = async () => {
        if (!profile) return;

        const newSettings = {
            ...profile.settings,
            trainingMaxPercentage: parseFloat(tmPercentage),
            rounding: parseFloat(rounding),
        };

        await Storage.saveProfile({
            ...profile,
            settings: newSettings,
        });

        Alert.alert('Success', 'Settings saved!');
    };

    const exportHistory = async () => {
        if (Platform.OS === 'web') {
            Alert.alert('Not Supported', 'Export is not supported on web yet.');
            return;
        }
        if (!profile || !profile.history) {
            Alert.alert('No Data', 'No workout history to export.');
            return;
        }

        // Convert history to worksheet
        const data = profile.history.flatMap(entry => {
            return entry.sets.map((set, index) => ({
                Date: new Date(entry.date).toLocaleDateString(),
                Workout: entry.workoutName,
                Lift: entry.workoutName.split(' ')[0], // Simple parsing
                Set: index + 1,
                Weight: set.weight,
                Reps: set.actualReps || set.reps,
                Type: set.isAmrap ? 'AMRAP' : 'Normal',
                Estimated1RM: set.isAmrap && entry.estimatedOneRepMaxes ? entry.estimatedOneRepMaxes[entry.workoutName.split(' ')[0].toLowerCase() as keyof typeof entry.estimatedOneRepMaxes] : ''
            }));
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "History");

        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        // @ts-ignore
        const uri = FileSystem.documentDirectory + 'workout_history.xlsx';

        await FileSystem.writeAsStringAsync(uri, wbout, {
            // @ts-ignore
            encoding: FileSystem.EncodingType.Base64
        });

        await Sharing.shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Export Workout History'
        });
    };

    const importHistory = async () => {
        if (Platform.OS === 'web') {
            Alert.alert('Not Supported', 'Import is not supported on web yet.');
            return;
        }
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const fileUri = result.assets[0].uri;
            const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                // @ts-ignore
                encoding: FileSystem.EncodingType.Base64
            });

            const wb = XLSX.read(fileContent, { type: 'base64' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            // Basic validation and merging logic would go here
            // For now, just alert success as a placeholder for complex merging logic
            Alert.alert('Import', `Read ${data.length} rows. Merging logic to be implemented.`);

            // In a real app, we'd parse 'data' back into WorkoutHistoryEntry[] and merge with profile.history

        } catch (error) {
            Alert.alert('Error', 'Failed to import file.');
            console.error(error);
        }
    };

    const handleReset = async () => {
        Alert.alert(
            "Reset Data",
            "Choose an option:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset Progress Only",
                    onPress: async () => {
                        await Storage.resetProgress();
                        Alert.alert('Success', 'Cycle progress has been reset to 1/1. 1RMs and History are preserved.');
                        // Force reload settings to reflect changes if needed, or just let user navigate
                        loadSettings();
                    }
                },
                {
                    text: "Factory Reset (Wipe All)",
                    style: "destructive",
                    onPress: async () => {
                        Alert.alert(
                            "Confirm Factory Reset",
                            "Are you sure? This will delete ALL data including history and settings.",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Wipe Everything",
                                    style: "destructive",
                                    onPress: async () => {
                                        await Storage.clearProfile();
                                        navigation.reset({
                                            index: 0,
                                            routes: [{ name: 'Home' }],
                                        });
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    if (!profile) return (
        <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: theme.colors.text }}>Loading...</Text>
        </View>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Training Max %</Text>
                <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                    value={tmPercentage}
                    onChangeText={setTmPercentage}
                    keyboardType="numeric"
                />
                <Text style={[styles.helpText, { color: theme.colors.subtext }]}>Percentage of 1RM to use as Training Max (default 0.9)</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Rounding</Text>
                <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.inputBackground }]}
                    value={rounding}
                    onChangeText={setRounding}
                    keyboardType="numeric"
                />
                <Text style={[styles.helpText, { color: theme.colors.subtext }]}>Round weights to nearest (e.g. 2.5 or 5)</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Theme</Text>
                <View style={styles.themeContainer}>
                    {Object.keys(THEMES).map((themeKey) => (
                        <TouchableOpacity
                            key={themeKey}
                            style={[
                                styles.themeButton,
                                { backgroundColor: THEMES[themeKey as keyof typeof THEMES].colors.primary },
                                theme.name === themeKey && styles.activeThemeButton
                            ]}
                            onPress={() => setTheme(themeKey)}
                        >
                            <Text style={styles.themeButtonText}>{themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveSettings}>
                <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Data Management</Text>

            <TouchableOpacity style={[styles.actionButton, { borderColor: theme.colors.primary }]} onPress={exportHistory}>
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Export History (Excel)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { borderColor: theme.colors.primary }]} onPress={importHistory}>
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Import History (Excel)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { borderColor: theme.colors.danger, marginTop: 32 }]} onPress={handleReset}>
                <Text style={[styles.actionButtonText, { color: theme.colors.danger }]}>Reset App Data</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
    },
    helpText: {
        fontSize: 14,
        marginTop: 8,
    },
    saveButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        marginVertical: 40,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    actionButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
    },
    actionButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    themeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    themeButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        minWidth: 90,
        alignItems: 'center',
    },
    activeThemeButton: {
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    themeButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
});
