/**
 * CHROM 기반 rPPG 신호 처리 유틸리티.
 *
 * 파이프라인:
 *   얼굴 crop의 RGB 평균값 누적
 *   -> CHROM projection으로 BVP 생성
 *   -> detrend
 *   -> bandpass filter [0.6 ~ 3.3 Hz]
 *   -> FFT periodogram -> peak frequency -> HR (BPM)
 */

export interface RppgVitals {
  /** 심박수 (BPM) - BVP의 우세 주파수에서 추출. 0이면 측정 중. */
  heartRate: number;
  /** 호흡수 (breaths/min) - 충분한 장기 BVP가 있을 때만 추정. */
  respirationRate: number;
  /** 신호 품질 지표 (0~1) - HR 대역 SNR 기반. */
  signalQuality: number;
  /** 원시 BVP 파형 (최근 N 샘플, 정규화됨). */
  bvpWaveform: number[];
  /** 심박 추정에 충분한 데이터가 있는지 여부. */
  hasEnoughData: boolean;
}

interface RgbSample {
  r: number;
  g: number;
  b: number;
  timeMs: number;
}

const DEFAULT_SAMPLE_RATE_HZ = 10;
const MIN_SAMPLE_RATE_HZ = 6;
const MAX_SAMPLE_RATE_HZ = 30;
const RGB_HISTORY_SECONDS = 35;

// CHROM 논문에서 자주 쓰는 1.6초 window.
const CHROM_WINDOW_SECONDS = 1.6;
const CHROM_STEP_SECONDS = 0.25;

// HR 대역: 0.6 Hz ~ 3.3 Hz = 36 ~ 198 BPM.
const HR_LOW_HZ = 0.75;
const HR_HIGH_HZ = 3.3;
const HR_MIN_BPM = 50;
const HR_MAX_BPM = 170;

const MIN_SECONDS_FOR_HR = 12;
const FFT_WINDOW_SECONDS = 15;
const WAVEFORM_SECONDS = 2;
const MIN_SIGNAL_QUALITY_FOR_HR = 0.45;
const STRONG_FFT_QUALITY_FOR_HR = 0.65;
const HR_STABILITY_WINDOW = 4;
const MAX_STABLE_HR_SPREAD_BPM = 12;
const EPSILON = 1e-8;

let rgbHistory: RgbSample[] = [];
let lastHeartRate = 0;
let candidateHrEstimates: number[] = [];

export function resetBvpHistory(): void {
  rgbHistory = [];
  lastHeartRate = 0;
  candidateHrEstimates = [];
}

