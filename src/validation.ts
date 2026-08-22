export function parseTodoId(value: string): number | null {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
}

export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export function isValidDate(value: unknown): value is string {
    if (typeof value !== "string" || value.trim().length === 0) {
        return false;
    }

    const date = new Date(value);

    return !Number.isNaN(date.getTime());
}
