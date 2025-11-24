import { useWorkoutLogic } from '../src/hooks/useWorkoutLogic';

describe('Import Test', () => {
    it('should import successfully', () => {
        expect(useWorkoutLogic).toBeDefined();
    });
});
