const KP_SCORE_THRESHOLD = 0.3;

export type ExerciseRepState =
  | 'UNKNOWN'
  | 'UP'
  | 'DOWN'
  | 'OPEN'
  | 'CLOSED'
  | 'LEFT'
  | 'RIGHT'
  | 'RAISED'
  | 'LOWERED';

export type ExerciseCounterMethod =
  | 'angle'
  | 'distance'
  | 'position'
  | 'trajectory'
  | 'time'
  | 'unsupported';

export type ExerciseCountResult = {
  count: number;
  state: ExerciseRepState;
  didCount: boolean;
};

export type ExerciseCounterGuide = {
  method: ExerciseCounterMethod;
  coachTitle: string;
  guideText: string;
};

type Point = {
  x: number;
  y: number;
};

export const COUNTABLE_EXERCISE_IDS = [
  'push-up',
  'diamond-push-up',
  'pike-push-up',
  'lateral-raise',
  'tricep-dips',
  'squat',
  'sumo-squat',
  'lunge',
  'side-lunge',
  'glute-bridge',
  'sit-up',
  'crunch',
  'leg-raise',
  'russian-twist',
  'plank-tap',
  'bicycle-crunch',
  'jumping-jack',
  'burpee',
  'mountain-climber',
  'plank-jack',
  'skaters',
  'superman',
  'bird-dog',
] as const;

export const TIME_BASED_EXERCISE_IDS = [
  'arm-circles',
  'flutter-kicks',
  'high-knees',
  'cat-cow',
  'standing-side-stretch',
  'cobra-stretch',
] as const;

export const UNSUPPORTED_COUNTER_EXERCISE_IDS = ['calf-raise'] as const;

export const isCountableExercise = (exerciseId: string) => {
  return COUNTABLE_EXERCISE_IDS.includes(
    exerciseId as (typeof COUNTABLE_EXERCISE_IDS)[number],
  );
};

export const getCountableExerciseId = (exerciseIds: string[]) => {
  return exerciseIds.find(isCountableExercise);
};

const noCount = (
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';
  return { count: currentCount, state: currentState, didCount: false };
};

const getKeypointScore = (flat: number[], keypointIndex: number) => {
  'worklet';
  return flat[keypointIndex * 3 + 2]!;
};

const hasKeypoint = (flat: number[], keypointIndex: number) => {
  'worklet';
  return getKeypointScore(flat, keypointIndex) > KP_SCORE_THRESHOLD;
};

const getPoint = (flat: number[], keypointIndex: number): Point | null => {
  'worklet';
  if (!hasKeypoint(flat, keypointIndex)) {
    return null;
  }

  return {
    x: flat[keypointIndex * 3]!,
    y: flat[keypointIndex * 3 + 1]!,
  };
};

const getRawPoint = (flat: number[], keypointIndex: number): Point => {
  'worklet';
  return {
    x: flat[keypointIndex * 3]!,
    y: flat[keypointIndex * 3 + 1]!,
  };
};

const getCenter = (
  flat: number[],
  firstKeypointIndex: number,
  secondKeypointIndex: number,
): Point | null => {
  'worklet';

  const first = getPoint(flat, firstKeypointIndex);
  const second = getPoint(flat, secondKeypointIndex);
  if (!first || !second) {
    return null;
  }

  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
};

const getDistance = (first: Point, second: Point) => {
  'worklet';
  const x = first.x - second.x;
  const y = first.y - second.y;
  return Math.sqrt(x * x + y * y);
};

const getShoulderWidth = (flat: number[]) => {
  'worklet';
  const leftShoulder = getPoint(flat, 5);
  const rightShoulder = getPoint(flat, 6);
  if (!leftShoulder || !rightShoulder) {
    return null;
  }

  return Math.max(getDistance(leftShoulder, rightShoulder), 1);
};

const getTorsoHeight = (flat: number[]) => {
  'worklet';
  const shoulderCenter = getCenter(flat, 5, 6);
  const hipCenter = getCenter(flat, 11, 12);
  if (!shoulderCenter || !hipCenter) {
    return null;
  }

  return Math.max(getDistance(shoulderCenter, hipCenter), 1);
};

