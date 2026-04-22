import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
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
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { PoseOverlay, Keypoint } from '../components/PoseOverlay';
import { RppgVitalsHud } from '../components/RppgVitalsHud';
import { Colors } from '../tools/Colors';
import { TextB, TextR } from '../tools/fonts';
import { fallbackExercises } from '../data/exerciseCatalog';
import type { NoTabStackParamList } from '../navigation/types';
import { addCompletedWorkout } from '../store/slices/activitySlice';
import { parseCalories } from '../utils/activityCalories';
import type { ExerciseRepState } from '../utils/exerciseCounters';
import {
  countExerciseRep,
  getCountableExerciseId,
  getExerciseCounterGuide,
} from '../utils/exerciseCounters';
import {
  processRppgOutput,
  resetBvpHistory,
} from '../utils/rppgSignalProcessing';
import type { RppgVitals } from '../utils/rppgSignalProcessing';

const KINETIC_COLORS = Colors.kinetic;

const Container = styled.View`
  flex: 1;
  background-color: ${KINETIC_COLORS.background};
  justify-content: center;
  align-items: center;
`;

const MessageCard = styled.View`
  width: 84%;
  padding: 28px 22px;
  border-radius: 24px;
  background-color: ${KINETIC_COLORS.surface};
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.08);
`;

const MessageEyebrow = styled.View`
  align-self: flex-start;
  padding-horizontal: 10px;
  padding-vertical: 6px;
  border-radius: 999px;
  background-color: rgba(204, 255, 0, 0.1);
  margin-bottom: 14px;
`;

const MessageDescription = styled(TextR)`
  margin-top: 10px;
  line-height: 21px;
`;

const OverlayContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const CameraShade = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  background-color: rgba(0, 0, 0, 0.28);
`;

const TopHud = styled.View`
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
`;

const TitleRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
`;

const TitleBlock = styled.View`
  flex: 1;
  padding-right: 14px;
`;

const LivePill = styled.View`
  flex-direction: row;
  align-items: center;
  padding-horizontal: 12px;
  padding-vertical: 8px;
  border-radius: 999px;
  background-color: rgba(204, 255, 0, 0.14);
  border-width: 1px;
  border-color: rgba(204, 255, 0, 0.32);
`;

const LiveDot = styled.View`
  width: 7px;
  height: 7px;
  border-radius: 4px;
  margin-right: 7px;
  background-color: ${KINETIC_COLORS.primary};
`;

const HudMetrics = styled.View`
  flex-direction: row;
  align-items: stretch;
  margin-top: 18px;
`;

const HudCard = styled.View`
  flex: 1;
  min-height: 74px;
  padding: 13px 14px;
  border-radius: 18px;
  background-color: rgba(26, 25, 25, 0.76);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.08);
`;

const CountCard = styled(HudCard)`
  flex: 0.78;
  margin-left: 10px;
  background-color: rgba(204, 255, 0, 0.9);
  border-color: rgba(204, 255, 0, 0.9);
`;

const BottomCoachPanel = styled.View`
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 0;
  padding: 16px 16px 18px;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  background-color: rgba(14, 14, 14, 0.84);
  border-width: 1px;
  border-bottom-width: 0;
  border-color: rgba(255, 255, 255, 0.08);
`;

const CoachHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const ProgressTrack = styled.View`
  height: 6px;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.12);
  overflow: hidden;
`;

const ProgressFill = styled.View`
  width: 42%;
  height: 100%;
  border-radius: 3px;
  background-color: ${KINETIC_COLORS.primary};
`;

const GuideRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 12px;
`;

const GuideDot = styled.View`
  width: 5px;
  height: 5px;
  border-radius: 3px;
  margin-right: 8px;
  background-color: ${KINETIC_COLORS.primary};
`;

const CameraTitle = styled(TextB)`
  margin-top: 6px;
`;

const HudValue = styled(TextB)`
  margin-top: 7px;
`;

const CountValue = styled(TextB)`
  margin-top: 3px;
`;

const CoachTitle = styled(TextB)`
  flex: 1;
  margin-right: 12px;
`;

const GuideText = styled(TextR)`
  flex: 1;
  line-height: 19px;
`;

const CompleteWorkoutButton = styled.TouchableOpacity`
  min-height: 48px;
  border-radius: 16px;
  margin-top: 16px;
  justify-content: center;
  align-items: center;
  background-color: ${KINETIC_COLORS.primary};
