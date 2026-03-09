// /home/manal/projet_final_BPMS/backend/src/lib/cvExtractor.ts

import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';

// ============================================================================
// INTERFACES - هيكل البيانات المستخرجة
// ============================================================================

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  professionalTitle?: string;
  summary?: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  period: string;
  location: string;
  responsibilities: string[];
  technologies?: string[];
  achievementDescriptions?: string[];
}

export interface Education {
  degree: string;
  school: string;
  period: string;
  location: string;
  field?: string;
}

export interface TechnicalSkills {
  frontend: string[];
  backend: string[];
  databases: string[];
  devops: string[];
  security: string[];
  cms: string[];
  tools: string[];
  automation: string[];
  methodologies: string[];
  testing: string[];
}

export interface TechnologyWithExperience {
  name: string;
  category: string;
  context: 'production' | 'personal' | 'learning';
  yearsOfUse?: number;
  lastUsed?: string;
  projects?: string[];
  proficiency?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
}

export interface GapAnalysis {
  critical: string[];
  recommended: string[];
  bonus: string[];
  partial: Array<{ skill: string; reason: string }>;
}

export interface SoftSkill {
  name: string;
  evidence: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface PublicLink {
  type: 'github' | 'gitlab' | 'portfolio' | 'linkedin' | 'blog' | 'other';
  url: string;
  description?: string;
}

export interface PublicProject {
  name: string;
  url?: string;
  technologies: string[];
  description?: string;
  stars?: number;
  isPersonal: boolean;
}

export interface Achievement {
  category: 'development' | 'automation' | 'optimization' | 'database' | 'security' | 'ecommerce';
  description: string;
  metrics?: {
    value: string;
    type: 'products' | 'leads' | 'performance' | 'reduction' | 'time' | 'other';
  };
  technologies?: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  results?: string;
  link?: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  date?: string;
  expiry?: string;
}

export interface Language {
  language: string;
  level: 'débutant' | 'fonctionnel' | 'courant' | 'natif' | 'intermédiaire';
  details?: string;
}

export interface CVData {
  personalInfo: PersonalInfo;
  workExperiences: WorkExperience[];
  education: Education[];
  technicalSkills: TechnicalSkills;
  achievements: Achievement[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  interests: string[];
  rawText: string;
  technologiesWithExperience?: TechnologyWithExperience[];
  gapAnalysis?: GapAnalysis;
  softSkills?: SoftSkill[];
  publicLinks?: PublicLink[];
  publicProjects?: PublicProject[];
  metadata: {
    extractionDate: string;
    totalYearsExperience: number;
    expertiseLevel: string;
    technologiesCount: number;
  };
}

// ============================================================================
// TECH KEYWORDS DATABASE
// ============================================================================

const techKeywords = {
  frontend: [
    'React', 'React.js', 'ReactJS', 'Angular', 'AngularJS', 'Angular 2+', 'Vue', 'Vue.js', 'VueJS', 'Vue 3',
    'Svelte', 'Next.js', 'NextJS', 'Nuxt', 'Nuxt.js', 'Gatsby', 'Remix', 'Astro',
    'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'SCSS', 'Less', 'Stylus', 'PostCSS',
    'JavaScript', 'JS', 'ES6', 'ES7', 'ES2015', 'ES2020', 'TypeScript', 'TS', 'TSX',
    'jQuery', 'Bootstrap', 'Tailwind', 'TailwindCSS', 'Material-UI', 'MUI', 'Chakra UI',
    'Ant Design', 'Foundation', 'Bulma', 'Semantic UI', 'UIKit', 'Spectre',
    'Redux', 'Redux Toolkit', 'Vuex', 'Mobx', 'Zustand', 'Recoil', 'Context API', 'Pinia',
    'Webpack', 'Vite', 'Rollup', 'Parcel', 'Babel', 'ESLint', 'Prettier', 'Stylelint',
    'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Zeplin', 'Framer', 'Principle'
  ],
  backend: [
    'Node.js', 'NodeJS', 'Express', 'Express.js', 'NestJS', 'Nest.js', 'Fastify', 'Koa',
    'PHP', 'Laravel', 'Symfony', 'CodeIgniter', 'CakePHP', 'Zend', 'Yii', 'Slim',
    'Python', 'Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado', 'Bottle', 'Dash',
    'Java', 'Spring', 'Spring Boot', 'Spring MVC', 'Spring Cloud', 'Hibernate', 'JSF', 'Struts',
    'C#', 'CSharp', 'ASP.NET', 'ASP.NET Core', '.NET', '.NET Core', '.NET Framework', 'Entity Framework',
    'Ruby', 'Ruby on Rails', 'Rails', 'Sinatra', 'Hanami',
    'Go', 'Golang', 'Rust', 'Scala', 'Kotlin', 'Swift', 'Dart',
    'API', 'API REST', 'RESTful', 'REST API', 'GraphQL', 'gRPC', 'SOAP', 'OpenAPI', 'Swagger',
    'Microservices', 'Micro-services', 'Serverless', 'Lambda', 'Cloud Functions',
    'WebSocket', 'WebSockets', 'Socket.io', 'RabbitMQ', 'Kafka', 'Redis', 'Memcached', 'ActiveMQ',
    'Middleware', 'Backend', 'Frontend', 'Full-Stack', 'Full Stack', 'Fullstack'
  ],
  databases: [
    'MySQL', 'MariaDB', 'PostgreSQL', 'Postgres', 'SQL Server', 'MSSQL', 'T-SQL',
    'MongoDB', 'Mongo', 'CouchDB', 'Cassandra', 'DynamoDB', 'CosmosDB',
    'Elasticsearch', 'Elastic', 'Solr', 'Algolia', 'Meilisearch',
    'Neo4j', 'ArangoDB', 'OrientDB', 'Redis', 'Memcached',
    'Firebase', 'Firestore', 'Realm', 'SQLite', 'Oracle', 'DB2', 'Informix',
    'SQL', 'NoSQL', 'Database', 'Base de données', 'Data Warehouse', 'Data Lake',
    'ORM', 'ODM', 'Sequelize', 'TypeORM', 'Prisma', 'Mongoose', 'Entity Framework', 'EF Core',
    'Migration', 'Migrations', 'Seed', 'Seeding', 'Index', 'Indexes', 'Query', 'Queries',
    'Stored Procedure', 'Trigger', 'View', 'Transaction', 'ACID', 'Replication', 'Sharding'
  ],
  devops: [
    'Docker', 'Docker Compose', 'Dockerfile', 'Container', 'Containers', 'Containerization',
    'Kubernetes', 'K8s', 'Helm', 'OpenShift', 'Swarm', 'Minikube', 'Kind',
    'CI/CD', 'Continuous Integration', 'Continuous Deployment', 'Continuous Delivery',
    'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI', 'Azure DevOps', 'Bitbucket Pipelines',
    'Ansible', 'Terraform', 'Puppet', 'Chef', 'SaltStack', 'Packer', 'Vagrant',
    'AWS', 'Amazon Web Services', 'EC2', 'S3', 'Lambda', 'RDS', 'CloudFront', 'ECS', 'EKS',
    'Azure', 'Microsoft Azure', 'App Service', 'Functions', 'Blob Storage', 'AKS',
    'GCP', 'Google Cloud', 'Google Cloud Platform', 'Compute Engine', 'GKE', 'Cloud Run',
    'Vercel', 'Netlify', 'Heroku', 'DigitalOcean', 'Linode', 'OVH', 'Scaleway',
    'Nginx', 'Apache', 'IIS', 'Load Balancer', 'Reverse Proxy', 'HAProxy', 'Traefik',
    'Monitoring', 'Prometheus', 'Grafana', 'ELK Stack', 'Logstash', 'Kibana', 'Datadog',
    'Logging', 'APM', 'New Relic', 'Sentry', 'Splunk', 'CloudWatch'
  ],
  security: [
    'Security', 'Sécurité', 'Cybersecurity', 'OWASP', 'OWASP Top 10', 'Penetration Testing',
    'JWT', 'JSON Web Token', 'OAuth', 'OAuth2', 'OpenID', 'OpenID Connect', 'SAML',
    'SSL', 'TLS', 'HTTPS', 'SSH', 'SFTP', 'FTP', 'Certificate', 'Certificat', 'Let\'s Encrypt',
    'Encryption', 'Chiffrement', 'Hashing', 'Bcrypt', 'Argon2', 'PBKDF2', 'Scrypt',
    'Authentication', 'Authentification', 'Authorization', 'Autorisation', '2FA', 'MFA',
    'RBAC', 'ABAC', 'ACL', 'Firewall', 'WAF', 'DDoS', 'IDS', 'IPS',
    'XSS', 'CSRF', 'SQL Injection', 'Injection SQL', 'CORS', 'CSP', 'Content Security Policy',
    'GDPR', 'RGPD', 'Compliance', 'Audit', 'Vulnerability', 'Vulnérabilité', 'CVE',
    'Penetration Test', 'Ethical Hacking', 'Bug Bounty', 'Security Audit'
  ],
  cms: [
    'WordPress', 'WP', 'WooCommerce', 'Drupal', 'Joomla', 'Magento', 'Magento 2',
    'PrestaShop', 'Shopify', 'BigCommerce', 'Squarespace', 'Wix', 'Webflow',
    'Contentful', 'Strapi', 'Sanity', 'Ghost', 'Medium', 'Substack',
    'Theme', 'Thème', 'Plugin', 'Extension', 'Module', 'Widget', 'Block',
    'ACF', 'Advanced Custom Fields', 'Elementor', 'Divi', 'WPBakery', 'Beaver Builder',
    'Gutenberg', 'Block Editor', 'Custom Post Type', 'Taxonomy', 'WooCommerce',
    'E-commerce', 'Ecommerce', 'Panier', 'Checkout', 'Payment Gateway', 'Stripe', 'PayPal'
  ],
  tools: [
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Version Control', 'VCS', 'SVN', 'Mercurial',
    'VS Code', 'Visual Studio Code', 'Visual Studio', 'IntelliJ', 'WebStorm', 'PhpStorm',
    'PyCharm', 'Eclipse', 'NetBeans', 'Atom', 'Sublime Text', 'Vim', 'Emacs', 'Neovim',
    'Postman', 'Insomnia', 'Swagger UI', 'SoapUI', 'Hoppscotch', 'Thunder Client',
    'Jira', 'Trello', 'Asana', 'Monday', 'ClickUp', 'Notion', 'Linear', 'Shortcut',
    'Slack', 'Discord', 'Teams', 'Zoom', 'Meet', 'Google Meet',
    'Terminal', 'Command Line', 'CLI', 'Bash', 'PowerShell', 'Zsh', 'Fish',
    'Linux', 'Ubuntu', 'Debian', 'CentOS', 'RedHat', 'Fedora', 'Windows Server', 'MacOS',
    'Virtual Machine', 'VM', 'VirtualBox', 'VMware', 'Parallels', 'WSL', 'WSL2'
  ],
  automation: [
    'n8n', 'Zapier', 'Make', 'Integromat', 'Automation', 'Automatisation', 'RPA',
    'Workflow', 'Workflows', 'Integration', 'Intégration', 'API Integration', 'Webhook', 'Webhooks',
    'Trigger', 'Action', 'Bot', 'Chatbot', 'Discord Bot', 'Telegram Bot',
    'Script', 'Scripting', 'Shell Script', 'Python Script', 'Bash Script',
    'Test', 'Testing', 'Unit Test', 'Integration Test', 'E2E', 'End to End', 'Functional Test',
    'Jest', 'Mocha', 'Jasmine', 'Cypress', 'Playwright', 'Selenium', 'Puppeteer', 'TestCafe',
    'PHPUnit', 'PyTest', 'RSpec', 'xUnit', 'NUnit', 'TestNG', 'JUnit', 'MSTest',
    'TDD', 'Test Driven Development', 'BDD', 'Behavior Driven Development', 'Cucumber',
    'Coverage', 'Code Coverage', 'Istanbul', 'SonarQube', 'Mock', 'Stub', 'Fixture', 'Factory'
  ],
  methodologies: [
    'Agile', 'Scrum', 'Kanban', 'Sprint', 'Backlog', 'User Story', 'Story Point', 'Planning Poker',
    'Waterfall', 'Lean', 'DevOps', 'DevSecOps', 'GitOps', 'AIOps', 'DataOps', 'MLOps',
    'Clean Code', 'Code Review', 'Refactoring', 'Technical Debt', 'Best Practices',
    'Documentation', 'README', 'Wiki', 'Confluence', 'Notion', 'GitBook',
    'MVC', 'MVVM', 'MVP', 'Microservices', 'Monolith', 'Serverless', 'Event-Driven',
    'SOLID', 'DRY', 'KISS', 'YAGNI', 'Design Patterns', 'Design Pattern', 'GoF',
    'Architecture', 'System Design', 'Scalability', 'Performance', 'Optimization',
    'SEO', 'Search Engine Optimization', 'SEM', 'SEA', 'Analytics', 'Google Analytics',
    'A/B Testing', 'UX', 'UI', 'User Experience', 'User Interface', 'Responsive', 'Mobile First',
    'PWA', 'Progressive Web App', 'SPA', 'Single Page Application', 'SSR', 'Server Side Rendering',
    'CSR', 'Client Side Rendering', 'SSG', 'Static Site Generation', 'ISR', 'Incremental Static Regeneration'
  ]
};

const softSkillsPatterns: Array<{ skill: string; keywords: string[] }> = [
  { skill: 'Leadership', keywords: ['lead', 'manager', 'encadrer', 'mentor', 'superviser', 'chef', 'responsable', 'team lead', 'tech lead'] },
  { skill: 'Communication', keywords: ['communication', 'présentation', 'client', 'réunion', 'collaboration', 'échange', 'rapport'] },
  { skill: 'Teamwork', keywords: ['équipe', 'collaboration', 'travail en équipe', 'collectif', 'coopération', 'pair programming'] },
  { skill: 'Problem Solving', keywords: ['résolution', 'problème', 'debug', 'troubleshooting', 'analyse', 'solution', 'fix'] },
  { skill: 'Autonomy', keywords: ['autonomie', 'indépendant', 'initiative', 'self-starter', 'proactif', 'autogestion'] },
  { skill: 'Adaptability', keywords: ['adaptabilité', 'flexible', 'évoluer', 'changement', 'nouvelle techno', 'apprentissage'] },
  { skill: 'Time Management', keywords: ['gestion du temps', 'délais', 'deadline', 'priorisation', 'organisation', 'planification'] },
  { skill: 'Critical Thinking', keywords: ['analyse critique', 'réflexion', 'évaluation', 'décision', 'stratégie', 'architecture'] },
  { skill: 'Creativity', keywords: ['créatif', 'innovation', 'nouvelle idée', 'solution originale', 'design thinking'] },
  { skill: 'Attention to Detail', keywords: ['détail', 'précision', 'qualité', 'rigueur', 'test', 'review', 'code quality'] },
  { skill: 'Continuous Learning', keywords: ['veille', 'apprentissage', 'formation', 'certification', 'nouvelle compétence', 'upskilling'] },
  { skill: 'Customer Focus', keywords: ['client', 'utilisateur', 'satisfaction', 'besoin', 'expérience utilisateur', 'UX'] }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function analyzeTechnologyContext(text: string, technology: string): 'production' | 'personal' | 'learning' {
  const lowerText = text.toLowerCase();
  const techLower = technology.toLowerCase();
  
  const productionKeywords = ['production', 'client', 'entreprise', 'projet professionnel', 'mission', 'déployé', 'live', 'utilisé en production', 'environnement de production', 'équipe', 'collaboration', 'agence', 'startup', 'société'];
  const personalKeywords = ['projet personnel', 'portfolio', 'github', 'side project', 'passion', 'expérimentation', 'test personnel', 'à titre personnel', 'open source'];
  const learningKeywords = ['formation', 'apprentissage', 'cours', 'tutorial', 'étude', 'stage', 'découverte', 'initiation', 'notions', 'en cours d\'apprentissage'];
  
  const techIndex = lowerText.indexOf(techLower);
  if (techIndex === -1) return 'production';
  
  const start = Math.max(0, techIndex - 200);
  const end = Math.min(text.length, techIndex + 200);
  const context = text.slice(start, end).toLowerCase();
  
  if (productionKeywords.some(kw => context.includes(kw))) return 'production';
  if (personalKeywords.some(kw => context.includes(kw))) return 'personal';
  if (learningKeywords.some(kw => context.includes(kw))) return 'learning';
  
  return 'production';
}

export function extractTechnologyDuration(text: string, technology: string, experiences: WorkExperience[]): number | undefined {
  const techLower = technology.toLowerCase();
  let totalMonths = 0;
  let found = false;
  
  for (const exp of experiences) {
    const expText = `${exp.title} ${exp.company} ${exp.period} ${exp.responsibilities.join(' ')} ${exp.technologies?.join(' ') || ''}`.toLowerCase();
    
    if (expText.includes(techLower)) {
      found = true;
      const periodMatch = exp.period.match(/([\d]{2})\/([\d]{4})\s*[-–/]\s*([\d]{2})?\/?([\d]{4})?|présent|actuel/i);
      if (periodMatch) {
        const startMonth = parseInt(periodMatch[1] || '1');
        const startYear = parseInt(periodMatch[2] || '0');
        const endYear = periodMatch[4] ? parseInt(periodMatch[4]) : new Date().getFullYear();
        const endMonth = periodMatch[3] ? parseInt(periodMatch[3]) : new Date().getMonth() + 1;
        const months = (endYear - startYear) * 12 + (endMonth - startMonth);
        totalMonths += Math.max(3, months);
      }
    }
  }
  
  if (!found) return undefined;
  return Math.round(totalMonths / 12 * 10) / 10;
}

export function extractLastUsed(text: string, technology: string, experiences: WorkExperience[]): string | undefined {
  const techLower = technology.toLowerCase();
  let latestDate: Date | null = null;
  
  for (const exp of experiences) {
    const expText = `${exp.title} ${exp.company} ${exp.responsibilities.join(' ')} ${exp.technologies?.join(' ') || ''}`.toLowerCase();
    
    if (expText.includes(techLower)) {
      const periodMatch = exp.period.match(/([\d]{2})\/([\d]{4})\s*[-–/]\s*([\d]{2})?\/?([\d]{4})?|présent|actuel/i);
      if (periodMatch) {
        const endYear = periodMatch[4] ? parseInt(periodMatch[4]) : new Date().getFullYear();
        const endMonth = periodMatch[3] ? parseInt(periodMatch[3]) - 1 : new Date().getMonth();
        const endDate = new Date(endYear, endMonth);
        
        if (!latestDate || endDate > latestDate) {
          latestDate = endDate;
        }
      }
    }
  }
  
  return latestDate ? latestDate.toISOString().split('T')[0] : undefined;
}

export function estimateProficiency(text: string, technology: string, experiences: WorkExperience[]): 'débutant' | 'intermédiaire' | 'avancé' | 'expert' {
  const techLower = technology.toLowerCase();
  let score = 0;
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes(`expert en ${techLower}`) || lowerText.includes(`${techLower} expert`) || lowerText.includes('maîtrise avancée') || lowerText.includes('senior')) score += 3;
  if (lowerText.includes(`avancé en ${techLower}`) || lowerText.includes('bonne maîtrise') || lowerText.includes('expérience solide') || lowerText.includes('plusieurs années')) score += 2;
  if (lowerText.includes(`notions de ${techLower}`) || lowerText.includes('bases de') || lowerText.includes('découverte') || lowerText.includes('initiation')) score -= 1;
  
  const years = extractTechnologyDuration(text, technology, experiences) || 0;
  if (years >= 5) score += 2;
  else if (years >= 3) score += 1;
  else if (years < 1) score -= 1;
  
  if (score >= 3) return 'expert';
  if (score >= 1) return 'avancé';
  if (score >= -1) return 'intermédiaire';
  return 'débutant';
}

export function analyzeGaps(cvData: CVData, requiredSkills: string[] = [], preferredSkills: string[] = []): GapAnalysis {
  const gaps: GapAnalysis = { critical: [], recommended: [], bonus: [], partial: [] };
  const cvSkills = new Set<string>();
  
  
if (cvData.technicalSkills) {
  Object.values(cvData.technicalSkills).forEach((arr: string[]) => 
    arr.forEach((s: string) => cvSkills.add(s.toLowerCase()))
  );
}
  cvData.achievements?.forEach(a => a.technologies?.forEach(t => cvSkills.add(t.toLowerCase())));
  cvData.workExperiences?.forEach(e => e.technologies?.forEach(t => cvSkills.add(t.toLowerCase())));
  
  for (const skill of requiredSkills) {
    const skillLower = skill.toLowerCase();
    const found = Array.from(cvSkills).some(s => s === skillLower || s.includes(skillLower) || skillLower.includes(s));
    if (!found) gaps.critical.push(skill);
  }
  
  for (const skill of preferredSkills) {
    const skillLower = skill.toLowerCase();
    const found = Array.from(cvSkills).some(s => s === skillLower || s.includes(skillLower) || skillLower.includes(s));
    if (!found) gaps.recommended.push(skill);
  }
  
  const commonKeywords = [...requiredSkills, ...preferredSkills].map(s => s.toLowerCase());
  for (const skill of cvSkills) {
    const isRequired = commonKeywords.some(k => skill.includes(k) || k.includes(skill));
    if (!isRequired && skill.length > 2 && !['javascript', 'html', 'css', 'git', 'sql'].includes(skill)) {
      gaps.bonus.push(skill);
    }
  }
  
  const partialKeywords = ['notions', 'bases', 'initiation', 'découverte', 'en cours'];
  for (const skill of requiredSkills) {
    const rawText = cvData.rawText || '';
    const context = rawText.toLowerCase();   
     if (context.includes(skill.toLowerCase()) && partialKeywords.some(kw => context.includes(kw))) {
      gaps.partial.push({ skill, reason: 'Mentionné mais niveau débutant/intermédiaire' });
    }
  }
  
  return gaps;
}

export function extractSoftSkills(text: string): SoftSkill[] {
  const softSkills: SoftSkill[] = [];
  const lowerText = text.toLowerCase();
  
  for (const pattern of softSkillsPatterns) {
    const evidence: string[] = [];
    
    for (const keyword of pattern.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        for (const match of matches) {
          const index = lowerText.indexOf(keyword.toLowerCase());
          if (index !== -1) {
            const start = Math.max(0, index - 50);
            const end = Math.min(text.length, index + 100);
            const sentence = text.slice(start, end).replace(/\s+/g, ' ').trim();
            if (sentence.length > 20 && !evidence.includes(sentence)) evidence.push(sentence);
          }
        }
      }
    }
    
    if (evidence.length > 0) {
      let confidence: SoftSkill['confidence'] = evidence.length >= 3 ? 'high' : evidence.length === 1 ? 'low' : 'medium';
      softSkills.push({ name: pattern.skill, evidence, confidence });
    }
  }
  
