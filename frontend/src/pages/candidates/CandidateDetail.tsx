// frontend/src/pages/candidates/CandidateDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CandidateAnalysis from '../../components/CandidateAnalysis';

// Types
interface CVData {
  name?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  projects?: string[];
  languages?: string[];
  [key: string]: unknown;
}

interface JobOfferData {
  title?: string;
  company?: string;
  requiredSkills?: string[];
  experienceRequired?: string;
  educationRequired?: string;
  responsibilities?: string[];
  location?: string;
  salary?: string;
  [key: string]: unknown;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  cvData?: CVData;
  jobOfferId?: string;
  [key: string]: unknown;
}

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [jobOffer, setJobOffer] = useState<JobOfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const candidateRes = await fetch(`http://localhost:5000/api/candidates/${id}`);
        
        if (!candidateRes.ok) {
          throw new Error('Candidat non trouvé');
        }
        
        const candidateData = await candidateRes.json();
        setCandidate(candidateData);
        
        if (candidateData.jobOfferId) {
          const jobRes = await fetch(`http://localhost:5000/api/joboffers/${candidateData.jobOfferId}`);
          if (jobRes.ok) {
            const jobData = await jobRes.json();
            setJobOffer(jobData);
          }
        }
        
      } catch (err) {
        console.error('❌ Error fetching ', err);
        setError('Impossible de charger les données du candidat');
        
        // test information delete again
        setCandidate({
          id: id,
          name: 'Elharirimanal',
          email: 'Elharirimanal6@gmail.com',
          phone: '0699149589',
          cvData: {
            name: 'Elharirimanal',
            skills: ['React', 'Node.js', 'TypeScript', 'Git', 'Python'],
            experience: '3 ans',
            education: 'Licence Informatique',
            projects: ['Application e-commerce', 'API REST', 'Dashboard analytique'],
            languages: ['Français', 'Anglais', 'Arabe']
          }
        });
        setJobOffer({
          title: 'Développeur Full Stack',
          company: 'Tech Company',
          requiredSkills: ['React', 'Node.js', 'MongoDB', 'Git', 'TypeScript'],
          experienceRequired: '2-5 ans',
          educationRequired: 'Bac+3 minimum en Informatique',
          responsibilities: [
            'Développement frontend avec React',
            'Développement backend avec Node.js',
            'Gestion de base de données MongoDB',
            'Travail en équipe Agile'
          ],
          location: 'Paris, France',
          salary: '45k-55k €'
        });
        
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du candidat...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-red-600 font-semibold mb-4">⚠️ {error}</p>
          <button
            onClick={() => navigate('/candidates')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-10">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header + back button*/}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/candidates')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span>←</span>
            <span>Retour</span>
          </button>
          
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-800">
              Fiche Candidat
            </h1>
            <p className="text-gray-500 text-sm">
              Analyse AI des compétences
            </p>
          </div>
        </div>

        {/* information condidats */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border-2 border-purple-100">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg flex-shrink-0">
              {candidate?.name?.charAt(0) || 'C'}
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {candidate?.name || 'Candidat'}
              </h2>
              <p className="text-xl text-purple-600 font-semibold">
                {jobOffer?.title || 'Poste non spécifié'}
              </p>
              {jobOffer?.company && (
                <p className="text-gray-500 mt-1">🏢 {jobOffer.company}</p>
              )}
            </div>
          </div>

          {/* Contacts*/}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t-2 border-gray-100">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-gray-500 text-sm mb-1">📧 Email</p>
              <p className="text-gray-800 font-medium break-all">{candidate?.email}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-gray-500 text-sm mb-1">📱 Téléphone</p>
              <p className="text-gray-800 font-medium">{candidate?.phone}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-gray-500 text-sm mb-1">🎓 Formation</p>
              <p className="text-gray-800 font-medium">{candidate?.cvData?.education || 'Non spécifié'}</p>
            </div>
          </div>

          {/* SKILLS*/}
          {candidate?.cvData?.skills && candidate.cvData.skills.length > 0 && (
            <div className="mt-6">
              <p className="text-gray-700 font-semibold mb-3">💼 Compétences:</p>
              <div className="flex flex-wrap gap-2">
                {candidate.cvData.skills.map((skill: string, index: number) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ✅ ✅ ✅ COMPONANT AI ✅ ✅ ✅ */}
        <CandidateAnalysis
          candidateId={candidate?.id}
          cvData={candidate?.cvData || {}}
          jobOfferData={jobOffer || {}}
        />

      </div>
    </div>
  );
};

export default CandidateDetail;