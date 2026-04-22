import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { Colors } from '../tools/Colors';
import { TextB, TextR } from '../tools/fonts';
import { RootStackNavigation, TabStackNavigation } from '../navigation/types';
import { authApi } from '../api/auth';
import { getApiErrorMessage } from '../api/client';
import { AppDispatch } from '../store';
import { clearUser } from '../store/slices/userSlice';

const KINETIC_COLORS = Colors.kinetic;

const permissionItems = [
  {
    title: '카메라 권한',
    description: '운동 자세 인식을 위해 사용',
    status: '허용됨',
  },
  {
    title: '알림 권한',
    description: '루틴 미수행 리마인드 전송',
    status: '허용됨',
  },
  {
    title: '저장소 권한',
    description: '세션 로그와 분석 결과 저장',
    status: '선택',
  },
];

export const AppSettingsScreen = () => {
  const navigation = useNavigation<TabStackNavigation>();
  const rootNavigation = navigation.getParent<RootStackNavigation>();
  const dispatch = useDispatch<AppDispatch>();
  const [highAccuracy, setHighAccuracy] = useState(true);
  const [mirrorPreview, setMirrorPreview] = useState(true);
  const [saveDebugLog, setSaveDebugLog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await authApi.logout();
      dispatch(clearUser());
      rootNavigation?.reset({
        index: 0,
        routes: [{ name: 'LoginNavigation' }],
      });
    } catch (error) {
      Alert.alert('Logout failed', getApiErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
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
            SETTINGS
          </TextR>
          <TextB size={24} color={KINETIC_COLORS.onSurface}>
            앱 환경설정
          </TextB>
        </TitleWrap>
      </TopBar>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            권한
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            앱 기능 사용에 필요한 접근 상태입니다
          </TextR>
        </SectionHeader>

        <CardList>
          {permissionItems.map(item => (
            <PermissionCard key={item.title}>
              <PermissionBody>
                <TextB size={17} color={KINETIC_COLORS.onSurface}>
                  {item.title}
                </TextB>
                <DescriptionWrap>
                  <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                    {item.description}
                  </TextR>
                </DescriptionWrap>
              </PermissionBody>
              <StatusPill>
                <TextB size={12} color={KINETIC_COLORS.primary}>
                  {item.status}
                </TextB>
              </StatusPill>
            </PermissionCard>
          ))}
        </CardList>

        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            카메라 세부 옵션
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            자세 인식 화면의 촬영 환경을 조정합니다
          </TextR>
        </SectionHeader>

        <SettingsCard>
          <SwitchItem>
            <SwitchText>
              <TextB size={17} color={KINETIC_COLORS.onSurface}>
                고정밀 자세 인식
              </TextB>
              <DescriptionWrap>
                <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                  모델 추론 정확도를 우선합니다
                </TextR>
              </DescriptionWrap>
            </SwitchText>
            <Switch
              value={highAccuracy}
              onValueChange={setHighAccuracy}
              trackColor={{
                false: KINETIC_COLORS.outline,
                true: KINETIC_COLORS.primary,
              }}
              thumbColor="#ffffff"
            />
          </SwitchItem>

          <Divider />

          <SwitchItem>
            <SwitchText>
              <TextB size={17} color={KINETIC_COLORS.onSurface}>
                전면 카메라 미러링
              </TextB>
              <DescriptionWrap>
                <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                  운동 화면을 거울처럼 보여줍니다
                </TextR>
              </DescriptionWrap>
            </SwitchText>
            <Switch
              value={mirrorPreview}
              onValueChange={setMirrorPreview}
              trackColor={{
                false: KINETIC_COLORS.outline,
                true: KINETIC_COLORS.primary,
              }}
              thumbColor="#ffffff"
            />
          </SwitchItem>

          <Divider />

          <SwitchItem>
            <SwitchText>
              <TextB size={17} color={KINETIC_COLORS.onSurface}>
                디버그 로그 저장
              </TextB>
              <DescriptionWrap>
                <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
                  카메라와 모델 상태를 기록합니다
                </TextR>
              </DescriptionWrap>
            </SwitchText>
            <Switch
              value={saveDebugLog}
              onValueChange={setSaveDebugLog}
              trackColor={{
                false: KINETIC_COLORS.outline,
                true: KINETIC_COLORS.primary,
              }}
              thumbColor="#ffffff"
            />
          </SwitchItem>
        </SettingsCard>

        <SectionHeader>
          <TextB size={20} color={KINETIC_COLORS.onSurface}>
            계정
          </TextB>
          <TextR size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            로그인 상태와 계정 정보를 관리합니다
          </TextR>
        </SectionHeader>

        <AccountActions>
          <LogoutButton
            activeOpacity={0.84}
            disabled={isLoggingOut}
            onPress={handleLogout}
          >
            <TextB size={16} color="#000000">
              {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
            </TextB>
          </LogoutButton>
          <DeleteButton activeOpacity={0.84}>
            <TextB size={16} color="#ff6565">
              회원탈퇴
            </TextB>
          </DeleteButton>
        </AccountActions>
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

const SectionHeader = styled.View`
  padding: 10px 24px 14px;
`;

const CardList = styled.View`
  padding-horizontal: 24px;
`;

const PermissionCard = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
`;

const PermissionBody = styled.View`
  flex: 1;
`;

const DescriptionWrap = styled.View`
  margin-top: 6px;
`;

const StatusPill = styled.View`
  padding: 7px 11px;
  border-radius: 999px;
  background-color: rgba(204, 255, 0, 0.08);
`;

const SettingsCard = styled.View`
  margin: 0 24px;
  padding: 18px;
  border-radius: 22px;
  background-color: ${KINETIC_COLORS.surface};
`;

const SwitchItem = styled.View`
  min-height: 58px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const SwitchText = styled.View`
  flex: 1;
  padding-right: 16px;
`;

const Divider = styled.View`
  height: 1px;
  margin: 14px 0;
  background-color: ${KINETIC_COLORS.outline};
`;

const AccountActions = styled.View`
  padding-horizontal: 24px;
`;

const LogoutButton = styled(TouchableOpacity)`
  height: 52px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  background-color: ${KINETIC_COLORS.primary};
`;

const DeleteButton = styled(TouchableOpacity)`
  height: 52px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  margin-top: 12px;
  border-width: 1px;
  border-color: rgba(255, 101, 101, 0.45);
  background-color: rgba(255, 101, 101, 0.08);
`;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 36,
  },
});
