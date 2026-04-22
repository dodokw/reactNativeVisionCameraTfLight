import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CompletedWorkoutRecord = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  completedAt: string;
  calories: number;
  reps?: number;
  durationSeconds?: number;
  source: 'camera' | 'manual';
};

export type RoutineDayKey =
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat'
  | 'sun';

export type WeeklyRoutine = Record<RoutineDayKey, string[]>;

interface ActivityState {
  todayExerciseIds: string[];
  weeklyRoutine: WeeklyRoutine;
  completedWorkouts: CompletedWorkoutRecord[];
}

const initialState: ActivityState = {
  todayExerciseIds: ['push-up'],
  weeklyRoutine: {
    mon: ['push-up'],
    tue: [],
    wed: ['squat'],
    thu: [],
    fri: ['push-up'],
    sat: [],
    sun: [],
  },
  completedWorkouts: [],
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    toggleTodayExercise: (state, action: PayloadAction<string>) => {
      const exerciseId = action.payload;
      const todayExerciseIds = state.todayExerciseIds ?? [];

      state.todayExerciseIds = todayExerciseIds.includes(exerciseId)
        ? todayExerciseIds.filter(id => id !== exerciseId)
        : [...todayExerciseIds, exerciseId];
    },
    clearTodayExercises: state => {
      state.todayExerciseIds = [];
    },
    setTodayExercises: (state, action: PayloadAction<string[]>) => {
      state.todayExerciseIds = action.payload;
    },
    toggleRoutineExercise: (
      state,
      action: PayloadAction<{ day: RoutineDayKey; exerciseId: string }>,
    ) => {
      const { day, exerciseId } = action.payload;
      const routineDay = state.weeklyRoutine?.[day] ?? [];

      state.weeklyRoutine = {
        ...initialState.weeklyRoutine,
        ...(state.weeklyRoutine ?? {}),
        [day]: routineDay.includes(exerciseId)
          ? routineDay.filter(id => id !== exerciseId)
          : [...routineDay, exerciseId],
      };
    },
    clearRoutineDay: (state, action: PayloadAction<RoutineDayKey>) => {
      state.weeklyRoutine = {
        ...initialState.weeklyRoutine,
        ...(state.weeklyRoutine ?? {}),
        [action.payload]: [],
      };
    },
    addCompletedWorkout: (
      state,
      action: PayloadAction<CompletedWorkoutRecord>,
    ) => {
      const completedWorkouts = state.completedWorkouts ?? [];

      state.completedWorkouts = [action.payload, ...completedWorkouts].slice(
        0,
        200,
      );
    },
  },
});

export const {
  addCompletedWorkout,
  clearRoutineDay,
  clearTodayExercises,
  setTodayExercises,
  toggleRoutineExercise,
  toggleTodayExercise,
} = activitySlice.actions;
export default activitySlice.reducer;
