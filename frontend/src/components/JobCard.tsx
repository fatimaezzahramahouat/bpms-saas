import { MapPin, Briefcase, Clock } from 'lucide-react';

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
  };
  onApply?: (job: {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    description: string;
    postedDate: string;
  }) => void;
}

export function JobCard({ job, onApply }: JobCardProps) {
  return (
    <div className="bg-white dark:bg-h1-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-h1-blue/10 hover:border-h1-blue/30 hover:-translate-y-1">
      {/* Job Title */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {job.title}
      </h3>

      {/* Company Name */}
      <p className="text-h1-blue font-semibold mb-4">
        {job.company}
      </p>

      {/* Job Details */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-4 h-4" />
          <span>{job.type}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{job.postedDate}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-2">
        {job.description}
      </p>

      {/* Apply Button */}
      <button 
        onClick={() => onApply?.(job)}
        className="w-full bg-h1-blue hover:bg-h1-blue/90 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
      >
        Postuler
      </button>
    </div>
  );
}
