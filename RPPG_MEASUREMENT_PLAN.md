# rPPG 측정 정확도 개선 계획

## 요약

Apple Watch와 비교 시 rPPG BPM 수치가 크게 차이나고, 가만히 앉아있어도 측정할
때마다 결과가 달라지는 문제의 근본 원인을 rPPG-Toolbox 원본 소스코드 분석을
통해 파악했다.

**핵심 결론: 현재 앱은 TSCAN 모델이 기대하는 입력 전처리를 전혀 수행하지 않고
있고, 모델 출력에 대한 후처리도 원본과 완전히 다르다.**

---

## 문제 분석: 원본 vs 현재 앱 비교

### 문제 1: 전처리 완전 누락 (가장 치명적)

TSCAN 모델은 **6채널 입력**을 기대한다:

```python
# TS_CAN.py forward()
def forward(self, inputs, params=None):
    diff_input = inputs[:, :3, :, :]   # 채널 0~2: DiffNormalized
    raw_input = inputs[:, 3:, :, :]    # 채널 3~5: Standardized
```

rPPG-Toolbox의 `BaseLoader.preprocess()`에서 수행하는 전처리:

```python
# BaseLoader.py preprocess()
for data_type in config_preprocess.DATA_TYPE:
    f_c = frames.copy()
    if data_type == "DiffNormalized":
        data.append(BaseLoader.diff_normalize_data(f_c))
    elif data_type == "Standardized":
        data.append(BaseLoader.standardized_data(f_c))
data = np.concatenate(data, axis=-1)  # → 6채널 (DiffNorm 3ch + Std 3ch)
```

DiffNormalized 계산법:
```python
# BaseLoader.diff_normalize_data()
diffnormalized_data[j] = (data[j+1] - data[j]) / (data[j+1] + data[j] + 1e-7)
diffnormalized_data = diffnormalized_data / np.std(diffnormalized_data)
```

Standardized 계산법:
```python
# BaseLoader.standardized_data()
data = data - np.mean(data)
data = data / np.std(data)
```

> **현재 앱**: 카메라의 RGB float32 값을 아무 전처리 없이 그대로 모델에 넣고 있다.
> 모델은 6채널(DiffNorm + Std)을 기대하는데 3채널 raw RGB를 받고 있으므로,
> 모델 출력은 **의미 없는 노이즈**일 가능성이 높다.

### 문제 2: 모델 입력 shape과 채널 레이아웃 불일치

TFLite 모델의 입력 shape: `[1, 576, 320, 3, 10]`

TSCAN PyTorch 원본의 forward 입력:
```python
# 입력 shape: [N*T, C, H, W]  (NCHW 형식)
# 여기서 C=6 (DiffNorm 3ch + Std 3ch)
```

현재 TFLite 내보내기 시 어떻게 변환되었는지 확인이 필요하다. `[1, 576, 320, 3, 10]`
의 마지막 차원 10이 temporal depth라면, 모델 내부에서 reshape이 일어난다.

> **중요**: 현재 `writeFrameToBatch()`는 인터리브 방식으로 프레임을 배치에 쓴다:
> `batch[pc * RPPG_FRAME_COUNT + frameSlot] = source[pc]`
> 이것이 TFLite 모델이 기대하는 메모리 레이아웃과 일치하는지 검증 필요.

### 문제 3: 후처리 파이프라인 부재

rPPG-Toolbox의 `post_process.py`가 수행하는 후처리:

```python
# calculate_metric_per_video()
# 1. 레이블이 diff_flag일 때 cumsum으로 복원
if diff_flag:
    predictions = _detrend(np.cumsum(predictions), 100)

# 2. Detrend (λ=100 smoothness priors)
predictions = _detrend(predictions, 100)

# 3. Butterworth bandpass filter [0.6 ~ 3.3Hz] = [36 ~ 198 BPM]
[b, a] = butter(1, [0.6 / fs * 2, 3.3 / fs * 2], btype='bandpass')
predictions = scipy.signal.filtfilt(b, a, np.double(predictions))

# 4. FFT로 HR 계산
f_ppg, pxx_ppg = scipy.signal.periodogram(ppg_signal, fs=fs, nfft=N)
fmask_ppg = np.argwhere((f_ppg >= low_pass) & (f_ppg <= high_pass))
fft_hr = np.take(mask_ppg, np.argmax(mask_pxx, 0))[0] * 60
```

> **현재 앱의 `rppgSignalProcessing.ts`**: 단순히 DC 제거(평균 차감) 후
> 1 BPM 단위로 Goertzel-like DFT 스캔만 한다.
> detrend, bandpass filter, cumsum 복원이 전부 빠져 있다.

### 문제 4: Face Crop 미적용

rPPG-Toolbox는 반드시 face crop → resize(72×72 또는 36×36)를 수행한다.

> **현재 앱**: 전체 프레임(576×320)을 그대로 사용.
> 얼굴 이외의 배경, 옷, 조명 반사 등이 signal을 지배한다.

### 문제 5: 샘플링 레이트 불일치

- 원본 학습 데이터: 보통 30fps
- 현재 앱: 100ms 간격 수집 = 10Hz
- TSCAN의 Temporal Shift Module(TSM)은 30fps의 시간적 패턴을 학습했으므로,
  10Hz 수집은 모델이 학습한 시간 패턴과 맞지 않는다.

### 문제 6: 신호 품질 판정 기준 너무 낮음

- `MIN_SIGNAL_QUALITY_FOR_HR = 0.12` (12%)
- 이 임계값으로는 노이즈 피크도 통과시킨다.
- 결과: 측정할 때마다 다른 노이즈 피크가 "심박"으로 표시됨.

---

## 핵심 요약: 왜 지금 BPM이 틀리는가

