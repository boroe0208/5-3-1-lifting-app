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
});