  return softSkills;
}

export function extractPublicLinks(text: string): PublicLink[] {
  const links: PublicLink[] = [];
  
  const githubMatch = text.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
  if (githubMatch) links.push({ type: 'github', url: `https://github.com/${githubMatch[1]}`, description: 'Profil GitHub' });
  
  const gitlabMatch = text.match(/gitlab\.com\/([a-zA-Z0-9_-]+)/i);
  if (gitlabMatch) links.push({ type: 'gitlab', url: `https://gitlab.com/${gitlabMatch[1]}`, description: 'Profil GitLab' });
  
  const linkedinMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) links.push({ type: 'linkedin', url: `https://linkedin.com/in/${linkedinMatch[1]}`, description: 'Profil LinkedIn' });
  
  const websiteMatch = text.match(/https?:\/\/(?!linkedin|github|gitlab)[^\s\)]+/i);
  if (websiteMatch && !links.some(l => l.url === websiteMatch[0])) {
    links.push({ type: 'portfolio', url: websiteMatch[0], description: 'Portfolio/Site personnel' });
  }
  
  if (text.toLowerCase().includes('blog') && websiteMatch) {
    const blogLink = links.find(l => l.type === 'portfolio');
    if (blogLink) { blogLink.type = 'blog'; blogLink.description = 'Blog technique'; }
  }
  
  return links;
}

