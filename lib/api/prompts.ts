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

export type AdditionalInput = {
    position: number;
    role: "USER" | "ASSISTANT" | "SYSTEM" | "DEVELOPER";
    message: string;
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

export async function fetchPromptsPage(
    workspaceId: string,
    page = 0,
    size = 50,
    name?: string,
    sort?: string,
) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (name) params.set("name", name);
    if (sort) params.set("sort", sort);
    return apiFetch<PageResponse<Prompt>>(
        `/workspaces/${workspaceId}/prompts?${params.toString()}`,
    );
}

export async function fetchAllPrompts(
    filters: { workspaceId?: string; name?: string },
    page = 0,
    size = 50,
    sort?: string,
) {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.name) params.set("name", filters.name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);

    const response = await apiFetch<PageResponse<Prompt>>(`/prompts?${params.toString()}`);
    return response.items;
}

export async function fetchAllPromptsPage(
    filters: { workspaceId?: string; name?: string },
    page = 0,
    size = 50,
    sort?: string,
) {
    const params = new URLSearchParams();
    if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
    if (filters.name) params.set("name", filters.name);
    params.set("page", String(page));
    params.set("size", String(size));
    if (sort) params.set("sort", sort);
    return apiFetch<PageResponse<Prompt>>(`/prompts?${params.toString()}`);
}

export async function createPrompt(
    workspaceId: string,
    payload: {
        name: string;
        instructions: string;
        description?: string;
        mainRefName?: string;
        additionalInputs?: AdditionalInput[];
    },
) {
    const mainRefName = payload.mainRefName?.trim() || "main";
    const additionalInputs = payload.additionalInputs ?? [];
    return apiFetch<Prompt>(`/prompts`, {
        method: "POST",
        body: JSON.stringify({
            ...payload,
            workspaceId,
            mainRefName,
            additionalInputs,
        }),
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

export async function fetchSnapshots(promptId: string, page = 0, size = 50) {
    const response = await apiFetch<PageResponse<Snapshot>>(
        `/prompts/${promptId}/snapshots?page=${page}&size=${size}`,
    );
    return response.items;
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

export async function fetchRefs(promptId: string, page = 0, size = 50) {
    const response = await apiFetch<PageResponse<PromptRef>>(
        `/prompts/${promptId}/refs?page=${page}&size=${size}`,
    );
    return response.items;
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
