import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from './types';

const PROFILE_KEY = 'wendler_531_profile';

export const Storage = {
    async saveProfile(profile: UserProfile): Promise<void> {
        try {
            const jsonValue = JSON.stringify(profile);
            await AsyncStorage.setItem(PROFILE_KEY, jsonValue);
        } catch (e) {
            console.error('Failed to save profile', e);
            throw e;
        }
    },

    async getProfile(): Promise<UserProfile | null> {
        try {
            const jsonValue = await AsyncStorage.getItem(PROFILE_KEY);
            if (jsonValue != null) {
                const profile = JSON.parse(jsonValue);
                // Migration/Defaults for new fields
                if (!profile.settings) {
                    profile.settings = {
                        rounding: 5,
                        unit: 'lb',
                        trainingMaxPercentage: 0.90
                    };
                }
                if (!profile.history) {
                    profile.history = [];
                }
                // Migration for per-lift progress
                if (!profile.liftProgress) {
                    profile.liftProgress = {
                        squat: { cycle: profile.currentCycle || 1, week: profile.currentWeek || 1 },
                        bench: { cycle: profile.currentCycle || 1, week: profile.currentWeek || 1 },
                        deadlift: { cycle: profile.currentCycle || 1, week: profile.currentWeek || 1 },
                        ohp: { cycle: profile.currentCycle || 1, week: profile.currentWeek || 1 },
                    };
                }
                return profile;
            }
            return null;
        } catch (e) {
            console.error('Failed to fetch profile', e);
            return null;
        }
    },

    async clearProfile(): Promise<void> {
        try {
            await AsyncStorage.removeItem(PROFILE_KEY);
        } catch (e) {
            console.error('Failed to clear profile', e);
        }
    },

    async resetProgress(): Promise<void> {
        try {
            const profile = await this.getProfile();
            if (profile) {
                const newProfile = {
                    ...profile,
                    currentCycle: 1,
                    currentWeek: 1,
                    liftProgress: {
                        squat: { cycle: 1, week: 1 },
                        bench: { cycle: 1, week: 1 },
                        deadlift: { cycle: 1, week: 1 },
                        ohp: { cycle: 1, week: 1 },
                    }
                };
                await this.saveProfile(newProfile);
            }
        } catch (e) {
            console.error('Failed to reset progress', e);
            throw e;
        }
    }
};