export function processRppgSample(
  meanR: number,
  meanG: number,
  meanB: number,
  capturedAtMs = Date.now(),
): RppgVitals | null {
  if (
    !Number.isFinite(meanR) ||
    !Number.isFinite(meanG) ||
    !Number.isFinite(meanB)
  ) {
    return null;
  }

  const previousTimeMs = rgbHistory[rgbHistory.length - 1]?.timeMs;
  const timeMs =
    previousTimeMs == null
      ? capturedAtMs
      : Math.max(capturedAtMs, previousTimeMs + 1);

  rgbHistory.push({r: meanR, g: meanG, b: meanB, timeMs});
  while (
    rgbHistory.length > 0 &&
    timeMs - rgbHistory[0]!.timeMs > RGB_HISTORY_SECONDS * 1000
  ) {
    rgbHistory.shift();
  }

  const sampleRateHz = estimateSampleRate(rgbHistory);
  const chromWindowSamples = getSampleCount(
    CHROM_WINDOW_SECONDS,
    sampleRateHz,
    8,
  );
  const chromStepSamples = getSampleCount(CHROM_STEP_SECONDS, sampleRateHz, 2);
  const minSamplesForHr = getSampleCount(
    MIN_SECONDS_FOR_HR,
    sampleRateHz,
    48,
  );
  const fftWindowSamples = getSampleCount(
    FFT_WINDOW_SECONDS,
    sampleRateHz,
    minSamplesForHr,
  );
  const waveformSamples = getSampleCount(WAVEFORM_SECONDS, sampleRateHz, 12);
  const highCutHz = Math.min(HR_HIGH_HZ, sampleRateHz / 2 - 0.1);

  const chromBvp = calculateChromBvp(
    rgbHistory,
    chromWindowSamples,
    chromStepSamples,
  );
  const bvpWaveform = createWaveform(chromBvp, waveformSamples);
  const sampleCount = rgbHistory.length;

  if (
    highCutHz <= HR_LOW_HZ ||
    sampleCount < minSamplesForHr ||
    chromBvp.length < minSamplesForHr
  ) {
    return {
      heartRate: 0,
      respirationRate: 0,
      signalQuality: 0,
      bvpWaveform,
      hasEnoughData: false,
    };
  }

  const analysisWindow = chromBvp.slice(-fftWindowSamples);
  const smoothed = movingAverage(
    analysisWindow,
    getOddWindowSize(0.2, sampleRateHz, 3),
  );
  const detrended = detrendPolynomial(smoothed, 2);
  const filtered = butterworthBandpass(
    detrended,
    sampleRateHz,
    HR_LOW_HZ,
    highCutHz,
  );

  const fftResult = calculateFFTHeartRate(
    filtered,
    sampleRateHz,
    HR_LOW_HZ,
    highCutHz,
    minSamplesForHr,
  );
  const peakHr = estimateHrFromPeaks(
    filtered,
    sampleRateHz,
    minSamplesForHr,
  );

  let heartRate = 0;
  let quality = fftResult.quality;
  const fftHeartRate = fftResult.heartRate;

  if (fftHeartRate > 0 && peakHr > 0) {
    if (Math.abs(fftHeartRate - peakHr) <= 12) {
      heartRate = Math.round((fftHeartRate + peakHr) / 2);
      quality = Math.min(1, fftResult.quality * 1.25);
    } else {
      heartRate = 0;
      quality = fftResult.quality * 0.35;
    }
  } else if (fftHeartRate > 0 && fftResult.quality >= STRONG_FFT_QUALITY_FOR_HR) {
    heartRate = fftHeartRate;
  }

  if (
    heartRate < HR_MIN_BPM ||
    heartRate > HR_MAX_BPM ||
    quality < MIN_SIGNAL_QUALITY_FOR_HR
  ) {
    heartRate = 0;
  }

  if (heartRate > 0) {
    candidateHrEstimates.push(heartRate);
    if (candidateHrEstimates.length > HR_STABILITY_WINDOW) {
      candidateHrEstimates.shift();
    }

    if (candidateHrEstimates.length >= HR_STABILITY_WINDOW) {
      const minHr = Math.min(...candidateHrEstimates);
      const maxHr = Math.max(...candidateHrEstimates);
      if (maxHr - minHr <= MAX_STABLE_HR_SPREAD_BPM) {
        const stableHeartRate = Math.round(median(candidateHrEstimates));
        const weight = quality >= 0.65 ? 0.45 : 0.25;
        lastHeartRate =
          lastHeartRate > 0
            ? Math.round(lastHeartRate * (1 - weight) + stableHeartRate * weight)
            : stableHeartRate;
      } else {
        candidateHrEstimates = [heartRate];
      }
    }
  }

  return {
    heartRate: lastHeartRate,
    respirationRate: estimateRespirationRate(chromBvp, sampleRateHz),
    signalQuality: quality,
    bvpWaveform,
    hasEnoughData: true,
  };
}

function estimateSampleRate(samples: RgbSample[]): number {
  if (samples.length < 3) {
    return DEFAULT_SAMPLE_RATE_HZ;
  }

  const intervals: number[] = [];
  const start = Math.max(1, samples.length - 120);
  for (let i = start; i < samples.length; i++) {
    const intervalMs = samples[i]!.timeMs - samples[i - 1]!.timeMs;
    if (intervalMs >= 20 && intervalMs <= 500) {
      intervals.push(intervalMs);
    }
  }

  if (intervals.length < 2) {
    return DEFAULT_SAMPLE_RATE_HZ;
  }

  const medianIntervalMs = median(intervals);
  if (medianIntervalMs <= 0) {
    return DEFAULT_SAMPLE_RATE_HZ;
  }

  return Math.max(
    MIN_SAMPLE_RATE_HZ,
    Math.min(MAX_SAMPLE_RATE_HZ, 1000 / medianIntervalMs),
  );
}

