import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from '../src/core/Storage';
import { UserProfile } from '../src/core/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}));

describe('Storage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockProfile: UserProfile = {
        oneRepMaxes: { squat: 100, bench: 100, deadlift: 100, ohp: 100 },
        currentCycle: 1,
        currentWeek: 1,
        liftProgress: {
            squat: { cycle: 1, week: 1 },
            bench: { cycle: 1, week: 1 },
            deadlift: { cycle: 1, week: 1 },
            ohp: { cycle: 1, week: 1 }
        },
        completedWorkouts: [],
        settings: {
            trainingMaxPercentage: 0.9,
            rounding: 2.5,
            unit: 'lb',
            theme: 'dark'
        },
        history: []
    };

    describe('getProfile', () => {
        it('returns null if no profile exists', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
            const profile = await Storage.getProfile();
            expect(profile).toBeNull();
        });

        it('returns parsed profile if exists', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockProfile));
            const profile = await Storage.getProfile();
            expect(profile).toEqual(mockProfile);
        });
    });

    describe('saveProfile', () => {
        it('saves profile to AsyncStorage', async () => {
            await Storage.saveProfile(mockProfile);
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('wendler_531_profile', JSON.stringify(mockProfile));
        });
    });

    describe('resetProgress', () => {
        it('resets cycle and week but keeps history and 1RMs', async () => {
            const modifiedProfile = {
                ...mockProfile,
                currentCycle: 5,
                currentWeek: 3,
                history: [{ id: '123' } as any], // Mock history
                liftProgress: {
                    squat: { cycle: 5, week: 3 },
                    bench: { cycle: 5, week: 3 },
                    deadlift: { cycle: 5, week: 3 },
                    ohp: { cycle: 5, week: 3 }
                }
            };

            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(modifiedProfile));

            await Storage.resetProgress();

            expect(AsyncStorage.setItem).toHaveBeenCalled();
            const savedCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
            const savedProfile = JSON.parse(savedCall[1]);

            expect(savedProfile.currentCycle).toBe(1);
            expect(savedProfile.currentWeek).toBe(1);
            expect(savedProfile.liftProgress.squat.cycle).toBe(1);
            expect(savedProfile.history).toHaveLength(1); // History preserved
            expect(savedProfile.oneRepMaxes).toEqual(mockProfile.oneRepMaxes); // 1RMs preserved
        });
    });

    describe('clearProfile', () => {
        it('removes profile from AsyncStorage', async () => {
            await Storage.clearProfile();
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('wendler_531_profile');
        });
    });
});
