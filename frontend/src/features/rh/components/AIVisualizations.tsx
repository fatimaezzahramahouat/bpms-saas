import { useEffect, useRef } from 'react';
import { TrendingUp, Award, Languages, BookOpen, Briefcase, Users, Star, Target, Lightbulb, AlertCircle } from 'lucide-react';

// ============ Skills Radar Chart ============
interface SkillsRadarChartProps {
  requiredSkills: string[];
  candidateSkills: string[];
}

export function SkillsRadarChart({ requiredSkills, candidateSkills }: SkillsRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Get all unique skills (max 8)
    const allSkills = [...new Set([...requiredSkills, ...candidateSkills])].slice(0, 8);
    const numPoints = allSkills.length;
    const angleStep = (2 * Math.PI) / numPoints;

    // Draw background circles
    ctx.strokeStyle = 'rgba(128, 0, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 4) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw axes and labels
    ctx.fillStyle = '#8000ff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    allSkills.forEach((skill, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Draw axis line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(128, 0, 255, 0.2)';
      ctx.stroke();

      // Draw label
      const labelX = centerX + Math.cos(angle) * (radius + 20);
      const labelY = centerY + Math.sin(angle) * (radius + 20);
      const shortSkill = skill.length > 8 ? skill.substring(0, 7) + '...' : skill;
      ctx.fillText(shortSkill, labelX, labelY);
    });

    // Draw required skills area (purple)
    ctx.beginPath();
    allSkills.forEach((skill, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const hasRequired = requiredSkills.some(rs => rs.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(rs.toLowerCase()));
      const r = hasRequired ? radius : 0;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(128, 0, 255, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#8000ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw candidate skills area (blue)
    ctx.beginPath();
    allSkills.forEach((skill, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const hasCandidate = candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs.toLowerCase()));
      const r = hasCandidate ? radius : 0;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw legend
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#8000ff';
    ctx.fillText('■ Requis', 20, rect.height - 20);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('■ Candidat', 80, rect.height - 20);

  }, [requiredSkills, candidateSkills]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-48"
      style={{ width: '100%', height: '192px' }}
    />
  );
}

// ============ Experience Timeline ============
interface ExperienceTimelineProps {
  requiredYears: string;
  candidateYears: string;
}

export function ExperienceTimeline({ requiredYears, candidateYears }: ExperienceTimelineProps) {
  const getYears = (str: string): number => {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const requiredValue = getYears(requiredYears);
  const candidateValue = getYears(candidateYears);
  const maxYears = Math.max(requiredValue, candidateValue, 10);

  const getColor = (candidate: number, required: number) => {
    const ratio = candidate / required;
    if (ratio >= 1) return 'bg-green-500';
    if (ratio >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Required Experience */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[var(--text-secondary)]">Expérience requise</span>
          <span className="font-medium text-[var(--text-primary)]">{requiredYears}</span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full"
            style={{ width: `${(requiredValue / maxYears) * 100}%` }}
          />
        </div>
      </div>

      {/* Candidate Experience */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[var(--text-secondary)]">Expérience du candidat</span>
          <span className={`font-medium ${getColor(candidateValue, requiredValue).replace('bg-', 'text-')}`}>
            {candidateYears}
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor(candidateValue, requiredValue)} rounded-full transition-all duration-500`}
            style={{ width: `${(candidateValue / maxYears) * 100}%` }}
          />
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative pt-4">
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 dark:bg-gray-700" />
        <div className="relative flex justify-between">
          {/* Required marker */}
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white dark:border-gray-800 z-10" />
            <span className="text-xs text-purple-500 mt-1 font-medium">{requiredYears}</span>
          </div>
          {/* Candidate marker */}
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full ${getColor(candidateValue, requiredValue)} border-2 border-white dark:border-gray-800 z-10`} />
            <span className={`text-xs mt-1 font-medium ${getColor(candidateValue, requiredValue).replace('bg-', 'text-')}`}>
              {candidateYears}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Competency Progress Bars ============
interface CompetencyBarsProps {
  technicalSkills: number;
  softSkills: number;
  education: number;
  languages: number;
}

export function CompetencyBars({ technicalSkills, softSkills, education, languages }: CompetencyBarsProps) {
  const getColor = (value: number) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const competencies = [
    { label: 'Compétences techniques', value: technicalSkills, icon: Briefcase },
    { label: 'Soft skills', value: softSkills, icon: Users },
    { label: 'Formation', value: education, icon: BookOpen },
    { label: 'Langues', value: languages, icon: Languages },
  ];

  return (
    <div className="space-y-3">
      {competencies.map((comp, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-sm mb-1">
            <div className="flex items-center gap-2">
              <comp.icon className="w-4 h-4 text-purple-500" />
              <span className="text-[var(--text-secondary)]">{comp.label}</span>
            </div>
            <span className={`font-medium ${getColor(comp.value).replace('bg-', 'text-')}`}>
              {comp.value}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getColor(comp.value)} rounded-full transition-all duration-700`}
              style={{ width: `${comp.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ AI Written Analysis ============
interface AIAnalysisTextProps {
  analysis: string;
  strengths: string[];
  weaknesses: string[];
}

export function AIAnalysisText({ analysis, strengths, weaknesses }: AIAnalysisTextProps) {
  return (
    <div className="space-y-4">
      {/* Main Analysis */}
      <div className="p-4 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-purple-500" />
          <h4 className="font-medium text-[var(--text-primary)]">Analyse détaillée</h4>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {analysis}
        </p>
      </div>

      {/* Strengths */}
      <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-green-500" />
          <h4 className="font-medium text-green-400">Points forts</h4>
        </div>
        <ul className="space-y-2">
          {strengths.map((strength, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              {strength}
            </li>
          ))}
        </ul>
      </div>

      {/* Weaknesses */}
      <div className="p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <h4 className="font-medium text-yellow-400">Points à améliorer</h4>
        </div>
        <ul className="space-y-2">
          {weaknesses.map((weakness, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
              {weakness}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============ Score Breakdown ============
interface ScoreBreakdownProps {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  linguisticScore: number;
}

export function ScoreBreakdown({ overallScore, skillsScore, experienceScore, educationScore, linguisticScore }: ScoreBreakdownProps) {
  const scores = [
    { label: 'Compétences', score: skillsScore, weight: '40%' },
    { label: 'Expérience', score: experienceScore, weight: '30%' },
    { label: 'Formation', score: educationScore, weight: '15%' },
    { label: 'Langues', score: linguisticScore, weight: '15%' },
  ];

  const getColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Overall Score Circle */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={overallScore >= 70 ? '#22c55e' : overallScore >= 40 ? '#eab308' : '#ef4444'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(overallScore / 100) * 283} 283`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getColor(overallScore)}`}>
              {overallScore}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">/ 100</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2">
        {scores.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)] w-24">{item.label}</span>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBgColor(item.score)} rounded-full`}
                style={{ width: `${item.score}%` }}
              />
            </div>
            <span className={`text-sm font-medium w-12 ${getColor(item.score)}`}>
              {item.score}%
            </span>
            <span className="text-xs text-[var(--text-secondary)] w-8">{item.weight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default {
  SkillsRadarChart,
  ExperienceTimeline,
  CompetencyBars,
  AIAnalysisText,
  ScoreBreakdown,
};
