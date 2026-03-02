import { z } from "zod";
import { ContractType, WorkMode, JobLevel } from "@prisma/client";

// --- Enums for Validation ---
const ContractTypeEnum = z.nativeEnum(ContractType);
const WorkModeEnum = z.nativeEnum(WorkMode);
const JobLevelEnum = z.nativeEnum(JobLevel);

// --- Create/Update Body Schema ---
export const createJobOfferSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  contractType: ContractTypeEnum,
  level: JobLevelEnum,
  workMode: WorkModeEnum,
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  responsibilities: z.array(z.string()).default([]),
  budget: z.number().optional().nullable(),
});

export const updateJobOfferSchema = createJobOfferSchema.partial();

// --- Query Parameters Schema ---
export const jobOfferQuerySchema = z.object({
  page: z.preprocess((val) => Number(val), z.number().int().positive().default(1)),
  limit: z.preprocess((val) => Number(val), z.number().int().positive().default(6)),
  search: z.string().optional(),
  contractType: ContractTypeEnum.optional(),
  city: z.string().optional(),
  sortBy: z.enum(["createdAt", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// --- Types ---
export type CreateJobOfferInput = z.infer<typeof createJobOfferSchema>;
export type UpdateJobOfferInput = z.infer<typeof updateJobOfferSchema>;
export type JobOfferQueryInput = z.infer<typeof jobOfferQuerySchema>;