`;

const DEFAULT_REP_GOAL = 20;

// 모델 입력 크기: 576×320 (9:16 세로 비율)
const MODEL_INPUT_HEIGHT = 576;
const MODEL_INPUT_WIDTH = 320;

// rPPG/TSCAN 입력: float32 [1, 576, 320, 3, 10].
// Pose 모델과 동일한 해상도(576×320)를 사용하므로 resize 결과를 공유.
const RPPG_FRAME_COUNT = 10;
const RPPG_FRAME_VALUES = MODEL_INPUT_HEIGHT * MODEL_INPUT_WIDTH * 3;
const RPPG_BATCH_VALUES = RPPG_FRAME_COUNT * RPPG_FRAME_VALUES;
const RPPG_SAMPLE_INTERVAL_MS = 250; // 4Hz
const RPPG_POSE_SKIP_MODULO = 3;
const RPPG_DEBUG_LOGGING = false;

// ── YOLO output 상수 ──────────────────────────────────────────────
const NUM_BOXES = 300;
const NUM_FEATURES = 57;
const KP_START_IDX = 6;
const CONF_THRESHOLD = 0.5;

// UI 폴링 주기 (ms) — React 리렌더 빈도 제어
// 이 값을 높이면 메모리 사용량 감소, 스켈레톤 업데이트 느려짐
const UI_POLL_INTERVAL_MS = 250; // ~4FPS 렌더링

export const CameraScreen = () => {
  const dispatch = useDispatch();
  const route = useRoute<RouteProp<NoTabStackParamList, 'Camera'>>();
  const sessionStartedAtRef = useRef<number | null>(null);
  const workoutExerciseIds = route.params.exerciseIds;
  const activeExerciseId =
    getCountableExerciseId(workoutExerciseIds) ?? workoutExerciseIds[0];
  const activeExercise =
    fallbackExercises.find(exercise => exercise.id === activeExerciseId) ??
    fallbackExercises[0];
  const counterGuide = getExerciseCounterGuide(activeExerciseId);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const format = useCameraFormat(device, [
    { videoResolution: { width: 640, height: 480 } },
  ]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { model, rppgModel } = useModel();
  const { resize } = useResizePlugin();

  const lastLogTime = useSharedValue(0);
  // ⚠️ SharedValue는 Float32Array를 지원하지 않음!
  //    → 배치 버퍼는 worklet global에 유지 (아래 frame processor 참조)
  const rppgFrameSlot = useSharedValue(0);
  const rppgLastCollectTime = useSharedValue(0);
  const repCount = useSharedValue(0);
  const repState = useSharedValue('UNKNOWN');
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
  const [displayRepCount, setDisplayRepCount] = useState(0);
  const [detectionState, setDetectionState] = useState<string>('대기 중...');
  const [rppgVitals, setRppgVitals] = useState<RppgVitals | null>(null);
  const [rppgFrameProgress, setRppgFrameProgress] = useState('대기 중');

  const completeWorkout = useCallback(() => {
    if (displayRepCount <= 0) {
      Alert.alert(
        '운동 기록',
        '반복 횟수가 1회 이상일 때 완료로 기록할 수 있어요.',
      );
      return;
    }

    const baseCalories = parseCalories(activeExercise.calories);
    const calories = Math.max(
      1,
      Math.round(
        baseCalories * Math.min(displayRepCount / DEFAULT_REP_GOAL, 1),
      ),
    );
    const durationSeconds = Math.max(
      1,
      Math.round(
        (Date.now() - (sessionStartedAtRef.current ?? Date.now())) / 1000,
      ),
    );

    dispatch(
      addCompletedWorkout({
        id: `${Date.now()}-${activeExercise.id}`,
        exerciseId: activeExercise.id,
        exerciseName: activeExercise.name,
        completedAt: new Date().toISOString(),
        calories,
        reps: displayRepCount,
        durationSeconds,
        source: 'camera',
      }),
    );

    repCount.value = 0;
    repState.value = 'UNKNOWN';
    sessionStartedAtRef.current = Date.now();
    setDisplayRepCount(0);

    Alert.alert(
      '운동 완료',
      `${activeExercise.name} ${displayRepCount}회를 기록했어요.`,
    );
  }, [activeExercise, dispatch, displayRepCount, repCount, repState]);

  // 반복 카운트만 즉시 전달 (빈도 낮음 — 운동 1회가 완성될 때만)
  const updateRepCount = useMemo(
    () => Worklets.createRunOnJS(setDisplayRepCount),
    [],
  );
  const updateRppgFrameProgress = useMemo(
    () => Worklets.createRunOnJS(setRppgFrameProgress),
    [],
  );
  const updateRppgVitals = useMemo(
    () =>
      Worklets.createRunOnJS((rawValues: number[]) => {
        const vitals = processRppgOutput(rawValues);
        if (vitals) {
          setRppgVitals(vitals);
        }
      }),
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
      sessionStartedAtRef.current = Date.now();
      setActive(true);
      return () => {
        setActive(false);
        sessionStartedAtRef.current = null;
        setCurrentKeypoints(null);
        setRppgVitals(null);
        setRppgFrameProgress('대기 중');
        resetBvpHistory();
        rppgFrameSlot.value = 0;
      };
    }, [hasPermission, requestPermission, rppgFrameSlot]),
  );

  React.useEffect(() => {
    if (model) {
      console.log('Pose model type:', typeof model);
      console.log('Pose model keys:', Object.keys(model));
      try {
        console.log('Pose model delegate:', model.delegate);
        console.log('Pose model inputs:', model.inputs);
        console.log('Pose model outputs:', model.outputs);
      } catch (e) {
        console.error('Error accessing pose model metadata:', e);
      }
    }
  }, [model]);

  React.useEffect(() => {
    if (rppgModel) {
      console.log('rPPG model type:', typeof rppgModel);
      console.log('rPPG model keys:', Object.keys(rppgModel));
      try {
        console.log('rPPG model delegate:', rppgModel.delegate);
        console.log('rPPG model inputs:', rppgModel.inputs);
        console.log('rPPG model outputs:', rppgModel.outputs);
      } catch (e) {
        console.error('Error accessing rPPG model metadata:', e);
      }
    }
  }, [rppgModel]);

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      if (model == null) return;

      // 추론 빈도 제한: 200ms (약 5FPS)
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

        // ── rPPG 연속 수집 ─────────────────────────────────────
        // 전략: 250ms 간격으로 10프레임 배치를 계속 수집 (4Hz)
        //       → 배치가 찰 때만 rPPG 추론
        //       → 수집 프레임 일부는 Pose를 쉬게 해 순간 부하를 낮춤
        // 이유: rPPG 모델은 BVP 신호를 추출하려면
        //       최소 4Hz (Nyquist → 2Hz = 120BPM) 샘플 레이트 필요.
        //       중간에 5초 쿨다운을 넣으면 BVP 히스토리가 실제로는
        //       불연속인데 처리 로직은 연속 신호처럼 해석하게 된다.
        // ⚠️ 사람이 감지된 경우에만 rPPG 수집 (노이즈 방지)
        if (rppgModel != null && prevDetected.value) {
          const timeSinceCollect =
            currentTime - rppgLastCollectTime.value;

          if (timeSinceCollect >= RPPG_SAMPLE_INTERVAL_MS) {
            // worklet global에 배치 버퍼 유지 (1회만 할당, ~22MB)
            // @ts-ignore – worklet global
            if (!global.__rppgBatch) {
              // @ts-ignore
              global.__rppgBatch = new Float32Array(RPPG_BATCH_VALUES);
            }
            // @ts-ignore
            const batch: Float32Array = global.__rppgBatch;

            const frameSlot = rppgFrameSlot.value;
            for (let pc = 0; pc < RPPG_FRAME_VALUES; pc++) {
              batch[pc * RPPG_FRAME_COUNT + frameSlot] =
                (resized[pc] as number) / 255;
            }
            rppgLastCollectTime.value = currentTime;

            const nextSlot = frameSlot + 1;
            if (nextSlot >= RPPG_FRAME_COUNT) {
              // 10프레임 수집 완료 → rPPG 추론
              const rppgOutputs = rppgModel.runSync([batch]);
              const firstOutput = rppgOutputs[0];

              // 디버그: 모델 출력 확인
              if (RPPG_DEBUG_LOGGING) {
                console.log(
                  `[rPPG] inference done. outputs: ${rppgOutputs.length}, ` +
                  `first length: ${firstOutput?.length ?? 0}, ` +
                  `sample: [${firstOutput?.slice(0, 5).join(', ')}]`,
                );
              }

              if (firstOutput != null && firstOutput.length > 0) {
                const bvpValues: number[] = [];
                for (let i = 0; i < firstOutput.length; i++) {
                  bvpValues.push(firstOutput[i] as number);
                }
                updateRppgVitals(bvpValues);
                updateRppgFrameProgress('분석 완료');
              } else {
                updateRppgFrameProgress('출력 없음');
              }
              rppgFrameSlot.value = 0;

              // rPPG 추론 프레임만 Pose를 스킵해 CPU/GPU 피크를 줄인다.
              return;
            } else {
              rppgFrameSlot.value = nextSlot;
              if (nextSlot === 1 || nextSlot === 5 || nextSlot === 9) {
                updateRppgFrameProgress(
                  `수집 ${nextSlot}/${RPPG_FRAME_COUNT}`,
                );
              }

              if (nextSlot % RPPG_POSE_SKIP_MODULO === 0) {
                return;
              }
            }
          }
        }

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

          const countResult = countExerciseRep(
            activeExerciseId,
            flat,
            repState.value as ExerciseRepState,
            repCount.value,
          );
          repState.value = countResult.state;

          if (countResult.didCount) {
            repCount.value = countResult.count;
            updateRepCount(repCount.value);
          }
        } else {
          // 사람 없음 → rPPG 데이터도 초기화
          if (prevDetected.value) {
            prevDetected.value = false;
            flatKeypoints.value = [];
            keypointsDirty.value = true;
            detectedState.value = 2;
            // rPPG 프레임 슬롯 리셋 (부분 축적 데이터 폐기)
            rppgFrameSlot.value = 0;
            updateRppgFrameProgress('사람 감지 필요');
          }
        }
      } catch (e: any) {
        const msg = e?.message ?? e?.toString?.() ?? 'unknown error';
        console.error('Frame Processor Error:', msg);
      }
    },
    [
      activeExerciseId,
      model,
      rppgModel,
      rppgFrameSlot,
      rppgLastCollectTime,
      updateRepCount,
      updateRppgFrameProgress,
      updateRppgVitals,
    ],
  );

  if (!hasPermission) {
    return (
      <Container>
        <StatusBar barStyle="light-content" />
        <MessageCard>
          <MessageEyebrow>
            <TextB size={12} color={KINETIC_COLORS.primary}>
              CAMERA ACCESS
            </TextB>
          </MessageEyebrow>
          <TextB size={24} color={KINETIC_COLORS.onSurface}>
            카메라 권한을 확인하고 있어요
          </TextB>
          <MessageDescription size={14} color={KINETIC_COLORS.onSurfaceVariant}>
            자세 감지를 시작하려면 카메라 접근 권한이 필요합니다.
          </MessageDescription>
        </MessageCard>
      </Container>
    );
  }

  if (device == null) {
    return (
      <Container>
        <StatusBar barStyle="light-content" />
        <MessageCard>
          <MessageEyebrow>
            <TextB size={12} color={KINETIC_COLORS.primary}>
              CAMERA READY
            </TextB>
          </MessageEyebrow>
          <TextB size={24} color={KINETIC_COLORS.onSurface}>
            사용할 카메라를 찾지 못했어요
          </TextB>
          <MessageDescription size={14} color={KINETIC_COLORS.onSurfaceVariant}>
            전면 카메라가 연결되어 있는지 확인해주세요.
          </MessageDescription>
        </MessageCard>
      </Container>
    );
  }

  return (
    <Container>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
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

      <CameraShade pointerEvents="none" />

      <TopHud pointerEvents="none">
        <TitleRow>
          <TitleBlock>
            <TextR size={12} color={KINETIC_COLORS.primary}>
              AI CAMERA WORKOUT
            </TextR>
            <CameraTitle size={28} color={KINETIC_COLORS.onSurface}>
              {activeExercise.name} 자세 분석
            </CameraTitle>
          </TitleBlock>

          <LivePill>
            <LiveDot />
            <TextB size={12} color={KINETIC_COLORS.primary}>
              LIVE
            </TextB>
          </LivePill>
        </TitleRow>

        <HudMetrics>
          <HudCard>
            <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
              감지 상태
            </TextR>
            <HudValue size={20} color={KINETIC_COLORS.onSurface}>
              {detectionState}
            </HudValue>
          </HudCard>

          <CountCard>
            <TextR size={12} color="#000000">
              반복 횟수
            </TextR>
            <CountValue size={28} color="#000000">
              {displayRepCount}
            </CountValue>
          </CountCard>
        </HudMetrics>
        <RppgVitalsHud
          vitals={rppgVitals}
          frameProgress={rppgFrameProgress}
        />
      </TopHud>

      <BottomCoachPanel>
        <CoachHeader>
          <CoachTitle size={17} color={KINETIC_COLORS.onSurface}>
            {counterGuide.coachTitle}
          </CoachTitle>
          <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
            10 FPS
          </TextR>
        </CoachHeader>
        <ProgressTrack>
          <ProgressFill />
        </ProgressTrack>
        <GuideRow>
          <GuideDot />
          <GuideText size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            {counterGuide.guideText}
          </GuideText>
        </GuideRow>
        <CompleteWorkoutButton activeOpacity={0.88} onPress={completeWorkout}>
          <TextB size={15} color="#000000">
            운동 완료로 기록
          </TextB>
        </CompleteWorkoutButton>
      </BottomCoachPanel>
    </Container>
  );
};
