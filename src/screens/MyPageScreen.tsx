import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import styled from 'styled-components/native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Colors } from '../tools/Colors';
import { TextB, TextR } from '../tools/fonts';
import { TabStackNavigation, TabStackParamList } from '../navigation/types';
import { RootState } from '../store';

const KINETIC_COLORS = Colors.kinetic;

const summaryItems = [
  { label: '완료 세션', value: '28' },
  { label: '연속 기록', value: '5일' },
  { label: '달성률', value: '82%' },
];

const menuSections = [
  {
    title: '프로필 설정',
    description: '닉네임, 루틴 생성, 알림 설정',
    route: 'ProfileSettingsScreen',
  },
  {
    title: '운동 기록 관리',
    description: '주간 목표와 지난 세션 히스토리',
    route: 'WorkoutRecordScreen',
  },
  {
    title: '앱 환경설정',
    description: '권한, 카메라 세부 옵션, 로그아웃',
    route: 'AppSettingsScreen',
  },
];

const badges = ['Consistency', 'Strength Up', 'Goal Hunter'];

export const MyPageScreen = () => {
  const navigation = useNavigation<TabStackNavigation>();
  const nickname = useSelector((state: RootState) => {
    return (
      state.user.profile?.nickname ||
      state.user.user?.user_metadata?.nickname ||
      state.user.user?.email?.split('@')[0] ||
      'User'
    );
  });

  return (
    <Container>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileHero entering={FadeInDown.duration(420)}>
          <ProfileTopRow>
            <ProfileImage
              source={require('../assets/images/user_avatar.png')}
            />
            <HeroMeta>
              <TextR size={12} color={KINETIC_COLORS.primary}>
                MY PAGE
              </TextR>
              <HeroNameWrap>
                <TextB size={28} color={KINETIC_COLORS.onSurface}>
                  {nickname}
                </TextB>
              </HeroNameWrap>
              <HeroSubline>
                <TextR size={14} color={KINETIC_COLORS.onSurfaceVariant}>
                  이번 주도 꾸준히 루틴을 이어가고 있어요
                </TextR>
              </HeroSubline>
            </HeroMeta>
          </ProfileTopRow>

          <HeroBadgeRow>
            {badges.map((badge, index) => (
              <HeroBadge
                key={badge}
                entering={FadeInRight.delay(index * 80).duration(280)}
              >
                <TextB size={12} color="#000000">
                  {badge}
                </TextB>
              </HeroBadge>
            ))}
          </HeroBadgeRow>
        </ProfileHero>

        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            이번 주 요약
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            stitch 스타일의 마이페이지 느낌으로 핵심 지표를 묶어두었습니다
          </TextR>
        </SectionHeader>

        <SummaryRow>
          {summaryItems.map((item, index) => (
            <SummaryCard
              key={item.label}
              entering={FadeInDown.delay(index * 90).duration(320)}
            >
              <TextB size={22} color={KINETIC_COLORS.onSurface}>
                {item.value}
              </TextB>
              <SummaryLabelWrap>
                <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
                  {item.label}
                </TextR>
              </SummaryLabelWrap>
            </SummaryCard>
          ))}
        </SummaryRow>

        <HighlightCard entering={FadeInDown.delay(120).duration(360)}>
          <HighlightTextWrap>
            <TextR size={12} color={KINETIC_COLORS.primary}>
              PERSONAL STATUS
            </TextR>
            <HighlightTitleWrap>
              <TextB size={22} color={KINETIC_COLORS.onSurface}>
                목표 달성까지 한 걸음 남았어요
              </TextB>
            </HighlightTitleWrap>
            <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
              이번 주 목표 7회 중 6회를 완료했습니다. 마지막 세션만 채우면 주간
              배지를 획득할 수 있어요.
            </TextR>
          </HighlightTextWrap>
          <GoalPill>
            <TextB size={18} color="#000000">
              6 / 7
            </TextB>
          </GoalPill>
        </HighlightCard>

        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            메뉴
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            계정과 앱 관련 정보를 한 번에 볼 수 있도록 구성했습니다
          </TextR>
        </SectionHeader>

        <MenuSection>
          {menuSections.map((item, index) => (
            <MenuCard
              key={item.title}
              entering={FadeInDown.delay(index * 70).duration(300)}
              activeOpacity={0.82}
              onPress={() =>
                navigation.navigate(item.route as keyof TabStackParamList)
              }
            >
              <MenuAccent />
              <MenuBody>
                <TextB size={17} color={KINETIC_COLORS.onSurface}>
                  {item.title}
                </TextB>
                <MenuDescriptionWrap>
                  <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                    {item.description}
                  </TextR>
                </MenuDescriptionWrap>
              </MenuBody>
              <ArrowWrap>
                <TextB size={18} color={KINETIC_COLORS.primary}>
                  ›
                </TextB>
              </ArrowWrap>
            </MenuCard>
          ))}
        </MenuSection>
      </ScrollView>
    </Container>
  );
};

