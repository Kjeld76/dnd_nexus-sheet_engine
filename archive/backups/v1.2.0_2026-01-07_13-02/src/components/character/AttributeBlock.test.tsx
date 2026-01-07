import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AttributeBlock } from './AttributeBlock';

describe('AttributeBlock', () => {
  it('calculates modifier correctly', () => {
    render(<AttributeBlock name="Stärke" value={16} onChange={() => {}} />);
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('handles negative modifiers', () => {
    render(<AttributeBlock name="Stärke" value={8} onChange={() => {}} />);
    expect(screen.getByText('-1')).toBeInTheDocument();
  });
});