export function extractPublicProjects(text: string): PublicProject[] {
  const projects: PublicProject[] = [];
  const projSection = text.split('RÉALISATIONS')?.[1]?.split('LANGUES')?.[0] || text.split('PROJETS')?.[1]?.split('LANGUES')?.[0];
  if (!projSection) return projects;
  
  const lines = projSection.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    if (line.length < 20) continue;
    const nameMatch = line.match(/^[\s•-]*([A-Z][^:]+?):/);
    if (!nameMatch) continue;
    
    const name = nameMatch?.[1]?.trim();
    if (!name) continue;
    const technologies = extractTechnologiesFromText(line);
    const urlMatch = line.match(/https?:\/\/[^\s\)]+/i);
    const isPersonal = line.toLowerCase().includes('personnel') || line.toLowerCase().includes('portfolio') || line.toLowerCase().includes('side project');
    
    projects.push({ name, url: urlMatch?.[0], technologies, description: line.replace(nameMatch[0], '').trim(), isPersonal });
  }
  
  return projects;
}

function extractPersonalInfo(text: string): PersonalInfo {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // ✅ [تصحيح 2] ضمان أن fullName دائماً string
  const firstLine = lines[0];
  const fullName = firstLine 
    ? (firstLine.toUpperCase() === firstLine ? firstLine : firstLine)
    : 'Non spécifié';
    
  const professionalTitle = lines[1]?.toLowerCase().includes('développeur') ? lines[1] : '';
  
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch?.[0] || '';
  
  const phoneMatch = text.match(/(?:\+212|0)[5-6]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/);
  const phone = phoneMatch?.[0]?.replace(/\s/g, '') || '';
  
  const cityMatch = text.match(/(?:Marrakech|Casablanca|Rabat|Fès|Tanger|Agadir|Oujda|Laâyoune)/i);
  const location = cityMatch?.[0] || '';
  
  const linkedinMatch = text.match(/linkedin\.com\/in\/[^\s\)]+/i);
  const linkedin = linkedinMatch?.[0] ? `https://${linkedinMatch[0]}` : undefined;
  
  const websiteMatch = text.match(/https?:\/\/(?!linkedin)[^\s\)]+/i);
  const website = websiteMatch?.[0] || undefined;
  
  const summaryMatch = text.match(/Développeur[^\n]{0,300}/i);
  const summary = summaryMatch?.[0]?.replace(/Développeur/, 'Développeur')?.trim() || '';
  
  return { fullName, email, phone, location, linkedin, website, professionalTitle, summary };
}

