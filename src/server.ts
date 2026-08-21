import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.listen(5163, () => {
  console.log("API kör på http://localhost:5163");
});

app.get("/", (_req, res) => {
  res.json({
    message: "ToDo API fungerar"
  });
});

app.get("/api/todos", async (_req, res) => {
  const todos = await prisma.toDo.findMany({
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

app.listen(5163, () => {
  console.log("API kör på http://localhost:5163");
});
