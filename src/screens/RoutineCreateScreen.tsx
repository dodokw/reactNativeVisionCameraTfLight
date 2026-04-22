import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components/native';
import { getApiErrorMessage } from '../api/client';
import { exerciseApi } from '../api/exercises';
import {
  ExerciseCategory,
  ExerciseItem,
  buildExerciseItem,
  exerciseCategories,
  fallbackExercises,
} from '../data/exerciseCatalog';
import { TabStackNavigation } from '../navigation/types';
import { RootState } from '../store';
import {
  RoutineDayKey,
  clearRoutineDay,
  toggleRoutineExercise,
} from '../store/slices/activitySlice';
import { Colors } from '../tools/Colors';
import { TextB, TextR } from '../tools/fonts';

const KINETIC_COLORS = Colors.kinetic;
const categories = exerciseCategories;

const routineDays: Array<{
  key: RoutineDayKey;
  label: string;
  fullLabel: string;
}> = [
  { key: 'mon', label: '월', fullLabel: '월요일' },
  { key: 'tue', label: '화', fullLabel: '화요일' },
  { key: 'wed', label: '수', fullLabel: '수요일' },
  { key: 'thu', label: '목', fullLabel: '목요일' },
  { key: 'fri', label: '금', fullLabel: '금요일' },
  { key: 'sat', label: '토', fullLabel: '토요일' },
  { key: 'sun', label: '일', fullLabel: '일요일' },
];

const EMPTY_ROUTINE: RootState['activity']['weeklyRoutine'] = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
};

const getCurrentRoutineDay = (): RoutineDayKey => {
  const dayKeys: RoutineDayKey[] = [
    'sun',
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
  ];

  return dayKeys[new Date().getDay()];
};

