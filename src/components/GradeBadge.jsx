import { getGrade, getGradeColor } from '../utils/scoring.js';

export default function GradeBadge({ score }) {
  const grade = getGrade(score);
  const color = getGradeColor(score);
  return (
    <span
      style={{
        backgroundColor: color,
        color: 'white',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: '0.04em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 20,
        borderRadius: 2,
        flexShrink: 0,
      }}
    >
      {grade === 'X' ? '—' : grade}
    </span>
  );
}