function extractWorkExperiences(text: string): WorkExperience[] {
  const experiences: WorkExperience[] = [];
  const expSection = text.split('EXPÉRIENCES PROFESSIONNELLES')?.[1]?.split('FORMATION')?.[0];
  if (!expSection) return experiences;
  
  const expBlocks = expSection.split(/(?=Développeur|Ingénieur|Chef de projet|Stage|Alternance|Freelance)/i);
  
  for (const block of expBlocks) {
    if (!block.trim() || block.trim().length < 20) continue;
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    
    // ✅ [تصحيح 3-5] إضافة fallbacks لجميع القيم
    const titleCompanyMatch = lines[0]?.match(/^(.+?)\s+(?:chez\s+)?([A-Z][A-Z\s&.-]{3,})$/);
    const title = titleCompanyMatch?.[1]?.trim() || 
                  lines[0]?.split('chez')?.[0]?.trim() || 
                  lines[0] || 
                  'Non spécifié';
                  
    const company = titleCompanyMatch?.[2]?.trim() || 
                    lines[0]?.split('chez')?.[1]?.trim() || 
                    'Non spécifié';

    const periodLocationMatch = lines[1]?.match(/([\d/]{7,9})\s*[-–/]\s*([\d/]{4,9}|présent|actuel)?\s*,?\s*([A-Za-zÀ-ÿ\s]+)?/);
    const period = periodLocationMatch?.[0]?.trim() || lines[1] || '';
    const location = periodLocationMatch?.[3]?.trim() || '';
    
    const responsibilities = lines.slice(2)
      .filter(l => l.length > 5 && !l.match(/^[\d/]/))
      .map(l => l.replace(/^[\s•-]+/, '').trim())
      .filter(Boolean);
    
    const technologies = extractTechnologiesFromText(block);
    const achievementDescs = extractAchievementsFromText(block).map(a => a.description);
    
    experiences.push({
      title,
      company,
      period,
      location,
      responsibilities,
      technologies,
      achievementDescriptions: achievementDescs
    });
  }
  
  return experiences;
}