const getJointAngle = (
  flat: number[],
  firstKeypointIndex: number,
  centerKeypointIndex: number,
  thirdKeypointIndex: number,
) => {
  'worklet';

  const firstScore = getKeypointScore(flat, firstKeypointIndex);
  const centerScore = getKeypointScore(flat, centerKeypointIndex);

  if (
    firstScore <= KP_SCORE_THRESHOLD ||
    centerScore <= KP_SCORE_THRESHOLD
  ) {
    return null;
  }

  const first = getRawPoint(flat, firstKeypointIndex);
  const center = getRawPoint(flat, centerKeypointIndex);
  const third = getRawPoint(flat, thirdKeypointIndex);

  const radians =
    Math.atan2(third.y - center.y, third.x - center.x) -
    Math.atan2(first.y - center.y, first.x - center.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return angle;
};

const pickMinAngle = (
  firstAngle: number | null,
  secondAngle: number | null,
) => {
  'worklet';
  if (firstAngle !== null && secondAngle !== null) {
    return Math.min(firstAngle, secondAngle);
  }

  return firstAngle ?? secondAngle;
};

const pickMaxAngle = (
  firstAngle: number | null,
  secondAngle: number | null,
) => {
  'worklet';
  if (firstAngle !== null && secondAngle !== null) {
    return Math.max(firstAngle, secondAngle);
  }

  return firstAngle ?? secondAngle;
};

const countFoldThenExtend = (
  angle: number | null,
  currentState: ExerciseRepState,
  currentCount: number,
  foldedAngle: number,
  extendedAngle: number,
): ExerciseCountResult => {
  'worklet';

  if (angle === null) {
    return noCount(currentState, currentCount);
  }

  if (angle <= foldedAngle) {
    return { count: currentCount, state: 'DOWN', didCount: false };
  }

  if (angle >= extendedAngle) {
    if (currentState === 'DOWN') {
      return { count: currentCount + 1, state: 'UP', didCount: true };
    }

    return { count: currentCount, state: 'UP', didCount: false };
  }

  return noCount(currentState, currentCount);
};

const countExtendThenFold = (
  angle: number | null,
  currentState: ExerciseRepState,
  currentCount: number,
  foldedAngle: number,
  extendedAngle: number,
): ExerciseCountResult => {
  'worklet';

  if (angle === null) {
    return noCount(currentState, currentCount);
  }

  if (angle >= extendedAngle) {
    return { count: currentCount, state: 'UP', didCount: false };
  }

  if (angle <= foldedAngle) {
    if (currentState === 'UP') {
      return { count: currentCount + 1, state: 'DOWN', didCount: true };
    }

    return { count: currentCount, state: 'DOWN', didCount: false };
  }

  return noCount(currentState, currentCount);
};

const countClosedThenOpen = (
  isOpen: boolean,
  isClosed: boolean,
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  if (isClosed) {
    return { count: currentCount, state: 'CLOSED', didCount: false };
  }

  if (isOpen) {
    if (currentState === 'CLOSED') {
      return { count: currentCount + 1, state: 'OPEN', didCount: true };
    }

    return { count: currentCount, state: 'OPEN', didCount: false };
  }

  return noCount(currentState, currentCount);
};

const countAlternatingSide = (
  side: ExerciseRepState | null,
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  if (side !== 'LEFT' && side !== 'RIGHT') {
    return noCount(currentState, currentCount);
  }

  if (currentState === 'LEFT' || currentState === 'RIGHT') {
    if (currentState !== side) {
      return { count: currentCount + 1, state: side, didCount: true };
    }
  }

  return { count: currentCount, state: side, didCount: false };
};

export const countPushUpRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const leftElbowAngle = getJointAngle(flat, 5, 7, 9);
  const rightElbowAngle = getJointAngle(flat, 6, 8, 10);

  return countFoldThenExtend(
    pickMinAngle(leftElbowAngle, rightElbowAngle),
    currentState,
    currentCount,
    95,
    155,
  );
};

export const countLateralRaiseRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const leftArmAngle = getJointAngle(flat, 11, 5, 9);
  const rightArmAngle = getJointAngle(flat, 12, 6, 10);
  const armAngle = pickMaxAngle(leftArmAngle, rightArmAngle);

  if (armAngle === null) {
    return noCount(currentState, currentCount);
  }

  if (armAngle <= 35) {
    return { count: currentCount, state: 'DOWN', didCount: false };
  }

  if (armAngle >= 70) {
    if (currentState === 'DOWN') {
      return { count: currentCount + 1, state: 'UP', didCount: true };
    }

    return { count: currentCount, state: 'UP', didCount: false };
  }

  return noCount(currentState, currentCount);
};

