import { candidateRepository, CreateCandidateInput, UpdateCandidateInput } from "../repositories/candidate.repository";
import { storageService } from "./storage.service";

export const candidateService = {
  async registerCandidate(data: CreateCandidateInput & { cvFile?: Express.Multer.File }) {
    // 1. Check if email already exists
    const existing = await candidateRepository.findByEmail(data.email);
    if (existing) {
      throw new Error("Candidate with this email already exists");
    }

    let cvUrl = data.cv;

    // 2. Handle CV Upload if file is provided
    if (data.cvFile) {
      cvUrl = await storageService.uploadCV(data.cvFile, data.email);
    }

    // 3. Create candidate in DB
    const { cvFile, email, fullName, phone, status } = data;
    return candidateRepository.create({
      email,
      fullName,
      ...(phone !== undefined && { phone }),
      ...(status !== undefined && { status }),
      cv: cvUrl || null,
    });
  },

  async getAllCandidates(params: { page?: number; limit?: number; search?: string } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const { total, data } = await candidateRepository.findAll({
      skip,
      take: limit,
      ...(params.search !== undefined && { search: params.search }),
    });

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

  async getCandidateById(id: string) {
    const candidate = await candidateRepository.findById(id);
    if (!candidate) throw new Error("Candidate not found");
    return candidate;
  },

  async updateCandidate(id: string, data: UpdateCandidateInput & { cvFile?: Express.Multer.File }) {
    const candidate = await candidateRepository.findById(id);
    if (!candidate) throw new Error("Candidate not found");

    let cvUrl = data.cv;

    // Handle new CV Upload if provided
    if (data.cvFile) {
      // Optional: Delete old CV from storage if it exists
      if (candidate.cv) {
        try {
          await storageService.deleteFileFromStorage(candidate.cv);
        } catch (err) {
          console.error("Failed to delete old CV:", err);
          // We continue anyway
        }
      }
      cvUrl = await storageService.uploadCV(data.cvFile, data.email || candidate.email);
    }

    const { cvFile, email, fullName, phone, status } = data;
    return candidateRepository.update(id, {
      ...(email !== undefined && { email }),
      ...(fullName !== undefined && { fullName }),
      ...(phone !== undefined && { phone }),
      ...(status !== undefined && { status }),
      cv: cvUrl || null,
    });
  },

  async deleteCandidate(id: string) {
    const candidate = await candidateRepository.findById(id);
    if (!candidate) throw new Error("Candidate not found");

    // Delete CV from storage if it exists
    if (candidate.cv) {
      try {
        await storageService.deleteFileFromStorage(candidate.cv);
      } catch (err) {
        console.warn("⚠️ Failed to delete CV from storage (non-critical):", err);
        // Continue with candidate deletion even if CV deletion fails
      }
    }

    return candidateRepository.delete(id);
  },
};
