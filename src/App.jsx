import { useMemo } from 'react';
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
  piecesPerContainer: '',
  leaveContainer: '',
  leavePieces: '',
};

function NumberField({ label, unit, value, onChange, integer = false }) {
  return (
    <label className="number-field">
      <span className="number-label">
        <span>{label}</span>
        {unit ? <span className="number-unit">{unit}</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={integer ? 'numeric' : 'decimal'}
        pattern={integer ? '-?[0-9]*' : undefined}
        autoComplete="off"
      />
    </label>
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

  const shiftResult = useMemo(() => calculateShiftCount(shiftValues), [shiftValues]);

  function updateWeightValue(key, value) {
    setWeightValues((current) => ({ ...current, [key]: value }));
  }

  function updateShiftValue(key, value) {
    setShiftValues((current) => ({ ...current, [key]: value }));
  }

  function clearShift() {
    setShiftValues(initialShiftValues);
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
            label="Cut Length"
            unit="inches"
            value={weightValues.cutLength}
            onChange={(value) => updateWeightValue('cutLength', value)}
          />
          <NumberField
            label="Units Per Container"
            value={weightValues.unitsPerContainer}
            onChange={(value) => updateWeightValue('unitsPerContainer', value)}
            integer
          />
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

          <NumberField
            label="Pieces Per Container"
            value={shiftValues.piecesPerContainer}
            onChange={(value) => updateShiftValue('piecesPerContainer', value)}
            integer
          />

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
