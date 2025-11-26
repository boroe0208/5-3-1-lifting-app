import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../core/theme';
import { useUser } from '../core/UserContext';
import { Calculator } from '../core/Calculator';

interface PlateDisplayProps {
    weight: number;
    unit?: 'lb' | 'kg';
}

const PLATE_CONFIG: Record<number, { color: string, height: number }> = {
    // Common / Lbs
    45: { color: '#0047AB', height: 80 }, // Cobalt Blue
    35: { color: '#FFD700', height: 70 }, // Gold/Yellow
    25: { color: '#008000', height: 60 }, // Green
    10: { color: '#000000', height: 45 }, // Black
    5: { color: '#3a6566ff', height: 30 },  // Grey
    2.5: { color: '#FF0000', height: 25 }, // Red

    // Kg specific
    20: { color: '#0047AB', height: 80 },
    15: { color: '#FFD700', height: 70 },
    1.25: { color: '#C0C0C0', height: 25 }, // Silver/Small
};

export const PlateDisplay = ({ weight, unit = 'lb' }: PlateDisplayProps) => {
    const { theme } = useTheme();
    const { profile } = useUser();
    const plates = Calculator.calculatePlates(weight, unit, profile?.settings.plateInventory?.[unit]);

    if (plates.length === 0) return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: theme.colors.subtext }]}>Empty Bar</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.barContainer}>
                {/* The Bar Sleeve */}
                <View style={[styles.barLine, { backgroundColor: theme.colors.subtext }]} />

                {/* The Collar */}
                <View style={[styles.collar, { backgroundColor: '#888' }]} />

                {/* Plates */}
                {plates.map((plateWeight, index) => {
                    const config = PLATE_CONFIG[plateWeight] || { color: theme.colors.primary, height: 40 };

                    return (
                        <View
                            key={index}
                            style={[
                                styles.plate,
                                {
                                    backgroundColor: config.color,
                                    height: config.height,
                                    borderColor: '#333',
                                    borderWidth: 1
                                }
                            ]}
                        >
                            {config.height >= 25 && (
                                <Text style={styles.plateText}>
                                    {plateWeight}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Text Summary */}
            <Text style={[styles.summary, { color: theme.colors.subtext }]}>
                {plates.join(', ')} {unit} / side
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        alignItems: 'flex-start',
    },
    label: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    barContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 90, // Accommodate max plate height
        paddingRight: 20,
    },
    barLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 12,
        borderRadius: 2,
        zIndex: -1,
    },
    collar: {
        width: 12,
        height: 30,
        marginRight: 2,
        borderRadius: 2,
    },
    plate: {
        width: 24,
        marginRight: 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 2,
    },
    plateText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.8)', // Stronger shadow for visibility on yellow/silver
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    summary: {
        fontSize: 12,
        marginTop: 4,
    }
});
