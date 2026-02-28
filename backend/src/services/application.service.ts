import prisma from "../lib/prisma";
import { storageService } from "./storage.service";
import { candidateRepository } from "../repositories/candidate.repository";
import { applicationRepository } from "../repositories/application.repository";
import { jobOfferRepository } from "../repositories/jobOffer.repository";

export interface ApplyInput {
  fullName: string;
  email: string;
  phone?: string;
}

export const applicationService = {
  async applyToJob(jobOfferId: string, data: ApplyInput, cvFile: Express.Multer.File) {
    // 1. Verify Job Offer exists
    const jobOffer = await jobOfferRepository.findById(jobOfferId);
    if (!jobOffer) {
      throw new Error("Job offer not found");
    }

    // 2. Check for Candidate (create or reuse)
    let candidate = await candidateRepository.findByEmail(data.email);
    
    // 3. Prevent duplicate application
    if (candidate) {
      const existingApplication = await applicationRepository.findByCandidateAndJob(candidate.id, jobOfferId);
      if (existingApplication) {
        throw new Error("You have already applied for this job");
      }
    }

    // 4. Upload CV to Supabase
    const cvUrl = await storageService.uploadCV(cvFile, data.email);

    // 5. Execute Transaction
    return prisma.$transaction(async (tx) => {
      // Create or update candidate
      if (!candidate) {
        candidate = await tx.candidate.create({
          data: {
            email: data.email,
            fullName: data.fullName,
            phone: data.phone || null,
            cv: cvUrl,
          },
        });
      } else {
        // Update candidate info/CV if they already exist
        candidate = await tx.candidate.update({
          where: { id: candidate.id },
          data: {
            fullName: data.fullName,
            phone: data.phone || candidate.phone,
            cv: cvUrl,
          },
        });
      }

      // Create Application
      const application = await tx.application.create({
        data: {
          candidateId: candidate.id,
          jobOfferId: jobOfferId,
          status: "APPLIED",
        },
      });

      // Create Document
      await tx.document.create({
        data: {
          fileName: cvFile.originalname,
          fileUrl: cvUrl,
          docType: "CV",
          applicationId: application.id,
        },
      });

      return application;
    });
  },

  async getJobApplications(jobOfferId: string, organisationId: string) {
    // 1. Verify Job belongs to the RH's organisation
    const jobOffer = await jobOfferRepository.findById(jobOfferId, organisationId);
    if (!jobOffer) {
      throw new Error("Job offer not found or access denied");
    }

    // 2. Fetch applications
    return applicationRepository.findByJobOfferId(jobOfferId);
  },

  async updateStatus(id: string, status: string, organisationId: string) {
    // 1. Verify Application exists and belongs to the RH's organisation
    const application = await applicationRepository.findById(id);
    if (!application) {
      throw new Error("Application not found");
    }

    if (application.jobOffer.organisationId !== organisationId) {
      throw new Error("Access denied: Application belongs to another organisation");
    }

    // 2. Update status
    return applicationRepository.updateStatus(id, status);
  },

  async deleteApplication(id: string, organisationId: string) {
    // 1. Find application and verify ownership
    const application = await applicationRepository.findById(id);
    if (!application) {
      throw new Error("Application not found");
    }

    if (application.jobOffer.organisationId !== organisationId) {
      throw new Error("Access denied: Application belongs to another organisation");
    }

    // 2. Clear CV from Supabase if exists
    const cvDocument = application.documents.find((doc: any) => doc.docType === "CV");
    if (cvDocument) {
      await storageService.deleteFileFromStorage(cvDocument.fileUrl);
    }

    // 3. Delete from DB (Transactional)
    return prisma.$transaction(async (tx) => {
      // Delete document records
      await tx.document.deleteMany({
        where: { applicationId: id },
      });

      // Delete application record
      return tx.application.delete({
        where: { id },
      });
    });
  },
};
