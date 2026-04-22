/**
 * rPPG 신호 처리 유틸리티
 *
 * TSCAN 모델의 BVP(Blood Volume Pulse) 출력으로부터
 * 심박수(HR), 호흡수(RR), 신호 품질(SQI)을 추출한다.
 *
 * ⚠️ 모델 출력의 BVP 값은 시계열 데이터이며,
 *    한 번의 추론에서 여러 BVP 샘플이 출력될 수 있다.
 *    (예: 10 frames 입력 → 10 BVP 값 출력)
 *    이 값들을 누적하여 주파수 영역 분석을 수행한다.
 */

export interface RppgVitals {
  /** 심박수 (BPM) — BVP의 우세 주파수에서 추출. 0이면 측정 중. */
  heartRate: number;
  /** 호흡수 (breaths/min) — 저주파 피크 간격에서 추출. 0이면 측정 중. */
  respirationRate: number;
  /** 신호 품질 지표 (0~1) — HR 대역 우세도 기반 */
  signalQuality: number;
  /** 원시 BVP 파형 (최근 N 샘플, 정규화됨) */
  bvpWaveform: number[];
  /** 충분한 데이터가 있는지 여부 */
  hasEnoughData: boolean;
}

// ── 상수 ─────────────────────────────────────────────────────────
const BVP_HISTORY_LENGTH = 300; // 최대 BVP 샘플 유지
const SAMPLE_RATE_HZ = 4;
const HR_MIN = 40;
const HR_MAX = 120;
const RR_MIN = 6;
const RR_MAX = 40;
const MIN_SAMPLES_FOR_HR = 40; // HR 추정에 필요한 최소 샘플 수 (4Hz 기준 10초)

// BVP 히스토리
let bvpHistory: number[] = [];
let lastHeartRate = 0;

/**
 * BVP 히스토리 초기화.
 */
export function resetBvpHistory(): void {
  bvpHistory = [];
  lastHeartRate = 0;
}

/**
 * 새 BVP 값을 히스토리에 추가하고, 생체 신호를 계산한다.
 *
 * @param rawBvpValues - TSCAN 모델 출력 배열 (BVP 시계열)
 * @returns RppgVitals
 */
export function processRppgOutput(
  rawBvpValues: number[],
): RppgVitals | null {
  if (rawBvpValues.length === 0) return null;

  // 모델 출력을 히스토리에 추가
  for (const v of rawBvpValues) {
    if (Number.isFinite(v)) {
      bvpHistory.push(v);
    }
  }

  // 최대 길이 유지
  while (bvpHistory.length > BVP_HISTORY_LENGTH) {
    bvpHistory.shift();
  }

  const bvp = [...bvpHistory];
  const n = bvp.length;

  // ── 1. DC 성분 제거 (평균 차감) ──
  const mean = bvp.reduce((a, b) => a + b, 0) / n;
  const detrended = bvp.map(v => v - mean);

  // ── 2. 파형 생성 (정규화된 최근 30개) ──
  const waveformLen = Math.min(30, detrended.length);
  const recentBvp = detrended.slice(-waveformLen);
  const maxAbs = Math.max(...recentBvp.map(Math.abs), 0.0001);
  const bvpWaveform = recentBvp.map(v => v / maxAbs);

  // 데이터 부족 시 파형만 반환
  if (n < MIN_SAMPLES_FOR_HR) {
    return {
      heartRate: 0,
      respirationRate: 0,
      signalQuality: 0,
      bvpWaveform,
      hasEnoughData: false,
    };
  }

  // ── 3. 주파수 영역 HR 추정 ──
  // 4Hz 샘플에서 피크 간격을 정수 샘플로 세면 40/48/60/80/120 BPM처럼
  // 값이 거칠게 양자화된다. 40~120 BPM 대역을 1 BPM 단위로 스캔해
  // 가장 강한 주파수를 선택하면 고정값처럼 보이는 현상이 줄어든다.
  const hrEstimate = estimateHeartRateFromSpectrum(detrended);
  const heartRate = hrEstimate.heartRate;
  const hrQuality = hrEstimate.quality;

  // ── 4. 호흡수 추정 (저주파 피크) ──
  // 간단한 이동 평균 필터로 저주파 성분 추출 (window=5)
  let respirationRate = 0;

  if (n >= 20) {
    const smoothed = movingAverage(detrended, 5);
    const rrPeaks = findPeaks(smoothed);

    if (rrPeaks.length >= 2) {
      const rrIntervals: number[] = [];
      for (let i = 1; i < rrPeaks.length; i++) {
        rrIntervals.push(rrPeaks[i] - rrPeaks[i - 1]);
      }

      rrIntervals.sort((a, b) => a - b);
      const medianRRInterval =
        rrIntervals[Math.floor(rrIntervals.length / 2)];

      if (medianRRInterval > 0) {
        const rrPeriod = medianRRInterval / SAMPLE_RATE_HZ;
        const estimatedRR = 60.0 / rrPeriod;

        if (estimatedRR >= RR_MIN && estimatedRR <= RR_MAX) {
          respirationRate = Math.round(estimatedRR);
        }
      }
    }
  }

  // ── 5. 전체 신호 품질 ──
  const signalQuality = heartRate > 0 ? hrQuality * 0.8 + 0.2 : 0.1;

  return {
    heartRate,
    respirationRate,
    signalQuality,
    bvpWaveform,
    hasEnoughData: true,
  };
}

