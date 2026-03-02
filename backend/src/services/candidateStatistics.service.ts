import prisma from "../lib/prisma";
import { CandidateStatus } from "@prisma/client";

export interface CandidateStatistics {
  // Overview Stats
  totalCandidates: number;
  averageMatchScore: number;
  newToday: number;
  savedCandidates: number;
  totalCandidatesTrend: number;
  
  // Status Distribution
  statusDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
  
  // Match Score Distribution
  scoreDistribution: {
    range: string;
    min: number;
    max: number;
    count: number;
    color: string;
  }[];
  
  // Top Skills
  topSkills: {
    skill: string;
    count: number;
    percentage: number;
  }[];
  
  // Application Timeline
  applicationTimeline: {
    date: string;
    count: number;
  }[];
  
  // Conversion Funnel
  conversionFunnel: {
    stage: string;
    count: number;
    percentage: number;
  }[];
}

export const candidateStatisticsService = {
  /**
   * Get comprehensive candidate statistics
   */
  async getStatistics(organisationId?: string): Promise<CandidateStatistics> {
    // Build where clause for filtering by organisation
    const candidateWhere = organisationId
      ? {
          applications: {
            some: {
              jobOffer: {
                organisationId,
              },
            },
          },
        }
      : {};

    // Get all candidates with applications
    const candidates = await prisma.candidate.findMany({
      where: candidateWhere,
      include: {
        applications: {
          include: {
            jobOffer: {
              select: {
                skills: true,
                organisationId: true,
              },
            },
            aiAnalyses: {
              where: {
                type: 'MATCH_SCORE',
              },
              select: {
                confidence: true,
                result: true,
              },
            },
          },
        },
      },
    });

    // 1. Overview Stats
    const totalCandidates = candidates.length;
    
    // Calculate average match score from AI analyses
    let totalScore = 0;
    let scoreCount = 0;
    candidates.forEach((candidate) => {
      if (candidate.applications) {
        candidate.applications.forEach((app) => {
          const analyses = app.aiAnalyses;
          if (analyses && analyses.length > 0) {
            const firstAnalysis = analyses[0];
            if (firstAnalysis && firstAnalysis.confidence !== null && firstAnalysis.confidence !== undefined) {
              totalScore += firstAnalysis.confidence * 100; // Convert to percentage
              scoreCount++;
            }
          }
        });
      }
    });
    const averageMatchScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

    // New today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = candidates.filter((c) => {
      const createdAt = new Date(c.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      return createdAt.getTime() === today.getTime();
    }).length;

    // Saved candidates (candidates with saved status or bookmarked - using a convention)
    const savedCandidates = candidates.filter((c) => 
      c.status === CandidateStatus.CONTACTED || c.status === CandidateStatus.INTERVIEW
    ).length;

    // Calculate trend (comparing to previous period)
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekCount = candidates.filter((c) => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= lastWeek && createdAt < today;
    }).length;
    const previousWeek = new Date(lastWeek);
    previousWeek.setDate(previousWeek.getDate() - 7);
    const previousWeekCount = candidates.filter((c) => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= previousWeek && createdAt < lastWeek;
    }).length;
    const totalCandidatesTrend = previousWeekCount > 0 
      ? Math.round(((lastWeekCount - previousWeekCount) / previousWeekCount) * 100)
      : lastWeekCount > 0 ? 100 : 0;

    // 2. Status Distribution
    const statusCounts: Record<string, number> = {
      'Nouveau': 0,
      'En cours': 0,
      'Archivé': 0,
      'Rejeté': 0,
    };
    
    const statusMapping: Record<string, string> = {
      'CANDIDATE': 'Nouveau',
      'CONTACTED': 'En cours',
      'INTERVIEW': 'En cours',
      'ACCEPTED': 'Archivé',
      'REJECTED': 'Rejeté',
    };

    candidates.forEach((candidate) => {
      const mappedStatus = statusMapping[candidate.status] || 'Nouveau';
      if (statusCounts[mappedStatus] !== undefined) {
        statusCounts[mappedStatus]++;
      }
    });

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0,
    }));

    // 3. Match Score Distribution
    const scoreRanges = [
      { min: 0, max: 20, label: '0-20%', count: 0, color: '#ef4444' },
      { min: 21, max: 40, label: '21-40%', count: 0, color: '#f97316' },
      { min: 41, max: 60, label: '41-60%', count: 0, color: '#eab308' },
      { min: 61, max: 80, label: '61-80%', count: 0, color: '#22c55e' },
      { min: 81, max: 100, label: '81-100%', count: 0, color: '#8b5cf6' },
    ];

    candidates.forEach((candidate) => {
      if (candidate.applications) {
        candidate.applications.forEach((app) => {
          const analyses = app.aiAnalyses;
          if (analyses && analyses.length > 0) {
            const firstAnalysis = analyses[0];
            if (firstAnalysis && firstAnalysis.confidence !== null && firstAnalysis.confidence !== undefined) {
              const percentage = firstAnalysis.confidence * 100;
              const range = scoreRanges.find((r) => percentage >= r.min && percentage <= r.max);
              if (range) range.count++;
            }
          }
        });
      }
    });

    const scoreDistribution = scoreRanges.map((range) => ({
      range: range.label,
      min: range.min,
      max: range.max,
      count: range.count,
      color: range.color,
    }));

    // 4. Top Skills
    const skillCounts: Record<string, number> = {};
    candidates.forEach((candidate) => {
      if (candidate.applications) {
        candidate.applications.forEach((app) => {
          if (app.jobOffer && app.jobOffer.skills && Array.isArray(app.jobOffer.skills)) {
            app.jobOffer.skills.forEach((skill: string) => {
              if (skill) {
                const normalized = skill.trim().toLowerCase();
                skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
              }
            });
          }
        });
      }
    });

    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        count,
        percentage: totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0,
      }));

    // 5. Application Timeline (last 30 days)
    const dateCounts: Record<string, number> = {};
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    candidates.forEach((candidate) => {
      if (candidate.applications) {
        candidate.applications.forEach((app) => {
          const appDate = new Date(app.createdAt);
          if (appDate >= thirtyDaysAgo) {
            const dateKey = appDate.toISOString().split('T')[0] ?? '';
            if (dateKey) {
              dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
            }
          }
        });
      }
    });

    const applicationTimeline = Object.entries(dateCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // Last 14 data points
      .map(([date, count]) => ({
        date,
        count: count ?? 0,
      }));

    // 6. Conversion Funnel
    const nouveau = statusCounts['Nouveau'] ?? 0;
    const enCours = statusCounts['En cours'] ?? 0;
    const archive = statusCounts['Archivé'] ?? 0;
    const rejected = statusCounts['Rejeté'] ?? 0;

    const conversionFunnel = [
      { stage: 'Total', count: totalCandidates, percentage: 100 },
      { stage: 'Nouveau', count: nouveau ?? 0, percentage: totalCandidates > 0 ? Math.round(((nouveau ?? 0) / totalCandidates) * 100) : 0 },
      { stage: 'En cours', count: enCours ?? 0, percentage: totalCandidates > 0 ? Math.round(((enCours ?? 0) / totalCandidates) * 100) : 0 },
      { stage: 'Archivé', count: archive ?? 0, percentage: totalCandidates > 0 ? Math.round(((archive ?? 0) / totalCandidates) * 100) : 0 },
      { stage: 'Rejeté', count: rejected ?? 0, percentage: totalCandidates > 0 ? Math.round(((rejected ?? 0) / totalCandidates) * 100) : 0 },
    ];

    return {
      totalCandidates,
      averageMatchScore,
      newToday,
      savedCandidates,
      totalCandidatesTrend,
      statusDistribution,
      scoreDistribution,
      topSkills,
      applicationTimeline,
      conversionFunnel,
    };
  },
};

