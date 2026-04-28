import { getGrade, getGradeColor } from '../utils/scoring.js';

export default function GradeBadge({ score }) {
  const grade = getGrade(score);
  const color = getGradeColor(score);
  return (
    <span
      style={{ backgroundColor: color }}
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold flex-shrink-0"
    >
      {grade === 'X' ? '✕' : grade}
    </span>
  );
}
