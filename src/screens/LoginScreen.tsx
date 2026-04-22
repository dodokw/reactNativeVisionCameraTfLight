import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import styled from 'styled-components/native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { Colors } from '../tools/Colors';
import { LoginStackParamList, RootStackNavigation } from '../navigation/types';
import { authApi } from '../api/auth';
import { getApiErrorMessage } from '../api/client';
import { AppDispatch } from '../store';
import { setAuthSession } from '../store/slices/userSlice';

const { width, height } = Dimensions.get('window');

const KINETIC_COLORS = Colors.kinetic;

type LoginScreenProps = NativeStackScreenProps<LoginStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const rootNavigation = navigation.getParent<RootStackNavigation>();

  const getAuthPayload = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert('Auth', 'Please enter your email and password.');
      return null;
    }

    return { email: trimmedEmail, password };
  };

  const navigateToApp = () => {
    rootNavigation?.reset({
      index: 0,
      routes: [{ name: 'TabNavigation' }],
    });
  };

  const handleLogin = async () => {
    const payload = getAuthPayload();

    if (!payload || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authApi.login(payload);

      if (!response.session) {
        Alert.alert('Login failed', 'Unable to create a login session.');
        return;
      }

      dispatch(
        setAuthSession({
          session: response.session,
          profile: response.profile,
        }),
      );
      navigateToApp();
    } catch (error) {
      Alert.alert('Login failed', getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <Container>
      <BackgroundImage
        source={require('../assets/images/fitness_bg.png')}
        resizeMode="cover"
      >
        <Overlay>
          <GlassCard entering={FadeInUp.duration(1000).springify()}>
            <Title>AI FITNESS</Title>
            <Subtitle>Experience Hyper-Performance</Subtitle>

            <InputContainer>
              <Label>Email</Label>
              <StyledInput
                placeholder="Enter your email"
                placeholderTextColor={KINETIC_COLORS.onSurfaceVariant}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </InputContainer>

            <InputContainer>
              <Label>Password</Label>
              <StyledInput
                placeholder="Enter your password"
                placeholderTextColor={KINETIC_COLORS.onSurfaceVariant}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </InputContainer>

            <PrimaryButton
              activeOpacity={0.8}
              disabled={isSubmitting}
              onPress={handleLogin}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <ButtonText>Login</ButtonText>
              )}
            </PrimaryButton>

            <SocialContainer>
              {/* Placeholders for Social Icons */}
              <SocialButton
                onPress={() =>
                  rootNavigation?.navigate('NoTabNavigation', {
                    screen: 'Camera',
                    params: { exerciseIds: ['push-up'] },
                  })
                }
              >
                <SocialButtonText>G</SocialButtonText>
              </SocialButton>
              <SocialButton>
                <SocialButtonText>A</SocialButtonText>
              </SocialButton>
            </SocialContainer>

            <Footer>
              <FooterText>New here? </FooterText>
              <TouchableOpacity disabled={isSubmitting} onPress={handleSignUp}>
                <LinkText>Create Account</LinkText>
              </TouchableOpacity>
            </Footer>
          </GlassCard>
        </Overlay>
      </BackgroundImage>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: ${KINETIC_COLORS.background};
`;

const BackgroundImage = styled.ImageBackground`
  flex: 1;
  width: ${width}px;
  height: ${height}px;
`;

const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const GlassCard = styled(Animated.View)`
  width: 100%;
  padding: 32px 24px;
  border-radius: 24px;
  background-color: ${KINETIC_COLORS.surfaceVariant};
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
  overflow: hidden;
`;

const Title = styled.Text`
  font-size: 32px;
  font-weight: 800;
  color: ${KINETIC_COLORS.onSurface};
  margin-bottom: 8px;
  text-align: center;
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: ${KINETIC_COLORS.onSurfaceVariant};
  margin-bottom: 32px;
  text-align: center;
`;

const InputContainer = styled.View`
  margin-bottom: 16px;
`;

const Label = styled.Text`
  font-size: 14px;
  color: ${KINETIC_COLORS.onSurface};
  margin-bottom: 8px;
  font-weight: 600;
`;

const StyledInput = styled.TextInput`
  width: 100%;
  height: 56px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 0 16px;
  color: #ffffff;
  border-width: 1px;
  border-color: ${KINETIC_COLORS.outline};
`;

const PrimaryButton = styled.TouchableOpacity`
  width: 100%;
  height: 56px;
  background-color: ${KINETIC_COLORS.primary};
  border-radius: 28px;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
`;

const ButtonText = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #000000;
`;

const Footer = styled.View`
  margin-top: 32px;
  flex-direction: row;
  justify-content: center;
`;

const FooterText = styled.Text`
  color: ${KINETIC_COLORS.onSurfaceVariant};
  font-size: 14px;
`;

const LinkText = styled.Text`
  color: ${KINETIC_COLORS.primary};
  font-size: 14px;
  font-weight: 700;
`;

const SocialContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-top: 24px;
  width: 100%;
`;

const SocialButton = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: rgba(255, 255, 255, 0.1);
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.2);
`;

const SocialButtonText = styled.Text`
  color: #ffffff;
  font-weight: 700;
`;

export default LoginScreen;
