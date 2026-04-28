import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NeighborhoodList from '../components/NeighborhoodList.jsx';

const mockNeighborhoods = [
  {
    id: 'alpha', name: 'Alpha', region: 'Dublin City',
    redistricting: false, lat: 40.09, lng: -83.11,
    includes: ['Alpha'],
    schools: {
      coffman: { score: 85, distanceMi: 0.8, trailPct: 80, crossings: 0, elevationGainM: 5, routeCoords: [] },
      scioto:  { score: 55, distanceMi: 2.0, trailPct: 50, crossings: 1, elevationGainM: 10, routeCoords: [] },
      jerome:  { score: null, distanceMi: 5.0, trailPct: 20, crossings: 3, elevationGainM: 30, routeCoords: null },
    },
  },
  {
    id: 'beta', name: 'Beta', region: 'Dublin City',
    redistricting: true, lat: 40.10, lng: -83.12,
    includes: ['Beta'],
    schools: {
      coffman: { score: null, distanceMi: 4.5, trailPct: 30, crossings: 3, elevationGainM: 25, routeCoords: null },
      scioto:  { score: null, distanceMi: 5.5, trailPct: 10, crossings: 4, elevationGainM: 40, routeCoords: null },
      jerome:  { score: 72, distanceMi: 1.2, trailPct: 70, crossings: 1, elevationGainM: 8, routeCoords: [] },
    },
  },
];

describe('NeighborhoodList', () => {
  it('renders all neighborhoods', () => {
    render(<NeighborhoodList neighborhoods={mockNeighborhoods} activeSchool="coffman" selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows non-bikeable neighborhoods below scored ones', () => {
    const { container } = render(
      <NeighborhoodList neighborhoods={mockNeighborhoods} activeSchool="coffman" selectedId={null} onSelect={() => {}} />
    );
    const rows = container.querySelectorAll('[data-testid="neighborhood-row"]');
    expect(rows[0].textContent).toContain('Alpha');
    expect(rows[1].textContent).toContain('Beta');
  });

  it('calls onSelect with neighborhood id when row clicked', () => {
    const onSelect = vi.fn();
    render(<NeighborhoodList neighborhoods={mockNeighborhoods} activeSchool="coffman" selectedId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(onSelect).toHaveBeenCalledWith('alpha');
  });

  it('shows REDIST. badge for redistricting neighborhoods', () => {
    render(<NeighborhoodList neighborhoods={mockNeighborhoods} activeSchool="coffman" selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('REDIST.')).toBeInTheDocument();
  });

  it('shows distance and trail% in each row', () => {
    render(<NeighborhoodList neighborhoods={mockNeighborhoods} activeSchool="coffman" selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText(/0\.8 mi/)).toBeInTheDocument();
    expect(screen.getByText(/80%/)).toBeInTheDocument();
  });
});
