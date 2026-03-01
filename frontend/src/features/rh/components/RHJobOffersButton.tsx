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
      className="flex items-center gap-2 px-4 py-2 bg-[#8000ff] text-white rounded-lg hover:bg-[#6a00cc] transition-colors font-medium text-sm"
    >
      <Plus className="w-4 h-4" />
      <span>Gestion des offres</span>
    </Link>
  );
}