export const countSquatRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const leftKneeAngle = getJointAngle(flat, 11, 13, 15);
  const rightKneeAngle = getJointAngle(flat, 12, 14, 16);

  return countFoldThenExtend(
    pickMinAngle(leftKneeAngle, rightKneeAngle),
    currentState,
    currentCount,
    105,
    155,
  );
};

export const countLungeRep = countSquatRep;

export const countSideLungeRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const leftKneeAngle = getJointAngle(flat, 11, 13, 15);
  const rightKneeAngle = getJointAngle(flat, 12, 14, 16);

  return countFoldThenExtend(
    pickMinAngle(leftKneeAngle, rightKneeAngle),
    currentState,
    currentCount,
    110,
    155,
  );
};

export const countGluteBridgeRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const leftHipAngle = getJointAngle(flat, 5, 11, 13);
  const rightHipAngle = getJointAngle(flat, 6, 12, 14);

  return countFoldThenExtend(
    pickMaxAngle(leftHipAngle, rightHipAngle),
    currentState,
    currentCount,
    145,
    165,
  );
};

export const countSitUpRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const leftHipAngle = getJointAngle(flat, 5, 11, 13);
  const rightHipAngle = getJointAngle(flat, 6, 12, 14);

  return countExtendThenFold(
    pickMinAngle(leftHipAngle, rightHipAngle),
    currentState,
    currentCount,
    110,
    155,
  );
};

export const countCrunchRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const leftHipAngle = getJointAngle(flat, 5, 11, 13);
  const rightHipAngle = getJointAngle(flat, 6, 12, 14);

  return countExtendThenFold(
    pickMinAngle(leftHipAngle, rightHipAngle),
    currentState,
    currentCount,
    135,
    160,
  );
};

export const countLegRaiseRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const leftHipAngle = getJointAngle(flat, 5, 11, 15);
  const rightHipAngle = getJointAngle(flat, 6, 12, 16);

  return countExtendThenFold(
    pickMinAngle(leftHipAngle, rightHipAngle),
    currentState,
    currentCount,
    110,
    160,
  );
};

export const countRussianTwistRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const shoulderWidth = getShoulderWidth(flat);
  const hipCenter = getCenter(flat, 11, 12);
  const leftWrist = getPoint(flat, 9);
  const rightWrist = getPoint(flat, 10);

  if (!shoulderWidth || !hipCenter || !leftWrist || !rightWrist) {
    return noCount(currentState, currentCount);
  }

  const handX = (leftWrist.x + rightWrist.x) / 2;
  const offset = handX - hipCenter.x;
  const threshold = shoulderWidth * 0.35;

  if (offset < -threshold) {
    return countAlternatingSide('LEFT', currentState, currentCount);
  }

  if (offset > threshold) {
    return countAlternatingSide('RIGHT', currentState, currentCount);
  }

  return noCount(currentState, currentCount);
};

export const countPlankTapRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const shoulderWidth = getShoulderWidth(flat);
  const leftWrist = getPoint(flat, 9);
  const rightWrist = getPoint(flat, 10);
  const leftShoulder = getPoint(flat, 5);
  const rightShoulder = getPoint(flat, 6);

  if (
    !shoulderWidth ||
    !leftWrist ||
    !rightWrist ||
    !leftShoulder ||
    !rightShoulder
  ) {
    return noCount(currentState, currentCount);
  }

  const threshold = shoulderWidth * 0.65;
  if (getDistance(leftWrist, rightShoulder) < threshold) {
    return countAlternatingSide('LEFT', currentState, currentCount);
  }

  if (getDistance(rightWrist, leftShoulder) < threshold) {
    return countAlternatingSide('RIGHT', currentState, currentCount);
  }

  return noCount(currentState, currentCount);
};

export const countBicycleCrunchRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const torsoHeight = getTorsoHeight(flat);
  const leftElbow = getPoint(flat, 7);
  const rightElbow = getPoint(flat, 8);
  const leftKnee = getPoint(flat, 13);
  const rightKnee = getPoint(flat, 14);

  if (!torsoHeight || !leftElbow || !rightElbow || !leftKnee || !rightKnee) {
    return noCount(currentState, currentCount);
  }

  const threshold = torsoHeight * 0.5;
  if (getDistance(leftElbow, rightKnee) < threshold) {
    return countAlternatingSide('LEFT', currentState, currentCount);
  }

  if (getDistance(rightElbow, leftKnee) < threshold) {
    return countAlternatingSide('RIGHT', currentState, currentCount);
  }

  return noCount(currentState, currentCount);
};

