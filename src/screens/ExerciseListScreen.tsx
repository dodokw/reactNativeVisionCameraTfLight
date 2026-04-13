import React from 'react';
import { View, Image, TextInput } from 'react-native';
import styled from 'styled-components/native';
import { Header } from '../components/Header';
import { Colors } from '../tools/Colors';
import { TextB } from '../tools/fonts';
import { SearchIcon } from '../tools/Svg';

export const ExerciseListScreen = () => {
  return (
    <Container>
      <Header />
      <TextInputContainer>
        <SearchContainer>
          <SearchIcon width={24} height={24} color={Colors.white} />
        </SearchContainer>
        <TextInput style={{ width: '100%', backgroundColor: 'black' }} />
      </TextInputContainer>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center' }}>
          <RoundImage source={require('../assets/image/png/pushUps.png')} />
          <TextB>팔굽혀펴기</TextB>
        </View>
        <View style={{ alignItems: 'center' }}>
          <RoundImage source={require('../assets/image/png/pushUps.png')} />
          <TextB>팔굽혀펴기</TextB>
        </View>
        <View style={{ alignItems: 'center' }}>
          <RoundImage source={require('../assets/image/png/pushUps.png')} />
          <TextB>팔굽혀펴기</TextB>
        </View>
      </View>
    </Container>
  );
};

const Container = styled(View)`
  flex: 1;
  background-color: ${Colors.background};
  padding-horizontal: 20px;
`;

const RoundImage = styled(Image)`
  width: 100px;
  height: 100px;
  border-radius: 50px;
`;

const TextInputContainer = styled(View)`
  width: 100%;
  height: 36px;
  border-radius: 10px;
  background-color: ${Colors.white};
  flex-direction: row;
  margin-vertical: 20px;
  overflow: hidden;
`;

const SearchContainer = styled(View)`
  width: 13%;
  height: 36px;
  border-radius: 10px;
  background-color: ${'red'};
`;
