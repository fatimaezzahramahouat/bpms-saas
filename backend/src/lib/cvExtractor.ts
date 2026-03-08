// backend/src/lib/cvExtractor.ts
import { generateContent } from './groq';
const pdfParse = require('pdf-parse');

/**
 * Extract structured data from CV text using AI
 */
export async function extractCVDataFromText(cvText: string): Promise<{
  fullName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  skills: string[];
  experience: string;
  education: string;
  rawText: string;
}> {
  try {
    console.log('🤖 Extracting CV data using AI...');
    
    const prompt = `
You are an expert CV parser. Extract structured information from the following CV/resume text.

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:

{
  "fullName": "John Doe",
  "email": "john@example.com", 
  "phone": "+1 234 567 8900",
  "skills": ["React", "Node.js", "TypeScript", "Python"],
  "experience": "3 ans d'expérience en développement web...",
  "education": "Master en Informatique..."
}

CV TEXT TO PARSE:
${cvText.substring(0, 5000)}

IMPORTANT:
- Extract skills as an array of strings
- Experience and education should be concise summaries (max 500 chars each)
- If a field is not found, use null
- Return valid JSON only
`;

    const response = await generateContent(prompt);
    
    // Parse the JSON response
    const cleanText = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : cleanText;
    
    const parsed = JSON.parse(jsonString);
    
    console.log('✅ CV data extracted successfully');
    
    return {
      fullName: parsed.fullName || undefined,
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      skills: parsed.skills || [],
      experience: parsed.experience || '',
      education: parsed.education || '',
      rawText: cvText
    };
    
  } catch (error) {
    console.error('❌ CV extraction error:', error);
    
    // Fallback: return basic parsed data using regex
    return parseCVTextFallback(cvText);
  }
}

/**
 * Simple fallback CV parser using regex (when AI fails)
 */
function parseCVTextFallback(cvText: string): {
  fullName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  skills: string[];
  experience: string;
  education: string;
  rawText: string;
} {
  const text = cvText.trim();
  
  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : undefined;
  
  // Extract phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;
  
  // Extract common tech skills
  const commonTechSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Next.js', 'Nuxt',
    'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git',
    'REST', 'GraphQL', 'API', 'Microservices', 'Agile', 'Scrum', 'TDD'
  ];
  
  const skills = commonTechSkills.filter(skill => 
    new RegExp(skill, 'i').test(text)
  );
  
  // Try to extract name from first non-empty line
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const firstLine = lines[0]?.trim() || '';
  const fullName = firstLine.length < 50 ? firstLine : undefined;
  
  return {
    fullName: fullName || undefined,
    email: email || undefined,
    phone: phone || undefined,
    skills,
    experience: '',
    education: '',
    rawText: text
  };
}

/**
 * Extract raw text from a PDF file buffer
 */
export async function extractTextFromPDFFile(filePath: string): Promise<string> {
  try {
    const fs = await import('fs/promises');
    
    
    const dataBuffer = await fs.readFile(filePath);
    
    
    const data = await pdfParse(dataBuffer);
    
    return data.text;
  } catch (error) {
    console.error('❌ Failed to extract text from PDF:', (error as Error).message);
    throw new Error('Failed to parse PDF file');
  }
}

export default {
  extractCVDataFromText
};
