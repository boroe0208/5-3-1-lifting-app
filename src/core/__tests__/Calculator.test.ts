import { Calculator } from '../Calculator';

describe('Calculator', () => {
    describe('calculatePlates', () => {
        it('should calculate plates correctly for lbs (standard 45lb bar)', () => {
            // 135 lbs = 45 bar + 45 + 45
            expect(Calculator.calculatePlates(135, 'lb')).toEqual([45]);

            // 225 lbs = 45 bar + 2x45 + 2x45
            expect(Calculator.calculatePlates(225, 'lb')).toEqual([45, 45]);

            // 315 lbs = 45 bar + 3x45 + 3x45
            expect(Calculator.calculatePlates(315, 'lb')).toEqual([45, 45, 45]);

            // 95 lbs = 45 bar + 25 + 25
            expect(Calculator.calculatePlates(95, 'lb')).toEqual([25]);

            // 65 lbs = 45 bar + 10 + 10
            expect(Calculator.calculatePlates(65, 'lb')).toEqual([10]);

            // 45 lbs = empty bar
            expect(Calculator.calculatePlates(45, 'lb')).toEqual([]);

            // Complex: 185 lbs = 45 + 70/side = 45 + 25
            expect(Calculator.calculatePlates(185, 'lb')).toEqual([45, 25]);
        });

        it('should calculate plates correctly for kg (standard 20kg bar)', () => {
            // 60 kg = 20 bar + 20 + 20
            expect(Calculator.calculatePlates(60, 'kg')).toEqual([20]);

            // 100 kg = 20 bar + 40 + 40 = 20 + 2x20 + 2x20
            expect(Calculator.calculatePlates(100, 'kg')).toEqual([20, 20]);

            // 42.5 kg = 20 bar + 11.25 + 11.25 = 20 + (10 + 1.25) + ...
            expect(Calculator.calculatePlates(42.5, 'kg')).toEqual([10, 1.25]);

            // 20 kg = empty bar
            expect(Calculator.calculatePlates(20, 'kg')).toEqual([]);
        });

        it('should handle weights less than bar weight', () => {
            expect(Calculator.calculatePlates(40, 'lb')).toEqual([]);
            expect(Calculator.calculatePlates(15, 'kg')).toEqual([]);
        });
    });

    describe('roundToNearest', () => {
        it('should round to nearest 5 by default', () => {
            expect(Calculator.roundToNearest(100)).toBe(100);
            expect(Calculator.roundToNearest(102)).toBe(100);
            expect(Calculator.roundToNearest(103)).toBe(105);
            expect(Calculator.roundToNearest(102.5)).toBe(105); // Round half up
        });

        it('should round to specified step', () => {
            expect(Calculator.roundToNearest(100, 2.5)).toBe(100);
            expect(Calculator.roundToNearest(101, 2.5)).toBe(100);
            expect(Calculator.roundToNearest(101.25, 2.5)).toBe(102.5);
            expect(Calculator.roundToNearest(102, 2.5)).toBe(102.5);
        });
    });

    describe('Inventory Logic', () => {
        test('calculatePlates uses inventory correctly', () => {
            const inventory = { 45: 2, 35: 0, 25: 2, 10: 2, 5: 2, 2.5: 2 };
            // 135lbs = 45 bar + 45x2. Inventory has 2x45. OK.
            expect(Calculator.calculatePlates(135, 'lb', inventory)).toEqual([45]);

            // 225lbs = 45 bar + 45x4. Inventory has 2x45. Should use 45x2, then fill rest.
            // Remaining: 180 - 90 = 90. Need 45 per side.
            // Next available: 25. 90 / 2 = 45 per side.
            // 45 - 25 = 20.
            // 20 - 10 = 10.
            // 10 - 5 = 5.
            // 5 - 2.5 = 2.5.
            // So: 45, 25, 10, 5, 2.5
            expect(Calculator.calculatePlates(225, 'lb', inventory)).toEqual([45, 25, 10, 5, 2.5]);
        });

        test('calculatePlates handles empty inventory', () => {
            const inventory = { 45: 0, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 };
            expect(Calculator.calculatePlates(135, 'lb', inventory)).toEqual([]);
        });
    });
});
