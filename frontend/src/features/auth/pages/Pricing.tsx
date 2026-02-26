import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, ChevronRight, ChevronDown, X } from 'lucide-react';
import { Footer, ThemeSwitcher } from '@shared/components';

/**
 * Pricing Page Component
 * 
 * Displays pricing plans with monthly/yearly options
 */
export function Pricing() {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const navigate = useNavigate();

  const plans = [
    {
      name: "Démarrage",
      priceMonthly: 29,
      priceYearly: 29 * 12 * 0.8,
      description: "Perfect for small teams getting started",
      descriptionFr: "Parfait pour les petites équipes qui débutent",
      features: [
        "5 Workflows",
        "1,000 Executions/mois",
        "3 Membres de l'Équipe",
        "Intégration Email",
        "Support de Base"
      ],
      cta: "Start Free Trial",
      ctaFr: "Commencer l'Essai Gratuit",
      popular: false
    },
    {
      name: "Professionnel",
      priceMonthly: 99,
      priceYearly: 99 * 12 * 0.8,
      description: "For growing teams that need more power",
      descriptionFr: "Pour les équipes en croissance qui ont besoin de plus de puissance",
      features: [
        "Workflows Illimités",
        "10,000 Executions/mois",
        "25 Membres de l'Équipe",
        "Analyse des Risques IA",
        "Support Prioritaire"
      ],
      cta: "Start Free Trial",
      ctaFr: "Commencer l'Essai Gratuit",
      popular: true
    },
    {
      name: "Entreprise",
      priceMonthly: "Sur Mesure",
      priceYearly: "Sur Mesure",
      description: "For large organizations with specific needs",
      descriptionFr: "Pour les grandes organisations ayant des besoins spécifiques",
      features: [
        "Tout Illimité",
        "Intégrations Personnalisées",
        "Support Dédié 24/7",
        "Garantie SLA",
        "Option Sur Site"
      ],
      cta: "Contact Sales",
      ctaFr: "Contacter les Ventes",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "Can I change my plan later?",
      questionFr: "Puis-je changer de formule plus tard ?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the charges accordingly.",
      answerFr: "Oui ! Vous pouvez passer à une formule supérieure ou inférieure à tout moment. Les modifications prennent effet immédiatement et nous ajusterons les frais en conséquence."
    },
    {
      question: "What payment methods do you accept?",
      questionFr: "Quels modes de paiement acceptez-vous ?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise plans.",
      answerFr: "Nous acceptons toutes les principales cartes de crédit (Visa, MasterCard, American Express), PayPal, et les virements bancaires pour les formules Entreprise."
    },
    {
      question: "Is there a free trial?",
      questionFr: "Y a-t-il un essai gratuit ?",
      answer: "Yes! All plans come with a 14-day free trial. No credit card required to start.",
      answerFr: "Oui ! Toutes les formules incluent un essai gratuit de 14 jours. Aucune carte de crédit requise pour commencer."
    },
    {
      question: "What happens when I reach my execution limit?",
      questionFr: "Que se passe-t-il lorsque j'atteins ma limite d'exécutions ?",
      answer: "You'll receive a notification when you reach 80% of your limit. If you exceed it, we'll automatically charge overage fees or you can upgrade your plan.",
      answerFr: "Vous recevrez une notification lorsque vous atteindrez 80% de votre limite. Si vous la dépassez, nous facturerons automatiquement des frais supplémentaires ou vous pourrez passer à une formule supérieure."
    },
    {
      question: "Do you offer discounts for non-profits?",
      questionFr: "Proposez-vous des réductions pour les organisations à but non lucratif ?",
      answer: "Yes! We offer special pricing for non-profits and educational institutions. Contact our sales team to learn more.",
      answerFr: "Oui ! Nous proposons des tarifs spéciaux pour les organisations à but non lucratif et les établissements d'enseignement. Contactez notre équipe commerciale pour en savoir plus."
    },
    {
      question: "Can I cancel anytime?",
      questionFr: "Puis-je annuler à tout moment ?",
      answer: "Absolutely! You can cancel your subscription at any time with no cancellation fees. Your access will continue until the end of your billing period.",
      answerFr: "Absolument ! Vous pouvez annuler votre abonnement à tout moment sans frais d'annulation. Votre accès continuera jusqu'à la fin de votre période de facturation."
    }
  ];

  const comparisonFeatures = [
    { name: "Workflows", starter: "5", professional: "Illimités", enterprise: "Illimités" },
    { name: "Exécutions Mensuelles", starter: "1,000", professional: "10,000", enterprise: "Illimitées" },
    { name: "Membres de l'Équipe", starter: "3", professional: "25", enterprise: "Illimités" },
    { name: "Constructeur de Workflow", starter: true, professional: true, enterprise: true },
    { name: "Analyse des Risques IA", starter: false, professional: true, enterprise: true },
    { name: "Architecture Multi-Locataire", starter: false, professional: true, enterprise: true },
    { name: "Journaux d'Audit et de Conformité", starter: false, professional: true, enterprise: true },
    { name: "Intégration Email", starter: true, professional: true, enterprise: true },
    { name: "Intégration Slack/Teams", starter: false, professional: true, enterprise: true },
    { name: "Intégrations Personnalisées", starter: false, professional: false, enterprise: true },
    { name: "Accès API", starter: "De Base", professional: "Complet", enterprise: "Complet" },
    { name: "Support", starter: "Email", professional: "Prioritaire", enterprise: "Dédié 24/7" },
    { name: "Garantie SLA", starter: false, professional: false, enterprise: true },
    { name: "Déploiement Sur Site", starter: false, professional: false, enterprise: true },
    { name: "Formation Personnalisée", starter: false, professional: false, enterprise: true }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-white dark:bg-h1-black text-gray-900 dark:text-white font-sans transition-colors duration-300">
      {/* HEADER */}
      <header className="bg-white/90 dark:bg-black text-gray-900 dark:text-white sticky top-0 z-50 border-b border-gray-200 dark:border-white/5 backdrop-blur-md transition-colors">
        <div className="max-w-[1440px] mx-auto px-6 h-[72px] flex items-center justify-between">
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center">
              <img src="/assets/nexflow1.png" alt="Nexflow Logo" className="h-10 w-auto dark:hidden" />
              <img src="/assets/nexflow.png" alt="Nexflow Logo" className="h-10 w-auto hidden dark:block" />
            </Link>

            <nav className="hidden lg:flex items-center gap-7">
              <button
                onClick={() => setShowSubMenu(!showSubMenu)}
                className="flex items-center gap-1.5 text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors group"
              >
                Espace d'Organisation
                <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-white/40 group-hover:text-h1-blue dark:group-hover:text-white transition-colors" />
              </button>
              <Link
                to="/#fonctionnalites"
                className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors"
              >
                Fonctionnalités
              </Link>
              <Link
                to="/pricing"
                className="text-[15px] font-semibold text-h1-blue dark:text-white hover:text-h1-blue dark:hover:text-white transition-colors"
              >
                	
              Nos Offres
              </Link>
              <Link
                to="/our-team"
                className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors"
              >
                Notre Équipe
              </Link>
              <Link
                to="/recrutement"
                className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors"
              >
                Recrutement
              </Link>
            </nav>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Link
              to="/login"
              className="text-[15px] font-semibold text-gray-600 dark:text-white/90 hover:text-h1-blue dark:hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <button
              onClick={() => navigate('/register-org')}
              className="bg-[#4b4dff] hover:bg-[#3b3de0] text-white pl-6 pr-2 py-2 rounded-full text-[15px] font-bold flex items-center gap-3 transition-all active:scale-95 group"
            >
              Commencer
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#4b4dff] group-hover:scale-110 transition-transform">
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* PRICING SECTION */}
      <section className="py-20 px-6 bg-gradient-to-b from-h1-blue/20 to-white dark:from-h1-blue/20 dark:to-h1-black">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choisissez Votre Formule
            </h2>
            <p className="text-gray-600 dark:text-white/70 mb-8">
              Commencez par un essai gratuit de 14 jours. Aucune carte de crédit requise. Annulez à tout moment.
            </p>
            
            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!yearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white/60'}`}>Mensuel</span>
              <button
                onClick={() => setYearly(!yearly)}
                className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? 'bg-h1-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${yearly ? 'left-8' : 'left-1'}`} />
              </button>
              <span className={`text-sm font-medium ${yearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white/60'}`}>
                Annuel
              </span>
              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                Économisez 20%
              </span>
            </div>
          </div>
          
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const displayPrice = yearly ? plan.priceYearly : plan.priceMonthly;
              const period = yearly ? '/an' : '/mois';
              
              return (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl p-8 ${
                    plan.popular 
                      ? 'bg-gradient-to-br from-h1-blue to-purple-600 border-2 border-h1-blue' 
                      : 'bg-white dark:bg-h1-black border border-gray-200 dark:border-white/10'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-h1-blue text-white text-sm font-semibold rounded-full">
                      Le Plus Populaire
                    </div>
                  )}
                  
                  {/* Plan Name */}
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {plan.name}
                  </h3>
                  
                  {/* Price */}
                  <div className="mb-1">
                    <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {typeof displayPrice === 'number' ? `$${Math.round(displayPrice)}` : displayPrice}
                    </span>
                    <span className={`text-sm ${plan.popular ? 'text-white/80' : 'text-gray-600 dark:text-white/70'}`}>
                      {period}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <p className={`text-sm mt-4 ${plan.popular ? 'text-white/80' : 'text-gray-600 dark:text-white/70'}`}>
                    {plan.descriptionFr}
                  </p>
                  
                  {/* Features List */}
                  <ul className="space-y-3 mt-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className={`flex items-center gap-2 ${plan.popular ? 'text-white/90' : 'text-gray-700 dark:text-white/90'}`}>
                        <Check className={`w-5 h-5 ${plan.popular ? 'text-white' : 'text-h1-blue'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA Button */}
                  <button
                    className={`w-full py-3 mt-8 rounded-lg font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-white text-h1-blue hover:bg-gray-100'
                        : 'bg-h1-blue text-white hover:bg-[#3b3de0]'
                    }`}
                  >
                    {plan.ctaFr}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURE COMPARISON SECTION */}
      <section className="py-20 px-6 bg-white dark:bg-h1-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Comparaison des Fonctionnalités
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5">
                  <th className="py-4 px-6 text-left font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10">
                    Fonctionnalité
                  </th>
                  <th className="py-4 px-6 text-center font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10">
                    Démarrage
                  </th>
                  <th className="py-4 px-6 text-center font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10">
                    Professionnel
                  </th>
                  <th className="py-4 px-6 text-center font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10">
                    Entreprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr 
                    key={index} 
                    className={`border-b border-gray-200 dark:border-white/10 ${
                      index % 2 === 1 ? 'bg-gray-50/50 dark:bg-white/5' : ''
                    } hover:bg-gray-100/50 dark:hover:bg-white/10 transition-colors`}
                  >
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-h1-black">
                      {feature.name}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.starter === 'boolean' ? (
                        feature.starter ? (
                          <Check className="w-5 h-5 text-h1-blue mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 dark:text-white/90">{feature.starter}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.professional === 'boolean' ? (
                        feature.professional ? (
                          <Check className="w-5 h-5 text-h1-blue mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 dark:text-white/90">{feature.professional}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? (
                          <Check className="w-5 h-5 text-h1-blue mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 dark:text-white/90">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 px-6 bg-white dark:bg-h1-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Questions Fréquemment Posées
          </h2>
          <p className="text-gray-600 dark:text-white/70 text-center mb-12">
            Tout ce que vous devez savoir sur nos tarifs
          </p>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-h1-black overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 text-left font-semibold flex justify-between items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="text-gray-900 dark:text-white">{faq.questionFr}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-h1-blue flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} 
                  />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10">
                    <p className="text-gray-600 dark:text-white/70">
                      {faq.answerFr}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
