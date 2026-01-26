import { apiFetch, PageResponse } from "@/lib/api/client";

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

export type CallLog = {
    id: string;
    workspaceId?: string;
    llmModelId?: number;
    llmApiKeyId?: string;
    promptRefId?: number;
    elapsed?: number;
    status?: "SUCCESS" | "ERROR" | "TIMEOUT" | "CANCELLED";
    errorCode?: string;
    errorMessage?: string;
    llmCallOptions?: string;
    instructions?: string;
};

export type CallLogDetail = {
    callLog: CallLog;
    inputItems?: { id: number; position: number; renderedMessage: string }[];
    outputItems?: { id: number; position: number; outputText: string }[];
};

export async function executeCall(payload: ExecutePayload) {
    const { workspaceId, ...body } = payload;
    return apiFetch<ExecuteResult>(`/workspaces/${workspaceId}/llm-calls`, {
        method: "POST",
        body: JSON.stringify(body),
    });
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
) {
    const params = new URLSearchParams();
    if (filters.modelId) params.set("modelId", String(filters.modelId));
    if (filters.status) params.set("status", String(filters.status));
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);

    return apiFetch<PageResponse<CallLog>>(
        `/workspaces/${workspaceId}/llm-calls?${params.toString()}`,
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
) {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.modelId) params.set("modelId", String(filters.modelId));
    if (filters.status) params.set("status", String(filters.status));
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);
    return apiFetch<PageResponse<CallLog>>(`/llm-calls?${params.toString()}`);
}

export async function fetchLog(callId: string) {
    return apiFetch<CallLogDetail>(`/llm-calls/${callId}`);
}
