import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";

jest.mock("../lib/prisma", () => {
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      organisation: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
      },
    },
    prisma: {
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      organisation: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
      },
    },
  };
});

describe("Auth Controller Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register-organisation", () => {
    it("should register organization and return 201 on success", async () => {
      const mockResult = {
        organisation: { id: "org-1", name: "Test Org" },
        user: { id: "user-1", email: "admin@test.com" },
        admin: { id: "admin-1" },
      };

      (prisma.$transaction as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .post("/api/auth/register-organisation")
        .send({
          organisationName: "Test Org",
          adminName: "John Doe",
          phone_org: "1234567890",
          nb_employers: "1-10",
          email: "admin@test.com",
          password: "password123",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Organisation registered successfully");
      expect(res.body.data.user.email).toBe("admin@test.com");
    });

    it("should return 400 for invalid body", async () => {
      const res = await request(app)
        .post("/api/auth/register-organisation")
        .send({
          email: "invalid-email",
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login user and return 200 on success", async () => {
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("password123", 10);

      const mockUser = {
        id: "user-1",
        email: "admin@test.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
        organisationId: "org-1",
        admin: { id: "admin-1" },
        rh: null,
        manager: null,
        employee: null,
        organisation: { id: "org-1", name: "Test Org" },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: "sess-1" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@test.com",
          password: "password123",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.role).toBe("ADMIN");
    });

    it("should return 401 for incorrect password", async () => {
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("password123", 10);

      const mockUser = {
        id: "user-1",
        email: "admin@test.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@test.com",
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Identifiants invalides");
    });
  });
});