function getSampleCount(
  seconds: number,
  sampleRateHz: number,
  minimum: number,
): number {
  return Math.max(minimum, Math.round(seconds * sampleRateHz));
}

function getOddWindowSize(
  seconds: number,
  sampleRateHz: number,
  minimum: number,
): number {
  const size = getSampleCount(seconds, sampleRateHz, minimum);
  return size % 2 === 0 ? size + 1 : size;
}

function calculateChromBvp(
  samples: RgbSample[],
  windowSamples: number,
  stepSamples: number,
): number[] {
  const n = samples.length;
  const bvp = new Array<number>(n).fill(0);
  if (n < windowSamples) {
    return bvp;
  }

  const weights = new Array<number>(n).fill(0);
  let lastStart = -1;

  for (
    let start = 0;
    start + windowSamples <= n;
    start += stepSamples
  ) {
    applyChromWindow(samples, start, windowSamples, bvp, weights);
    lastStart = start;
  }

  const finalStart = n - windowSamples;
  if (finalStart >= 0 && finalStart !== lastStart) {
    applyChromWindow(samples, finalStart, windowSamples, bvp, weights);
  }

  for (let i = 0; i < n; i++) {
    if (weights[i] > EPSILON) {
      bvp[i] /= weights[i];
    }
  }

  return bvp;
}

function applyChromWindow(
  samples: RgbSample[],
  start: number,
  windowSamples: number,
  bvp: number[],
  weights: number[],
): void {
  const end = start + windowSamples;
  let meanR = 0;
  let meanG = 0;
  let meanB = 0;

  for (let i = start; i < end; i++) {
    const sample = samples[i]!;
    meanR += sample.r;
    meanG += sample.g;
    meanB += sample.b;
  }

  meanR = Math.max(meanR / windowSamples, EPSILON);
  meanG = Math.max(meanG / windowSamples, EPSILON);
  meanB = Math.max(meanB / windowSamples, EPSILON);

  const xs = new Array<number>(windowSamples);
  const ys = new Array<number>(windowSamples);

  for (let k = 0; k < windowSamples; k++) {
    const sample = samples[start + k]!;
    const rn = sample.r / meanR - 1;
    const gn = sample.g / meanG - 1;
    const bn = sample.b / meanB - 1;

    xs[k] = 3 * rn - 2 * gn;
    ys[k] = 1.5 * rn + gn - 1.5 * bn;
  }

  const alpha = getStddev(xs) / Math.max(getStddev(ys), EPSILON);

  for (let k = 0; k < windowSamples; k++) {
    const weight =
      0.5 * (1 - Math.cos((2 * Math.PI * k) / (windowSamples - 1)));
    const index = start + k;
    bvp[index] += (xs[k]! - alpha * ys[k]!) * weight;
    weights[index] += weight;
  }
}

function createWaveform(signal: number[], waveformSamples: number): number[] {
  const recent = signal.slice(-waveformSamples);
  if (recent.length < 2) return [];

  const mean = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const centered = recent.map(value => value - mean);
  const maxAbs = Math.max(...centered.map(value => Math.abs(value)), EPSILON);
  return centered.map(value => value / maxAbs);
}

function estimateRespirationRate(signal: number[], sampleRateHz: number): number {
  const minSamples = getSampleCount(15, sampleRateHz, 90);
  if (signal.length < minSamples) {
    return 0;
  }

  const recent = signal.slice(-minSamples);
  const detrended = detrendPolynomial(
    movingAverage(recent, getOddWindowSize(0.5, sampleRateHz, 5)),
    2,
  );
  const result = calculateFFTHeartRate(
    detrended,
    sampleRateHz,
    0.15,
    0.5,
    minSamples,
  );
  return result.quality >= 0.3 ? result.heartRate : 0;
}

