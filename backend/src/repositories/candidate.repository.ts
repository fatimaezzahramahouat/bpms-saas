import prisma from "../lib/prisma";
import { Prisma, CandidateStatus } from "@prisma/client";

export interface CreateCandidateInput {
  email: string;
  fullName: string;
  phone?: string | null;
  cv?: string | null;
  status?: CandidateStatus;
}

export interface UpdateCandidateInput {
  email?: string;
  fullName?: string;
  phone?: string | null;
  cv?: string | null;
  status?: CandidateStatus;
}

export const candidateRepository = {
  async create(data: CreateCandidateInput) {
    return prisma.candidate.create({
      data,
    });
  },

  async findAll(params: { skip?: number; take?: number; search?: string } = {}) {
    const { skip, take, search } = params;
    
    const where: Prisma.CandidateWhereInput = search ? {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [total, data] = await Promise.all([
      prisma.candidate.count({ where }),
      prisma.candidate.findMany({
        where,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, data };
  },

  async findById(id: string) {
    return prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        cv: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        // ⚠️ NE PAS inclure: skills, experience, education (n'existent pas en DB)
        applications: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            jobOffer: {
              select: {
                id: true,
                title: true,
                organisation: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });
  },

  async findByEmail(email: string) {
    return prisma.candidate.findUnique({
      where: { email },
    });
  },

  async update(id: string, data: UpdateCandidateInput) {
    return prisma.candidate.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.candidate.delete({
      where: { id },
    });
  },

  async findByJobOffer(jobOfferId: string, organisationId: string) {
    return prisma.candidate.findMany({
      where: {
        applications: {
          some: {
            jobOfferId,
            jobOffer: { organisationId },
          },
        },
      },
      // Utiliser select au lieu de include pour éviter les champs inexistants en DB
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        cv: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        // ⚠️ NE PAS inclure: skills, experience, education (n'existent pas en DB)
        applications: {
          where: { jobOfferId },
          select: {
            id: true,
            status: true,
            createdAt: true,
            documents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
