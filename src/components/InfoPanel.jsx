import { SCHOOL_COLORS, SCHOOL_NAMES } from '../utils/colors.js';

const COND = "'Barlow Condensed', sans-serif";
const MONO = "'JetBrains Mono', monospace";

const COMPONENTS = [
  { label: 'Trail Coverage', weight: '40%', desc: '% of route on shared-use path or cycleway' },
  { label: 'Distance',       weight: '35%', desc: 'Linear taper: ≤1 mi = max, 4 mi = 0' },
  { label: 'Arterial Crossings', weight: '10%', desc: 'Each crossing of Sawmill, SR-161, Avery, Hyland-Croy, Hard Rd subtracts 25 pts' },
  { label: 'Terrain',        weight: '15%', desc: 'Elevation gain in metres (50 m = 0 pts)' },
];

const GRADES = [
  { grade: 'A', min: 80,  color: '#16a34a' },
  { grade: 'B', min: 65,  color: '#65a30d' },
  { grade: 'C', min: 50,  color: '#ca8a04' },
  { grade: 'D', min: 35,  color: '#ea580c' },
  { grade: 'F', min: 0,   color: '#dc2626' },
  { grade: '—', min: null, color: '#9ca3af' },
];

const SCHOOLS = ['scioto', 'coffman', 'jerome'];

export default function InfoPanel({ activeSchool }) {
  const color = SCHOOL_COLORS[activeSchool];

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      borderRight: '1px solid #e8e8e8',
      backgroundColor: '#fafafa',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>

      {/* Schools legend */}
      <section style={{ padding: '16px 16px 12px' }}>
        <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginBottom: 10 }}>
          High Schools
        </div>
        {SCHOOLS.map((key) => (
          <div key={key} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 0',
            borderBottom: '1px solid #efefef',
          }}>
            <div style={{
              width: 3,
              height: 22,
              backgroundColor: SCHOOL_COLORS[key],
              borderRadius: 2,
              flexShrink: 0,
              opacity: key === activeSchool ? 1 : 0.3,
              transition: 'opacity 0.2s ease',
            }} />
            <span style={{
              fontFamily: COND,
              fontWeight: key === activeSchool ? 700 : 500,
              fontSize: 13,
              color: key === activeSchool ? SCHOOL_COLORS[key] : '#888',
              transition: 'color 0.2s ease',
            }}>
              {SCHOOL_NAMES[key]}
            </span>
          </div>
        ))}
      </section>

      <div style={{ height: 1, backgroundColor: '#e8e8e8', margin: '0 16px' }} />

      {/* Scoring methodology */}
      <section style={{ padding: '14px 16px 12px' }}>
        <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginBottom: 10 }}>
          Score Methodology
        </div>
        <p style={{ fontFamily: COND, fontSize: 12, color: '#888', lineHeight: 1.5, margin: '0 0 12px' }}>
          Routes &gt; 4 miles are scored <strong style={{ color: '#999' }}>Non-Bikeable</strong>. Scores are computed via OSMnx shortest-path routing on the Dublin OH road and trail network.
        </p>
        {COMPONENTS.map(({ label, weight, desc }) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 12, color: '#333' }}>{label}</span>
              <span style={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 600,
                color: 'white',
                backgroundColor: color,
                padding: '1px 5px',
                borderRadius: 2,
                transition: 'background-color 0.2s ease',
              }}>{weight}</span>
            </div>
            <p style={{ fontFamily: COND, fontSize: 11, color: '#aaa', margin: 0, lineHeight: 1.4 }}>{desc}</p>
          </div>
        ))}
      </section>

      <div style={{ height: 1, backgroundColor: '#e8e8e8', margin: '0 16px' }} />

      {/* Grade scale */}
      <section style={{ padding: '14px 16px 12px' }}>
        <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginBottom: 10 }}>
          Grade Scale
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {GRADES.map(({ grade, min, color: gc }) => (
            <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: COND,
                fontWeight: 700,
                fontSize: 11,
                color: 'white',
                backgroundColor: gc,
                width: 22,
                height: 16,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                flexShrink: 0,
              }}>{grade}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: '#aaa' }}>
                {min === null ? 'Non-Bikeable (> 4 mi)' : min === 0 ? '< 35' : `≥ ${min}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: 1, backgroundColor: '#e8e8e8', margin: '0 16px' }} />

      {/* Data note */}
      <section style={{ padding: '14px 16px', marginTop: 'auto' }}>
        <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>
          Errors or Missing Neighbourhoods?
        </div>
        <p style={{ fontFamily: COND, fontSize: 11, color: '#aaa', lineHeight: 1.5, margin: '0 0 6px' }}>
          Scores are computed automatically from OSM data and may contain errors. If you spot a mistake or know of a missing neighbourhood, please get in touch.
        </p>
        <a
          href="mailto:ishraq.alim@gmail.com"
          style={{
            fontFamily: COND,
            fontWeight: 600,
            fontSize: 11,
            color: color,
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            wordBreak: 'break-all',
          }}
        >
          ishraq.alim@gmail.com
        </a>
      </section>

    </aside>
  );
}