export const RoutineCreateScreen = () => {
  const navigation = useNavigation<TabStackNavigation>();
  const dispatch = useDispatch();
  const weeklyRoutine = useSelector(
    (state: RootState) => state.activity.weeklyRoutine ?? EMPTY_ROUTINE,
  );
  const [selectedDay, setSelectedDay] =
    useState<RoutineDayKey>(getCurrentRoutineDay);
  const [exercises, setExercises] = useState<ExerciseItem[]>(fallbackExercises);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<ExerciseCategory>('전체');

  useEffect(() => {
    let mounted = true;

    const loadExercises = async () => {
      try {
        const serverExercises = await exerciseApi.getExercises();

        if (!mounted) {
          return;
        }

        if (serverExercises.length > 0) {
          setExercises(serverExercises.map(buildExerciseItem));
        }

        setCatalogError(null);
      } catch (error) {
        if (mounted) {
          setCatalogError(getApiErrorMessage(error));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadExercises();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedExerciseIds = useMemo(
    () => weeklyRoutine[selectedDay] ?? [],
    [selectedDay, weeklyRoutine],
  );
  const selectedDayLabel =
    routineDays.find(day => day.key === selectedDay)?.fullLabel ?? '월요일';
  const selectedExerciseNames = useMemo(
    () =>
      exercises
        .filter(exercise => selectedExerciseIds.includes(exercise.id))
        .map(exercise => exercise.name),
    [exercises, selectedExerciseIds],
  );
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      return (
        selectedCategory === '전체' || exercise.category === selectedCategory
      );
    });
  }, [exercises, selectedCategory]);

  const toggleExercise = (exerciseId: string) => {
    dispatch(toggleRoutineExercise({ day: selectedDay, exerciseId }));
  };

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <TopBar>
        <BackButton activeOpacity={0.8} onPress={() => navigation.goBack()}>
          <TextB size={24} color={KINETIC_COLORS.primary}>
            ‹
          </TextB>
        </BackButton>
        <TitleWrap>
          <TextR size={12} color={KINETIC_COLORS.primary}>
            ROUTINE
          </TextR>
          <TextB size={24} color={KINETIC_COLORS.onSurface}>
            루틴 생성
          </TextB>
        </TitleWrap>
      </TopBar>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <IntroCard>
          <TextB size={22} color={KINETIC_COLORS.onSurface}>
            요일마다 다른 운동을 담아두세요
          </TextB>
          <IntroDescription>
            <TextR size={14} color={KINETIC_COLORS.onSurfaceVariant}>
              홈의 오늘의 루틴은 현재 요일에 담긴 운동으로 시작됩니다
            </TextR>
          </IntroDescription>
        </IntroCard>

        <DayRow>
          {routineDays.map(day => {
            const active = selectedDay === day.key;
            const count = weeklyRoutine[day.key]?.length ?? 0;

            return (
              <DayChip
                key={day.key}
                active={active}
                activeOpacity={0.84}
                onPress={() => setSelectedDay(day.key)}
              >
                <TextB
                  size={14}
                  color={active ? '#000000' : KINETIC_COLORS.onSurface}
                >
                  {day.label}
                </TextB>
                <DayCount active={active}>
                  <TextB
                    size={10}
                    color={active ? KINETIC_COLORS.primary : '#000000'}
                  >
                    {count}
                  </TextB>
                </DayCount>
              </DayChip>
            );
          })}
        </DayRow>

        <SelectedSummary>
          <SummaryTop>
            <View>
              <TextR size={12} color={KINETIC_COLORS.primary}>
                {selectedDayLabel}
              </TextR>
              <SummaryTitle>
                <TextB size={20} color={KINETIC_COLORS.onSurface}>
                  {selectedExerciseIds.length}개 운동
                </TextB>
              </SummaryTitle>
            </View>
            <ClearButton
              disabled={selectedExerciseIds.length === 0}
              activeOpacity={0.85}
              onPress={() => dispatch(clearRoutineDay(selectedDay))}
            >
              <TextB
                size={12}
                color={
                  selectedExerciseIds.length === 0
                    ? KINETIC_COLORS.onSurfaceVariant
                    : '#000000'
                }
              >
                비우기
              </TextB>
            </ClearButton>
          </SummaryTop>
          <SelectedNames>
            {selectedExerciseNames.length === 0 ? (
              <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                아래 운동을 눌러 이 요일의 루틴에 담아보세요
              </TextR>
            ) : (
              selectedExerciseNames.map(name => (
                <SelectedPill key={name}>
                  <TextB size={12} color="#000000">
                    {name}
                  </TextB>
                </SelectedPill>
              ))
            )}
          </SelectedNames>
        </SelectedSummary>

        <CategoryHeader>
          <View>
            <TextB size={20} color={KINETIC_COLORS.onSurface}>
              운동 찾기
            </TextB>
            <CategoryDescription>
              <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                부위별로 골라 {selectedDayLabel} 루틴에 담아보세요
              </TextR>
            </CategoryDescription>
          </View>
          <VisibleCount>
            <TextB size={13} color="#000000">
              {filteredExercises.length}
            </TextB>
          </VisibleCount>
        </CategoryHeader>

        <CategoryScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          {categories.map(category => {
            const active = selectedCategory === category;

            return (
              <CategoryChip
                key={category}
                active={active}
                activeOpacity={0.85}
                onPress={() => setSelectedCategory(category)}
              >
                <TextB
                  size={13}
                  color={active ? '#000000' : KINETIC_COLORS.onSurface}
                >
                  {category}
                </TextB>
              </CategoryChip>
            );
          })}
        </CategoryScroll>

        {(isLoading || catalogError) && (
          <CatalogState>
            {isLoading ? (
              <ActivityIndicator color={KINETIC_COLORS.primary} />
            ) : null}
            <StateText>
              <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                {isLoading
                  ? '운동 목록을 불러오는 중입니다'
                  : '기본 운동 목록으로 루틴을 만들 수 있어요'}
              </TextR>
            </StateText>
          </CatalogState>
        )}

        <ExerciseList>
          {filteredExercises.map(exercise => {
            const selected = selectedExerciseIds.includes(exercise.id);

            return (
              <ExerciseRow
                key={exercise.id}
                activeOpacity={0.88}
                onPress={() => toggleExercise(exercise.id)}
              >
                <ExerciseThumb style={{ borderColor: `${exercise.accent}55` }}>
                  <ExerciseImage source={exercise.image} resizeMode="cover" />
                </ExerciseThumb>
                <ExerciseBody>
                  <TextB size={17} color={KINETIC_COLORS.onSurface}>
                    {exercise.name}
                  </TextB>
                  <ExerciseMeta>
                    <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                      {exercise.focus}
                    </TextR>
                  </ExerciseMeta>
                  <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                    {exercise.duration} · {exercise.difficulty}
                  </TextR>
                </ExerciseBody>
                <SelectBadge selected={selected}>
                  <TextB
                    size={12}
                    color={selected ? '#000000' : KINETIC_COLORS.primary}
                  >
                    {selected ? '담김' : '담기'}
                  </TextB>
                </SelectBadge>
              </ExerciseRow>
            );
          })}
        </ExerciseList>
      </ScrollView>
    </Container>
  );
};

