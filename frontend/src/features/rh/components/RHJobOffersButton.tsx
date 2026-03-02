import { useAuth } from '@/shared/hooks/useAuth';
import { Briefcase, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RHJobOffersButton() {
  const { user } = useAuth();
  
  // Only show for RH users
  if (user?.role !== 'RH') {
    return null;
  }
  
  return (
    <Link 
      to="/dashboard/rh/job-offers"
      className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
    >
      <Plus className="w-5 h-5" />
      <span>Gestion des offres</span>
    </Link>
  );
}
