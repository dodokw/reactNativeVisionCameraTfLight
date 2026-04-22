import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import styled from 'styled-components/native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../tools/Colors';
import { useModel } from '../contexts/ModelContext';
import { RootState } from '../store';
import { useStepCounter } from '../hooks/useStepCounter';
import { exerciseApi } from '../api';
import {
  ExerciseCategory,
  ExerciseItem as CatalogExerciseItem,
  buildExerciseItem,
  exerciseCategories,
  fallbackExercises,
} from '../data/exerciseCatalog';
import { RootStackNavigation } from '../navigation/types';
import {
  RoutineDayKey,
  WeeklyRoutine,
  setTodayExercises,
} from '../store/slices/activitySlice';
import {
  calculateCompletedWorkoutCalories,
  calculateCompletedWorkoutMinutes,
  calculateStepCalories,
  formatCalories,
  isToday,
} from '../utils/activityCalories';

const { width } = Dimensions.get('window');
const KINETIC_COLORS = Colors.kinetic;
const EMPTY_COMPLETED_WORKOUTS: RootState['activity']['completedWorkouts'] = [];
const EMPTY_WEEKLY_ROUTINE: WeeklyRoutine = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
};

const Container = styled.View`
  flex: 1;
  background-color: ${KINETIC_COLORS.background};
`;

const Header = styled.View`
  padding: 20px 24px 24px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const UserInfo = styled.View``;

const WelcomeText = styled.Text`
  font-size: 16px;
  color: ${KINETIC_COLORS.onSurfaceVariant};
  font-family: 'Manrope';
`;

const UserName = styled.Text`
  font-size: 24px;
  font-weight: 800;
  color: ${KINETIC_COLORS.onSurface};
  font-family: 'Space Grotesk';
`;

const ProfilePicContainer = styled.TouchableOpacity`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  border-width: 2px;
  border-color: ${KINETIC_COLORS.primary};
  padding: 2px;
`;

const ProfilePic = styled.Image`
  width: 100%;
  height: 100%;
  border-radius: 21px;
`;

const SectionTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: ${KINETIC_COLORS.onSurface};
  margin: 24px 24px 16px;
  font-family: 'Space Grotesk';
`;

const CarouselCard = styled(Animated.View)`
  width: ${width - 48}px;
  height: 200px;
  margin-left: 24px;
  border-radius: 24px;
  overflow: hidden;
  background-color: ${KINETIC_COLORS.surfaceVariant};
`;

const CarouselImage = styled.ImageBackground`
  flex: 1;
  padding: 24px;
  justify-content: flex-end;
`;

const CarouselTitle = styled.Text`
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 8px;
  font-family: 'Space Grotesk';
`;

const CarouselSubtitle = styled.Text`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 14px;
  font-family: 'Manrope';
`;

const StartButton = styled.TouchableOpacity`
  background-color: ${KINETIC_COLORS.primary};
  padding: 10px 20px;
  border-radius: 20px;
  align-self: flex-start;
`;

const StartButtonText = styled.Text`
  color: #000;
  font-weight: 700;
  font-size: 14px;
`;

const StatsRow = styled.View`
  flex-direction: row;
  padding: 0 24px;
  justify-content: space-between;
  margin-top: 24px;
`;

const StatCard = styled(Animated.View)`
  width: ${(width - 72) / 3}px;
  padding: 16px;
  background-color: ${KINETIC_COLORS.surfaceVariant};
  border-radius: 16px;
  align-items: center;
`;

const StatValue = styled.Text`
  font-size: 18px;
  font-weight: 800;
  color: ${KINETIC_COLORS.primary};
  font-family: 'Space Grotesk';
`;

const StatLabel = styled.Text`
  font-size: 12px;
  color: ${KINETIC_COLORS.onSurfaceVariant};
  margin-top: 4px;
  font-family: 'Manrope';
`;

const SparklineWrap = styled.View`
  margin-top: 8px;
`;

const ExerciseList = styled.View`
  padding: 0 24px 40px;
`;

const RecommendedStartButton = styled.TouchableOpacity`
  background-color: ${KINETIC_COLORS.primary};
  padding: 14px 20px;
  border-radius: 16px;
  align-items: center;
  margin-bottom: 16px;
`;

