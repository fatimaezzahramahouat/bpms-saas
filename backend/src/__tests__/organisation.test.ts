import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

jest.mock("../lib/prisma", () => {
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
      },
      organisation: {
        findUnique: jest.fn(),
      },
    },
    prisma: {
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
      },
      organisation: {
        findUnique: jest.fn(),
      },
    },
  };
});

describe("Organisation Controller Integration Tests", () => {
  let token: string;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign(
      {
        id: "user-1",
        email: "admin@test.com",
        organisationId: "org-1",
        isAdmin: true,
        role: "ADMIN",
      },
      JWT_SECRET
    );
  });

  describe("POST /api/organisation/onboarding", () => {
    it("should complete onboarding and return 201", async () => {
      const mockUser = {
        id: "user-1",
        email: "admin@test.com",
        provider: "CREDENTIALS",
        organisationId: "org-1",
      };

      const mockOnboardingResult = {
        orgInfo: {
          id: "info-1",
          website: "https://testorg.com",
          city: "Casablanca",
          domaine: "Technology",
          address: "123 Main St",
          emailorg: "contact@testorg.com",
          phoneorg: "1234567890",
          logo: "",
        },
        user: { id: "user-1", profileCompleted: true },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.$transaction as jest.Mock).mockResolvedValue(mockOnboardingResult);

      const res = await request(app)
        .post("/api/organisation/onboarding")
        .set("Authorization", `Bearer ${token}`)
        .send({
          website: "https://testorg.com",
          city: "Casablanca",
          domaine: "Technology",
          address: "123 Main St",
          emailorg: "contact@testorg.com",
          phoneorg: "1234567890",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Onboarding completed successfully");
      expect(res.body.data.website).toBe("https://testorg.com");
    });

    it("should return 400 on invalid body validation", async () => {
      const res = await request(app)
        .post("/api/organisation/onboarding")
        .set("Authorization", `Bearer ${token}`)
        .send({
          website: "not-a-url",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app)
        .post("/api/organisation/onboarding")
        .send({
          website: "https://testorg.com",
          city: "Casablanca",
          domaine: "Technology",
          address: "123 Main St",
          emailorg: "contact@testorg.com",
          phoneorg: "1234567890",
        });

      expect(res.status).toBe(401);
    });
  });
});