/**
 * 시계열에서 local maxima (피크)를 찾는다.
 * 노이즈 방지를 위해 주변 값보다 일정 이상 높은 점만 선택.
 */
function findPeaks(signal: number[]): number[] {
  const peaks: number[] = [];
  const n = signal.length;
  if (n < 3) return peaks;

  // 신호의 표준편차 (노이즈 문턱값으로 사용)
  const mean = signal.reduce((a, b) => a + b, 0) / n;
  const variance =
    signal.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  const threshold = stddev * 0.3; // 표준편차의 30% 이상인 피크만

  for (let i = 1; i < n - 1; i++) {
    if (
      signal[i] > signal[i - 1] &&
      signal[i] > signal[i + 1] &&
      signal[i] > threshold
    ) {
      peaks.push(i);
    }
  }

  return peaks;
}

/**
 * 이동 평균 필터
 */
function movingAverage(signal: number[], windowSize: number): number[] {
  const result: number[] = [];
  const half = Math.floor(windowSize / 2);

  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    let count = 0;
    for (
      let j = Math.max(0, i - half);
      j <= Math.min(signal.length - 1, i + half);
      j++
    ) {
      sum += signal[j];
      count++;
    }
    result.push(sum / count);
  }

  return result;
}

function estimateHeartRateFromSpectrum(signal: number[]): {
  heartRate: number;
  quality: number;
} {
  const n = signal.length;
  if (n < MIN_SAMPLES_FOR_HR) {
    return {heartRate: 0, quality: 0};
  }

  const stddev = getStddev(signal);
  if (stddev < 1e-6) {
    lastHeartRate = 0;
    return {heartRate: 0, quality: 0};
  }

  const normalized = signal.map(v => v / stddev);
  let bestBpm = 0;
  let bestPower = 0;
  let totalPower = 0;
  let bins = 0;

  for (let bpm = HR_MIN; bpm <= HR_MAX; bpm++) {
    const power = getFrequencyPower(normalized, bpm / 60);
    totalPower += power;
    bins++;

    if (power > bestPower) {
      bestPower = power;
      bestBpm = bpm;
    }
  }

  const averagePower = totalPower / Math.max(1, bins);
  const dominance = averagePower > 0 ? bestPower / averagePower : 0;
  const quality = Math.max(0, Math.min(1, (dominance - 1) / 4));

  if (quality < 0.12) {
    return {heartRate: lastHeartRate, quality};
  }

  const smoothedHeartRate =
    lastHeartRate > 0 ? lastHeartRate * 0.7 + bestBpm * 0.3 : bestBpm;
  lastHeartRate = Math.round(smoothedHeartRate);

  return {heartRate: lastHeartRate, quality};
}

function getFrequencyPower(signal: number[], frequencyHz: number): number {
  let real = 0;
  let imag = 0;
  const n = signal.length;

  for (let i = 0; i < n; i++) {
    const phase = (2 * Math.PI * frequencyHz * i) / SAMPLE_RATE_HZ;
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    const value = signal[i] * window;
    real += value * Math.cos(phase);
    imag -= value * Math.sin(phase);
  }

  return real * real + imag * imag;
}

function getStddev(signal: number[]): number {
  const n = signal.length;
  const mean = signal.reduce((a, b) => a + b, 0) / n;
  const variance =
    signal.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  return Math.sqrt(variance);
}
