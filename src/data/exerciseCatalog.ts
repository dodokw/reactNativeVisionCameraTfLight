import { ImageSourcePropType } from 'react-native';

export type ExerciseCategory =
  | '전체'
  | '상체'
  | '하체'
  | '코어'
  | '전신'
  | '유산소'
  | '가슴'
  | '등'
  | '어깨'
  | '팔'
  | '복부'
  | '둔근'
  | '스트레칭';

export type ExerciseDifficulty = '초급' | '초중급' | '중급' | '상급';

export interface ExerciseItem {
  id: string;
  slug: string;
  name: string;
  category: ExerciseCategory;
  focus: string;
  duration: string;
  calories: string;
  difficulty: ExerciseDifficulty;
  image: ImageSourcePropType;
  accent: string;
}

export interface ServerExercise {
  id: string;
  slug: string;
  name: string;
  category_name: string;
  target_type: 'count' | 'time';
  beginner_goal?: string | null;
  intermediate_goal?: string | null;
  description: string;
  caution?: string | null;
  image_key?: string | null;
  met_value?: number | null;
}

type ExercisePresentation = {
  focus: string;
  duration: string;
  calories: string;
  difficulty: ExerciseDifficulty;
  imageKey: string;
  accent: string;
};

const placeholderImage = require('../assets/image/png/pushUps.png');

const exerciseImages: Record<string, ImageSourcePropType> = {
  burpee: require('../assets/image/premium/burpee.png'),
  'jumping-jack': require('../assets/image/premium/jumpingJacks.png'),
  lunge: require('../assets/image/premium/lunge.png'),
  plank: require('../assets/image/premium/plank.png'),
  'push-up': require('../assets/image/premium/pushUps.png'),
  'sit-up': require('../assets/image/premium/situps.png'),
  squat: require('../assets/image/premium/squat.png'),
};

