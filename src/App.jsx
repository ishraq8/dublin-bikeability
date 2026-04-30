import { useState, useMemo } from 'react';
import scores from './data/scores.json';
import SchoolTabs from './components/SchoolTabs.jsx';
import NeighborhoodTable from './components/NeighborhoodTable.jsx';
import ScoreBreakdown from './components/ScoreBreakdown.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import { SCHOOL_COLORS } from './utils/colors.js';

const TINT_BASE = {
  scioto:  '139,26,26',
  coffman: '26,92,42',
  jerome:  '13,59,122',
};

export default function App() {
  const [activeSchool, setActiveSchool] = useState('coffman');
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(() => scores.find((n) => n.id === selectedId) ?? null, [selectedId]);
  const color = SCHOOL_COLORS[activeSchool];
  const tint = TINT_BASE[activeSchool];

  function handleSchoolChange(school) {
    setActiveSchool(school);
    setSelectedId(null);
  }

  return (
    <div
      className="flex flex-col h-screen"
      style={{
        '--school-color': color,
        '--school-tint-6': `rgba(${tint},0.06)`,
        '--school-tint-12': `rgba(${tint},0.12)`,
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: '#111',
          borderTop: `3px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          flexShrink: 0,
          height: 64,
          transition: 'border-top-color 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 30,
            color: 'white',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            Dublin Bikeability
          </span>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 500,
            fontSize: 12,
            color: '#4a4a4a',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            Neighborhood Scorer
          </span>
        </div>
        <SchoolTabs active={activeSchool} onChange={handleSchoolChange} />
      </header>

      {/* Body: sidebar + table */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <InfoPanel activeSchool={activeSchool} />

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <NeighborhoodTable
            neighborhoods={scores}
            activeSchool={activeSchool}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {selected && (
            <div style={{ flexShrink: 0, borderTop: '1px solid #e8e8e8', backgroundColor: '#fff' }}>
              <ScoreBreakdown neighborhood={selected} activeSchool={activeSchool} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
