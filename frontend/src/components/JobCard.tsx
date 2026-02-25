import { ChevronRight } from 'lucide-react';

/**
 * Job Card Component
 * 
 * Displays a single job offer as a card with hover effects.
 */
interface JobCardProps {
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    description: string;
    postedDate: string;
    skills?: string[];
    budget?: string;
    deadline?: string;
    experienceLevel?: 'Junior' | 'Intermediate' | 'Senior';
  };
  onApply?: (job: JobCardProps['job']) => void;
  onReadMore?: (job: JobCardProps['job']) => void;
}

export function JobCard({ job, onApply, onReadMore }: JobCardProps) {
  const showReadMore = job.description.length > 150;
  
  return (
    <div className="bg-white dark:bg-h1-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-h1-blue/10 hover:border-h1-blue/30 hover:-translate-y-1 flex flex-col h-full min-h-[320px]">
      {/* Job Title */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {job.title}
      </h3>

      {/* Company + Location */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {job.company} • {job.location}
      </p>
      
      {/* Description - truncated */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1">
        {job.description}
      </p>
      
      {/* Posted Date */}
      <span className="text-xs text-gray-500 dark:text-gray-500 mb-4">
        {job.postedDate}
      </span>

      {/* Actions - pushed to bottom with mt-auto */}
      <div className="mt-auto space-y-3">
        {showReadMore && (
          <button
            onClick={() => onReadMore?.(job)}
            className="text-sm text-h1-blue hover:text-h1-blue/80 font-medium flex items-center gap-1 transition-colors"
          >
            Lire plus
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        
        <button 
          onClick={() => onApply?.(job)}
          className="w-full bg-h1-blue hover:bg-h1-blue/90 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          Postuler
        </button>
      </div>
    </div>
  );
}