const presentationBySlug: Record<string, ExercisePresentation> = {
  'push-up': {
    focus: '가슴 · 어깨 · 삼두',
    duration: '12분',
    calories: '90 kcal',
    difficulty: '중급',
    imageKey: 'push-up',
    accent: '#CCFF00',
  },
  'diamond-push-up': {
    focus: '가슴 안쪽 · 삼두근',
    duration: '10분',
    calories: '95 kcal',
    difficulty: '상급',
    imageKey: 'push-up',
    accent: '#FFD700',
  },
  'pike-push-up': {
    focus: '어깨 · 삼각근',
    duration: '10분',
    calories: '85 kcal',
    difficulty: '상급',
    imageKey: 'push-up',
    accent: '#A06EE1',
  },
  'lateral-raise': {
    focus: '측면 삼각근',
    duration: '10분',
    calories: '45 kcal',
    difficulty: '초급',
    imageKey: 'jumping-jack',
    accent: '#00CEC9',
  },
  'arm-circles': {
    focus: '어깨 회전근개 · 팔 라인',
    duration: '5분',
    calories: '30 kcal',
    difficulty: '초급',
    imageKey: 'jumping-jack',
    accent: '#74B9FF',
  },
  'tricep-dips': {
    focus: '삼두근 · 팔 뒷살',
    duration: '12분',
    calories: '70 kcal',
    difficulty: '중급',
    imageKey: 'push-up',
    accent: '#FAB1A0',
  },
  squat: {
    focus: '둔근 · 허벅지 · 밸런스',
    duration: '15분',
    calories: '110 kcal',
    difficulty: '중급',
    imageKey: 'squat',
    accent: '#FFB86B',
  },
  'sumo-squat': {
    focus: '허벅지 안쪽 · 엉덩이',
    duration: '12분',
    calories: '100 kcal',
    difficulty: '중급',
    imageKey: 'squat',
    accent: '#FF7675',
  },
  lunge: {
    focus: '하체 근력 · 균형 감각',
    duration: '12분',
    calories: '95 kcal',
    difficulty: '초중급',
    imageKey: 'lunge',
    accent: '#FF6B6B',
  },
  'side-lunge': {
    focus: '내전근 · 둔근 강화',
    duration: '10분',
    calories: '80 kcal',
    difficulty: '중급',
    imageKey: 'lunge',
    accent: '#55E6C1',
  },
  'glute-bridge': {
    focus: '힙업 · 후면 사슬',
    duration: '10분',
    calories: '60 kcal',
    difficulty: '초중급',
    imageKey: 'sit-up',
    accent: '#FD79A8',
  },
  'calf-raise': {
    focus: '종아리 근력',
    duration: '8분',
    calories: '40 kcal',
    difficulty: '초급',
    imageKey: 'squat',
    accent: '#B2BEC3',
  },
  'sit-up': {
    focus: '복부 · 코어 안정화',
    duration: '10분',
    calories: '70 kcal',
    difficulty: '초중급',
    imageKey: 'sit-up',
    accent: '#7AE7FF',
  },
  crunch: {
    focus: '상복부 강화',
    duration: '8분',
    calories: '50 kcal',
    difficulty: '초급',
    imageKey: 'sit-up',
    accent: '#81ECEC',
  },
  'leg-raise': {
    focus: '하복부 강화',
    duration: '8분',
    calories: '50 kcal',
    difficulty: '초중급',
    imageKey: 'sit-up',
    accent: '#A29BFE',
  },
  'russian-twist': {
    focus: '외복사근 · 허리 라인',
    duration: '10분',
    calories: '75 kcal',
    difficulty: '중급',
    imageKey: 'sit-up',
    accent: '#F97F51',
  },
  'plank-tap': {
    focus: '코어 안정성 · 어깨',
    duration: '8분',
    calories: '65 kcal',
    difficulty: '중급',
    imageKey: 'plank',
    accent: '#E17055',
  },
  'bicycle-crunch': {
    focus: '복부 전신 · 협응력',
    duration: '10분',
    calories: '90 kcal',
    difficulty: '중급',
    imageKey: 'sit-up',
    accent: '#55EFC4',
  },
  'flutter-kicks': {
    focus: '하복부 집중 강화',
    duration: '7분',
    calories: '55 kcal',
    difficulty: '중급',
    imageKey: 'sit-up',
    accent: '#6C5CE7',
  },
  'jumping-jack': {
    focus: '전신 유산소 · 체지방',
    duration: '10분',
    calories: '120 kcal',
    difficulty: '초급',
    imageKey: 'jumping-jack',
    accent: '#4ECDC4',
  },
  burpee: {
    focus: '심폐지구력 · 전신 근력',
    duration: '15분',
    calories: '200 kcal',
    difficulty: '상급',
    imageKey: 'burpee',
    accent: '#D63031',
  },
  'mountain-climber': {
    focus: '복부 · 유산소 · 전신',
    duration: '10분',
    calories: '130 kcal',
    difficulty: '중급',
    imageKey: 'plank',
    accent: '#FDCB6E',
  },
  'high-knees': {
    focus: '심박수 향상 · 하체 유연성',
    duration: '10분',
    calories: '110 kcal',
    difficulty: '초중급',
    imageKey: 'jumping-jack',
    accent: '#00B894',
  },
  'plank-jack': {
    focus: '코어 안정성 · 칼로리 연소',
    duration: '10분',
    calories: '105 kcal',
    difficulty: '중급',
    imageKey: 'plank',
    accent: '#0984E3',
  },
  skaters: {
    focus: '민첩성 · 하체 파워',
    duration: '12분',
    calories: '115 kcal',
    difficulty: '중급',
    imageKey: 'jumping-jack',
    accent: '#E84393',
  },
  superman: {
    focus: '척추기립근 · 후면부',
    duration: '8분',
    calories: '40 kcal',
    difficulty: '초중급',
    imageKey: 'plank',
    accent: '#636E72',
  },
  'bird-dog': {
    focus: '척추 안정화 · 균형',
    duration: '10분',
    calories: '45 kcal',
    difficulty: '초급',
    imageKey: 'plank',
    accent: '#2D3436',
  },
  'cat-cow': {
    focus: '척추 유연성 · 이완',
    duration: '5분',
    calories: '20 kcal',
    difficulty: '초급',
    imageKey: 'plank',
    accent: '#FFEAA7',
  },
  'standing-side-stretch': {
    focus: '복사근 이완 · 유연성',
    duration: '5분',
    calories: '15 kcal',
    difficulty: '초급',
    imageKey: 'jumping-jack',
    accent: '#55E6C1',
  },
  'cobra-stretch': {
    focus: '복부 이완 · 요추 유연성',
    duration: '5분',
    calories: '20 kcal',
    difficulty: '초급',
    imageKey: 'plank',
    accent: '#DFE6E9',
  },
};