function estimateHrFromPeaks(
  signal: number[],
  fs: number,
  minSamples: number,
): number {
  const n = signal.length;
  if (n < minSamples) return 0;

  const mean = signal.reduce((sum, value) => sum + value, 0) / n;
  const std = getStddev(signal);
  const threshold = mean + 0.45 * std;
  const minPeakDistance = Math.round((60 / HR_MAX_BPM) * fs);
  const peaks: number[] = [];
  let lastPeakIndex = -minPeakDistance;

  for (let i = 1; i < n - 1; i++) {
    if (
      signal[i]! > threshold &&
      signal[i]! > signal[i - 1]! &&
      signal[i]! > signal[i + 1]! &&
      i - lastPeakIndex >= minPeakDistance
    ) {
      peaks.push(i);
      lastPeakIndex = i;
    }
  }

  if (peaks.length < 3) return 0;

  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i]! - peaks[i - 1]!);
  }

  const medianInterval = median(intervals);
  if (medianInterval <= 0) return 0;

  const bpm = Math.round((60 * fs) / medianInterval);
  return bpm >= HR_MIN_BPM && bpm <= HR_MAX_BPM ? bpm : 0;
}

function movingAverage(signal: number[], windowSize: number): number[] {
  if (signal.length === 0) return [];

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
      sum += signal[j]!;
      count += 1;
    }
    result.push(sum / count);
  }

  return result;
}

function detrendPolynomial(signal: number[], order: number): number[] {
  const n = signal.length;
  if (n <= order + 1) {
    const mean = n > 0 ? signal.reduce((sum, value) => sum + value, 0) / n : 0;
    return signal.map(value => value - mean);
  }

  const x = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    x[i] = (2 * i) / (n - 1) - 1;
  }

  const cols = order + 1;
  const ata = new Array<number>(cols * cols).fill(0);
  const atb = new Array<number>(cols).fill(0);

  for (let i = 0; i < n; i++) {
    const powers = new Array<number>(cols);
    powers[0] = 1;
    for (let j = 1; j < cols; j++) {
      powers[j] = powers[j - 1]! * x[i]!;
    }

    for (let row = 0; row < cols; row++) {
      for (let col = 0; col < cols; col++) {
        ata[row * cols + col] += powers[row]! * powers[col]!;
      }
      atb[row] += powers[row]! * signal[i]!;
    }
  }

  const coeffs = solveLinearSystem(ata, atb, cols);
  const result = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    let trend = 0;
    let xp = 1;
    for (let j = 0; j < cols; j++) {
      trend += coeffs[j]! * xp;
      xp *= x[i]!;
    }
    result[i] = signal[i]! - trend;
  }

  return result;
}

function solveLinearSystem(A: number[], b: number[], n: number): number[] {
  const a = [...A];
  const x = [...b];

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    let maxValue = Math.abs(a[col * n + col]!);

    for (let row = col + 1; row < n; row++) {
      const value = Math.abs(a[row * n + col]!);
      if (value > maxValue) {
        maxValue = value;
        maxRow = row;
      }
    }

    if (maxRow !== col) {
      for (let j = 0; j < n; j++) {
        const tmp = a[col * n + j]!;
        a[col * n + j] = a[maxRow * n + j]!;
        a[maxRow * n + j] = tmp;
      }
      const tmp = x[col]!;
      x[col] = x[maxRow]!;
      x[maxRow] = tmp;
    }

    const pivot = a[col * n + col]!;
    if (Math.abs(pivot) < EPSILON) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = a[row * n + col]! / pivot;
      for (let j = col; j < n; j++) {
        a[row * n + j] -= factor * a[col * n + j]!;
      }
      x[row] -= factor * x[col]!;
    }
  }

  for (let row = n - 1; row >= 0; row--) {
    for (let col = row + 1; col < n; col++) {
      x[row] -= a[row * n + col]! * x[col]!;
    }
    const divisor = a[row * n + row]!;
    x[row] = Math.abs(divisor) > EPSILON ? x[row]! / divisor : 0;
  }

  return x;
}

