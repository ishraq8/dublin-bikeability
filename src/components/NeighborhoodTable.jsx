import { useState } from 'react';
import GradeBadge from './GradeBadge.jsx';

const MONO = "'JetBrains Mono', monospace";
const COND = "'Barlow Condensed', sans-serif";

const COLS = [
  { label: '#',         width: 48,  align: 'center' },
  { label: 'Neighborhood', width: 'auto', align: 'left' },
  { label: 'Gr',        width: 52,  align: 'center' },
  { label: 'Score',     width: 72,  align: 'center' },
  { label: 'Distance',  width: 90,  align: 'center' },
  { label: 'Trail %',   width: 110, align: 'center' },
  { label: 'Crossings', width: 88,  align: 'center' },
  { label: 'Elev Gain', width: 88,  align: 'center' },
];

export default function NeighborhoodTable({ neighborhoods, activeSchool, selectedId, onSelect }) {
  const [hovered, setHovered] = useState(null);

  const scored = neighborhoods
    .filter((n) => n.schools[activeSchool].score !== null)
    .sort((a, b) => b.schools[activeSchool].score - a.schools[activeSchool].score);
  const nonBikeable = neighborhoods.filter((n) => n.schools[activeSchool].score === null);
  const sorted = [...scored, ...nonBikeable];

  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fff' }}>
            {COLS.map((col) => (
              <th
                key={col.label}
                style={{
                  width: col.width !== 'auto' ? col.width : undefined,
                  padding: '10px 12px',
                  textAlign: col.align,
                  fontFamily: COND,
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#aaa',
                  borderBottom: '2px solid var(--school-color)',
                  whiteSpace: 'nowrap',
                  transition: 'border-bottom-color 0.2s ease',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((n, idx) => {
            const s = n.schools[activeSchool];
            const isNonBikeable = s.score === null;
            const isSelected = n.id === selectedId;
            const isHovered = n.id === hovered && !isSelected;
            const rank = isNonBikeable ? '—' : idx + 1;

            let bgColor = '#fff';
            if (isSelected) bgColor = 'var(--school-tint-12)';
            else if (isHovered) bgColor = 'var(--school-tint-6)';
            else if (isNonBikeable) bgColor = '#fafafa';

            return (
              <tr
                key={n.id}
                data-testid="neighborhood-row"
                onClick={() => onSelect(n.id === selectedId ? null : n.id)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: bgColor,
                  borderBottom: '1px solid #f2f2f2',
                  borderLeft: isSelected
                    ? '3px solid var(--school-color)'
                    : '3px solid transparent',
                  opacity: isNonBikeable ? 0.45 : 1,
                  transition: 'background-color 0.1s ease, border-left-color 0.15s ease',
                }}
              >
                <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: MONO, fontSize: 11, color: '#ccc', fontWeight: 400 }}>
                  {rank}
                </td>

                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontFamily: COND, fontWeight: 600, fontSize: 15, color: '#111' }}>
                      {n.name}
                    </span>
                    {n.redistricting && (
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
                </td>

                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GradeBadge score={s.score} />
                  </div>
                </td>

                <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 17, color: '#111' }}>
                  {s.score ?? '—'}
                </td>

                <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: MONO, fontSize: 12, color: '#666' }}>
                  {s.distanceMi != null ? `${s.distanceMi.toFixed(1)} mi` : '—'}
                </td>

                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  {s.trailPct != null ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: '#666' }}>{s.trailPct}%</span>
                      <div style={{ width: 64, height: 3, backgroundColor: '#ebebeb', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          width: `${s.trailPct}%`,
                          height: '100%',
                          backgroundColor: 'var(--school-color)',
                          borderRadius: 99,
                          transition: 'background-color 0.2s ease',
                        }} />
                      </div>
                    </div>
                  ) : '—'}
                </td>

                <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: MONO, fontSize: 12, color: '#666' }}>
                  {s.crossings ?? '—'}
                </td>

                <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: MONO, fontSize: 12, color: '#666' }}>
                  {s.elevationGainM != null ? `${s.elevationGainM} m` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
