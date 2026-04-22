import React, { useMemo } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import styled from 'styled-components/native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';
import { useSelector } from 'react-redux';
import { Colors } from '../tools/Colors';
import { TextB, TextR } from '../tools/fonts';
import { useStepCounter } from '../hooks/useStepCounter';
import { RootState } from '../store';
import {
  calculateCompletedWorkoutCalories,
  calculateStepCalories,
  formatCalories,
  isToday,
} from '../utils/activityCalories';

const KINETIC_COLORS = Colors.kinetic;
const EMPTY_COMPLETED_WORKOUTS: RootState['activity']['completedWorkouts'] = [];

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 36,
  },
});

const weeklyBars = [
  { day: 'Mon', value: 52, accent: false },
  { day: 'Tue', value: 76, accent: false },
  { day: 'Wed', value: 61, accent: false },
  { day: 'Thu', value: 89, accent: true },
  { day: 'Fri', value: 72, accent: false },
  { day: 'Sat', value: 94, accent: false },
  { day: 'Sun', value: 68, accent: false },
];

const achievements = [
  { title: '최장 연속 기록', value: '5일 연속' },
  { title: '베스트 운동', value: '스쿼트 240회' },
  { title: '이번 주 성장', value: '+18%' },
];

export const StatsScreen = () => {
  const { todaySteps } = useStepCounter();
  const completedWorkouts = useSelector(
    (state: RootState) =>
      state.activity.completedWorkouts ?? EMPTY_COMPLETED_WORKOUTS,
  );
  const dailyCalorieGoal = useSelector(
    (state: RootState) => state.user.profile?.daily_calorie_goal || 500,
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
  const goalProgress = Math.min(
    100,
    Math.round((totalCalories / dailyCalorieGoal) * 100),
  );
  const dailySummary = [
    { label: '걸음 칼로리', value: `${formatCalories(stepCalories)} kcal` },
    { label: '완료 운동', value: `${formatCalories(exerciseCalories)} kcal` },
    { label: '오늘 합계', value: `${formatCalories(totalCalories)} kcal` },
  ];

  return (
    <Container>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeroCard entering={FadeInDown.duration(450)}>
          <HeroTopRow>
            <View>
              <TextR size={12} color={KINETIC_COLORS.primary}>
                TODAY CALORIES
              </TextR>
              <HeroTitleWrap>
                <TextB size={30} color={KINETIC_COLORS.onSurface}>
                  오늘 활동 칼로리
                </TextB>
              </HeroTitleWrap>
            </View>
            <HighlightPill>
              <TextB size={12} color="#000000">
                {goalProgress}%
              </TextB>
            </HighlightPill>
          </HeroTopRow>

          <HeroBody>
            <ProgressCircle>
              <ProgressRing>
                <TextB size={28} color={KINETIC_COLORS.onSurface}>
                  {goalProgress}%
                </TextB>
                <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                  오늘 목표 달성
                </TextR>
              </ProgressRing>
            </ProgressCircle>

            <HeroMetrics>
              <MetricCard>
                <TextB size={24} color={KINETIC_COLORS.primary}>
                  {formatCalories(stepCalories)}
                </TextB>
                <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                  걸음 kcal
                </TextR>
              </MetricCard>
              <MetricCard>
                <TextB size={24} color={KINETIC_COLORS.onSurface}>
                  {formatCalories(totalCalories)}
                </TextB>
                <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                  총 kcal
                </TextR>
              </MetricCard>
            </HeroMetrics>
          </HeroBody>
        </HeroCard>

        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            오늘 요약
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            걸음 수와 오늘 선택한 운동 칼로리를 합산했어요
          </TextR>
        </SectionHeader>

        <SummaryRow>
          {dailySummary.map((item, index) => (
            <SummaryCard
              key={item.label}
              entering={FadeInDown.delay(index * 90).duration(360)}
            >
              <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                {item.label}
              </TextR>
              <SummaryValueWrap>
                <TextB size={18} color={KINETIC_COLORS.onSurface}>
                  {item.value}
                </TextB>
              </SummaryValueWrap>
            </SummaryCard>
          ))}
        </SummaryRow>

        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            활동 차트
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            요일별 강도와 상승 흐름을 함께 볼 수 있어요
          </TextR>
        </SectionHeader>

        <ChartCard entering={FadeInRight.duration(420)}>
          <ChartTopLine>
            <View>
              <TextB size={17} color={KINETIC_COLORS.onSurface}>
                Weekly Activity
              </TextB>
              <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                최근 7일 기준
              </TextR>
            </View>
            <ChartLegend>
              <LegendDot />
              <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                목표선 포함
              </TextR>
            </ChartLegend>
          </ChartTopLine>

          <TrendChart>
            <Svg width="100%" height="150" viewBox="0 0 320 150">
              <Line
                x1="0"
                y1="110"
                x2="320"
                y2="110"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
              />
              <Path
                d="M18 100 C48 88, 70 54, 104 66 S170 102, 210 58 S270 34, 302 50"
                fill="none"
                stroke={KINETIC_COLORS.primary}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </Svg>
          </TrendChart>

          <BarRow>
            {weeklyBars.map(bar => (
              <BarItem key={bar.day}>
                <BarTrack>
                  <BarFill
                    style={{ height: `${bar.value}%` }}
                    accent={bar.accent}
                  />
                </BarTrack>
                <TextR size={11} color={KINETIC_COLORS.onSurfaceVariant}>
                  {bar.day}
                </TextR>
              </BarItem>
            ))}
          </BarRow>
        </ChartCard>

        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            이번 주 성과
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            꾸준함과 퍼포먼스를 한 번에 확인할 수 있어요
          </TextR>
        </SectionHeader>

        <AchievementsSection>
          {achievements.map((item, index) => (
            <AchievementCard
              key={item.title}
              entering={FadeInDown.delay(index * 80).duration(320)}
            >
              <AchievementAccent />
              <AchievementBody>
                <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                  {item.title}
                </TextR>
                <AchievementValueWrap>
                  <TextB size={18} color={KINETIC_COLORS.onSurface}>
                    {item.value}
                  </TextB>
                </AchievementValueWrap>
              </AchievementBody>
            </AchievementCard>
          ))}
        </AchievementsSection>
      </ScrollView>
    </Container>
  );
};

const Container = styled(View)`
  flex: 1;
  background-color: ${KINETIC_COLORS.background};
`;

const HeroCard = styled(Animated.View)`
  margin: 8px 24px 0;
  padding: 24px;
  border-radius: 28px;
  background-color: ${KINETIC_COLORS.surface};
`;

const HeroTopRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`;

const HeroTitleWrap = styled.View`
  margin-top: 10px;
  max-width: 86%;
`;

const HighlightPill = styled.View`
  padding-horizontal: 12px;
  padding-vertical: 8px;
  border-radius: 999px;
  background-color: ${KINETIC_COLORS.primary};
`;

const HeroBody = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 22px;
`;

const ProgressCircle = styled.View`
  width: 148px;
  height: 148px;
  padding: 12px;
  border-radius: 74px;
  background-color: rgba(204, 255, 0, 0.08);
  justify-content: center;
  align-items: center;
`;

const ProgressRing = styled.View`
  width: 124px;
  height: 124px;
  border-radius: 62px;
  border-width: 10px;
  border-color: ${KINETIC_COLORS.primary};
  justify-content: center;
  align-items: center;
  background-color: ${KINETIC_COLORS.background};
`;

const HeroMetrics = styled.View`
  flex: 1;
  margin-left: 16px;
`;

const MetricCard = styled.View`
  padding: 16px;
  border-radius: 20px;
  background-color: ${KINETIC_COLORS.surfaceVariant};
  margin-bottom: 12px;
`;

const SectionHeader = styled.View`
  padding: 22px 24px 14px;
`;

const SummaryRow = styled.View`
  padding-horizontal: 24px;
`;

const SummaryCard = styled(Animated.View)`
  margin-bottom: 12px;
  padding: 18px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
`;

const SummaryValueWrap = styled.View`
  margin-top: 6px;
`;

const ChartCard = styled(Animated.View)`
  margin-horizontal: 24px;
  padding: 20px;
  border-radius: 28px;
  background-color: ${KINETIC_COLORS.surface};
`;

const ChartTopLine = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ChartLegend = styled.View`
  flex-direction: row;
  align-items: center;
`;

const LegendDot = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  margin-right: 6px;
  background-color: ${KINETIC_COLORS.primary};
`;

const TrendChart = styled.View`
  margin-top: 16px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.02);
  overflow: hidden;
`;

const BarRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 10px;
`;

const BarItem = styled.View`
  align-items: center;
`;

const BarTrack = styled.View`
  width: 22px;
  height: 120px;
  border-radius: 999px;
  justify-content: flex-end;
  overflow: hidden;
  margin-bottom: 10px;
  background-color: rgba(255, 255, 255, 0.06);
`;

const BarFill = styled.View<{ accent: boolean }>`
  width: 100%;
  border-radius: 999px;
  background-color: ${({ accent }) =>
    accent ? '#7AE7FF' : KINETIC_COLORS.primary};
`;

const AchievementsSection = styled.View`
  padding-horizontal: 24px;
`;

const AchievementCard = styled(Animated.View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
`;

const AchievementAccent = styled.View`
  width: 12px;
  height: 56px;
  border-radius: 999px;
  margin-right: 14px;
  background-color: ${KINETIC_COLORS.primary};
`;

const AchievementBody = styled.View`
  flex: 1;
`;

const AchievementValueWrap = styled.View`
  margin-top: 4px;
`;