function butterworthBandpass(
  signal: number[],
  fs: number,
  lowCut: number,
  highCut: number,
): number[] {
  if (signal.length < 3) return [...signal];

  const wl = lowCut / (fs / 2);
  const wh = highCut / (fs / 2);
  const omegaL = Math.tan((Math.PI * wl) / 2);
  const omegaH = Math.tan((Math.PI * wh) / 2);
  const bandwidth = omegaH - omegaL;
  const w0Squared = omegaL * omegaH;
  const denominator = 4 + 2 * bandwidth + w0Squared;

  const b0 = (2 * bandwidth) / denominator;
  const b1 = 0;
  const b2 = -(2 * bandwidth) / denominator;
  const a1 = (2 * w0Squared - 8) / denominator;
  const a2 = (4 - 2 * bandwidth + w0Squared) / denominator;

  const forward = iirFilter(signal, [b0, b1, b2], [1, a1, a2]);
  const backward = iirFilter([...forward].reverse(), [b0, b1, b2], [
    1,
    a1,
    a2,
  ]);
  return backward.reverse();
}

function iirFilter(signal: number[], b: number[], a: number[]): number[] {
  const order = Math.max(b.length, a.length) - 1;
  const result = new Array<number>(signal.length).fill(0);
  const state = new Array<number>(order).fill(0);

  for (let i = 0; i < signal.length; i++) {
    const y = b[0]! * signal[i]! + state[0]!;

    for (let j = 0; j < order - 1; j++) {
      state[j] =
        (b[j + 1] ?? 0) * signal[i]! -
        (a[j + 1] ?? 0) * y +
        state[j + 1]!;
    }

    state[order - 1] =
      (b[order] ?? 0) * signal[i]! - (a[order] ?? 0) * y;
    result[i] = y;
  }

  return result;
}

function calculateFFTHeartRate(
  signal: number[],
  fs: number,
  lowPass: number,
  highPass: number,
  minSamples: number,
): {heartRate: number; quality: number} {
  const n = signal.length;
  if (n < minSamples) {
    return {heartRate: 0, quality: 0};
  }

  const nfft = nextPowerOf2(n);
  const freqResolution = fs / nfft;
  const binLow = Math.ceil(lowPass / freqResolution);
  const binHigh = Math.floor(highPass / freqResolution);
  const binMax = Math.floor(nfft / 2);

  if (binLow >= binHigh || binHigh > binMax) {
    return {heartRate: 0, quality: 0};
  }

  const windowed = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const window =
      n > 1 ? 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1))) : 1;
    windowed[i] = signal[i]! * window;
  }

  let bestPower = 0;
  let bestBin = binLow;
  let totalNoisePower = 0;
  let noiseBins = 0;

  for (let k = 1; k <= binMax; k++) {
    const power = goertzelPower(windowed, k, nfft);
    if (k >= binLow && k <= binHigh) {
      if (power > bestPower) {
        if (bestPower > 0) {
          totalNoisePower += bestPower;
          noiseBins += 1;
        }
        bestPower = power;
        bestBin = k;
      } else {
        totalNoisePower += power;
        noiseBins += 1;
      }
    } else {
      totalNoisePower += power;
      noiseBins += 1;
    }
  }

  const averageNoisePower =
    noiseBins > 0 ? totalNoisePower / noiseBins : EPSILON;
  const snr = bestPower / Math.max(averageNoisePower, EPSILON);
  const quality = clamp01((snr - 1.6) / 7);

  if (quality < MIN_SIGNAL_QUALITY_FOR_HR) {
    return {heartRate: 0, quality};
  }

  const heartRate = Math.round(bestBin * freqResolution * 60);
  return {
    heartRate:
      heartRate >= HR_MIN_BPM && heartRate <= HR_MAX_BPM ? heartRate : 0,
    quality,
  };
}

function goertzelPower(signal: number[], k: number, nfft: number): number {
  const omega = (2 * Math.PI * k) / nfft;
  const coeff = 2 * Math.cos(omega);
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;

  for (let i = 0; i < signal.length; i++) {
    s0 = signal[i]! + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }

  for (let i = signal.length; i < nfft; i++) {
    s0 = coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }

  const real = s1 - s2 * Math.cos(omega);
  const imag = s2 * Math.sin(omega);
  return real * real + imag * imag;
}

function getStddev(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    values.length;
  return Math.sqrt(variance);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle]!;
  }

  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function nextPowerOf2(value: number): number {
  if (value <= 0) return 1;
  return 2 ** Math.ceil(Math.log2(value));
}
