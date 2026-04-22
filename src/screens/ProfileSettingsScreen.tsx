import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  StatusBar,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import styled from 'styled-components/native';
import { Colors } from '../tools/Colors';
import { TextB, TextR } from '../tools/fonts';
import { TabStackNavigation } from '../navigation/types';
import { RootState } from '../store';

const KINETIC_COLORS = Colors.kinetic;

export const ProfileSettingsScreen = () => {
  const navigation = useNavigation<TabStackNavigation>();
  const storedNickname = useSelector((state: RootState) => {
    return (
      state.user.profile?.nickname ||
      state.user.user?.user_metadata?.nickname ||
      state.user.user?.email?.split('@')[0] ||
      ''
    );
  });
  const [nickname, setNickname] = useState(storedNickname);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

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
            PROFILE
          </TextR>
          <TextB size={24} color={KINETIC_COLORS.onSurface}>
            프로필 설정
          </TextB>
        </TitleWrap>
      </TopBar>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Card>
          <SectionTitle>
            <TextB size={18} color={KINETIC_COLORS.onSurface}>
              닉네임
            </TextB>
            <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
              운동 화면과 기록 화면에 표시됩니다
            </TextR>
          </SectionTitle>
          <NicknameInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력하세요"
            placeholderTextColor={KINETIC_COLORS.onSurfaceVariant}
          />
        </Card>

        <Card>
          <SectionTitle>
            <TextB size={18} color={KINETIC_COLORS.onSurface}>
              루틴 생성
            </TextB>
            <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
              요일마다 운동을 담아 오늘의 루틴으로 이어가세요
            </TextR>
          </SectionTitle>
          <RoutineLinkButton
            activeOpacity={0.86}
            onPress={() => navigation.navigate('RoutineCreateScreen')}
          >
            <TextB size={16} color="#000000">
              루틴 생성하러 가기
            </TextB>
          </RoutineLinkButton>
        </Card>

        <Card>
          <TodayHeader>
            <View>
              <TextR size={12} color={KINETIC_COLORS.primary}>
                TODAY
              </TextR>
              <TodayTitleWrap>
                <TextB size={19} color={KINETIC_COLORS.onSurface}>
                  오늘의 루틴
                </TextB>
              </TodayTitleWrap>
              <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                홈에서 오늘 요일의 루틴을 바로 시작할 수 있어요
              </TextR>
            </View>
            <StreakBadge>
              <TextB size={20} color="#000000">
                5일
              </TextB>
              <TextR size={11} color="#000000">
                연속 기록
              </TextR>
            </StreakBadge>
          </TodayHeader>

          <CompleteButton
            completed={isCompletedToday}
            activeOpacity={0.86}
            onPress={() => setIsCompletedToday(current => !current)}
          >
            <TextB
              size={16}
              color={isCompletedToday ? '#000000' : KINETIC_COLORS.onSurface}
            >
              {isCompletedToday ? '완료됨' : '오늘 루틴 완료 체크'}
            </TextB>
          </CompleteButton>
        </Card>

        <Card>
          <SwitchRow>
            <View>
              <TextB size={18} color={KINETIC_COLORS.onSurface}>
                알림 설정
              </TextB>
              <SwitchDescription>
                <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                  루틴 미수행 시 리마인드합니다
                </TextR>
              </SwitchDescription>
            </View>
            <Switch
              value={notificationEnabled}
              onValueChange={setNotificationEnabled}
              trackColor={{
                false: KINETIC_COLORS.outline,
                true: KINETIC_COLORS.primary,
              }}
              thumbColor="#ffffff"
            />
          </SwitchRow>
        </Card>
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

const Card = styled.View`
  margin: 0 24px 14px;
  padding: 18px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
`;

const SectionTitle = styled.View`
  margin-bottom: 16px;
`;

const NicknameInput = styled(TextInput)`
  height: 52px;
  padding: 0 16px;
  border-radius: 16px;
  color: ${KINETIC_COLORS.onSurface};
  background-color: ${KINETIC_COLORS.surfaceVariant};
  font-family: 'SpoqaHanSansNeo-Regular';
  font-size: 15px;
`;

const RoutineLinkButton = styled(TouchableOpacity)`
  height: 52px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  background-color: ${KINETIC_COLORS.primary};
`;

const TodayHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const TodayTitleWrap = styled.View`
  margin-top: 6px;
  margin-bottom: 6px;
`;

const StreakBadge = styled.View`
  width: 84px;
  height: 84px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  background-color: ${KINETIC_COLORS.primary};
`;

const CompleteButton = styled(TouchableOpacity)<{ completed: boolean }>`
  height: 52px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  margin-top: 18px;
  border-width: 1px;
  border-color: ${({ completed }) =>
    completed ? KINETIC_COLORS.primary : KINETIC_COLORS.outline};
  background-color: ${({ completed }) =>
    completed ? KINETIC_COLORS.primary : 'transparent'};
`;

const SwitchRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const SwitchDescription = styled.View`
  max-width: 220px;
  margin-top: 6px;
`;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 36,
  },
});
