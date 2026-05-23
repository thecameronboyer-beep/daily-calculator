export const GRAMS_PER_POUND = 453.592;

export function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return Number.NaN;
  }

  const normalized = String(value).replaceAll(',', '').trim();
  if (normalized === '') {
    return Number.NaN;
  }

  return Number(normalized);
}

export function isPositive(value) {
  const number = toNumber(value);
  return Number.isFinite(number) && number > 0;
}

export function isNonNegativeInteger(value) {
  const number = toNumber(value);
  return Number.isInteger(number) && number >= 0;
}

export function isInteger(value) {
  const number = toNumber(value);
  return Number.isInteger(number);
}

export function calculateSixSampleWeight(sampleGramsValue, cutLengthValue, unitsPerContainerValue) {
  const sampleGrams = toNumber(sampleGramsValue);
  const cutLength = toNumber(cutLengthValue);
  const unitsPerContainer = toNumber(unitsPerContainerValue);

  if (!isPositive(sampleGrams) || !isPositive(cutLength)) {
    return null;
  }

  const singleUnitGrams = (sampleGrams / 6) * cutLength;
  const gramWeightPerFoot = (sampleGrams / 6) * 12;

  return {
    singleUnitGrams,
    gramWeightPerFoot,
    singleUnitPounds: singleUnitGrams / GRAMS_PER_POUND,
    containerWeightPounds: isPositive(unitsPerContainer)
      ? (singleUnitGrams * unitsPerContainer) / GRAMS_PER_POUND
      : null,
  };
}

export function calculateShortSampleWeight(sampleGramsValue, cutLengthValue, unitsPerContainerValue) {
  const sampleGrams = toNumber(sampleGramsValue);
  const cutLength = toNumber(cutLengthValue);
  const unitsPerContainer = toNumber(unitsPerContainerValue);

  if (!isPositive(sampleGrams) || !isPositive(cutLength)) {
    return null;
  }

  return {
    gramWeightPerFoot: (sampleGrams / cutLength) * 12,
    singleUnitPounds: sampleGrams / GRAMS_PER_POUND,
    containerWeightPounds: isPositive(unitsPerContainer)
      ? (sampleGrams * unitsPerContainer) / GRAMS_PER_POUND
      : null,
  };
}

export function calculateShiftCount(values) {
  const arriveContainer = toNumber(values.arriveContainer);
  const arrivePieces = toNumber(values.arrivePieces);
  const piecesPerContainer = toNumber(values.piecesPerContainer);
  const leaveContainer = toNumber(values.leaveContainer);
  const leavePieces = toNumber(values.leavePieces);

  if (
    !isInteger(arriveContainer) ||
    !isNonNegativeInteger(arrivePieces) ||
    !isPositive(piecesPerContainer) ||
    !Number.isInteger(piecesPerContainer) ||
    !isInteger(leaveContainer) ||
    !isNonNegativeInteger(leavePieces)
  ) {
    return null;
  }

  const containersCompleted = leaveContainer - arriveContainer;
  const piecesMade = containersCompleted * piecesPerContainer + leavePieces - arrivePieces;

  return {
    containersCompleted,
    piecesMade,
  };
}
