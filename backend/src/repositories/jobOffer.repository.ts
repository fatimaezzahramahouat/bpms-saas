import prisma from "../lib/prisma";
import { CreateJobOfferInput, UpdateJobOfferInput, JobOfferQueryInput, SystemUpdateJobOfferInput, JobOfferStatusType } from "../schemas/jobOffer.schema";
import { Prisma } from "@prisma/client";

// Helper to build the base select projection for job offers
// NOTE: 'as any' is used because the Prisma TS client may not yet reflect
// newly added fields (status, statusSource, workflowId, publishedAt, closedAt)
// until the TS language server fully reloads after 'prisma generate'.
const jobOfferSelect = {
  id: true,
  title: true,
  description: true,
  contractType: true,
  level: true,
  workMode: true,
  skills: true,
  responsibilities: true,
  budget: true,
  status: true,
  statusSource: true,
  publishedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  organisationId: true,
  createdById: true,
  workflowId: true,
} as any;

export const jobOfferRepository = {
  /**
   * Find all job offers with pagination, filters, and search.
   * If organisationId is provided, scoped to that org (for RH dashboard).
   * Otherwise, public search.
   */
  async findAll(query: JobOfferQueryInput, organisationId?: string) {
    const { page, limit, search, contractType, status, city, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.JobOfferWhereInput = {
      ...(organisationId && { organisationId }),
      ...(contractType && { contractType }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(city && {
        organisation: {
          orgInfo: {
            city: { contains: city, mode: "insensitive" },
          },
        },
      }),
    };

    const [total, data] = await Promise.all([
      prisma.jobOffer.count({ where }),
      prisma.jobOffer.findMany({
        where,
        select: {
          ...jobOfferSelect,
          organisation: {
            select: {
              name: true,
              orgInfo: {
                select: { city: true, logo: true },
              },
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(id: string, organisationId?: string) {
    return prisma.jobOffer.findFirst({
      where: {
        id,
        ...(organisationId && { organisationId }),
      },
      select: {
        ...jobOfferSelect,
        organisation: {
          select: {
            name: true,
            orgInfo: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });
  },

  /**
   * Create a new job offer.
   * Defaults: status = DRAFT, statusSource = MANUAL.
   * Sets publishedAt if status is PUBLISHED.
   */
  async create(data: CreateJobOfferInput & { organisationId: string; createdById: string }) {
    return prisma.jobOffer.create({
      data: {
        title: data.title,
        description: data.description,
        contractType: data.contractType,
        level: data.level,
        workMode: data.workMode,
        skills: data.skills,
        responsibilities: data.responsibilities || [],
        budget: data.budget ?? null,
        organisationId: data.organisationId,
        createdById: data.createdById,
        workflowId: data.workflowId ?? null,
        // RH creates in DRAFT mode (manual)
        status: "DRAFT",
        statusSource: "MANUAL",
      } as any,
      select: jobOfferSelect,
    });
  },

  /**
   * Update a job offer manually by RH.
   * Only allows MANUAL statuses. Sets statusSource = MANUAL.
   * Sets publishedAt when status transitions to PUBLISHED.
   */
  async updateManual(
    id: string,
    organisationId: string,
    data: UpdateJobOfferInput
  ) {
    const { status, ...rest } = data;

    // Build update payload - use 'any' to bypass strict type checking before Prisma client is refreshed
    const updateData: any = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined)
    );

    if (status) {
      updateData.status = status;
      updateData.statusSource = "MANUAL";

      // Auto-set publishedAt when transitioning to PUBLISHED
      if (status === "PUBLISHED") {
        updateData.publishedAt = new Date();
      }
    }

    return prisma.jobOffer.updateMany({
      where: { id, organisationId },
      data: updateData,
    });
  },

  /**
   * Update a job offer automatically by the SYSTEM.
   * Sets statusSource = AUTOMATIC. Only FILLED and CLOSED are allowed.
   */
  async updateSystem(id: string, data: SystemUpdateJobOfferInput) {
    return prisma.jobOffer.update({
      where: { id },
      data: {
        status: data.status,
        statusSource: "AUTOMATIC",
        closedAt: data.status === "CLOSED" || data.status === "FILLED"
          ? (data.closedAt ?? new Date())
          : undefined,
      } as any,
    });
  },

  /**
   * Delete a job offer.
   * Only allowed if statusSource = MANUAL (i.e., not system-managed).
   * Returns count > 0 on success, 0 if not found or not deletable.
   */
  async delete(id: string, organisationId: string) {
    return prisma.jobOffer.deleteMany({
      where: {
        id,
        organisationId,
        statusSource: "MANUAL", // Cannot delete system-closed/filled offers
      } as any,
    });
  },

  /**
   * Check if a job offer exists and belongs to an org (for validation).
   */
  async findStatusById(id: string): Promise<{ id: string; status: string; statusSource: string; organisationId: string } | null> {
    const result = await (prisma.jobOffer as any).findUnique({
      where: { id },
      select: { id: true, status: true, statusSource: true, organisationId: true },
    });
    return result as { id: string; status: string; statusSource: string; organisationId: string } | null;
  },
};
