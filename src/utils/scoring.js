import { GRADE_COLORS } from './colors.js';

export function computeScore(distanceMi, trailPct, crossings, elevationGainM) {
  if (distanceMi > 4) return null;
  const distanceScore = distanceMi <= 1
    ? 100
    : ((4 - distanceMi) / 3) * 100;
  const crossingScore = Math.max(0, 100 - crossings * 25);
  const terrainScore  = Math.max(0, 100 - elevationGainM * 2);
  return Math.round(
    trailPct      * 0.40 +
    distanceScore * 0.25 +
    crossingScore * 0.25 +
    terrainScore  * 0.10
  );
}

export function getGrade(score) {
  if (score === null) return 'X';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

export function getGradeColor(score) {
  return GRADE_COLORS[getGrade(score)];
}

export function computeComponentScores(schoolData) {
  if (!schoolData || schoolData.score === null) return null;
  const { distanceMi, trailPct, crossings, elevationGainM } = schoolData;
  const distanceScore = distanceMi <= 1
    ? 100
    : ((4 - distanceMi) / 3) * 100;
  const crossingScore = Math.max(0, 100 - crossings * 25);
  const terrainScore  = Math.max(0, 100 - elevationGainM * 2);
  return {
    trail:     Math.round(trailPct      * 0.40),
    distance:  Math.round(distanceScore * 0.25),
    crossings: Math.round(crossingScore * 0.25),
    terrain:   Math.round(terrainScore  * 0.10),
  };
}
