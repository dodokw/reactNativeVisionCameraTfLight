import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import styled from 'styled-components/native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../tools/Colors';
import { SearchIcon } from '../tools/Svg';
import { TextB, TextR } from '../tools/fonts';
import { getApiErrorMessage } from '../api/client';
import { exerciseApi } from '../api/exercises';
import { RootState } from '../store';
import { RootStackNavigation } from '../navigation/types';
import {
  clearTodayExercises,
  toggleTodayExercise,
} from '../store/slices/activitySlice';
import {
  calculateExerciseCalories,
  formatCalories,
} from '../utils/activityCalories';
import {
  ExerciseCategory,
  ExerciseItem,
  buildExerciseItem,
  exerciseCategories,
  fallbackExercises,
} from '../data/exerciseCatalog';

const { width } = Dimensions.get('window');
const KINETIC_COLORS = Colors.kinetic;
const EMPTY_TODAY_EXERCISE_IDS: RootState['activity']['todayExerciseIds'] = [];

export const categories = exerciseCategories;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 36,
  },
  horizontalContent: {
    paddingHorizontal: 24,
  },
});

export const ExerciseListScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<RootStackNavigation>();
  const selectedExercises = useSelector(
    (state: RootState) =>
      state.activity.todayExerciseIds ?? EMPTY_TODAY_EXERCISE_IDS,
  );
  const [exercises, setExercises] = useState<ExerciseItem[]>(fallbackExercises);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredExercises = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return exercises.filter(exercise => {
      const matchesCategory =
        selectedCategory === '전체' || exercise.category === selectedCategory;
      const matchesSearch =
        normalized.length === 0 ||
        exercise.name.toLowerCase().includes(normalized) ||
        exercise.focus.toLowerCase().includes(normalized) ||
        exercise.category.toLowerCase().includes(normalized);

      return matchesCategory && matchesSearch;
    });
  }, [exercises, searchQuery, selectedCategory]);

  const selectedExerciseDetails = exercises.filter(exercise =>
    selectedExercises.includes(exercise.id),
  );
  const plannedCalories = calculateExerciseCalories(selectedExerciseDetails);

  const toggleExercise = (id: string) => {
    dispatch(toggleTodayExercise(id));
  };

  const startSelectedWorkout = () => {
    if (selectedExercises.length === 0) {
      return;
    }

    navigation.navigate('NoTabNavigation', {
      screen: 'Camera',
      params: { exerciseIds: selectedExercises },
    });
  };

  return (
    <Container>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeroSection entering={FadeInDown.duration(450)}>
          <Eyebrow>
            <TextR size={12} color={KINETIC_COLORS.primary}>
              EXERCISE SELECTION
            </TextR>
          </Eyebrow>
          <HeroTitle>
            <TextB size={30} color={KINETIC_COLORS.onSurface}>
              지금 진행할 운동을 선택하세요
            </TextB>
          </HeroTitle>
          <HeroSubtitle>
            <TextR size={14} color={KINETIC_COLORS.onSurfaceVariant}>
              부위별로 빠르게 찾고, 선택한 운동만 모아서 카메라 세션으로 이어갈
              수 있어요.
            </TextR>
          </HeroSubtitle>
          <HeroStatsRow>
            <HeroStatCard>
              <TextB size={20} color={KINETIC_COLORS.onSurface}>
                {selectedExercises.length}
              </TextB>
              <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                선택한 운동
              </TextR>
            </HeroStatCard>
            <HeroStatCard>
              <TextB size={20} color={KINETIC_COLORS.onSurface}>
                {filteredExercises.length}
              </TextB>
              <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                표시 중
              </TextR>
            </HeroStatCard>
            <HeroStatCard accent>
              <TextB size={20} color="#000000">
                {formatCalories(plannedCalories)}
              </TextB>
              <TextR size={12} color="#000000">
                예상 kcal
              </TextR>
            </HeroStatCard>
          </HeroStatsRow>
        </HeroSection>

        <SelectionSummary>
          <SummaryHeader>
            <View>
              <TextB size={18} color={KINETIC_COLORS.onSurface}>
                선택한 운동
              </TextB>
              <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                {selectedExercises.length === 0
                  ? '아직 선택된 운동이 없어요'
                  : `${selectedExercises.length}개 운동이 준비됐어요`}
              </TextR>
            </View>
            <ClearButton
              disabled={selectedExercises.length === 0}
              activeOpacity={0.85}
              onPress={() => dispatch(clearTodayExercises())}
            >
              <TextB
                size={12}
                color={
                  selectedExercises.length === 0
                    ? KINETIC_COLORS.onSurfaceVariant
                    : '#000000'
                }
              >
                초기화
              </TextB>
            </ClearButton>
          </SummaryHeader>

          <SelectedNamesRow>
            {selectedExerciseDetails.length === 0 ? (
              <EmptyPill>
                <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                  운동을 선택하면 여기에 표시됩니다
                </TextR>
              </EmptyPill>
            ) : (
              selectedExerciseDetails.map(exercise => (
                <SelectedPill key={`${exercise.id}-pill`}>
                  <TextB size={12} color="#000000">
                    {exercise.name}
                  </TextB>
                </SelectedPill>
              ))
            )}
          </SelectedNamesRow>

          <StartWorkoutButton
            disabled={selectedExercises.length === 0}
            ready={selectedExercises.length > 0}
            activeOpacity={0.88}
            onPress={startSelectedWorkout}
          >
            <TextB
              size={15}
              color={
                selectedExercises.length > 0
                  ? '#000000'
                  : KINETIC_COLORS.onSurfaceVariant
              }
            >
              {selectedExercises.length > 0
                ? '선택한 운동 시작하기'
                : '운동을 담으면 시작할 수 있어요'}
            </TextB>
          </StartWorkoutButton>
        </SelectionSummary>

        <SearchSection>
          <SearchBar>
            <SearchIcon
              width={18}
              height={18}
              color={KINETIC_COLORS.onSurfaceVariant}
            />
            <SearchInput
              placeholder="운동명 또는 부위 검색"
              placeholderTextColor={KINETIC_COLORS.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </SearchBar>
        </SearchSection>

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
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.85}
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

        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            추천 운동
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            탭해서 운동을 추가하거나 해제하세요
          </TextR>
        </SectionHeader>

        {(isLoading || catalogError) && (
          <CatalogState>
            {isLoading ? (
              <ActivityIndicator color={KINETIC_COLORS.primary} />
            ) : null}
            <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
              {isLoading
                ? '서버 운동 목록을 불러오는 중입니다'
                : '서버 목록 대신 앱에 저장된 기본 목록을 사용 중입니다'}
            </TextR>
          </CatalogState>
        )}

        <FeaturedScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          {filteredExercises.map((exercise, index) => {
            const selected = selectedExercises.includes(exercise.id);

            return (
              <FeaturedCard
                key={exercise.id}
                entering={FadeInRight.delay(index * 80).duration(400)}
              >
                <CardGlow style={{ backgroundColor: `${exercise.accent}22` }} />
                <CardBadge>
                  <TextB size={11} color={exercise.accent}>
                    {exercise.category}
                  </TextB>
                </CardBadge>
                <FeaturedImage source={exercise.image} resizeMode="cover" />
                <CardTitle>
                  <TextB size={22} color={KINETIC_COLORS.onSurface}>
                    {exercise.name}
                  </TextB>
                </CardTitle>
                <CardMeta>
                  <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                    {exercise.focus}
                  </TextR>
                </CardMeta>
                <MetricRow>
                  <MetricPill>
                    <TextR size={12} color={KINETIC_COLORS.onSurface}>
                      {exercise.duration}
                    </TextR>
                  </MetricPill>
                  <MetricPill>
                    <TextR size={12} color={KINETIC_COLORS.onSurface}>
                      {exercise.calories}
                    </TextR>
                  </MetricPill>
                  <MetricPill>
                    <TextR size={12} color={KINETIC_COLORS.onSurface}>
                      {exercise.difficulty}
                    </TextR>
                  </MetricPill>
                </MetricRow>
                <SelectButton
                  selected={selected}
                  onPress={() => toggleExercise(exercise.id)}
                  activeOpacity={0.9}
                >
                  <TextB
                    size={14}
                    color={selected ? '#000000' : KINETIC_COLORS.onSurface}
                  >
                    {selected ? '담김' : '운동 담기'}
                  </TextB>
                </SelectButton>
              </FeaturedCard>
            );
          })}
        </FeaturedScroll>

        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            전체 목록
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            선택 상태와 운동 정보를 한 번에 확인할 수 있어요
          </TextR>
        </SectionHeader>

        <ListSection>
          {filteredExercises.map((exercise, index) => {
            const selected = selectedExercises.includes(exercise.id);

            return (
              <ExerciseRow
                key={`${exercise.id}-row`}
                entering={FadeInDown.delay(index * 70).duration(350)}
                activeOpacity={0.92}
                onPress={() => toggleExercise(exercise.id)}
              >
                <ThumbnailWrap style={{ borderColor: `${exercise.accent}55` }}>
                  <Thumbnail source={exercise.image} resizeMode="cover" />
                </ThumbnailWrap>
                <ExerciseBody>
                  <ExerciseTopLine>
                    <TextB size={17} color={KINETIC_COLORS.onSurface}>
                      {exercise.name}
                    </TextB>
                    <SelectionBadge selected={selected}>
                      <TextB
                        size={11}
                        color={selected ? '#000000' : KINETIC_COLORS.primary}
                      >
                        {selected ? '담김' : '대기중'}
                      </TextB>
                    </SelectionBadge>
                  </ExerciseTopLine>
                  <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                    {exercise.focus}
                  </TextR>
                  <ListMetaRow>
                    <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                      {exercise.duration}
                    </TextR>
                    <MetaDot />
                    <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                      {exercise.calories}
                    </TextR>
                    <MetaDot />
                    <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                      {exercise.difficulty}
                    </TextR>
                  </ListMetaRow>
                </ExerciseBody>
              </ExerciseRow>
            );
          })}
        </ListSection>
      </ScrollView>
    </Container>
  );
};