const fallbackServerExercises: ServerExercise[] = [
  {
    id: 'push-up',
    slug: 'push-up',
    name: '팔굽혀펴기',
    category_name: '상체',
    target_type: 'count',
    description: '가슴, 어깨, 삼두근을 강화하는 대표 맨몸 운동입니다.',
    image_key: 'push-up',
  },
  {
    id: 'diamond-push-up',
    slug: 'diamond-push-up',
    name: '다이아몬드 푸쉬업',
    category_name: '가슴',
    target_type: 'count',
    description: '손을 좁게 모아 삼두와 가슴 안쪽 자극을 높이는 푸쉬업입니다.',
    image_key: 'push-up',
  },
  {
    id: 'pike-push-up',
    slug: 'pike-push-up',
    name: '파이크 푸쉬업',
    category_name: '어깨',
    target_type: 'count',
    description:
      '엉덩이를 높인 자세에서 어깨와 삼각근을 집중적으로 단련합니다.',
    image_key: 'push-up',
  },
  {
    id: 'lateral-raise',
    slug: 'lateral-raise',
    name: '사이드 레터럴 레이즈',
    category_name: '어깨',
    target_type: 'count',
    description: '팔을 옆으로 들어 측면 삼각근과 어깨 라인을 강화합니다.',
    image_key: 'jumping-jack',
  },
  {
    id: 'arm-circles',
    slug: 'arm-circles',
    name: '팔 돌리기',
    category_name: '팔',
    target_type: 'time',
    description: '가볍게 팔을 돌려 어깨 가동성과 팔 근지구력을 높입니다.',
    image_key: 'jumping-jack',
  },
  {
    id: 'tricep-dips',
    slug: 'tricep-dips',
    name: '의자 딥스',
    category_name: '팔',
    target_type: 'count',
    description: '의자나 벤치를 이용해 삼두근과 가슴 하부를 단련합니다.',
    image_key: 'push-up',
  },
  {
    id: 'squat',
    slug: 'squat',
    name: '스쿼트',
    category_name: '하체',
    target_type: 'count',
    description: '하체 전반과 코어 안정성을 함께 기르는 기본 운동입니다.',
    image_key: 'squat',
  },
  {
    id: 'sumo-squat',
    slug: 'sumo-squat',
    name: '와이드 스쿼트',
    category_name: '하체',
    target_type: 'count',
    description:
      '발 간격을 넓혀 허벅지 안쪽과 둔근 자극을 높이는 스쿼트입니다.',
    image_key: 'squat',
  },
  {
    id: 'lunge',
    slug: 'lunge',
    name: '런지',
    category_name: '하체',
    target_type: 'count',
    description: '하체 근력과 균형감을 함께 강화하는 운동입니다.',
    image_key: 'lunge',
  },
  {
    id: 'side-lunge',
    slug: 'side-lunge',
    name: '사이드 런지',
    category_name: '하체',
    target_type: 'count',
    description: '옆으로 이동하며 내전근과 둔근을 강화하는 런지 변형입니다.',
    image_key: 'lunge',
  },
  {
    id: 'glute-bridge',
    slug: 'glute-bridge',
    name: '글루트 브릿지',
    category_name: '둔근',
    target_type: 'count',
    description: '엉덩이를 들어 올려 둔근과 후면 사슬을 활성화합니다.',
    image_key: 'sit-up',
  },
  {
    id: 'calf-raise',
    slug: 'calf-raise',
    name: '카프 레이즈',
    category_name: '하체',
    target_type: 'count',
    description: '발뒤꿈치를 들어 종아리 근력과 발목 안정성을 높입니다.',
    image_key: 'squat',
  },
  {
    id: 'sit-up',
    slug: 'sit-up',
    name: '윗몸일으키기',
    category_name: '코어',
    target_type: 'count',
    description: '복직근을 중심으로 코어를 강화하는 운동입니다.',
    image_key: 'sit-up',
  },
  {
    id: 'crunch',
    slug: 'crunch',
    name: '크런치',
    category_name: '복부',
    target_type: 'count',
    description: '상체를 짧게 말아 올려 상복부를 집중적으로 자극합니다.',
    image_key: 'sit-up',
  },
  {
    id: 'leg-raise',
    slug: 'leg-raise',
    name: '레그 레이즈',
    category_name: '복부',
    target_type: 'count',
    description: '다리를 들어 올려 하복부와 골반 안정성을 강화합니다.',
    image_key: 'sit-up',
  },
  {
    id: 'russian-twist',
    slug: 'russian-twist',
    name: '러시안 트위스트',
    category_name: '코어',
    target_type: 'count',
    description: '몸통을 좌우로 회전하며 외복사근과 허리 라인을 단련합니다.',
    image_key: 'sit-up',
  },
  {
    id: 'plank-tap',
    slug: 'plank-tap',
    name: '플랭크 숄더 탭',
    category_name: '코어',
    target_type: 'count',
    description: '플랭크 자세에서 어깨를 터치해 코어 안정성을 높입니다.',
    image_key: 'plank',
  },
  {
    id: 'bicycle-crunch',
    slug: 'bicycle-crunch',
    name: '바이시클 크런치',
    category_name: '복부',
    target_type: 'count',
    description: '팔꿈치와 반대 무릎을 교차해 복부 전반과 협응력을 강화합니다.',
    image_key: 'sit-up',
  },
  {
    id: 'flutter-kicks',
    slug: 'flutter-kicks',
    name: '플러터 킥',
    category_name: '코어',
    target_type: 'time',
    description: '다리를 작게 교차하며 하복부를 집중적으로 단련합니다.',
    image_key: 'sit-up',
  },
  {
    id: 'jumping-jack',
    slug: 'jumping-jack',
    name: '팔벌려뛰기',
    category_name: '유산소',
    target_type: 'count',
    description:
      '전신을 리듬 있게 움직여 심박수와 체온을 올리는 유산소 운동입니다.',
    image_key: 'jumping-jack',
  },
  {
    id: 'burpee',
    slug: 'burpee',
    name: '버피 테스트',
    category_name: '전신',
    target_type: 'count',
    description: '전신 근력과 심폐지구력을 동시에 사용하는 고강도 운동입니다.',
    image_key: 'burpee',
  },
  {
    id: 'mountain-climber',
    slug: 'mountain-climber',
    name: '마운틴 클라이머',
    category_name: '전신',
    target_type: 'count',
    description: '플랭크 자세에서 무릎을 번갈아 당겨 복부와 심폐를 자극합니다.',
    image_key: 'plank',
  },
  {
    id: 'high-knees',
    slug: 'high-knees',
    name: '제자리 높이 뛰기',
    category_name: '유산소',
    target_type: 'time',
    description: '무릎을 높이 들어 올리며 심박수와 하체 탄성을 끌어올립니다.',
    image_key: 'jumping-jack',
  },
  {
    id: 'plank-jack',
    slug: 'plank-jack',
    name: '플랭크 잭',
    category_name: '코어',
    target_type: 'count',
    description:
      '플랭크 자세에서 다리를 벌리고 모아 코어와 유산소 자극을 더합니다.',
    image_key: 'plank',
  },
  {
    id: 'skaters',
    slug: 'skaters',
    name: '스케이터 홉',
    category_name: '유산소',
    target_type: 'count',
    description: '좌우로 점프하며 민첩성과 하체 파워를 강화합니다.',
    image_key: 'jumping-jack',
  },
  {
    id: 'superman',
    slug: 'superman',
    name: '슈퍼맨',
    category_name: '등',
    target_type: 'count',
    description:
      '엎드린 자세에서 팔다리를 들어 후면부와 척추기립근을 강화합니다.',
    image_key: 'plank',
  },
  {
    id: 'bird-dog',
    slug: 'bird-dog',
    name: '버드독',
    category_name: '코어',
    target_type: 'count',
    description: '반대쪽 팔과 다리를 뻗어 척추 안정화와 균형감을 기릅니다.',
    image_key: 'plank',
  },
  {
    id: 'cat-cow',
    slug: 'cat-cow',
    name: '캣카우 스트레칭',
    category_name: '스트레칭',
    target_type: 'time',
    description: '척추를 부드럽게 굽히고 펴며 등과 허리를 이완합니다.',
    image_key: 'plank',
  },
  {
    id: 'standing-side-stretch',
    slug: 'standing-side-stretch',
    name: '옆구리 늘리기',
    category_name: '스트레칭',
    target_type: 'time',
    description: '서서 옆구리를 늘려 복사근과 몸통 측면을 이완합니다.',
    image_key: 'jumping-jack',
  },
  {
    id: 'cobra-stretch',
    slug: 'cobra-stretch',
    name: '코브라 자세',
    category_name: '스트레칭',
    target_type: 'time',
    description: '상체를 들어 복부와 요추 주변을 부드럽게 이완합니다.',
    image_key: 'plank',
  },
];

