import { showNotification } from "@mantine/notifications";

export type ApiError = {
    status: number;
    code?: string;
    message: string;
};

export type PageResponse<T> = {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8080";

async function parseJsonSafe(response: Response) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        return null;
    }
    try {
        return await response.json();
    } catch {
        return null;
    }
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    config: { suppressNotification?: boolean } = {},
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const body = await parseJsonSafe(response);
        const error: ApiError = {
            status: response.status,
            code: body?.code,
            message: body?.message || response.statusText || "요청에 실패했습니다.",
        };

        if (typeof window !== "undefined" && !config.suppressNotification) {
            showNotification({
                color: "red",
                title: `오류 ${error.status}`,
                message: error.message,
            });
        }

        throw error;
    }

    if (response.status === 204) {
        return null as T;
    }

    const data = await parseJsonSafe(response);
    return data as T;
}
