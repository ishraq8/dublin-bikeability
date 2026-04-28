import { SCHOOL_COLORS, SCHOOL_NAMES } from '../utils/colors.js';

const SCHOOLS = ['scioto', 'coffman', 'jerome'];

export default function SchoolTabs({ active, onChange }) {
  return (
    <div className="flex gap-1">
      {SCHOOLS.map((school) => {
        const isActive = school === active;
        return (
          <button
            key={school}
            onClick={() => onChange(school)}
            style={{
              backgroundColor: isActive ? SCHOOL_COLORS[school] : 'transparent',
              borderColor: SCHOOL_COLORS[school],
              color: isActive ? 'white' : SCHOOL_COLORS[school],
            }}
            className="px-4 py-1.5 rounded border-2 text-sm font-semibold transition-colors"
          >
            {SCHOOL_NAMES[school]}
          </button>
        );
      })}
    </div>
  );
}