function extractEducation(text: string): Education[] {
  const education: Education[] = [];
  const eduSection = text.split('FORMATION')?.[1]?.split('COMPÉTENCES')?.[0];
  if (!eduSection) return education;
  
  const lines = eduSection.split('\n').map(l => l.trim()).filter(Boolean);
  let currentEdu: Partial<Education> = {};
  
  for (const line of lines) {
    if (line.match(/[\d/]{7,9}/)) {
      if (currentEdu.degree) {
        education.push(currentEdu as Education);
        currentEdu = {};
      }
      currentEdu.period = line.match(/[\d/]{7,9}/)?.[0] || '';
      currentEdu.location = line.match(/[A-Za-zÀ-ÿ]+/)?.[0] || '';
    } else if (line.length > 10 && !currentEdu.school) {
      currentEdu.school = line;
    } else if (!currentEdu.degree) {
      currentEdu.degree = line;
    }
  }
  
  if (currentEdu.degree) {
    education.push(currentEdu as Education);
  }
  
  return education;
}

function extractTechnologiesFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];
  
  for (const [category, keywords] of Object.entries(techKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase()) && !found.includes(keyword)) {
        found.push(keyword);
      }
    }
  }
  
  return found;
}

function extractTechnicalSkills(text: string): TechnicalSkills {
  const skills: TechnicalSkills = {
    frontend: [], backend: [], databases: [], devops: [], security: [],
    cms: [], tools: [], automation: [], methodologies: [], testing: []
  };
  
  const lowerText = text.toLowerCase();
  const skillsSection = text.split('COMPÉTENCES')?.[1]?.split('RÉALISATIONS')?.[0] || text;
  
  for (const [category, keywords] of Object.entries(techKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        if (category === 'frontend') skills.frontend.push(keyword);
        else if (category === 'backend') skills.backend.push(keyword);
        else if (category === 'databases') skills.databases.push(keyword);
        else if (category === 'devops') skills.devops.push(keyword);
        else if (category === 'security') skills.security.push(keyword);
        else if (category === 'cms') skills.cms.push(keyword);
        else if (category === 'tools') skills.tools.push(keyword);
        else if (category === 'automation') skills.automation.push(keyword);
        else if (category === 'methodologies') skills.methodologies.push(keyword);
        else if (category === 'testing') skills.testing.push(keyword);
      }
    }
  }
  
  return skills;
}

