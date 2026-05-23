import { useId, useMemo } from 'react';
import {
  calculateShiftCount,
  calculateShortSampleWeight,
  calculateSixSampleWeight,
} from './formulas.js';
import { formatNumber } from './formatters.js';
import { usePersistentState } from './usePersistentState.js';

const initialWeightValues = {
  mode: 'six',
  sixSampleGrams: '',
  shortSampleGrams: '',
  cutLength: '',
  unitsPerContainer: '',
};

const initialShiftValues = {
  arriveContainer: '',
  arrivePieces: '',
  leaveContainer: '',
  leavePieces: '',
};

const CUT_LENGTH_STEP = 1 / 16;
const CUT_LENGTH_DENOMINATOR = 16;

function formatInputDecimal(value) {
  return Number(value.toFixed(4)).toString();
}

function parseInputNumber(value) {
  return Number(String(value).replaceAll(',', '').trim());
}

function greatestCommonDivisor(firstValue, secondValue) {
  let first = Math.abs(firstValue);
  let second = Math.abs(secondValue);

  while (second) {
    const remainder = first % second;
    first = second;
    second = remainder;
  }

  return first || 1;
}

function formatCutLengthFraction(value) {
  const number = parseInputNumber(value);

  if (!Number.isFinite(number) || number <= 0) {
    return '-';
  }

  let whole = Math.floor(number);
  let numerator = Math.round((number - whole) * CUT_LENGTH_DENOMINATOR);

  if (numerator === CUT_LENGTH_DENOMINATOR) {
    whole += 1;
    numerator = 0;
  }

  if (numerator === 0) {
    return `${whole}"`;
  }

  const divisor = greatestCommonDivisor(numerator, CUT_LENGTH_DENOMINATOR);
  const reducedNumerator = numerator / divisor;
  const reducedDenominator = CUT_LENGTH_DENOMINATOR / divisor;
  const fraction = `${reducedNumerator}/${reducedDenominator}"`;

  return whole > 0 ? `${whole} ${fraction}` : fraction;
}

function NumberField({ label, unit, value, onChange, integer = false, children, className = '' }) {
  const inputId = useId();

  return (
    <div className={`number-field ${className}`}>
      <label className="number-label" htmlFor={inputId}>
        <span>{label}</span>
        {unit ? <span className="number-unit">{unit}</span> : null}
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={integer ? 'numeric' : 'decimal'}
        pattern={integer ? '-?[0-9]*' : undefined}
        autoComplete="off"
      />
      {children}
    </div>
  );
}

function ResultCard({ label, value, detail, priority = false }) {
  return (
    <div className={`result-card ${priority ? 'priority' : ''}`}>
      <span className="result-label">{label}</span>
      <strong className="result-value">{value}</strong>
      {detail ? <span className="result-detail">{detail}</span> : null}
    </div>
  );
}

