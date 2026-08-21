// Load the generated client at runtime so TypeScript does not require a named export declaration.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.toDo.createMany({
    data: [
      {
        heading: "Testa Node API",
        note: "Min första ToDo i Node.js",
        created: new Date(),
        doDate: new Date("2026-08-21"),
        done: false
      },
      {
        heading: "Lära mig Express",
        note: "Bygga samma API som i ASP.NET Core",
        created: new Date(),
        doDate: new Date("2026-08-22"),
        done: true
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
  