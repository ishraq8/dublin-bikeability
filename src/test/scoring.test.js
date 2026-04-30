import { describe, it, expect } from 'vitest';
import { computeScore, getGrade, computeComponentScores } from '../utils/scoring.js';

describe('computeScore', () => {
  it('returns null for distance > 4 miles', () => {
    expect(computeScore(4.1, 80, 0, 0)).toBeNull();
    expect(computeScore(10, 100, 0, 0)).toBeNull();
  });

  it('gives max score for ideal route', () => {
    // 100*0.40 + 100*0.35 + 100*0.10 + 100*0.15 = 100
    expect(computeScore(0.5, 100, 0, 0)).toBe(100);
  });

  it('tapers distance score linearly from 1mi to 4mi', () => {
    // 0 trail, 2.5mi -> dist_score=50, 0 crossings, 0 elevation
    // 0*0.40 + 50*0.35 + 100*0.10 + 100*0.15 = 0+17.5+10+15 = 42.5 -> 43
    expect(computeScore(2.5, 0, 0, 0)).toBe(43);
  });

  it('penalizes each arterial crossing by 25 points', () => {
    // 100% trail, 0.5mi, 2 crossings (crossing_score=50), 0 elevation
    // 100*0.40 + 100*0.35 + 50*0.10 + 100*0.15 = 40+35+5+15 = 95
    expect(computeScore(0.5, 100, 2, 0)).toBe(95);
  });

  it('clamps crossing score to 0 for 4+ crossings', () => {
    // 0 trail, 0.5mi, 4 crossings, 0 elevation
    // 0*0.40 + 100*0.35 + 0*0.10 + 100*0.15 = 0+35+0+15 = 50
    expect(computeScore(0.5, 0, 4, 0)).toBe(50);
  });

  it('penalizes elevation gain', () => {
    // 100% trail, 0.5mi, 0 crossings, 30m elevation -> terrain=40
    // 100*0.40 + 100*0.35 + 100*0.10 + 40*0.15 = 40+35+10+6 = 91
    expect(computeScore(0.5, 100, 0, 30)).toBe(91);
  });

  it('clamps terrain score to 0 for elevation >= 50m', () => {
    // 0 trail, 0.5mi, 0 crossings, 50m -> terrain=0
    // 0*0.40 + 100*0.35 + 100*0.10 + 0*0.15 = 0+35+10+0 = 45
    expect(computeScore(0.5, 0, 0, 50)).toBe(45);
  });
});

describe('getGrade', () => {
  it('returns X for null score', () => expect(getGrade(null)).toBe('X'));
  it('returns A for 80+', () => expect(getGrade(80)).toBe('A'));
  it('returns A for 100', () => expect(getGrade(100)).toBe('A'));
  it('returns B for 65-79', () => expect(getGrade(72)).toBe('B'));
  it('returns C for 50-64', () => expect(getGrade(55)).toBe('C'));
  it('returns D for 35-49', () => expect(getGrade(40)).toBe('D'));
  it('returns F for < 35', () => expect(getGrade(20)).toBe('F'));
});

describe('computeComponentScores', () => {
  it('returns null for non-bikeable', () => {
    expect(computeComponentScores({ score: null, distanceMi: 5, trailPct: 50, crossings: 2, elevationGainM: 10 })).toBeNull();
  });

  it('returns four weighted component scores', () => {
    // 0.5mi (dist=100), 100% trail, 0 crossings, 0 elevation
    // trail=40, distance=35, crossings=10, terrain=15
    const result = computeComponentScores({ score: 100, distanceMi: 0.5, trailPct: 100, crossings: 0, elevationGainM: 0 });
    expect(result).toEqual({ trail: 40, distance: 35, crossings: 10, terrain: 15 });
  });
});
