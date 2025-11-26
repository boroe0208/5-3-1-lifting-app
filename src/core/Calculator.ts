import { OneRepMaxes, Workout, WorkoutSet, AssistanceExercise } from './types';

export const ROUNDING_STEP = 5;

export class Calculator {
    static roundToNearest(value: number, step: number = ROUNDING_STEP): number {
        return Math.round(value / step) * step;
    }

    static calculateTrainingMax(oneRepMax: number): number {
        return this.roundToNearest(oneRepMax * 0.9);
    }

    static calculateSetWeight(trainingMax: number, percentage: number): number {
        return this.roundToNearest(trainingMax * percentage);
    }

    static calculateEstimated1RM(weight: number, reps: number): number {
        return Math.round(weight * reps * 0.0333 + weight);
    }

    static calculate1RM(weight: number, reps: number): number {
        return this.calculateEstimated1RM(weight, reps);
    }

    static calculateRepsToBeat1RM(weight: number, current1RM: number): number {
        if (weight <= 0) return 0;
        let reps = 1;
        while (this.calculateEstimated1RM(weight, reps) <= current1RM) {
            reps++;
            if (reps > 100) break; // Safety break
        }
        return reps;
    }

    static generateCycleWorkouts(oneRepMaxes: OneRepMaxes, tmPercentage: number = 0.9, rounding: number = 2.5, cycle: number = 1): Workout[] {
        const lifts = ['Squat', 'Bench', 'Deadlift', 'OHP'];
        const weeks = [1, 2, 3, 4];
        const workouts: Workout[] = [];

        weeks.forEach(week => {
            lifts.forEach(lift => {
                const liftKey = lift.toLowerCase() as keyof OneRepMaxes;
                const oneRepMax = oneRepMaxes[liftKey];
                const trainingMax = this.roundToNearest(oneRepMax * tmPercentage, rounding);

                const workSets = this.getWorkSets(trainingMax, week);

                workouts.push({
                    id: `cycle${cycle}_week${week}_${liftKey}`,
                    name: `${lift}`,
                    lift: lift,
                    cycle: cycle,
                    week: week,
                    sets: workSets,
                    completed: false
                });
            });
        });

        return workouts;
    }

    static generateWorkout(lift: string, tm: number, week: number, cycle: number, rounding: number = 2.5): Workout {
        const workSets = this.getWorkSets(tm, week);
        return {
            id: `cycle${cycle}_week${week}_${lift.toLowerCase()}`,
            name: `${lift}`,
            lift: lift,
            cycle: cycle,
            week: week,
            sets: workSets,
            completed: false,
            assistanceWork: []
        };
    }

    static generateBBB(lift: string, tm: number, week: number, rounding: number = 2.5): AssistanceExercise[] {
        // BBB Standard: 50% of TM for all weeks
        const percentage = 0.5;
        const weight = this.roundToNearest(tm * percentage, rounding);

        return [{
            name: `${lift} (BBB)`,
            sets: 5,
            reps: 10,
            weight: weight,
            completed: Array(5).fill(false)
        }];
    }

    static getWorkSets(trainingMax: number, week: number): WorkoutSet[] {
        const WEEK_PERCENTAGES = {
            1: [0.65, 0.75, 0.85],
            2: [0.70, 0.80, 0.90],
            3: [0.75, 0.85, 0.95],
            4: [0.40, 0.50, 0.60],
        };

        const WEEK_REPS = {
            1: [5, 5, 5],
            2: [3, 3, 3],
            3: [5, 3, 1],
            4: [5, 5, 5],
        };

        const percentages = WEEK_PERCENTAGES[week as keyof typeof WEEK_PERCENTAGES];
        const reps = WEEK_REPS[week as keyof typeof WEEK_REPS];

        if (!percentages || !reps) {
            throw new Error(`Invalid week: ${week}`);
        }

        return percentages.map((pct, index) => ({
            weight: this.calculateSetWeight(trainingMax, pct),
            percentage: pct,
            reps: reps[index],
            completed: false,
            isAmrap: week !== 4 && index === 2,
        }));
    }

    static calculatePlates(weight: number, unit: 'lb' | 'kg' = 'lb', inventory?: { [weight: number]: number }): number[] {
        const barWeight = unit === 'lb' ? 45 : 20;
        const availablePlates = unit === 'lb'
            ? [45, 35, 25, 10, 5, 2.5]
            : [20, 15, 10, 5, 2.5, 1.25];

        let remainingWeight = (weight - barWeight) / 2;
        const plates: number[] = [];

        // Create a mutable copy of inventory if provided, otherwise assume infinite
        const currentInventory = inventory ? { ...inventory } : null;

        if (remainingWeight <= 0) return [];

        for (const plate of availablePlates) {
            while (remainingWeight >= plate) {
                // Check inventory if it exists
                if (currentInventory) {
                    const count = currentInventory[plate] || 0;
                    if (count >= 2) { // Need 2 plates (one for each side)
                        plates.push(plate);
                        remainingWeight -= plate;
                        currentInventory[plate] -= 2;
                    } else {
                        break; // Not enough of this plate, move to next smaller
                    }
                } else {
                    // Infinite inventory
                    plates.push(plate);
                    remainingWeight -= plate;
                }
            }
        }

        return plates;
    }
}
