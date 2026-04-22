import { ExerciseItem } from '../data/exerciseCatalog';
import { CompletedWorkoutRecord } from '../store/slices/activitySlice';

const CALORIES_PER_10000_STEPS = 400;

export const calculateStepCalories = (steps: number) => {
  return Math.round((Math.max(steps, 0) / 10000) * CALORIES_PER_10000_STEPS);
};

export const parseCalories = (calories: string) => {
  const parsed = Number(calories.replace(/[^\d.]/g, ''));

  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
};

export const calculateExerciseCalories = (exercises: ExerciseItem[]) => {
  return exercises.reduce((total, exercise) => {
    return total + parseCalories(exercise.calories);
  }, 0);
};

export const calculateCompletedWorkoutCalories = (
  records: CompletedWorkoutRecord[],
) => {
  return records.reduce((total, record) => total + record.calories, 0);
};

export const calculateCompletedWorkoutMinutes = (
  records: CompletedWorkoutRecord[],
) => {
  const totalSeconds = records.reduce((total, record) => {
    return total + Math.max(record.durationSeconds ?? 0, 0);
  }, 0);

  if (totalSeconds === 0) {
    return 0;
  }

  return Math.max(1, Math.round(totalSeconds / 60));
};

export const formatCalories = (calories: number) => {
  return calories.toLocaleString();
};

export const isToday = (dateValue: string) => {
  const date = new Date(dateValue);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};
