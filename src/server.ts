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

app.listen(5163, () => {
  console.log("API kör på http://localhost:5163");
});
