import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
    };
}

export function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Token saknas",
        });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            message: "Ogiltig Authorization-header",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!,
            {
                issuer: process.env.JWT_ISSUER,
                audience: process.env.JWT_AUDIENCE,
            }
        );

        if (
            typeof decoded === "string" ||
            !decoded.sub ||
            typeof decoded.username !== "string"
        ) {
            return res.status(401).json({
                message: "Ogiltig token",
            });
        }

        req.user = {
            id: Number(decoded.sub),
            username: decoded.username,
        };

        next();
    } catch {
        return res.status(401).json({
            message: "Ogiltig eller utgången token",
        });
    }
}
