import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styled from 'styled-components/native';
import { Colors } from '../tools/Colors';
import { TextB, TextR } from '../tools/fonts';
import { TabStackNavigation } from '../navigation/types';

const KINETIC_COLORS = Colors.kinetic;

const weeklyStats = [
  { label: '목표', value: '7회' },
  { label: '완료', value: '6회' },
  { label: '달성률', value: '86%' },
];

const sessionHistory = [
  {
    date: '오늘',
    title: '전신 밸런스 루틴',
    meta: '스쿼트 24회 · 푸시업 18회 · 플랭크 90초',
    result: '완료',
  },
  {
    date: '어제',
    title: '하체 집중 루틴',
    meta: '스쿼트 30회 · 런지 20회',
    result: '완료',
  },
  {
    date: '화요일',
    title: '코어 안정화 루틴',
    meta: '싯업 28회 · 플랭크 120초',
    result: '완료',
  },
  {
    date: '월요일',
    title: '상체 근력 루틴',
    meta: '푸시업 20회 · 숄더 탭 32회',
    result: '완료',
  },
];

export const WorkoutRecordScreen = () => {
  const navigation = useNavigation<TabStackNavigation>();

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
            RECORD
          </TextR>
          <TextB size={24} color={KINETIC_COLORS.onSurface}>
            운동 기록 관리
          </TextB>
        </TitleWrap>
      </TopBar>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <GoalCard>
          <GoalTop>
            <View>
              <TextR size={12} color={KINETIC_COLORS.primary}>
                WEEKLY GOAL
              </TextR>
              <GoalTitleWrap>
                <TextB size={23} color={KINETIC_COLORS.onSurface}>
                  이번 주 7회 중 6회 완료
                </TextB>
              </GoalTitleWrap>
              <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                한 번만 더 완료하면 주간 목표를 달성합니다
              </TextR>
            </View>
            <GoalBadge>
              <TextB size={20} color="#000000">
                6/7
              </TextB>
            </GoalBadge>
          </GoalTop>

          <ProgressTrack>
            <ProgressFill />
          </ProgressTrack>

          <StatRow>
            {weeklyStats.map(stat => (
              <StatBox key={stat.label}>
                <TextB size={20} color={KINETIC_COLORS.onSurface}>
                  {stat.value}
                </TextB>
                <StatLabelWrap>
                  <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                    {stat.label}
                  </TextR>
                </StatLabelWrap>
              </StatBox>
            ))}
          </StatRow>
        </GoalCard>

        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            지난 세션 히스토리
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            과거 수행 이력을 날짜별로 확인할 수 있습니다
          </TextR>
        </SectionHeader>

        <HistoryList>
          {sessionHistory.map(item => (
            <HistoryCard key={`${item.date}-${item.title}`}>
              <DateBadge>
                <TextB size={13} color="#000000">
                  {item.date}
                </TextB>
              </DateBadge>
              <HistoryBody>
                <TextB size={17} color={KINETIC_COLORS.onSurface}>
                  {item.title}
                </TextB>
                <HistoryMetaWrap>
                  <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                    {item.meta}
                  </TextR>
                </HistoryMetaWrap>
              </HistoryBody>
              <ResultPill>
                <TextB size={12} color={KINETIC_COLORS.primary}>
                  {item.result}
                </TextB>
              </ResultPill>
            </HistoryCard>
          ))}
        </HistoryList>
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

const GoalCard = styled.View`
  margin: 0 24px;
  padding: 20px;
  border-radius: 24px;
  background-color: ${KINETIC_COLORS.surface};
`;

const GoalTop = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const GoalTitleWrap = styled.View`
  margin-top: 8px;
  margin-bottom: 8px;
`;

const GoalBadge = styled.View`
  width: 76px;
  height: 76px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  background-color: ${KINETIC_COLORS.primary};
`;

const ProgressTrack = styled.View`
  height: 10px;
  border-radius: 999px;
  margin-top: 22px;
  background-color: ${KINETIC_COLORS.surfaceVariant};
  overflow: hidden;
`;

const ProgressFill = styled.View`
  width: 86%;
  height: 10px;
  border-radius: 999px;
  background-color: ${KINETIC_COLORS.primary};
`;

const StatRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 18px;
`;

const StatBox = styled.View`
  width: 31%;
  padding: 14px 10px;
  border-radius: 18px;
  background-color: ${KINETIC_COLORS.surfaceVariant};
`;

const StatLabelWrap = styled.View`
  margin-top: 7px;
`;

const SectionHeader = styled.View`
  padding: 24px 24px 14px;
`;

const HistoryList = styled.View`
  padding-horizontal: 24px;
`;

const HistoryCard = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
`;

const DateBadge = styled.View`
  width: 58px;
  height: 58px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  background-color: ${KINETIC_COLORS.primary};
`;

const HistoryBody = styled.View`
  flex: 1;
  margin-left: 14px;
`;

const HistoryMetaWrap = styled.View`
  margin-top: 6px;
`;

const ResultPill = styled.View`
  padding: 7px 10px;
  border-radius: 999px;
  background-color: rgba(204, 255, 0, 0.08);
`;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 36,
  },
});