```
┌──────────────────────────────────────────────────────────────┐
│  원본 rPPG-Toolbox 파이프라인                                  │
│                                                              │
│  Face Crop → Resize(72×72)                                   │
│  → DiffNormalize(3ch) + Standardize(3ch) = 6채널              │
│  → TSCAN 모델 → BVP 파형                                      │
│  → cumsum → Detrend(λ=100) → Bandpass(0.6~3.3Hz)             │
│  → FFT Periodogram → Peak frequency → HR (BPM)              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  현재 앱 파이프라인 (문제)                                      │
│                                                              │
│  Full Frame → Resize(576×320) ← face crop 없음               │
│  → Raw RGB 3채널 그대로 ← 전처리 없음 (6채널 기대하는데 3채널)     │
│  → TSCAN 모델 → ??? (노이즈)                                  │
│  → DC제거(평균차감) → DFT 스캔 ← detrend/bandpass 없음         │
│  → 노이즈에서 peak → 엉뚱한 BPM                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 수정 우선순위

### ⭐ P0: 모델 입력 스펙 확인 + 전처리 구현

**없으면 모델 출력 자체가 의미없다.**

1. `tscan_mobile_fp32.tflite`의 실제 input/output spec 로그 확인
2. 입력 채널 수 (3 vs 6) 판별
3. Case에 맞는 전처리(DiffNormalize + Standardize) 구현

### ⭐ P1: 후처리 파이프라인 구현

현재 `estimateHeartRateFromSpectrum()`을 rPPG-Toolbox 방식으로 교체:
1. cumsum (diff label 복원)
2. detrend (Tarvainen smoothness priors, λ=100)
3. Butterworth bandpass [0.6~3.3Hz]
4. FFT periodogram → peak frequency → BPM

### ⭐ P2: 샘플링 레이트를 30fps에 맞추기

```typescript
// 현재
const RPPG_SAMPLE_INTERVAL_MS = 100; // 10Hz
// 변경
const RPPG_SAMPLE_INTERVAL_MS = 33;  // ~30Hz
```

### P3: Face Crop 적용

`vision-camera-resize-plugin`의 crop 옵션 사용. JS/worklet 픽셀 루프 금지.

### P4: 신호 품질 기준 강화

```typescript
// 현재: 0.12 → 변경: 0.35
const MIN_SIGNAL_QUALITY_FOR_HR = 0.35;
```

---

## 구현 순서 (실행 계획)

### Step 1: 모델 입력 스펙 확인 (10분)

```typescript
console.log('rPPG model inputs:', JSON.stringify(rppgModel.inputs));
console.log('rPPG model outputs:', JSON.stringify(rppgModel.outputs));
```

### Step 2: 전처리 구현 (2~3시간)

**Case A: 6채널 입력** → DiffNormalize + Standardize 직접 계산
**Case B: 3채널 입력 (wrapper)** → 값 범위 확인 후 정규화

### Step 3: 후처리 구현 (1~2시간)

`rppgSignalProcessing.ts` 전면 개편:
- detrend, bandpass filter, FFT periodogram 구현

### Step 4: 샘플링 레이트 조정 (30분)

- `RPPG_SAMPLE_INTERVAL_MS = 33`
- `SAMPLE_RATE_HZ = 30`
- `MIN_SAMPLES_FOR_HR = 90`

### Step 5: 검증 (30분~1시간)

제어된 환경 (앉아서, 안정된 조명, 정면 응시)에서 Apple Watch와 동시 3회 비교.

---

## Open Questions (진행 전 확인 필요)

1. **TFLite 모델이 wrapper 포함 export인지**
   - `[1, 576, 320, 3, 10]` 입력에 wrapper가 DiffNorm + Std를 내부 처리하면
     별도 전처리 불필요할 수 있다

2. **RGB 값 범위**
   - `vision-camera-resize-plugin` float32 반환값이 0~1인지 0~255인지

3. **Butterworth filter JS 구현**
   - scipy.signal.filtfilt의 zero-phase filtering을 JS로 구현하거나
   - fili.js 같은 외부 라이브러리 사용

4. **Detrend 구현 복잡도**
   - 300×300 행렬 역연산 → JS에서 충분히 빠른지 (아마 괜찮음)

---

## 현재 코드 상태 참조

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/screens/CameraScreen.tsx` | 프레임 수집, 모델 추론, 측정 흐름 제어 |
| `src/utils/rppgSignalProcessing.ts` | BVP 후처리, HR/RR 추출 |
| `src/components/RppgVitalsHud.tsx` | 생체 신호 UI 표시 |
| `src/contexts/ModelContext.tsx` | TFLite 모델 로딩 |

### 측정 흐름 (CameraScreen.tsx)

```
pre-measuring → workout → post-measuring → results
```

측정 중 동작:
1. YOLO pose로 얼굴 box 감지 (1회)
2. 얼굴 확인 후 face lock
3. 100ms 간격으로 resize된 프레임(576×320) 수집
4. 10프레임 모이면 `writeFrameToBatch()` → `rppgModel.runSync()`
5. 출력 BVP 값을 `processRppgOutput()`으로 누적
6. 10초 후 측정 종료

### Current Important Constants

```typescript
const MEASUREMENT_DURATION_MS = 10000;    // 10초 측정
const RPPG_SAMPLE_INTERVAL_MS = 100;      // 10Hz 수집
const RPPG_FRAME_COUNT = 10;              // 10프레임 윈도우
const SAMPLE_RATE_HZ = 10;                // 신호 처리 기준 Hz
const MIN_SAMPLES_FOR_HR = 30;            // HR 추정 최소 샘플
const MIN_SIGNAL_QUALITY_FOR_HR = 0.12;   // 품질 임계값
```