const isExerciseCategory = (value: string): value is ExerciseCategory => {
  return exerciseCategories.includes(value as ExerciseCategory);
};

export const exerciseCategories: ExerciseCategory[] = [
  '전체',
  '상체',
  '하체',
  '코어',
  '전신',
  '유산소',
  '가슴',
  '등',
  '어깨',
  '팔',
  '복부',
  '둔근',
  '스트레칭',
];

export function buildExerciseItem(
  serverExercise: ServerExercise,
): ExerciseItem {
  const presentation = presentationBySlug[serverExercise.slug];
  const imageKey =
    serverExercise.image_key || presentation?.imageKey || serverExercise.slug;

  return {
    id: serverExercise.slug,
    slug: serverExercise.slug,
    name: serverExercise.name,
    category: isExerciseCategory(serverExercise.category_name)
      ? serverExercise.category_name
      : '전신',
    focus: presentation?.focus || serverExercise.description,
    duration: presentation?.duration || '10분',
    calories:
      presentation?.calories ||
      (serverExercise.met_value
        ? `${Math.round(serverExercise.met_value * 12)} kcal`
        : '60 kcal'),
    difficulty: presentation?.difficulty || '초급',
    image:
      exerciseImages[imageKey] ||
      exerciseImages[serverExercise.slug] ||
      placeholderImage,
    accent: presentation?.accent || '#CCFF00',
  };
}

export const fallbackExercises = fallbackServerExercises.map(serverExercise =>
  buildExerciseItem(serverExercise),
);
