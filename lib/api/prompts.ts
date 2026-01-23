import { apiFetch, PageResponse } from "@/lib/api/client";

export type Prompt = {
    id: string;
    name: string;
    description?: string;
    workspaceId?: string;
    latestRefId?: number;
};

export type PromptDetail = Prompt;

export type Snapshot = {
    id: string;
    instructions: string;
    version?: number;
};

export type PromptRef = {
    id: number;
    promptId: string;
    name: string;
    type: "BRANCH" | "TAG";
    promptSnapshotId: string;
    description?: string;
};

export async function fetchPrompts(workspaceId: string, page = 0, size = 50) {
    const response = await apiFetch<PageResponse<Prompt>>(
        `/workspaces/${workspaceId}/prompts?page=${page}&size=${size}`,
    );
    return response.items;
}

export async function fetchAllPrompts(
    filters: { workspaceId?: string; name?: string },
    page = 0,
    size = 50,
) {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.name) params.set("name", filters.name);
    params.set("page", String(page));
    params.set("size", String(size));

    const response = await apiFetch<PageResponse<Prompt>>(`/prompts?${params.toString()}`);
    return response.items;
}

export async function createPrompt(
    workspaceId: string,
    payload: { name: string; instructions: string; description?: string; mainRefName?: string },
) {
    return apiFetch<Prompt>(`/prompts`, {
        method: "POST",
        body: JSON.stringify({ ...payload, workspaceId }),
    });
}

export async function fetchPrompt(promptId: string) {
    return apiFetch<PromptDetail>(`/prompts/${promptId}`);
}

export async function updatePrompt(
    promptId: string,
    payload: { name?: string; description?: string },
) {
    return apiFetch<PromptDetail>(`/prompts/${promptId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function deletePrompt(promptId: string) {
    return apiFetch<void>(`/prompts/${promptId}`, {
        method: "DELETE",
    });
}

export async function fetchSnapshots(promptId: string) {
    return apiFetch<Snapshot[]>(`/prompts/${promptId}/snapshots`);
}

export async function createSnapshot(
    promptId: string,
    payload: { instructions: string; additionalInputs?: unknown[] },
) {
    return apiFetch<Snapshot>(`/prompts/${promptId}/snapshots`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchRefs(promptId: string) {
    return apiFetch<PromptRef[]>(`/prompts/${promptId}/refs`);
}

export async function createRef(
    promptId: string,
    payload: { name: string; type: "BRANCH" | "TAG"; promptSnapshotId: string; description?: string },
) {
    return apiFetch<PromptRef>(`/prompts/${promptId}/refs`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function moveRef(
    promptId: string,
    refId: number,
    payload: { promptSnapshotId: string },
) {
    return apiFetch<PromptRef>(`/prompts/${promptId}/refs/${refId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}