function extractAchievementsFromText(text: string): Achievement[] {
  const achievements: Achievement[] = [];
  
  const metricPatterns = [
    { regex: /(\d+\+?)\s*(?:produits|products|articles|pages)/i, type: 'products' as const },
    { regex: /(\d+\+?)\s*(?:leads|clients|utilisateurs|users)/i, type: 'leads' as const },
    { regex: /(\d+)\s*→\s*(\d+\+?)/i, type: 'performance' as const },
    { regex: /(\d+)%\s*(?:réduction|reduction|amélioration|improvement)/i, type: 'reduction' as const },
    { regex: /(\d+)\s*(?:secondes|seconds|ms|milliseconds)/i, type: 'time' as const },
  ];
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    if (line.length < 10) continue;
    
    let metric = undefined;
    for (const pattern of metricPatterns) {
      const match = line.match(pattern.regex);
      if (match) { metric = { value: match[0], type: pattern.type }; break; }
    }
    
    let category: Achievement['category'] = 'development';
    if (line.toLowerCase().includes('automat') || line.toLowerCase().includes('n8n') || line.toLowerCase().includes('workflow')) category = 'automation';
    else if (line.toLowerCase().includes('optimis') || line.toLowerCase().includes('performance') || line.toLowerCase().includes('core web') || line.toLowerCase().includes('pagespeed')) category = 'optimization';
    else if (line.toLowerCase().includes('base de donnée') || line.toLowerCase().includes('backup') || line.toLowerCase().includes('requête') || line.toLowerCase().includes('sql')) category = 'database';
    else if (line.toLowerCase().includes('sécuris') || line.toLowerCase().includes('ssl') || line.toLowerCase().includes('chiffr') || line.toLowerCase().includes('jwt') || line.toLowerCase().includes('oauth')) category = 'security';
    else if (line.toLowerCase().includes('e-commerce') || line.toLowerCase().includes('woocommerce') || line.toLowerCase().includes('produit')) category = 'ecommerce';
    
    const technologies = extractTechnologiesFromText(line);
    
    achievements.push({
      category,
      description: line.replace(/^[\s•-]+/, '').trim(),
      metrics: metric,
      technologies: technologies.length > 0 ? technologies : undefined
    });
  }
  
  return achievements;
}

