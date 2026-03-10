import { useMemo } from 'react';
import { Users, TrendingUp, Star, Clock, Target, PieChart, Calendar, ArrowDownUp } from 'lucide-react';
import { Candidate } from './CandidateCard';

// Statistics cards component
interface StatisticsCardsProps {
  candidates: Candidate[];
  savedCount: number;
}

export function StatisticsCards({ candidates, savedCount }: StatisticsCardsProps) {
  const stats = useMemo(() => {
    const total = candidates.length;
    const avgScore = total > 0 
      ? Math.round(candidates.reduce((acc, c) => acc + (c.matchPercentage || 0), 0) / total)
      : 0;
    
    const today = new Date().toISOString().split('T')[0];
    const newToday = candidates.filter(c => c.appliedDate === today).length;
    
    return { total, avgScore, newToday, savedCount };
  }, [candidates, savedCount]);

  const cards = [
    {
      label: 'Total Candidats',
      value: stats.total,
      icon: Users,
      color: 'purple',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: "Nouveaux Aujourd'hui",
      value: stats.newToday,
      icon: Clock,
      color: 'green',
      trend: '+3',
      trendUp: true,
    },
    {
      label: 'Candidats Sauvegardés',
      value: stats.savedCount,
      icon: Star,
      color: 'yellow',
      trend: '+2',
      trendUp: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const colorClasses = {
          purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          green: 'bg-green-500/10 text-green-400 border-green-500/20',
          yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        };
        
        return (
          <div
            key={card.label}
            className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 hover:border-purple-500/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-lg border ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                card.trendUp 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-red-500/10 text-red-400'
              }`}>
                <TrendingUp className={`w-3 h-3 ${!card.trendUp ? 'rotate-180' : ''}`} />
                {card.trend}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{card.value}</p>
              <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Status distribution pie/donut chart
interface StatusDistributionProps {
  candidates: Candidate[];
}

export function StatusDistribution({ candidates }: StatusDistributionProps) {
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Nouveau': 0,
      'En cours': 0,
      'Archivé': 0,
      'Rejeté': 0,
    };
    candidates.forEach(c => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });
    return counts;
  }, [candidates]);

  const total = candidates.length;
  const colors: Record<string, string> = {
    'Nouveau': '#8b5cf6',   // purple
    'En cours': '#3b82f6',  // blue
    'Archivé': '#6b7280',   // gray
    'Rejeté': '#ef4444',    // red
  };

  // Calculate segments for donut chart
  let cumulativePercent = 0;
  const segments = Object.entries(statusCounts).map(([status, count]) => {
    const percent = total > 0 ? (count / total) * 100 : 0;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return { status, count, percent, startPercent };
  }).filter(s => s.count > 0);

  // SVG circle calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = segments.map(s => `${(s.percent / 100) * circumference} ${circumference}`);
  const strokeDashoffset = segments.map((s, i) => {
    const offset = segments.slice(0, i).reduce((acc, seg) => acc - (seg.percent / 100) * circumference, 0);
    return offset;
  });

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-[var(--text-primary)]">Répartition par Statut</h3>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            {segments.map((segment, i) => {
              const offset = strokeDashoffset[i];
              return (
                <circle
                  key={segment.status}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={colors[segment.status]}
                  strokeWidth="24"
                  strokeDasharray={`${(segment.percent / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-offset}
                  className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{total}</p>
              <p className="text-xs text-[var(--text-secondary)]">Total</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {Object.entries(statusCounts).map(([status, count]) => {
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[status] }}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">{status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{count}</span>
                  <span className="text-xs text-[var(--text-secondary)]">({percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Top skills word cloud
interface TopSkillsProps {
  candidates: Candidate[];
  onSkillClick?: (skill: string) => void;
}

export function TopSkills({ candidates, onSkillClick }: TopSkillsProps) {
  const skills = useMemo(() => {
    const skillCounts: Record<string, number> = {};
    candidates.forEach(c => {
      if (c.formData?.skills) {
        c.formData.skills.forEach(skill => {
          const normalized = skill.trim().toLowerCase();
          skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
        });
      }
    });
    
    return Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        count,
        size: Math.max(0.75, Math.min(1.5, 0.75 + (count / 10))),
      }));
  }, [candidates]);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-[var(--text-primary)]">Compétences Principales</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {skills.map(({ skill, count, size }) => (
          <button
            key={skill}
            onClick={() => onSkillClick?.(skill)}
            className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full 
                       hover:bg-purple-500/20 hover:border-purple-500/40 transition-all group"
            style={{ fontSize: `${size}rem` }}
          >
            <span className="text-purple-300 group-hover:text-purple-200">
              {skill}
            </span>
            <span className="text-xs text-purple-400/60 ml-1">
              ({count})
            </span>
          </button>
        ))}
        {skills.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)]">Aucune compétence trouvée</p>
        )}
      </div>
    </div>
  );
}

