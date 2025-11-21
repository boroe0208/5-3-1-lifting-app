import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { Storage } from '../core/Storage';
import { UserProfile, WorkoutHistoryEntry } from '../core/types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import XLSX from 'xlsx';
import { useTheme, THEMES } from '../core/theme';
import { useUser } from '../core/UserContext';
import { SettingsSection } from '../components/SettingsSection';

export const SettingsScreen = ({ navigation }: any) => {
    const { theme, setTheme } = useTheme();
    const { profile, saveProfile, resetProfile, clearProfile } = useUser();
    const [tmPercentage, setTmPercentage] = useState('90');
    const [rounding, setRounding] = useState('2.5');

    useEffect(() => {
        if (profile) {
            setTmPercentage(profile.settings.trainingMaxPercentage.toString());
            setRounding(profile.settings.rounding.toString());
        }
        navigation.setOptions({
            headerStyle: { backgroundColor: theme.colors.card },
            headerTintColor: theme.colors.text,
        });
    }, [theme, profile]);

    const handleSaveSettings = async () => {
        if (!profile) return;
        const newSettings = {
            ...profile.settings,
            trainingMaxPercentage: parseFloat(tmPercentage),
            rounding: parseFloat(rounding),
        };
        const newProfile = {
            ...profile,
            settings: newSettings,
        };
        await saveProfile(newProfile);
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

    const handleResetProgress = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm("This will reset your current cycle and week to 1/1. Your 1RMs and workout history will be preserved.")) {
                await resetProfile();
                window.alert('Success: Cycle progress has been reset to 1/1.');
            }
            return;
        }

        Alert.alert(
            "Reset Cycle Progress",
            "This will reset your current cycle and week to 1/1. Your 1RMs and workout history will be preserved.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset Progress",
                    onPress: async () => {
                        await resetProfile();
                        Alert.alert('Success', 'Cycle progress has been reset to 1/1.');
                    }
                }
            ]
        );
    };

    const handleStartFromScratch = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to delete EVERYTHING? This includes all history, settings, and progress. This cannot be undone.")) {
                await clearProfile();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
            return;
        }

        Alert.alert(
            "Start from Scratch",
            "Are you sure you want to delete EVERYTHING? This includes all history, settings, and progress. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Everything",
                    style: "destructive",
                    onPress: async () => {
                        await clearProfile();
                        // Reset navigation stack to force onboarding
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                    }
                }
            ]
        );
    };

    const handleAssistanceChange = async (template: 'None' | 'BoringButBig' | 'Custom') => {
        if (profile) {
            const newProfile = { ...profile, assistanceTemplate: template };
            await saveProfile(newProfile);
        }
    };

    if (!profile) return (
        <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: theme.colors.text }}>Loading...</Text>
        </View>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <SettingsSection title="Training Max">
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Percentage of 1RM to use as Training Max</Text>
                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                        keyboardType="numeric"
                        value={tmPercentage}
                        onChangeText={setTmPercentage}
                        onBlur={handleSaveSettings}
                    />
                    <Text style={[styles.unit, { color: theme.colors.text }]}>%</Text>
                </View>
            </SettingsSection>

            <SettingsSection title="Assistance Work">
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Choose your accessory work template</Text>
                <View style={styles.row}>
                    {['None', 'BoringButBig', 'Custom'].map((template) => (
                        <TouchableOpacity
                            key={template}
                            style={[
                                styles.optionButton,
                                profile.assistanceTemplate === template && { backgroundColor: theme.colors.primary },
                                { borderColor: theme.colors.border }
                            ]}
                            onPress={() => handleAssistanceChange(template as any)}
                        >
                            <Text style={[
                                styles.optionText,
                                profile.assistanceTemplate === template ? { color: '#fff' } : { color: theme.colors.text }
                            ]}>
                                {template === 'BoringButBig' ? 'BBB' : template}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {profile.assistanceTemplate === 'BoringButBig' && (
                    <Text style={[styles.infoText, { color: theme.colors.subtext }]}>
                        Adds 5 sets of 10 reps of the main lift at 50% TM.
                    </Text>
                )}
                {profile.assistanceTemplate === 'Custom' && (
                    <Text style={[styles.infoText, { color: theme.colors.subtext }]}>
                        Custom exercises can be configured in the workout screen (Coming Soon).
                    </Text>
                )}
            </SettingsSection>

            <SettingsSection title="Rounding">
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Round weights to nearest</Text>
                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                        keyboardType="numeric"
                        value={rounding}
                        onChangeText={setRounding}
                        onBlur={handleSaveSettings}
                    />
                    <Text style={[styles.unit, { color: theme.colors.text }]}>{profile.settings.unit}</Text>
                </View>
            </SettingsSection>

            <SettingsSection title="Theme">
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
            </SettingsSection>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <SettingsSection title="Data Management">
                <TouchableOpacity style={[styles.actionButton, { borderColor: theme.colors.primary }]} onPress={exportHistory}>
                    <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Export History (Excel)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { borderColor: theme.colors.primary }]} onPress={importHistory}>
                    <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Import History (Excel)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { borderColor: theme.colors.warning, marginTop: 32 }]} onPress={handleResetProgress}>
                    <Text style={[styles.actionButtonText, { color: theme.colors.warning }]}>Reset Cycle Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, { borderColor: theme.colors.danger, marginTop: 16 }]} onPress={handleStartFromScratch}>
                    <Text style={[styles.actionButtonText, { color: theme.colors.danger }]}>Start from Scratch</Text>
                </TouchableOpacity>
            </SettingsSection>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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

    label: {
        fontSize: 14,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 18,
        width: 100,
        textAlign: 'center',
    },
    unit: {
        fontSize: 18,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 24,
    },
    optionButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    optionText: {
        fontWeight: '600',
    },
    infoText: {
        marginTop: 12,
        fontSize: 14,
        fontStyle: 'italic',
    },
    saveButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
});
