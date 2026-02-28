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
      include: {
        applications: {
          include: {
            jobOffer: {
              select: {
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
};
