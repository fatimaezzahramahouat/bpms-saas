import { jobOfferRepository } from "../repositories/jobOffer.repository";
import { candidateRepository } from "../repositories/candidate.repository";
import { CreateJobOfferInput, UpdateJobOfferInput, JobOfferQueryInput } from "../schemas/jobOffer.schema";

export const jobOfferService = {
  async getPublicOffers(query: JobOfferQueryInput) {
    return jobOfferRepository.findAll(query);
  },

  async getRHOffers(organisationId: string, query: JobOfferQueryInput) {
    return jobOfferRepository.findAll(query, organisationId);
  },

  async createOffer(organisationId: string, userId: string, input: CreateJobOfferInput) {
    return jobOfferRepository.create({
      ...input,
      organisationId,
      createdById: userId,
    });
  },

  async updateOffer(id: string, organisationId: string, input: UpdateJobOfferInput) {
    const result = await jobOfferRepository.update(id, organisationId, input);
    if (result.count === 0) return null;
    return jobOfferRepository.findById(id, organisationId);
  },

  async deleteOffer(id: string, organisationId: string) {
    const result = await jobOfferRepository.delete(id, organisationId);
    return result.count > 0;
  },

  async getOfferById(id: string, organisationId?: string) {
    return jobOfferRepository.findById(id, organisationId);
  },

  async getCandidates(id: string, organisationId: string) {
    return candidateRepository.findByJobOffer(id, organisationId);
  },
};
