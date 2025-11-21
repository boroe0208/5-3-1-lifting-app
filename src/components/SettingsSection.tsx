import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../core/theme';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

export const SettingsSection = ({ title, children }: SettingsSectionProps) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.section, { backgroundColor: theme.colors.card }, theme.shadow]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
});
