import GradeBadge from './GradeBadge.jsx';

export default function NeighborhoodList({ neighborhoods, activeSchool, selectedId, onSelect }) {
  const scored = neighborhoods
    .filter((n) => n.schools[activeSchool].score !== null)
    .sort((a, b) => b.schools[activeSchool].score - a.schools[activeSchool].score);
  const nonBikeable = neighborhoods.filter((n) => n.schools[activeSchool].score === null);
  const sorted = [...scored, ...nonBikeable];

  return (
    <div>
      {sorted.map((n) => {
        const s = n.schools[activeSchool];
        const isNonBikeable = s.score === null;
        const isSelected = n.id === selectedId;

        return (
          <div
            key={n.id}
            data-testid="neighborhood-row"
            onClick={() => onSelect(n.id)}
            className={[
              'flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-gray-100 hover:bg-gray-50',
              isSelected ? 'bg-blue-50' : '',
              isNonBikeable ? 'opacity-50' : '',
            ].join(' ')}
          >
            <GradeBadge score={s.score} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-800 truncate">{n.name}</span>
                {n.redistricting && (
                  <span className="text-[10px] font-bold text-orange-600 border border-orange-400 rounded px-1">
                    REDIST.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono text-gray-500">
                  {s.distanceMi.toFixed(1)} mi · {s.trailPct}% trail
                </span>
              </div>
              {!isNonBikeable && (
                <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.trailPct}%`, backgroundColor: '#16a34a' }}
                  />
                </div>
              )}
            </div>

            {s.score !== null && (
              <span className="text-sm font-bold text-gray-700 flex-shrink-0">{s.score}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