const RecommendedStartButtonText = styled.Text`
  color: #000;
  font-size: 15px;
  font-weight: 800;
  font-family: 'Space Grotesk';
`;

const ExerciseItem = styled(Animated.View)`
  flex-direction: row;
  background-color: ${KINETIC_COLORS.surfaceVariant};
  padding: 12px;
  border-radius: 16px;
  align-items: center;
  margin-bottom: 12px;
`;

const ExerciseThumb = styled.View`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const ExerciseImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const ExerciseInfo = styled.View`
  flex: 1;
  margin-left: 16px;
`;

const ExerciseName = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: ${KINETIC_COLORS.onSurface};
  font-family: 'Space Grotesk';
`;

const ExerciseMeta = styled.Text`
  font-size: 12px;
  color: ${KINETIC_COLORS.onSurfaceVariant};
  margin-top: 4px;
`;

const StatusBadge = styled.View<{ active: boolean }>`
  padding: 4px 12px;
  border-radius: 12px;
  background-color: ${props =>
    props.active ? KINETIC_COLORS.primary : 'rgba(255, 72, 72, 0.2)'};
`;

const StatusText = styled.Text<{ active: boolean }>`
  font-size: 10px;
  font-weight: 800;
  color: ${props => (props.active ? '#000' : '#ff4848')};
`;

const RecommendationTag = styled.View<{ accent: string }>`
  padding: 4px 10px;
  border-radius: 12px;
  background-color: ${props => `${props.accent}26`};
`;

const RecommendationTagText = styled.Text<{ accent: string }>`
  font-size: 10px;
  font-weight: 800;
  color: ${props => props.accent};
`;

type RecommendedExercise = CatalogExerciseItem & {
  reason: string;
  tag: string;
};

const recentWorkoutExerciseIds = [
  'squat',
  'lunge',
  'sit-up',
  'plank',
  'push-up',
];

const recommendationCategories = exerciseCategories.filter(
  category => category !== '전체',
);

const exerciseNameTranslations: Record<string, string> = {
  'push-up': '팔굽혀펴기',
  'diamond-push-up': '다이아몬드 푸쉬업',
  'pike-push-up': '파이크 푸쉬업',
  'lateral-raise': '사이드 레터럴 레이즈',
  'arm-circles': '팔 돌리기',
  'tricep-dips': '의자 딥스',
  squat: '스쿼트',
  'sumo-squat': '와이드 스쿼트',
  lunge: '런지',
  'side-lunge': '사이드 런지',
  'glute-bridge': '글루트 브릿지',
  'calf-raise': '카프 레이즈',
  'sit-up': '윗몸일으키기',
  crunch: '크런치',
  'leg-raise': '레그 레이즈',
  'russian-twist': '러시안 트위스트',
  'plank-tap': '플랭크 숄더 탭',
  'bicycle-crunch': '바이시클 크런치',
  'flutter-kicks': '플러터 킥',
  'jumping-jack': '팔벌려뛰기',
  burpee: '버피 테스트',
  'mountain-climber': '마운틴 클라이머',
  'high-knees': '제자리 높이 뛰기',
  'plank-jack': '플랭크 잭',
  skaters: '스케이터 홉',
  superman: '슈퍼맨',
  'bird-dog': '버드독',
  'cat-cow': '캣카우 스트레칭',
  'standing-side-stretch': '옆구리 늘리기',
  'cobra-stretch': '코브라 자세',
};

const displayExerciseName = (exercise: CatalogExerciseItem) => {
  return (
    exerciseNameTranslations[exercise.slug] ||
    exerciseNameTranslations[exercise.id] ||
    exercise.name
  );
};

const getStepCounterValue = (
  status: ReturnType<typeof useStepCounter>['status'],
  steps: number,
) => {
  switch (status) {
    case 'ready':
      return steps.toLocaleString();
    case 'unavailable':
      return '미지원';
    case 'denied':
      return '권한 거부';
    case 'error':
      return '오류';
    case 'idle':
    default:
      return '확인 중';
  }
};

const getDailySeed = () => {
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  ].join('-');

  return todayKey
    .split('')
    .reduce((seed, char) => seed + char.charCodeAt(0), 0);
};

