import React, { useEffect } from 'react';
import { Dimensions, StatusBar } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import { Colors } from '../tools/Colors';
import { LoginStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
const KINETIC_COLORS = Colors.kinetic;

type SplashScreenProps = NativeStackScreenProps<LoginStackParamList, 'Splash'>;

const SplashScreen = ({ navigation }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <Container>
      <StatusBar barStyle="light-content" />
      <Glow entering={FadeIn.duration(900)} />
      <Orb entering={FadeInUp.duration(900).springify()}>
        <OrbText>AI</OrbText>
      </Orb>
      <Content entering={FadeInDown.duration(900).delay(200).springify()}>
        <Eyebrow>VISION TRAINING LAB</Eyebrow>
        <Title>AI FITNESS</Title>
        <Subtitle>Measure your movement. Sharpen every rep.</Subtitle>
      </Content>
      <ProgressTrack>
        <ProgressFill entering={FadeIn.duration(900).delay(600)} />
      </ProgressTrack>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${KINETIC_COLORS.background};
  overflow: hidden;
  padding: 32px;
`;

const Glow = styled(Animated.View)`
  position: absolute;
  top: -120px;
  width: ${width * 1.1}px;
  height: ${width * 1.1}px;
  border-radius: ${width * 0.55}px;
  background-color: rgba(204, 255, 0, 0.12);
`;

const Orb = styled(Animated.View)`
  width: 128px;
  height: 128px;
  border-radius: 64px;
  align-items: center;
  justify-content: center;
  background-color: ${KINETIC_COLORS.primary};
  shadow-color: ${KINETIC_COLORS.primary};
  shadow-opacity: 0.4;
  shadow-radius: 28px;
  shadow-offset: 0px 14px;
  elevation: 10;
`;

const OrbText = styled.Text`
  color: #000000;
  font-family: 'SpoqaHanSansNeo-Bold';
  font-size: 40px;
  letter-spacing: -2px;
`;

const Content = styled(Animated.View)`
  align-items: center;
  margin-top: 32px;
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
  font-size: 42px;
  margin-top: 12px;
`;

const Subtitle = styled.Text`
  color: ${KINETIC_COLORS.onSurfaceVariant};
  font-family: 'SpoqaHanSansNeo-Regular';
  font-size: 15px;
  line-height: 22px;
  margin-top: 10px;
  text-align: center;
`;

const ProgressTrack = styled.View`
  position: absolute;
  bottom: 64px;
  width: 128px;
  height: 4px;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.12);
  overflow: hidden;
`;

const ProgressFill = styled(Animated.View)`
  width: 74%;
  height: 100%;
  border-radius: 2px;
  background-color: ${KINETIC_COLORS.primary};
`;

export default SplashScreen;