const Container = styled(View)`
  flex: 1;
  background-color: ${KINETIC_COLORS.background};
`;

const HeroSection = styled(Animated.View)`
  margin: 8px 24px 0;
  padding: 24px;
  border-radius: 28px;
  background-color: ${KINETIC_COLORS.surface};
  overflow: hidden;
`;

const Eyebrow = styled.View`
  align-self: flex-start;
  padding-horizontal: 10px;
  padding-vertical: 6px;
  border-radius: 999px;
  background-color: rgba(204, 255, 0, 0.1);
  margin-bottom: 16px;
`;

const HeroTitle = styled.View`
  max-width: 88%;
`;

const HeroSubtitle = styled.View`
  margin-top: 10px;
  max-width: 92%;
`;

const HeroStatsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 22px;
`;

const HeroStatCard = styled.View<{ accent?: boolean }>`
  width: ${(width - 84) / 3}px;
  padding: 14px 12px;
  border-radius: 18px;
  background-color: ${({ accent }) =>
    accent ? KINETIC_COLORS.primary : KINETIC_COLORS.surfaceVariant};
`;

const SearchSection = styled.View`
  padding: 18px 24px 10px;
`;

const SearchBar = styled.View`
  flex-direction: row;
  align-items: center;
  min-height: 52px;
  padding-horizontal: 16px;
  border-radius: 18px;
  background-color: ${KINETIC_COLORS.surfaceVariant};
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.06);
`;

const SearchInput = styled(TextInput)`
  flex: 1;
  margin-left: 10px;
  color: ${KINETIC_COLORS.onSurface};
  font-family: 'SpoqaHanSansNeo-Regular';
  font-size: 15px;
