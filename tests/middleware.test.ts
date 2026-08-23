import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createMockToken } from "./setup.js";
import app from "../src/server.js";

describe("Middleware Tests", () => {
  describe("authenticateToken", () => {
    it("should allow request with valid token", async () => {
      const validToken = createMockToken(1, "testuser");
      const response = await request(app)
        .get("/api/ToDos")
        .set("Authorization", `Bearer ${validToken}`);
      expect(response.status).not.toBe(401);
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/ToDos");
      expect(response.status).toBe(401);
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/ToDos")
        .set("Authorization", "Bearer invalid-token");
      expect(response.status).toBe(401);
    });
  });

  describe("validateTodoId", () => {
    it("should accept valid numeric ID", async () => {
      const validToken = createMockToken(1, "testuser");
      const response = await request(app)
        .get("/api/ToDos/1")
        .set("Authorization", `Bearer ${validToken}`);
      expect(response.status).not.toBe(400);
    });

    it("should reject non-numeric ID", async () => {
      const validToken = createMockToken(1, "testuser");
      const response = await request(app)
        .get("/api/ToDos/abc")
        .set("Authorization", `Bearer ${validToken}`);
      expect(response.status).toBe(400);
    });
  });
});
