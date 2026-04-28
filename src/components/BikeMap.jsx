import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getGradeColor } from '../utils/scoring.js';
import { SCHOOL_COLORS, SCHOOL_NAMES, ROUTE_COLORS } from '../utils/colors.js';

const SCHOOLS = [
  { key: 'scioto',  lat: 40.0978, lng: -83.0742 },
  { key: 'coffman', lat: 40.0934, lng: -83.1089 },
  { key: 'jerome',  lat: 40.1312, lng: -83.1102 },
];

function FlyToHandler({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1 });
  }, [center, map]);
  return null;
}

function SchoolLayer() {
  const map = useMap();
  useEffect(() => {
    const markers = SCHOOLS.map((school) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${SCHOOL_COLORS[school.key]};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)">🏫</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      return L.marker([school.lat, school.lng], { icon })
        .bindTooltip(SCHOOL_NAMES[school.key], { permanent: false })
        .addTo(map);
    });
    return () => markers.forEach((m) => m.remove());
  }, [map]);
  return null;
}

function buildRouteSegments(routeCoords) {
  const segments = [];
  let i = 0;
  while (i < routeCoords.length - 1) {
    const type = routeCoords[i][2];
    const pts = [[routeCoords[i][0], routeCoords[i][1]]];
    while (i + 1 < routeCoords.length && routeCoords[i + 1][2] === type) {
      i++;
      pts.push([routeCoords[i][0], routeCoords[i][1]]);
    }
    if (i + 1 < routeCoords.length) {
      pts.push([routeCoords[i + 1][0], routeCoords[i + 1][1]]);
    }
    segments.push({ positions: pts, color: ROUTE_COLORS[type] ?? ROUTE_COLORS.residential });
    i++;
  }
  return segments;
}

function RouteLayer({ routeCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!routeCoords || routeCoords.length < 2) return;
    const layers = buildRouteSegments(routeCoords).map(({ positions, color }) =>
      L.polyline(positions, { color, weight: 4, opacity: 0.85 }).addTo(map)
    );
    return () => layers.forEach((l) => l.remove());
  }, [map, routeCoords]);
  return null;
}

export default function BikeMap({ neighborhoods, activeSchool, selectedId, onSelect }) {
  const selected = neighborhoods.find((n) => n.id === selectedId) ?? null;
  const flyCenter = selected ? [selected.lat, selected.lng] : null;
  const routeCoords = selected?.schools[activeSchool]?.routeCoords ?? null;

  return (
    <MapContainer
      center={[40.113, -83.113]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <SchoolLayer />
      <FlyToHandler center={flyCenter} />
      <RouteLayer key={`${selectedId}-${activeSchool}`} routeCoords={routeCoords} />

      {neighborhoods.map((n) => {
        const s = n.schools[activeSchool];
        const color = getGradeColor(s.score);
        const isSelected = n.id === selectedId;
        const radius = s.score !== null ? 6 + Math.round(s.score / 20) : 5;

        return (
          <CircleMarker
            key={n.id}
            center={[n.lat, n.lng]}
            radius={isSelected ? radius + 4 : radius}
            pathOptions={{
              fillColor: color,
              color: isSelected ? '#1e40af' : 'white',
              weight: isSelected ? 2.5 : 1.5,
              fillOpacity: 0.85,
            }}
            eventHandlers={{ click: () => onSelect(n.id) }}
          >
            <Tooltip>
              <div>
                <strong>{n.name}</strong><br />
                {s.score !== null
                  ? `Score ${s.score} · ${s.distanceMi.toFixed(1)} mi · ${s.trailPct}% trail · ${s.crossings} crossings`
                  : `Non-Bikeable · ${s.distanceMi.toFixed(1)} mi`}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
