import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import styled from 'styled-components/native';

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
`;

export const SettingsScreen = () => {
  return (
    <Container>
      <Title>Settings Screen</Title>
    </Container>
  );
};
