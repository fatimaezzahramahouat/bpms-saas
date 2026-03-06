import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

export const applicationRepository = {
  async findByCandidateAndJob(candidateId: string, jobOfferId: string) {
    return prisma.application.findUnique({
      where: {
        candidateId_jobOfferId: {
          candidateId,
          jobOfferId,
        },
      },
    });
  },

  async create(data: Prisma.ApplicationCreateInput) {
    return prisma.application.create({
      data,
    });
  },

  async createDocument(data: Prisma.DocumentCreateInput) {
    return prisma.document.create({
      data,
    });
  },

  async findByJobOfferId(jobOfferId: string) {
    return prisma.application.findMany({
      where: { jobOfferId },
      include: {
        candidate: true,
        documents: {
          where: { docType: "CV" },
        },
        aiAnalyses: {
          where: { type: "CANDIDATE_ANALYSIS" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: {
        jobOffer: {
          select: { organisationId: true },
        },
        documents: true,
      },
    });
  },

  async updateStatus(id: string, status: string) {
    return prisma.application.update({
      where: { id },
      data: { status },
    });
  },
};
