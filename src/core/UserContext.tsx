import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Storage } from './Storage';
import { UserProfile } from './types';

interface UserContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
    saveProfile: (newProfile: UserProfile) => Promise<void>;
    resetProfile: () => Promise<void>;
    clearProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    profile: null,
    isLoading: true,
    refreshProfile: async () => { },
    saveProfile: async () => { },
    resetProfile: async () => { },
    clearProfile: async () => { },
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        try {
            const data = await Storage.getProfile();
            if (!data) {
                // Default profile if none exists
                const defaultProfile: UserProfile = {
                    oneRepMaxes: { squat: 0, bench: 0, deadlift: 0, ohp: 0 },
                    currentCycle: 1,
                    currentWeek: 1,
                    liftProgress: {},
                    completedWorkouts: [],
                    settings: {
                        trainingMaxPercentage: 0.9,
                        rounding: 5,
                        unit: 'lb',
                        theme: 'default',
                        plateInventory: {
                            lb: { 45: 12, 35: 0, 25: 12, 10: 12, 5: 12, 2.5: 12 },
                            kg: { 20: 12, 15: 12, 10: 12, 5: 12, 2.5: 12, 1.25: 12 }
                        }
                    },
                    history: [],
                };
                setProfile(defaultProfile);
                await Storage.saveProfile(defaultProfile);
            } else {
                setProfile(data);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    const saveProfile = async (newProfile: UserProfile) => {
        setProfile(newProfile); // Optimistic update
        await Storage.saveProfile(newProfile);
    };

    const resetProfile = async () => {
        await Storage.resetProgress();
        await refreshProfile();
    };

    const clearProfile = async () => {
        await Storage.clearProfile();
        setProfile(null);
    };

    return (
        <UserContext.Provider value={{ profile, isLoading, refreshProfile, saveProfile, resetProfile, clearProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
