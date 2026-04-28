import GradeBadge from './GradeBadge.jsx';

const COLUMNS = [
  { key: 'rank',        label: '#',         align: 'center' },
  { key: 'name',        label: 'Neighborhood', align: 'left' },
  { key: 'grade',       label: 'Grade',     align: 'center' },
  { key: 'score',       label: 'Score',     align: 'center' },
  { key: 'distanceMi',  label: 'Distance',  align: 'center' },
  { key: 'trailPct',    label: 'Trail %',   align: 'center' },
  { key: 'crossings',   label: 'Crossings', align: 'center' },
  { key: 'elevationGainM', label: 'Elev Gain', align: 'center' },
];

export default function NeighborhoodTable({ neighborhoods, activeSchool, selectedId, onSelect }) {
  const scored = neighborhoods
    .filter((n) => n.schools[activeSchool].score !== null)
    .sort((a, b) => b.schools[activeSchool].score - a.schools[activeSchool].score);
  const nonBikeable = neighborhoods.filter((n) => n.schools[activeSchool].score === null);
  const sorted = [...scored, ...nonBikeable];

  return (
    <div className="overflow-auto h-full">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-white z-10 shadow-sm">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200 text-${col.align}`}
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
            const rank = isNonBikeable ? '✕' : idx + 1;

            return (
              <tr
                key={n.id}
                onClick={() => onSelect(n.id)}
                className={[
                  'cursor-pointer border-b border-gray-100 transition-colors',
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50',
                  isNonBikeable ? 'opacity-40' : '',
                ].join(' ')}
              >
                <td className="px-4 py-2.5 text-center text-gray-400 font-mono text-xs">{rank}</td>

                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-800">{n.name}</span>
                    {n.redistricting && (
                      <span className="text-[10px] font-bold text-orange-600 border border-orange-400 rounded px-1 leading-tight">
                        REDIST.
                      </span>
                    )}
                  </div>
                  {n.region && <div className="text-xs text-gray-400">{n.region}</div>}
                </td>

                <td className="px-4 py-2.5 text-center">
                  <div className="flex justify-center">
                    <GradeBadge score={s.score} />
                  </div>
                </td>

                <td className="px-4 py-2.5 text-center font-bold text-gray-700">
                  {s.score ?? '—'}
                </td>

                <td className="px-4 py-2.5 text-center font-mono text-gray-600">
                  {s.distanceMi != null ? `${s.distanceMi.toFixed(1)} mi` : '—'}
                </td>

                <td className="px-4 py-2.5 text-center">
                  {s.trailPct != null ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-gray-600">{s.trailPct}%</span>
                      <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${s.trailPct}%`, backgroundColor: '#16a34a' }}
                        />
                      </div>
                    </div>
                  ) : '—'}
                </td>

                <td className="px-4 py-2.5 text-center font-mono text-gray-600">
                  {s.crossings ?? '—'}
                </td>

                <td className="px-4 py-2.5 text-center font-mono text-gray-600">
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
