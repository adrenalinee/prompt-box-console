import { apiFetch, ApiFetchConfig, PageResponse } from "@/lib/api/client";
import { showNotification } from "@mantine/notifications";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8080";

export type ExecutePayload = {
    workspaceId: string;
    llmModelId: number | string;
    llmApiKeyId: string;
    promptRefId?: number | string;
    rawInstructionsText?: string;
    inputItems: { role: "USER" | "ASSISTANT" | "SYSTEM" | "DEVELOPER"; message: string }[];
    overrideOptions?: {
        temperature?: number;
        topP?: number;
        maxTokens?: number;
        textFormat?: string;
        effort?: string;
        verbosity?: string;
        summary?: string;
    };
};

export type ExecuteResult = {
    llmCallLogId: string;
};

export type LlmStreamEvent = {
    type:
    | "log.created"
    | "message.added"
    | "message.delta"
    | "message.done"
    | "reasoning.added"
    | "reasoning.delta"
    | "reasoning.done"
    | string;
    id?: string;
    createdAt?: string;
    index?: number;
    delta?: string;
    sequence?: number;
    outputText?: string;
    callLogId?: string;
    contentIndex?: number;
    part?: "TEXT" | "SUMMARY" | string;
};

export type ExecuteStreamHandlers = {
    onEvent?: (event: LlmStreamEvent) => void;
    onError?: (error: unknown) => void;
    onComplete?: () => void;
};

export type CallLog = {
    id: string;
    workspaceId?: string;
    llmModelId?: number;
    llmApiKeyId?: string;
    promptRefId?: number;
    createdAt?: string;
    instructionsPreview?: string;
    elapsed?: number;
    status?: "PENDING" | "RUNNING" | "SUCCESS" | "ERROR" | "TIMEOUT" | "CANCELLED";
    errorCode?: string;
    errorMessage?: string;
    llmCallOptions?: string;
    instructions?: string;
};

export type CallLogDetail = {
    callLog: CallLog;
    inputItems?: { id: number; position: number; renderedMessage: string }[];
    outputItems?: {
        id: number;
        position: number;
        outputText: string;
        parts?: {
            part: string;
            text: string;
        }[];
    }[];
};

