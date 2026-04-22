import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { Colors } from '../tools/Colors';
import {
  LoginStackParamList,
  RootStackNavigation,
} from '../navigation/types';
import { authApi } from '../api/auth';
import { getApiErrorMessage } from '../api/client';
import { AppDispatch } from '../store';
import { setAuthSession } from '../store/slices/userSlice';

const KINETIC_COLORS = Colors.kinetic;

type TermsConsentScreenProps = NativeStackScreenProps<
  LoginStackParamList,
  'TermsConsent'
>;

const TermsConsentScreen = ({
  navigation,
  route,
}: TermsConsentScreenProps) => {
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isPrivacyAccepted, setIsPrivacyAccepted] = useState(false);
  const [isMarketingAccepted, setIsMarketingAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const rootNavigation = navigation.getParent<RootStackNavigation>();

  const canSubmit = useMemo(
    () => isAgeConfirmed && isTermsAccepted && isPrivacyAccepted,
    [isAgeConfirmed, isPrivacyAccepted, isTermsAccepted],
  );
  const isAllAccepted = useMemo(
    () => canSubmit && isMarketingAccepted,
    [canSubmit, isMarketingAccepted],
  );

  const toggleAll = () => {
    const nextValue = !isAllAccepted;

    setIsAgeConfirmed(nextValue);
    setIsTermsAccepted(nextValue);
    setIsPrivacyAccepted(nextValue);
    setIsMarketingAccepted(nextValue);
  };

  const handleCreateAccount = async () => {
    if (!canSubmit || isSubmitting) {
      Alert.alert('Terms consent', 'Please accept the required terms.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authApi.signUp({
        email: route.params.email,
        password: route.params.password,
        nickname: route.params.nickname,
      });

      if (response.session) {
        dispatch(
          setAuthSession({
            session: response.session,
            profile: response.profile,
          }),
        );
        rootNavigation?.reset({
          index: 0,
          routes: [{ name: 'TabNavigation' }],
        });
        return;
      }

      Alert.alert('Check your email', 'Please confirm your email to login.');
      navigation.popToTop();
    } catch (error) {
      Alert.alert('Sign up failed', getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <ScrollContent>
        <TopBar>
          <BackButton onPress={() => navigation.goBack()}>
            <BackButtonText>Back</BackButtonText>
          </BackButton>
        </TopBar>

        <Header entering={FadeInDown.duration(800).springify()}>
          <Eyebrow>TERMS OF SERVICE</Eyebrow>
          <Title>Consent before we start tracking reps.</Title>
          <Subtitle>
            Review and accept the required terms to finish your account.
          </Subtitle>
        </Header>

        <ConsentCard entering={FadeInDown.duration(800).delay(120).springify()}>
          <AccountPreview>
            <PreviewLabel>Signing up as</PreviewLabel>
            <PreviewEmail>{route.params.email}</PreviewEmail>
          </AccountPreview>

          <AllRow activeOpacity={0.85} onPress={toggleAll}>
            <CheckBox isChecked={isAllAccepted}>
              <CheckMark>{isAllAccepted ? '✓' : ''}</CheckMark>
            </CheckBox>
            <AllText>Accept all</AllText>
          </AllRow>

          <Divider />

          <ConsentRow
            label="[Required] I am 14 years or older."
            value={isAgeConfirmed}
            onPress={() => setIsAgeConfirmed(value => !value)}
          />
          <ConsentRow
            label="[Required] I agree to the Terms of Service."
            value={isTermsAccepted}
            onPress={() => setIsTermsAccepted(value => !value)}
          />
          <ConsentRow
            label="[Required] I agree to the Privacy Policy."
            value={isPrivacyAccepted}
            onPress={() => setIsPrivacyAccepted(value => !value)}
          />
          <ConsentRow
            label="[Optional] Send me product updates."
            value={isMarketingAccepted}
            onPress={() => setIsMarketingAccepted(value => !value)}
          />

          <Notice>
            Optional marketing consent can be changed later in settings.
          </Notice>

          <PrimaryButton
            activeOpacity={0.85}
            disabled={!canSubmit || isSubmitting}
            isDisabled={!canSubmit || isSubmitting}
            onPress={handleCreateAccount}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <ButtonText>Create Account</ButtonText>
            )}
          </PrimaryButton>
        </ConsentCard>
      </ScrollContent>
    </Container>
  );
};

