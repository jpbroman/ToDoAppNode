-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ToDo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "heading" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created" DATETIME NOT NULL,
    "doDate" DATETIME NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "ToDo_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "User" ("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

INSERT INTO "new_ToDo"
    ("created", "doDate", "done", "heading", "id", "note", "userId")
SELECT
    "created",
    "doDate",
    "done",
    "heading",
    "id",
    "note",
    1
FROM "ToDo";

DROP TABLE "ToDo";

ALTER TABLE "new_ToDo" RENAME TO "ToDo";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