export async function executeCall(payload: ExecutePayload) {
    const { workspaceId, ...body } = payload;
    return apiFetch<ExecuteResult>(`/workspaces/${workspaceId}/llm-calls`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

function parseJsonSafe(text: string) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function extractMessageFromSse(text: string) {
    const normalized = text.replace(/\r\n/g, "\n");
    const dataLines = normalized
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .filter(Boolean);
    if (!dataLines.length) return "";
    const joined = dataLines.join("\n");
    const parsed = parseJsonSafe(joined);
    if (parsed && typeof parsed === "object" && "message" in parsed) {
        const msg = (parsed as { message?: string }).message;
        return msg?.trim() || "";
    }
    return joined.trim();
}

function handleStreamError(error: unknown, config: ApiFetchConfig = {}) {
    const message =
        error instanceof Error ? error.message : "요청에 실패했습니다.";
    if (typeof window !== "undefined" && !config.suppressNotification) {
        showNotification({
            color: "red",
            title: "오류",
            message,
        });
    }
    if (typeof window !== "undefined" && !config.suppressAlert) {
        window.dispatchEvent(
            new CustomEvent("app-api-error", { detail: { message } }),
        );
    }
}

export async function executeCallStream(
    payload: ExecutePayload,
    handlers: ExecuteStreamHandlers = {},
    config: ApiFetchConfig = {},
    signal?: AbortSignal,
) {
    const { workspaceId, ...body } = payload;
    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/llm-calls`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream",
            },
            body: JSON.stringify(body),
            signal,
        });
    } catch (error) {
        handleStreamError(error, config);
        handlers.onError?.(error);
        throw error;
    }

    if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        let parsedMessage = "";
        if (contentType.includes("application/json")) {
            try {
                const bodyJson = (await response.json()) as { message?: string } | null;
                parsedMessage = bodyJson?.message?.trim() || "";
            } catch {
                parsedMessage = "";
            }
        }
        if (!parsedMessage) {
            const text = await response.text();
            const bodyJson = parseJsonSafe(text);
            parsedMessage =
                bodyJson?.message ||
                (contentType.includes("text/event-stream") ? extractMessageFromSse(text) : "") ||
                text?.trim() ||
                "";
        }
        const message =
            parsedMessage ||
            response.statusText ||
            "요청에 실패했습니다.";
        const error = new Error(message);
        (error as { status?: number }).status = response.status;
        handleStreamError(error, config);
        handlers.onError?.(error);
        throw error;
    }

    if (!response.body) {
        const error = new Error("응답 스트림을 열 수 없습니다.");
        handleStreamError(error, config);
        handlers.onError?.(error);
        throw error;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const emitEvent = (rawBlock: string) => {
        const block = rawBlock.replace(/\r\n/g, "\n").trim();
        if (!block) return;
        let eventName = "";
        const dataLines: string[] = [];
        for (const line of block.split("\n")) {
            if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trim());
            }
        }
        if (!dataLines.length && !eventName) {
            return;
        }
        const dataText = dataLines.join("\n");
        const parsed = dataText ? parseJsonSafe(dataText) : null;
        const eventPayload: LlmStreamEvent =
            parsed && typeof parsed === "object"
                ? parsed
                : { type: eventName || "message.delta", delta: dataText || undefined };
        if (!eventPayload.type && eventName) {
            eventPayload.type = eventName;
        }
        if (!eventPayload.type) {
            eventPayload.type = "message.delta";
        }
        handlers.onEvent?.(eventPayload);
    };

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let separatorIndex = buffer.indexOf("\n\n");
        while (separatorIndex !== -1) {
            const chunk = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + 2);
            emitEvent(chunk);
            separatorIndex = buffer.indexOf("\n\n");
        }
    }

    if (buffer.trim().length) {
        emitEvent(buffer);
    }

    handlers.onComplete?.();
}

export async function fetchLogs(
    workspaceId: string,
    filters: Record<string, unknown>,
    page = 0,
    size = 50,
) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    });
    params.set("page", String(page));
    params.set("size", String(size));

    const query = params.toString();
    const response = await apiFetch<PageResponse<CallLog>>(
        `/workspaces/${workspaceId}/llm-calls${query ? `?${query}` : ""}`,
    );
    return response.items;
}

export async function fetchLogsPage(
    workspaceId: string,
    filters: { modelId?: string; status?: string },
    page = 0,
    size = 50,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    if (filters.modelId) params.set("modelId", String(filters.modelId));
    if (filters.status) params.set("status", String(filters.status));
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);

    return apiFetch<PageResponse<CallLog>>(
        `/workspaces/${workspaceId}/llm-calls?${params.toString()}`,
        {},
        config,
    );
}

export async function fetchAllLogs(
    filters: { workspaceId?: string; modelId?: string; status?: string },
    page = 0,
    size = 50,
    sort?: string,
) {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.modelId) params.set("modelId", String(filters.modelId));
    if (filters.status) params.set("status", String(filters.status));
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);

    const response = await apiFetch<PageResponse<CallLog>>(`/llm-calls?${params.toString()}`);
    return response.items;
}

export async function fetchAllLogsPage(
    filters: { workspaceId?: string; modelId?: string; status?: string },
    page = 0,
    size = 50,
    sort?: string,
    config?: ApiFetchConfig,
) {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.modelId) params.set("modelId", String(filters.modelId));
    if (filters.status) params.set("status", String(filters.status));
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);
    return apiFetch<PageResponse<CallLog>>(`/llm-calls?${params.toString()}`, {}, config);
}

export async function fetchLog(callId: string) {
    return apiFetch<CallLogDetail>(`/llm-calls/${callId}`);
}
