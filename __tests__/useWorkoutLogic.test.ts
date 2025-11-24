import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWorkoutLogic } from '../src/hooks/useWorkoutLogic';
import { useUser } from '../src/core/UserContext';
import { Calculator } from '../src/core/Calculator';

// Mock dependencies
jest.mock('../src/core/UserContext');
jest.mock('../src/core/Calculator');

describe('useWorkoutLogic', () => {
    const mockSaveProfile = jest.fn();
    const mockNavigation = {
        setOptions: jest.fn(),
        goBack: jest.fn(),
    };
    const mockRoute = {
        params: {
            lift: 'Squat',
            week: 1,
            cycle: 1,
            tm: 100,
            workoutId: 'test-workout',
        }
    };

    const mockProfile = {
        settings: {
            trainingMaxPercentage: 0.9,
            rounding: 2.5,
            unit: 'kg',
        },
        oneRepMaxes: { squat: 100 },
        personalRecords: {},
        history: [],
        completedWorkouts: [],
        liftProgress: {},
        customAssistance: {},
        assistanceTemplate: 'None',
    };

    beforeEach(() => {
        (useUser as jest.Mock).mockReturnValue({
            profile: mockProfile,
            saveProfile: mockSaveProfile,
        });
        (Calculator.generateWorkout as jest.Mock).mockReturnValue({
            id: 'test-workout',
            name: 'Squat 5/3/1',
            lift: 'Squat',
            sets: [],
            completed: false,
        });
        (Calculator.generateBBB as jest.Mock).mockReturnValue([]);
    });

    it('should add assistance exercise', async () => {
        const { result } = renderHook(() => useWorkoutLogic({ route: mockRoute, navigation: mockNavigation }));

        // Wait for init
        await waitFor(() => expect(result.current.workout).toBeTruthy());

        act(() => {
            result.current.addAssistanceExercise('Dips');
        });

        expect(result.current.assistanceWork).toHaveLength(1);
        expect(result.current.assistanceWork[0].name).toBe('Dips');
    });

    it('should remove assistance exercise', async () => {
        const { result } = renderHook(() => useWorkoutLogic({ route: mockRoute, navigation: mockNavigation }));

        await waitFor(() => expect(result.current.workout).toBeTruthy());

        act(() => {
            result.current.addAssistanceExercise('Dips');
        });

        expect(result.current.assistanceWork).toHaveLength(1);

        act(() => {
            result.current.removeAssistanceExercise(0);
        });

        expect(result.current.assistanceWork).toHaveLength(0);
    });

    it('should save custom assistance on finish', async () => {
        const { result } = renderHook(() => useWorkoutLogic({ route: mockRoute, navigation: mockNavigation }));

        await waitFor(() => expect(result.current.workout).toBeTruthy());

        act(() => {
            result.current.addAssistanceExercise('Push-ups');
        });

        await act(async () => {
            await result.current.finishWorkout();
        });

        expect(mockSaveProfile).toHaveBeenCalled();
        const savedProfile = mockSaveProfile.mock.calls[0][0];
        expect(savedProfile.customAssistance.squat).toBeDefined();
        expect(savedProfile.customAssistance.squat[0].name).toBe('Push-ups');
    });
});
