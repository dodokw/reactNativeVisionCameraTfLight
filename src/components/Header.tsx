import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { Colors } from '../tools/Colors';
import { TextB, TextR } from '../tools/fonts';

export const Header = () => {
  return (
    <Container>
      <SubContainer>
        <TextB size={16}>간짜장이생각나는둘리</TextB>
      </SubContainer>
    </Container>
  );
};

const Container = styled(View)`
  padding-top: 20px;
`;

const SubContainer = styled(View)`
  height: 56px;
  justify-content: flex-end;
`;

const Title = styled(Text)`
  font-size: 24px;
  color: #333;
`;
