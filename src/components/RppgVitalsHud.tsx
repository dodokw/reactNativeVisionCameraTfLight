import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Line } from 'react-native-svg';
import styled from 'styled-components/native';
import { TextB, TextR } from '../tools/fonts';
import type { RppgVitals } from '../utils/rppgSignalProcessing';

// ── 스타일 ──────────────────────────────────────────────────────

const VitalsRow = styled.View`
  flex-direction: row;
  align-items: stretch;
  margin-top: 10px;
`;

const VitalCard = styled.View<{ accent?: string }>`
  flex: 1;
  min-height: 68px;
  padding: 11px 13px;
  border-radius: 16px;
  background-color: rgba(26, 25, 25, 0.76);
  border-width: 1px;
  border-color: ${({accent}) =>
    accent ? `${accent}44` : 'rgba(255, 255, 255, 0.08)'};
  margin-horizontal: 4px;
`;

const VitalLabel = styled(TextR)`
  margin-bottom: 3px;
`;

const VitalValue = styled(TextB)`
  margin-top: 2px;
`;

const VitalUnit = styled(TextR)`
  margin-top: 1px;
`;

const WaveformCard = styled.View`
  margin-top: 10px;
  margin-horizontal: 4px;
  padding: 12px 14px 10px;
  border-radius: 16px;
  background-color: rgba(26, 25, 25, 0.76);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.08);
`;

const WaveformHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const QualityDot = styled.View<{ color: string }>`
  width: 7px;
  height: 7px;
  border-radius: 4px;
  background-color: ${({color}) => color};
  margin-right: 6px;
`;

const QualityRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

// ── 상수 ──────────────────────────────────────────────────────

const WAVEFORM_WIDTH = 280;
const WAVEFORM_HEIGHT = 40;
const HR_COLOR = '#FF6B6B';
const RR_COLOR = '#4ECDC4';
const SQI_COLORS = {
  good: '#CCFF00',    // 양호 (≥ 0.5)
  moderate: '#FFA726', // 보통 (0.25~0.5)
  poor: '#FF5252',     // 불량 (< 0.25)
};

function getQualityColor(sqi: number): string {
  if (sqi >= 0.5) return SQI_COLORS.good;
  if (sqi >= 0.25) return SQI_COLORS.moderate;
  return SQI_COLORS.poor;
}

function getQualityLabel(sqi: number): string {
  if (sqi >= 0.5) return '양호';
  if (sqi >= 0.25) return '보통';
  return '측정 중';
}

// ── 파형 SVG ──────────────────────────────────────────────────

function BvpWaveform({
  waveform,
  color,
}: {
  waveform: number[];
  color: string;
}) {
  if (waveform.length < 2) return null;

  const n = waveform.length;
  const dx = WAVEFORM_WIDTH / (n - 1);
  const cy = WAVEFORM_HEIGHT / 2;

  const points = waveform
    .map((v, i) => `${(i * dx).toFixed(1)},${(cy - v * cy * 0.85).toFixed(1)}`)
    .join(' ');

  return (
    <Svg
      width={WAVEFORM_WIDTH}
      height={WAVEFORM_HEIGHT}
      viewBox={`0 0 ${WAVEFORM_WIDTH} ${WAVEFORM_HEIGHT}`}
    >
      {/* 중심선 */}
      <Line
        x1={0}
        y1={cy}
        x2={WAVEFORM_WIDTH}
        y2={cy}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.5}
      />
      {/* 파형 */}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

interface RppgVitalsHudProps {
  vitals: RppgVitals | null;
  frameProgress: string; // e.g. "3/10 프레임" or "분석됨"
}

export const RppgVitalsHud: React.FC<RppgVitalsHudProps> = ({
  vitals,
  frameProgress,
}) => {
  const qualityColor = vitals
    ? getQualityColor(vitals.signalQuality)
    : SQI_COLORS.poor;

  // 상태별 레이블
  let qualityLabel: string;
  if (!vitals) {
    qualityLabel = '대기 중';
  } else if (!vitals.hasEnoughData) {
    qualityLabel = '수집 중';
  } else {
    qualityLabel = getQualityLabel(vitals.signalQuality);
  }

  // HR/RR: 0이면 아직 측정 안 됨
  const hrDisplay =
    vitals && vitals.heartRate > 0 ? `${vitals.heartRate}` : '--';
  const rrDisplay =
    vitals && vitals.respirationRate > 0
      ? `${vitals.respirationRate}`
      : '--';

  return (
    <View style={styles.container}>
      {/* 심박수 + 호흡수 카드 */}
      <VitalsRow>
        <VitalCard accent={HR_COLOR}>
          <VitalLabel size={11} color="rgba(255,255,255,0.55)">
            ❤️ 심박수
          </VitalLabel>
          <VitalValue size={24} color={HR_COLOR}>
            {hrDisplay}
          </VitalValue>
          <VitalUnit size={10} color="rgba(255,255,255,0.4)">
            BPM
          </VitalUnit>
        </VitalCard>

        <VitalCard accent={RR_COLOR}>
          <VitalLabel size={11} color="rgba(255,255,255,0.55)">
            🌬️ 호흡수
          </VitalLabel>
          <VitalValue size={24} color={RR_COLOR}>
            {rrDisplay}
          </VitalValue>
          <VitalUnit size={10} color="rgba(255,255,255,0.4)">
            회/분
          </VitalUnit>
        </VitalCard>

        <VitalCard accent={qualityColor}>
          <VitalLabel size={11} color="rgba(255,255,255,0.55)">
            📡 신호
          </VitalLabel>
          <VitalValue size={18} color={qualityColor}>
            {qualityLabel}
          </VitalValue>
          <VitalUnit size={10} color="rgba(255,255,255,0.4)">
            {frameProgress}
          </VitalUnit>
        </VitalCard>
      </VitalsRow>

      {/* BVP 파형 — 사람 감지 후 충분한 데이터가 있을 때만 표시 */}
      {vitals && vitals.hasEnoughData && vitals.bvpWaveform.length >= 2 && (
        <WaveformCard>
          <WaveformHeader>
            <TextR size={11} color="rgba(255,255,255,0.55)">
              BVP 파형
            </TextR>
            <QualityRow>
              <QualityDot color={qualityColor} />
              <TextR size={11} color={qualityColor}>
                SQI {Math.round(vitals.signalQuality * 100)}%
              </TextR>
            </QualityRow>
          </WaveformHeader>
          <BvpWaveform waveform={vitals.bvpWaveform} color={HR_COLOR} />
        </WaveformCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
});