export const countJumpingJackRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const shoulderWidth = getShoulderWidth(flat);
  const leftWrist = getPoint(flat, 9);
  const rightWrist = getPoint(flat, 10);
  const leftShoulder = getPoint(flat, 5);
  const rightShoulder = getPoint(flat, 6);
  const leftAnkle = getPoint(flat, 15);
  const rightAnkle = getPoint(flat, 16);

  if (
    !shoulderWidth ||
    !leftWrist ||
    !rightWrist ||
    !leftShoulder ||
    !rightShoulder ||
    !leftAnkle ||
    !rightAnkle
  ) {
    return noCount(currentState, currentCount);
  }

  const ankleDistance = getDistance(leftAnkle, rightAnkle);
  const handsAreUp = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
  const handsAreDown = leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y;
  const isOpen = handsAreUp && ankleDistance > shoulderWidth * 1.55;
  const isClosed = handsAreDown && ankleDistance < shoulderWidth * 1.25;

  return countClosedThenOpen(isOpen, isClosed, currentState, currentCount);
};

export const countMountainClimberRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const torsoHeight = getTorsoHeight(flat);
  const leftHip = getPoint(flat, 11);
  const rightHip = getPoint(flat, 12);
  const leftKnee = getPoint(flat, 13);
  const rightKnee = getPoint(flat, 14);

  if (!torsoHeight || !leftHip || !rightHip || !leftKnee || !rightKnee) {
    return noCount(currentState, currentCount);
  }

  const kneeLift = torsoHeight * 0.3;
  if (leftKnee.y < leftHip.y + kneeLift) {
    return countAlternatingSide('LEFT', currentState, currentCount);
  }

  if (rightKnee.y < rightHip.y + kneeLift) {
    return countAlternatingSide('RIGHT', currentState, currentCount);
  }

  return noCount(currentState, currentCount);
};

export const countPlankJackRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const shoulderWidth = getShoulderWidth(flat);
  const leftAnkle = getPoint(flat, 15);
  const rightAnkle = getPoint(flat, 16);

  if (!shoulderWidth || !leftAnkle || !rightAnkle) {
    return noCount(currentState, currentCount);
  }

  const ankleDistance = getDistance(leftAnkle, rightAnkle);
  const isOpen = ankleDistance > shoulderWidth * 1.65;
  const isClosed = ankleDistance < shoulderWidth * 1.2;

  return countClosedThenOpen(isOpen, isClosed, currentState, currentCount);
};

export const countSkatersRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const shoulderWidth = getShoulderWidth(flat);
  const hipCenter = getCenter(flat, 11, 12);
  const leftAnkle = getPoint(flat, 15);
  const rightAnkle = getPoint(flat, 16);

  if (!shoulderWidth || !hipCenter || !leftAnkle || !rightAnkle) {
    return noCount(currentState, currentCount);
  }

  const ankleCenterX = (leftAnkle.x + rightAnkle.x) / 2;
  const offset = hipCenter.x - ankleCenterX;
  const threshold = shoulderWidth * 0.25;

  if (offset < -threshold) {
    return countAlternatingSide('LEFT', currentState, currentCount);
  }

  if (offset > threshold) {
    return countAlternatingSide('RIGHT', currentState, currentCount);
  }

  return noCount(currentState, currentCount);
};

export const countSupermanRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const leftWrist = getPoint(flat, 9);
  const rightWrist = getPoint(flat, 10);
  const leftShoulder = getPoint(flat, 5);
  const rightShoulder = getPoint(flat, 6);
  const leftAnkle = getPoint(flat, 15);
  const rightAnkle = getPoint(flat, 16);
  const leftHip = getPoint(flat, 11);
  const rightHip = getPoint(flat, 12);

  if (
    !leftWrist ||
    !rightWrist ||
    !leftShoulder ||
    !rightShoulder ||
    !leftAnkle ||
    !rightAnkle ||
    !leftHip ||
    !rightHip
  ) {
    return noCount(currentState, currentCount);
  }

  const armsRaised = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
  const legsRaised = leftAnkle.y < leftHip.y && rightAnkle.y < rightHip.y;
  const lowered = leftWrist.y >= leftShoulder.y && rightWrist.y >= rightShoulder.y;

  if (lowered) {
    return { count: currentCount, state: 'LOWERED', didCount: false };
  }

  if (armsRaised && legsRaised) {
    if (currentState === 'LOWERED') {
      return { count: currentCount + 1, state: 'RAISED', didCount: true };
    }

    return { count: currentCount, state: 'RAISED', didCount: false };
  }

  return noCount(currentState, currentCount);
};