type ConsentRowProps = {
  label: string;
  value: boolean;
  onPress: () => void;
};

const ConsentRow = ({ label, value, onPress }: ConsentRowProps) => (
  <RowButton activeOpacity={0.85} onPress={onPress}>
    <CheckBox isChecked={value}>
      <CheckMark>{value ? '✓' : ''}</CheckMark>
    </CheckBox>
    <RowText>{label}</RowText>
  </RowButton>
);

const Container = styled.View`
  flex: 1;
  background-color: ${KINETIC_COLORS.background};
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding: 20px 24px 40px;
`;

const TopBar = styled.View`
  min-height: 44px;
  justify-content: center;
`;

const BackButton = styled.TouchableOpacity`
  align-self: flex-start;
  padding: 10px 0;
`;

const BackButtonText = styled.Text`
  color: ${KINETIC_COLORS.onSurfaceVariant};
  font-family: 'SpoqaHanSansNeo-Bold';
  font-size: 14px;
`;

const Header = styled(Animated.View)`
  margin-top: 32px;
  margin-bottom: 28px;
`;

const Eyebrow = styled.Text`
  color: ${KINETIC_COLORS.primary};
  font-family: 'SpoqaHanSansNeo-Bold';
  font-size: 12px;
  letter-spacing: 2px;
`;

const Title = styled.Text`
  color: ${KINETIC_COLORS.onSurface};
  font-family: 'SpoqaHanSansNeo-Bold';
  font-size: 33px;
  line-height: 41px;
  margin-top: 14px;
`;

const Subtitle = styled.Text`
  color: ${KINETIC_COLORS.onSurfaceVariant};
  font-family: 'SpoqaHanSansNeo-Regular';
  font-size: 15px;
  line-height: 22px;
  margin-top: 12px;
`;

const ConsentCard = styled(Animated.View)`
  padding: 24px;
  border-radius: 28px;
  background-color: ${KINETIC_COLORS.surfaceVariant};
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`;

const AccountPreview = styled.View`
  padding: 16px;
  border-radius: 18px;
  background-color: rgba(204, 255, 0, 0.1);
  margin-bottom: 20px;
`;

const PreviewLabel = styled.Text`
  color: ${KINETIC_COLORS.onSurfaceVariant};
  font-family: 'SpoqaHanSansNeo-Regular';
  font-size: 12px;
`;

const PreviewEmail = styled.Text`
  color: ${KINETIC_COLORS.onSurface};
  font-family: 'SpoqaHanSansNeo-Bold';
  font-size: 16px;
  margin-top: 4px;
`;

const AllRow = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 4px 0;
`;

const AllText = styled.Text`
  color: ${KINETIC_COLORS.onSurface};
  font-family: 'SpoqaHanSansNeo-Bold';
  font-size: 18px;
  margin-left: 12px;
`;

const Divider = styled.View`
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 20px 0;
`;

const RowButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
`;

const CheckBox = styled.View<{ isChecked: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: ${props =>
    props.isChecked ? KINETIC_COLORS.primary : KINETIC_COLORS.outline};
  background-color: ${props =>
    props.isChecked ? KINETIC_COLORS.primary : 'transparent'};
`;

const CheckMark = styled.Text`
  color: #000000;
  font-family: 'SpoqaHanSansNeo-Bold';
  font-size: 14px;
`;

const RowText = styled.Text`
  flex: 1;
  color: ${KINETIC_COLORS.onSurface};
  font-family: 'SpoqaHanSansNeo-Regular';
  font-size: 14px;
  line-height: 20px;
  margin-left: 12px;
`;

const Notice = styled.Text`
  color: ${KINETIC_COLORS.onSurfaceVariant};
  font-family: 'SpoqaHanSansNeo-Regular';
  font-size: 12px;
  line-height: 18px;
  margin-top: 12px;
`;

const PrimaryButton = styled.TouchableOpacity<{ isDisabled: boolean }>`
  height: 58px;
  align-items: center;
  justify-content: center;
  border-radius: 29px;
  background-color: ${props =>
    props.isDisabled ? 'rgba(204, 255, 0, 0.35)' : KINETIC_COLORS.primary};
  margin-top: 24px;
`;

const ButtonText = styled.Text`
  color: #000000;
  font-family: 'SpoqaHanSansNeo-Bold';
  font-size: 17px;
`;

export default TermsConsentScreen;
