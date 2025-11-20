import { Calculator } from '../src/core/Calculator';

describe('Calculator', () => {
    test('roundToNearest rounds correctly', () => {
        expect(Calculator.roundToNearest(100, 2.5)).toBe(100);
        expect(Calculator.roundToNearest(101, 2.5)).toBe(100);
        expect(Calculator.roundToNearest(102, 2.5)).toBe(102.5);
        expect(Calculator.roundToNearest(103, 2.5)).toBe(102.5);
        expect(Calculator.roundToNearest(104, 2.5)).toBe(105);
    });

    test('calculateTrainingMax returns 90% of 1RM rounded', () => {
        expect(Calculator.calculateTrainingMax(100)).toBe(90);
        expect(Calculator.calculateTrainingMax(200)).toBe(180);
        // 150 * 0.9 = 135
        expect(Calculator.calculateTrainingMax(150)).toBe(135);
    });

    test('calculateSetWeight returns correct percentage rounded', () => {
        const tm = 100;
        expect(Calculator.calculateSetWeight(tm, 0.65)).toBe(65);
        expect(Calculator.calculateSetWeight(tm, 0.75)).toBe(75);
        expect(Calculator.calculateSetWeight(tm, 0.85)).toBe(85);
    });

    test('getWorkSets returns correct sets for Week 1', () => {
        const tm = 100;
        const sets = Calculator.getWorkSets(tm, 1);
        expect(sets).toHaveLength(3);
        expect(sets[0].percentage).toBe(0.65);
        expect(sets[0].weight).toBe(65);
        expect(sets[0].reps).toBe(5);
        expect(sets[2].isAmrap).toBe(true);
    });

    test('getWorkSets returns correct sets for Week 2', () => {
        const tm = 100;
        const sets = Calculator.getWorkSets(tm, 2);
        expect(sets).toHaveLength(3);
        expect(sets[0].percentage).toBe(0.70);
        expect(sets[0].weight).toBe(70);
        expect(sets[0].reps).toBe(3);
        expect(sets[2].isAmrap).toBe(true);
    });

    test('getWorkSets returns correct sets for Week 3', () => {
        const tm = 100;
        const sets = Calculator.getWorkSets(tm, 3);
        expect(sets).toHaveLength(3);
        expect(sets[0].percentage).toBe(0.75);
        expect(sets[0].weight).toBe(75);
        expect(sets[0].reps).toBe(5);
        expect(sets[1].reps).toBe(3);
        expect(sets[2].reps).toBe(1);
        expect(sets[2].isAmrap).toBe(true);
    });

    test('getWorkSets returns correct sets for Week 4 (Deload)', () => {
        const tm = 100;
        const sets = Calculator.getWorkSets(tm, 4);
        expect(sets).toHaveLength(3);
        expect(sets[0].percentage).toBe(0.40);
        expect(sets[0].weight).toBe(40);
        expect(sets[0].reps).toBe(5);
        expect(sets[1].percentage).toBe(0.50);
        expect(sets[1].weight).toBe(50);
        expect(sets[1].reps).toBe(5);
        expect(sets[2].percentage).toBe(0.60);
        expect(sets[2].weight).toBe(60);
        expect(sets[2].reps).toBe(5);
        expect(sets[2].isAmrap).toBe(false); // No AMRAP on deload
    });

    describe('calculateEstimated1RM', () => {
        it('calculates estimated 1RM correctly', () => {
            // 100 * 5 * 0.0333 + 100 = 16.65 + 100 = 116.65 -> 117
            expect(Calculator.calculateEstimated1RM(100, 5)).toBe(117);

            // 200 * 1 * 0.0333 + 200 = 6.66 + 200 = 206.66 -> 207
            expect(Calculator.calculateEstimated1RM(200, 1)).toBe(207);
        });

        it('returns weight if reps is 0 (edge case)', () => {
            expect(Calculator.calculateEstimated1RM(100, 0)).toBe(100);
        });
    });
    describe('calculateRepsToBeat1RM', () => {
        it('calculates correct reps to beat 1RM', () => {
            // 1RM = 100. Weight = 85.
            // 1 rep @ 85 = 85 * 1 * 0.0333 + 85 = 87.8
            // ...
            // 5 reps @ 85 = 85 * 5 * 0.0333 + 85 = 14.15 + 85 = 99.15
            // 6 reps @ 85 = 85 * 6 * 0.0333 + 85 = 16.98 + 85 = 101.98 > 100
            expect(Calculator.calculateRepsToBeat1RM(85, 100)).toBe(6);
        });

        it('returns 0 if weight is 0 or negative', () => {
            expect(Calculator.calculateRepsToBeat1RM(0, 100)).toBe(0);
            expect(Calculator.calculateRepsToBeat1RM(-10, 100)).toBe(0);
        });
    });

    describe('generateCycleWorkouts', () => {
        it('generates 16 workouts for a full cycle', () => {
            const oneRepMaxes = { squat: 100, bench: 100, deadlift: 100, ohp: 100 };
            const workouts = Calculator.generateCycleWorkouts(oneRepMaxes);
            expect(workouts).toHaveLength(16); // 4 weeks * 4 lifts
        });

        it('calculates correct weights for Week 1 Squat', () => {
            const oneRepMaxes = { squat: 100, bench: 100, deadlift: 100, ohp: 100 };
            const workouts = Calculator.generateCycleWorkouts(oneRepMaxes);
            const squatWeek1 = workouts.find(w => w.lift === 'Squat' && w.week === 1);

            expect(squatWeek1).toBeDefined();
            // TM = 90.
            // Set 1: 65% of 90 = 58.5 -> 57.5 or 60 depending on rounding. Default rounding 2.5.
            // 58.5 / 2.5 = 23.4 -> 23 * 2.5 = 57.5
            expect(squatWeek1?.sets[0].weight).toBe(57.5);
        });
    });
});
