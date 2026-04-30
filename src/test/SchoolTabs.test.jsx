import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SchoolTabs from '../components/SchoolTabs.jsx';

describe('SchoolTabs', () => {
  it('renders three tab buttons', () => {
    render(<SchoolTabs active="scioto" onChange={() => {}} />);
    expect(screen.getByText('Scioto')).toBeInTheDocument();
    expect(screen.getByText('Coffman')).toBeInTheDocument();
    expect(screen.getByText('Jerome')).toBeInTheDocument();
  });

  it('calls onChange with school key when tab clicked', () => {
    const onChange = vi.fn();
    render(<SchoolTabs active="scioto" onChange={onChange} />);
    fireEvent.click(screen.getByText('Coffman'));
    expect(onChange).toHaveBeenCalledWith('coffman');
  });

  it('applies school color background to active tab', () => {
    const { rerender } = render(<SchoolTabs active="scioto" onChange={() => {}} />);
    const sciotoBtn = screen.getByText('Scioto').closest('button');
    expect(sciotoBtn.style.backgroundColor).toBe('rgb(139, 26, 26)');

    rerender(<SchoolTabs active="coffman" onChange={() => {}} />);
    const coffmanBtn = screen.getByText('Coffman').closest('button');
    expect(coffmanBtn.style.backgroundColor).toBe('rgb(26, 92, 42)');
  });
});
