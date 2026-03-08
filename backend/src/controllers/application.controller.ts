// /home/manal/projet_final_BPMS/backend/src/controllers/application.controller.ts
import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { applicationService } from "../services/application.service";
import { z } from "zod";

console.log('💥💥💥 [SUPER TEST] FILE LOADED at:', new Date().toISOString());

const applySchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

export const applicationController = {
  applyToJob: catchAsync(async (req: Request, res: Response) => {
    const { jobOfferId } = req.params;

    // 1. Validate Input
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    // 2. Check for CV file
    if (!req.file) {
      res.status(400).json({ error: "CV file is required (PDF format only)" });
      return;
    }

    // 3. Call Service
    const application = await applicationService.applyToJob(
      jobOfferId as string,
      {
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      },
      req.file
    );

    console.log('🚨 [SYNC TEST] Starting analysis for application:', application.id);
    
    try {
      // ============================================================================
      // STEP 1: استخراج البيانات من الـ CV
      // ============================================================================
      const { extractCVDataFromPDF } = await import('../lib/cvExtractor');
      const cvData = await extractCVDataFromPDF(req.file.path);

      console.log('🧠 [AI Debug] CV data extracted:', {
        name: cvData.personalInfo?.fullName,
        email: cvData.personalInfo?.email,
        skillsCount: Object.values(cvData.technicalSkills).reduce((a: any, arr: any) => a + arr.length, 0),
        achievements: cvData.achievements?.length
      });

      // ============================================================================
      // 🔹 CV DATA LOGGING (مختصر للتشخيص)
      // ============================================================================
      console.log('\n' + '='.repeat(80));
      console.log('🎯 CANDIDATE: ' + (cvData.personalInfo?.fullName || 'N/A'));
      console.log('🛠️ Skills: ' + Object.values(cvData.technicalSkills).reduce((a: any, arr: any) => a + arr.length, 0) + ' total');
      console.log('🏆 Achievements: ' + (cvData.achievements?.length || 0) + ' with metrics');
      console.log('⏱️ Experience: ' + (cvData.metadata?.totalYearsExperience || 0) + ' years');
      console.log('🎓 Level: ' + (cvData.metadata?.expertiseLevel || 'N/A'));
      console.log('='.repeat(80) + '\n');

      // ============================================================================
      // STEP 2: جلب معلومات الوظيفة
      // ============================================================================
      const { jobOfferService } = await import('../services/jobOffer.service');
      const jobOffer: any = await jobOfferService.getOfferById(jobOfferId as string);
      if (!jobOffer) throw new Error('Job offer not found');
      
      // ============================================================================
      // STEP 3: 🔧 ADVANCED SCORING - نظام تسجيل متقدم يستخدم جميع المتغيرات
      // ============================================================================
      
      // تعريف الأوزان
      interface ScoringWeights {
        skillMatch: number;
        proficiency: number;
        experience: number;
        achievements: number;
        softSkills: number;
        bonusSkills: number;
        education: number;
        context: number;
      }

      const weights: ScoringWeights = {
        skillMatch: 30, proficiency: 15, experience: 15, achievements: 15,
        softSkills: 10, bonusSkills: 5, education: 5, context: 5
      };

      // 1. حساب درجة تطابق المهارات الأساسية
      const candidateSkills = new Set<string>();
      if (cvData.technicalSkills) {
        Object.values(cvData.technicalSkills).forEach((arr: string[]) => 
          arr.forEach((s: string) => candidateSkills.add(s.toLowerCase()))
        );
      }

      const requiredSkills: string[] = Array.isArray(jobOffer?.skills) ? jobOffer.skills : [];
      const matched = requiredSkills.filter((skill: string) => 
        candidateSkills.has(skill.toLowerCase())
      );
      const missing = requiredSkills.filter((skill: string) => 
        !candidateSkills.has(skill.toLowerCase())
      );

      const skillMatchScore = requiredSkills.length > 0 
        ? (matched.length / requiredSkills.length) * 100 
        : 0;

      // 2. حساب درجة مستوى الإتقان
      let proficiencyScore = 0;
      let proficiencyCount = 0;
      if (cvData.technologiesWithExperience) {
        cvData.technologiesWithExperience.forEach(tech => {
          if (requiredSkills.some((rs: string) => rs.toLowerCase() === tech.name.toLowerCase())) {
            const proficiencyPoints: Record<string, number> = {
              'expert': 100, 'avancé': 80, 'intermédiaire': 60, 'débutant': 40
            };
            const proficiencyKey = tech.proficiency || 'débutant';
            const points = proficiencyPoints[proficiencyKey] ?? 40;
            proficiencyScore += points;
            proficiencyCount++;
          }
        });
      }
      proficiencyScore = proficiencyCount > 0 ? proficiencyScore / proficiencyCount : 50;

      // 3. حساب درجة سنوات الخبرة
      const candidateYears = cvData.metadata?.totalYearsExperience || 0;
      const requiredYears = 5;
      const experienceScore = Math.min(100, (candidateYears / requiredYears) * 100);

      // 4. حساب درجة الإنجازات مع المقاييس
      let achievementScore = 0;
      if (cvData.achievements && cvData.achievements.length > 0) {
        const achievementsWithMetrics = cvData.achievements.filter(a => a.metrics);
        achievementScore = Math.min(100, achievementsWithMetrics.length * 20);
      }

      // 5. حساب درجة المهارات الشخصية
      let softSkillScore = 0;
      if (cvData.softSkills && cvData.softSkills.length > 0) {
        const highConfidence = cvData.softSkills.filter(ss => ss.confidence === 'high').length;
        const mediumConfidence = cvData.softSkills.filter(ss => ss.confidence === 'medium').length;
        softSkillScore = Math.min(100, (highConfidence * 15) + (mediumConfidence * 8));
      }

      // 6. حساب درجة المهارات الإضافية
      let bonusSkillScore = 0;
      if (cvData.technologiesWithExperience) {
        const bonusList = ['AWS', 'Azure', 'Kubernetes', 'Terraform', 'GraphQL', 'Microservices', 'n8n'];
        const bonusSkills = cvData.technologiesWithExperience.filter(tech => 
          !requiredSkills.some((rs: string) => rs.toLowerCase() === tech.name.toLowerCase()) &&
          bonusList.includes(tech.name)
        );
        bonusSkillScore = Math.min(100, bonusSkills.length * 25);
      }

      // 7. حساب درجة التعليم
      let educationScore = 50;
      if (cvData.education && cvData.education.length > 0) {
        const firstEducation = cvData.education[0];
        if (firstEducation?.degree) {
          const highestDegree = firstEducation.degree.toLowerCase();
          if (highestDegree.includes('master') || highestDegree.includes('ingénieur')) educationScore = 100;
          else if (highestDegree.includes('licence') || highestDegree.includes('bachelor')) educationScore = 80;
          else if (highestDegree.includes('dts') || highestDegree.includes('technicien')) educationScore = 60;
        }
      }

      // 8. حساب درجة سياق الاستخدام
      let contextScore = 0;
      let contextCount = 0;
      if (cvData.technologiesWithExperience) {
        cvData.technologiesWithExperience.forEach(tech => {
          if (requiredSkills.some((rs: string) => rs.toLowerCase() === tech.name.toLowerCase())) {
            const contextPointsMap: Record<string, number> = {
              'production': 100, 'personal': 70, 'learning': 40
            };
            const contextKey = tech.context || 'learning';
            const contextPointsValue = contextPointsMap[contextKey] ?? 40;
            contextScore += contextPointsValue;
            contextCount++;
          }
        });
      }
      contextScore = contextCount > 0 ? contextScore / contextCount : 50;

      // 9. الحساب النهائي المرجح
      const finalScore = 
        (skillMatchScore * weights.skillMatch) +
        (proficiencyScore * weights.proficiency) +
        (experienceScore * weights.experience) +
        (achievementScore * weights.achievements) +
        (softSkillScore * weights.softSkills) +
        (bonusSkillScore * weights.bonusSkills) +
        (educationScore * weights.education) +
        (contextScore * weights.context);

      const advancedCalculatedScore = Math.round(finalScore * 100) / 100;

      // عرض تفاصيل الحساب
      console.log('\n🧮 ===== ADVANCED SCORING BREAKDOWN =====');
      console.log(`📊 Skill Match (${weights.skillMatch}%): ${skillMatchScore.toFixed(2)}`);
      console.log(`🎯 Proficiency (${weights.proficiency}%): ${proficiencyScore.toFixed(2)}`);
      console.log(`⏱️ Experience (${weights.experience}%): ${experienceScore.toFixed(2)}`);
      console.log(`🏆 Achievements (${weights.achievements}%): ${achievementScore.toFixed(2)}`);
      console.log(`🤝 Soft Skills (${weights.softSkills}%): ${softSkillScore.toFixed(2)}`);
      console.log(`🎁 Bonus Skills (${weights.bonusSkills}%): ${bonusSkillScore.toFixed(2)}`);
      console.log(`🎓 Education (${weights.education}%): ${educationScore.toFixed(2)}`);
      console.log(`🎯 Context (${weights.context}%): ${contextScore.toFixed(2)}`);
      console.log(`\n✨ FINAL SCORE: ${advancedCalculatedScore.toFixed(2)}%`);
      console.log('🧮 ===== END ADVANCED SCORING =====\n');

      const preciseScore = advancedCalculatedScore;

      // ============================================================================
      // STEP 4: استدعاء الـ AI (للنصوص التحليلية فقط)
      // ============================================================================
      const { createAnalysisPrompt } = await import('../lib/prompts');
      const { generateContent } = await import('../lib/groq');
      
      const prompt = createAnalysisPrompt(cvData, {
        title: jobOffer?.title || '',
        requiredSkills: requiredSkills,
      });

      console.log('🔍 [DIAGNOSTIC] Prompt preview (first 500 chars):');
      console.log(prompt.substring(0, 500) + '...');
      
      const analysisText = await generateContent(prompt);
      const cleanText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiAnalysis = JSON.parse(cleanText.match(/\{[\s\S]*\}/)?.[0] || cleanText);
      
      console.log('✅ [SYNC TEST] AI analysis parsed:', {
        hasSkillAnalysis: !!aiAnalysis.skillAnalysis,
        aiOverallScore: aiAnalysis.overallScore
      });

      // ============================================================================
      // STEP 5: الحفظ في قاعدة البيانات
      // ============================================================================
      const { prisma } = await import('../lib/prisma');
      
      await prisma.aIAnalysis.deleteMany({
        where: { applicationId: application.id }
      });
      
      const saved = await prisma.aIAnalysis.create({
        data: {
          type: 'CANDIDATE_ANALYSIS',
          candidateId: application.candidateId,
          jobOfferId: jobOfferId as string,
          applicationId: application.id,
          overallScore: preciseScore,  // ← النسبة من النظام المتقدم (ديناميكية!)
          matchedSkills: matched,
          missingSkills: missing,
          strengths: aiAnalysis.strengths || [],
          weaknesses: aiAnalysis.weaknesses || [],
          recommendation: aiAnalysis.recommendation?.decision,
          priority: aiAnalysis.recommendation?.priority,
          interviewQuestions: aiAnalysis.recommendation?.interviewQuestions || [],
          result: aiAnalysis,
          confidence: preciseScore / 100,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('💾 [SYNC TEST] Analysis SAVED with score:', saved.overallScore);
      
    } catch (error) {
      console.error('❌ [SYNC TEST] Analysis FAILED:', error);
    }

    return res.status(201).json({
      message: "Application submitted successfully",
      data: application,
    });
  }),

  getApplicationsByJob: catchAsync(async (req: any, res: Response) => {
    const { jobOfferId } = req.params;
    const { organisationId } = req.user!;
    const applications = await applicationService.getJobApplications(jobOfferId as string, organisationId);
    res.status(200).json({ data: applications });
  }),

  updateStatus: catchAsync(async (req: any, res: Response) => {
    const { id } = req.params;
    const { organisationId } = req.user!;
    const statusSchema = z.object({ status: z.enum(["INTERVIEW", "ACCEPTED", "REJECTED", "CONTACTED"]) });
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const application = await applicationService.updateStatus(id as string, parsed.data.status, organisationId);
    res.status(200).json({ message: "Application status updated successfully", data: application });
  }),

  deleteApplication: catchAsync(async (req: any, res: Response) => {
    const { id } = req.params;
    const { organisationId } = req.user!;
    await applicationService.deleteApplication(id as string, organisationId);
    res.status(200).json({ message: "Application deleted successfully" });
  }),
};