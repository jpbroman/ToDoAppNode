import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

const PORT = 5163;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

app.use(cors());
app.use(express.json());

interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
    };
}

function authenticateToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Ingen token skickades.",
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            audience: "ToDoWeb",
            issuer: "ToDoAppNode",
        }) as {
            sub: string;
            username: string;
        };

        req.user = {
            id: Number(decoded.sub),
            username: decoded.username,
        };

        next();
    } catch {
        return res.status(403).json({
            message: "Ogiltig eller utgången token.",
        });
    }
}

/*
 * GET /api/todos
 *
 * Hämtar endast den inloggade användarens ToDos.
 */
app.get(
    "/api/todos",
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const todos = await prisma.toDo.findMany({
                where: {
                    userId: req.user!.id,
                },
                orderBy: {
                    doDate: "asc",
                },
            });

            return res.json(todos);
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Kunde inte hämta ToDo-poster.",
            });
        }
    }
);

/*
 * GET /api/todos/:id
 */
app.get(
    "/api/todos/:id",
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const todoId = Number(req.params.id);

            const todo = await prisma.toDo.findFirst({
                where: {
                    id: todoId,
                    userId: req.user!.id,
                },
            });

            if (!todo) {
                return res.status(404).json({
                    message: `Uppgiften med ID ${todoId} hittades inte.`,
                });
            }

            return res.json(todo);
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Kunde inte hämta ToDo-posten.",
            });
        }
    }
);

/*
 * POST /api/todos
 */
app.post(
    "/api/todos",
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const { heading, note, doDate } = req.body;

            if (!heading || !note || !doDate) {
                return res.status(400).json({
                    message: "heading, note och doDate krävs.",
                });
            }

            const todo = await prisma.toDo.create({
                data: {
                    heading,
                    note,
                    created: new Date(),
                    doDate: new Date(doDate),
                    done: false,
                    userId: req.user!.id,
                },
            });

            return res.status(201).json(todo);
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Kunde inte skapa ToDo-posten.",
            });
        }
    }
);

/*
 * PUT /api/todos/:id
 */
app.put(
    "/api/todos/:id",
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const todoId = Number(req.params.id);
            const { heading, note, doDate, done } = req.body;

            const existingTodo = await prisma.toDo.findFirst({
                where: {
                    id: todoId,
                    userId: req.user!.id,
                },
            });

            if (!existingTodo) {
                return res.status(404).json({
                    message: `Uppgiften med ID ${todoId} hittades inte.`,
                });
            }

            const todo = await prisma.toDo.update({
                where: {
                    id: todoId,
                },
                data: {
                    heading,
                    note,
                    doDate: new Date(doDate),
                    done,
                },
            });

            return res.json(todo);
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Kunde inte uppdatera ToDo-posten.",
            });
        }
    }
);

/*
 * DELETE /api/todos/:id
 */
app.delete(
    "/api/todos/:id",
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const todoId = Number(req.params.id);

            const existingTodo = await prisma.toDo.findFirst({
                where: {
                    id: todoId,
                    userId: req.user!.id,
                },
            });

            if (!existingTodo) {
                return res.status(404).json({
                    message: `Uppgiften med ID ${todoId} hittades inte.`,
                });
            }

            await prisma.toDo.delete({
                where: {
                    id: todoId,
                },
            });

            return res.json({
                message: `Uppgiften med ID ${todoId} har tagits bort.`,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Kunde inte ta bort ToDo-posten.",
            });
        }
    }
);

/*
 * POST /api/auth/register
 */
app.post(
    "/api/auth/register",
    async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    message: "Användarnamn och lösenord krävs.",
                });
            }

            const existingUser = await prisma.user.findUnique({
                where: {
                    username,
                },
            });

            if (existingUser) {
                return res.status(409).json({
                    message: "Användarnamnet är redan upptaget",
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: {
                    username,
                    passwordHash,
                },
            });

            return res.status(201).json({
                message: "Användaren är skapad",
                userId: user.id,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Kunde inte skapa användaren.",
            });
        }
    }
);

/*
 * POST /api/auth/login
 */
app.post(
    "/api/auth/login",
    async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    message: "Användarnamn och lösenord krävs.",
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
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Kunde inte logga in.",
            });
        }
    }
);

app.listen(PORT, () => {
    console.log(`API kör på http://localhost:${PORT}`);
});

