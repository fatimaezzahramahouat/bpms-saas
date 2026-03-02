import prisma from "../lib/prisma";
import { CreateJobOfferInput, UpdateJobOfferInput, JobOfferQueryInput } from "../schemas/jobOffer.schema";
import { Prisma } from "@prisma/client";

export const jobOfferRepository = {
  /**
   * Find all job offers with pagination, filters, and search.
   * If organisationId is provided, scoped to that org (for RH dashboard).
   * Otherwise, public search (scoped by default or platform-wide).
   */
  async findAll(query: JobOfferQueryInput, organisationId?: string) {
    const { page, limit, search, contractType, city, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.JobOfferWhereInput = {
      ...(organisationId && { organisationId }),
      ...(contractType && { contractType }),
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
          id: true,
          title: true,
          description: true,
          contractType: true,
          level: true,
          workMode: true,
          skills: true,
          responsibilities: true,
          budget: true,
          createdAt: true,
          updatedAt: true,
          organisationId: true,
          createdById: true,
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
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string, organisationId?: string) {
    return prisma.jobOffer.findFirst({
      where: {
        id,
        ...(organisationId && { organisationId }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        contractType: true,
        level: true,
        workMode: true,
        skills: true,
        responsibilities: true,
        budget: true,
        createdAt: true,
        updatedAt: true,
        organisationId: true,
        createdById: true,
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
      },
    });
  },

  async update(id: string, organisationId: string, data: UpdateJobOfferInput) {
    // Filter out undefined values for strict property checks
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    return prisma.jobOffer.updateMany({
      where: { id, organisationId },
      data: updateData,
    });
  },

  async delete(id: string, organisationId: string) {
    return prisma.jobOffer.deleteMany({
      where: { id, organisationId },
    });
  },
};
