import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GradeBadge from '../components/GradeBadge.jsx';

describe('GradeBadge', () => {
  it('shows A for score 85', () => {
    render(<GradeBadge score={85} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows — for null score', () => {
    render(<GradeBadge score={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows F for score 20', () => {
    render(<GradeBadge score={20} />);
    expect(screen.getByText('F')).toBeInTheDocument();
  });

  it('applies green background for A grade', () => {
    const { container } = render(<GradeBadge score={90} />);
    expect(container.firstChild.style.backgroundColor).toBe('rgb(22, 163, 74)');
  });

  it('applies grey background for non-bikeable', () => {
    const { container } = render(<GradeBadge score={null} />);
    expect(container.firstChild.style.backgroundColor).toBe('rgb(156, 163, 175)');
  });
});
