import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../core/theme';
import { EXERCISE_LIBRARY } from '../core/exerciseLibrary';

interface ExerciseLibraryModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (exerciseName: string) => void;
}

export const ExerciseLibraryModal = ({ visible, onClose, onSelect }: ExerciseLibraryModalProps) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [customExercise, setCustomExercise] = useState('');
    const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);

    // Extract unique body parts
    const bodyParts = React.useMemo(() => {
        const parts = new Set(EXERCISE_LIBRARY.map(ex => ex.bodyPart).filter(Boolean));
        return Array.from(parts).sort();
    }, []);

    const filteredExercises = EXERCISE_LIBRARY.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBodyPart = selectedBodyPart ? ex.bodyPart === selectedBodyPart : true;
        return matchesSearch && matchesBodyPart;
    });

    const handleSelect = (name: string) => {
        onSelect(name);
        onClose();
        setSearchQuery('');
        setSelectedBodyPart(null);
    };

    const handleAddCustom = () => {
        if (customExercise.trim()) {
            onSelect(customExercise.trim());
            onClose();
            setCustomExercise('');
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalContainer}
            >
                <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>Add Exercise</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                        placeholder="Search exercises..."
                        placeholderTextColor={theme.colors.subtext}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    {/* Body Part Filters */}
                    <View style={{ marginBottom: 12 }}>
                        <FlatList
                            horizontal
                            data={['All', ...bodyParts]}
                            keyExtractor={(item) => item}
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const isSelected = (item === 'All' && !selectedBodyPart) || item === selectedBodyPart;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.filterChip,
                                            {
                                                backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                                                borderColor: theme.colors.border,
                                                borderWidth: 1
                                            }
                                        ]}
                                        onPress={() => setSelectedBodyPart(item === 'All' ? null : item)}
                                    >
                                        <Text style={{
                                            color: isSelected ? 'white' : theme.colors.text,
                                            fontWeight: isSelected ? '600' : '400'
                                        }}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>

                    <FlatList
                        data={filteredExercises}
                        keyExtractor={(item) => item.name}
                        style={styles.list}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.exerciseItem, { borderBottomColor: theme.colors.border }]}
                                onPress={() => handleSelect(item.name)}
                            >
                                <View>
                                    <Text style={[styles.exerciseName, { color: theme.colors.text }]}>{item.name}</Text>
                                    <Text style={[styles.exerciseCategory, { color: theme.colors.subtext }]}>
                                        {item.category} • {item.bodyPart || 'Other'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={{ color: theme.colors.subtext }}>No exercises found.</Text>
                            </View>
                        )}
                    />

                    <View style={[styles.customSection, { borderTopColor: theme.colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Custom Exercise</Text>
                        <View style={styles.customRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10, color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                placeholder="Enter exercise name"
                                placeholderTextColor={theme.colors.subtext}
                                value={customExercise}
                                onChangeText={setCustomExercise}
                            />
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                                onPress={handleAddCustom}
                            >
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        height: '80%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
    },
    list: {
        flex: 1,
    },
    exerciseItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: '500',
    },
    exerciseCategory: {
        fontSize: 14,
        marginTop: 4,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    customSection: {
        paddingTop: 20,
        borderTopWidth: 1,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    customRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButton: {
        paddingHorizontal: 20,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
});