const Container = styled(View)`
  flex: 1;
  background-color: ${KINETIC_COLORS.background};
`;

const ProfileHero = styled(Animated.View)`
  margin: 8px 24px 0;
  padding: 22px;
  border-radius: 28px;
  background-color: ${KINETIC_COLORS.surface};
`;

const ProfileTopRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ProfileImage = styled(Image)`
  width: 86px;
  height: 86px;
  border-radius: 43px;
  border-width: 2px;
  border-color: ${KINETIC_COLORS.primary};
`;

const HeroMeta = styled.View`
  flex: 1;
  margin-left: 16px;
`;

const HeroNameWrap = styled.View`
  margin-top: 8px;
`;

const HeroSubline = styled.View`
  margin-top: 8px;
`;

const HeroBadgeRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 18px;
`;

const HeroBadge = styled(Animated.View)`
  margin-right: 8px;
  margin-bottom: 8px;
  padding-horizontal: 12px;
  padding-vertical: 9px;
  border-radius: 999px;
  background-color: ${KINETIC_COLORS.primary};
`;

const SectionHeader = styled.View`
  padding: 22px 24px 14px;
`;

const SummaryRow = styled.View`
  flex-direction: row;
  padding-horizontal: 24px;
  justify-content: space-between;
`;

const SummaryCard = styled(Animated.View)`
  width: 31%;
  padding: 16px 12px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
`;

const SummaryLabelWrap = styled.View`
  margin-top: 8px;
`;

const HighlightCard = styled(Animated.View)`
  margin: 16px 24px 0;
  padding: 18px;
  border-radius: 24px;
  background-color: ${KINETIC_COLORS.surface};
  flex-direction: row;
  align-items: center;
`;

const HighlightTextWrap = styled.View`
  flex: 1;
  padding-right: 14px;
`;

const HighlightTitleWrap = styled.View`
  margin-top: 8px;
  margin-bottom: 8px;
`;

const GoalPill = styled.View`
  min-width: 88px;
  min-height: 88px;
  border-radius: 24px;
  background-color: ${KINETIC_COLORS.primary};
  justify-content: center;
  align-items: center;
`;

const MenuSection = styled.View`
  padding-horizontal: 24px;
`;

const MenuCard = styled(Animated.createAnimatedComponent(TouchableOpacity))`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
`;

const MenuAccent = styled.View`
  width: 10px;
  height: 56px;
  border-radius: 999px;
  margin-right: 14px;
  background-color: ${KINETIC_COLORS.primary};
`;

const MenuBody = styled.View`
  flex: 1;
`;

const MenuDescriptionWrap = styled.View`
  margin-top: 6px;
`;

const ArrowWrap = styled.View`
  width: 34px;
  height: 34px;
  border-radius: 17px;
  justify-content: center;
  align-items: center;
  background-color: rgba(204, 255, 0, 0.08);
`;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 36,
  },
});