export const countBirdDogRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const shoulderWidth = getShoulderWidth(flat);
  const leftWrist = getPoint(flat, 9);
  const rightWrist = getPoint(flat, 10);
  const leftShoulder = getPoint(flat, 5);
  const rightShoulder = getPoint(flat, 6);
  const leftAnkle = getPoint(flat, 15);
  const rightAnkle = getPoint(flat, 16);
  const leftHip = getPoint(flat, 11);
  const rightHip = getPoint(flat, 12);

  if (
    !shoulderWidth ||
    !leftWrist ||
    !rightWrist ||
    !leftShoulder ||
    !rightShoulder ||
    !leftAnkle ||
    !rightAnkle ||
    !leftHip ||
    !rightHip
  ) {
    return noCount(currentState, currentCount);
  }

  const reach = shoulderWidth * 0.45;
  const leftArmRightLeg =
    leftWrist.x < leftShoulder.x - reach && rightAnkle.x > rightHip.x + reach;
  const rightArmLeftLeg =
    rightWrist.x > rightShoulder.x + reach && leftAnkle.x < leftHip.x - reach;

  if (leftArmRightLeg) {
    return countAlternatingSide('LEFT', currentState, currentCount);
  }

  if (rightArmLeftLeg) {
    return countAlternatingSide('RIGHT', currentState, currentCount);
  }

  return noCount(currentState, currentCount);
};

export const countBurpeeRep = (
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  const shoulderCenter = getCenter(flat, 5, 6);
  const hipCenter = getCenter(flat, 11, 12);
  const leftWrist = getPoint(flat, 9);
  const rightWrist = getPoint(flat, 10);
  const leftAnkle = getPoint(flat, 15);
  const rightAnkle = getPoint(flat, 16);

  if (!shoulderCenter || !hipCenter || !leftWrist || !rightWrist || !leftAnkle || !rightAnkle) {
    return noCount(currentState, currentCount);
  }

  const handsNearFloor = leftWrist.y > hipCenter.y && rightWrist.y > hipCenter.y;
  const feetWide = getDistance(leftAnkle, rightAnkle) > getDistance(leftWrist, rightWrist) * 0.7;
  const isDown = handsNearFloor && feetWide;
  const isUp = shoulderCenter.y < hipCenter.y && leftWrist.y < shoulderCenter.y && rightWrist.y < shoulderCenter.y;

  if (isDown) {
    return { count: currentCount, state: 'DOWN', didCount: false };
  }

  if (isUp) {
    if (currentState === 'DOWN') {
      return { count: currentCount + 1, state: 'UP', didCount: true };
    }

    return { count: currentCount, state: 'UP', didCount: false };
  }

  return noCount(currentState, currentCount);
};

