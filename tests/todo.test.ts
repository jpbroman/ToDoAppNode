import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { mockPrismaClient, createMockToken } from "./setup";
import app from "../src/server";

describe("ToDo Endpoints", () => {
  const mockToken = createMockToken(1, "testuser");
  const userId = 1;
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/ToDos", () => {
    it("should return all todos for authenticated user", async () => {
      const mockTodos = [
        {
          id: 1,
          heading: "Task 1",
          note: "Description 1",
          doDate: new Date("2024-12-31"),
          done: false,
          userId,
          created: new Date(),
        },
      ];
      mockPrismaClient.toDo.findMany.mockResolvedValue(mockTodos);

      const response = await request(app)
        .get("/api/ToDos")
        .set("Authorization", `Bearer ${mockToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /api/ToDos/:id", () => {
    it("should return a specific todo", async () => {
      mockPrismaClient.toDo.findFirst.mockResolvedValue({
        id: 1,
        heading: "Task 1",
        note: "Description",
        doDate: new Date("2024-12-31"),
        done: false,
        userId,
        created: new Date(),
      });

      const response = await request(app)
        .get("/api/ToDos/1")
        .set("Authorization", `Bearer ${mockToken}`);
      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/ToDos", () => {
    it("should create a new todo", async () => {
      const newTodo = {
        heading: "New Task",
        note: "Task description",
        doDate: "2024-12-31",
      };

      mockPrismaClient.toDo.create.mockResolvedValue({
        id: 1,
        ...newTodo,
        doDate: new Date(newTodo.doDate),
        done: false,
        userId,
        created: new Date(),
      });

      const response = await request(app)
        .post("/api/ToDos")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(newTodo);
      expect(response.status).toBe(201);
    });
  });

  describe("PUT /api/ToDos/:id", () => {
    it("should update an existing todo", async () => {
      mockPrismaClient.toDo.findFirst.mockResolvedValue({ id: 1, userId });
      mockPrismaClient.toDo.update.mockResolvedValue({
        id: 1,
        heading: "Updated Task",
        note: "Updated description",
        doDate: new Date("2024-12-31"),
        done: true,
        userId,
        created: new Date(),
      });

      const response = await request(app)
        .put("/api/ToDos/1")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({
          heading: "Updated Task",
          note: "Updated description",
          doDate: "2024-12-31",
          done: true,
        });
      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /api/ToDos/:id", () => {
    it("should delete a todo", async () => {
      mockPrismaClient.toDo.findFirst.mockResolvedValue({ id: 1, userId });
      mockPrismaClient.toDo.delete.mockResolvedValue({ id: 1 });
      const response = await request(app)
        .delete("/api/ToDos/1")
        .set("Authorization", `Bearer ${mockToken}`);
      expect(response.status).toBe(200);
    });

    it("should return 404 when deleting non-existent todo", async () => {
      mockPrismaClient.toDo.findFirst.mockResolvedValue(null);
      const response = await request(app)
        .delete("/api/ToDos/999")
        .set("Authorization", `Bearer ${mockToken}`);
      expect(response.status).toBe(404);
    });
  });

  describe("Validation Tests", () => {
    it("should reject POST without heading", async () => {
      const response = await request(app)
        .post("/api/ToDos")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({
          note: "Description",
          doDate: "2024-12-31",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("heading");
    });

    it("should reject POST without note", async () => {
      const response = await request(app)
        .post("/api/ToDos")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({
          heading: "Task",
          doDate: "2024-12-31",
        });
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("note");
    });

    it("should reject POST with invalid date", async () => {
      const response = await request(app)
        .post("/api/ToDos")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({
          heading: "Task",
          note: "Description",
          doDate: "invalid-date",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("doDate");
    });
  });
});