const getTodayRoutineDayKey = (): RoutineDayKey => {
  const day = new Date().getDay();
  const dayKeys: RoutineDayKey[] = [
    'sun',
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
  ];

  return dayKeys[day];
};

const seededSortValue = (value: string, seed: number) => {
  return value.split('').reduce((result, char) => {
    return (result * 31 + char.charCodeAt(0) + seed) % 100000;
  }, seed);
};

const getExerciseKey = (exercise: CatalogExerciseItem) =>
  exercise.slug || exercise.id;

const buildRecommendations = (
  exercises: CatalogExerciseItem[],
): RecommendedExercise[] => {
  const seed = getDailySeed();
  const recentIds = new Set(recentWorkoutExerciseIds);
  const selectedIds = new Set<string>();
  const recentExercises = exercises.filter(exercise =>
    recentIds.has(getExerciseKey(exercise)),
  );

  const categoryCounts = recommendationCategories.reduce((counts, category) => {
    counts[category] = 0;
    return counts;
  }, {} as Record<Exclude<ExerciseCategory, '전체'>, number>);

  recentExercises.forEach(exercise => {
    if (
      exercise.category !== '전체' &&
      categoryCounts[exercise.category] !== undefined
    ) {
      categoryCounts[exercise.category] += 1;
    }
  });

  const sortedLeastTrainedCategories = [...recommendationCategories].sort(
    (a, b) =>
      categoryCounts[a] - categoryCounts[b] ||
      seededSortValue(a, seed) - seededSortValue(b, seed),
  );
  const sortedMostTrainedCategories = [...recommendationCategories].sort(
    (a, b) =>
      categoryCounts[b] - categoryCounts[a] ||
      seededSortValue(a, seed + 7) - seededSortValue(b, seed + 7),
  );

  const pickExercise = (
    candidates: CatalogExerciseItem[],
  ): CatalogExerciseItem | undefined => {
    return [...candidates]
      .sort(
        (a, b) =>
          seededSortValue(getExerciseKey(a), seed) -
          seededSortValue(getExerciseKey(b), seed),
      )
      .find(exercise => !selectedIds.has(getExerciseKey(exercise)));
  };

  const addRecommendation = (
    exercise: CatalogExerciseItem | undefined,
    tag: string,
    reason: string,
    recommendations: RecommendedExercise[],
  ) => {
    if (!exercise) {
      return;
    }

    selectedIds.add(getExerciseKey(exercise));
    recommendations.push({ ...exercise, tag, reason });
  };

  const recommendations: RecommendedExercise[] = [];
  const balanceCategory = sortedLeastTrainedCategories.find(category =>
    exercises.some(
      exercise =>
        exercise.category === category &&
        !recentIds.has(getExerciseKey(exercise)),
    ),
  );
  const favoriteCategory = sortedMostTrainedCategories.find(category =>
    exercises.some(
      exercise =>
        exercise.category === category &&
        !recentIds.has(getExerciseKey(exercise)),
    ),
  );

  addRecommendation(
    pickExercise(
      exercises.filter(
        exercise =>
          exercise.category === balanceCategory &&
          !recentIds.has(getExerciseKey(exercise)),
      ),
    ),
    '균형',
    balanceCategory
      ? `최근 ${balanceCategory} 운동이 적었어요`
      : '오늘의 균형 루틴이에요',
    recommendations,
  );

  addRecommendation(
    pickExercise(
      exercises.filter(
        exercise =>
          exercise.category === favoriteCategory &&
          !recentIds.has(getExerciseKey(exercise)),
      ),
    ),
    '변화',
    favoriteCategory
      ? `자주 한 ${favoriteCategory} 루틴의 다른 자극`
      : '익숙한 루틴에 변화를 줘요',
    recommendations,
  );

  addRecommendation(
    pickExercise(
      exercises.filter(exercise => !recentIds.has(getExerciseKey(exercise))),
    ),
    '새로움',
    '최근 기록에 없는 운동이에요',
    recommendations,
  );

  if (recommendations.length < 3) {
    [...exercises]
      .sort(
        (a, b) =>
          seededSortValue(getExerciseKey(a), seed + 13) -
          seededSortValue(getExerciseKey(b), seed + 13),
      )
      .forEach(exercise => {
        if (
          recommendations.length >= 3 ||
          selectedIds.has(getExerciseKey(exercise))
        ) {
          return;
        }

        selectedIds.add(getExerciseKey(exercise));
        recommendations.push({
          ...exercise,
          tag: '오늘',
          reason: '오늘 가볍게 이어가기 좋아요',
        });
      });
  }

  return recommendations.slice(0, 3);
};

