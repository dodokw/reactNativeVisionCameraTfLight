import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  background-color: #000;
  justify-content: center;
  align-items: center;
`;

const MessageText = styled.Text`
  color: #fff;
  font-size: 18px;
`;

export const CameraScreen = () => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <Container>
        <MessageText>Waiting for camera permission...</MessageText>
      </Container>
    );
  }

  if (device == null) {
    return (
      <Container>
        <MessageText>No Camera Device Found</MessageText>
      </Container>
    );
  }

  return (
    <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
  );
};
