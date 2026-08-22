
import type { Response, NextFunction } from "express";

export interface TodoIdRequest extends Request {
    todoId?: number;
}

export function validateCredentials(
    username: unknown,
    password: unknown
): string | null {
    if (!isNonEmptyString(username)) {
        return "Användarnamn krävs.";
    }

    if (!isNonEmptyString(password)) {
        return "Lösenord krävs.";
    }

    return null;
}

export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export function isValidDate(value: unknown): value is string {
    if (!isNonEmptyString(value)) {
        return false;
    }

    return !Number.isNaN(Date.parse(value));
}

export function parseTodoId(value: unknown): number | null {
    if (!isNonEmptyString(value)) {
        return null;
    }

    if (!/^\d+$/.test(value)) {
        return null;
    }

    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return null;
    }

    return id;
}
