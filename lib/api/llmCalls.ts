import { apiFetch, PageResponse } from "@/lib/api/client";

export type ExecutePayload = {
    workspaceId: string;
    llmModelId: number | string;
    llmApiKeyId: string;
    promptSnapshotId?: string;
    promptRefId?: number | string;
    rawInstructionsText?: string;
    additionalUserInputText?: string;
    overrideOptionsJson?: string;
};

export type ExecuteResult = {
    llmCallLogId: string;
};

export type CallLog = {
    id: string;
    workspaceId?: string;
    llmModelId?: number;
    llmApiKeyId?: string;
    promptSnapshotId?: string;
    promptRefId?: number;
    elapsed?: number;
    status?: "SUCCESS" | "ERROR" | "TIMEOUT" | "CANCELLED";
    errorCode?: string;
    errorMessage?: string;
    llmCallOptions?: string;
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

export async function fetchLog(callId: string) {
    return apiFetch<CallLogDetail>(`/llm-calls/${callId}`);
}
