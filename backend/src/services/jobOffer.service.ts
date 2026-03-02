import { jobOfferRepository } from "../repositories/jobOffer.repository";
import { candidateRepository } from "../repositories/candidate.repository";
import {
  CreateJobOfferInput,
  UpdateJobOfferInput,
  JobOfferQueryInput,
  SystemUpdateJobOfferInput,
} from "../schemas/jobOffer.schema";

export const jobOfferService = {
  // ---- PUBLIC ----

  async getPublicOffers(query: JobOfferQueryInput) {
    return jobOfferRepository.findAll(query);
  },

  // ---- RH DASHBOARD ----

  async getRHOffers(organisationId: string, query: JobOfferQueryInput) {
    return jobOfferRepository.findAll(query, organisationId);
  },

  /**
   * [RH - MANUAL] Create a new job offer.
   * Defaults: status = DRAFT, statusSource = MANUAL.
   */
  async createOffer(organisationId: string, userId: string, input: CreateJobOfferInput) {
    return jobOfferRepository.create({
      ...input,
      organisationId,
      createdById: userId,
    });
  },

  /**
   * [RH - MANUAL] Update a job offer with manual status changes only.
   * Allowed statuses: DRAFT, PUBLISHED, PAUSED, CANCELLED.
   * statusSource will be set to MANUAL automatically.
   */
  async updateOffer(id: string, organisationId: string, input: UpdateJobOfferInput) {
    const result = await jobOfferRepository.updateManual(id, organisationId, input);
    if (result.count === 0) return null;
    return jobOfferRepository.findById(id, organisationId);
  },

  /**
   * [RH - MANUAL] Delete a job offer.
   * Only offers with statusSource = MANUAL can be deleted.
   * Returns null if not found, returns 'forbidden' if system-managed.
   */
  async deleteOffer(id: string, organisationId: string) {
    // Check if the offer exists AND belongs to this org
    const existing = await jobOfferRepository.findStatusById(id);
    if (!existing || existing.organisationId !== organisationId) {
      return { success: false, reason: "not_found" as const };
    }

    // Guard: system-managed offers (FILLED/CLOSED) cannot be deleted
    if (existing.statusSource === "AUTOMATIC") {
      return { success: false, reason: "forbidden" as const };
    }

    const result = await jobOfferRepository.delete(id, organisationId);
    return result.count > 0
      ? { success: true, reason: "deleted" as const }
      : { success: false, reason: "not_found" as const };
  },

  async getOfferById(id: string, organisationId?: string) {
    return jobOfferRepository.findById(id, organisationId);
  },

  // ---- CANDIDATES ----

  async getCandidates(id: string, organisationId: string) {
    return candidateRepository.findByJobOffer(id, organisationId);
  },

  // ---- SYSTEM AUTOMATION ----

  /**
   * [SYSTEM - AUTOMATIC] Set job offer status to FILLED.
   * Triggered when a candidate is ACCEPTED for the offer.
   */
  async markAsFilled(jobOfferId: string) {
    return jobOfferRepository.updateSystem(jobOfferId, { status: "FILLED" });
  },

  /**
   * [SYSTEM - AUTOMATIC] Set job offer status to CLOSED.
   * Triggered when a deadline passes or condition is met.
   */
  async markAsClosed(jobOfferId: string) {
    return jobOfferRepository.updateSystem(jobOfferId, {
      status: "CLOSED",
      closedAt: new Date(),
    });
  },
};
