import React, { createContext, useContext, useState, useEffect } from 'react';
import { Storage } from './Storage';

export interface Theme {
    name: string;
    colors: {
        background: string;
        card: string;
        text: string;
        subtext: string;
        primary: string;
        border: string;
        success: string;
        danger: string;
        warning: string;
        inputBackground: string;
    };
    shadow: {
        shadowColor: string;
        shadowOffset: { width: number; height: number };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
}

export const THEMES: Record<string, Theme> = {
    light: {
        name: 'Light',
        colors: {
            background: '#F2F2F7', // iOS system gray 6
            card: '#FFFFFF',
            text: '#000000',
            subtext: '#8E8E93',
            primary: '#007AFF',
            border: '#E5E5EA',
            success: '#34C759',
            danger: '#FF3B30',
            warning: '#FF9500',
            inputBackground: '#F2F2F7',
        },
        shadow: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
        },
    },
    dark: {
        name: 'Dark',
        colors: {
            background: '#000000',
            card: '#1C1C1E', // iOS system gray 6 dark
            text: '#FFFFFF',
            subtext: '#8E8E93',
            primary: '#0A84FF',
            border: '#38383A',
            success: '#30D158',
            danger: '#FF453A',
            warning: '#FF9F0A',
            inputBackground: '#2C2C2E',
        },
        shadow: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 3,
        },
    },
    midnight: {
        name: 'Midnight',
        colors: {
            background: '#0F172A', // Slate 900
            card: '#1E293B', // Slate 800
            text: '#F8FAFC', // Slate 50
            subtext: '#94A3B8', // Slate 400
            primary: '#6366F1', // Indigo 500
            border: '#334155', // Slate 700
            success: '#10B981', // Emerald 500
            danger: '#EF4444', // Red 500
            warning: '#F59E0B', // Amber 500
            inputBackground: '#334155',
        },
        shadow: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
        },
    },
    forest: {
        name: 'Forest',
        colors: {
            background: '#142318', // Deep green
            card: '#1C3321',
            text: '#E8F5E9',
            subtext: '#81C784',
            primary: '#4CAF50',
            border: '#2E7D32',
            success: '#66BB6A',
            danger: '#EF5350',
            warning: '#FFA726',
            inputBackground: '#25452A',
        },
        shadow: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 3,
        },
    },
};

type ThemeContextType = {
    theme: Theme;
    setTheme: (name: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: THEMES.light,
    setTheme: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
    const [themeName, setThemeNameState] = useState('light');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        const profile = await Storage.getProfile();
        if (profile && profile.settings && profile.settings.theme) {
            setThemeNameState(profile.settings.theme);
        }
    };

    const setTheme = async (name: string) => {
        setThemeNameState(name);
        const profile = await Storage.getProfile();
        if (profile) {
            await Storage.saveProfile({
                ...profile,
                settings: {
                    ...profile.settings,
                    theme: name,
                }
            });
        }
    };

    const theme = THEMES[themeName] || THEMES.light;

    return (
        <ThemeContext.Provider value={{ theme, setTheme }
        }>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