function extractAchievements(text: string): Achievement[] {
  const realSection = text.split('RÉALISATIONS')?.[1]?.split('LANGUES')?.[0];
  if (!realSection) return [];
  return extractAchievementsFromText(realSection);
}

function extractLanguages(text: string): Language[] {
  const languages: Language[] = [];
  const langSection = text.split('LANGUES')?.[1]?.split('CENTRES')?.[0];
  if (!langSection) return languages;
  
  const langPatterns = [
    { name: 'Arabe', nameAr: 'العربية', levels: ['courant', 'natif'] },
    { name: 'Français', nameAr: 'الفرنسية', levels: ['débutant', 'fonctionnel', 'intermédiaire', 'courant'] },
    { name: 'Anglais', nameAr: 'الإنجليزية', levels: ['débutant', 'fonctionnel', 'intermédiaire', 'courant'] },
    { name: 'Espagnol', nameAr: 'الإسبانية', levels: ['débutant', 'fonctionnel', 'intermédiaire', 'courant'] }
  ];
  
  for (const lang of langPatterns) {
    const lowerSection = langSection.toLowerCase();
    if (lowerSection.includes(lang.name.toLowerCase()) || lowerSection.includes(lang.nameAr)) {
      let level: Language['level'] = 'fonctionnel';
      if (lowerSection.includes('courant') || lowerSection.includes('natif')) level = 'courant';
      else if (lowerSection.includes('fonctionnel')) level = 'fonctionnel';
      else if (lowerSection.includes('intermédiaire')) level = 'intermédiaire';
      else if (lowerSection.includes('débutant') || lowerSection.includes('notions')) level = 'débutant';
      
      const detailsMatch = langSection.match(new RegExp(`${lang.name}[^\n]{0,50}`, 'i'));
      const details = detailsMatch?.[0]?.replace(lang.name, '').trim() || undefined;
      
      languages.push({ language: lang.name, level, details });
    }
  }
  
  return languages;
}

function extractInterests(text: string): string[] {
  const interests: string[] = [];
  const interestSection = text.split("CENTRES D'INTÉRÊT")?.[1] || text.split('INTÉRÊTS')?.[1] || '';
  if (!interestSection) return interests;
  
  const commonInterests = ['Échecs', 'Chess', 'Lecture', 'Reading', 'Veille Technologique', 'Tech', 'Sport', 'Football', 'Basketball', 'Voyage', 'Travel', 'Musique', 'Music', 'Photographie', 'Photography', 'Cinéma', 'Cinema', 'Jeux vidéo', 'Gaming', 'Open Source', 'Contributions', 'Blogging', 'Writing', 'Mentoring'];
  const lowerSection = interestSection.toLowerCase();
  
  for (const interest of commonInterests) {
    if (lowerSection.includes(interest.toLowerCase())) interests.push(interest);
  }
  
  return interests;
}

function extractProjects(text: string): Project[] {
  const projects: Project[] = [];
  const projSection = text.split('PROJETS')?.[1]?.split('LANGUES')?.[0] || text.split('RÉALISATIONS')?.[1]?.split('LANGUES')?.[0];
  if (!projSection) return projects;
  
  const lines = projSection.split('\n').map(l => l.trim()).filter(Boolean);
  let currentProject: Partial<Project> = {};
  
  for (const line of lines) {
    if (line.match(/^[\s•-]*[A-Z][a-z]+.*:/) || line.match(/^[\s•-]*Site/)) {
      if (currentProject.name) projects.push(currentProject as Project);
      currentProject = { name: line.replace(/^[\s•-]+/, '').replace(/:$/, '').trim(), technologies: extractTechnologiesFromText(line) };
    } else if (currentProject.name && line.length > 10) {
      currentProject.description = (currentProject.description || '') + ' ' + line;
      const techs = extractTechnologiesFromText(line);
      currentProject.technologies = [...(currentProject.technologies || []), ...techs];
    }
  }
  
  if (currentProject.name) projects.push(currentProject as Project);
  return projects;
}

function extractCertifications(text: string): Certification[] {
  const certifications: Certification[] = [];
  const certSection = text.split('CERTIFICATIONS')?.[1]?.split('LANGUES')?.[0] || text.split('CERTIFICATS')?.[1]?.split('LANGUES')?.[0];
  if (!certSection) return certifications;
  
  const lines = certSection.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    if (line.length > 5) {
      const certMatch = line.match(/(.+?)(?:\s*[-–|]\s*(\d{4}))?/);
      certifications.push({ name: certMatch?.[1]?.trim() || line, date: certMatch?.[2] || undefined });
    }
  }
  
  return certifications;
}

