import express, {
    type Request,
    type Response,
    type NextFunction,
} from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

import {
    authenticateToken,
    type AuthenticatedRequest,
} from "./middleware/authMiddleware.js";

import {
    validateTodoId,
    type TodoIdRequest,
} from "./middleware/validateTodoId.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { isNonEmptyString, isValidDate, validateCredentials } from "./middleware/validation.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Formaterar om datumfält till en ren sträng (YYYY-MM-DD)
const formatTodoDates = (todo: any) => {
    return {
        ...todo,
        created: todo.created ? todo.created.toISOString().split("T")[0] : undefined,
        doDate: todo.doDate ? todo.doDate.toISOString().split("T")[0] : null,
    };
};

const app = express();
const prisma = new PrismaClient();

const PORT = 5163;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

type AuthRequest = Request & {
    user?: {
        id: number;
    };
};

app.use(cors());
app.use(express.json());

/*
 * GET /api/todos
 *
 * Hämtar endast den inloggade användarens ToDos.
 */
app.get(
    "/api/ToDos",
    authenticateToken,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const todos = await prisma.toDo.findMany({
            where: {
                user: {
                    id: req.user!.id,
                },
            },
            orderBy: {
                doDate: "asc",
            },
        });

        // Formatera hela listan med .map()
        return res.json(todos.map(formatTodoDates));
    })
);

/*
 * GET /api/todos/:id
 */
app.get(
    "/api/ToDos/:id",
    authenticateToken,
    validateTodoId,
    asyncHandler(async (req: TodoIdRequest, res: Response) => {
        const todo = await prisma.toDo.findFirst({
            where: {
                id: req.todoId!,
                user: {
                    id: req.user!.id,
                },
            },
        });

        if (!todo) {
            return res.status(404).json({
                message: `Uppgiften med ID ${req.todoId} hittades inte.`,
            });
        }

        return res.json(formatTodoDates(todo));
    })
);

/*
 * POST /api/todos
 */
app.post(
    "/api/ToDos",
    authenticateToken,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { heading, note, doDate } = req.body;

        if (!isNonEmptyString(heading)) {
            return res.status(400).json({
                message: "heading måste vara en text som inte är tom.",
            });
        }

        if (!isNonEmptyString(note)) {
            return res.status(400).json({
                message: "note måste vara en text som inte är tom.",
            });
        }

        if (!isValidDate(doDate)) {
            return res.status(400).json({
                message: "doDate måste vara ett giltigt datum.",
            });
        }

        const todo = await prisma.toDo.create({
            data: {
                heading,
                note,
                created: new Date(),
                doDate: new Date(doDate),
                done: false,
                user: {
                    connect: {
                        id: req.user!.id,
                    },
                },
            },
        });

        return res.status(201).json(formatTodoDates(todo));
    })
);

/*
 * PUT /api/todos/:id
 */
app.put(
    "/api/ToDos/:id",
    authenticateToken,
    validateTodoId,
    asyncHandler(async (req: TodoIdRequest, res: Response) => {
        const { heading, note, doDate, done } = req.body;

        if (!isNonEmptyString(heading)) {
            return res.status(400).json({
                message: "heading måste vara en text som inte är tom.",
            });
        }

        if (!isNonEmptyString(note)) {
            return res.status(400).json({
                message: "note måste vara en text som inte är tom.",
            });
        }

        if (!isValidDate(doDate)) {
            return res.status(400).json({
                message: "doDate måste vara ett giltigt datum.",
            });
        }

        if (typeof done !== "boolean") {
            return res.status(400).json({
                message: "done måste vara true eller false.",
            });
        }

        const existingTodo = await prisma.toDo.findFirst({
            where: {
                id: req.todoId!,
                user: {
                    id: req.user!.id,
                },
            },
        });

        if (!existingTodo) {
            return res.status(404).json({
                message: `Uppgiften med ID ${req.todoId} hittades inte.`,
            });
        }

        const todo = await prisma.toDo.update({
            where: {
                id: req.todoId!,
            },
            data: {
                heading,
                note,
                doDate: new Date(doDate),
                done,
            },
        });

        return res.json(formatTodoDates(todo));
    })
);

/*
 * DELETE /api/todos/:id
 */
app.delete(
    "/api/ToDos/:id",
    authenticateToken,
    validateTodoId,
    asyncHandler(async (req: TodoIdRequest, res: Response) => {
        const existingTodo = await prisma.toDo.findFirst({
            where: {
                id: req.todoId!,
                user: {
                    id: req.user!.id,
                },
            },
        });

        if (!existingTodo) {
            return res.status(404).json({
                message: `Uppgiften med ID ${req.todoId} hittades inte.`,
            });
        }

        await prisma.toDo.delete({
            where: {
                id: req.todoId!,
            },
        });

        return res.json({
            message: `Uppgiften med ID ${req.todoId} har tagits bort.`,
        });
    })
);

/*
 * POST /api/auth/register
 */
app.post(
    "/api/auth/register",
    asyncHandler(async (req: Request, res: Response) => {
        const { username, password } = req.body;

        const validationError = validateCredentials(
            username,
            password
        );

        if (validationError) {
            return res.status(400).json({
                message: validationError,
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                username,
            },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Användarnamnet är redan upptaget.",
            });
        }

        const passwordHash = await bcrypt.hash(
            password,
            10
        );

        const user = await prisma.user.create({
            data: {
                username,
                passwordHash,
            },
        });

        return res.status(201).json({
            message: "Användaren är skapad.",
            userId: user.id,
        });
    })
);

/*
 * POST /api/auth/login
 */
app.post(
    "/api/auth/login",
    asyncHandler(async (req: Request, res: Response) => {
        const { username, password } = req.body;

        const validationError = validateCredentials(
            username,
            password
        );

        if (validationError) {
            return res.status(400).json({
                message: validationError,
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                username,
            },
        });

        if (!user) {
            return res.status(401).json({
                message: "Fel användarnamn eller lösenord.",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Fel användarnamn eller lösenord.",
            });
        }

        const token = jwt.sign(
            {
                username: user.username,
            },
            JWT_SECRET,
            {
                subject: String(user.id),
                expiresIn: "1h",
                audience: "ToDoWeb",
                issuer: "ToDoAppNode",
            }
        );

        return res.json({
            token,
        });
    })
);

/*
 * Central felhantering
 *
 * Måste ligga sist, efter alla routes.
 */
app.use(errorHandler);

export default app;