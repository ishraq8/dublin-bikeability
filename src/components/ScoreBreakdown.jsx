import { computeComponentScores } from '../utils/scoring.js';
import { SCHOOL_COLORS, SCHOOL_NAMES } from '../utils/colors.js';

const MONO = "'JetBrains Mono', monospace";
const COND = "'Barlow Condensed', sans-serif";

const COMPONENTS = [
  { key: 'trail',     label: 'Trail',     max: 40 },
  { key: 'distance',  label: 'Distance',  max: 35 },
  { key: 'crossings', label: 'Crossings', max: 10 },
  { key: 'terrain',   label: 'Terrain',   max: 15 },
];

function Divider() {
  return <div style={{ width: 1, alignSelf: 'stretch', backgroundColor: '#ebebeb', margin: '0 4px' }} />;
}

export default function ScoreBreakdown({ neighborhood, activeSchool }) {
  const schoolData = neighborhood?.schools[activeSchool];
  const components = computeComponentScores(schoolData);
  const color = SCHOOL_COLORS[activeSchool];
  const score = schoolData?.score;
  const schoolShort = SCHOOL_NAMES[activeSchool].replace('Dublin ', '');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '12px 24px',
      borderLeft: `4px solid ${color}`,
      transition: 'border-left-color 0.2s ease',
      minHeight: 72,
    }}>

      {/* Score hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
        <span style={{
          fontFamily: MONO,
          fontWeight: 600,
          fontSize: 32,
          lineHeight: 1,
          color: score !== null ? color : '#ccc',
          transition: 'color 0.2s ease',
        }}>
          {score ?? '—'}
        </span>
        <span style={{ fontFamily: COND, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#bbb', textTransform: 'uppercase', marginTop: 2 }}>
          Score
        </span>
      </div>

      <Divider />

      {/* Name + school badge */}
      <div style={{ minWidth: 150 }}>
        <div style={{ fontFamily: COND, fontWeight: 600, fontSize: 15, color: '#111', lineHeight: 1.2 }}>
          {neighborhood.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{
            fontFamily: COND,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#fff',
            backgroundColor: color,
            padding: '2px 7px',
            borderRadius: 2,
            transition: 'background-color 0.2s ease',
          }}>
            {schoolShort}
          </span>
          {neighborhood.redistricting && (
            <span style={{
              fontFamily: COND,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#b45309',
              border: '1px solid #d97706',
              borderRadius: 2,
              padding: '1px 5px',
            }}>
              REDIST
            </span>
          )}
        </div>
      </div>

      <Divider />

      {/* Component bars */}
      {components ? (
        <div style={{ display: 'flex', gap: 20, flex: 1 }}>
          {COMPONENTS.map(({ key, label, max }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 88 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: COND, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#aaa', textTransform: 'uppercase' }}>
                  {label}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#333', fontWeight: 600 }}>
                  {components[key]}<span style={{ color: '#ddd' }}>/{max}</span>
                </span>
              </div>
              <div style={{ height: 4, backgroundColor: '#ebebeb', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  width: `${(components[key] / max) * 100}%`,
                  height: '100%',
                  backgroundColor: color,
                  borderRadius: 99,
                  transition: 'width 0.3s ease, background-color 0.2s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: COND, color: '#bbb', fontSize: 13, fontStyle: 'italic', flex: 1 }}>
          Non-Bikeable to {SCHOOL_NAMES[activeSchool]}
        </div>
      )}

      <Divider />

      {/* Raw stats */}
      <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
        {[
          { label: 'Distance',  val: schoolData?.distanceMi != null ? `${schoolData.distanceMi.toFixed(2)} mi` : '—' },
          { label: 'Crossings', val: schoolData?.crossings ?? '—' },
          { label: 'Elev',      val: schoolData?.elevationGainM != null ? `${schoolData.elevationGainM} m` : '—' },
        ].map(({ label, val }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 14, color: '#222' }}>{val}</span>
            <span style={{ fontFamily: COND, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#ccc', textTransform: 'uppercase' }}>{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
