import { useState } from 'react';
import scores from './data/scores.json';
import SchoolTabs from './components/SchoolTabs.jsx';
import NeighborhoodList from './components/NeighborhoodList.jsx';
import BikeMap from './components/BikeMap.jsx';
import ScoreBreakdown from './components/ScoreBreakdown.jsx';

export default function App() {
  const [activeSchool, setActiveSchool] = useState('coffman');
  const [selectedId, setSelectedId] = useState(null);

  const selected = scores.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header
        className="flex items-center justify-between px-4 bg-white border-b border-gray-200 flex-shrink-0"
        style={{ height: 60 }}
      >
        <h1 className="text-lg font-bold text-gray-800 tracking-tight">Dublin Bikeability</h1>
        <SchoolTabs active={activeSchool} onChange={setActiveSchool} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white"
          style={{ width: 380 }}
        >
          <NeighborhoodList
            neighborhoods={scores}
            activeSchool={activeSchool}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>
        <main className="flex-1">
          <BikeMap
            neighborhoods={scores}
            activeSchool={activeSchool}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </main>
      </div>

      {selected && (
        <footer className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3">
          <ScoreBreakdown neighborhood={selected} activeSchool={activeSchool} />
        </footer>
      )}
    </div>
  );
}