export default function App() {
  const [weightValues, setWeightValues] = usePersistentState(
    'daily-calculator:weight-values',
    initialWeightValues
  );
  const [shiftValues, setShiftValues] = usePersistentState(
    'daily-calculator:shift-values',
    initialShiftValues
  );

  const weightResult = useMemo(() => {
    if (weightValues.mode === 'six') {
      return calculateSixSampleWeight(
        weightValues.sixSampleGrams,
        weightValues.cutLength,
        weightValues.unitsPerContainer
      );
    }

    return calculateShortSampleWeight(
      weightValues.shortSampleGrams,
      weightValues.cutLength,
      weightValues.unitsPerContainer
    );
  }, [weightValues]);

  const shiftResult = useMemo(
    () => calculateShiftCount(shiftValues, weightValues.unitsPerContainer),
    [shiftValues, weightValues.unitsPerContainer]
  );

  function updateWeightValue(key, value) {
    setWeightValues((current) => ({ ...current, [key]: value }));
  }

  function updateShiftValue(key, value) {
    setShiftValues((current) => ({ ...current, [key]: value }));
  }

  function clearShift() {
    setShiftValues(initialShiftValues);
  }

  function adjustCutLength(delta) {
    setWeightValues((current) => {
      const currentValue = parseInputNumber(current.cutLength);

      if (!Number.isFinite(currentValue) || currentValue <= 0) {
        return delta > 0
          ? { ...current, cutLength: formatInputDecimal(CUT_LENGTH_STEP) }
          : current;
      }

      const nextValue = Math.max(CUT_LENGTH_STEP, currentValue + delta);

      return {
        ...current,
        cutLength: formatInputDecimal(nextValue),
      };
    });
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-mark" aria-hidden="true">
          ∑
        </div>
        <div>
          <p className="eyebrow">Operator Daily</p>
          <h1>Daily</h1>
        </div>
      </header>

      <section className="panel unit-panel" aria-labelledby="unit-weight-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Unit Weight</p>
            <h2 id="unit-weight-heading">Sample Weight</h2>
          </div>
        </div>

        <div className="mode-toggle" aria-label="Unit weight mode">
          <button
            className={weightValues.mode === 'six' ? 'active' : ''}
            type="button"
            onClick={() => updateWeightValue('mode', 'six')}
          >
            6&quot; Sample
          </button>
          <button
            className={weightValues.mode === 'short' ? 'active' : ''}
            type="button"
            onClick={() => updateWeightValue('mode', 'short')}
          >
            Less Than 6&quot; Sample
          </button>
        </div>

        <div className="input-grid three-up">
          {weightValues.mode === 'six' ? (
            <NumberField
              label={'6" Sample Weight'}
              unit="g"
              value={weightValues.sixSampleGrams}
              onChange={(value) => updateWeightValue('sixSampleGrams', value)}
            />
          ) : (
            <NumberField
              label={'Less Than 6" Sample'}
              unit="g"
              value={weightValues.shortSampleGrams}
              onChange={(value) => updateWeightValue('shortSampleGrams', value)}
            />
          )}
          <NumberField
            label="Units Per Container"
            value={weightValues.unitsPerContainer}
            onChange={(value) => updateWeightValue('unitsPerContainer', value)}
            integer
          />
          <NumberField
            label="Cut Length"
            unit="inches"
            value={weightValues.cutLength}
            onChange={(value) => updateWeightValue('cutLength', value)}
            className="cut-length-field"
          >
            <div className="cut-fraction-display" aria-live="polite">
              <span>Fraction</span>
              <strong>{formatCutLengthFraction(weightValues.cutLength)}</strong>
            </div>
            <div className="cut-step-controls" aria-label="Cut length adjustments">
              <button type="button" onClick={() => adjustCutLength(-CUT_LENGTH_STEP)}>
                - 1/16&quot;
              </button>
              <button type="button" onClick={() => adjustCutLength(CUT_LENGTH_STEP)}>
                + 1/16&quot;
              </button>
            </div>
          </NumberField>
        </div>

        <div className="result-grid">
          {weightValues.mode === 'six' ? (
            <ResultCard
              label="Gram Weight Per Unit"
              value={
                weightResult
                  ? formatNumber(weightResult.singleUnitGrams, { suffix: ' g' })
                  : '-'
              }
            />
          ) : null}
          <ResultCard
            label="Gram Weight/Foot"
            value={
              weightResult ? formatNumber(weightResult.gramWeightPerFoot, { suffix: ' g/ft' }) : '-'
            }
          />
          <ResultCard
            label="Unit Weight Pounds"
            value={
              weightResult
                ? formatNumber(weightResult.singleUnitPounds, {
                    maximumFractionDigits: 4,
                    suffix: ' lb',
                  })
                : '-'
            }
          />
          <ResultCard
            label="Container Weight"
            value={
              weightResult
                ? formatNumber(weightResult.containerWeightPounds, {
                    maximumFractionDigits: 2,
                    suffix: ' lb',
                  })
                : '-'
            }
          />
        </div>
      </section>

      <section className="panel shift-panel" aria-labelledby="shift-count-heading">
        <div className="section-heading with-action">
          <div>
            <p className="eyebrow">Shift Count</p>
            <h2 id="shift-count-heading">Pieces Made</h2>
          </div>
          <button className="utility-button" type="button" onClick={clearShift}>
            Clear Shift
          </button>
        </div>

        <div className="shift-groups">
          <div className="shift-group">
            <p className="group-label">When Arrived</p>
            <div className="input-grid two-up">
              <NumberField
                label="Container"
                value={shiftValues.arriveContainer}
                onChange={(value) => updateShiftValue('arriveContainer', value)}
                integer
              />
              <NumberField
                label="Pieces In Container"
                value={shiftValues.arrivePieces}
                onChange={(value) => updateShiftValue('arrivePieces', value)}
                integer
              />
            </div>
          </div>

          <div className="shift-group">
            <p className="group-label">When Leaving</p>
            <div className="input-grid two-up">
              <NumberField
                label="Container"
                value={shiftValues.leaveContainer}
                onChange={(value) => updateShiftValue('leaveContainer', value)}
                integer
              />
              <NumberField
                label="Pieces In Container"
                value={shiftValues.leavePieces}
                onChange={(value) => updateShiftValue('leavePieces', value)}
                integer
              />
            </div>
          </div>
        </div>

        <div className="result-grid shift-results">
          <ResultCard
            label="Containers Completed"
            value={shiftResult ? formatNumber(shiftResult.containersCompleted) : '-'}
            priority
          />
          <ResultCard
            label="Pieces Made"
            value={shiftResult ? formatNumber(shiftResult.piecesMade) : '-'}
            priority
          />
        </div>
      </section>
    </main>
  );
}
