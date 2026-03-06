// /home/manal/projet_final_BPMS/frontend/src/pages/candidates/CandidateDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AIAnalysisPanel } from '../../features/rh/components/AIAnalysisPanel';import { getCandidate, getJobOffer, CVData, JobOfferData } from '../../lib/api';
import { ArrowLeft, Mail, Phone, GraduationCap, Briefcase } from 'lucide-react';

export function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [candidate, setCandidate] = useState<any>(null);
  const [jobOffer, setJobOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('📥 Fetching candidate:', id);
        const candData = await getCandidate(id);
        console.log('✅ Candidate data:', candData);
        setCandidate(candData);
        
        if (candData.jobOfferId) {
          console.log('📥 Fetching job offer:', candData.jobOfferId);
          const jobData = await getJobOffer(candData.jobOfferId);
          console.log('✅ Job offer data:', jobData);
          setJobOffer(jobData);
        }
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Candidat non trouvé'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const cvData: CVData = {
    name: candidate.fullName || candidate.name,
    skills: candidate.skills || [],
    experience: candidate.experience || '',
    education: candidate.education || '',
  };

  const jobOfferData: JobOfferData = {
    title: jobOffer?.title || '',
    requiredSkills: jobOffer?.skills || [],
    experienceRequired: jobOffer?.level || jobOffer?.experienceRequired || '',
    educationRequired: jobOffer?.educationRequired || '',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Fiche Candidat</h1>
          <p className="text-gray-600">Analyse IA des compétences</p>
        </div>

        {/* Candidate Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {candidate.fullName?.charAt(0) || candidate.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{candidate.fullName || candidate.name}</h2>
              <p className="text-purple-600">{jobOffer?.title || 'Poste non spécifié'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <p className="text-gray-800">{candidate.email}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium">Téléphone</span>
              </div>
              <p className="text-gray-800">{candidate.phone || 'Non spécifié'}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm font-medium">Formation</span>
              </div>
              <p className="text-gray-800">{candidate.education || 'Non spécifié'}</p>
            </div>
          </div>

          {cvData.skills && cvData.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Compétences
              </h3>
              <div className="flex flex-wrap gap-2">
                {cvData.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis Panel */}
        <AIAnalysisPanel
          candidateId={candidate.id}
          jobOfferId={jobOffer?.id || ''}
          cvData={cvData}
          jobOfferData={jobOfferData}
        />
      </div>
    </div>
  );
}

export default CandidateDetail;