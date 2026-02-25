import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface Project {
  name: string;
  description: string;
  image: string;
}

interface TeamMember {
  id: number;
  name: string;
  position: string;
  image: string;
  shortBio: string;
  fullBio: string;
  skills: string[];
  projects: Project[];
}

interface TeamMemberModalProps {
  member: TeamMember;
  onClose: () => void;
}

export default function TeamMemberModal({ member, onClose }: TeamMemberModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-h1-black rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-start justify-between p-6 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-4">
            <img
              src={member.image}
              alt={member.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-h1-blue"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{member.name}</h2>
              <p className="text-h1-blue font-medium">{member.position}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* About Section */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About</h3>
            <div className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {member.fullBio}
            </div>
          </section>

          {/* Skills Section */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {member.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-h1-blue/10 text-h1-blue rounded-full text-sm font-medium hover:bg-h1-blue/20 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Featured Projects Section */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Featured Projects</h3>
            <div className="space-y-4">
              {member.projects.map((project, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10"
                >
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {project.name}
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
