import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

// COCO 17 keypoint names
const KEYPOINT_NAMES = [
  'nose', // 0
  'left_eye', // 1
  'right_eye', // 2
  'left_ear', // 3
  'right_ear', // 4
  'left_shoulder', // 5
  'right_shoulder', // 6
  'left_elbow', // 7
  'right_elbow', // 8
  'left_wrist', // 9
  'right_wrist', // 10
  'left_hip', // 11
  'right_hip', // 12
  'left_knee', // 13
  'right_knee', // 14
  'left_ankle', // 15
  'right_ankle', // 16
];

// COCO skeleton connections (pairs of keypoint indices)
const SKELETON_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], // nose → left_eye
  [0, 2], // nose → right_eye
  [1, 3], // left_eye → left_ear
  [2, 4], // right_eye → right_ear
  // Upper body
  [5, 6], // left_shoulder → right_shoulder
  [5, 7], // left_shoulder → left_elbow
  [7, 9], // left_elbow → left_wrist
  [6, 8], // right_shoulder → right_elbow
  [8, 10], // right_elbow → right_wrist
  // Torso
  [5, 11], // left_shoulder → left_hip
  [6, 12], // right_shoulder → right_hip
  [11, 12], // left_hip → right_hip
  // Lower body
  [11, 13], // left_hip → left_knee
  [13, 15], // left_knee → left_ankle
  [12, 14], // right_hip → right_knee
  [14, 16], // right_knee → right_ankle
];

// Color mapping by body part
const getKeypointColor = (index: number): string => {
  if (index <= 4) return '#00FF00'; // Face — green
  if (index <= 10) return '#FF6B6B'; // Arms — red/coral
  if (index <= 12) return '#4ECDC4'; // Hips — teal
  return '#FFD93D'; // Legs — yellow
};

const getLineColor = (i1: number, i2: number): string => {
  if (i1 <= 4 && i2 <= 4) return '#00FF00'; // Face
  if (i1 <= 10 && i2 <= 10) return '#FF6B6B'; // Arms
  if (i1 >= 11 && i1 <= 12 && i2 >= 11 && i2 <= 12) return '#4ECDC4'; // Hips
  if (i1 >= 11 || i2 >= 11) return '#FFD93D'; // Lower body / torso
  return '#FFFFFF';
};

export interface Keypoint {
  x: number;
  y: number;
  score: number;
}

interface PoseOverlayProps {
  keypoints: Keypoint[];
  width: number;
  height: number;
  isFrontCamera?: boolean;
  confidenceThreshold?: number;
  showLabels?: boolean;
}

/**
 * PoseOverlay: 카메라 위에 키포인트와 뼈대를 그리는 SVG 오버레이
 *
 * 좌표 변환 로직:
 * 1. 모델 출력 좌표는 0~1 정규화
 * 2. 화면 좌표로 변환: normalizedCoord * screenDimension
 * 3. 전면 카메라일 경우 X축 미러링
 */
const PoseOverlayInner: React.FC<PoseOverlayProps> = ({
  keypoints,
  width,
  height,
  isFrontCamera = true,
  confidenceThreshold = 0.3,
  showLabels = false,
}) => {
  if (!keypoints || keypoints.length < 17) return null;

  // 좌표 변환: 정규화 좌표(0~1) → 화면 좌표
  const transformCoords = (
    modelX: number,
    modelY: number,
  ): { x: number; y: number } => {
    const screenX = isFrontCamera ? (1 - modelX) * width : modelX * width;
    const screenY = modelY * height;
    return { x: screenX, y: screenY };
  };

  // 신뢰도 기반 필터링된 키포인트 좌표
  const transformedKeypoints = keypoints.map((kp, idx) => {
    const { x, y } = transformCoords(kp.x, kp.y);
    return {
      x,
      y,
      score: kp.score,
      visible: kp.score > confidenceThreshold,
      name: KEYPOINT_NAMES[idx],
    };
  });

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      {/* 1. 뼈대 라인 */}
      {SKELETON_CONNECTIONS.map(([i, j], idx) => {
        const kp1 = transformedKeypoints[i];
        const kp2 = transformedKeypoints[j];
        if (!kp1.visible || !kp2.visible) return null;

        return (
          <Line
            key={`bone-${idx}`}
            x1={kp1.x}
            y1={kp1.y}
            x2={kp2.x}
            y2={kp2.y}
            stroke={getLineColor(i, j)}
            strokeWidth={3}
            strokeOpacity={0.8}
            strokeLinecap="round"
          />
        );
      })}

      {/* 2. 키포인트 원 — 단일 원만 사용 (외부 글로우 제거로 SVG 요소 절반 감소) */}
      {transformedKeypoints.map((kp, idx) => {
        if (!kp.visible) return null;

        return (
          <React.Fragment key={`kp-${idx}`}>
            <Circle
              cx={kp.x}
              cy={kp.y}
              r={5}
              fill={getKeypointColor(idx)}
              fillOpacity={0.9}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            {showLabels && (
              <SvgText
                x={kp.x + 10}
                y={kp.y - 5}
                fill="#FFFFFF"
                fontSize={10}
                fontWeight="bold"
              >
                {kp.name}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

// React.memo로 감싸서 동일한 키포인트일 때 리렌더 방지
export const PoseOverlay = React.memo(PoseOverlayInner);
