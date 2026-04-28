import { describe, it, expect } from 'vitest';
import { computeScore, getGrade, computeComponentScores } from '../utils/scoring.js';

describe('computeScore', () => {
  it('returns null for distance > 4 miles', () => {
    expect(computeScore(4.1, 80, 0, 0)).toBeNull();
    expect(computeScore(10, 100, 0, 0)).toBeNull();
  });

  it('gives distance score of 100 when <= 1 mile', () => {
    expect(computeScore(0.5, 100, 0, 0)).toBe(100);
  });

  it('tapers distance score linearly from 1mi to 4mi', () => {
    // 0 trail, 2.5mi = (4-2.5)/3*100 = 50, 0 crossings, 0 elevation
    // score = 0*0.4 + 50*0.25 + 100*0.25 + 100*0.10 = 0 + 12.5 + 25 + 10 = 47.5 → 48
    expect(computeScore(2.5, 0, 0, 0)).toBe(48);
  });

  it('penalizes each arterial crossing by 25 points', () => {
    // 100% trail, 0.5mi, 2 crossings (→50), 0 elevation
    // score = 100*0.4 + 100*0.25 + 50*0.25 + 100*0.10 = 40+25+12.5+10 = 87.5 → 88
    expect(computeScore(0.5, 100, 2, 0)).toBe(88);
  });

  it('clamps crossing score to 0 for 4+ crossings', () => {
    expect(computeScore(0.5, 0, 4, 0)).toBe(35);
  });

  it('penalizes elevation gain', () => {
    // 100% trail, 0.5mi, 0 crossings, 30m elevation → terrain = 40
    // score = 100*0.4 + 100*0.25 + 100*0.25 + 40*0.10 = 40+25+25+4 = 94
    expect(computeScore(0.5, 100, 0, 30)).toBe(94);
  });

  it('clamps terrain score to 0 for elevation >= 50m', () => {
    // score = 0*0.4 + 100*0.25 + 100*0.25 + 0*0.10 = 0+25+25+0 = 50
    expect(computeScore(0.5, 0, 0, 50)).toBe(50);
  });
});

describe('getGrade', () => {
  it('returns X for null score', () => expect(getGrade(null)).toBe('X'));
  it('returns A for 80+', () => expect(getGrade(80)).toBe('A'));
  it('returns A for 100', () => expect(getGrade(100)).toBe('A'));
  it('returns B for 65–79', () => expect(getGrade(72)).toBe('B'));
  it('returns C for 50–64', () => expect(getGrade(55)).toBe('C'));
  it('returns D for 35–49', () => expect(getGrade(40)).toBe('D'));
  it('returns F for < 35', () => expect(getGrade(20)).toBe('F'));
});

describe('computeComponentScores', () => {
  it('returns null for non-bikeable', () => {
    expect(computeComponentScores({ score: null, distanceMi: 5, trailPct: 50, crossings: 2, elevationGainM: 10 })).toBeNull();
  });

  it('returns four weighted component scores', () => {
    const result = computeComponentScores({ score: 95, distanceMi: 0.5, trailPct: 100, crossings: 0, elevationGainM: 0 });
    expect(result).toEqual({ trail: 40, distance: 25, crossings: 25, terrain: 10 });
  });
});