export const countExerciseRep = (
  exerciseId: string,
  flat: number[],
  currentState: ExerciseRepState,
  currentCount: number,
): ExerciseCountResult => {
  'worklet';

  switch (exerciseId) {
    case 'push-up':
    case 'diamond-push-up':
    case 'pike-push-up':
    case 'tricep-dips':
      return countPushUpRep(flat, currentState, currentCount);
    case 'lateral-raise':
      return countLateralRaiseRep(flat, currentState, currentCount);
    case 'squat':
    case 'sumo-squat':
      return countSquatRep(flat, currentState, currentCount);
    case 'lunge':
      return countLungeRep(flat, currentState, currentCount);
    case 'side-lunge':
      return countSideLungeRep(flat, currentState, currentCount);
    case 'glute-bridge':
      return countGluteBridgeRep(flat, currentState, currentCount);
    case 'sit-up':
      return countSitUpRep(flat, currentState, currentCount);
    case 'crunch':
      return countCrunchRep(flat, currentState, currentCount);
    case 'leg-raise':
      return countLegRaiseRep(flat, currentState, currentCount);
    case 'russian-twist':
      return countRussianTwistRep(flat, currentState, currentCount);
    case 'plank-tap':
      return countPlankTapRep(flat, currentState, currentCount);
    case 'bicycle-crunch':
      return countBicycleCrunchRep(flat, currentState, currentCount);
    case 'jumping-jack':
      return countJumpingJackRep(flat, currentState, currentCount);
    case 'burpee':
      return countBurpeeRep(flat, currentState, currentCount);
    case 'mountain-climber':
      return countMountainClimberRep(flat, currentState, currentCount);
    case 'plank-jack':
      return countPlankJackRep(flat, currentState, currentCount);
    case 'skaters':
      return countSkatersRep(flat, currentState, currentCount);
    case 'superman':
      return countSupermanRep(flat, currentState, currentCount);
    case 'bird-dog':
      return countBirdDogRep(flat, currentState, currentCount);
    default:
      return noCount(currentState, currentCount);
  }
};

export const getExerciseCounterGuide = (
  exerciseId: string,
): ExerciseCounterGuide => {
  switch (exerciseId) {
    case 'lunge':
    case 'side-lunge':
    case 'squat':
    case 'sumo-squat':
      return {
        method: 'angle',
        coachTitle: '골반과 양쪽 무릎을 화면 안에 맞춰주세요',
        guideText: '무릎 각도가 내려갔다 펴질 때마다 1회로 기록됩니다',
      };
    case 'lateral-raise':
      return {
        method: 'angle',
        coachTitle: '양쪽 어깨와 손목을 화면 안에 맞춰주세요',
        guideText: '팔이 내려갔다 어깨 높이까지 올라오면 1회로 기록됩니다',
      };
    case 'sit-up':
    case 'crunch':
    case 'leg-raise':
    case 'glute-bridge':
      return {
        method: 'angle',
        coachTitle: '어깨, 골반, 무릎이 보이게 옆으로 맞춰주세요',
        guideText: '몸통이나 다리 각도 변화가 한 번 완성되면 1회로 기록됩니다',
      };
    case 'russian-twist':
    case 'plank-tap':
    case 'bicycle-crunch':
      return {
        method: 'distance',
        coachTitle: '양쪽 어깨, 팔꿈치, 손목, 무릎을 화면 안에 맞춰주세요',
        guideText: '좌우 터치 또는 교차 동작이 바뀔 때마다 1회로 기록됩니다',
      };
    case 'jumping-jack':
    case 'plank-jack':
      return {
        method: 'distance',
        coachTitle: '양손과 양발이 모두 보이게 전신을 맞춰주세요',
        guideText: '모은 자세에서 벌린 자세로 바뀔 때마다 1회로 기록됩니다',
      };
    case 'mountain-climber':
    case 'skaters':
    case 'bird-dog':
      return {
        method: 'position',
        coachTitle: '전신이 화면에 들어오게 거리를 조금 넓혀주세요',
        guideText: '좌우 동작이 번갈아 감지될 때마다 1회로 기록됩니다',
      };
    case 'burpee':
    case 'superman':
      return {
        method: 'position',
        coachTitle: '손목부터 발목까지 전신이 보이게 맞춰주세요',
        guideText: '내려간 자세에서 올라온 자세로 바뀌면 1회로 기록됩니다',
      };
    case 'arm-circles':
    case 'flutter-kicks':
    case 'high-knees':
    case 'cat-cow':
    case 'standing-side-stretch':
    case 'cobra-stretch':
      return {
        method: 'time',
        coachTitle: '동작이 잘 보이도록 화면 중앙에 서주세요',
        guideText: '이 운동은 반복 횟수보다 유지 시간 기준으로 기록하는 편이 좋습니다',
      };
    case 'calf-raise':
      return {
        method: 'unsupported',
        coachTitle: '종아리와 발목이 보이게 맞춰주세요',
        guideText: '현재 모델은 발끝과 뒤꿈치 키포인트가 없어 정확한 자동 카운트가 어렵습니다',
      };
    default:
      return {
        method: 'angle',
        coachTitle: '주요 관절이 화면 안에 들어오게 맞춰주세요',
        guideText: '지원되는 운동은 자세 변화가 완성될 때마다 1회로 기록됩니다',
      };
  }
};