export const HomeScreen = () => {
  const navigation = useNavigation<RootStackNavigation>();
  const dispatch = useDispatch();
  const { state: modelState } = useModel();
  const { todaySteps, status: stepCounterStatus } = useStepCounter();
  const [exerciseCatalog, setExerciseCatalog] =
    useState<CatalogExerciseItem[]>(fallbackExercises);
  const userName = useSelector((state: RootState) => {
    return (
      state.user.profile?.nickname ||
      state.user.user?.user_metadata?.nickname ||
      state.user.user?.email?.split('@')[0] ||
      '사용자'
    );
  });
  const completedWorkouts = useSelector(
    (state: RootState) =>
      state.activity.completedWorkouts ?? EMPTY_COMPLETED_WORKOUTS,
  );
  const weeklyRoutine = useSelector(
    (state: RootState) => state.activity.weeklyRoutine ?? EMPTY_WEEKLY_ROUTINE,
  );

  useEffect(() => {
    let mounted = true;

    const loadExercises = async () => {
      try {
        const serverExercises = await exerciseApi.getExercises();

        if (mounted && serverExercises.length > 0) {
          setExerciseCatalog(serverExercises.map(buildExerciseItem));
        }
      } catch {
        if (mounted) {
          setExerciseCatalog(fallbackExercises);
        }
      }
    };

    loadExercises();

    return () => {
      mounted = false;
    };
  }, []);

  const recommendedExercises = useMemo(
    () => buildRecommendations(exerciseCatalog),
    [exerciseCatalog],
  );
  const todayCompletedWorkouts = useMemo(
    () => completedWorkouts.filter(record => isToday(record.completedAt)),
    [completedWorkouts],
  );
  const stepCalories = calculateStepCalories(todaySteps);
  const exerciseCalories = calculateCompletedWorkoutCalories(
    todayCompletedWorkouts,
  );
  const totalCalories = stepCalories + exerciseCalories;
  const workoutMinutes = calculateCompletedWorkoutMinutes(
    todayCompletedWorkouts,
  );
  const todayRoutineExerciseIds = weeklyRoutine[getTodayRoutineDayKey()] ?? [];
  const todayRoutineExercises = exerciseCatalog.filter(exercise =>
    todayRoutineExerciseIds.includes(exercise.id),
  );
  const todayRoutineTitle =
    todayRoutineExercises.length > 0
      ? `${displayExerciseName(todayRoutineExercises[0])}${
          todayRoutineExercises.length > 1
            ? ` 외 ${todayRoutineExercises.length - 1}개`
            : ''
        }`
      : '오늘 루틴을 설정해보세요';
  const todayRoutineSummary =
    todayRoutineExercises.length > 0
      ? todayRoutineExercises.map(displayExerciseName).join(', ')
      : '요일별로 운동을 담으면 이곳에서 바로 시작할 수 있어요';
  const startTodayRoutine = () => {
    if (todayRoutineExerciseIds.length === 0) {
      navigation.navigate('TabNavigation', { screen: 'RoutineCreateScreen' });
      return;
    }

    dispatch(setTodayExercises(todayRoutineExerciseIds));
    navigation.navigate('NoTabNavigation', {
      screen: 'Camera',
      params: { exerciseIds: todayRoutineExerciseIds },
    });
  };
  const startRecommendedWorkout = () => {
    const recommendedExerciseIds = recommendedExercises.map(
      exercise => exercise.id,
    );

    dispatch(setTodayExercises(recommendedExerciseIds));
    navigation.navigate('NoTabNavigation', {
      screen: 'Camera',
      params: { exerciseIds: recommendedExerciseIds },
    });
  };

  const stats = [
    {
      label: '걸음',
      value: getStepCounterValue(stepCounterStatus, todaySteps),
      delay: 200,
    },
    { label: '칼로리', value: formatCalories(totalCalories), delay: 400 },
    { label: '운동 시간', value: workoutMinutes.toLocaleString(), delay: 600 },
  ];

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <Header>
        <UserInfo>
          <WelcomeText>다시 오셨네요,</WelcomeText>
          <UserName>{userName}</UserName>
        </UserInfo>
        <ProfilePicContainer>
          <ProfilePic source={require('../assets/images/user_avatar.png')} />
        </ProfilePicContainer>
      </Header>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Workout Carousel */}
        <SectionTitle>오늘의 루틴</SectionTitle>
        <CarouselCard entering={FadeInDown.duration(800).springify()}>
          <CarouselImage
            source={require('../assets/images/fitness_bg.png')}
            resizeMode="cover"
          >
            <CarouselTitle>{todayRoutineTitle}</CarouselTitle>
            <CarouselSubtitle>{todayRoutineSummary}</CarouselSubtitle>
            <StartButton activeOpacity={0.8} onPress={startTodayRoutine}>
              <StartButtonText>
                {todayRoutineExerciseIds.length > 0
                  ? '루틴 시작'
                  : '루틴 만들기'}
              </StartButtonText>
            </StartButton>
          </CarouselImage>
        </CarouselCard>

        {/* Stats Row */}
        <StatsRow>
          {stats.map(stat => (
            <StatCard
              key={stat.label}
              entering={FadeInDown.delay(stat.delay).duration(600).springify()}
            >
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
              {/* Micro-sparkline SVG placeholder */}
              <SparklineWrap>
                <Svg width="40" height="15">
                  <Path
                    d="M0 10 L8 5 L16 12 L24 2 L32 8 L40 5"
                    fill="none"
                    stroke={KINETIC_COLORS.primary}
                    strokeWidth="2"
                  />
                </Svg>
              </SparklineWrap>
            </StatCard>
          ))}
        </StatsRow>

        {/* Model Status - Integrated into Dashboard */}
        <SectionTitle>AI 코치</SectionTitle>
        <ExerciseItem entering={FadeInRight.duration(800)}>
          <ExerciseThumb>
            <Svg width="30" height="30" viewBox="0 0 24 24">
              <Circle
                cx="12"
                cy="12"
                r="10"
                stroke={KINETIC_COLORS.primary}
                strokeWidth="2"
                fill="none"
              />
              <Path
                d="M12 8v4l3 3"
                stroke={KINETIC_COLORS.primary}
                strokeWidth="2"
              />
            </Svg>
          </ExerciseThumb>
          <ExerciseInfo>
            <ExerciseName>TFLite 비전 코어</ExerciseName>
            <ExerciseMeta>실시간 자세 추적 실행 중</ExerciseMeta>
          </ExerciseInfo>
          <StatusBadge active={modelState === 'loaded'}>
            <StatusText active={modelState === 'loaded'}>
              {modelState === 'loaded' ? '실행 중' : '준비됨'}
            </StatusText>
          </StatusBadge>
        </ExerciseItem>

        {/* Recommended List */}
        <SectionTitle>오늘의 추천 운동</SectionTitle>
        <ExerciseList>
          <RecommendedStartButton
            activeOpacity={0.85}
            onPress={startRecommendedWorkout}
          >
            <RecommendedStartButtonText>
              오늘의 추천 운동 시작
            </RecommendedStartButtonText>
          </RecommendedStartButton>
          {recommendedExercises.map((ex, index) => (
            <ExerciseItem
              key={ex.name}
              entering={FadeInDown.delay(800 + index * 100).duration(600)}
            >
              <ExerciseThumb>
                <ExerciseImage source={ex.image} resizeMode="cover" />
              </ExerciseThumb>
              <ExerciseInfo>
                <ExerciseName>{displayExerciseName(ex)}</ExerciseName>
                <ExerciseMeta>
                  {ex.duration} • {ex.difficulty} • {ex.reason}
                </ExerciseMeta>
              </ExerciseInfo>
              <TouchableOpacity activeOpacity={0.8}>
                <RecommendationTag accent={ex.accent}>
                  <RecommendationTagText accent={ex.accent}>
                    {ex.tag}
                  </RecommendationTagText>
                </RecommendationTag>
              </TouchableOpacity>
            </ExerciseItem>
          ))}
        </ExerciseList>
      </ScrollView>
    </Container>
  );
};

export default HomeScreen;