`;

const CategoryScroll = styled(ScrollView)`
  margin-bottom: 6px;
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

const SectionHeader = styled.View`
  padding: 18px 24px 14px;
`;

const CatalogState = styled.View`
  margin: 0 24px 14px;
  padding: 12px 14px;
  border-radius: 8px;
  background-color: ${KINETIC_COLORS.surface};
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

const FeaturedScroll = styled(ScrollView)`
  min-height: 360px;
`;

const FeaturedCard = styled(Animated.View)`
  width: ${Math.min(width * 0.72, 320)}px;
  margin-right: 16px;
  padding: 18px;
  border-radius: 28px;
  background-color: ${KINETIC_COLORS.surface};
  overflow: hidden;
`;

const CardGlow = styled.View`
  position: absolute;
  top: -20px;
  right: -10px;
  width: 140px;
  height: 140px;
  border-radius: 70px;
`;

const CardBadge = styled.View`
  align-self: flex-start;
  margin-bottom: 12px;
  padding-horizontal: 10px;
  padding-vertical: 5px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.04);
`;

const FeaturedImage = styled.Image`
  width: 100%;
  height: 168px;
  border-radius: 20px;
  margin-bottom: 14px;
`;

const CardTitle = styled.View`
  margin-bottom: 6px;
`;

const CardMeta = styled.View`
  min-height: 40px;
