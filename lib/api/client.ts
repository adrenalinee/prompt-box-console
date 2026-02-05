import { showNotification } from "@mantine/notifications";
import { getInitServerPhase } from "@/config/app-config";
import { getSession } from "next-auth/react";

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

function getApiBaseUrl() {
    const serverPhase = getInitServerPhase();
    console.log("serverPhase: " + serverPhase);
    if (serverPhase == "dev") {
        return "https://prompt-box-server-dev-245695755093.asia-northeast3.run.app";
    } else if (serverPhase == "local") {
        return "http://localhost:8080";
    } else {
        throw Error("정의되지 않은 serverPhase 입니다. serverPhase: " + serverPhase);
    }
}

// Top-level await is supported in Next.js App Router (server components) but can be tricky in client modules.
// However, since this was working code, I will restore it as is.

const API_BASE_URL = getApiBaseUrl();

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

export type ApiFetchConfig = {
    suppressNotification?: boolean;
    suppressAlert?: boolean;
};

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    config: ApiFetchConfig = {},
): Promise<T> {
    let response: Response;
    try {
        const session = await getSession();
        // eslint-disable-next-line
        const token = (session as any)?.sessionToken;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "서버에 연결할 수 없습니다.";
        if (typeof window !== "undefined" && !config.suppressNotification) {
            showNotification({
                color: "red",
                title: "네트워크 오류",
                message,
            });
        }
        if (typeof window !== "undefined" && !config.suppressAlert) {
            window.dispatchEvent(
                new CustomEvent("app-api-error", { detail: { message } }),
            );
        }
        throw error;
    }

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
        if (typeof window !== "undefined" && !config.suppressAlert) {
            window.dispatchEvent(
                new CustomEvent("app-api-error", { detail: { message: error.message } }),
            );
        }

        throw error;
    }

    if (response.status === 204) {
        return null as T;
    }

    const data = await parseJsonSafe(response);
    return data as T;
}
