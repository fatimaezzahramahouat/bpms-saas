import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, TrendingUp, Star, Clock, Target, PieChart, Calendar, ArrowDownUp, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { candidateStatisticsService, CandidateStatistics } from '../services/candidateStatisticsService';

// Statistics Cards Component
function StatisticsCards({ stats }: { stats: CandidateStatistics }) {
  const cards = [
    {
      label: 'Total Candidats',
      value: stats.totalCandidates,
      icon: Users,
      color: 'purple',
      trend: `${stats.totalCandidatesTrend > 0 ? '+' : ''}${stats.totalCandidatesTrend}%`,
      trendUp: stats.totalCandidatesTrend >= 0,
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
      value: stats.savedCandidates,
      icon: Star,
      color: 'yellow',
      trend: '+2',
      trendUp: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const colorClasses: Record<string, string> = {
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
              <div className={`p-2.5 rounded-lg border ${colorClasses[card.color]}`}>
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

// Status Distribution Donut Chart
function StatusDistribution({ data }: { data: CandidateStatistics['statusDistribution'] }) {
  const total = data.reduce((acc, item) => acc + item.count, 0);
  const colors: Record<string, string> = {
    'Nouveau': '#8b5cf6',
    'En cours': '#3b82f6',
    'Archivé': '#6b7280',
    'Rejeté': '#ef4444',
  };

  let cumulativePercent = 0;
  const segments = data.map((item) => {
    const percent = total > 0 ? (item.count / total) * 100 : 0;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return { ...item, percent, startPercent };
  }).filter(s => s.count > 0);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-[var(--text-primary)]">Répartition par Statut</h3>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            {segments.map((segment, i) => {
              const offset = segments.slice(0, i).reduce((acc, seg) => acc - (seg.percent / 100) * circumference, 0);
              return (
                <circle
                  key={segment.status}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={colors[segment.status] || '#6b7280'}
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

        <div className="flex-1 space-y-2">
          {data.map((item) => {
            const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[item.status] || '#6b7280' }}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">{item.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{item.count}</span>
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

// Top Skills Tag Cloud
function TopSkills({ data, onSkillClick }: { data: CandidateStatistics['topSkills']; onSkillClick?: (skill: string) => void }) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-[var(--text-primary)]">Compétences Principales</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {data.map(({ skill, count }, index) => {
          const size = Math.max(0.75, Math.min(1.5, 0.75 + (count / 10)));
          return (
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
          );
        })}
        {data.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)]">Aucune compétence trouvée</p>
        )}
      </div>
    </div>
  );
}

// Application Timeline Chart
function ApplicationTimeline({ data }: { data: CandidateStatistics['applicationTimeline'] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-[var(--text-primary)]">Candidatures dans le Temps</h3>
      </div>
      
      {data.length > 0 ? (
        <div className="flex items-end gap-1 h-32">
          {data.map((item) => {
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
                    className="w-3/4 bg-purple-500/60 hover:bg-purple-400 rounded-t transition-all cursor-pointer relative"
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

// Conversion Funnel
function ConversionFunnel({ data }: { data: CandidateStatistics['conversionFunnel'] }) {
  const maxCount = data[0]?.count || 1;
  const colors = ['purple', 'blue', 'yellow', 'gray', 'red'];
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ArrowDownUp className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-[var(--text-primary)]">Entonnoir de Conversion</h3>
      </div>
      
      <div className="space-y-2">
        {data.map((item, index) => {
          const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const color = colors[index] || 'purple';
          
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
                    {item.count} ({item.percentage}%)
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

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--input-bg)]"></div>
              <div className="w-12 h-5 rounded-full bg-[var(--input-bg)]"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-16 bg-[var(--input-bg)] rounded"></div>
              <div className="h-4 w-24 bg-[var(--input-bg)] rounded"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 animate-pulse">
            <div className="h-6 w-40 bg-[var(--input-bg)] rounded mb-4"></div>
            <div className="h-48 bg-[var(--input-bg)] rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Component
export function CandidateStatisticsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [statistics, setStatistics] = useState<CandidateStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isRH = user?.role === 'RH' || user?.rh;

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        const data = await candidateStatisticsService.getStatistics();
        setStatistics(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch statistics:', err);
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchStatistics();
    }
  }, [authLoading, isAuthenticated]);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await candidateStatisticsService.getStatistics();
      setStatistics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh statistics:', err);
      setError('Failed to refresh statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillClick = (skill: string) => {
    // Navigate to candidates page with skill filter
    console.log('Filter by skill:', skill);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Not RH
  if (!isRH) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Accès refusé</h1>
        <p className="text-[var(--text-secondary)] mb-4">
          Vous n'avez pas l'autorisation d'accéder à cette page.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Statistiques des Candidats
            </h1>
            <p className="text-[var(--text-secondary)]">
              Analysez les performances de votre processus de recrutement
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 
                       text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !statistics ? (
          <DashboardSkeleton />
        ) : statistics ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <StatisticsCards stats={statistics} />

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <StatusDistribution data={statistics.statusDistribution} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopSkills data={statistics.topSkills} onSkillClick={handleSkillClick} />
              <ApplicationTimeline data={statistics.applicationTimeline} />
            </div>

            {/* Conversion Funnel */}
            <ConversionFunnel data={statistics.conversionFunnel} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-[var(--text-secondary)]">Aucune donnée disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateStatisticsPage;
