import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash("Test123!", 10);

    const user = await prisma.user.upsert({
        where: {
            username: "testuser",
        },
        update: {},
        create: {
            username: "testuser",
            passwordHash,
        },
    });

    await prisma.toDo.deleteMany({
        where: {
            userId: user.id,
        },
    });

    await prisma.toDo.createMany({
        data: [
            {
                heading: "Testa Node API",
                note: "Min första ToDo i Node.js",
                created: new Date(),
                doDate: new Date("2026-08-21"),
                done: false,
                userId: user.id,
            },
            {
                heading: "Lära mig Express",
                note: "Bygga samma API som i ASP.NET Core",
                created: new Date(),
                doDate: new Date("2026-08-22"),
                done: true,
                userId: user.id,
            },
        ],
    });

    console.log(`Seed klar för användaren: ${user.username}`);
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
