import { z } from "zod";
import { ContractType, WorkMode, JobLevel } from "@prisma/client";

// --- Enums for Validation ---
const ContractTypeEnum = z.nativeEnum(ContractType);
const WorkModeEnum = z.nativeEnum(WorkMode);
const JobLevelEnum = z.nativeEnum(JobLevel);

// All possible job offer statuses (mirrors Prisma JobOfferStatus enum)
export const JOB_OFFER_STATUS = ["DRAFT", "PUBLISHED", "PAUSED", "CANCELLED", "FILLED", "CLOSED"] as const;
export type JobOfferStatusType = typeof JOB_OFFER_STATUS[number];

// Statuses that an RH can set manually
export const MANUAL_STATUSES: JobOfferStatusType[] = ["DRAFT", "PUBLISHED", "PAUSED", "CANCELLED"];

// Statuses that are only set automatically by the system
export const AUTOMATIC_STATUSES: JobOfferStatusType[] = ["FILLED", "CLOSED"];

// Zod schema for manual status update (RH-allowed only)
const ManualStatusEnum = z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CANCELLED"]);

// Zod schema for all statuses
const JobOfferStatusEnum = z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CANCELLED", "FILLED", "CLOSED"]);

// --- Create Body Schema ---
// statusSource and status are NOT included, defaults are applied in the service
export const createJobOfferSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  contractType: ContractTypeEnum,
  level: JobLevelEnum,
  workMode: WorkModeEnum,
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  responsibilities: z.array(z.string()).default([]),
  budget: z.number().optional().nullable(),
  workflowId: z.string().uuid().optional().nullable(),
});

// --- Update Body Schema ---
// RH can update any of the base fields + manually-allowed statuses
export const updateJobOfferSchema = createJobOfferSchema.partial().extend({
  status: ManualStatusEnum.optional(),
});

// --- System-only update schema (FILLED, CLOSED) ---
// Used internally by automation logic (e.g., candidate accepted, deadline passed)
export const systemUpdateJobOfferSchema = z.object({
  status: z.enum(["FILLED", "CLOSED"]),
  closedAt: z.date().optional(),
});

// --- Query Parameters Schema ---
export const jobOfferQuerySchema = z.object({
  page: z.preprocess((val) => Number(val), z.number().int().positive().default(1)),
  limit: z.preprocess((val) => Number(val), z.number().int().positive().default(6)),
  search: z.string().optional(),
  contractType: ContractTypeEnum.optional(),
  status: JobOfferStatusEnum.optional(),
  city: z.string().optional(),
  sortBy: z.enum(["createdAt", "title", "publishedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// --- Types ---
export type CreateJobOfferInput = z.infer<typeof createJobOfferSchema>;
export type UpdateJobOfferInput = z.infer<typeof updateJobOfferSchema>;
export type SystemUpdateJobOfferInput = z.infer<typeof systemUpdateJobOfferSchema>;
export type JobOfferQueryInput = z.infer<typeof jobOfferQuerySchema>;
