import type { Response, NextFunction } from "express";
import { parseTodoId } from "./validation.js";
import type { AuthenticatedRequest } from "./authMiddleware.js";

export interface TodoIdRequest extends AuthenticatedRequest {
    todoId?: number;
}

export function validateTodoId(
    req: TodoIdRequest,
    res: Response,
    next: NextFunction
) {
    const todoId = parseTodoId(req.params.id);

    if (todoId === null) {
        return res.status(400).json({
            message: "ID måste vara ett positivt heltal.",
        });
    }

    req.todoId = todoId;

    next();
}
