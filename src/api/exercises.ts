import { apiClient } from './client';
import { ServerExercise } from '../data/exerciseCatalog';

type ExerciseRow = {
  id: string;
  slug: string;
  name: string;
  target_type: ServerExercise['target_type'];
  beginner_goal?: string | null;
  intermediate_goal?: string | null;
  description: string;
  caution?: string | null;
  image_key?: string | null;
  met_value?: number | null;
  exercise_categories?: {
    name?: string | null;
  } | null;
};

const toServerExercise = (row: ExerciseRow): ServerExercise => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  category_name: row.exercise_categories?.name || '전신',
  target_type: row.target_type,
  beginner_goal: row.beginner_goal,
  intermediate_goal: row.intermediate_goal,
  description: row.description,
  caution: row.caution,
  image_key: row.image_key,
  met_value: row.met_value,
});

export const exerciseApi = {
  async getExercises() {
    const response = await apiClient.get<ExerciseRow[]>('/rest/v1/exercises', {
      params: {
        select:
          'id,slug,name,target_type,beginner_goal,intermediate_goal,description,caution,image_key,met_value,exercise_categories(name)',
        is_active: 'eq.true',
        order: 'created_at.asc',
      },
    });

    return response.data.map(toServerExercise);
  },
};