// Application timeline chart
interface ApplicationTimelineProps {
  candidates: Candidate[];
}

export function ApplicationTimeline({ candidates }: ApplicationTimelineProps) {
  const timeline = useMemo(() => {
    // Group by date
    const dateCounts: Record<string, number> = {};
    candidates.forEach(c => {
      const date = c.appliedDate;
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    
    // Sort dates and get last 14 days
    const sortedDates = Object.keys(dateCounts).sort().slice(-14);
    
    return sortedDates.map(date => ({
      date,
      count: dateCounts[date],
    }));
  }, [candidates]);

  const maxCount = Math.max(...timeline.map(d => d.count), 1);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-[var(--text-primary)]">Candidatures dans le Temps</h3>
      </div>
      
      {timeline.length > 0 ? (
        <div className="flex items-end gap-1 h-32">
          {timeline.map((item, index) => {
            const height = (item.count / maxCount) * 100;
            const date = new Date(item.date);
            const label = `${date.getDate()}/${date.getMonth() + 1}`;
            
            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center gap-1 group"
              >
                <div className="w-full flex items-end justify-center h-24">
                  <div
                    className="w-3/4 bg-purple-500/60 hover:bg-purple-400 rounded-t transition-all cursor-pointer"
                    style={{ height: `${height}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -mt-8 
                                    bg-[var(--card-bg)] border border-[var(--border-color)] 
                                    px-2 py-1 rounded text-xs text-[var(--text-primary)]
                                    whitespace-nowrap z-10">
                      {item.count} candidature{item.count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] transform -rotate-45 origin-top-left whitespace-nowrap">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)] text-center py-8">
          Aucune donnée disponible
        </p>
      )}
    </div>
  );
}

// Conversion funnel
interface ConversionFunnelProps {
  candidates: Candidate[];
}

export function ConversionFunnel({ candidates }: ConversionFunnelProps) {
  const funnel = useMemo(() => {
    const total = candidates.length;
    const nouveau = candidates.filter(c => c.status === 'Nouveau').length;
    const enCours = candidates.filter(c => c.status === 'En cours').length;
    const archived = candidates.filter(c => c.status === 'Archivé').length;
    const rejected = candidates.filter(c => c.status === 'Rejeté').length;
    
    return [
      { stage: 'Total', count: total, percent: 100 },
      { stage: 'Nouveau', count: nouveau, percent: total > 0 ? (nouveau / total) * 100 : 0 },
      { stage: 'En cours', count: enCours, percent: total > 0 ? (enCours / total) * 100 : 0 },
      { stage: 'Archivé', count: archived, percent: total > 0 ? (archived / total) * 100 : 0 },
      { stage: 'Rejeté', count: rejected, percent: total > 0 ? (rejected / total) * 100 : 0 },
    ];
  }, [candidates]);

  const maxCount = funnel[0].count;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ArrowDownUp className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-[var(--text-primary)]">Entonnoir de Conversion</h3>
      </div>
      
      <div className="space-y-2">
        {funnel.map((item, index) => {
          const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const colors = ['purple', 'blue', 'yellow', 'gray', 'red'];
          const color = colors[index] || 'purple';
          const colorMap: Record<string, string> = {
            purple: 'bg-purple-500',
            blue: 'bg-blue-500',
            yellow: 'bg-yellow-500',
            gray: 'bg-gray-500',
            red: 'bg-red-500',
          };
          
          return (
            <div key={item.stage} className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-secondary)] w-20 flex-shrink-0">
                {item.stage}
              </span>
              <div className="flex-1 h-8 bg-[var(--input-bg)] rounded-lg overflow-hidden relative">
                <div
                  className={`h-full ${colorMap[color]} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${width}%` }}
                >
                  <span className="text-xs font-medium text-white">
                    {item.count} ({Math.round(item.percent)}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatisticsCards;
