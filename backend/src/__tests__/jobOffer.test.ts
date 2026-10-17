import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

jest.mock("../lib/prisma", () => {
  return {
    __esModule: true,
    default: {
      jobOffer: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      rH: {
        findUnique: jest.fn(),
      },
    },
    prisma: {
      jobOffer: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      rH: {
        findUnique: jest.fn(),
      },
    },
  };
});

describe("JobOffer Controller Integration Tests", () => {
  let rhToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    rhToken = jwt.sign(
      {
        id: "user-rh-1",
        email: "rh@test.com",
        organisationId: "org-1",
        isAdmin: false,
        role: "RH",
      },
      JWT_SECRET
    );
  });

  describe("GET /api/joboffers", () => {
    it("should return public offers", async () => {
      const mockOffers = [
        { id: "offer-1", title: "Software Engineer", status: "PUBLISHED" },
      ];
      
      (prisma.jobOffer.findMany as jest.Mock).mockResolvedValue(mockOffers);
      (prisma.jobOffer.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get("/api/joboffers");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockOffers);
      expect(res.body.total).toBe(1);
    });
  });

  describe("POST /api/joboffers/rh", () => {
    it("should create a job offer and return 201 DRAFT on success", async () => {
      (prisma.rH.findUnique as jest.Mock).mockResolvedValue({ id: "rh-1", userId: "user-rh-1" });
      
      const mockCreatedOffer = {
        id: "offer-2",
        title: "QA Engineer",
        description: "Need a QA engineer",
        status: "DRAFT",
        statusSource: "MANUAL",
        userId: "user-rh-1",
        organisationId: "org-1",
      };

      (prisma.jobOffer.create as jest.Mock).mockResolvedValue(mockCreatedOffer);

      const res = await request(app)
        .post("/api/joboffers/rh")
        .set("Authorization", `Bearer ${rhToken}`)
        .send({
          title: "QA Engineer",
          description: "Need a QA engineer",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Job offer created (DRAFT)");
      expect(res.body.data.title).toBe("QA Engineer");
    });

    it("should return 403 if user is not RH", async () => {
      (prisma.rH.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/joboffers/rh")
        .set("Authorization", `Bearer ${rhToken}`)
        .send({
          title: "QA Engineer",
          description: "Need a QA engineer",
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden: RH role required");
    });
  });
});