`;

const MetricRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 14px;
`;

const MetricPill = styled.View`
  padding-horizontal: 10px;
  padding-vertical: 7px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.05);
  margin-right: 8px;
  margin-bottom: 8px;
`;

const SelectButton = styled(TouchableOpacity)<{ selected: boolean }>`
  margin-top: 12px;
  min-height: 46px;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
  background-color: ${({ selected }) =>
    selected ? KINETIC_COLORS.primary : 'rgba(255, 255, 255, 0.06)'};
`;

const ListSection = styled.View`
  padding-horizontal: 24px;
`;

const ExerciseRow = styled(Animated.createAnimatedComponent(TouchableOpacity))`
  flex-direction: row;
  align-items: center;
  padding: 14px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
  margin-bottom: 12px;
`;

const ThumbnailWrap = styled.View`
  width: 72px;
  height: 72px;
  padding: 3px;
  border-radius: 20px;
  border-width: 1px;
  background-color: rgba(255, 255, 255, 0.02);
`;

const Thumbnail = styled.Image`
  width: 100%;
  height: 100%;
  border-radius: 17px;
`;

const ExerciseBody = styled.View`
  flex: 1;
  margin-left: 14px;
`;

const ExerciseTopLine = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const SelectionBadge = styled.View<{ selected: boolean }>`
  padding-horizontal: 10px;
  padding-vertical: 6px;
  border-radius: 999px;
  background-color: ${({ selected }) =>
    selected ? KINETIC_COLORS.primary : 'rgba(204, 255, 0, 0.08)'};
`;

const ListMetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
`;

const MetaDot = styled.View`
  width: 4px;
  height: 4px;
  border-radius: 2px;
  margin-horizontal: 8px;
  background-color: ${KINETIC_COLORS.outline};
`;

const SelectionSummary = styled.View`
  margin: 12px 24px 0;
  padding: 18px;
  border-radius: 24px;
  background-color: ${KINETIC_COLORS.surface};
`;

const SummaryHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ClearButton = styled(TouchableOpacity)`
  min-width: 74px;
  min-height: 36px;
  padding-horizontal: 14px;
  justify-content: center;
  align-items: center;
  border-radius: 999px;
  background-color: ${KINETIC_COLORS.primary};
`;

const SelectedNamesRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 16px;
`;

const SelectedPill = styled.View`
  margin-right: 8px;
  margin-bottom: 8px;
  padding-horizontal: 12px;
  padding-vertical: 9px;
  border-radius: 999px;
  background-color: ${KINETIC_COLORS.primary};
`;

const EmptyPill = styled.View`
  padding-horizontal: 12px;
  padding-vertical: 10px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.04);
`;

const StartWorkoutButton = styled(TouchableOpacity)<{ ready: boolean }>`
  min-height: 52px;
  margin-top: 14px;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
  background-color: ${({ ready }) =>
    ready ? KINETIC_COLORS.primary : KINETIC_COLORS.surfaceVariant};
`;
