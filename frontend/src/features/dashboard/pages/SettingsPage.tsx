import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Lock, Bell, Moon, Sun, Monitor, Laptop, 
  Trash2, AlertTriangle, CheckCircle2, XCircle,
  Save, LogOut, Building, Globe, MapPin, ExternalLink, Loader2
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { settingsService, UserProfile, NotificationSettings, ActiveSession, OrganisationSettings } from '@/services/settings.service';

export function SettingsPage() {
  const { orgData, isAdmin, userData } = useOutletContext<any>();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: userData?.email || ''
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: userData?.notifications?.emailNotifications ?? true,
    inAppNotifications: userData?.notifications?.inAppNotifications ?? true,
    workflowUpdates: userData?.notifications?.workflowUpdates ?? true,
    taskAssigned: userData?.notifications?.taskAssigned ?? true,
    recruitmentNotifications: userData?.notifications?.recruitmentNotifications ?? true
  });

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    (localStorage.getItem('theme') as any) || 'system'
  );

  // Sessions State
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  
  // Organisation State
  const [organisation, setOrganisation] = useState<OrganisationSettings>({
    name: orgData?.name || '',
    logo: orgData?.orgInfo?.logo || '',
    domain: orgData?.orgInfo?.domain || '',
    address: orgData?.orgInfo?.address || '',
    city: orgData?.orgInfo?.city || '',
    website: orgData?.orgInfo?.website || ''
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const result = await settingsService.getSessions();
      setSessions(result.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('profile');
    try {
      await settingsService.updateProfile(profile);
      showToast('Profil mis à jour avec succès');
      // Update local storage if needed
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...savedUser, ...profile }));
      window.dispatchEvent(new CustomEvent('user-data-updated'));
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    setLoading('password');
    try {
      await settingsService.updatePassword(passwordData);
      showToast('Mot de passe mis à jour avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleNotificationToggle = async (key: keyof NotificationSettings) => {
    const newSettings = { ...notifications, [key]: !notifications[key] };
    setNotifications(newSettings);
    try {
      await settingsService.updateNotifications(newSettings);
    } catch (err) {
      showToast('Erreur lors de la mise à jour des notifications', 'error');
      setNotifications(notifications); // Rollback
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      await settingsService.updateTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
      showToast('Thème mis à jour');
    } catch (err) {
      showToast('Erreur lors de la mise à jour du thème', 'error');
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await settingsService.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      showToast('Session déconnectée');
    } catch (err) {
      showToast('Erreur lors de la déconnexion de la session', 'error');
    }
  };

  const handleOrganisationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('organisation');
    try {
      await settingsService.updateOrganisation(organisation);
      showToast('Organisation mise à jour avec succès');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteOrganisation = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre organisation ? Cette action est irréversible.')) {
      setLoading('delete-org');
      try {
        await settingsService.deleteOrganisation();
        showToast('Organisation supprimée');
        localStorage.clear();
        window.location.href = '/login';
      } catch (err) {
        showToast('Erreur lors de la suppression', 'error');
        setLoading(null);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-8 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 font-bold text-sm ${
              toast.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-h1-blue" />
          Paramètres
        </h1>
        <p className="text-zinc-500 mt-1">Gérez vos préférences de compte et votre organisation.</p>
      </header>

      <div className="grid gap-8">
        {/* Profile Settings */}
        <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <User className="w-5 h-5 text-h1-blue" />
            <h2 className="font-bold text-lg">Profil</h2>
          </div>
          <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Prénom</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Nom</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading === 'profile'}
                className="flex items-center gap-2 bg-h1-blue hover:bg-h1-blue/90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-h1-blue/20 disabled:opacity-50"
              >
                {loading === 'profile' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                SAUVEGARDER
              </button>
            </div>
          </form>
        </section>

        {/* Password Settings */}
        <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <Lock className="w-5 h-5 text-h1-blue" />
            <h2 className="font-bold text-lg">Sécurité</h2>
          </div>
          <form onSubmit={handlePasswordUpdate} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Mot de passe actuel</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading === 'password'}
                className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {loading === 'password' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                METTRE À JOUR
              </button>
            </div>
          </form>
        </section>

        {/* Notifications Settings */}
        <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <Bell className="w-5 h-5 text-h1-blue" />
            <h2 className="font-bold text-lg">Notifications</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              { id: 'emailNotifications', label: 'Notifications par email', desc: 'Recevoir des mises à jour par email' },
              { id: 'inAppNotifications', label: 'Notifications In-app', desc: 'Alertes dans le tableau de bord' },
              { id: 'workflowUpdates', label: 'Mises à jour Workflow', desc: 'Activités sur vos workflows' },
              { id: 'taskAssigned', label: 'Tâches assignées', desc: "Nouvelles tâches à l'ordre du jour" },
              { id: 'recruitmentNotifications', label: 'Recrutement', desc: 'Nouveaux candidats et offres' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800">
                <div>
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleNotificationToggle(item.id as keyof NotificationSettings)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    notifications[item.id as keyof NotificationSettings] ? 'bg-h1-blue' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <motion.div
                    animate={{ x: notifications[item.id as keyof NotificationSettings] ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Theme Settings */}
        <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <Sun className="w-5 h-5 text-h1-blue" />
            <h2 className="font-bold text-lg">Apparence</h2>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4">
            {[
              { id: 'light', label: 'Clair', icon: Sun },
              { id: 'dark', label: 'Sombre', icon: Moon },
              { id: 'system', label: 'Système', icon: Monitor },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleThemeChange(item.id as any)}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${
                  theme === item.id 
                    ? 'border-h1-blue bg-h1-blue/5 text-h1-blue' 
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <item.icon className="w-8 h-8" />
                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Sessions Settings */}
        <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <Laptop className="w-5 h-5 text-h1-blue" />
            <h2 className="font-bold text-lg">Sessions actives</h2>
          </div>
          <div className="p-6 divide-y divide-zinc-100 dark:divide-zinc-800">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div key={session.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                      {session.userAgent?.toLowerCase().includes('mobile') ? <Monitor className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        {session.userAgent || 'Navigateur inconnu'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">IP: {session.ipAddress || 'Inconnue'}</p>
                      <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-bold">
                        Créé: {new Date(session.createdAt).toLocaleString()}
                        {session.current && <span className="ml-2 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">Actuelle</span>}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <button 
                      onClick={() => handleLogoutSession(session.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all font-bold text-xs"
                    >
                      <LogOut className="w-4 h-4" />
                      DÉCONNEXION
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-zinc-500 font-medium">Aucune session active trouvée.</p>
              </div>
            )}
          </div>
        </section>

        {/* Organisation Settings (Admin only) */}
        {isAdmin && (
          <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
              <Building className="w-5 h-5 text-h1-blue" />
              <h2 className="font-bold text-lg">Organisation</h2>
            </div>
            <form onSubmit={handleOrganisationUpdate} className="p-6 space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  {organisation.logo ? (
                    <img src={organisation.logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building className="w-10 h-10 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Nom de l'organisation</label>
                    <input
                      type="text"
                      value={organisation.name || ''}
                      onChange={(e) => setOrganisation({ ...organisation, name: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Domaine</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={organisation.domain || ''}
                      onChange={(e) => setOrganisation({ ...organisation, domain: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Site Web</label>
                  <div className="relative">
                    <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="url"
                      value={organisation.website || ''}
                      onChange={(e) => setOrganisation({ ...organisation, website: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Adresse</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={organisation.address || ''}
                      onChange={(e) => setOrganisation({ ...organisation, address: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Ville</label>
                  <input
                    type="text"
                    value={organisation.city || ''}
                    onChange={(e) => setOrganisation({ ...organisation, city: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:border-h1-blue outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading === 'organisation'}
                  className="flex items-center gap-2 bg-h1-blue hover:bg-h1-blue/90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-h1-blue/20 disabled:opacity-50"
                >
                  {loading === 'organisation' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building className="w-5 h-5" />}
                  METTRE À JOUR
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Danger Zone (Admin only) */}
        {isAdmin && (
          <section className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-red-200 dark:border-red-500/20 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="font-bold text-lg text-red-600 dark:text-red-400">Zone de danger</h2>
            </div>
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="font-bold text-red-600 dark:text-red-400">Supprimer l'organisation</p>
                <p className="text-sm text-red-500 opacity-80 mt-1">
                  Une fois supprimée, toutes les données associées seront définitivement effacées. 
                  Cette action est irréversible.
                </p>
              </div>
              <button
                onClick={handleDeleteOrganisation}
                disabled={loading === 'delete-org'}
                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 shrink-0"
              >
                {loading === 'delete-org' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                SUPPRIMER DÉFINITIVEMENT
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
