import { computeComponentScores } from '../utils/scoring.js';
import { SCHOOL_COLORS, SCHOOL_NAMES } from '../utils/colors.js';

const COMPONENTS = [
  { key: 'trail',     label: 'Trail',     max: 40, color: '#16a34a' },
  { key: 'distance',  label: 'Distance',  max: 25, color: '#2563eb' },
  { key: 'crossings', label: 'Crossings', max: 25, color: '#ea580c' },
  { key: 'terrain',   label: 'Terrain',   max: 10, color: '#7c3aed' },
];

export default function ScoreBreakdown({ neighborhood, activeSchool }) {
  const schoolData = neighborhood?.schools[activeSchool];
  const components = computeComponentScores(schoolData);

  return (
    <div className="flex items-start gap-8">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-700">{neighborhood.name}</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: SCHOOL_COLORS[activeSchool] }}
          >
            {SCHOOL_NAMES[activeSchool]}
          </span>
          {neighborhood.redistricting && (
            <span className="text-[10px] font-bold text-orange-600 border border-orange-400 rounded px-1">
              REDIST.
            </span>
          )}
        </div>
        {components ? (
          <div className="flex gap-4">
            {COMPONENTS.map(({ key, label, max, color }) => (
              <div key={key} className="flex flex-col gap-1 min-w-[80px]">
                <span className="text-xs text-gray-500">{label}</span>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(components[key] / max) * 100}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-700">{components[key]}/{max}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Non-Bikeable to {SCHOOL_NAMES[activeSchool]}</p>
        )}
      </div>

      <div className="text-sm text-gray-500">
        <div className="font-medium text-gray-600 mb-1">Includes</div>
        {neighborhood.includes.map((sub) => (
          <div key={sub} className="text-xs">{sub}</div>
        ))}
      </div>
    </div>
  );
}