function calculateExpertiseLevel(skills: TechnicalSkills, experiences: WorkExperience[]): string {
  let score = 0;
  const totalTechs = Object.values(skills).reduce((acc: number, arr: string[]) => acc + arr.length, 0);
  score += Math.min(totalTechs * 2, 40);
  
  const categoriesWithSkills = Object.values(skills).filter(arr => arr.length > 0).length;
  score += Math.min(categoriesWithSkills * 5, 30);
  
  const yearsExp = experiences.length;
  score += Math.min(yearsExp * 10, 30);
  
  if (score >= 80) return 'Expert (80-100)';
  if (score >= 60) return 'Senior (60-79)';
  if (score >= 40) return 'Mid-Level (40-59)';
  if (score >= 20) return 'Junior (20-39)';
  return 'Débutant (0-19)';
}

function calculateTotalYearsExperience(experiences: WorkExperience[]): number {
  let totalMonths = 0;
  for (const exp of experiences) {
    const periodMatch = exp.period.match(/([\d]{2})\/([\d]{4})\s*[-–/]\s*([\d]{2})?\/?([\d]{4})?|présent|actuel/i);
    if (periodMatch) {
      const startYear = parseInt(periodMatch[2] || '0');
      const endYear = parseInt(periodMatch[4] || new Date().getFullYear().toString());
      const months = (endYear - startYear) * 12;
      totalMonths += Math.max(6, months);
    }
  }
  return Math.round(totalMonths / 12);
}

export function extractTechnologiesWithExperience(text: string, skills: TechnicalSkills, experiences: WorkExperience[]): TechnologyWithExperience[] {
  const techsWithExp: TechnologyWithExperience[] = [];
  
  for (const [category, keywords] of Object.entries(skills)) {
    for (const tech of keywords) {
      const context = analyzeTechnologyContext(text, tech);
      const yearsOfUse = extractTechnologyDuration(text, tech, experiences);
      const lastUsed = extractLastUsed(text, tech, experiences);
      const proficiency = estimateProficiency(text, tech, experiences);
      
      const projects: string[] = [];
      for (const exp of experiences) {
        if (exp.technologies?.includes(tech)) projects.push(`${exp.title} chez ${exp.company}`);
      }
      
      techsWithExp.push({ name: tech, category, context, yearsOfUse, lastUsed, projects: projects.length > 0 ? projects : undefined, proficiency });
    }
  }
  
  return techsWithExp;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function extractCVDataFromPDF(filePath: string): Promise<CVData> {
  // ✅ [تصحيح] استخدام pdf-parse v2.x API
  const pdfBuffer = await fs.readFile(filePath);
  const pdfParser = new PDFParse({ data: pdfBuffer });
  const pdfData = await pdfParser.getText();
  const rawText = pdfData.text;
  
  const personalInfo = extractPersonalInfo(rawText);
  const workExperiences = extractWorkExperiences(rawText);
  const education = extractEducation(rawText);
  const technicalSkills = extractTechnicalSkills(rawText);
  const achievements = extractAchievements(rawText);
  const projects = extractProjects(rawText);
  const certifications = extractCertifications(rawText);
  const languages = extractLanguages(rawText);
  const interests = extractInterests(rawText);
  
  const technologiesWithExperience = extractTechnologiesWithExperience(rawText, technicalSkills, workExperiences);
  const softSkills = extractSoftSkills(rawText);
  const publicLinks = extractPublicLinks(rawText);
  const publicProjects = extractPublicProjects(rawText);
  
  const totalYearsExperience = calculateTotalYearsExperience(workExperiences);
  const expertiseLevel = calculateExpertiseLevel(technicalSkills, workExperiences);
  const technologiesCount = Object.values(technicalSkills).reduce((acc: number, arr: string[]) => acc + arr.length, 0);
  
  return {
    personalInfo, workExperiences, education, technicalSkills, achievements, projects, certifications, languages, interests, rawText,
    technologiesWithExperience, softSkills, publicLinks, publicProjects,
    metadata: { extractionDate: new Date().toISOString(), totalYearsExperience, expertiseLevel, technologiesCount }
  };
}

export async function extractCVDataFromText(text: string): Promise<Partial<CVData>> {
  const personalInfo = extractPersonalInfo(text);
  const workExperiences = extractWorkExperiences(text);
  const technicalSkills = extractTechnicalSkills(text);
  
  return {
    personalInfo, workExperiences, education: extractEducation(text), technicalSkills,
    achievements: extractAchievements(text), projects: extractProjects(text), certifications: extractCertifications(text),
    languages: extractLanguages(text), interests: extractInterests(text), rawText: text,
    technologiesWithExperience: extractTechnologiesWithExperience(text, technicalSkills, workExperiences),
    softSkills: extractSoftSkills(text), publicLinks: extractPublicLinks(text), publicProjects: extractPublicProjects(text),
    metadata: {
      extractionDate: new Date().toISOString(),
      totalYearsExperience: calculateTotalYearsExperience(workExperiences),
      expertiseLevel: calculateExpertiseLevel(technicalSkills, workExperiences),
      technologiesCount: Object.values(technicalSkills).reduce((acc: number, arr: string[]) => acc + arr.length, 0)
    }
  };
}

export function analyzeCVAgainstJobOffer(cvData: CVData, requiredSkills: string[], preferredSkills: string[] = []): GapAnalysis {
  return analyzeGaps(cvData, requiredSkills, preferredSkills);
}

export default {
  extractCVDataFromPDF, extractCVDataFromText, analyzeCVAgainstJobOffer,
  analyzeTechnologyContext, extractTechnologyDuration, extractLastUsed, estimateProficiency,
  analyzeGaps, extractSoftSkills, extractPublicLinks, extractPublicProjects, extractTechnologiesWithExperience
};