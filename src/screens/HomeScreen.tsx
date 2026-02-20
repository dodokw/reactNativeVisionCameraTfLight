import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import styled from 'styled-components/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setFirstLaunch } from '../store/slices/appSlice';

import { BouncyButton } from '../components/BouncyButton';

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: #f5f5f5;
  align-items: center;
  justify-content: center;
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
`;

const InfoText = styled(Text)`
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
`;

const StyledButtonContent = styled.View`
  background-color: #007bff;
  padding: 12px 24px;
  border-radius: 8px;
`;

const ButtonText = styled(Text)`
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
`;

export const HomeScreen = () => {
  const isFirstLaunch = useSelector(
    (state: RootState) => state.app.isFirstLaunch,
  );
  const dispatch = useDispatch<AppDispatch>();

  const toggleFirstLaunch = () => {
    dispatch(setFirstLaunch(!isFirstLaunch));
  };

  return (
    <Container>
      <Title>TFLite & Redux App</Title>
      <InfoText>First Launch State: {isFirstLaunch ? 'Yes' : 'No'}</InfoText>

      <BouncyButton onPress={toggleFirstLaunch}>
        <StyledButtonContent>
          <ButtonText>Toggle State (Test Persist)</ButtonText>
        </StyledButtonContent>
      </BouncyButton>
    </Container>
  );
};
