import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { mockPrismaClient, createMockToken } from "./setup.js";

// Importera app från din server-fil
import app from "../src/server.js";

describe("Authentication Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const newUser = { username: "testuser", password: "SecurePass123!" };
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.user.create.mockResolvedValue({
        id: 1,
        username: newUser.username,
        passwordHash: await bcrypt.hash(newUser.password, 10),
      });
      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("userId");
    });

    it("should reject if username already exists", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 1,
        username: "existing",
        passwordHash: "hash",
      });
      const response = await request(app)
        .post("/api/auth/register")
        .send({ username: "existing", password: "SecurePass123!" });
      expect(response.status).toBe(409);
    });

    it("should reject invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ username: "", password: "short" });
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully and return JWT token", async () => {
      const credentials = { username: "testuser", password: "SecurePass123!" };
      const passwordHash = await bcrypt.hash(credentials.password, 10);
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 1,
        username: credentials.username,
        passwordHash,
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send(credentials);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("should reject if user does not exist", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      const response = await request(app)
        .post("/api/auth/login")
        .send({ username: "nonexistent", password: "SecurePass123!" });
      expect(response.status).toBe(401);
    });

    it("should reject if password is incorrect", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 1,
        username: "testuser",
        passwordHash: await bcrypt.hash("CorrectPassword123!", 10),
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({ username: "testuser", password: "WrongPassword123!" });
      expect(response.status).toBe(401);
    });

    it("should reject invalid credentials on login", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ username: "", password: "short" });
      expect(response.status).toBe(400);
    });
  });
});
