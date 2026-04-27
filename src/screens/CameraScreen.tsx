import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { CustomAlertModal } from '../components/CustomAlertModal';
import { PoseOverlay, Keypoint } from '../components/PoseOverlay';
import { RppgVitalsHud } from '../components/RppgVitalsHud';
import { Colors } from '../tools/Colors';
import { TextB, TextR } from '../tools/fonts';
import { fallbackExercises } from '../data/exerciseCatalog';
import type {
  NoTabStackNavigation,
  NoTabStackParamList,
  RootStackNavigation,
} from '../navigation/types';
import type { RootState } from '../store';
import { addCompletedWorkout } from '../store/slices/activitySlice';
import { parseCalories } from '../utils/activityCalories';
import type { ExerciseRepState } from '../utils/exerciseCounters';
import {
  countExerciseRep,
  getExerciseCounterGuide,
} from '../utils/exerciseCounters';
import {
  processRppgSample,
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

const SecondaryActionButton = styled.TouchableOpacity`
  min-height: 48px;
  border-radius: 16px;
  margin-top: 10px;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.16);
  background-color: rgba(255, 255, 255, 0.04);
`;

const DEFAULT_REP_GOAL = 20;
const MEASUREMENT_DURATION_MS = 20000;
const FACE_KEYPOINT_SCORE_THRESHOLD = 0.35;
const FACE_BOX_EXPANSION = 1.8;
const MIN_FACE_BOX_SIZE = 0.18;

// 모델 입력 크기: 576×320 (9:16 세로 비율)
const MODEL_INPUT_HEIGHT = 576;
const MODEL_INPUT_WIDTH = 320;

// CHROM rPPG 입력: 얼굴 crop 36×36의 RGB 평균값.
const RPPG_CROP_SIZE = 36;
const RPPG_SAMPLE_INTERVAL_MS = 100; // ~10Hz 수집 (실제 샘플 시간은 별도 전달)
const RPPG_DEBUG_LOGGING = false;

// ── YOLO output 상수 ──────────────────────────────────────────────
const NUM_BOXES = 300;
const NUM_FEATURES = 57;
const KP_START_IDX = 6;
const CONF_THRESHOLD = 0.5;

// UI 폴링 주기 (ms) — React 리렌더 빈도 제어
// 이 값을 높이면 메모리 사용량 감소, 스켈레톤 업데이트 느려짐
const UI_POLL_INTERVAL_MS = 250; // ~4FPS 렌더링

type CameraPhase =
  | 'pre-ready'
  | 'pre-measuring'
  | 'workout'
  | 'post-ready'
  | 'post-measuring'
  | 'results';
type MeasurementKind = 'pre' | 'post';

type AlertConfig = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

interface FaceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const FACE_KEYPOINT_INDICES = [0, 1, 2, 3, 4];

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function getFaceRectFromKeypoints(flat: number[]): FaceRect | null {
  'worklet';
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  let validCount = 0;

  for (const index of FACE_KEYPOINT_INDICES) {
    const offset = index * 3;
    const x = flat[offset];
    const y = flat[offset + 1];
    const score = flat[offset + 2];

    if (
      x == null ||
      y == null ||
      score == null ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(score) ||
      score < FACE_KEYPOINT_SCORE_THRESHOLD
    ) {
      continue;
    }

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    validCount += 1;
  }

  if (validCount < 3) {
    return null;
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const size = Math.max(maxX - minX, maxY - minY, MIN_FACE_BOX_SIZE);
  const expandedSize = size * FACE_BOX_EXPANSION;
  const half = expandedSize / 2;

  const boxSize = clamp(expandedSize, MIN_FACE_BOX_SIZE, 1);
  const x = clamp(centerX - half, 0, 1 - boxSize);
  const y = clamp(centerY - half, 0, 1 - boxSize);

  if (boxSize <= 0) {
    return null;
  }

  return {x, y, width: boxSize, height: boxSize};
}

function getRppgRoiFromFaceRect(faceRect: FaceRect): FaceRect {
  'worklet';

  const width = faceRect.width * 0.56;
  const height = faceRect.height * 0.46;
  const x = clamp(faceRect.x + faceRect.width * 0.22, 0, 1 - width);
  const y = clamp(faceRect.y + faceRect.height * 0.24, 0, 1 - height);

  return {x, y, width, height};
}

function getFrameCropFromModelRect(
  rect: FaceRect,
  orientation: string,
  frameWidth: number,
  frameHeight: number,
): FaceRect {
  'worklet';

  const isLandscape =
    orientation === 'landscape-left' || orientation === 'landscape-right';
  const scaleWidth = isLandscape ? MODEL_INPUT_HEIGHT : MODEL_INPUT_WIDTH;
  const scaleHeight = isLandscape ? MODEL_INPUT_WIDTH : MODEL_INPUT_HEIGHT;
  const targetAspectRatio = scaleWidth / scaleHeight;
  const frameAspectRatio = frameWidth / frameHeight;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = frameWidth;
  let sourceHeight = frameHeight;

  if (frameAspectRatio > targetAspectRatio) {
    sourceWidth = frameHeight * targetAspectRatio;
    sourceX = (frameWidth - sourceWidth) / 2;
  } else {
    sourceHeight = frameWidth / targetAspectRatio;
    sourceY = (frameHeight - sourceHeight) / 2;
  }

  const mirror = orientation === 'landscape-right';
  const corners = [
    [rect.x, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x, rect.y + rect.height],
    [rect.x + rect.width, rect.y + rect.height],
  ];
  let minX = frameWidth;
  let minY = frameHeight;
  let maxX = 0;
  let maxY = 0;

  for (const corner of corners) {
    let outX = corner[0] as number;
    const outY = corner[1] as number;
    if (mirror) {
      outX = 1 - outX;
    }

    let scaledX = outX * scaleWidth;
    let scaledY = outY * scaleHeight;

    if (orientation === 'landscape-right') {
      scaledX = outY * scaleWidth;
      scaledY = (1 - outX) * scaleHeight;
    } else if (orientation === 'landscape-left') {
      scaledX = (1 - outY) * scaleWidth;
      scaledY = outX * scaleHeight;
    } else if (orientation === 'portrait-upside-down') {
      scaledX = (1 - outX) * scaleWidth;
      scaledY = (1 - outY) * scaleHeight;
    }

    const rawX = sourceX + (scaledX / scaleWidth) * sourceWidth;
    const rawY = sourceY + (scaledY / scaleHeight) * sourceHeight;
    minX = Math.min(minX, rawX);
    minY = Math.min(minY, rawY);
    maxX = Math.max(maxX, rawX);
    maxY = Math.max(maxY, rawY);
  }

  minX = clamp(minX, 0, frameWidth - 1);
  minY = clamp(minY, 0, frameHeight - 1);
  maxX = clamp(maxX, minX + 1, frameWidth);
  maxY = clamp(maxY, minY + 1, frameHeight);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function calculateRgbMeans(source: Float32Array | Uint8Array): number[] {
  'worklet';

  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let i = 0; i + 2 < source.length; i += 3) {
    const r = source[i] as number;
    const g = source[i + 1] as number;
    const b = source[i + 2] as number;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    if (
      !Number.isFinite(r) ||
      !Number.isFinite(g) ||
      !Number.isFinite(b) ||
      luma < 35 ||
      luma > 245
    ) {
      continue;
    }

    red += r;
    green += g;
    blue += b;
    count += 1;
  }

  if (count === 0) {
    return [];
  }

  return [red / count, green / count, blue / count];
}

export const CameraScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NoTabStackNavigation>();
  const rootNavigation = navigation.getParent<RootStackNavigation>();
  const isRppgEnabled = useSelector(
    (state: RootState) => state.app.isRppgEnabled,
  );
  const route = useRoute<RouteProp<NoTabStackParamList, 'Camera'>>();
  const sessionStartedAtRef = useRef<number | null>(null);
  const latestVitalsRef = useRef<RppgVitals | null>(null);
  const workoutExerciseIds = route.params.exerciseIds;
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const activeExerciseId =
    workoutExerciseIds[currentExerciseIndex] ?? workoutExerciseIds[0];
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

  const { model } = useModel();
  const { resize } = useResizePlugin();

  const lastPoseInferenceTime = useSharedValue(0);
  const rppgSampleCount = useSharedValue(0);
  const rppgLastCollectTime = useSharedValue(0);
  const cameraPhaseValue = useSharedValue<CameraPhase>('pre-ready');
  const measurementFaceRect = useSharedValue<number[]>([]);
  const measurementFaceLocked = useSharedValue(false);
  const measurementDeadline = useSharedValue(0);
  const measurementWindowCount = useSharedValue(0);
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
  const [cameraPhase, setCameraPhase] = useState<CameraPhase>('pre-ready');
  const [rppgVitals, setRppgVitals] = useState<RppgVitals | null>(null);
  const [rppgFrameProgress, setRppgFrameProgress] = useState('대기 중');
  const [preMeasurementVitals, setPreMeasurementVitals] =
    useState<RppgVitals | null>(null);
  const [postMeasurementVitals, setPostMeasurementVitals] =
    useState<RppgVitals | null>(null);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const closeAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback((config: Omit<AlertConfig, 'visible'>) => {
    setAlertConfig({
      visible: true,
      ...config,
    });
  }, []);

  const completeWorkout = useCallback(() => {
    if (displayRepCount <= 0) {
      showAlert({
        title: '운동 기록',
        message: '반복 횟수가 1회 이상일 때 완료로 기록할 수 있어요.',
        confirmText: '확인',
        onConfirm: closeAlert,
      });
      return false;
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
    setPreMeasurementVitals(null);
    setPostMeasurementVitals(null);
    latestVitalsRef.current = null;
    return true;
  }, [
    activeExercise,
    closeAlert,
    dispatch,
    displayRepCount,
    repCount,
    repState,
    showAlert,
  ]);

  const startMeasurementPhase = useCallback(
    (kind: MeasurementKind) => {
      const nextPhase: CameraPhase =
        kind === 'pre' ? 'pre-measuring' : 'post-measuring';
      cameraPhaseValue.value = nextPhase;
      measurementFaceRect.value = [];
      measurementFaceLocked.value = false;
      measurementDeadline.value = 0;
      measurementWindowCount.value = 0;
      rppgSampleCount.value = 0;
      rppgLastCollectTime.value = 0;
      prevDetected.value = false;
      latestVitalsRef.current = null;
      setCameraPhase(nextPhase);
      setCurrentKeypoints(null);
      setDetectionState('얼굴 정렬 중');
      setRppgVitals(null);
      setRppgFrameProgress('얼굴 위치 확인 중');
      resetBvpHistory();
    },
    [
      cameraPhaseValue,
      measurementDeadline,
      measurementFaceLocked,
      measurementFaceRect,
      measurementWindowCount,
      prevDetected,
      rppgLastCollectTime,
      rppgSampleCount,
    ],
  );

  const startWorkoutPhase = useCallback(() => {
    cameraPhaseValue.value = 'workout';
    measurementFaceRect.value = [];
    measurementFaceLocked.value = false;
    measurementDeadline.value = 0;
    measurementWindowCount.value = 0;
    rppgSampleCount.value = 0;
    rppgLastCollectTime.value = 0;
    prevDetected.value = false;
    latestVitalsRef.current = null;
    setCameraPhase('workout');
    setCurrentKeypoints(null);
    setDetectionState('운동 자세 분석 중');
    setRppgVitals(null);
    setRppgFrameProgress('운동 중 rPPG 비활성');
  }, [
    cameraPhaseValue,
    measurementDeadline,
    measurementFaceLocked,
    measurementFaceRect,
    measurementWindowCount,
    prevDetected,
    rppgLastCollectTime,
    rppgSampleCount,
  ]);

  const startReadyPhase = useCallback(
    (kind: MeasurementKind) => {
      const nextPhase: CameraPhase = kind === 'pre' ? 'pre-ready' : 'post-ready';
      cameraPhaseValue.value = nextPhase;
      measurementFaceRect.value = [];
      measurementFaceLocked.value = false;
      measurementDeadline.value = 0;
      measurementWindowCount.value = 0;
      rppgSampleCount.value = 0;
      rppgLastCollectTime.value = 0;
      prevDetected.value = false;
      latestVitalsRef.current = null;
      setCameraPhase(nextPhase);
      setCurrentKeypoints(null);
      setDetectionState('측정 대기');
      setRppgVitals(null);
      setRppgFrameProgress('안내 확인 필요');
      resetBvpHistory();
    },
    [
      cameraPhaseValue,
      measurementDeadline,
      measurementFaceLocked,
      measurementFaceRect,
      measurementWindowCount,
      prevDetected,
      rppgLastCollectTime,
      rppgSampleCount,
    ],
  );

  const startResultsPhase = useCallback(() => {
    cameraPhaseValue.value = 'results';
    measurementDeadline.value = 0;
    measurementFaceLocked.value = false;
    measurementFaceRect.value = [];
    measurementWindowCount.value = 0;
    rppgSampleCount.value = 0;
    rppgLastCollectTime.value = 0;
    setCameraPhase('results');
    setCurrentKeypoints(null);
    setDetectionState('측정 완료');
  }, [
    cameraPhaseValue,
    measurementDeadline,
    measurementFaceLocked,
    measurementFaceRect,
    measurementWindowCount,
    rppgLastCollectTime,
    rppgSampleCount,
  ]);

  const prepareExerciseSession = useCallback(() => {
    repCount.value = 0;
    repState.value = 'UNKNOWN';
    prevDetected.value = false;
    flatKeypoints.value = [];
    keypointsDirty.value = false;
    detectedState.value = 0;
    sessionStartedAtRef.current = Date.now();
    setDisplayRepCount(0);
    setCurrentKeypoints(null);
    setRppgVitals(null);
    setPreMeasurementVitals(null);
    setPostMeasurementVitals(null);
    latestVitalsRef.current = null;

    if (isRppgEnabled) {
      startReadyPhase('pre');
      return;
    }

    startWorkoutPhase();
  }, [
    detectedState,
    flatKeypoints,
    isRppgEnabled,
    keypointsDirty,
    prevDetected,
    repCount,
    repState,
    startReadyPhase,
    startWorkoutPhase,
  ]);

  const moveToNextExercise = useCallback(() => {
    closeAlert();
    setCurrentExerciseIndex(prev => prev + 1);
    prepareExerciseSession();
  }, [closeAlert, prepareExerciseSession]);

  const finishWorkoutFlow = useCallback(() => {
    closeAlert();
    rootNavigation?.goBack();
  }, [closeAlert, rootNavigation]);

  // 반복 카운트만 즉시 전달 (빈도 낮음 — 운동 1회가 완성될 때만)
  const updateRepCount = useMemo(
    () => Worklets.createRunOnJS(setDisplayRepCount),
    [],
  );
  const updateMeasurementVitals = useMemo(
    () =>
      Worklets.createRunOnJS((rgbValues: number[]) => {
        const [meanR, meanG, meanB, capturedAtMs] = rgbValues;
        if (
          meanR == null ||
          meanG == null ||
          meanB == null ||
          capturedAtMs == null ||
          !Number.isFinite(meanR) ||
          !Number.isFinite(meanG) ||
          !Number.isFinite(meanB) ||
          !Number.isFinite(capturedAtMs)
        ) {
          return;
        }

        if (RPPG_DEBUG_LOGGING) {
          console.log(
            `[rPPG JS] RGB mean r=${meanR.toFixed(2)}, g=${meanG.toFixed(2)}, b=${meanB.toFixed(2)}`,
          );
        }
        const vitals = processRppgSample(meanR, meanG, meanB, capturedAtMs);
        if (RPPG_DEBUG_LOGGING && vitals) {
          console.log(
            `[rPPG JS] HR=${vitals.heartRate} RR=${vitals.respirationRate} quality=${vitals.signalQuality.toFixed(3)} hasData=${vitals.hasEnoughData}`,
          );
        }
        latestVitalsRef.current = vitals;
        setRppgVitals(vitals);
      }),
    [],
  );
  const finishMeasurement = useMemo(
    () =>
      Worklets.createRunOnJS((kind: MeasurementKind, windowCount: number) => {
        const latestVitals = latestVitalsRef.current;
        if (kind === 'pre') {
          setPreMeasurementVitals(latestVitals);
          setRppgFrameProgress(`측정 완료 · ${windowCount}개 샘플`);
          startWorkoutPhase();
          return;
        }

        setPostMeasurementVitals(latestVitals);
        setRppgFrameProgress(`측정 완료 · ${windowCount}개 샘플`);
        startResultsPhase();
      }),
    [startResultsPhase, startWorkoutPhase],
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

      const phase = cameraPhaseValue.value;
      if (phase === 'pre-measuring' || phase === 'post-measuring') {
        if (!measurementFaceLocked.value) {
          setRppgFrameProgress('얼굴 위치 확인 중');
        } else {
          const remainingMs = Math.max(0, measurementDeadline.value - Date.now());
          const remainingSec = Math.ceil(remainingMs / 1000);
          setRppgFrameProgress(
            `${Math.max(0, remainingSec)}초 남음 · ${rppgSampleCount.value}개 RGB 샘플`,
          );
        }
      }

      // 키포인트 데이터 확인
      if (!keypointsDirty.value) {
        return;
      }
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
  }, [
    active,
    cameraPhaseValue,
    detectedState,
    flatKeypoints,
    keypointsDirty,
    measurementDeadline,
    measurementFaceLocked,
    measurementWindowCount,
    rppgSampleCount,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (!hasPermission) {
        requestPermission();
      }
      setActive(true);
      setCurrentExerciseIndex(0);
      prepareExerciseSession();
      return () => {
        setActive(false);
        sessionStartedAtRef.current = null;
        setCurrentKeypoints(null);
        setRppgVitals(null);
        setPreMeasurementVitals(null);
        setPostMeasurementVitals(null);
        setRppgFrameProgress('대기 중');
        resetBvpHistory();
        latestVitalsRef.current = null;
        setCurrentExerciseIndex(0);
        cameraPhaseValue.value = 'pre-ready';
        measurementDeadline.value = 0;
        measurementFaceLocked.value = false;
        measurementFaceRect.value = [];
        measurementWindowCount.value = 0;
        rppgLastCollectTime.value = 0;
        rppgSampleCount.value = 0;
      };
    }, [
      cameraPhaseValue,
      hasPermission,
      measurementDeadline,
      measurementFaceLocked,
      measurementFaceRect,
      measurementWindowCount,
      prepareExerciseSession,
      requestPermission,
      rppgSampleCount,
      rppgLastCollectTime,
    ]),
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

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      if (model == null) return;
      const currentTime = Date.now();

      try {
        const orientation = frame.orientation;
        const phase = cameraPhaseValue.value;

        if (phase === 'pre-measuring' || phase === 'post-measuring') {
          if (!measurementFaceLocked.value) {
            if (currentTime - lastPoseInferenceTime.value < 200) {
              return;
            }
            lastPoseInferenceTime.value = currentTime;

            const isLandscape =
              orientation === 'landscape-left' ||
              orientation === 'landscape-right';
            let rotation: '90deg' | '180deg' | '270deg' | undefined;
            if (orientation === 'landscape-right') {
              rotation = '90deg';
            } else if (orientation === 'landscape-left') {
              rotation = '270deg';
            } else if (orientation === 'portrait-upside-down') {
              rotation = '180deg';
            }

            const resized = resize(frame, {
              scale: isLandscape
                ? {width: MODEL_INPUT_HEIGHT, height: MODEL_INPUT_WIDTH}
                : {width: MODEL_INPUT_WIDTH, height: MODEL_INPUT_HEIGHT},
              ...(rotation && {rotation}),
              ...(orientation === 'landscape-right' && {mirror: true}),
              pixelFormat: 'rgb',
              dataType: 'float32',
            });

            const outputs = model.runSync([resized]);
            const flatOutput = outputs[0];
            if (!flatOutput) return;

            let bestConf = 0;
            let bestBoxIdx = -1;
            for (let i = 0; i < NUM_BOXES; i++) {
              const conf = flatOutput[i * NUM_FEATURES + 4];
              if (conf > bestConf && conf > CONF_THRESHOLD) {
                bestConf = conf;
                bestBoxIdx = i;
              }
            }

            if (bestBoxIdx < 0) {
              if (prevDetected.value) {
                prevDetected.value = false;
                flatKeypoints.value = [];
                keypointsDirty.value = true;
                detectedState.value = 2;
              }
              measurementFaceLocked.value = false;
              measurementFaceRect.value = [];
              measurementDeadline.value = 0;
              rppgSampleCount.value = 0;
              return;
            }

            const baseOffset = bestBoxIdx * NUM_FEATURES;
            const flat: number[] = [];
            for (let k = 0; k < 17; k++) {
              const kpOffset = baseOffset + KP_START_IDX + k * 3;
              flat.push(
                flatOutput[kpOffset] as number,
                flatOutput[kpOffset + 1] as number,
                flatOutput[kpOffset + 2] as number,
              );
            }

            flatKeypoints.value = flat;
            keypointsDirty.value = true;

            if (!prevDetected.value) {
              prevDetected.value = true;
              detectedState.value = 1;
            }

            const faceRect = getFaceRectFromKeypoints(flat);
            if (faceRect == null) {
              measurementFaceLocked.value = false;
              measurementFaceRect.value = [];
              measurementDeadline.value = 0;
              rppgSampleCount.value = 0;
              return;
            }

            const rppgRect = getRppgRoiFromFaceRect(faceRect);
            measurementFaceRect.value = [
              rppgRect.x,
              rppgRect.y,
              rppgRect.width,
              rppgRect.height,
            ];
            measurementFaceLocked.value = true;
            measurementDeadline.value = currentTime + MEASUREMENT_DURATION_MS;
            measurementWindowCount.value = 0;
            rppgSampleCount.value = 0;
          }

          if (
            measurementDeadline.value > 0 &&
            currentTime >= measurementDeadline.value
          ) {
            const completedWindows = measurementWindowCount.value;
            measurementFaceLocked.value = false;
            measurementFaceRect.value = [];
            measurementDeadline.value = 0;
            measurementWindowCount.value = 0;
            rppgSampleCount.value = 0;
            cameraPhaseValue.value =
              phase === 'pre-measuring' ? 'workout' : 'results';
            finishMeasurement(
              phase === 'pre-measuring' ? 'pre' : 'post',
              completedWindows,
            );
            return;
          }

          if (measurementFaceRect.value.length < 4) {
            return;
          }

          if (currentTime - rppgLastCollectTime.value < RPPG_SAMPLE_INTERVAL_MS) {
            return;
          }
          rppgLastCollectTime.value = currentTime;

          // ── Face crop + RGB mean for CHROM rPPG ──
          // measurementFaceRect는 정규화된 좌표 (0~1)
          // resize plugin의 crop은 프레임 실제 픽셀 좌표를 기대한다
          const fRect = measurementFaceRect.value;
          const cropRect = getFrameCropFromModelRect(
            {
              x: fRect[0] as number,
              y: fRect[1] as number,
              width: fRect[2] as number,
              height: fRect[3] as number,
            },
            orientation,
            frame.width,
            frame.height,
          );
          const cropX = Math.round(cropRect.x);
          const cropY = Math.round(cropRect.y);
          const cropW = Math.round(cropRect.width);
          const cropH = Math.round(cropRect.height);

          let faceRotation: '90deg' | '180deg' | '270deg' | undefined;
          if (orientation === 'landscape-right') {
            faceRotation = '90deg';
          } else if (orientation === 'landscape-left') {
            faceRotation = '270deg';
          } else if (orientation === 'portrait-upside-down') {
            faceRotation = '180deg';
          }

          const faceCropped = resize(frame, {
            crop: {
              x: cropX,
              y: cropY,
              width: Math.max(cropW, 1),
              height: Math.max(cropH, 1),
            },
            scale: {width: RPPG_CROP_SIZE, height: RPPG_CROP_SIZE},
            ...(faceRotation && {rotation: faceRotation}),
            pixelFormat: 'rgb',
            dataType: 'uint8',
          });

          measurementWindowCount.value += 1;
          rppgSampleCount.value = measurementWindowCount.value;

          const rgbMeans = calculateRgbMeans(faceCropped);
          if (rgbMeans.length === 3) {
            updateMeasurementVitals([
              rgbMeans[0] as number,
              rgbMeans[1] as number,
              rgbMeans[2] as number,
              currentTime,
            ]);
          }
          return;
        }

        if (phase !== 'workout') {
          return;
        }

        if (currentTime - lastPoseInferenceTime.value < 250) return;
        lastPoseInferenceTime.value = currentTime;

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

        const resized = resize(frame, {
          scale: isLandscape
            ? {width: MODEL_INPUT_HEIGHT, height: MODEL_INPUT_WIDTH}
            : {width: MODEL_INPUT_WIDTH, height: MODEL_INPUT_HEIGHT},
          ...(rotation && {rotation}),
          ...(orientation === 'landscape-right' && {mirror: true}),
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
          if (prevDetected.value) {
            prevDetected.value = false;
            flatKeypoints.value = [];
            keypointsDirty.value = true;
            detectedState.value = 2;
          }
        }
      } catch (e: any) {
        const msg = e?.message ?? e?.toString?.() ?? 'unknown error';
        console.error('Frame Processor Error:', msg);
      }
    },
    [
      activeExerciseId,
      cameraPhaseValue,
      finishMeasurement,
      lastPoseInferenceTime,
      measurementDeadline,
      measurementFaceLocked,
      measurementFaceRect,
      measurementWindowCount,
      model,
      rppgSampleCount,
      rppgLastCollectTime,
      updateRepCount,
      updateMeasurementVitals,
    ],
  );

  const phaseTitle =
    cameraPhase === 'pre-ready'
      ? '운동 전 측정 준비'
      : cameraPhase === 'pre-measuring'
      ? '운동 전 안정 심박 측정'
      : cameraPhase === 'post-ready'
        ? '운동 후 측정 준비'
      : cameraPhase === 'post-measuring'
        ? '운동 후 회복 심박 측정'
        : cameraPhase === 'results'
          ? '회복 측정 결과'
          : `${activeExercise.name} 자세 분석`;
  const phaseBadge =
    cameraPhase === 'pre-ready'
      ? 'READY'
      : cameraPhase === 'pre-measuring'
      ? 'PRE CHECK'
      : cameraPhase === 'post-ready'
        ? 'READY'
      : cameraPhase === 'post-measuring'
        ? 'RECOVERY'
        : cameraPhase === 'results'
          ? 'RESULT'
          : 'LIVE';
  const coachTitle =
    cameraPhase === 'pre-ready'
      ? '카메라에 얼굴을 봐주세요'
      : cameraPhase === 'pre-measuring'
      ? '카메라를 보고 20초간 가만히 있어주세요'
      : cameraPhase === 'post-ready'
        ? '회복 측정을 시작할 준비가 되었어요'
      : cameraPhase === 'post-measuring'
        ? '운동이 끝났다면 회복 심박을 측정할게요'
        : cameraPhase === 'results'
          ? '운동 전후 심박 비교'
        : counterGuide.coachTitle;
  const preHeartRateDisplay =
    preMeasurementVitals != null && preMeasurementVitals.heartRate > 0
      ? preMeasurementVitals.heartRate
      : '--';
  const postHeartRateDisplay =
    postMeasurementVitals != null && postMeasurementVitals.heartRate > 0
      ? postMeasurementVitals.heartRate
      : '--';
  const coachGuide =
    cameraPhase === 'pre-ready'
      ? '안내를 확인한 뒤 버튼을 누르면 운동 전 rPPG 측정을 시작합니다.'
      : cameraPhase === 'pre-measuring'
      ? '얼굴이 안정적으로 잡히면 자동으로 측정이 시작됩니다.'
      : cameraPhase === 'post-ready'
        ? '버튼을 누른 뒤 카메라를 보고 가만히 있으면 운동 후 rPPG를 측정합니다.'
      : cameraPhase === 'post-measuring'
        ? '측정 중에는 시선을 카메라에 두고 움직임을 줄여주세요.'
        : cameraPhase === 'results'
          ? `운동 전 ${preHeartRateDisplay} BPM / 운동 후 ${postHeartRateDisplay} BPM`
          : counterGuide.guideText;
  const primaryButtonLabel =
    cameraPhase === 'pre-ready'
      ? '측정 시작'
      : cameraPhase === 'workout'
        ? isRppgEnabled
          ? '운동 완료 후 회복 측정'
          : '운동 완료로 기록'
      : cameraPhase === 'post-ready'
        ? '회복 측정 시작'
      : cameraPhase === 'results'
        ? '운동 완료로 기록'
        : '측정 진행 중';
  const primaryButtonDisabled =
    cameraPhase === 'pre-measuring' || cameraPhase === 'post-measuring';

  const handlePrimaryAction = useCallback(() => {
    if (cameraPhase === 'pre-ready') {
      startMeasurementPhase('pre');
      return;
    }

    if (cameraPhase === 'workout') {
      if (isRppgEnabled) {
        startReadyPhase('post');
      } else {
        const didComplete = completeWorkout();
        if (!didComplete) {
          return;
        }

        const hasNextExercise =
          currentExerciseIndex < workoutExerciseIds.length - 1;
        if (hasNextExercise) {
          const nextExerciseId = workoutExerciseIds[currentExerciseIndex + 1];
          const nextExercise =
            fallbackExercises.find(exercise => exercise.id === nextExerciseId) ??
            fallbackExercises[0];

          showAlert({
            title: '운동 완료',
            message: `${activeExercise.name} ${displayRepCount}회를 기록했어요.\n다음 운동 ${nextExercise.name}(으)로 이동할까요?`,
            confirmText: '예',
            cancelText: '아니오',
            onConfirm: moveToNextExercise,
            onCancel: finishWorkoutFlow,
          });
        } else {
          showAlert({
            title: '운동 완료',
            message: `${activeExercise.name} ${displayRepCount}회를 기록했어요.\n선택한 운동을 모두 마쳤습니다.`,
            confirmText: '확인',
            onConfirm: finishWorkoutFlow,
          });
        }
      }
      return;
    }

    if (cameraPhase === 'post-ready') {
      startMeasurementPhase('post');
      return;
    }

    if (cameraPhase === 'results') {
      const didComplete = completeWorkout();
      if (!didComplete) {
        return;
      }

      const hasNextExercise = currentExerciseIndex < workoutExerciseIds.length - 1;
      if (hasNextExercise) {
        const nextExerciseId = workoutExerciseIds[currentExerciseIndex + 1];
        const nextExercise =
          fallbackExercises.find(exercise => exercise.id === nextExerciseId) ??
          fallbackExercises[0];

        showAlert({
          title: '운동 완료',
          message: `${activeExercise.name} ${displayRepCount}회를 기록했어요.\n다음 운동 ${nextExercise.name}(으)로 이동할까요?`,
          confirmText: '예',
          cancelText: '아니오',
          onConfirm: moveToNextExercise,
          onCancel: finishWorkoutFlow,
        });
        return;
      }

      showAlert({
        title: '운동 완료',
        message: `${activeExercise.name} ${displayRepCount}회를 기록했어요.\n선택한 운동을 모두 마쳤습니다.`,
        confirmText: '확인',
        onConfirm: finishWorkoutFlow,
      });
    }
  }, [
    cameraPhase,
    closeAlert,
    completeWorkout,
    currentExerciseIndex,
    displayRepCount,
    finishWorkoutFlow,
    isRppgEnabled,
    moveToNextExercise,
    activeExercise,
    startMeasurementPhase,
    startReadyPhase,
    showAlert,
    workoutExerciseIds,
  ]);

  const resultDelta =
    preMeasurementVitals?.heartRate != null &&
    preMeasurementVitals.heartRate > 0 &&
    postMeasurementVitals?.heartRate != null &&
    postMeasurementVitals.heartRate > 0
      ? postMeasurementVitals.heartRate - preMeasurementVitals.heartRate
      : null;

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
        fps={30}
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
              {phaseTitle}
            </CameraTitle>
            <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
              {`${currentExerciseIndex + 1}/${workoutExerciseIds.length}`}
            </TextR>
          </TitleBlock>

          <LivePill>
            <LiveDot />
            <TextB size={12} color={KINETIC_COLORS.primary}>
              {phaseBadge}
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
        {isRppgEnabled && (
          <RppgVitalsHud
            vitals={rppgVitals}
            frameProgress={rppgFrameProgress}
          />
        )}
      </TopHud>

      <BottomCoachPanel>
        <CoachHeader>
          <CoachTitle size={17} color={KINETIC_COLORS.onSurface}>
            {coachTitle}
          </CoachTitle>
          <TextR size={12} color={KINETIC_COLORS.onSurfaceVariant}>
            {cameraPhase === 'results'
              ? 'SUMMARY'
              : isRppgEnabled
                ? 'rPPG 10Hz'
                : 'POSE AI'}
          </TextR>
        </CoachHeader>
        <ProgressTrack>
          <ProgressFill />
        </ProgressTrack>
        <GuideRow>
          <GuideDot />
          <GuideText size={13} color={KINETIC_COLORS.onSurfaceVariant}>
            {coachGuide}
          </GuideText>
        </GuideRow>
        {cameraPhase === 'results' && (
          <GuideRow>
            <GuideDot />
            <GuideText size={13} color={KINETIC_COLORS.onSurfaceVariant}>
              {resultDelta == null
                ? '심박 변화는 충분한 측정 데이터가 확보되면 표시됩니다.'
                : `회복 변화 ${resultDelta > 0 ? '+' : ''}${resultDelta} BPM`}
            </GuideText>
          </GuideRow>
        )}
        <CompleteWorkoutButton
          activeOpacity={0.88}
          disabled={primaryButtonDisabled}
          onPress={handlePrimaryAction}
        >
          <TextB size={15} color="#000000">
            {primaryButtonLabel}
          </TextB>
        </CompleteWorkoutButton>
        {cameraPhase === 'post-ready' && (
          <SecondaryActionButton
            activeOpacity={0.88}
            onPress={startResultsPhase}
          >
            <TextB size={15} color={KINETIC_COLORS.onSurface}>
              회복 측정 건너뛰기
            </TextB>
          </SecondaryActionButton>
        )}
      </BottomCoachPanel>
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={() => {
          alertConfig.onConfirm?.();
        }}
        onCancel={
          alertConfig.onCancel
            ? () => {
                alertConfig.onCancel?.();
              }
            : undefined
        }
      />
    </Container>
  );
};
