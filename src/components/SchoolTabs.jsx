import { SCHOOL_COLORS, SCHOOL_NAMES } from '../utils/colors.js';

const SCHOOLS = ['scioto', 'coffman', 'jerome'];

export default function SchoolTabs({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {SCHOOLS.map((school) => {
        const isActive = school === active;
        const color = SCHOOL_COLORS[school];
        const label = SCHOOL_NAMES[school].replace('Dublin ', '');
        return (
          <button
            key={school}
            onClick={() => onChange(school)}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '5px 16px',
              borderRadius: 2,
              border: `1.5px solid ${isActive ? color : '#333'}`,
              backgroundColor: isActive ? color : 'transparent',
              color: isActive ? '#fff' : '#666',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              lineHeight: 1.4,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
