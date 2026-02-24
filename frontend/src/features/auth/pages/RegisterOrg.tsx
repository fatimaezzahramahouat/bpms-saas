import { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Building2, User, Users, Phone, Mail, Check, Lock } from 'lucide-react';

import { GlowBackground, PortalLogo } from '@shared/components';

/**
 * Register Organization Page Component
 * 
 * Registration page for creating a new organization.
 * This page is part of the auth feature module.
 */
export function RegisterOrg() {
  const [formData, setFormData] = useState({
    orgName: '',
    responsibleName: '',
    employeeCount: '',
    phone: '',
    email: '',
    password: ''
  });


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Registration Data:', formData);
    alert('Demande validée.');
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-start pt-6 bg-h1-black font-sans relative overflow-hidden px-[4cm]">
      <GlowBackground />

      <div className="flex flex-col items-center w-full max-w-5xl relative z-10">
        <PortalLogo />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-col items-center"
        >
          <h1 className="text-h1-blue text-xl font-black uppercase tracking-[0.2em] border-b-2 border-h1-blue pb-1 text-center">
            CRÉATION DE L'ESPACE ORGANISATION
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gov-card w-full p-6"
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="gov-row-compact">
                <div className="gov-label-box-compact">
                  <Building2 className="w-5 h-5 mr-4" />
                  Organisation
                </div>
                <input
                  type="text"
                  name="orgName"
                  placeholder="NOM DE L'ORGANISATION"
                  className="gov-input-compact"
                  value={formData.orgName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="gov-row-compact">
                <div className="gov-label-box-compact">
                  <User className="w-5 h-5 mr-4" />
                  Responsable
                </div>
                <input
                  type="text"
                  name="responsibleName"
                  placeholder="NOM COMPLET DU RESPONSABLE"
                  className="gov-input-compact"
                  value={formData.responsibleName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="gov-row-compact">
                <div className="gov-label-box-compact">
                  <Users className="w-5 h-5 mr-4" />
                  Employés
                </div>
                <select
                  name="employeeCount"
                  className="gov-input-compact appearance-none cursor-pointer"
                  value={formData.employeeCount}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>SÉLECTIONNEZ</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="200+">200+</option>
                </select>
              </div>

              <div className="gov-row-compact">
                <div className="gov-label-box-compact">
                  <Phone className="w-5 h-5 mr-4" />
                  Téléphone
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+212 ..."
                  className="gov-input-compact"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="gov-row-compact mb-4">
                <div className="gov-label-box-compact">
                  <Mail className="w-5 h-5 mr-4" />
                  Email Professionnel
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="EMAIL@ENTREPRISE.MA"
                  className="gov-input-compact"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="gov-row-compact mb-4">
                <div className="gov-label-box-compact">
                  <Lock className="w-5 h-5 mr-4" />
                  Mot de passe
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="gov-input-compact"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            <div className="flex justify-center">
              <button type="submit" className="gov-button-compact px-12 py-2.5 text-sm">
                <Check className="w-6 h-6" />
                Valider l'inscription
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
