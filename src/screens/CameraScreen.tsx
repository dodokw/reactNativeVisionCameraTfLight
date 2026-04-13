import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useModel } from '../contexts/ModelContext';
import styled from 'styled-components/native';
import { useFocusEffect } from '@react-navigation/native';
import { PoseOverlay, Keypoint } from '../components/PoseOverlay';

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

const OverlayContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const InfoBadge = styled.View`
  position: absolute;
  top: 60px;
  left: 20px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  padding: 10px 16px;
`;

const InfoText = styled.Text`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
`;

const PushUpBadge = styled.View`
  position: absolute;
  top: 60px;
  right: 20px;
  background-color: rgba(76, 175, 80, 0.85);
  border-radius: 16px;
  padding: 12px 20px;
  align-items: center;
`;

const PushUpCount = styled.Text`
  color: #fff;
  font-size: 28px;
  font-weight: bold;
`;

const PushUpLabel = styled.Text`
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
`;

// 모델 입력 크기: 576×320 (9:16 세로 비율)
const MODEL_INPUT_HEIGHT = 576;
const MODEL_INPUT_WIDTH = 320;

export const CameraScreen = () => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  // iOS/Android 모두 640×480 (4:3)로 통일하여 스켈레톤 매핑 일관성 확보
  const format = useCameraFormat(device, [
    { videoResolution: { width: 640, height: 480 } },
  ]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { model } = useModel();
  const { resize } = useResizePlugin();

  const lastLogTime = useSharedValue(0);
  const pushUpCount = useSharedValue(0);
  const pushUpState = useSharedValue('UNKNOWN');

  const [active, setActive] = useState(false);
  const [currentKeypoints, setCurrentKeypoints] = useState<Keypoint[] | null>(
    null,
  );
  const [displayPushUpCount, setDisplayPushUpCount] = useState(0);
  const [detectionState, setDetectionState] = useState<string>('대기 중...');
  const [needsMirror, setNeedsMirror] = useState(true);

  // Worklet → JS 스레드로 안전하게 데이터를 전달하기 위한 bridge 함수
  const updateKeypoints = useMemo(
    () => Worklets.createRunOnJS(setCurrentKeypoints),
    [],
  );
  const updateDetectionState = useMemo(
    () => Worklets.createRunOnJS(setDetectionState),
    [],
  );
  const updatePushUpCount = useMemo(
    () => Worklets.createRunOnJS(setDisplayPushUpCount),
    [],
  );
  const updateNeedsMirror = useMemo(
    () => Worklets.createRunOnJS(setNeedsMirror),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      if (!hasPermission) {
        requestPermission();
      }
      setActive(true);
      return () => {
        setActive(false);
        setCurrentKeypoints(null);
      };
    }, [hasPermission, requestPermission]),
  );

  React.useEffect(() => {
    if (model) {
      console.log('Model type:', typeof model);
      console.log('Model keys:', Object.keys(model));
      try {
        console.log('Model delegate:', model.delegate);
      } catch (e) {
        console.error('Error accessing model.delegate:', e);
      }
    }
  }, [model]);

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      if (model == null) return;

      // 추론 빈도 제한: 100ms (약 10FPS)
      const currentTime = Date.now();
      if (currentTime - lastLogTime.value < 200) return;
      // console.log('Frame processor called', model);

      const calculateAngle = (a: any, b: any, c: any) => {
        const radians =
          Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) {
          angle = 360.0 - angle;
        }
        return angle;
      };

      try {
        // frame.orientation 기반 리사이즈 전략
        const orientation = frame.orientation;
        const isLandscape =
          orientation === 'landscape-left' || orientation === 'landscape-right';

        // 전면 카메라 프리뷰는 항상 좌우 반전(거울)으로 표시됨
        updateNeedsMirror(true);

        // 회전 방향 결정
        const rotationMap: Record<string, '90deg' | '180deg' | '270deg'> = {
          'landscape-right': '90deg', // iOS 전면 카메라
          'landscape-left': '270deg', // Android 전면 카메라
          'portrait-upside-down': '180deg',
        };
        const rotation = rotationMap[orientation];

        // landscape-right(iOS)는 90° 회전 시 좌우가 반전되므로 mirror로 보정
        // → Android(270°)와 동일한 방향의 이미지를 모델에 전달
        const needsImageMirror = orientation === 'landscape-right';

        const resized = resize(frame, {
          scale: isLandscape
            ? { width: MODEL_INPUT_HEIGHT, height: MODEL_INPUT_WIDTH }
            : { width: MODEL_INPUT_WIDTH, height: MODEL_INPUT_HEIGHT },
          ...(rotation && { rotation }),
          ...(needsImageMirror && { mirror: true }),
          pixelFormat: 'rgb',
          dataType: 'float32',
        });

        // Run inference synchronously
        // return;
        const outputs = model.runSync([resized]);

        if (outputs[0]) {
          const flatOutput = outputs[0];

          const NUM_BOXES = 300;
          const NUM_FEATURES = 57;

          let bestConf = 0;
          let bestBox: any = null;

          for (let i = 0; i < NUM_BOXES; i++) {
            const offset = i * NUM_FEATURES;
            const conf = flatOutput[offset + 4];

            if (conf > bestConf && conf > 0.5) {
              bestConf = conf;
              const keypoints = [];
              const KP_START_IDX = 6;
              for (let k = 0; k < 17; k++) {
                const kpOffset = offset + KP_START_IDX + k * 3;
                keypoints.push({
                  x: flatOutput[kpOffset],
                  y: flatOutput[kpOffset + 1],
                  score: flatOutput[kpOffset + 2],
                });
              }
              bestBox = { conf, keypoints };
            }
          }

          if (bestBox) {
            const kpData = bestBox.keypoints.map((kp: any) => ({
              x: kp.x,
              y: kp.y,
              score: kp.score,
            }));
            // Worklet → JS 스레드로 키포인트 데이터 전달
            updateKeypoints(kpData);
            updateDetectionState(
              `감지됨 (${(bestBox.conf * 100).toFixed(0)}%)`,
            );

            // 왼쪽 팔 관절 (5: 왼쪽 어깨, 7: 왼쪽 팔꿈치, 9: 왼쪽 손목)
            const leftShoulder = bestBox.keypoints[5];
            const leftElbow = bestBox.keypoints[7];
            const leftWrist = bestBox.keypoints[9];

            if (
              leftShoulder.score > 0.5 &&
              leftElbow.score > 0.5 &&
              leftWrist.score > 0.5
            ) {
              const angle = calculateAngle(leftShoulder, leftElbow, leftWrist);

              if (angle <= 90) {
                if (pushUpState.value !== 'DOWN') {
                  pushUpState.value = 'DOWN';
                }
              } else if (angle >= 160) {
                if (pushUpState.value === 'DOWN') {
                  pushUpState.value = 'UP';
                  pushUpCount.value += 1;
                  updatePushUpCount(pushUpCount.value);
                } else if (pushUpState.value !== 'UP') {
                  pushUpState.value = 'UP';
                }
              }
            }
          } else {
            updateKeypoints(null);
            updateDetectionState('사람 없음');
          }
        }

        lastLogTime.value = currentTime;
      } catch (e) {
        console.error('Frame Processor Error:', e);
      }
    },
    [
      model,
      updateKeypoints,
      updateDetectionState,
      updatePushUpCount,
      updateNeedsMirror,
    ],
  );

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
    <Container>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={active}
        frameProcessor={frameProcessor}
      />

      {/* 🦴 Pose Skeleton Overlay */}
      <OverlayContainer pointerEvents="none">
        <PoseOverlay
          keypoints={currentKeypoints ?? []}
          width={screenWidth}
          height={screenHeight}
          isFrontCamera={needsMirror}
          confidenceThreshold={0.3}
          showLabels={true}
        />
      </OverlayContainer>

      {/* 상태 배지 */}
      <InfoBadge>
        <InfoText>{detectionState}</InfoText>
      </InfoBadge>

      {/* 팔굽혀펴기 카운트 배지 */}
      {displayPushUpCount > 0 && (
        <PushUpBadge>
          <PushUpCount>{displayPushUpCount}</PushUpCount>
          <PushUpLabel>PUSH-UPS</PushUpLabel>
        </PushUpBadge>
      )}
    </Container>
  );
};
