import { vi } from "vitest";
import jwt from "jsonwebtoken";

const JWT_SECRET = "test-secret-key";

// Mock Prisma - måste vara en faktisk konstruktor
export const mockPrismaClient = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  toDo: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    user = mockPrismaClient.user;
    toDo = mockPrismaClient.toDo;
  },
}));

// Mock middleware med faktisk validering
vi.mock("../src/middleware/authMiddleware.js", () => ({
  authenticateToken: (req: { headers: { authorization: any; }; user: { id: number; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): any; new(): any; }; }; }, next: () => void) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token saknas" });
    }
    const token = authHeader.substring(7);
    if (token === "invalid-token") {
      return res.status(401).json({ message: "Ogiltigt token" });
    }
    req.user = { id: 1 };
    next();
  },
}));

vi.mock("../src/middleware/validateTodoId.js", () => ({
  validateTodoId: (req: { params: { id: string; }; todoId: number; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): any; new(): any; }; }; }, next: () => void) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID måste vara ett nummer" });
    }
    req.todoId = id;
    next();
  },
}));

vi.mock("../src/middleware/asyncHandler.js", () => ({
  asyncHandler: (fn: (arg0: any, arg1: any, arg2: ((reason: any) => PromiseLike<never>) | null | undefined) => any) => (req: any, res: any, next: ((reason: any) => PromiseLike<never>) | null | undefined) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },
}));

export const createMockToken = (
  userId: number = 1,
  username: string = "testuser",
) => {
  return jwt.sign({ username }, JWT_SECRET, {
    subject: String(userId),
    expiresIn: "1h",
    audience: "ToDoWeb",
    issuer: "ToDoAppNode",
  });
};
