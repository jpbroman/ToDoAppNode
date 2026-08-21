import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
    authenticateToken,
} from "./authMiddleware.js";

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.listen(5163, () => {
  console.log("API kör på http://localhost:5163");
});

// app.get(
//     "/api/todos",
//     authenticateToken,
//     async (req, res) => {  res.json({
//     message: "ToDo API fungerar"
//   });
// });


app.get(
    "/api/todos",
    authenticateToken,
    async (req, res) => {  const todos = await prisma.toDo.findMany({
    orderBy: {
      doDate: "asc"
    }
  });

  res.json(todos);
});

app.get("/api/todos/:id", async (req, res) => {
    const id = Number(req.params.id);

    const todo = await prisma.toDo.findUnique({
        where: { id },
    });

    if (!todo) {
        return res.status(404).json({
            message: `Uppgiften med ID ${id} hittades inte.`,
        });
    }

    res.json(todo);
});

app.post("/api/todos", async (req, res) => {
    const { heading, note, doDate } = req.body;

    const todo = await prisma.toDo.create({
        data: {
            heading,
            note,
            created: new Date(),
            doDate: new Date(doDate),
        },
    });

    res.status(201).json(todo);
});

app.put("/api/todos/:id", async (req, res) => {
    const id = Number(req.params.id);

    const { heading, note, doDate, done } = req.body;

    const existingTodo = await prisma.toDo.findUnique({
        where: { id },
    });

    if (!existingTodo) {
        return res.status(404).json({
            message: `Uppgiften med ID ${id} hittades inte.`,
        });
    }

    const todo = await prisma.toDo.update({
        where: { id },
        data: {
            heading,
            note,
            doDate: new Date(doDate),
            done,
        },
    });

    res.json(todo);
});

app.delete("/api/todos/:id", async (req, res) => {
    const id = Number(req.params.id);

    const existingTodo = await prisma.toDo.findUnique({
        where: { id },
    });

    if (!existingTodo) {
        return res.status(404).json({
            message: `Uppgiften med ID ${id} hittades inte.`,
        });
    }

    await prisma.toDo.delete({
        where: { id },
    });

    res.json({
        message: `Uppgiften med ID ${id} har tagits bort.`,
    });
});

app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { username },
    });

    if (existingUser) {
        return res.status(400).json({
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

    res.status(201).json({
        message: "Användaren är skapad",
        userId: user.id,
    });
});

app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        return res.status(401).json({
            message: "Fel användare eller lösenord",
        });
    }

    const passwordValid = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!passwordValid) {
        return res.status(401).json({
            message: "Fel användare eller lösenord",
        });
    }

    const token = jwt.sign(
        {
            sub: user.id.toString(),
            username: user.username,
        },
        process.env.JWT_SECRET!,
        {
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE,
            expiresIn: "1h",
        }
    );

    res.json({
        token,
    });
});

app.listen(5163, () => {
  console.log("API kör på http://localhost:5163");
});