const Container = styled(View)`
  flex: 1;
  background-color: ${KINETIC_COLORS.background};
`;

const TopBar = styled.View`
  padding: 52px 24px 18px;
  flex-direction: row;
  align-items: center;
`;

const BackButton = styled(TouchableOpacity)`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  background-color: rgba(204, 255, 0, 0.08);
`;

const TitleWrap = styled.View`
  margin-left: 14px;
`;

const IntroCard = styled.View`
  margin: 0 24px 18px;
  padding: 20px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
`;

const IntroDescription = styled.View`
  margin-top: 10px;
`;

const DayRow = styled.View`
  flex-direction: row;
  padding-horizontal: 24px;
  justify-content: space-between;
`;

const DayChip = styled(TouchableOpacity)<{ active: boolean }>`
  width: 42px;
  min-height: 58px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  background-color: ${({ active }) =>
    active ? KINETIC_COLORS.primary : KINETIC_COLORS.surface};
`;

const DayCount = styled.View<{ active: boolean }>`
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  justify-content: center;
  align-items: center;
  margin-top: 6px;
  background-color: ${({ active }) =>
    active ? '#000000' : KINETIC_COLORS.primary};
`;

const SelectedSummary = styled.View`
  margin: 18px 24px 14px;
  padding: 18px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
`;

const SummaryTop = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const SummaryTitle = styled.View`
  margin-top: 6px;
`;

const ClearButton = styled(TouchableOpacity)`
  min-width: 74px;
  min-height: 38px;
  border-radius: 19px;
  justify-content: center;
  align-items: center;
  background-color: ${KINETIC_COLORS.primary};
`;

const SelectedNames = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 14px;
`;

const SelectedPill = styled.View`
  margin-right: 8px;
  margin-bottom: 8px;
  padding-horizontal: 12px;
  padding-vertical: 9px;
  border-radius: 999px;
  background-color: ${KINETIC_COLORS.primary};
`;

const CategoryHeader = styled.View`
  padding: 6px 24px 14px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const CategoryDescription = styled.View`
  margin-top: 6px;
`;

const VisibleCount = styled.View`
  min-width: 38px;
  height: 38px;
  border-radius: 19px;
  justify-content: center;
  align-items: center;
  background-color: ${KINETIC_COLORS.primary};
`;

const CategoryScroll = styled(ScrollView)`
  margin-bottom: 14px;
`;

const CategoryChip = styled(TouchableOpacity)<{ active: boolean }>`
  margin-right: 10px;
  padding-horizontal: 18px;
  padding-vertical: 11px;
  border-radius: 999px;
  background-color: ${({ active }) =>
    active ? KINETIC_COLORS.primary : KINETIC_COLORS.surface};
  border-width: 1px;
  border-color: ${({ active }) =>
    active ? KINETIC_COLORS.primary : 'rgba(255, 255, 255, 0.06)'};
`;

const CatalogState = styled.View`
  margin: 0 24px 14px;
  padding: 12px 14px;
  border-radius: 8px;
  background-color: ${KINETIC_COLORS.surface};
  flex-direction: row;
  align-items: center;
`;

const StateText = styled.View`
  margin-left: 10px;
`;

const ExerciseList = styled.View`
  padding: 0 24px;
`;

const ExerciseRow = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: 14px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
  margin-bottom: 12px;
`;

const ExerciseThumb = styled.View`
  width: 64px;
  height: 64px;
  padding: 3px;
  border-radius: 18px;
  border-width: 1px;
  background-color: rgba(255, 255, 255, 0.02);
`;

const ExerciseImage = styled.Image`
  width: 100%;
  height: 100%;
  border-radius: 15px;
`;

const ExerciseBody = styled.View`
  flex: 1;
  margin-left: 14px;
`;

const ExerciseMeta = styled.View`
  margin-top: 4px;
  margin-bottom: 8px;
`;

const SelectBadge = styled.View<{ selected: boolean }>`
  min-width: 52px;
  min-height: 34px;
  border-radius: 17px;
  justify-content: center;
  align-items: center;
  background-color: ${({ selected }) =>
    selected ? KINETIC_COLORS.primary : 'rgba(204, 255, 0, 0.08)'};
`;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 36,
  },
  horizontalContent: {
    paddingHorizontal: 24,
  },
});

export default RoutineCreateScreen;
