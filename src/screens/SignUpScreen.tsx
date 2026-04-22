import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import { Colors } from '../tools/Colors';
import { LoginStackParamList } from '../navigation/types';

const KINETIC_COLORS = Colors.kinetic;
const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
});

type SignUpScreenProps = NativeStackScreenProps<LoginStackParamList, 'SignUp'>;

const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordHint = useMemo(() => {
    if (!password) {
      return 'Use at least 6 characters.';
    }

    if (password.length < 6) {
      return 'Password is too short.';
    }

    if (confirmPassword && password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return 'Password looks ready.';
  }, [confirmPassword, password]);

  const handleContinue = () => {
    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();
    const isEmailValid = /\S+@\S+\.\S+/.test(trimmedEmail);

    if (!trimmedEmail || !password || !confirmPassword) {
      Alert.alert('Create account', 'Please fill in all required fields.');
      return;
    }

    if (!isEmailValid) {
      Alert.alert('Create account', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Create account', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Create account', 'Please confirm the same password.');
      return;
    }

    navigation.navigate('TermsConsent', {
      email: trimmedEmail,
      password,
      nickname: trimmedNickname || trimmedEmail.split('@')[0],
    });
  };

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollContent keyboardShouldPersistTaps="handled">
          <TopBar>
            <BackButton onPress={() => navigation.goBack()}>
              <BackButtonText>Back</BackButtonText>
            </BackButton>
          </TopBar>

          <Hero entering={FadeInDown.duration(800).springify()}>
            <Eyebrow>CREATE ACCOUNT</Eyebrow>
            <Title>Build your training profile.</Title>
            <Subtitle>
              Email sign up keeps your AI fitness history synced and ready.
            </Subtitle>
          </Hero>

          <FormCard entering={FadeInDown.duration(800).delay(120).springify()}>
            <InputGroup>
              <Label>Nickname</Label>
              <StyledInput
                placeholder="e.g. Alex"
                placeholderTextColor={KINETIC_COLORS.onSurfaceVariant}
                value={nickname}
                onChangeText={setNickname}
                returnKeyType="next"
              />
            </InputGroup>

            <InputGroup>
              <Label>Email</Label>
              <StyledInput
                placeholder="you@example.com"
                placeholderTextColor={KINETIC_COLORS.onSurfaceVariant}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </InputGroup>

            <InputGroup>
              <Label>Password</Label>
              <StyledInput
                placeholder="Enter password"
                placeholderTextColor={KINETIC_COLORS.onSurfaceVariant}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
              />
            </InputGroup>

            <InputGroup>
              <Label>Confirm Password</Label>
              <StyledInput
                placeholder="Re-enter password"
                placeholderTextColor={KINETIC_COLORS.onSurfaceVariant}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType="done"
              />
              <Hint>{passwordHint}</Hint>
            </InputGroup>

            <PrimaryButton activeOpacity={0.85} onPress={handleContinue}>
              <ButtonText>Continue</ButtonText>
            </PrimaryButton>
          </FormCard>
        </ScrollContent>
      </KeyboardAvoidingView>
    </Container>
  );
};

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

const Hero = styled(Animated.View)`
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
  font-size: 34px;
  line-height: 42px;
  margin-top: 14px;
`;

const Subtitle = styled.Text`
  color: ${KINETIC_COLORS.onSurfaceVariant};
  font-family: 'SpoqaHanSansNeo-Regular';
  font-size: 15px;
  line-height: 22px;
  margin-top: 12px;
`;

const FormCard = styled(Animated.View)`
  padding: 24px;
  border-radius: 28px;
  background-color: ${KINETIC_COLORS.surfaceVariant};
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`;

const InputGroup = styled.View`
  margin-bottom: 18px;
`;

const Label = styled.Text`
  color: ${KINETIC_COLORS.onSurface};
  font-family: 'SpoqaHanSansNeo-Bold';
  font-size: 14px;
  margin-bottom: 8px;
`;

const StyledInput = styled.TextInput`
  height: 56px;
  border-radius: 16px;
  border-width: 1px;
  border-color: ${KINETIC_COLORS.outline};
  background-color: rgba(0, 0, 0, 0.34);
  color: ${KINETIC_COLORS.onSurface};
  font-family: 'SpoqaHanSansNeo-Regular';
  font-size: 15px;
  padding: 0 16px;
`;

const Hint = styled.Text`
  color: ${KINETIC_COLORS.onSurfaceVariant};
  font-family: 'SpoqaHanSansNeo-Regular';
  font-size: 12px;
  margin-top: 8px;
`;

const PrimaryButton = styled.TouchableOpacity`
  height: 58px;
  align-items: center;
  justify-content: center;
  border-radius: 29px;
  background-color: ${KINETIC_COLORS.primary};
  margin-top: 8px;
`;

const ButtonText = styled.Text`
  color: #000000;
  font-family: 'SpoqaHanSansNeo-Bold';
  font-size: 17px;
`;

export default SignUpScreen;
