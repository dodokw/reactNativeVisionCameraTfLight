import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// ── YOLO output 상수 ──────────────────────────────────────────────
const NUM_BOXES = 300;
const NUM_FEATURES = 57;
const KP_START_IDX = 6;
const CONF_THRESHOLD = 0.5;
const KP_SCORE_THRESHOLD = 0.5;

// UI 폴링 주기 (ms) — React 리렌더 빈도 제어
// 이 값을 높이면 메모리 사용량 감소, 스켈레톤 업데이트 느려짐
const UI_POLL_INTERVAL_MS = 250; // ~4FPS 렌더링

export const CameraScreen = () => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const format = useCameraFormat(device, [
    { videoResolution: { width: 640, height: 480 } },
  ]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { model } = useModel();
  const { resize } = useResizePlugin();

  const lastLogTime = useSharedValue(0);
  const pushUpCount = useSharedValue(0);
  const pushUpState = useSharedValue('UNKNOWN');
  const prevDetected = useSharedValue(false);

  // ── SharedValue 기반 데이터 전달 (직렬화 없음) ─────────────────
  // Worklet에서 flatKeypoints.value에 직접 쓰고,
  // JS 측 setInterval에서 읽어서 React 상태로 변환.
  // → Worklets.createRunOnJS(setState) 호출이 사라지므로
  //   Worklet→JS 간 객체 직렬화 오버헤드가 제거됨.
  const flatKeypoints = useSharedValue<number[]>([]); // [x0,y0,s0, x1,y1,s1, ...]
  const keypointsDirty = useSharedValue(false);
  const detectedState = useSharedValue(0); // 0=no change, 1=detected, 2=lost

  const [active, setActive] = useState(false);
  const [currentKeypoints, setCurrentKeypoints] = useState<Keypoint[] | null>(
    null,
  );
  const [displayPushUpCount, setDisplayPushUpCount] = useState(0);
  const [detectionState, setDetectionState] = useState<string>('대기 중...');

  // 푸시업 카운트만 즉시 전달 (빈도 낮음 — 푸시업할 때만)
  const updatePushUpCount = useMemo(
    () => Worklets.createRunOnJS(setDisplayPushUpCount),
    [],
  );

  // ── JS 측 폴링: SharedValue → React 상태 ──────────────────────
  // Worklet→JS 직렬화 대신, JS 타이머가 SharedValue를 주기적으로 읽음.
  // 이렇게 하면:
  // 1. Worklet→JS 객체 직렬화 완전 제거 (메모리 누수 원인 제거)
  // 2. React 리렌더 빈도를 정확히 제어 가능
  // 3. Worklet은 추론에만 집중, JS는 UI에만 집중
  useEffect(() => {
    if (!active) return;

    const intervalId = setInterval(() => {
      // 감지 상태 변경 확인
      const stateFlag = detectedState.value;
      if (stateFlag === 1) {
        setDetectionState('감지됨');
        detectedState.value = 0;
      } else if (stateFlag === 2) {
        setDetectionState('사람 없음');
        detectedState.value = 0;
      }

      // 키포인트 데이터 확인
      if (!keypointsDirty.value) return;
      keypointsDirty.value = false;

      const flat = flatKeypoints.value;
      if (!flat || flat.length === 0) {
        setCurrentKeypoints(null);
        return;
      }

      // flat array → Keypoint[] 변환 (JS 스레드에서 수행)
      const kps: Keypoint[] = [];
      for (let i = 0; i < flat.length; i += 3) {
        kps.push({
          x: flat[i]!,
          y: flat[i + 1]!,
          score: flat[i + 2]!,
        });
      }
      setCurrentKeypoints(kps);
    }, UI_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [active, flatKeypoints, keypointsDirty, detectedState]);

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

      // 추론 빈도 제한: 250ms (약 5FPS)
      const currentTime = Date.now();
      if (currentTime - lastLogTime.value < 250) return;
      lastLogTime.value = currentTime;

      try {
        const orientation = frame.orientation;
        const isLandscape =
          orientation === 'landscape-left' || orientation === 'landscape-right';

        let rotation: '90deg' | '180deg' | '270deg' | undefined;
        if (orientation === 'landscape-right') {
          rotation = '90deg';
        } else if (orientation === 'landscape-left') {
          rotation = '270deg';
        } else if (orientation === 'portrait-upside-down') {
          rotation = '180deg';
        }

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
        
        const outputs = model.runSync([resized]);
        
        const flatOutput = outputs[0];
        if (!flatOutput) return;

        // 최고 신뢰도 박스 탐색
        let bestConf = 0;
        let bestBoxIdx = -1;

        for (let i = 0; i < NUM_BOXES; i++) {
          const conf = flatOutput[i * NUM_FEATURES + 4];
          if (conf > bestConf && conf > CONF_THRESHOLD) {
            bestConf = conf;
            bestBoxIdx = i;
          }
        }

        if (bestBoxIdx >= 0) {
          const baseOffset = bestBoxIdx * NUM_FEATURES;

          // 키포인트를 flat array로 직접 추출 — 객체 생성 없음
          const flat: number[] = [];
          for (let k = 0; k < 17; k++) {
            const kpOffset = baseOffset + KP_START_IDX + k * 3;
            flat.push(
              flatOutput[kpOffset] as number,
              flatOutput[kpOffset + 1] as number,
              flatOutput[kpOffset + 2] as number,
            );
          }

          // SharedValue에 직접 쓰기 — 직렬화 없음!
          flatKeypoints.value = flat;
          keypointsDirty.value = true;

          // 감지 상태 변경 시에만 플래그 설정
          if (!prevDetected.value) {
            prevDetected.value = true;
            detectedState.value = 1;
          }

          // 푸시업 각도 계산 (flat array에서 직접 읽기)
          // left_shoulder(5), left_elbow(7), left_wrist(9)
          const lsScore = flat[5 * 3 + 2]!;
          const leScore = flat[7 * 3 + 2]!;
          const lwScore = flat[9 * 3 + 2]!;

          if (
            lsScore > KP_SCORE_THRESHOLD &&
            leScore > KP_SCORE_THRESHOLD &&
            lwScore > KP_SCORE_THRESHOLD
          ) {
            const lsX = flat[5 * 3]!, lsY = flat[5 * 3 + 1]!;
            const leX = flat[7 * 3]!, leY = flat[7 * 3 + 1]!;
            const lwX = flat[9 * 3]!, lwY = flat[9 * 3 + 1]!;

            const radians =
              Math.atan2(lwY - leY, lwX - leX) -
              Math.atan2(lsY - leY, lsX - leX);
            let angle = Math.abs((radians * 180.0) / Math.PI);
            if (angle > 180.0) {
              angle = 360.0 - angle;
            }

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
          // 사람 없음
          if (prevDetected.value) {
            prevDetected.value = false;
            flatKeypoints.value = [];
            keypointsDirty.value = true;
            detectedState.value = 2;
          }
        }
      } catch (e) {
        console.error('Frame Processor Error:', e);
      }
    },
    [model, updatePushUpCount],
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
          isFrontCamera={true}
          confidenceThreshold={0.3}
          showLabels={false}
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
